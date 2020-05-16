interface ICloudBucket {
  uid: string
  name: string
}

interface ICloudBuckets {
  [index: number]: ICloudBucket
}

interface ICloudObject {
  bucketUid: string
  fullPath: string
  name: string
  lastModified?: (Date | string)
  etag?: string
  sizeBytes?: number
  storageClass?: string
  sha256Contents?: string
  metadata?: object
}

interface ICloudObjects {
  [index: number]: ICloudObject
}

interface ICloudProvider {
  async areValidCredentials: () => Promise<boolean>
  async doesObjectExist: (bucket: string, name: string, options?: object) => Promise<boolean>
  async listObjectsRecursive: (bucket: string, setCallback: (set: Array<object>) => void, nextPageToken: any) => Promise<ICloudObjects>
  async getObject: (bucket: string, name: string, options?: object) => Promise<Buffer>
  async getObjectStreamWithBackoff: (stream: WritableStream, bucket: string, name: string, backoffAttempt?: number) => Promise<void>
  async writeObject: (bucket: string, name: string, data: (Buffer | ReadableStream | string), options?: object) => Promise<object>
  async listBuckets: () => Promise<ICloudBuckets>,
  async createBucket: (name: string) => Promise<any>
}

export interface IFactoryOptions {
  apiKey: string
  apiSecret: string
  region?: string
}

export interface ICloudProviderFactory {
  (options: IFactoryOptions): ICloudProvider
}