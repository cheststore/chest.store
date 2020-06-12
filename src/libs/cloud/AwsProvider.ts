import fs from 'fs'
import { ICloudFactoryOptions, ICloudObject, ICloudProvider } from './Providers'

const Aws = require('../Aws').default

export default function AwsProvider({
  apiKey,
  apiSecret,
  extra,
}: ICloudFactoryOptions): ICloudProvider {
  const aws = Aws({
    accessKeyId: apiKey,
    secretAccessKey: apiSecret,
    region: extra && extra.region,
  })

  return {
    async areValidCredentials(): Promise<boolean> {
      await aws.STS.getCallerIdentity()
      return true
    },

    async doesObjectExist(bucket: string, name: string): Promise<boolean> {
      return await aws.S3.doesFileExist({
        bucket,
        filename: name,
      })
    },

    async listObjectsRecursive(
      bucket: string,
      setCallback: (set: ICloudObject[]) => Promise<void>,
      nextPageToken?: string,
      prefix?: string
    ): Promise<void> {
      await aws.S3.listFilesRecursive(
        bucket,
        async (info: any[]) => {
          const cloudObjects: ICloudObject[] = info.map((obj: any) => {
            const splitKey: string[] = obj.Key.split('/')
            const name: string = splitKey[splitKey.length - 1]
            return {
              bucketUid: bucket,
              fullPath: obj.Key,
              name: name,
              lastModified: obj.LastModified,
              etag: obj.ETag,
              sizeBytes: obj.Size,
              storageClass: obj.StorageClass,
            }
          })
          await setCallback(cloudObjects)
        },
        nextPageToken,
        prefix
      )
    },

    async getObject(bucket: string, name: string) {
      const { Body } = await aws.S3.getFile({
        bucket,
        filename: name,
      })
      return Body
    },

    async getObjectInfo(bucket: string, name: string): Promise<ICloudObject> {
      const info: StringMap = await aws.S3.getFile({
        bucket,
        filename: name,
      })

      const owner: StringMap = info.Owner || {}
      return {
        bucketUid: bucket,
        fullPath: name,
        name: name,
        lastModified: info.LastModified,
        etag: info.ETag,
        sizeBytes: info.ContentLength,
        storageClass: info.StorageClass,
        ownerId: owner.ID,
        ownerDisplayName: owner.DisplayName,
      }
    },

    async pipeObjectStreamToWriteStream(
      stream: fs.WriteStream,
      bucket: string,
      name: string,
      backoffAttempt: number = 0
    ) {
      await aws.S3.getFileStreamWithBackoff(
        stream,
        {
          bucket,
          filename: name,
        },
        backoffAttempt
      )
    },

    async writeObject(
      bucket: string,
      name: string,
      data: Buffer | fs.ReadStream | string
    ) {
      return await aws.S3.writeFile({
        bucket,
        filename: name,
        data,
      })
    },

    async deleteObject(bucket: string, name: string): Promise<void> {
      return await aws.S3.deleteFile({
        bucket,
        filename: name,
      })
    },

    async mvObject(
      bucket: string,
      sourceObjPath: string,
      destinationObjPath: string
    ): Promise<void> {
      return await aws.S3.mvFile({
        bucket,
        sourceFilename: sourceObjPath,
        destinationFilename: destinationObjPath,
      })
    },

    async listBuckets() {
      return await aws.S3.listBuckets()
    },

    async createBucket(name: string) {
      return await aws.S3.createBucket(name)
    },

    // async createPresignedUrl(options: any) {
    //   return await aws.S3.createPresignedPost(options)
    // },
  }
}
