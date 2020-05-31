import IError from './IError'

export default class InvalidVerificationCode extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, InvalidVerificationCode)

    this.redirectRoute = '/autherror/invalidverifcode'
  }
}
