module.exports = class EmptyChainError extends Error {
  constructor (...args) {
    super(...args)
    Error.captureStackTrace(this, EmptyChainError)
  }
}
