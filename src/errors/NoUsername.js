export default class NoUsername extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, NoUsername)

    this.redirectRoute = '/autherror/nousername'
  }
}
