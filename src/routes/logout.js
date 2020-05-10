import Users from '../libs/models/Users'
// import config from '../config'

export default function() {
  return {
    priority: 0,
    verb: 'GET',
    route: '/logout',
    handler: async function Index(req, res) {
      await Users(null, req.session).logout()
      req.logout()
      res.redirect("/login")
    }
  }
}