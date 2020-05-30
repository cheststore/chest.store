import IError from './IError'

export default class IncorrectPassword extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, IncorrectPassword)

    this.redirectRoute = '/autherror/incorrectpassword'
  }
}
