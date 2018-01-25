# redux-apollo-mock-store
Helper for tests to mock data in redux store and apollo-client

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
