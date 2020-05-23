import fs from 'fs'
import path from 'path'
import util from 'util'
import LoginHandler from '../libs/LoginHandler'
import SessionHandler from '../libs/SessionHandler'
import UserApiKeys from '../libs/models/UserApiKeys'
import Users from '../libs/models/Users'
import config from '../config'

const readDir = util.promisify(fs.readdir)

export default function Routes(options) {
  return {
    _path: path.join(__dirname, '..', 'routes'),

    async get() {
      const files = await readDir(this._path)
      const routeFiles = files
        .filter((file) => fs.lstatSync(path.join(this._path, file)).isFile())
        .filter((file) => /\.js$/.test(file))
        .filter((file) => !/\.spec\.js$/.test(file))
      const routes = routeFiles.map((file) => {
        const routeInfo = require(path.join(this._path, file)).default(options)
        return {
          ...routeInfo,
          path: routeInfo.route,
          order: routeInfo.priority,
          file,
        }
      })

      return routes.sort((r1, r2) => r1.order - r2.order)
    },

    apiKeyMiddleware() {
      return function (req, res, next) {
        try {
          let code = req.headers[config.apiKeyHeader]
          if (!code) {
            if (req.method.toLowerCase() === 'post') {
              code =
                req.body[config.apiKeyHeader] || req.query[config.apiKeyHeader]
            } else {
              code =
                req.query[config.apiKeyHeader] || req.body[config.apiKeyHeader]
            }
          }
          req.cheststoreAuth = code
          next()
        } catch (err) {
          next(err)
        }
      }
    },

    requireAuthExpressMiddleware({ postgres, redis }) {
      return async function requireAuthExpressMiddleware(req, res, next) {
        try {
          const users = Users(postgres, req.session)
          const login = LoginHandler(postgres, req)
          const session = SessionHandler(req.session, { redis })
          const currentPath = req.path
          if (isRouteNotNeedingAuth(currentPath)) return next()

          if (users.isLoggedIn()) return next()

          // Synthetically authenticate into a team based on the
          // API key provided
          const apiKeyProvided = req.cheststoreAuth
          if (!!apiKeyProvided) {
            const apiKeys = UserApiKeys(postgres)
            const userApiKey = await apiKeys.findBy({ key: apiKeyProvided })

            // If we don't find they key, send 401
            if (!userApiKey)
              return res
                .status(401)
                .json({ error: 'Invalid authentication information.' })

            const userRecord = await users.find(userApiKey.user_id)
            if (userRecord) {
              await login.standardLogin(userRecord)

              // clean up ephemeral session after the server has responded
              res.on('finish', async () => {
                await Users(postgres, req.session).logout()
              })
            }

            return next()
          }

          // If we got here then the user is not logged in nor
          // did she provide an API key.
          // const isApiReq = req.headers['x-cheststore-fetch']
          // if (isApiReq)
          //   return res
          //     .status(401)
          //     .json({ error: 'Invalid authentication information.' })

          // await session.setSession({ redirectUrl: req.originalUrl })
          // return res.redirect('/')
          res.status(401).json({ error: 'Invalid authentication information.' })
        } catch (err) {
          next(err)
        }
      }
    },
  }
}

function isRouteNotNeedingAuth(currentRoute) {
  const whitelist = routesNotNeedingAuth()
  for (let i = 0; i < whitelist.length; i++) {
    const testRoute = whitelist[i]
    if (new RegExp(`^${testRoute}$`).test(currentRoute)) return true
  }
  return false
}

function routesNotNeedingAuth() {
  return [
    '/api/1.0/auth/create/user',
    '/api/1.0/auth/password/forgot',
    '/api/1.0/auth/password/reset',
    '/api/1.0/auth/session',
    '/api/1.0/providers/types',
  ]
}
