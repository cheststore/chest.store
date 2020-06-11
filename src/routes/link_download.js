import Providers from '../libs/cloud/Providers'
import SessionHandler from '../libs/SessionHandler'
import GitHelpers from '../libs/git/GitHelpers'
import AuditLog from '../libs/models/AuditLog'
import CloudCredentials from '../libs/models/CloudCredentials'
import CloudBuckets from '../libs/models/CloudBuckets'
import CloudObjects from '../libs/models/CloudObjects'
import FileLinks from '../libs/models/FileLinks'
import GitRepos from '../libs/models/GitRepos'
import Users from '../libs/models/Users'
import config from '../config'

export default function ({ log, postgres, redis }) {
  const gitHelpers = GitHelpers({ log, postgres })

  return {
    priority: 0,
    verb: 'GET',
    route: '/link/download/:linkId',
    handler: [
      async function FileDownloadLink(req, res) {
        const session = SessionHandler(req.session)
        const linkId = req.params.linkId
        const ip = session.getClientIp(req)

        try {
          const rateLimit404Key = `file_link_s3_404_${ip}`
          const current404Count = await redis.get(rateLimit404Key)
          if (current404Count && current404Count > 5)
            return res.status(400).json({
              error: `You've tried accessing nonexistent files too many times. Please try again in 5 minutes.`,
            })

          const link = await FileLinks(postgres).find(linkId)
          if (!link) {
            await redis.client
              .pipeline()
              .incr(rateLimit404Key)
              .expire(rateLimit404Key, 60 * 5)
              .exec()
            return res
              .status(404)
              .json({ error: `The requested link to the file is not valid.` })
          }

          let readStream
          switch (link.entity_table) {
            case 'git_repos':
              const repo = await GitRepos(postgres).find(link.entity_id)
              const user = await Users(postgres).find(repo.user_id)
              await gitHelpers.checkAndCreateRepo(user.username, repo.repo)
              readStream = gitHelpers.getFileStreamInRepo(
                user.username,
                repo.repo,
                link.entity_identifying_info
              )
              // ------------------------------------------------
              // pipe readstream to res
              readStream.pipe(res)
              // ------------------------------------------------
              break
            case 'cloud_objects':
              const obj = await CloudObjects(postgres).find(link.entity_id)
              const bucket = await CloudBuckets(postgres).find(obj.bucket_id)
              const cred = await CloudCredentials(postgres).find(
                bucket.credential_id
              )

              const provider = Providers(bucket.type, {
                apiKey: cred.key,
                apiSecret: cred.secret,
                extra: cred.extra,
              })

              // ------------------------------------------------
              // pipe readstream to res
              await provider.pipeObjectStreamToWriteStream(
                res,
                bucket.bucket_uid,
                obj.full_path.replace(/\/\//g, '/')
              )
              // ------------------------------------------------
              break
            default:
              return res.status(400).json({ error: `Invalid entity.` })
          }

          await AuditLog(postgres).log({
            ip_address: ip,
            entity_table: 'file_links',
            entity_id: linkId,
            action: `Download Object from File Link`,
            additional_info: req.params,
          })
        } catch (err) {
          res.status(500).json(err.message)
          return log.error(err)
        }
      },
    ],
  }
}
