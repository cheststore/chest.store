import IError from './IError'

export default class PasswordsNotMatch extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, PasswordsNotMatch)

    this.redirectRoute = '/autherror/passwordsdonotmatch'
  }
}
