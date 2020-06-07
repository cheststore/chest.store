import fs from 'fs'
import path from 'path'
import BackgroundWorker from '../../../../libs/BackgroundWorker'
import SessionHandler from '../../../../libs/SessionHandler'
import AuditLog from '../../../../libs/models/AuditLog'
import CloudBuckets from '../../../../libs/models/CloudBuckets'
import CloudCredentials from '../../../../libs/models/CloudCredentials'
import CloudDirectories from '../../../../libs/models/CloudDirectories'
import CloudObjects from '../../../../libs/models/CloudObjects'
import Providers from '../../../../libs/cloud/Providers'
import GitClient from '../../../../libs/git/GitClient'
import GitHelpers from '../../../../libs/git/GitHelpers'
import config from '../../../../config'

export default function ({ log, postgres, redis }) {
  return {
    async ['list'](req, res) {
      const session = SessionHandler(req.session)
      const dir = CloudDirectories(postgres)
      const objects = CloudObjects(postgres)
      let allBucketIds = session.getAllBucketIds()
      const { bucketId, directoryId, filters, page, perPage } = req.query

      if (bucketId) {
        if (allBucketIds.includes(bucketId))
          allBucketIds = bucketId instanceof Array ? bucketId : [bucketId]
      }

      const [info, directory, directories] = await Promise.all([
        objects.getObjectsInBucket(
          allBucketIds,
          directoryId,
          JSON.parse(filters || 'null'),
          page,
          perPage
        ),
        (async function getDir() {
          if (directoryId)
            return await dir.findBy({
              bucket_id: allBucketIds,
              id: directoryId,
            })
        })(),
        dir.getDirectChildren(allBucketIds, directoryId),
      ])

      res.json({
        objectInfo: info,
        directory,
        directories,
      })
    },

    async ['get'](req, res) {
      const session = SessionHandler(req.session)
      const dirs = CloudDirectories(postgres)
      const objects = CloudObjects(postgres)
      const allBucketIds = session.getAllBucketIds()
      const objId = req.query.id

      const object = await objects.find(objId)
      if (!allBucketIds.includes(object.bucket_id))
        return res.status(401).json({ error: config.errors['401'] })

      let directory = null
      if (object.directory_id) directory = await dirs.find(object.directory_id)

      res.json({ object, directory })
    },

    async ['get/history'](req, res) {
      const session = SessionHandler(req.session)
      const objects = CloudObjects(postgres)
      const allBucketIds = session.getAllBucketIds()
      const allCredIds = session.getAllCredentialIds()
      const user = session.getLoggedInUserId(true)
      const objId = req.query.id

      const object = await objects.find(objId)
      if (!object)
        return res
          .status(404)
          .json({ error: 'No object to get version history.' })

      const bucket = await CloudBuckets(postgres).find(object.bucket_id)
      if (!(bucket && allBucketIds.includes(bucket.id)))
        return res.status(401).json({ error: config.errors['401'] })

      const cred = await CloudCredentials(postgres).find(bucket.credential_id)

      const helpers = GitHelpers({ log, postgres })
      await helpers.checkAndCreateRepo(user.username, objId)
      const client = GitClient(objId, user.username)
      await client.gitClient.init()

      let history = { all: [], latest: {}, total: 0 }
      try {
        // const history = await client.gitClient.log(['-10'])
        history = await client.gitClient.log()
      } catch (err) {
        log.error(`error getting git log for version history`, err)

        // TODO: today assuming an error simply means there is no
        // history, so create initial commit and push, then get log
        // again
        const providers = Providers(bucket.type, {
          apiKey: cred.key,
          apiSecret: cred.secret,
          extra: cred.extra,
        })
        await providers.pipeObjectStreamToWriteStream(
          fs.createWriteStream(path.join(client.workingDir, object.name)),
          bucket.bucket_uid,
          object.full_path
        )
        await client.initAndPushLocalRepo()
        await BackgroundWorker({ redis }).enqueue('providerSyncObjects', {
          bucketId: bucket.id,
          credentialId: cred.id,
          userId: user.id,
          objectId: objId,
        })
        history = {
          ...(await client.gitClient.log()),
          initialized: true,
        }
      }

      res.json({
        history: {
          ...history,
          all: history.all.slice(0, 10),
        },
      })
    },

    async ['delete'](req, res) {
      const session = SessionHandler(req.session)
      const objects = CloudObjects(postgres)
      const bucket = session.getLoggedInBucketId(true)
      const cred = session.getLoggedInCredentialId(true)
      const userId = session.getLoggedInUserId()
      const objId = req.query.id

      const object = await objects.findBy({ bucket_id: bucket.id, id: objId })
      if (!object)
        return res
          .status(404)
          .json({ error: `We didn't find the object you want to delete.` })

      const providers = Providers(bucket.type, {
        apiKey: cred.key,
        apiSecret: cred.secret,
        extra: cred.extra,
      })
      objects.setRecord({ id: objId, is_deleted: true })

      try {
        await providers.deleteObject(bucket.bucket_uid, object.full_path)
      } catch (err) {
        log.error(`Error deleting object`, err)
        res
          .status(err.statusCode)
          .json({ error: `${err.code} - ${err.message}` })
      }

      await Promise.all([
        objects.save(),
        AuditLog(postgres).log({
          credential_id: cred.id,
          user_id: userId,
          entity_table: 'cloud_objects',
          entity_id: objId,
          action: `Objects - Delete Object`,
          additional_info: req.body,
        }),
      ])

      res.json(true)
    },
  }
}
