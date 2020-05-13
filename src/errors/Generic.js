export default class Generic extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, Generic)

    this.redirectRoute = '/autherror/generic'
  }
}
