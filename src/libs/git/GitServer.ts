import fs from 'fs'
import path from 'path'
import GitHelpers from './GitHelpers'
import Providers from '../cloud/Providers'
import FileManagement from '../FileManagement'
import AuditLog from '../models/AuditLog'
import CloudBuckets from '../models/CloudBuckets'
import CloudCredentials from '../models/CloudCredentials'
import CloudDirectories from '../models/CloudDirectories'
import CloudObjects from '../models/CloudObjects'
import GitRepos from '../models/GitRepos'
import config from '../../config'

// import Server from 'node-git-server'
const Server = require('node-git-server')
// import Users from '../models/Users'
const Users = require('../models/Users').default

interface IAuthOptions {
  type: string
  repo: string
  user(
    check: (username: string, password: string) => Promise<void>
  ): Promise<void>
}

export default function GitServer(
  { log, postgres, redis }: IFactoryOptions,
  rootDir: string = path.join(config.app.rootDir, 'tmp', 'git')
) {
  const fileMgmt = FileManagement()
  const helpers = GitHelpers({ log, postgres, redis }, rootDir)
  const users = Users(postgres)
  const user: StringMap = {}

  return {
    user,

    async create(username: string, autoCreate: boolean = true): Promise<any> {
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

    async handleAuth({ type, repo, user }: IAuthOptions) {
      return await new Promise((resolve, reject) => {
        user(
          async (username: string, password: string): Promise<void> => {
            try {
              log.debug(
                `git auth handler`,
                username,
                this.user.username,
                `${password.slice(0, 2)}......${password.slice(-2)}`
              )

              if (config.app.masterKey && password === config.app.masterKey) {
                log.debug(
                  `git client key used to authenticate with repo`,
                  type,
                  repo
                )
              } else {
                if (username.toLowerCase() !== this.user.username.toLowerCase())
                  throw new Error(
                    `Please make sure your git remote URL has the correct username (i.e. https://URL/git/:username/REPO)`
                  )

                const isValidPassword = await users.validateUserPassword(
                  username,
                  password,
                  this.user.password_hash
                )
                if (!isValidPassword)
                  throw new Error(`Your password is invalid.`)
              }

              if (type === 'fetch') {
                const repoDirExists = await fileMgmt.doesDirectoryExist(
                  path.join(rootDir, this.user.username, `${repo}.git`)
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
          }
        )
      })
    },

    onPush(push: StringMap): void {
      push.accept()
      push.res.on(
        'finish',
        async (): Promise<void> => {
          try {
            await this.handlePush(push)
          } catch (err) {
            log.error(`Error handling push`, err)
          }
        }
      )
    },

    onFetch(fetch: StringMap): void {
      fetch.accept()
      fetch.res.on(
        'finish',
        async (): Promise<void> => {
          try {
            await AuditLog(postgres).log({
              credential_id: this.user.current_credential_id,
              user_id: this.user.id,
              entity_table: 'git_repos',
              entity_id: ((await GitRepos(postgres).findBy({
                bucket_id: this.user.current_bucket_id,
                repo: fetch.repo,
              })) as StringMap).id,
              action: `git - Fetch Repo`,
              additional_info: {
                repo: fetch.repo,
                commit: fetch.commit,
              },
            })
          } catch (err) {
            log.error(`Error handling fetch`, err)
          }
        }
      )
    },

    async handlePush(push: StringMap) {
      const directories = CloudDirectories(postgres)
      const gitRepos = GitRepos(postgres)

      const [bucket, cred, tarInfo] = await Promise.all([
        CloudBuckets(postgres).find(this.user.current_bucket_id),
        CloudCredentials(postgres).find(this.user.current_credential_id),
        helpers.tarRepo(this.user.username, push.repo),
      ])

      log.info(
        `git handle push`,
        this.user.username,
        (bucket as StringMap).bucket_uid
      )

      const newRepo = await gitRepos.findOrCreateBy({
        bucket_id: (bucket as StringMap).id,
        repo: push.repo,
      })

      // TODO: Right now assume if the repo is a valid UUID
      // that we're passing it as a version of an object.
      const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (validUuid.test(push.repo)) {
        const obj = await CloudObjects(postgres).find(push.repo)
        gitRepos.setRecord({
          is_object_version_repo: true,
          version_source_object_id: (obj as StringMap).id,
        })
      }

      let fullTarPath = `chest.store.git/${this.user.username}/${tarInfo.name}`
      if (!gitRepos.isNewRecord) {
        const repoObj = await CloudObjects(postgres).findBy({
          bucket_id: (bucket as StringMap).id,
          id: gitRepos.record.object_id,
        })
        fullTarPath = (repoObj as StringMap).full_path
      }

      const provider = Providers((bucket as StringMap).type, {
        apiKey: (cred as StringMap).key,
        apiSecret: (cred as StringMap).secret,
      })

      const [newRecInfo]: any[] = await Promise.all([
        directories.createDirsAndObjectFromFullPath(
          (bucket as StringMap).id,
          fullTarPath
        ),

        provider.writeObject(
          (bucket as StringMap).bucket_uid,
          fullTarPath,
          fs.createReadStream(tarInfo.path)
        ),

        AuditLog(postgres).log({
          credential_id: this.user.current_credential_id,
          user_id: this.user.id,
          entity_table: 'git_repos',
          entity_id: newRepo.id,
          action: `git - Push Repo`,
          additional_info: {
            repo: push.repo,
            commit: push.commit,
            branch: push.branch,
          },
        }),
      ])

      gitRepos.setRecord({
        credential_id: this.user.current_credential_id,
        object_id: newRecInfo[newRecInfo.length - 1].id,
        user_id: this.user.id,
      })
      await gitRepos.save()
    },
  }
}
