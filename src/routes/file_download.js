import Aws from '../libs/Aws'
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

        const s3 = Aws({
          accessKeyId: cred.key,
          secretAccessKey: cred.secret
        }).S3

        const object = await CloudObjects(postgres).findBy({ bucket_id: bucket.id, id: objId })
        if (!object) {
          await redis.client.pipeline().incr(rateLimit404Key).expire(rateLimit404Key, 60 * 5).exec()
          return res.status(404).json({ error: `The requested object does not exist.` })
        }

        const s3Options = { bucket: bucket.bucket_uid, filename: object.full_path }
        const exists = await s3.doesFileExist(s3Options)
        if (!exists) {
          await redis.client.pipeline().incr(rateLimit404Key).expire(rateLimit404Key, 60 * 5).exec()
          return res.status(404).json({ error: `The requested object does not exist.` })
        }

        res.set('Cache-Control', `public, max-age=86400`)

        if (true) // isAttachment)
          res.attachment(decodeURIComponent(object.full_path))

        await Promise.all([
          s3.getFileStreamWithBackoff(res, s3Options),
          AuditLog(postgres).log({
            credential_id: cred.id,
            user_id: userId,
            action: `Download Object`,
            additional_info: objId
          })
        ])

      } catch (err) {
        res.status(500).json(err.message)
        return log.error(err)
      }
    }
  }
}