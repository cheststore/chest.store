import SessionHandler from '../../../../libs/SessionHandler'
import CloudDirectories from '../../../../libs/models/CloudDirectories'
import CloudObjects from '../../../../libs/models/CloudObjects'
import config from '../../../../config'

export default function({ postgres }) {
  return {
    async ['list'](req, res) {
      const session = SessionHandler(req.session)
      const dir     = CloudDirectories(postgres)
      const objects = CloudObjects(postgres)
      const buckId  = session.getLoggedInBucketId()
      const {
        directoryId,
        page,
        perPage
      } = req.query

      const [ info, directory, directories ] = await Promise.all([
        objects.getObjectsInBucket(buckId, directoryId, page, perPage),
        (async function getDir() {
          if (directoryId)
            return await dir.findBy({ bucket_id: buckId, id: directoryId })
        })(),
        dir.getDirectChildren(buckId, directoryId)
      ])

      res.json({
        objectInfo: info,
        directory,
        directories
      })
    },

    async ['get'](req, res) {
      const session = SessionHandler(req.session)
      const objects = CloudObjects(postgres)
      const buckId  = session.getLoggedInBucketId()
      const objId   = req.query.id

      const object = await objects.findBy({ bucket_id: buckId, id: objId })
      res.json({ object })
    }
  }
}