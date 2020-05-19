import SessionHandler from '../../../../libs/SessionHandler'
import AuditLog from '../../../../libs/models/AuditLog'
import CloudDirectories from '../../../../libs/models/CloudDirectories'
import CloudObjects from '../../../../libs/models/CloudObjects'
import Providers from '../../../../libs/cloud/Providers'
import config from '../../../../config'

export default function ({ log, postgres }) {
  return {
    async ['list'](req, res) {
      const session = SessionHandler(req.session)
      const dir = CloudDirectories(postgres)
      const objects = CloudObjects(postgres)
      const buckId = session.getLoggedInBucketId()
      const { directoryId, page, perPage } = req.query

      const [info, directory, directories] = await Promise.all([
        objects.getObjectsInBucket(buckId, directoryId, page, perPage),
        (async function getDir() {
          if (directoryId)
            return await dir.findBy({ bucket_id: buckId, id: directoryId })
        })(),
        dir.getDirectChildren(buckId, directoryId),
      ])

      res.json({
        objectInfo: info,
        directory,
        directories,
      })
    },

    async ['get'](req, res) {
      const session = SessionHandler(req.session)
      const objects = CloudObjects(postgres)
      const buckId = session.getLoggedInBucketId()
      const objId = req.query.id

      const object = await objects.findBy({ bucket_id: buckId, id: objId })
      res.json({ object })
    },

    async ['delete'](req, res) {
      const session = SessionHandler(req.session)
      const objects = CloudObjects(postgres)
      const bucket = session.getLoggedInBucketId(true)
      const cred = session.getLoggedInCredentialId(true)
      const userId = session.getLoggedInUserId()
      const objId = req.query.id

      const object = await objects.findBy({ bucket_id: bucket.id, id: objId })
      if (!object)
        return res
          .status(404)
          .json({ error: `We didn't find the object you want to delete.` })

      const providers = Providers(bucket.type, {
        apiKey: cred.key,
        apiSecret: cred.secret,
      })
      objects.setRecord({ id: objId, is_deleted: true })

      try {
        await providers.deleteObject(bucket.bucket_uid, object.full_path)
      } catch (err) {
        log.error(`Error deleting object`, err)
        res
          .status(err.statusCode)
          .json({ error: `${err.code} - ${err.message}` })
      }

      await Promise.all([
        objects.save(),
        AuditLog(postgres).log({
          credential_id: cred.id,
          user_id: userId,
          entity_table: 'cloud_objects',
          entity_id: objId,
          action: `Objects - Delete Object`,
          additional_info: req.body,
        }),
      ])

      res.json(true)
    },
  }
}
