import Providers from '../libs/cloud/Providers'
import SessionHandler from '../libs/SessionHandler'
import AuditLog from '../libs/models/AuditLog'
import CloudObjects from '../libs/models/CloudObjects'

export default function({ log, postgres, redis }) {
  return {
    priority: 0,
    verb: 'GET',
    route: '/file/download/*',
    handler: async function FileDownload(req, res) {
      const session = SessionHandler(req.session)
      const bucket  = session.getLoggedInBucketId(true)
      const cred    = session.getLoggedInCredentialId(true)
      const userId  = session.getLoggedInUserId()
      const objId   = req.params[0]

      try {
        // Security step to prevent someone who has tried to
        // access files that don't exist too many times from
        // hitting this endpoint to try and access random
        // files. This is an attempt to prevent explit scripts
        // from getting inside and finding files.
        const rateLimit404Key  = `file_s3_404_${userId}`
        const current404Count = await redis.get(rateLimit404Key)
        if (current404Count && current404Count > 5)
          return res.status(400).json({ error: `You've tried accessing nonexistent files too many times. Please try again in 5 minutes.` })

        const provider = Providers(bucket.type, {
          apiKey: cred.key,
          apiSecret: cred.secret
        })

        const object = await CloudObjects(postgres).findBy({ bucket_id: bucket.id, id: objId })
        if (!object) {
          await redis.client.pipeline().incr(rateLimit404Key).expire(rateLimit404Key, 60 * 5).exec()
          return res.status(404).json({ error: `The requested object does not exist.` })
        }

        const exists = await provider.doesObjectExist(bucket.bucket_uid, object.full_path)
        if (!exists) {
          await redis.client.pipeline().incr(rateLimit404Key).expire(rateLimit404Key, 60 * 5).exec()
          return res.status(404).json({ error: `The requested object does not exist.` })
        }

        res.set('Cache-Control', `public, max-age=86400`)

        if (true) // isAttachment)
          res.attachment(decodeURIComponent(object.full_path))

        await Promise.all([
          provider.getObjectStreamWithBackoff(res, bucket.bucket_uid, object.full_path),
          AuditLog(postgres).log({
            credential_id: cred.id,
            user_id: userId,
            entity_table: 'cloud_objects',
            entity_id: object.id,
            action: `Download Object`,
            additional_info: { objectId: objId }
          })
        ])

      } catch (err) {
        res.status(500).json(err.message)
        return log.error(err)
      }
    }
  }
}