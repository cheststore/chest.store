import fs from 'fs'
import AwsProvider from './AwsProvider'
import DropboxProvider from './DropboxProvider'
import FsProvider from './FsProvider'
import GcpProvider from './GcpProvider'

export default function Providers(
  type: string,
  options: ICloudFactoryOptions
): ICloudProvider {
  switch (type.toLowerCase()) {
    case 'aws':
      return AwsProvider(options)
    case 'dropbox':
      return DropboxProvider(options)
    case 'fs':
      return FsProvider()
    case 'gcp':
      return GcpProvider(options)
    default:
      throw new Error(`Invalid provider type.`)
  }
}

export interface ICloudBucket {
  uid: string
  name: string
}

export interface ICloudObject {
  bucketUid: string
  fullPath: string
  name: string
  lastModified?: Date | string
  etag?: string
  sizeBytes?: number
  storageClass?: string
  sha256Contents?: string
  ownerId?: string
  ownerDisplayName?: string
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
    setCallback: (set: ICloudObject[]) => Promise<void>,
    nextPageToken?: any,
    subFolder?: string
  ) => Promise<void>
  getObject: (bucket: string, name: string, options?: object) => Promise<Buffer>
  getObjectInfo: (bucket: string, name: string) => Promise<ICloudObject>
  pipeObjectStreamToWriteStream: (
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
  ) => Promise<void>
  deleteObject: (bucket: string, name: string) => Promise<void>
  mvObject: (
    bucket: string,
    sourcePath: string,
    destPath: string
  ) => Promise<void>
  listBuckets: () => Promise<ICloudBucket[]>
  createBucket: (name: string) => Promise<any>
}

export interface ICloudFactoryOptions {
  apiKey: string
  apiSecret?: string
  extra?: StringMap
}

export interface ICloudProviderFactory {
  (options?: ICloudFactoryOptions): ICloudProvider
}
