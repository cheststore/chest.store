import fs from 'fs'
import http from 'http'
import path from 'path'
import session from 'express-session'
import ConnectRedis from 'connect-redis'
import bodyParser from 'body-parser'
import formidable from 'express-formidable'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import passport from 'passport'
import socketIo from 'socket.io'
import bunyan from 'bunyan'
import WebSocket from '../websocket/index'
import GitServer from './git/GitServer'
import PostgresClient from './PostgresClient'
import RedisHelper from './RedisHelper'
import SessionHandler from './SessionHandler'
import Routes from './Routes'
import PassportStrategies from '../passport'
import config from '../config'

const log = bunyan.createLogger(config.logger.options)
const app = express()
const httpServer = http.Server(app)
const io = socketIo(httpServer, { pingInterval: 4000, pingTimeout: 12000 })
const postgres = new PostgresClient()
const redis = new RedisHelper()

app.disable('x-powered-by')

export default function WebServer(/*portToListenOn=config.server.port, shouldListenOnPort=true*/) {
  return [
    httpServer,
    async function startServer() {
      try {
        const routeInst = Routes({ io, log, postgres, redis })
        const routes = await routeInst.get()
        const isActuallyProductionHost =
          config.server.isProduction &&
          config.server.host.indexOf('https') === 0

        //view engine setup
        app.set('views', path.join(config.app.rootDir, 'views'))
        app.set('view engine', 'pug')

        // redirect to https if production and connection is not secure
        app.use((req, res, next) => {
          if (isActuallyProductionHost && !req.secure)
            return res.redirect(`${config.server.host}${req.originalUrl}`)
          next()
        })

        app.use(compression())
        app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }))
        app.use(bodyParser.json({ limit: '100mb' }))
        app.use(cookieParser(config.session.sessionSecret))

        const RedisStore = ConnectRedis(session)

        let sessionMiddleware
        if (config.session.sessionSecret && config.session.sessionCookieKey) {
          let sessionConfig = {
            store: new RedisStore({ client: redis.client }),
            secret: config.session.sessionSecret,
            key: config.session.sessionCookieKey,
            resave: true,
            saveUninitialized: false,
            cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
          }

          if (isActuallyProductionHost) {
            app.set('trust proxy', 1)
            sessionConfig.cookie.secure = true
          }

          sessionMiddleware = session(sessionConfig)
          app.use(sessionMiddleware)
        }

        app.use(passport.initialize())
        app.use(passport.session())
        io.use((socket, next) =>
          sessionMiddleware
            ? sessionMiddleware(socket.request, socket.request.res, next)
            : next()
        )

        app.use(function initCacheControlAndPassIoToReq(req, res, next) {
          // initialize cache control to 0 (do not cache) and
          // we can override in specific routes as needed
          res.set('Cache-Control', `public, max-age=0`)
          req.cheststoreIo = io
          next()
        })

        // Custom API authentication handler
        app.use(routeInst.apiKeyMiddleware())

        app.use(function checkRedirectUrlAndFollow(req, res, next) {
          if (!(req.session.user && req.session.redirectUrl)) return next()

          const redirectTo = req.session.redirectUrl
          delete req.session.redirectUrl

          req.session.save((err) => {
            if (err) return next(err)
            res.redirect(redirectTo)
          })
        })

        // git server
        const gitServer = GitServer({ log, postgres, redis })
        let userGitServers = {}
        app.use('/git/:username', async function gitRoute(...args) {
          try {
            const [req] = args
            const username = req.params.username
            userGitServers[username] =
              userGitServers[username] || (await gitServer.create(username))
            userGitServers[username].handle(...args)
          } catch (err) {
            const [_, res] = args
            res.status(401).send(err.message)
          }
        })

        //static files
        app.use(
          '/public',
          express.static(path.join(config.app.rootDir, '/public'))
        )

        const formidableMiddleware = formidable({ multiples: true })

        //setup route handlers in the express app
        routes.forEach((route) => {
          try {
            const mainRouteHandler =
              route.handler instanceof Array ? route.handler : [route.handler]
            const handlerArgs = route.formidable
              ? [formidableMiddleware, ...mainRouteHandler]
              : [...mainRouteHandler]
            app[route.verb.toLowerCase()](route.path, ...handlerArgs)
            log.debug(
              `Successfully bound route to express; method: ${route.verb}; path: ${route.path}`
            )
          } catch (err) {
            log.error(
              err,
              `Error binding route to express; method: ${route.verb}; path: ${route.path}`
            )
          }
        })

        //passport setup
        const strategies = PassportStrategies({ log, postgres, redis })
        Object.values(strategies).forEach((strategy) => {
          try {
            // If bindCondition exists, make sure it's truthy before
            // proceeding in case there isn't something required to
            // bind the strategy
            if (
              typeof strategy.bindCondition !== 'function' ||
              strategy.bindCondition()
            ) {
              const stratName = strategy.name

              if (strategy.options)
                return passport.use(
                  stratName,
                  new strategy.strategy(strategy.options, strategy.handler)
                )
              return passport.use(
                stratName,
                new strategy.strategy(strategy.handler)
              )
            }
          } catch (err) {
            log.error(`Error binding passport strategy: ${strategy.name}`, err)
          }
        })

        passport.serializeUser((user, done) => done(null, user))
        passport.deserializeUser((user, done) => done(null, user))

        io.use((socket, next) => {
          const req = socket.request
          const session = SessionHandler(req.session, { redis })
          const userId = session.getLoggedInUserId()
          if (!userId) return next(new Error(config.errors['401']))
          next()
        })

        WebSocket({ io, log, postgres, redis })

        // Express error handling
        app.use(function ExpressErrorHandler(err, req, res, next) {
          log.error('Express error handling', err)

          const contType = req.headers['content-type']
          const userAgent = req.headers['user-agent']
          if (
            (contType && contType === 'application/json') ||
            userAgent === 'chest.store-cli'
          )
            return res.status(500).json({
              error: `There was an error that we're looking into now. Thanks for your patience.`,
            })

          res.redirect(err.redirectRoute || '/')
        })

        // Assume we'll listen in the primary app file via `sticky-cluster` module
        // if (shouldListenOnPort)
        //   httpServer.listen(portToListenOn, () => log.info(`listening on *: ${portToListenOn}`))
      } catch (err) {
        log.error('Error starting server', err)
        process.exit()
      } finally {
        //handle if the process suddenly stops
        process.on('SIGINT', () => {
          console.log('got SIGINT....')
          process.exit()
        })
        process.on('SIGTERM', () => {
          console.log('got SIGTERM....')
          process.exit()
        })

        return app
      }
    },
  ]
}
