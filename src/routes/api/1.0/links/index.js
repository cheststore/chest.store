import SessionHandler from '../../../../libs/SessionHandler'
import AuditLog from '../../../../libs/models/AuditLog'
import FileLinks from '../../../../libs/models/FileLinks'
import GitRepos from '../../../../libs/models/GitRepos'
import CloudObjects from '../../../../libs/models/CloudObjects'
import config from '../../../../config'

export default function ({ log, postgres, redis }) {
  return {
    async ['entity/get'](req, res) {
      const session = SessionHandler(req.session)
      const fileLinks = FileLinks(postgres)
      let allBucketIds = session.getAllBucketIds()
      const { entityTable, entityId, path } = req.query

      let links = await fileLinks.getAllBy({
        bucket_id: allBucketIds,
        entity_table: entityTable,
        entity_id: entityId,
      })

      if (path) links = links.filter((l) => l.entity_identifying_info === path)

      res.json({ links })
    },

    async ['entity/create'](req, res) {
      const session = SessionHandler(req.session)
      const fileLinks = FileLinks(postgres)
      const userId = session.getLoggedInUserId()
      let allBucketIds = session.getAllBucketIds()
      const {
        id,
        entityTable,
        entityId,
        extraIdentifyingInfo,
        password,
        expiration,
      } = req.body

      let bucketId
      switch (entityTable) {
        case 'git_repos': {
          const repo = await GitRepos(postgres).findBy({
            bucket_id: allBucketIds,
            id: entityId,
          })
          if (!repo)
            return res
              .status(404)
              .json({ error: `We can't find the repository.` })

          bucketId = repo.bucket_id
          break
        }
        case 'cloud_objects': {
          const obj = await CloudObjects(postgres).findBy({
            bucket_id: allBucketIds,
            id: entityId,
          })
          if (!obj)
            return res.status(404).json({ error: `We can't find the object.` })

          bucketId = obj.bucket_id
          break
        }
        default:
          return res
            .status(400)
            .json({ error: `You cannot create a link to this entity.` })
      }

      if (id) {
        const link = await fileLinks.find(id)
        if (!link)
          return res
            .status(404)
            .json({ error: `We can't find the link to update.` })
        fileLinks.setRecord(link)
      }

      fileLinks.setRecord({
        bucket_id: bucketId,
        entity_table: entityTable,
        entity_id: entityId,
        entity_identifying_info:
          extraIdentifyingInfo || fileLinks.record.entity_identifying_info,
        expiration_date:
          typeof expiration !== 'undefined'
            ? expiration
            : fileLinks.record.expiration_date,
        password:
          typeof password !== 'undefined'
            ? password
            : fileLinks.record.password,
      })
      const newId = await fileLinks.save()

      await AuditLog(postgres).log({
        // credential_id: cred.id,
        user_id: userId,
        entity_table: 'file_links',
        entity_id: newId,
        action: `File Links - File Link Created/Updates`,
        additional_info: req.body,
      })

      res.json({ id: newId })
    },

    async ['delete'](req, res) {
      const session = SessionHandler(req.session)
      const fileLinks = FileLinks(postgres)
      const userId = session.getLoggedInUserId()
      const allBucketIds = session.getAllBucketIds()
      const { id } = req.body

      const link = await fileLinks.findBy({
        bucket_id: allBucketIds,
        id,
      })
      if (!link)
        return res
          .status(404)
          .json({ error: `We can't find the link to update.` })
      fileLinks.setRecord(link)

      await Promise.all([
        fileLinks.delete(),
        AuditLog(postgres).log({
          // credential_id: cred.id,
          user_id: userId,
          entity_table: 'file_links',
          entity_id: id,
          action: `File Links - File Link Deleted`,
          additional_info: {},
        }),
      ])

      res.json(true)
    },
  }
}
