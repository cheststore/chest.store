import Providers from '../libs/cloud/Providers'
import Routes from '../libs/Routes'
import SessionHandler from '../libs/SessionHandler'
import AuditLog from '../libs/models/AuditLog'
import CloudBuckets from '../libs/models/CloudBuckets'
import CloudCredentials from '../libs/models/CloudCredentials'
import CloudObjects from '../libs/models/CloudObjects'
import config from '../config'

export default function ({ log, postgres, redis }) {
  return {
    priority: 0,
    verb: 'GET',
    route: '/file/download/*',
    handler: [
      Routes().requireAuthExpressMiddleware({ postgres, redis }),
      async function FileDownload(req, res) {
        const session = SessionHandler(req.session)
        const allBucketIds = session.getAllBucketIds()
        // const allCredIds = session.getAllCredentialIds()
        const userId = session.getLoggedInUserId()
        const objId = req.params[0]

        try {
          // Security step to prevent someone who has tried to
          // access files that don't exist too many times from
          // hitting this endpoint to try and access random
          // files. This is an attempt to prevent explit scripts
          // from getting inside and finding files.
          const rateLimit404Key = `file_s3_404_${userId}`
          const current404Count = await redis.get(rateLimit404Key)
          if (current404Count && current404Count > 5)
            return res.status(400).json({
              error: `You've tried accessing nonexistent files too many times. Please try again in 5 minutes.`,
            })

          const object = await CloudObjects(postgres).find(objId)
          const bucket = await CloudBuckets(postgres).find(object.bucket_id)
          if (!(bucket && allBucketIds.includes(bucket.id)))
            return res.status(401).json({ error: config.errors['401'] })

          const cred = await CloudCredentials(postgres).find(
            bucket.credential_id
          )
          const provider = Providers(bucket.type, {
            apiKey: cred.key,
            apiSecret: cred.secret,
            extra: cred.extra,
          })

          if (!object) {
            await redis.client
              .pipeline()
              .incr(rateLimit404Key)
              .expire(rateLimit404Key, 60 * 5)
              .exec()
            return res
              .status(404)
              .json({ error: `The requested object does not exist.` })
          }

          const exists = await provider.doesObjectExist(
            bucket.bucket_uid,
            object.full_path
          )
          if (!exists) {
            await redis.client
              .pipeline()
              .incr(rateLimit404Key)
              .expire(rateLimit404Key, 60 * 5)
              .exec()
            return res
              .status(404)
              .json({ error: `The requested object does not exist.` })
          }

          // TODO: Need to handle supporting clearing cache when
          // files are updated or versions added
          // res.set('Cache-Control', `public, max-age=86400`)

          if (true)
            // isAttachment)
            res.attachment(decodeURIComponent(object.full_path))

          await Promise.all([
            provider.pipeObjectStreamToWriteStream(
              res,
              bucket.bucket_uid,
              object.full_path.replace(/\/\//g, '/')
            ),
            AuditLog(postgres).log({
              credential_id: cred.id,
              user_id: userId,
              entity_table: 'cloud_objects',
              entity_id: object.id,
              action: `Download Object`,
              additional_info: { objectId: objId },
            }),
          ])
        } catch (err) {
          res.status(500).json(err.message)
          return log.error(err)
        }
      },
    ],
  }
}
