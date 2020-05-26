import fs from 'fs'
import path from 'path'
import GitHelpers from '../libs/git/GitHelpers'
import Providers from '../libs/cloud/Providers'
import AuditLog from '../libs/models/AuditLog'
import CloudBuckets from '../libs/models/CloudBuckets'
import CloudDirectories from '../libs/models/CloudDirectories'
import CloudObjects from '../libs/models/CloudObjects'

const BackgroundWorker = require('../libs/BackgroundWorker').default
const Routes = require('../libs/Routes').default
const SessionHandler = require('../libs/SessionHandler').default

export default function ({ log, postgres, redis }: IFactoryOptions): StringMap {
  return {
    formidable: true, // support file uploads
    priority: 0,
    verb: 'POST',
    route: '/object/upload',
    handler: [
      Routes().requireAuthExpressMiddleware({ postgres, redis }),
      async function ObjectUpload(req: any, res: any): Promise<void> {
        const helpers = GitHelpers({ log, postgres, redis })
        const objects = CloudObjects(postgres)
        const session = SessionHandler(req.session)
        const allBucketIds = session.getAllBucketIds()
        const bucket = session.getLoggedInBucketId(true)
        const cred = session.getLoggedInCredentialId(true)
        const user = session.getLoggedInUserId(true)
        const { dir, objectId } = req.query

        try {
          const provider = Providers(cred.type, {
            apiKey: cred.key,
            apiSecret: cred.secret,
            extra: cred.extra,
          })
          const files = Object.values(req.files)
          const cleanedDir = (dir || '')
            .split('/')
            .filter((part: string) => !!part)
            .join('/')

          const objectIds = await Promise.all(
            files.map(
              async (file: any): Promise<StringMap> => {
                const finalFilePath: string = `${cleanedDir}/${file.name}`.replace(
                  /\/\//g,
                  '/'
                )

                // if this is a new version of an existing object,
                // handle cleaning up the current version and adding this
                // object as new version. All history of previous versions
                // are stored in git history
                if (files.length === 1 && objectId) {
                  const object = await objects.findBy({
                    bucket_id: allBucketIds,
                    id: objectId,
                  })
                  if (object) {
                    objects.setRecord({ id: object.id, is_deleted: true })
                    const objBucket = await CloudBuckets(postgres).find(
                      object.bucket_id
                    )
                    const destObjFullPath: string = path.join(
                      path.dirname(object.full_path),
                      file.name
                    )
                    await Promise.all([
                      provider.mvObject(
                        (objBucket as StringMap).bucket_uid,
                        object.full_path,
                        destObjFullPath
                      ),
                      objects.save(),
                    ])
                  }
                }

                const newObjAry: StringMap[] = await CloudDirectories(
                  postgres
                ).createDirsAndObjectFromFullPath(
                  bucket.id,
                  finalFilePath,
                  objectId
                )

                const objId = newObjAry[newObjAry.length - 1].id
                await Promise.all([
                  helpers.addObjectVersion(
                    user.username,
                    objId,
                    fs.createReadStream(file.path)
                  ),

                  AuditLog(postgres).log({
                    credential_id: cred.id,
                    user_id: user.id,
                    entity_table: 'cloud_objects',
                    entity_id: objId,
                    action: `Upload Object`,
                    additional_info: { objectId: objId },
                  }),
                ])

                // NOTE: make sure we push the object to the provider last
                // so that all version history among other things have
                // completed and we don't override existing object(s)
                // before we log and store all history information first.
                await provider.writeObject(
                  bucket.bucket_uid,
                  finalFilePath,
                  fs.createReadStream(file.path)
                )

                await BackgroundWorker({ redis }).enqueue(
                  'providerSyncObjects',
                  {
                    bucketId: bucket.id,
                    credentialId: cred.id,
                    userId: user.id,
                    objectId: objId,
                  }
                )

                return objId
              }
            )
          )

          res.json({ objectIds })
        } catch (err) {
          res.status(500).json(err.message)
          log.error(err)
        }
      },
    ],
  }
}
