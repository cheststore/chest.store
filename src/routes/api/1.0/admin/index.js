// import SessionHandler from '../../../../libs/SessionHandler'
import config from '../../../../config'

export default function ({ io, log, postgres, redis }) {
  return {
    async ['socket/update/clients'](req, res) {
      if (req.cheststoreAuth !== config.app.masterKey)
        return res.status(403).json({ error: config.errors['403'] })

      const {
        bucketId, // specified the bucket room we're updating
        type, // what mutation should we update these users with
      } = req.body

      // io.to(`bucket_${bucketId}`).emit(MUTATION, DATA)

      res.json(true)
    },
  }
}
