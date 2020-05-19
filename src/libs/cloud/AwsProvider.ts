import fs from 'fs'
import { IFactoryOptions, ICloudProvider } from './Providers'

const Aws = require('../Aws').default

export default function AwsProvider({
  apiKey,
  apiSecret,
  region,
}: IFactoryOptions): ICloudProvider {
  const aws = Aws({
    accessKeyId: apiKey,
    secretAccessKey: apiSecret,
    region,
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
      setCallback: (set: Array<object>) => void,
      nextPageToken: string
    ) {
      return await aws.S3.listFilesRecursive(bucket, setCallback, nextPageToken)
    },

    async getObject(bucket: string, name: string) {
      const { Body } = await aws.S3.getFile({
        bucket,
        filename: name,
      })
      return Body
    },

    async getObjectStreamWithBackoff(
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

    async listBuckets() {
      return await aws.S3.listBuckets()
    },

    async createBucket(name: string) {
      return await aws.S3.createBucket(name)
    },

    async createPresignedUrl(options: any) {
      return await aws.S3.createPresignedPost(options)
    },
  }
}
