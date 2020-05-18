import fs from 'fs'
import AwsProvider from './AwsProvider'

export default function Providers(
  type: string,
  options: IFactoryOptions
): ICloudProvider {
  switch (type.toLowerCase()) {
    case 'aws':
      return AwsProvider(options)
    default:
      throw new Error(`Invalid provider type.`)
  }
}

export interface ICloudBucket {
  uid: string
  name: string
}

interface ICloudObject {
  bucketUid: string
  fullPath: string
  name: string
  lastModified?: Date | string
  etag?: string
  sizeBytes?: number
  storageClass?: string
  sha256Contents?: string
  metadata?: object
}

export interface ICloudProvider {
  areValidCredentials: () => Promise<boolean>
  doesObjectExist: (
    bucket: string,
    name: string,
    options?: object
  ) => Promise<boolean>
  listObjectsRecursive: (
    bucket: string,
    setCallback: (set: Array<object>) => void,
    nextPageToken: any
  ) => Promise<ICloudObject[]>
  getObject: (bucket: string, name: string, options?: object) => Promise<Buffer>
  getObjectStreamWithBackoff: (
    stream: fs.WriteStream,
    bucket: string,
    name: string,
    backoffAttempt?: number
  ) => Promise<void>
  writeObject: (
    bucket: string,
    name: string,
    data: Buffer | fs.ReadStream | string,
    options?: object
  ) => Promise<object>
  listBuckets: () => Promise<ICloudBucket[]>
  createBucket: (name: string) => Promise<any>
  createPresignedUrl: (options: any) => Promise<any>
}

export interface IFactoryOptions {
  apiKey: string
  apiSecret: string
  region?: string
}

export interface ICloudProviderFactory {
  (options: IFactoryOptions): ICloudProvider
}
