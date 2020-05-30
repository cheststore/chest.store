import IError from './IError'

export default class PasswordNotValid extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, PasswordNotValid)

    this.redirectRoute = '/autherror/invalidpassword'
  }
}
