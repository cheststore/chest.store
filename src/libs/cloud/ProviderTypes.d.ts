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
  async areValidCredentials: () => boolean
  async doesObjectExist: (bucket: string, name: string, options?: object) => boolean
  async listObjectsRecursive: (bucket: string, setCallback: (set: Array<object>) => void, nextPageToken: any) => ICloudObjects
  async getObject: (bucket: string, name: string, options?: object) => Buffer
  async getObjectStreamWithBackoff: (stream: WritableStream, bucket: string, name: string, backoffAttempt?: number) => void
  async writeObject: (bucket: string, name: string, data: (Buffer | ReadableStream | string), options?: object) => object
  async listBuckets: () => ICloudBuckets,
  async createBucket: (name: string) => any
}

export interface IFactoryOptions {
  apiKey: string
  apiSecret: string
  region?: string
}

export interface ICloudProviderFactory {
  (options: IFactoryOptions): ICloudProvider
}