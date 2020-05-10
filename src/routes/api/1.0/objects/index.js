import SessionHandler from '../../../../libs/SessionHandler'
import CloudObjects from '../../../../libs/models/CloudObjects'
import config from '../../../../config'

export default function({ io, log, postgres, redis }) {
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
    }
  }
}