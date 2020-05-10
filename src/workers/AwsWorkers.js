import Aws from '../libs/Aws'
import CloudBuckets from '../libs/models/CloudBuckets'
import CloudCredentials from '../libs/models/CloudCredentials'
import CloudObjects from '../libs/models/CloudObjects'
import config from '../config'

export default function AwsWorkers({ log, postgres }) {
  return {
    awsSyncObjects: {
      plugins: [ 'Retry' ],
      pluginOptions: {
        retry: {
          retryLimit: 5,
          retryDelay: 1000 * 5,
        }
      },
      perform: async options => {
        const { bucketId, credentialId/*, userId */ } = options
        const [ bucket, credential ] = await Promise.all([
          CloudBuckets(postgres).find(bucketId),
          CloudCredentials(postgres).find(credentialId)
        ])

        const s3 = Aws({
          accessKeyId: credential.key,
          secretAccessKey: credential.secret
        }).S3

        await s3.listFilesRecursive(bucket.bucket_uid, async objects => {
          await Promise.all(
            objects.map(async obj => {
              const objInst = CloudObjects(postgres)
              await objInst.findOrCreateBy({ bucket_id: bucketId, full_path: obj.Key })

              const splitKey = obj.Key.split('/')
              const owner = obj.Owner || {}

              objInst.setRecord({
                name: splitKey[splitKey.length - 1],
                last_modified: obj.LastModified,
                etag: obj.ETag,
                size_bytes: obj.Size,
                storage_class: obj.StorageClass,
                owner_id: owner.ID,
                owner_display_name: owner.DisplayName,
                // 'sha256_contents',
              })
              await objInst.save()
            })
          )
        })

        log.info(`Successfully processed all objects for bucket ${bucket.type} - ${bucket.bucket_uid}`)
      }
    }
  }
}
