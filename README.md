# simple-markov-chain
Markov chains are useful utilities for modelling behaviour which follows the Markov property:

> In probability theory and statistics, the term Markov property refers to the memoryless property of a stochastic process.

> A stochastic process has the Markov property if the conditional probability distribution of future states of the process (conditional on both past and present states) depends only upon the present state, not on the sequence of events that preceded it.

(from [Wikipedia](https://en.wikipedia.org/wiki/Markov_property))

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  * [`constructor(isStrict = false)`](#constructorisstrict--false)
  * [`addTransition(from, to)`](#addtransitionfrom-to)
  * [`generateState(initialState = null)`](#generatestateinitialstate--null)
  * [`transitionMatrix`](#transitionmatrix)
  * [`save()`](#save)
  * [`#load()`](#%23load)

## Installation
```shell
npm install simple-markov-chain
```

## Usage

```javascript
const MarkovChain = require('simple-markov-chain')

const chain = new MarkovChain()
chain.addTransition('a', 'b') // Transition from state 'a' to state 'b'
chain.addTransition('a', 'c') // Transition from state 'a' to state 'c'
chain.addTransition('b', 'a')
chain.addTransition('c', 'a')

chain.generateState('a') // 50% chance to return 'b', 50% chance to return 'c'
chain.generateState() // Will take last generated state as base state => either 'b' or 'c' => will return 'a'
chain.generateState() // Last generated state was 'a' => 50% chance for 'b', 50% chance for 'c'
// ...
```

## API
All `Error` classes (`EmptyChainError`, `InvalidArgumentError`, `InvalidStateError`) are exposed through `MarkovChain.errors`.
### `constructor(isStrict = false)`
Creates a new Markov chain.

### `addTransition(from, to)`
```javascript
chain.addTransition('a', 'b')
chain.addTransition('b', 3)
chain.addTransition(3, 'foobar')
chain.addTransition('foobar', 'a')
```
This methods adds a new transition to the internal transition memory. `from` and `to` are both converted to strings.

### `generateState(initialState = null)`
```javascript
chain.generateState()
chain.generateState('foobar')
```
This method will generate a new state based on the transition matrix calculated from the added states.

If `initialState` is supplied, it is used as the basis for the state generation.  
If it is not supplied, the last generated state will be used.  
If no state has been generated so far, a random one will be picked from the `from` states.

In the event that a new state is being generated and the initial state has no `to` states, behaviour changes based on `isStrict`:  
If `isStrict === false` a random `from` state will be returned.  
If `isStrict === true` an `InvalidStateError` will be thrown.

If this method is called while no states have been added, an `EmptyChainError` will be thrown.

### `transitionMatrix`
If you want to access the transition matrix, you can do it like this:
```javascript
chain.transitionMatrix
```

With the states added above, this would return the following structure:
```json
{
  "a": {
    "b": 0.5,
    "c": 0.5
  },
  "b": {
    "a": 1
  },
  "c": {
    "a": 1
  }
}
```
The transition matrix is only calculated when the states have been modified (through the API) and it is then requested, making it a very efficient operation.

### `save()`
```javascript
const data = chain.save()
```

This will return a JSON string representing the current matrix (and its' current state).

It persists the added states as well as the last generated state. This means that you can easily load the data and continue adding states if needed.

### `#load()`
```javascript
const chain = MarkovChain.load(data)
```

This will create a new Markov chain based on the specified serialized data.