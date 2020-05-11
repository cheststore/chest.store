import SessionHandler from '../../../../libs/SessionHandler'
import CloudObjects from '../../../../libs/models/CloudObjects'
import config from '../../../../config'

export default function({ postgres }) {
  return {
    async ['list'](req, res) {
      const session = SessionHandler(req.session)
      const objects = CloudObjects(postgres)
      const buckId  = session.getLoggedInBucketId()
      const {
        page,
        perPage
      } = req.query

      const info = await objects.getObjectsInBucket(buckId, page, perPage)
      res.json(info)
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