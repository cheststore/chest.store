// import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import GitClient, { clientRootDir } from './GitClient'
import FileManagement from '../FileManagement'
import Providers from '../cloud/Providers'
import CloudBuckets from '../models/CloudBuckets'
import CloudCredentials from '../models/CloudCredentials'
import CloudObjects from '../models/CloudObjects'
import GitRepos from '../models/GitRepos'
import config from '../../config'

// import tar from 'tar'
const tar = require('tar')

export default function GitHelpers(
  { log, postgres }: IFactoryOptions,
  rootDir = path.join(config.app.rootDir, 'tmp', 'git')
): StringMap {
  const fileMgmt = FileManagement()
  const objects = CloudObjects(postgres)
  const gitRepos = GitRepos(postgres)

  return {
    async doesLocalRepoExist(
      username: string,
      repoName: string
    ): Promise<boolean> {
      return await fileMgmt.doesDirectoryExist(
        path.join(clientRootDir, username, repoName)
      )
    },

    async createLocalRepoDir(
      username: string,
      repoName: string
    ): Promise<string> {
      const fullDirPath: string = path.join(clientRootDir, username, repoName)
      await fileMgmt.checkAndCreateDirectoryOrFile(fullDirPath)
      return fullDirPath
    },

    async getRepoFilesInDir(
      username: string,
      repoName: string,
      baseDir: null | string = null
    ): Promise<object[]> {
      const modifiedRepoForLstree: string = baseDir
        ? path.join(repoName, baseDir)
        : repoName
      const g = GitClient(modifiedRepoForLstree, username)
      const rawTreeInfo: string = await g.gitClient.raw(['ls-tree', 'HEAD'])
      const processedFiles = await Promise.all(
        rawTreeInfo
          .split('\n')
          .filter((i) => !!i)
          .map(async (i: string) => {
            const [blobInfo, file] = i.split('\t')
            try {
              const fullPath = path.join(g.workingDir, file)
              const stat = await fileMgmt.getFileInfo(fullPath)
              const fileType = await fileMgmt.getFileType(fullPath)
              return { blobInfo, file: { stat, fileType, name: file } }
            } catch (err) {
              return {
                blobInfo,
                file: { stat: {}, fileType: 'file', name: file },
              }
            }
          })
      )

      return processedFiles.sort((f1: any, f2: any) => {
        if (f1.file.fileType !== f2.file.fileType) {
          return f1.file.fileType === 'directory' ? -1 : 1
        }
        return f1.file.name.toLowerCase() < f2.file.name.toLowerCase() ? -1 : 1
      })
    },

    getFileStreamInRepo(
      username: string,
      repoName: string,
      filePathInRepo: string
    ): fs.ReadStream {
      const git = GitClient(repoName, username)
      return fs.createReadStream(path.join(git.workingDir, filePathInRepo))
    },

    async deleteLocalRepoDir(
      username: string,
      repoName: string
    ): Promise<void> {
      const fullDirPath: string = path.join(clientRootDir, username, repoName)
      await fileMgmt.deleteDir(fullDirPath)
    },

    async addObjectVersion(
      username: string,
      objectId: string,
      fileData: fs.ReadStream
    ): Promise<void> {
      await this.checkAndCreateRepo(username, objectId)
      const gitClient = GitClient(objectId, username)
      const object = await objects.getObjectAndBucket(objectId)
      await gitClient.overrideFileAndPush(object.name, fileData)
    },

    async checkAndCreateRepo(
      username: string,
      repoOrObjectId: string
    ): Promise<void> {
      if (await this.doesLocalRepoExist(username, repoOrObjectId)) return

      // pull existing repo to client dir
      const repo = await GitRepos(postgres).findBy({ repo: repoOrObjectId })
      if (repo) {
        await fileMgmt.checkAndCreateDirectoryOrFile(
          path.join(clientRootDir, username, repoOrObjectId)
        )
        await GitClient(repoOrObjectId, username).pullRepo()
        return
      }

      await this.createLocalRepoDir(username, repoOrObjectId)
    },

    async tarRepo(username: string, repoName: string): Promise<StringMap> {
      const repoTarFilename = `${repoName}.git.tar.gz`
      const filePath = path.join(rootDir, username)
      const fullRepoTarPath = path.join(filePath, repoTarFilename)

      await tar.c(
        {
          onwarn: (code: number | string, message: string, data: any) =>
            log.error(`Error with tar.c`, code, message, data),
          gzip: true,
          strict: true,
          file: fullRepoTarPath,
          cwd: filePath,
        },
        [`${repoName}.git`]
      )

      return {
        dir: filePath,
        name: repoTarFilename,
        path: fullRepoTarPath,
      }
    },

    async untarRepo(
      username: string,
      bucketId: number | string,
      repoName: string
    ): Promise<void> {
      const userGitDir = path.join(rootDir, username)

      const [bucket, repo] = await Promise.all([
        CloudBuckets(postgres).find(bucketId),
        gitRepos.findBy({ bucket_id: bucketId, repo: repoName }),
      ])

      if (!(repo && repo.object_id)) return

      const [cred, repoObject] = await Promise.all([
        CloudCredentials(postgres).find(repo.credential_id),
        objects.find(repo.object_id),
        fileMgmt.checkAndCreateDirectoryOrFile(userGitDir),
      ])

      if (!cred) throw new Error(`credential not found`)

      const provider = Providers(cred.type, {
        apiKey: cred.key,
        apiSecret: cred.secret,
        extra: cred.extra,
      })
      await provider.pipeObjectStreamToWriteStream(
        tar.x({
          onwarn: (code: number | string, message: string, data: any) =>
            log.error(`Error with tar.x`, code, message, data),
          strict: true,
          cwd: userGitDir,
        }),
        (bucket as StringMap).bucket_uid,
        (repoObject as StringMap).full_path
      )
    },
  }
}
