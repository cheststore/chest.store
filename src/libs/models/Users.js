import DatabaseModel from './DatabaseModel'
import Encryption from '../Encryption'
import SessionHandler from '../SessionHandler'

export default function Users(postgres, session = null) {
  const factoryToExtend = DatabaseModel(postgres, 'users')
  const sessionHandler = SessionHandler(session)

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'username',
      'password_hash',
      'email_address',
      'first_name',
      'last_name',
      'current_credential_id',
      'current_bucket_id',
      'last_login',
      'two_factor_enabled',
      'two_factor_secret',
    ],

    async generateAndSaveVerificationCode(userId, isVerified = false) {
      this.setRecord({
        id: userId,
        is_verified: !!isVerified,
        verification_code: this.generateVerificationCode(),
      })
      return await this.save()
    },

    async validateUserPassword(
      username,
      plainPassword,
      hashedPasswordToCheck = null
    ) {
      if (hashedPasswordToCheck)
        return await Encryption.comparePassword(
          plainPassword,
          hashedPasswordToCheck
        )

      const record = await this.findBy({ username })
      if (record) {
        const pwHash = record.password_hash
        return await Encryption.comparePassword(plainPassword, pwHash)
      }

      throw new Error(`No user with username: ${username}`)
    },

    async hashPassword(plainPassword) {
      return await Encryption.hashPassword(plainPassword)
    },

    generateTempPassword(length = 18) {
      const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const newPw = new Array(length)
        .fill(0)
        .map((v) =>
          possible.charAt(Math.floor(Math.random() * possible.length))
        )
        .join('')

      return newPw
    },

    async setSession(object, sessionObj = session, persistSession = true) {
      return await sessionHandler.setSession(object, sessionObj, persistSession)
    },

    isLoggedIn() {
      if (session && session.toString() === '[object Object]') {
        if (Object.keys(session.user || {}).length > 0) return true
      }
      return false
    },

    async login(userObject = this.record) {
      if (session) {
        session.user = session.user || {}
        userObject = Object.assign(session.user, userObject || {})
        return await sessionHandler.setSession({ user: userObject })
      }
      return false
    },

    async logout(nullifySession = true) {
      return await new Promise((resolve, reject) => {
        if (session) {
          return session.destroy((err) => {
            if (err) return reject(err)

            // if (nullifySession)
            //   session = null

            resolve(true)
          })
        }

        resolve(false)
      })
    },
  })
}
