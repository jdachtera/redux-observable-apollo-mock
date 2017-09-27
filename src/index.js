const EventEmitter = require("events");

import configureMockStore from "redux-mock-store";
import { ApolloClient } from "react-apollo";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
import { mockNetworkInterfaceWithSchema } from "apollo-test-utils";
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

const createNetworkInterface = schema => {
  const networkInterfaceMock = mockNetworkInterfaceWithSchema({ schema });
  const promises = [];

  return {
    query: (...args) => {
      const promise = networkInterfaceMock.query(...args);
      promises.push(promise);
      return promise;
    },
    flush: () => Promise.all(promises)
  };
};

export default (typeDefs, rootEpic, initialState, apolloMocks) => {
  const reduxInterceptor = createReduxActionInterceptor();

  const schema = createMockSchema(typeDefs, apolloMocks);

  const networkInterface = createNetworkInterface(schema);

  const apolloClient = new ApolloClient({
    networkInterface
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
  const flush = () => networkInterface.flush();

  return {
    ...store,
    dispatch,
    flush,
    expectActionToBeDispatched,
    expectActionToBeNotDispatched
  };
};
