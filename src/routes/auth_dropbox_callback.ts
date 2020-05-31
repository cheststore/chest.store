const passport = require('passport')
const LoginHandler = require('../libs/LoginHandler').default
const SessionHandler = require('../libs/SessionHandler').default

export default function AuthDropboxCallback({
  log,
  postgres,
}: IFactoryOptions) {
  return {
    priority: 0,
    verb: 'GET',
    route: '/auth/dropbox/callback',
    handler: [
      (req: StringMap, res: StringMap, next: (err?: Error) => void): void => {
        passport.authenticate('dropbox', async function (
          err: null | Error
        ): Promise<void> {
          try {
            if (err) return next(err)

            const session = SessionHandler(req.session)
            const login = LoginHandler(postgres, req, { log })
            const user = session.getLoggedInUserId(true)
            await login.standardLogin(user, true)
            return res.redirect('/profile')
          } catch (err) {
            next(err)
          }
        })(req, res, next)
      },
    ],
  }
}
