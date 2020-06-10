import SessionHandler from '../../../../libs/SessionHandler'
// import AuditLog from '../../../../libs/models/AuditLog'
import config from '../../../../config'

export default function ({ log, postgres, redis }) {
  return {
    async ['list'](req, res) {
      const session = SessionHandler(req.session)
      let buckets = session.getAllBucketIds(true)
      res.json({ buckets })
    },
  }
}
