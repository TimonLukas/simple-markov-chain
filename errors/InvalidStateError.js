module.exports = class InvalidStateError extends Error {
  constructor (...args) {
    super(...args)
    Error.captureStackTrace(this, InvalidStateError)
  }
}
