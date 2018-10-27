module.exports = class InvalidArgumentError extends Error {
  constructor (...args) {
    super(...args)
    Error.captureStackTrace(this, InvalidArgumentError)
  }
}
