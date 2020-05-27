export default function SessionHandler(session) {
  return {
    getLoggedInUserId(fullRecord = false) {
      if (session && session.user)
        return fullRecord ? session.user : session.user.id

      return null
    },

    getLoggedInBucketId(fullRecord = false) {
      if (session && session.current_bucket)
        return fullRecord ? session.current_bucket : session.current_bucket.id

      return null
    },

    getLoggedInCredentialId(fullRecord = false) {
      if (session && session.current_credential)
        return fullRecord
          ? session.current_credential
          : session.current_credential.id

      return null
    },

    getAllBucketIds(fullRecord = false) {
      if (session && session.buckets)
        return fullRecord
          ? session.buckets
          : Object.values(session.buckets).map((c) => c.id)

      return null
    },

    getAllCredentialIds(fullRecord = false) {
      if (session && session.credentials)
        return fullRecord
          ? session.credentials
          : Object.values(session.credentials).map((c) => c.id)

      return null
    },

    getSessionId() {
      if (!session) return null

      return session.id
    },

    getClientIp(req, socket = null) {
      if (!(req && req.headers)) return null

      const socketHandshakeAdd = ((socket || {}).handshake || {}).address
      const realClientIpAddress = (
        req.headers['x-forwarded-for'] ||
        req.ip ||
        socketHandshakeAdd ||
        ''
      ).split(',')
      return realClientIpAddress[realClientIpAddress.length - 1]
    },

    async setSession(object, sessionObj = session) {
      return await new Promise(async (resolve, reject) => {
        try {
          if (object && sessionObj) {
            for (var _key in object) {
              if (
                object[_key] &&
                typeof object[_key] === 'object' &&
                object[_key].toString() === '[object Object]'
              ) {
                sessionObj[_key] = sessionObj[_key] || {}
                await this.setSession(object[_key], sessionObj[_key])
              } else {
                sessionObj[_key] = object[_key]
              }
            }

            return session.save((err) => {
              if (err) return reject(err)
              resolve(true)
            })
          }
          resolve(false)
        } catch (err) {
          reject(err)
        }
      })
    },
  }
}
