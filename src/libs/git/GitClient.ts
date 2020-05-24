import fs from 'fs'
import path from 'path'
import gitP, { SimpleGit } from 'simple-git/promise'
import config from '../../config'

export const clientRootDir: string = path.join(
  config.app.rootDir,
  'tmp',
  'git',
  '_cheststore_repos'
)

export default function GitClient(
  repoName: string,
  username: string,
  rootDirOverride?: string
): StringMap {
  const getProtocol: RegExp = /^(https?:\/\/)(.*)/
  const protocol: string = config.server.host.replace(getProtocol, '$1')
  const hostOnly: string = config.server.host.replace(getProtocol, '$2')
  const hostWithAuth: string = `${protocol}chest.store:${config.app.masterKey}@${hostOnly}`

  const workingDir: string = path.join(
    rootDirOverride || clientRootDir,
    username,
    repoName
  )
  const gitClient: SimpleGit = gitP(workingDir)

  return {
    gitClient,
    repoName,
    username,
    workingDir,

    async getTrackedFiles(): Promise<string[]> {
      // returns newline-delimited file paths
      const paths = await gitClient.raw([
        'ls-tree',
        '-r',
        'master',
        '--name-only',
      ])
      return paths.split('\n').filter((f) => !!f)
    },

    async initAndPushLocalRepo(commitMessage: string = 'init'): Promise<void> {
      await gitClient.init()
      await gitClient.add('./*')
      await gitClient.commit(commitMessage)
      if (!(await this.hasLocalRemote())) {
        await gitClient.addRemote(
          'origin',
          `${hostWithAuth}/git/${username}/${repoName}`
        )
      }
      await gitClient.raw(['push', '-u', 'origin', 'master'])
    },

    async hasLocalRemote(): Promise<boolean> {
      const remotes = await gitClient.getRemotes(true)
      return !!remotes.find((r) => r.name === 'origin')
    },

    async pullRepo(): Promise<void> {
      await gitClient.init()
      if (!(await this.hasLocalRemote())) {
        await gitClient.addRemote(
          'origin',
          `${hostWithAuth}/git/${username}/${repoName}`
        )
      }
      await gitClient.pull('origin', 'master')
    },

    async overrideFileAndPush(
      filePathInRepo: string,
      fileDataReadStream: fs.ReadStream,
      commitMessage: string = `chest.store - update file version ${filePathInRepo}`
    ): Promise<void> {
      await this.overrideFile(filePathInRepo, fileDataReadStream)
      await this.initAndPushLocalRepo(commitMessage)
    },

    async overrideFile(
      filePathInRepo: string,
      fileDataReadStream: fs.ReadStream
    ): Promise<void> {
      return await new Promise(
        (resolve: (data: any) => void, reject: (err: any) => void) => {
          const writeStream: fs.WriteStream = fs.createWriteStream(
            path.join(workingDir, filePathInRepo)
          )
          fileDataReadStream
            .on('error', reject)
            .on('end', resolve)
            .pipe(writeStream)
        }
      )
    },
  }
}
