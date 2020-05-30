import IError from './IError'

export default class Generic extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, Generic)

    this.redirectRoute = '/autherror/generic'
  }
}
