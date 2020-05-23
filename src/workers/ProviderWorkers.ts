import Providers, { ICloudObject } from '../libs/cloud/Providers'
import CloudBuckets from '../libs/models/CloudBuckets'
import CloudCredentials from '../libs/models/CloudCredentials'
import CloudDirectories from '../libs/models/CloudDirectories'
import CloudObjects from '../libs/models/CloudObjects'
// import config from '../config'

const BackgroundWorker = require('../libs/BackgroundWorker').default
// import BackgroundWorker from '../libs/BackgroundWorker'

export default function ProviderWorkers({
  log,
  postgres,
  redis,
}: IFactoryOptions) {
  return {
    providerSyncObjects: {
      plugins: ['Retry'],
      pluginOptions: {
        retry: {
          retryLimit: 5,
          retryDelay: 1000 * 5,
        },
      },
      perform: async (options: StringMap) => {
        const { bucketId, credentialId, userId, objectId } = options

        const objectInst = CloudObjects(postgres)

        const [bucket, credential, objectInfo] = await Promise.all([
          CloudBuckets(postgres).find(bucketId),
          CloudCredentials(postgres).find(credentialId),
          (async function getObjects() {
            if (objectId) {
              return await Promise.all([
                objectInst.findBy({ bucket_id: bucketId, id: objectId }),
                objectInst.getHistoryObject(objectId),
              ])
            }
            return []
          })(),
        ])

        const [
          object,
          objectHistoryObj,
        ]: StringMap[] = objectInfo as StringMap[]

        const providers = Providers((credential as StringMap).type, {
          apiKey: (credential as StringMap).key,
          apiSecret: (credential as StringMap).secret,
        })

        const processObjects = async function processObjects(
          objects: ICloudObject[]
        ) {
          for (let i = 0; i < objects.length; i++) {
            const obj = objects[i]
            const directories = CloudDirectories(postgres)
            const info = await directories.createDirsAndObjectFromFullPath(
              bucketId,
              obj.fullPath
            )
            // const objInst = CloudObjects(postgres)
            // await objInst.findOrCreateBy({ bucket_id: bucketId, full_path: obj.fullPath })

            const objInst = CloudObjects(postgres)
            objInst.setRecord({
              id: info[info.length - 1].id,
              last_modified: obj.lastModified,
              etag: obj.etag,
              size_bytes: obj.sizeBytes,
              storage_class: obj.storageClass,
              owner_id: obj.ownerId,
              owner_display_name: obj.ownerDisplayName,
              // 'sha256_contents?',
            })
            await objInst.save()
          }
        }

        if (object) {
          const obj: ICloudObject = await providers.getObjectInfo(
            (bucket as StringMap).bucket_uid,
            object.full_path
          )
          await processObjects([obj])

          if (objectHistoryObj) {
            await BackgroundWorker({ redis }).enqueue('providerSyncObjects', {
              ...options,
              objectId: objectHistoryObj.id,
            })
          }
        } else {
          await providers.listObjectsRecursive(
            (bucket as StringMap).bucket_uid,
            processObjects
          )
        }

        log.info(
          `Successfully processed all objects for bucket ${
            (bucket as StringMap).type
          } - ${(bucket as StringMap).bucket_uid}`
        )
      },
    },
  }
}
