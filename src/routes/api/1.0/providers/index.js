import NewCredEndpoints from './newcredendpoints'

import path from 'path'
import BackgroundWorker from '../../../../libs/BackgroundWorker'
import FileManagement from '../../../../libs/FileManagement'
import LoginHandler from '../../../../libs/LoginHandler'
import SessionHandler from '../../../../libs/SessionHandler'
import AuditLog from '../../../../libs/models/AuditLog'
import CloudBuckets from '../../../../libs/models/CloudBuckets'
import CloudBucketUserMap from '../../../../libs/models/CloudBucketUserMap'
import CloudCredentials from '../../../../libs/models/CloudCredentials'
import CloudCredentialUserMap from '../../../../libs/models/CloudCredentialUserMap'
import ProviderTypes from '../../../../libs/models/ProviderTypes'
import Users from '../../../../libs/models/Users'
// import config from '../../../../config'

const fileMgmt = FileManagement()

export default function ({ log, postgres, redis }) {
  return {
    ...NewCredEndpoints({ log, postgres, redis }),

    async ['types'](req, res) {
      const pt = ProviderTypes(postgres)
      const types = await pt.getAllBy(
        { is_active: true },
        null,
        'order by lower(text)'
      )

      res.json({ types })
    },

    async ['fs/checkdir'](req, res) {
      const login = LoginHandler(postgres, req)
      const session = SessionHandler(req.session)
      const buckets = CloudBuckets(postgres)
      const creds = CloudCredentials(postgres)
      const credMap = CloudCredentialUserMap(postgres)
      const users = Users(postgres, req.session)
      const user = session.getLoggedInUserId(true)
      const { dir } = req.body

      const directory = path.resolve(dir)
      const exists = await fileMgmt.doesDirectoryExist(directory)

      if (!exists)
        return res.status(404).json({
          error: `We didn't find the directory you'd like to integrate with.`,
        })

      await creds.findOrCreateBy({ type: 'fs', key: '' })
      const credId = await creds.save()

      await credMap.findOrCreateBy({
        credential_id: credId,
        user_id: user.id,
      })

      await buckets.findOrCreateBy({
        type: creds.record.type,
        bucket_uid: directory,
      })
      buckets.setRecord({ name: directory, credential_id: credId })

      await Promise.all([
        buckets.save(),
        CloudBucketUserMap(postgres).findOrCreateBy({
          user_id: user.id,
          bucket_id: buckets.record.id,
        }),
      ])

      if (!(user.current_credential_id && user.current_bucket_id)) {
        users.setRecord({
          id: user.id,
          current_credential_id: user.current_credential_id || credId,
          current_bucket_id: user.current_bucket_id || buckets.record.id,
        })
        await users.save()
        await login.standardLogin(users.record, true)
      }

      await Promise.all([
        BackgroundWorker({ redis }).enqueue('providerSyncObjects', {
          bucketId: buckets.record.id,
          credentialId: creds.record.id,
          userId: user.id,
        }),
        AuditLog(postgres).log({
          credential_id: users.record.current_credential_id,
          user_id: users.record.id,
          entity_table: 'cloud_credentials',
          entity_id: creds.record.id,
          action: `Providers - Added New File System Provider`,
          additional_info: req.body,
        }),
      ])
      res.json(true)
    },

    async ['bucket/sync'](req, res) {
      const session = SessionHandler(req.session)
      const credId = session.getLoggedInCredentialId()
      const buckId = session.getLoggedInBucketId()
      const userId = session.getLoggedInUserId()

      // We don't have trigger happy users from queueing up
      // a ton of manual syncs back to back. This will enforce
      // a minumum 10 minute delay between manual syncs per bucket.
      const canManualSync = await redis.client.set(
        `chest.store_manual_sync_${buckId}`,
        'true',
        'NX',
        'EX',
        60 * 10
      ) // 10 min

      if (!canManualSync)
        return res.status(400).json({
          error: `This bucket was recently synced. Please wait up to 10 minutes before trying to manually sync again.`,
        })

      await BackgroundWorker({ redis }).enqueue('providerSyncObjects', {
        bucketId: buckId,
        credentialId: credId,
        userId: userId,
      })

      res.json(true)
    },
  }
}
