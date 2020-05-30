import IError from './IError'

export default class AccountDisabled extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, AccountDisabled)

    this.redirectRoute = '/autherror/disabled'
  }
}
