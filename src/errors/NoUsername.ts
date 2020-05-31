import IError from './IError'

export default class NoUsername extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, NoUsername)

    this.redirectRoute = '/autherror/nousername'
  }
}
