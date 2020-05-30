const passport = require('passport')
const SessionHandler = require('../libs/SessionHandler').default

export default function AuthDropbox(options: IFactoryOptions) {
  return {
    priority: 0,
    verb: 'GET',
    route: '/auth/dropbox',
    handler: [
      (req: StringMap, res: StringMap, next: (err?: Error) => void) => {
        const session = SessionHandler(req.session)
        const userId = session.getLoggedInUserId()
        if (!userId) {
          options.log.error(`No user ID when trying dropbox authentication`)
          return res.redirect(req.headers.referer || '/')
        }

        next()
      },
      passport.authenticate('dropbox'),
    ],
  }
}
