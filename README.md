# redux-observable-apollo-mock

[![npm version](https://badge.fury.io/js/redux-observable-apollo-mock.svg)](https://badge.fury.io/js/redux-observable-apollo-mock)

Easier testing for `redux-observable` epics that depend on `apollo-client`.

## When to use this

- Your project uses [Apollo Client](https://www.apollographql.com/client/) for managing component GraphQL queries.
- Your project makes use of `redux-observable` [epics](https://redux-observable.js.org/docs/basics/Epics.html).
- You are tired of the boilerplate when testing epics that depend on Apollo data.

## Installation

```
npm i redux-observable-apollo-mock --dev
```

## Usage

```js
import setupReduxApolloStore from 'redux-observable-apollo-mock';

import transactionEpic from './transactionEpic';

/* Import your schema type definitions. Can be all concatenated
types combined with `concatenateTypeDefs()` as well. */
import { typeDefinitions } from '../server/graphql/schema';

import {
  BEGIN_CANCEL_TRANSACTION,
  END_CANCEL_TRANSACTION,
  CLOSE_TRANSACTION_WINDOW
} from '../actions/transaction';

const createStore = (initialState, apolloMocks) =>
  setupReduxApolloStore(typeDefinitions, transactionEpic, initialState, apolloMocks);

describe('transactionEpic', async () => {
  it('should cancel a transaction', async () => {
    const store = createStore({}, {});

    store.dispatch({ type: BEGIN_CANCEL_TRANSACTION });

    await store.expectActionToBeDispatched(CLOSE_TRANSACTION_WINDOW);

    expect(store.getActions()).toEqual([
      { type: BEGIN_CANCEL_TRANSACTION },
      { type: END_CANCEL_TRANSACTION },
      { type: CLOSE_TRANSACTION_WINDOW },
    ]);
  });
});

```
