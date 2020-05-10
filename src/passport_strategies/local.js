import PassportLocal from 'passport-local'
import Users from '../libs/models/Users'
import Errors from '../errors'
import LoginHandler from '../libs/LoginHandler'
// import config from '../config'

const LocalStrategy = PassportLocal.Strategy
const NOOP = () => {}

export default function LocalPassportStrategy({ log, postgres, redis }) {
  return {
    strategy: LocalStrategy,
    options: {
      passReqToCallback: true
    },
    handler: async function PassportLocalHandler(
      req,
      username,
      password,
      done=null,
      createNewUser=false
    ) {
      try {
        done = done || NOOP
        const users   = Users(postgres, req.session)
        const login   = LoginHandler(postgres, req, { log })

        username = username.toLowerCase()
        let userRecord = await users.findBy({ username })
        if (userRecord) {
          // If the user has tried to login 3 times unsuccessfully, presumably
          // due to an incorrect password each time, require them to wait
          // up to 5 minutes to retry. This will prevent bots from trying
          // to login as another user with a script.
          const badPasswordKey  = `incorrect_password_${username}`
          const currentBadCount = await redis.get(badPasswordKey)
          if (currentBadCount && currentBadCount > 3)
            throw new Errors.IncorrectPasswordTooManyTries(`You've tried your password incorrectly too many times.`)

          if (!userRecord.password_hash)
            throw new Errors.NoPassword(`No password yet.`)

          if (!password)
            throw new Errors.IncorrectPassword(`Bad password.`)

          if (!(await users.validateUserPassword(username, password, userRecord.password_hash))) {
            const pipeline = redis.client.pipeline().incr(badPasswordKey).expire(badPasswordKey, 60 * 5)
            await pipeline.exec()

            throw new Errors.IncorrectPassword(`Bad password.`)
          }

        } else {
          // ----------------------------------------------------------------
          // TODO: 2019-02-06: Right now we don't want someone without
          // a user record to sign up without being invited.
          if (!createNewUser)
            throw new Errors.NoUsername('No username found.')
          // ----------------------------------------------------------------

          // Confirm username is valid e-mail address
          // if(!Utilities.Regexp.email.test(username))
          //   throw new Errors.InvalidEmailAddress(`Invalid email format.`)
          // if (!users.passwordHasMinimumRequirements(password))
          //   throw new Errors.PasswordNotValid(`Does not meet minimum requirements.`)

          userRecord = await users.findOrCreateBy({ username })
          users.setRecord({ password_hash: await users.hashPassword(password) }, true)
        }

        users.setRecord({
          id: userRecord.id,
          last_login: new Date()
        }, true)
        await users.save()

        await login.standardLogin({ ...userRecord, ...users.record })
        return done(null, username)

      } catch(err) {
        done(err)
        throw err
      }
    }
  }
}
