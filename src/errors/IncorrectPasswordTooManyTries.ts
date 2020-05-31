import IError from './IError'

export default class IncorrectPasswordTooManyTries extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, IncorrectPasswordTooManyTries)

    this.redirectRoute = '/autherror/incorrectpasswordtoomanytries'
  }
}
