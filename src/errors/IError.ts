export default class IError extends Error {
  public redirectRoute: string = '/'

  constructor(...args: any[]) {
    super(...args)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, IError.prototype)
  }
}
