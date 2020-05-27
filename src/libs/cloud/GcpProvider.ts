import fs from 'fs'
import {
  File,
  Storage,
  StorageOptions,
  GetFilesResponse,
  GetFileOptions,
  GetFileResponse,
} from '@google-cloud/storage'
import { ICloudFactoryOptions, ICloudObject, ICloudProvider } from './Providers'

export default function GcpProvider({
  apiKey,
  apiSecret,
  extra,
}: ICloudFactoryOptions): ICloudProvider {
  const options: StorageOptions = {
    projectId: extra && extra.project_id,
    credentials: {
      client_email: apiKey,
      private_key: apiSecret,
    },
  }

  // https://googleapis.dev/nodejs/storage/latest/Storage.html
  const storage = new Storage(options)

  return {
    async areValidCredentials(): Promise<boolean> {
      await storage.getServiceAccount()
      return true
    },

    async doesObjectExist(bucket: string, name: string): Promise<boolean> {
      const [exists] = await storage.bucket(bucket).file(name).exists()
      return exists
    },

    async listObjectsRecursive(
      bucket: string,
      setCallback: (set: ICloudObject[]) => Promise<void>,
      nextPageToken?: GetFileOptions | undefined
    ): Promise<void> {
      const bucketInst = storage.bucket(bucket)
      const [files, nextQuery]: GetFilesResponse = await bucketInst.getFiles(
        nextPageToken
      )

      const cloudObjects: ICloudObject[] = files.map((obj: File) => {
        // const md = obj.metadata
        return {
          bucketUid: bucket,
          fullPath: obj.name,
          name: obj.name,
          lastModified: obj.metadata.updated,
          etag: obj.metadata.etag,
          sizeBytes: obj.metadata.size,
          storageClass: obj.metadata.storageClass,
        }
      })
      await setCallback(cloudObjects)
      if (nextQuery)
        await this.listObjectsRecursive(bucket, setCallback, nextQuery)
    },

    async getObject(bucket: string, name: string) {
      const fileInfo = await storage.bucket(bucket).file(name).download()
      return fileInfo[0]
    },

    async getObjectInfo(bucket: string, name: string): Promise<ICloudObject> {
      const [obj]: GetFileResponse = await storage
        .bucket(bucket)
        .file(name)
        .get()
      return {
        bucketUid: bucket,
        fullPath: obj.name,
        name: obj.name,
        lastModified: obj.metadata.updated,
        etag: obj.metadata.etag,
        sizeBytes: obj.metadata.size,
        storageClass: obj.metadata.storageClass,
      }
    },

    async getObjectStreamWithBackoff(
      stream: fs.WriteStream,
      bucket: string,
      name: string
    ) {
      return await new Promise((resolve, reject) => {
        const readStream = storage.bucket(bucket).file(name).createReadStream()
        readStream.on('error', reject).on('end', resolve).pipe(stream)
      })
    },

    async writeObject(
      bucket: string,
      name: string,
      data: Buffer | fs.ReadStream | string
    ) {
      return await new Promise(async (resolve, reject) => {
        try {
          const file = storage.bucket(bucket).file(name)
          if (data instanceof fs.ReadStream) {
            const writeStream = file.createWriteStream()
            return data.on('error', reject).on('end', resolve).pipe(writeStream)
          }

          await file.save(data)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    },

    async deleteObject(bucket: string, name: string): Promise<void> {
      const file = storage.bucket(bucket).file(name)
      await file.delete()
    },

    async mvObject(
      bucket: string,
      sourceObjPath: string,
      destinationObjPath: string
    ): Promise<void> {
      const file = storage.bucket(bucket).file(sourceObjPath)
      await file.move(destinationObjPath)
    },

    async listBuckets() {
      return await storage.getBuckets()
    },

    async createBucket(name: string) {
      return await storage.createBucket(name)
    },
  }
}
