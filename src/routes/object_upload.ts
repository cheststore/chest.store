import fs from 'fs'
import Providers from '../libs/cloud/Providers'

const BackgroundWorker = require('../libs/BackgroundWorker').default
const SessionHandler = require('../libs/SessionHandler').default
const AuditLog = require('../libs/models/AuditLog').default
const CloudObjects = require('../libs/models/CloudObjects').default

export default function({ log, postgres, redis }: any) {
  return {
    formidable: true, // support file uploads
    priority: 0,
    verb: 'POST',
    route: '/object/upload',
    handler: async function ObjectUpload(req: any, res: any) {
      const session = SessionHandler(req.session)
      const bucket  = session.getLoggedInBucketId(true)
      const cred    = session.getLoggedInCredentialId(true)
      const userId  = session.getLoggedInUserId()

      try {
        const provider = Providers(cred.type, { apiKey: cred.key, apiSecret: cred.secret })
        const files = Object.values(req.files)
        const dir = (req.query.dir || '').split('/').filter((part: string) => !!part).join('/')

        const objects = await Promise.all(
          files.map(async (file: any) => {
            const [ obj ] = await Promise.all([
              CloudObjects(postgres).findOrCreateBy({
                bucket_id: bucket.id,
                full_path: `${dir}${file.name}`
              }),

              provider.writeObject(
                bucket.bucket_uid,
                `${dir}${file.name}`,
                fs.createReadStream(file.path))
            ])
            
            await Promise.all([
              BackgroundWorker({ redis }).enqueue('awsSyncObjects', {
                bucketId: bucket.id,
                credentialId: cred.id,
                userId: userId,
                objectId: obj.id
              }),

              AuditLog(postgres).log({
                credential_id: cred.id,
                user_id: userId,
                entity_table: 'cloud_objects',
                entity_id: obj.id,
                action: `Upload Object`,
                additional_info: { objectId: obj.id }
              })
            ])
            return obj
          })
        )

        res.json({ objects })

      } catch (err) {
        res.status(500).json(err.message)
        return log.error(err)
      }
    }
  }
}