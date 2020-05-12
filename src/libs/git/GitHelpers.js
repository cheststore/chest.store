import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import tar from 'tar'
import Aws from '../Aws'
import FileManagement from '../FileManagement'
import CloudBuckets from '../models/CloudBuckets'
import CloudCredentials from '../models/CloudCredentials'
import CloudObjects from '../models/CloudObjects'
import GitRepos from '../models/GitRepos'
import config from '../../config'

export default function GitServer({
  log,
  postgres,
  // redis
  rootDir=path.join(config.app.rootDir, 'tmp', 'git')
}) {
  const fileMgmt = FileManagement()

  return {
    async tarRepo(username, repoName) {
      const repoTarFilename = `${repoName}_${uuidv4()}.tar.gz`
      const filePath = path.join(rootDir, username)
      const fullRepoTarPath = path.join(filePath, repoTarFilename)

      await tar.c(
        {
          onwarn: (code, message, data) => log.error(`Error with tar.c`, code, message, data),
          gzip: true,
          strict: true,
          file: fullRepoTarPath,
          cwd: filePath
        },
        [ `${repoName}.git` ]
      )

      return {
        dir: filePath,
        name: repoTarFilename,
        path: fullRepoTarPath
      }
    },

    async untarRepoFromS3(username, bucketId, repoName) {
      const userGitDir = path.join(rootDir, username)

      const [ bucket, repo ] = await Promise.all([
        CloudBuckets(postgres).find(bucketId),
        GitRepos(postgres).findBy({ bucket_id: bucketId, repo: repoName })
      ])

      if (!(repo && repo.object_id))
        return

      const [ cred, repoObject ] = await Promise.all([
        CloudCredentials(postgres).find(repo.credential_id),
        CloudObjects(postgres).find(repo.object_id),
        fileMgmt.checkAndCreateDirectoryOrFile(userGitDir)
      ])
      const s3 = Aws({
        accessKeyId: cred.key,
        secretAccessKey: cred.secret
      }).S3

      await s3.getFileStreamWithBackoff(tar.x({
        onwarn: (code, message, data) => log.error(`Error with tar.x`, code, message, data),
        strict: true,
        cwd: userGitDir
      }), { bucket: bucket.bucket_uid, filename: repoObject.full_path })
    }
  }
}