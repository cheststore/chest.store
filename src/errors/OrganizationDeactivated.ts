import IError from './IError'

export default class OrganizationDeactivated extends IError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, OrganizationDeactivated)

    this.redirectRoute = '/autherror/orgdeactivated'
  }
}
