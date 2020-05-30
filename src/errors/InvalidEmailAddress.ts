import IError from './IError'

export default class InvalidEmailAddress extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, InvalidEmailAddress)

    this.redirectRoute = '/autherror/invalidemail'
  }
}
