// import SessionHandler from '../../../../libs/SessionHandler'
import config from '../../../../config'

// import ObjectsRoute from '../objects'
const ObjectsRoute = require('../objects').default

export default function ({
  io,
  log,
  postgres,
  redis,
}: IRequestOptions): StringMap {
  return {
    async ['socket/update/clients'](req: any, res: any): Promise<void> {
      log.debug(`socket/update/clients hit`, req.cheststoreAuth)

      if (req.cheststoreAuth !== config.app.masterKey)
        return res.status(403).json({ error: config.errors['403'] })

      const {
        bucketId, // specified the bucket room we're updating
        type, // what mutation should we update these users with
      } = req.body

      let data
      switch (type) {
        case type: {
          await ObjectsRoute({ io, log, postgres, redis }).list(
            {
              ...req,
              session: {
                current_bucket: { id: bucketId },
              },
            },
            {
              status() {
                return this
              },
              json(info: StringMap) {
                data = info
              },
            }
          )
          break
        }
      }

      log.debug(`socket/update/clients data sending`, bucketId, data)
      io.to(`bucket_${bucketId}`).emit('getObjectsList')
      res.json(true)
    },
  }
}
