import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { Dropbox } from 'dropbox'
import { ICloudFactoryOptions, ICloudObject, ICloudProvider } from './Providers'
// import config from '../../config'

// import fetch from 'isomorphic-fetch'
const fetch = require('isomorphic-fetch')
const getObFullpathWithoutBaseDir = (bucket: string, full: string) => {
  const findBucket = new RegExp(`^(${bucket}\/*)(.*)`)
  return full.replace(findBucket, '$2')
}

export default function DropboxProvider({
  apiSecret,
}: ICloudFactoryOptions): ICloudProvider {
  // https://dropbox.github.io/dropbox-sdk-js/tutorial-Authentication.html
  const dropbox = new Dropbox({ accessToken: apiSecret, fetch })

  return {
    async areValidCredentials(): Promise<boolean> {
      await dropbox.fileRequestsCount()
      return true
    },

    async doesObjectExist(bucket: string, name: string): Promise<boolean> {
      const exists = await dropbox.filesGetMetadata({
        path: path.join(bucket, name),
      })
      return !!exists
    },

    async listObjectsRecursive(
      bucket: string,
      setCallback: (set: ICloudObject[]) => Promise<void>,
      nextPageToken?: string,
      subFolder?: string
    ): Promise<void> {
      let res
      if (nextPageToken) {
        res = await dropbox.filesListFolderContinue({
          cursor: nextPageToken,
        })
      } else {
        res = await dropbox.filesListFolder({
          path: subFolder || bucket,
        })
      }
      const { entries, cursor, has_more } = res
      const subDirs = entries.filter((o) => o['.tag'] === 'folder')
      const cloudObjects: ICloudObject[] = entries
        .filter((o) => o['.tag'] === 'file')
        .map((obj) => {
          return {
            bucketUid: bucket,
            fullPath: getObFullpathWithoutBaseDir(
              bucket,
              obj.path_display || ''
            ),
            name: obj.name,

            // TODO: figure out how to cast to `FilesFileMetadata`
            // http://dropbox.github.io/dropbox-sdk-js/global.html#FilesFileMetadata
            lastModified: (obj as StringMap).server_modified,
            // etag: obj.metadata.etag,

            // TODO: figure out how to cast to `FilesFileMetadata`
            // http://dropbox.github.io/dropbox-sdk-js/global.html#FilesFileMetadata
            sizeBytes: (obj as StringMap).size,
            // storageClass: obj.metadata.storageClass,
          }
        })

      await setCallback(cloudObjects)

      // process any sub directories in this directory
      await Promise.all(
        subDirs.map(async ({ path_display }) => {
          if (typeof path_display === 'string')
            await this.listObjectsRecursive(
              bucket,
              setCallback,
              null,
              path_display
            )
        })
      )

      if (has_more) await this.listObjectsRecursive(bucket, setCallback, cursor)
    },

    async getObject(bucket: string, name: string): Promise<Buffer> {
      const fileInfo = await dropbox.filesGetTemporaryLink({
        path: path.join(bucket, name),
      })
      const { data } = await axios.get(fileInfo.link, {
        responseType: 'arraybuffer',
      })
      return data
    },

    async getObjectInfo(bucket: string, name: string): Promise<ICloudObject> {
      const obj = await dropbox.filesDownload({ path: path.join(bucket, name) })
      return {
        bucketUid: bucket,
        fullPath: getObFullpathWithoutBaseDir(bucket, obj.path_display || ''),
        name: obj.name,
        lastModified: obj.server_modified,
        // etag: obj.metadata.etag,
        sizeBytes: obj.size,
        // storageClass: obj.metadata.storageClass,
      }
    },

    async getObjectStreamWithBackoff(
      stream: fs.WriteStream,
      bucket: string,
      name: string
    ) {
      return await new Promise(async (resolve, reject) => {
        try {
          const filePath = path.join(bucket, name)
          const fileInfo = await dropbox.filesGetTemporaryLink({
            path: filePath,
          })
          const { data } = await axios.get(fileInfo.link, {
            responseType: 'stream',
          })
          data
            .on('err', reject)
            .on('end', () => resolve())
            .pipe(stream)
        } catch (err) {
          reject(err)
        }
      })
    },

    async writeObject(
      bucket: string,
      name: string,
      data: Buffer | fs.ReadStream | string
    ) {
      await dropbox.filesUpload({
        path: path.join(bucket, name),
        contents: data,
      })
    },

    async deleteObject(bucket: string, name: string): Promise<void> {
      await dropbox.filesDelete({ path: path.join(bucket, name) })
    },

    async mvObject(
      bucket: string,
      sourceObjPath: string,
      destinationObjPath: string
    ): Promise<void> {
      await dropbox.filesMove({
        from_path: path.join(bucket, sourceObjPath),
        to_path: path.join(bucket, destinationObjPath),
      })
    },

    async listBuckets() {
      let allEntries: any[] = []
      let cursor, has_more
      const onlyFolders = (e: StringMap) => e['.tag'] === 'folder'
      const resOriginal = await dropbox.filesListFolder({ path: '' })
      allEntries = allEntries.concat(resOriginal.entries.filter(onlyFolders))
      cursor = resOriginal.cursor
      has_more = resOriginal.has_more

      while (has_more) {
        // TODO: figure out how to cast to `FilesFileMetadata`
        // http://dropbox.github.io/dropbox-sdk-js/global.html#FilesFileMetadata
        const resCont: any = await dropbox.filesListFolderContinue({ cursor })
        allEntries = allEntries.concat(resCont.entries.filter(onlyFolders))
        has_more = resCont.has_more
        cursor = resCont.cursor
      }
      return allEntries
    },

    async createBucket(name: string) {
      return await dropbox.filesCreateFolder({ path: name, autorename: false })
    },
  }
}
