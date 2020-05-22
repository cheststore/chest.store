import Errors from '../errors'
import CloudBuckets from './models/CloudBuckets'
import CloudCredentials from './models/CloudCredentials'
import Users from './models/Users'

export default function LoginHandler(postgres, request, options = null) {
  const session = request.session
  const creds = CloudCredentials(postgres)
  const buckets = CloudBuckets(postgres)
  const users = Users(postgres, session)

  return {
    async standardLogin(
      userRecord,
      alreadyLoggedIn = false,
      overrideCredentialId = null,
      overrideBucketId = null
    ) {
      if (userRecord.is_disabled)
        throw new Errors.AccountDisabled(`This user account is disabled.`)

      const [currentCred, currentBucket, allBuckets] = await Promise.all([
        creds.find(overrideCredentialId || userRecord.current_credential_id),
        buckets.find(overrideBucketId || userRecord.current_bucket_id),
        buckets.getAllForUser(userRecord.id),
      ])

      if (options && options.log)
        options.log.info(
          `LoginHandler.standardLogin logging in`,
          JSON.stringify({ ...userRecord, password_hash: null })
        )

      await users.login({ ...userRecord, password_hash: undefined })
      await users.setSession({
        last_login: new Date(),
        current_credential: currentCred,
        current_bucket: currentBucket || allBuckets[0],
      })

      // if (!alreadyLoggedIn) {
      //   await AuditLog(postgres).log({
      //     team_id: currentActiveTeam.id,
      //     user_id: userRecord.id,
      //     entity_table: 'users',
      //     entity_id: userRecord.id,
      //     action: 'Login',
      //     // additional_info: {}
      //   })
      // }
    },
  }
}
