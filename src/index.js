import configureMockStore from 'redux-mock-store';
import { ApolloClient } from 'apollo-client';
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';
import { createEpicMiddleware } from 'redux-observable';
import { ApolloLink } from 'apollo-link';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import EventEmitter from 'events';

const createReduxActionInterceptor = () => {
  const emitter = new EventEmitter();

  const middleware = () => next => action => {
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

const createMockLink = schema => {
  const schemaLink = new SchemaLink({ schema });
  const promises = [];

  const waitLink = new ApolloLink((operation, forward) => {
    let res;
    promises.push(new Promise((resolve) => {
      res = forward(operation).map(data => {
        resolve();
        return data;
      });
    }));
    return res;
  });

  return {
    link: waitLink.concat(schemaLink),
    flush: () => Promise.all(promises),
  };
};

export default (typeDefs, rootEpic, initialState, apolloMocks) => {
  const reduxInterceptor = createReduxActionInterceptor();

  const schema = createMockSchema(typeDefs, apolloMocks);

  const { link, flush } = createMockLink(schema);
  const cache = new InMemoryCache({});

  const apolloClient = new ApolloClient({
    cache,
    link,
  });

  const epicMiddleware = createEpicMiddleware(rootEpic, {
    dependencies: {
      apolloClient,
    },
  });

  const store = configureMockStore([
    reduxInterceptor.middleware,
    epicMiddleware,
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
    expectActionToBeNotDispatched,
  };
};
