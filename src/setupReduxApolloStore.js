import configureMockStore from "redux-mock-store";
import { ApolloClient } from "apollo-client";
import { createEpicMiddleware } from "redux-observable";
import { InMemoryCache } from "apollo-cache-inmemory";

import createReduxActionInterceptor from "./createReduxActionInterceptor";
import createMockSchema from "./createMockSchema";
import createMockLink from "./createMockLink";

const setupReduxApolloStore = (
  typeDefs,
  rootEpic,
  initialState,
  apolloMocks
) => {
  const reduxInterceptor = createReduxActionInterceptor();

  const schema = createMockSchema(typeDefs, apolloMocks);

  const { link, flush } = createMockLink(schema);
  const cache = new InMemoryCache({});

  const apolloClient = new ApolloClient({
    cache,
    link
  });

  const epicMiddleware = createEpicMiddleware(rootEpic, {
    dependencies: {
      apolloClient
    }
  });

  const store = configureMockStore([
    reduxInterceptor.middleware,
    epicMiddleware
  ])(initialState);

  const expectActionToBeDispatched = (actionType, timeout) =>
    reduxInterceptor.waitForAction(actionType, timeout);

  const expectActionToBeNotDispatched = (actionType, timeout) =>
    reduxInterceptor.waitForAction(actionType, timeout).then(
      () => {
        throw new Error(`Action ${actionType} was dispatched unexpectedly.`);
      },
      () => {}
    );

  const dispatch = (...args) => process.nextTick(() => store.dispatch(...args));

  return {
    ...store,
    dispatch,
    flush,
    expectActionToBeDispatched,
    expectActionToBeNotDispatched
  };
};

export default setupReduxApolloStore;
