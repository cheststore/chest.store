import Aws from '../../../../libs/Aws'
import BackgroundWorker from '../../../../libs/BackgroundWorker'
import LoginHandler from '../../../../libs/LoginHandler'
import SessionHandler from '../../../../libs/SessionHandler'
import CloudBuckets from '../../../../libs/models/CloudBuckets'
import CloudBucketUserMap from '../../../../libs/models/CloudBucketUserMap'
import CloudCredentials from '../../../../libs/models/CloudCredentials'
import CloudCredentialUserMap from '../../../../libs/models/CloudCredentialUserMap'
import Users from '../../../../libs/models/Users'
import config from '../../../../config'

export default function({ log, postgres, redis }) {
  return {
    async ['key/check/save'](req, res) {
      const login    = LoginHandler(postgres, req)
      const session  = SessionHandler(req.session)
      const creds    = CloudCredentials(postgres)
      const credMap  = CloudCredentialUserMap(postgres)
      const users    = Users(postgres)
      const user     = session.getLoggedInUserId(true)
      const {
        awsKey,
        awsSecret
      } = req.body

      const sts = Aws({
        accessKeyId: awsKey,
        secretAccessKey: awsSecret
      }).STS
      
      try {
        // will provide an AWS error if key/secret combo are invalid
        await sts.getCallerIdentity()

        await creds.findOrCreateBy({ type: 'aws', key: awsKey })
        creds.setRecord({ secret: awsSecret })
        const credId = await creds.save()

        await credMap.findOrCreateBy({ credential_id: credId, user_id: user.id })
        if (!user.current_credential_id) {
          users.setRecord({ id: user.id, current_credential_id: credId })
          await users.save()
          await login.standardLogin(users.record, true)
        }
        res.json(true)

      } catch(err) {
        res.status(err.statusCode).json({ error: `${err.code} - ${err.message}` })
      }
    },

    async ['buckets/list'](req, res) {
      const session = SessionHandler(req.session)
      const cred    = session.getLoggedInCredentialId(true)

      const s3 = Aws({
        accessKeyId: cred.key,
        secretAccessKey: cred.secret
      }).S3

      const buckets = await s3.listBuckets()
      res.json(buckets)
    },

    async ['bucket/save'](req, res) {
      const login   = LoginHandler(postgres, req)
      const session = SessionHandler(req.session)
      const buckets = CloudBuckets(postgres)
      const credId  = session.getLoggedInCredentialId()
      const user    = session.getLoggedInUserId(true)
      const bucket  = req.body.bucket

      const cred = await CloudCredentials(postgres).find(credId)

      if (!bucket)
        return res.status(400).json({ error: `Please enter a valid bucket you'd like to integration with.` })

      await buckets.findOrCreateBy({ type: cred.type, bucket_uid: bucket })
      buckets.setRecord({ name: buckets.record.name || bucket })
      await Promise.all([
        buckets.save(),
        CloudBucketUserMap(postgres).findOrCreateBy({ user_id: user.id, bucket_id: buckets.record.id })
      ])

      await login.standardLogin(user, true)

      res.json(true)
    },

    async ['bucket/sync'](req, res) {
      const session = SessionHandler(req.session)
      const credId  = session.getLoggedInCredentialId()
      const buckId  = session.getLoggedInBucketId()
      const userId  = session.getLoggedInUserId()

      await BackgroundWorker({ redis }).enqueue('awsSyncObjects', {
        bucketId: buckId,
        credentialId: credId,
        userId: userId
      })

      res.json(true)
    }
  }
}