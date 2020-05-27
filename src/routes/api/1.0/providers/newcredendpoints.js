import Providers from '../../../../libs/cloud/Providers'
import LoginHandler from '../../../../libs/LoginHandler'
import SessionHandler from '../../../../libs/SessionHandler'
import CloudBuckets from '../../../../libs/models/CloudBuckets'
import CloudBucketUserMap from '../../../../libs/models/CloudBucketUserMap'
import CloudCredentials from '../../../../libs/models/CloudCredentials'
import CloudCredentialUserMap from '../../../../libs/models/CloudCredentialUserMap'
import Users from '../../../../libs/models/Users'
// import config from '../../../../config'

export default function ({ log, postgres, redis }) {
  return {
    async ['key/check/save'](req, res) {
      const login = LoginHandler(postgres, req)
      const session = SessionHandler(req.session)
      const creds = CloudCredentials(postgres)
      const credMap = CloudCredentialUserMap(postgres)
      const users = Users(postgres)
      const user = session.getLoggedInUserId(true)
      const { providerType, awsKey, awsSecret } = req.body

      const provider = Providers(providerType, {
        apiKey: awsKey,
        apiSecret: awsSecret,
      })

      try {
        // will provide an error if key/secret combo are invalid
        await provider.areValidCredentials()

        await creds.findOrCreateBy({ type: providerType, key: awsKey })
        creds.setRecord({ secret: awsSecret })
        const credId = await creds.save()

        await credMap.findOrCreateBy({
          credential_id: credId,
          user_id: user.id,
        })
        if (!user.current_credential_id) {
          users.setRecord({ id: user.id, current_credential_id: credId })
          await users.save()
          await login.standardLogin(users.record, true)
        }
        res.json({ id: credId })
      } catch (err) {
        res
          .status(err.statusCode)
          .json({ error: `${err.code} - ${err.message}` })
      }
    },

    async ['buckets/list'](req, res) {
      const session = SessionHandler(req.session)
      const userId = session.getLoggedInUserId()
      const credId = req.query.id
      const [cred] = await CloudCredentials(postgres).getAllForUser(
        userId,
        credId
      )

      const provider = Providers(cred.type, {
        apiKey: cred.key,
        apiSecret: cred.secret,
        extra: cred.extra,
      })
      const buckets = await provider.listBuckets()
      res.json(buckets)
    },

    async ['bucket/save'](req, res) {
      const login = LoginHandler(postgres, req)
      const session = SessionHandler(req.session)
      const buckets = CloudBuckets(postgres)
      const users = Users(postgres)
      // const credId = session.getLoggedInCredentialId()
      const user = session.getLoggedInUserId(true)
      const credId = req.body.credentialId
      const bucket = req.body.bucket

      const cred = await CloudCredentials(postgres).find(credId)

      if (!bucket)
        return res.status(400).json({
          error: `Please enter a valid bucket you'd like to integration with.`,
        })

      await buckets.findOrCreateBy({ type: cred.type, bucket_uid: bucket })
      buckets.setRecord({
        name: buckets.record.name || bucket,
        credential_id: credId,
      })

      await Promise.all([
        buckets.save(),
        CloudBucketUserMap(postgres).findOrCreateBy({
          user_id: user.id,
          bucket_id: buckets.record.id,
        }),
        this['bucket/sync'](
          {
            ...req,
            session: {
              ...req.session,
              current_credential: cred,
              current_bucket: buckets.record,
            },
          },
          {
            ...res,
            status() {
              return this
            },
            json() {
              return this
            },
          }
        ),
      ])

      if (!user.current_bucket_id) {
        users.setRecord({ id: user.id, current_bucket_id: buckets.record.id })
        await users.save()
      }

      await login.standardLogin({ ...user, ...users.record }, true)
      res.json(true)
    },
  }
}
