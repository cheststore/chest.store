import fs from 'fs'
import path from 'path'
import Server from 'node-git-server'
import GitHelpers from './GitHelpers'
import Providers from '../cloud/Providers'
import FileManagement from '../FileManagement'
import AuditLog from '../models/AuditLog'
import CloudBuckets from '../models/CloudBuckets'
import CloudCredentials from '../models/CloudCredentials'
import CloudDirectories from '../models/CloudDirectories'
import CloudObjects from '../models/CloudObjects'
import GitRepos from '../models/GitRepos'
import Users from '../models/Users'
import config from '../../config'

export default function GitServer({
  log,
  postgres,
  redis,
  rootDir = path.join(config.app.rootDir, 'tmp', 'git'),
}) {
  const fileMgmt = FileManagement()
  const helpers = GitHelpers({ log, postgres, redis, rootDir })
  const users = Users(postgres)

  return {
    user: null,

    async create(username, autoCreate = true) {
      const userRecord = await users.findBy({ username })
      if (!userRecord) throw new Error(`No user with the username provided.`)

      this.user = userRecord

      const filePath = path.join(rootDir, username)
      const repos = new Server(filePath, {
        autoCreate,
        authenticate: this.handleAuth.bind(this),
      })
      repos.on('push', this.onPush.bind(this))
      repos.on('fetch', this.onFetch.bind(this))

      return repos
    },

    async handleAuth({ type, repo, user }) {
      return await new Promise((resolve, reject) => {
        user(async (username, password) => {
          try {
            if (username.toLowerCase() !== this.user.username.toLowerCase())
              throw new Error(
                `Please make sure your git remote URL has the correct username (i.e. https://URL/git/:username/REPO)`
              )

            if (config.git.clientKey && password === config.git.clientKey) {
              log.debug(
                `git client key used to authenticate with repo`,
                type,
                repo
              )
            } else {
              const isValidPassword = await users.validateUserPassword(
                username,
                password,
                this.user.password_hash
              )
              if (!isValidPassword) throw new Error(`Your password is invalid.`)
            }

            if (type === 'fetch') {
              const repoDirExists = await fileMgmt.doesDirectoryExist(
                path.join(rootDir, username, `${repo}.git`)
              )
              if (!repoDirExists) {
                await helpers.untarRepo(
                  this.user.username,
                  this.user.current_bucket_id,
                  repo
                )
              }
            }

            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })
    },

    onPush(push) {
      push.accept()
      push.res.on('finish', async () => {
        try {
          await this.handlePush(push)
        } catch (err) {
          log.error(`Error handling push`, err)
        }
      })
    },

    onFetch(fetch) {
      fetch.accept()
      fetch.res.on('finish', async () => {
        try {
          await AuditLog(postgres).log({
            credential_id: this.user.current_credential_id,
            user_id: this.user.id,
            entity_table: 'git_repos',
            entity_id: await GitRepos(postgres).findBy({
              bucket_id: this.user.current_bucket_id,
              repo: fetch.repo,
            }).id,
            action: `git - Fetch Repo`,
            additional_info: {
              repo: fetch.repo,
              commit: fetch.commit,
            },
          })
        } catch (err) {
          log.error(`Error handling fetch`, err)
        }
      })
    },

    async handlePush(push) {
      const directories = CloudDirectories(postgres)
      const gitRepos = GitRepos(postgres)

      const [bucket, cred, tarInfo] = await Promise.all([
        CloudBuckets(postgres).find(this.user.current_bucket_id),
        CloudCredentials(postgres).find(this.user.current_credential_id),
        helpers.tarRepo(this.user.username, push.repo),
        AuditLog(postgres).log({
          credential_id: this.user.current_credential_id,
          user_id: this.user.id,
          entity_table: 'git_repos',
          entity_id: await GitRepos(postgres).findBy({
            bucket_id: this.user.current_bucket_id,
            repo: push.repo,
          }).id,
          action: `git - Push Repo`,
          additional_info: {
            repo: push.repo,
            commit: push.commit,
            branch: push.branch,
          },
        }),
      ])

      await gitRepos.findOrCreateBy({ bucket_id: bucket.id, repo: push.repo })
      let fullTarPath = `chest.store.git/${this.user.username}/${tarInfo.name}`
      if (!gitRepos.isNewRecord) {
        const repoObj = await CloudObjects(postgres).findBy({
          bucket_id: bucket.id,
          id: gitRepos.record.object_id,
        })
        fullTarPath = repoObj.full_path
      }

      const provider = Providers(bucket.type, {
        apiKey: cred.key,
        apiSecret: cred.secret,
      })
      await provider.writeObject(
        bucket.bucket_uid,
        fullTarPath,
        fs.createReadStream(tarInfo.path)
      )

      const newRecInfo = await directories.createDirsAndObjectFromFullPath(
        bucket.id,
        fullTarPath
      )

      gitRepos.setRecord({
        credential_id: this.user.current_credential_id,
        object_id: newRecInfo[newRecInfo.length - 1].id,
        user_id: this.user.id,
      })
      await gitRepos.save()
    },
  }
}
