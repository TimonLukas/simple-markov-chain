/* eslint-env node, mocha */

const chai = require('chai')
const { expect } = chai

const MarkovChain = require('./../MarkovChain')
const {
  EmptyChainError,
  InvalidArgumentError,
  InvalidStateError
} = require('./../errors')

describe('MarkovChain', () => {
  describe('#constructor', () => {
    it('should initialize with empty values', (done) => {
      const chain = new MarkovChain()
      expect(chain.transitionMatrix).to.deep.equal({})
      expect(chain._isDirty).to.equal(false)
      expect(chain._stateTransitions).to.deep.equal({})

      done()
    })
  })

  describe('#addTransition', () => {
    it('should throw an error when trying to add transitions with invalid states', (done) => {
      const chain = new MarkovChain()

      expect(() => chain.addTransition(undefined, 'b')).to.throw(InvalidArgumentError)
      expect(() => chain.addTransition('a')).to.throw(InvalidArgumentError)

      done()
    })

    it('should properly record added state transitions', (done) => {
      const chain = new MarkovChain()

      chain.addTransition('a', 'b')
      expect(chain._stateTransitions).to.deep.equal({
        'a': {
          'b': 1
        }
      })

      chain.addTransition('a', 'b')
      expect(chain._stateTransitions).to.deep.equal({
        'a': {
          'b': 2
        }
      })

      chain.addTransition('b', 'c')
      expect(chain._stateTransitions).to.deep.equal({
        'a': {
          'b': 2
        },
        'b': {
          'c': 1
        }
      })

      done()
    })

    it('should mark the matrix as dirty after adding a new value', (done) => {
      const chain = new MarkovChain()
      expect(chain._isDirty).to.equal(false)

      chain.addTransition('a', 'b')
      expect(chain._isDirty).to.equal(true)

      chain._isDirty = false
      chain.addTransition('a', 'b')
      expect(chain._isDirty).to.equal(true)

      chain._isDirty = false
      chain.addTransition('b', 'a')
      expect(chain._isDirty).to.equal(true)

      done()
    })
  })

  describe('.transitionMatrix', () => {
    it('should generate the correct transition matrix', (done) => {
      const chain = new MarkovChain()

      chain.addTransition('a', 'b')
      expect(chain.transitionMatrix).to.deep.equal({
        'a': {
          'b': 1
        }
      })

      chain.addTransition('a', 'c')
      expect(chain.transitionMatrix).to.deep.equal({
        'a': {
          'b': 0.5,
          'c': 0.5
        }
      })

      chain.addTransition('d', 'e')
      chain.addTransition('d', 'e')
      chain.addTransition('d', 'f')
      expect(chain.transitionMatrix).to.deep.equal({
        'a': {
          'b': 0.5,
          'c': 0.5
        },
        'd': {
          'e': (2 / 3),
          'f': (1 / 3)
        }
      })

      done()
    })

    it('should automatically re-calculate the transition matrix after a new state was added', (done) => {
      const chain = new MarkovChain()

      const step1OldMatrix = chain.transitionMatrix
      chain.addTransition('a', 'b')
      expect(step1OldMatrix).to.not.equal(chain.transitionMatrix)

      const step2OldMatrix = chain.transitionMatrix
      chain.addTransition('a', 'b')
      expect(step2OldMatrix).to.not.equal(chain.transitionMatrix)

      const step3OldMatrix = chain.transitionMatrix
      chain.addTransition('c', 'd')
      expect(step3OldMatrix).to.not.equal(chain.transitionMatrix)

      done()
    })
  })

  describe('#generateState', () => {
    const random = Math.random

    beforeEach((done) => {
      Math.random = function () {
        this.counter += 1

        switch (this.counter) {
          case 0:
            return 0
          case 1:
            return 0.25
          case 2:
            return 0.5
          case 3:
            return 0.75
        }
      }.bind({ counter: -1 })

      done()
    })

    afterEach((done) => {
      Math.random = random

      done()
    })

    it('should throw an error when trying to generate a value without having states', (done) => {
      const chain = new MarkovChain()
      expect(chain.generateState.bind(chain)).to.throw(EmptyChainError)

      done()
    })

    it('should return a random valid state when trying to transition from an invalid state', (done) => {
      const chain = new MarkovChain()
      chain.addTransition('a', 'b')
      chain.addTransition('b', 'c')
      chain.addTransition('c', 'd')

      expect(chain.generateState('e')).to.equal('a')
      expect(chain.generateState('e')).to.equal('a')
      expect(chain.generateState('e')).to.equal('b')

      done()
    })

    it(`should use a random state as its' base state when no state is supplied and no state was generated so far`, (done) => {
      const chain = new MarkovChain()
      chain.addTransition('a', 'b')
      chain.addTransition('a', 'b')
      chain.addTransition('a', 'c')
      chain.addTransition('a', 'd')
      chain.addTransition('b', 'c')
      chain.addTransition('b', 'a')
      chain.addTransition('c', 'd')
      chain.addTransition('c', 'd')
      chain.addTransition('d', 'a')

      expect(chain.generateState()).to.equal('b')

      done()
    })

    it(`should store its' last generated state, and use that to generate the next one`, (done) => {
      const chain = new MarkovChain()
      chain.addTransition('a', 'b')
      chain.addTransition('a', 'b')
      chain.addTransition('a', 'c')
      chain.addTransition('a', 'd')
      chain.addTransition('b', 'c')
      chain.addTransition('b', 'a')
      chain.addTransition('c', 'd')
      chain.addTransition('c', 'd')
      chain.addTransition('d', 'a')

      expect(chain.generateState('a')).to.equal('b')
      expect(chain._lastState).to.equal('b')
      expect(chain.generateState('a')).to.equal('b')
      expect(chain._lastState).to.equal('b')

      done()
    })

    describe('isStrict = true', () => {
      it('should throw an error when trying to transition from an invalid state', (done) => {
        const chain = new MarkovChain(true)

        chain.addTransition('a', 'b')
        expect(() => chain.generateState('b')).to.throw(InvalidStateError)

        done()
      })
    })
  })

  describe('#save', () => {
    it('should be able to serialize itself', (done) => {
      const chain = new MarkovChain()

      expect(chain.save()).to.equal('{"stateTransitions":{},"lastState":null}')

      chain.addTransition('a', 'b')
      expect(chain.save()).to.equal('{"stateTransitions":{"a":{"b":1}},"lastState":null}')

      expect(chain.generateState('a')).to.equal('b')
      expect(chain.save()).to.equal('{"stateTransitions":{"a":{"b":1}},"lastState":"b"}')

      done()
    })
  })

  describe('#load', () => {
    it('should properly load data from a serialized version', (done) => {
      const chain = MarkovChain.load('{"stateTransitions":{"a":{"b":1}},"lastState":"b"}')
      expect(chain._lastState).to.equal('b')
      expect(chain._stateTransitions).to.deep.equal({ 'a': { 'b': 1 } })

      done()
    })

    it('should throw an error if invalid JSON data is passed into it', (done) => {
      expect(() => MarkovChain.load('invalid')).to.throw(InvalidArgumentError)

      done()
    })

    it('should throw an error if fields are missing in serialized data', (done) => {
      expect(() => MarkovChain.load('{}')).to.throw(InvalidArgumentError)

      done()
    })
  })
})
