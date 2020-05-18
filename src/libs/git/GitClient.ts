// import tar from 'tar'
import fs from 'fs'
import path from 'path'
import gitP, { SimpleGit } from 'simple-git/promise'

const config = require('../../config').default

export default function GitClient(
  repoName: string,
  username: string,
  rootDir = path.join(config.app.rootDir, 'tmp', 'git', '_cheststore_repos')
) {
  const getProtocol = /^(https?:\/\/)(.*)/
  const protocol = config.server.host.replace(getProtocol, '$1')
  const hostOnly = config.server.host.replace(getProtocol, '$2')
  const hostWithAuth = `${protocol}chest.store:${config.git.clientKey}@${hostOnly}`

  const workingDir: string = path.join(rootDir, username, repoName)
  const gitClient: SimpleGit = gitP(workingDir)

  return {
    gitClient,
    repoName,
    username,

    async newRepo(commitMessage: string = 'init'): Promise<void> {
      await gitClient.init()
      await gitClient.add('./*')
      await gitClient.commit(commitMessage)
      await gitClient.addRemote(
        'origin',
        `${hostWithAuth}/git/${username}/${repoName}.git`
      )
      await gitClient.push('origin', 'master')
    },

    async overrideFileAndPush(
      filePathInRepo: string,
      fileData: string | Uint8Array,
      commitMessage: string = `chest.store - update file version ${filePathInRepo}`
    ): Promise<void> {
      await this.overrideFile(filePathInRepo, fileData)
      await gitClient.add('./*')
      await gitClient.commit(commitMessage)
      await gitClient.push('origin', 'master')
    },

    async overrideFile(
      filePathInRepo: string,
      fileData: string | Uint8Array
    ): Promise<void> {
      await fs.promises.writeFile(
        path.join(workingDir, filePathInRepo),
        fileData
      )
    },
  }
}
