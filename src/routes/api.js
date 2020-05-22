import Routes from '../libs/Routes'
import Api from './api/index.js'

export default function (options) {
  return {
    priority: 0,
    verb: 'ALL',
    route: '/api/:version/:namespace/*',
    handler: [
      Routes().requireAuthExpressMiddleware(options),
      async function ApiRoute(...args) {
        const [req, _, next] = args
        try {
          const version = req.params.version
          const namespace = req.params.namespace
          const path = req.params[0]

          const namespacedRoutes = Api[version][namespace](options)
          return await namespacedRoutes[path](...args)
        } catch (err) {
          next(err)
        }
      },
    ],
  }
}
