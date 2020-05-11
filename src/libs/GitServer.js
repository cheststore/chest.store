import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import tar from 'tar'
import Server from 'node-git-server'
import Aws from '../libs/Aws'
import BackgroundWorker from '../libs/BackgroundWorker'
import CloudBuckets from '../libs/models/CloudBuckets'
import CloudCredentials from '../libs/models/CloudCredentials'
import AuditLog from '../libs/models/AuditLog'
import Users from '../libs/models/Users'
import config from '../config'

export default function GitServer({
  // log,
  postgres,
  redis,
  rootDir=path.join(config.app.rootDir, 'tmp')
}) {
  const users = Users(postgres)

  return {
    user: null,

    async create(
      username,
      autoCreate=true
    ) {
      const userRecord = await users.findBy({ username })
      if (!userRecord)
        throw new Error(`No user with the username provided.`)

      this.user = userRecord

      const filePath = path.join(rootDir, username)
      const repos = new Server(filePath, {
        autoCreate,
        authenticate: this.handleAuth.bind(this)
      })
      repos.on('push', this.onPush.bind(this))
      repos.on('fetch', this.onFetch.bind(this))

      return repos
    },

    async handleAuth({ /* type, repo, */ user }) {
      return await new Promise((resolve, reject) => {
        user(async (username, password) => {
          try {
            if (username.toLowerCase() !== this.user.username.toLowerCase())
              throw new Error(`Please make sure your git remote URL has the correct username (i.e. https://URL/git/:username/REPO)`)

            const isValidPassword = await users.validateUserPassword(username, password, this.user.password_hash)
            if (!isValidPassword)
              throw new Error(`Your password is invalid.`)

            resolve() 
          } catch(err) {
            reject(err)
          }
        })
      })
    },

    async onPush(push) {
      const repoTarFilename = `${push.repo}_${uuidv4()}.tar.gz`
      const fullRepoTarPath = path.join(rootDir, this.user.username, repoTarFilename)
      const [ bucket, cred ] = await Promise.all([
        CloudBuckets(postgres).find(this.user.current_bucket_id),
        CloudCredentials(postgres).find(this.user.current_credential_id),
        tar.c(
          {
            gzip: true,
            file: fullRepoTarPath,
            cwd: path.join(rootDir, this.user.username)
          },
          [ `${push.repo}.git` ]
        ),
        AuditLog(postgres).log({
          credential_id: this.user.current_credential_id,
          user_id: this.user.id,
          action: `git - Push Repo`,
          additional_info: {
            repo: push.repo,
            commit: push.commit,
            branch: push.branch
          }
        })
      ])

      const s3 = Aws({
        accessKeyId: cred.key,
        secretAccessKey: cred.secret
      }).S3

      await Promise.all([
        s3.writeFile({
          bucket: bucket.bucket_uid,
          data: fs.createReadStream(fullRepoTarPath),
          filename: repoTarFilename
        }),
        BackgroundWorker({ redis }).enqueue('awsSyncObjects', {
          bucketId: bucket.id,
          credentialId: this.user.current_credential_id,
          userId: this.user.id
        })
      ])

      push.accept()
    },

    async onFetch(fetch) {
      await AuditLog(postgres).log({
        credential_id: this.user.current_credential_id,
        user_id: this.user.id,
        action: `git - Fetch Repo`,
        additional_info: {
          repo: fetch.repo,
          commit: fetch.commit
        }
      })
      fetch.accept()
    }
  }
}