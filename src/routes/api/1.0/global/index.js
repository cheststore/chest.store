import DropboxStrategy from '../../../../passport/dropbox'
// import config from '../../../../config'

export default function ({ log, postgres, redis }) {
  return {
    ['oauth/bindings/get']({ req, res }) {
      const dropbox = DropboxStrategy({ postgres }).bindCondition()
      res.json({ dropbox })
    },
  }
}
