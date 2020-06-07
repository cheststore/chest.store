// import BackgroundWorker from '../../../../libs/BackgroundWorker'
import SessionHandler from '../../../../libs/SessionHandler'
import GitClient from '../../../../libs/git/GitClient'
import GitHelpers from '../../../../libs/git/GitHelpers'
import GitRepos from '../../../../libs/models/GitRepos'
import config from '../../../../config'

export default function ({ io, log, postgres, redis }) {
  const helpers = GitHelpers({ log, postgres })

  return {
    async ['all'](req, res) {
      const session = SessionHandler(req.session)
      // const userId = session.getLoggedInUserId()
      let allBucketIds = session.getAllBucketIds()
      const { bucketId, page, perPage } = req.query

      if (bucketId) {
        if (allBucketIds.includes(bucketId))
          allBucketIds = bucketId instanceof Array ? bucketId : [bucketId]
      }

      const repos = await GitRepos(postgres).getReposInBucket(
        allBucketIds,
        page,
        perPage
      )
      res.json({ repos })
    },

    async ['get'](req, res) {
      const session = SessionHandler(req.session)
      const user = session.getLoggedInUserId(true)
      let allBucketIds = session.getAllBucketIds()
      const { id, path } = req.query

      const repo = await GitRepos(postgres).findBy({
        bucket_id: allBucketIds,
        id,
      })
      if (!repo) {
        return res
          .status(404)
          .json({ error: `We did not find the repository you're looking for.` })
      }

      await helpers.checkAndCreateRepo(user.username, repo.repo)
      const files = await helpers.getRepoFilesInDir(
        user.username,
        repo.repo,
        path
      )

      res.json({ repo, files })
    },

    async ['file/get'](req, res) {
      const session = SessionHandler(req.session)
      const user = session.getLoggedInUserId(true)
      let allBucketIds = session.getAllBucketIds()
      const { id, path } = req.query

      const repo = await GitRepos(postgres).findBy({
        bucket_id: allBucketIds,
        id,
      })
      if (!repo) {
        return res
          .status(404)
          .json({ error: `We did not find the repository you're looking for.` })
      }

      const nodePath = require('path')
      const files = await helpers.getRepoFilesInDir(
        user.username,
        repo.repo,
        nodePath.dirname(path)
      )
      res.json({
        file: files.find((f) => f.file.name === nodePath.basename(path)),
      })
    },

    async ['file/download'](req, res) {
      const session = SessionHandler(req.session)
      const user = session.getLoggedInUserId(true)
      let allBucketIds = session.getAllBucketIds()
      const { id, path } = req.query

      const repo = await GitRepos(postgres).findBy({
        bucket_id: allBucketIds,
        id,
      })
      if (!repo) {
        return res.status(404).json({
          error: `We did not find the repository you're looking to download a file from.`,
        })
      }

      await helpers.checkAndCreateRepo(user.username, repo.repo)
      const readStream = helpers.getFileStreamInRepo(
        user.username,
        repo.repo,
        path
      )
      readStream.pipe(res)
    },
  }
}
