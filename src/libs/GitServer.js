import path from 'path'
import Server from 'node-git-server'
import BackgroundWorker from '../libs/BackgroundWorker'
import AuditLog from '../libs/models/AuditLog'
import Users from '../libs/models/Users'
import config from '../config'

export default function GitServer({
  log,
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
      await Promise.all([
        // TODO: background worker to tar git repo, push to S3
        // and save metadata in DB about git repo
        // BackgroundWorker({ redis }).enqueue('gitSavePushedRepo', {
        //   userId: this.user.id,
        //   repo: push.repo
        // }),
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