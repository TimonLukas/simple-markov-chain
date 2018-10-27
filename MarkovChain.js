const {
  EmptyChainError,
  InvalidStateError,
  InvalidArgumentError
} = require('./errors')

const {
  randomElementFromArray
} = require('./util')

const MarkovChain = class MarkovChain {
  constructor (isStrict = false) {
    this.isStrict = isStrict
    this._transitionMatrix = {}
    this._isDirty = false
    this._stateTransitions = {}
    this._lastState = null
  }

  _calculateTransitionMatrix () {
    return Object.keys(this._stateTransitions).reduce((matrix, key) => {
      const transitions = this._stateTransitions[key]
      const sum = Object.values(transitions).reduce((acc, val) => acc + val, 0)
      matrix[key] = Object.keys(transitions).reduce((acc, val) => {
        acc[val] = transitions[val] / sum
        return acc
      }, {})
      return matrix
    }, {})
  }

  get transitionMatrix () {
    if (this._isDirty) {
      this._transitionMatrix = this._calculateTransitionMatrix()
      this._isDirty = false
    }

    return this._transitionMatrix
  }

  addTransition (from, to) {
    if (typeof (from) === 'undefined') {
      throw new InvalidArgumentError('The from state may not be undefined!')
    }

    if (typeof (to) === 'undefined') {
      throw new InvalidArgumentError('The to state may not be undefined!')
    }

    if (typeof (this._stateTransitions[from]) === 'undefined') {
      this._stateTransitions[from] = {}
    }

    if (typeof (this._stateTransitions[from][to]) === 'undefined') {
      this._stateTransitions[from][to] = 0
    }

    this._stateTransitions[from][to] += 1
    this._isDirty = true
  }

  generateState (initialState = null) {
    if (Object.keys(this.transitionMatrix).length === 0) {
      throw new EmptyChainError('No states present!')
    }

    const from = (() => {
      if (initialState !== null) {
        return initialState
      }

      if (this._lastState !== null) {
        return this._lastState
      }

      return randomElementFromArray(Object.keys(this._stateTransitions))
    })()

    if (
      typeof (this.transitionMatrix[from]) === 'undefined' ||
      Object.keys(this.transitionMatrix[from]).length === 0
    ) {
      if (this.isStrict) {
        throw new InvalidStateError(`State '${from}' has no transitions to other states!`)
      }

      this._lastState = randomElementFromArray(Object.keys(this._stateTransitions))
      return this._lastState
    }

    let probabilityTracker = Math.random()
    for (const key of Object.keys(this.transitionMatrix[from])) {
      probabilityTracker -= this.transitionMatrix[from][key]
      if (probabilityTracker <= 0) {
        this._lastState = key
        return key
      }
    }
  }

  save () {
    return JSON.stringify({
      stateTransitions: this._stateTransitions,
      lastState: this._lastState
    })
  }

  static load (data, isStrict) {
    const chain = new MarkovChain(isStrict)
    try {
      const parsed = JSON.parse(data)

      if (typeof (parsed.stateTransitions) === 'undefined' || typeof (parsed.lastState) === 'undefined') {
        throw new InvalidArgumentError('Serialized fields are missing!')
      }

      chain._stateTransitions = parsed.stateTransitions
      chain._lastState = parsed.lastState
      return chain
    } catch (error) {
      throw new InvalidArgumentError(error.message)
    }
  }
}

MarkovChain.errors = require('./errors')
module.exports = MarkovChain
