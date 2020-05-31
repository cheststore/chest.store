import IError from './IError'

export default class NoPassword extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, NoPassword)

    this.redirectRoute = '/autherror/nopassword'
  }
}
