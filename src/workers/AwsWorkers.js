import Aws from '../libs/Aws'
import CloudBuckets from '../libs/models/CloudBuckets'
import CloudCredentials from '../libs/models/CloudCredentials'
import CloudDirectories from '../libs/models/CloudDirectories'
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
          for (let i = 0; i < objects.length; i++) {
            const obj = objects[i]
            const directories = CloudDirectories(postgres)
            const info = await directories.createDirsAndObjectFromFullPath(bucketId, obj.Key)
            // const objInst = CloudObjects(postgres)
            // await objInst.findOrCreateBy({ bucket_id: bucketId, full_path: obj.Key })

            const owner = obj.Owner || {}

            const objInst = CloudObjects(postgres)
            objInst.setRecord({
              id: info[info.length - 1].id,
              last_modified: obj.LastModified,
              etag: obj.ETag,
              size_bytes: obj.Size,
              storage_class: obj.StorageClass,
              owner_id: owner.ID,
              owner_display_name: owner.DisplayName,
              // 'sha256_contents',
            })
            await objInst.save()
          }
        })

        log.info(`Successfully processed all objects for bucket ${bucket.type} - ${bucket.bucket_uid}`)
      }
    }
  }
}
