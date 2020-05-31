import IError from './IError'

export default class UsernameAlreadyExists extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, UsernameAlreadyExists)

    this.redirectRoute = '/autherror/usernamealreadyexists'
  }
}
