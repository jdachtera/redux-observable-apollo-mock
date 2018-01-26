import configureMockStore from "redux-mock-store";
import { ApolloClient } from "apollo-client";

import { createEpicMiddleware } from "redux-observable";
import { InMemoryCache } from "apollo-cache-inmemory";

import createReduxActionInterceptor from "./createReduxActionInterceptor";
import createMockSchema from "./createMockSchema";
import createMockLink from "./createMockLink";
import setupReduxApolloStore from "./setupReduxApolloStore";

export {
  createReduxActionInterceptor,
  createMockSchema,
  createMockLink,
  setupReduxApolloStore
};

export default setupReduxApolloStore;
