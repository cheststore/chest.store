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
      await this.checkAndCreateNewObjectVersionRepo(username, objectId)
      const gitClient = GitClient(objectId, username)
      const object = await objects.getObjectAndBucket(objectId)
      await gitClient.overrideFileAndPush(object.name, fileData)
    },

    async checkAndCreateNewObjectVersionRepo(
      username: string,
      objectId: string
    ): Promise<void> {
      if (await this.doesLocalRepoExist(username, objectId)) return

      // pull existing repo to client dir
      const repo = await GitRepos(postgres).findBy({ repo: objectId })
      if (repo) {
        await fileMgmt.checkAndCreateDirectoryOrFile(
          path.join(clientRootDir, username, objectId)
        )
        await GitClient(objectId, username).pullRepo()
        return
      }

      await this.createLocalRepoDir(username, objectId)
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
      await provider.getObjectStreamWithBackoff(
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
