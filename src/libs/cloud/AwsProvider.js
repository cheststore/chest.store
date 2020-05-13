import Aws from '../Aws'

export default function AwsProvider({
  apiKey,
  apiSecret,
  region
}) {
  const aws = Aws({
    accessKeyId: apiKey,
    secretAccessKey: apiSecret,
    region
  })

  return {
    async areValidCredentials() {
      await aws.STS.getCallerIdentity()
      return true
    },

    async doesObjectExist(bucket, name) {
      return await aws.S3.doesFileExist({
        bucket,
        filename: name
      })
    },

    async listObjectsRecursive(bucket, setCallback, nextPageToken=null) {
      return await aws.S3.listFilesRecursive(
        bucket,
        setCallback,
        nextPageToken)
    },

    async getObject(bucket, name) {
      const { Body } = await aws.S3.getFile({
        bucket,
        filename: name
      })
      return Body
    },

    async getObjectStreamWithBackoff(stream, bucket, name, backoffAttempt=0) {
      await aws.S3.getFileStreamWithBackoff(stream, {
        bucket,
        filename: name
      }, backoffAttempt)
    },

    async writeObject(bucket, name, data) {
      return await aws.S3.writeFile({
        bucket,
        filename: name,
        data
      })
    },

    async listBuckets() {
      return await aws.S3.listBuckets()
    },

    async createBucket(name) {
      return await aws.S3.createBucket(name)
    }
  }
}