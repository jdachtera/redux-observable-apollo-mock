import setupReduxApolloStore from ".";
import "rxjs/add/operator/mergeMap";

import { Observable } from "rxjs";

import gql from "graphql-tag";

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const REQUEST = "REQUEST";
const RESPONSE = "RESPONSE";

const exampleEpic = (action$, store, { apolloClient }) =>
  action$
    .ofType(REQUEST)
    .mergeMap(() =>
      apolloClient.query({
        query: gql`
          query ExampleQuery {
            hello
          }
        `
      })
    )
    .mergeMap(response =>
      Observable.of({
        type: RESPONSE,
        value: {
          apollo: response.data.hello,
          redux: store.getState().hello
        }
      })
    );

const createStore = (initialState, apolloMocks) =>
  setupReduxApolloStore(typeDefs, exampleEpic, initialState, apolloMocks);

describe("testExampleEpic", () => {
  test("expects epic to emit RESPONSE action with mocked values from apollo-client and redux", async () => {
    const store = createStore(
      {
        hello: "redux"
      },
      {
        Query: () => ({
          hello: "apollo"
        })
      }
    );
    const action1 = { type: REQUEST };

    store.dispatch(action1);

    await store.expectActionToBeDispatched(RESPONSE);

    expect(store.getActions()).toEqual([
      { type: "REQUEST" },
      {
        type: "RESPONSE",
        value: { apollo: "apollo", redux: "redux" }
      }
    ]);
  });
});
