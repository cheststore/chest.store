import { addToRoom } from './index'
import SessionHandler from '../libs/SessionHandler'

export default function Global({ app, socket, log, io, postgres, redis }) {
  const req = socket.request
  const session = SessionHandler(req.session, { redis })

  return {
    async globalSubscribe(pagePath) {
      const bucketId = session.getLoggedInBucketId()
      const credId = session.getLoggedInCredentialId()
      const userRecord = session.getLoggedInUserId(true)
      const loggedIn = !!userRecord
      socket.emit('isLoggedIn', userRecord)

      await app.set('socketPage', socket.id, {
        date: new Date(),
        page: pagePath,
      })

      if (loggedIn) {
        await addToRoom(app, socket, `page_${pagePath}`)
        await addToRoom(app, socket, `bucket_${bucketId}`)
        await addToRoom(app, socket, `credential_${credId}`)
        await addToRoom(app, socket, `user_${userRecord.id}`)
      }
    },

    async globalUpdatePagePath(pagePath) {
      const userRecord = session.getLoggedInUserId(true)
      const loggedIn = !!userRecord
      await app.set('socketPage', socket.id, {
        date: new Date(),
        page: pagePath,
      })

      if (loggedIn) {
        await addToRoom(app, socket, `page_${pagePath}`)
      }
    },
  }
}
