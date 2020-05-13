import passport from 'passport'
import Errors from '../errors'
// import SessionHandler from '../libs/SessionHandler'

export default function() {
  return {
    priority: 0,
    verb: 'POST',
    route: '/auth/local',
    handler: [
      (req, res, next) => {
        const {
          username,
          password
        } = req.body
        if (!(username && password))
          throw new Errors.Generic(`Bad username or password`)

        next()
      },
      passport.authenticate("local"),
      (req, res) => {
        // const session = SessionHandler(req.session)
        // const userRecord = session.getLoggedInUserId(true)
        // if (userRecord && userRecord.two_factor_enabled && !req.session.two_factor_authenticated)
        //   return res.redirect('/mfa')
    
        res.redirect('/')
      }
    ]
  }
}
