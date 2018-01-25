const EventEmitter = require("events");

import configureMockStore from "redux-mock-store";
import { ApolloClient } from "react-apollo";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
import { createEpicMiddleware } from "redux-observable";

const createReduxActionInterceptor = () => {
  const emitter = new EventEmitter();

  const middleware = store => next => action => {
    emitter.emit(action.type, action);
    return next(action);
  };

  const waitForAction = (type, timeout) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(reject, timeout || 10);
      emitter.once(type, action => {
        clearTimeout(timer);
        resolve(action);
      });
    });

  return { middleware, waitForAction };
};

const createMockSchema = (typeDefs, mocks) => {
  const schema = makeExecutableSchema({ typeDefs });

  addMockFunctionsToSchema({ schema, mocks });
  return schema;
};



const createNetworkLink = schema => {
  const networkInterfaceMock = new SchemaLink({ schema });
  // Set up a custom link which will resolve a promise after all
  // pending requests are fulfilled. This way we can wait for apollo-client
  // to finish in the tests

  let resolveApolloPromise;

  const apolloPromise = new Promise(resolve => {
    resolveApolloPromise = resolve;
  });

  let numberOfRequests = 0;

  const waitLink = new ApolloLink((operation, forward) => {
    numberOfRequests += 1;

    return forward(operation).map(data => {
      numberOfRequests -= 1;
      if (!numberOfRequests) {
        resolveApolloPromise();
      }

      return data;
    });
  });

  return {
    link: networkInterfaceMock.concat(waitLink),
    flush: () => resolveApolloPromise
  };


};

export default (typeDefs, rootEpic, initialState, apolloMocks) => {
  const reduxInterceptor = createReduxActionInterceptor();

  const schema = createMockSchema(typeDefs, apolloMocks);

  const { link, flush } = createNetworkLink(schema);

  const apolloClient = new ApolloClient({
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
