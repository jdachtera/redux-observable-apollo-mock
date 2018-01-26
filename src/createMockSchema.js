import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';

const createMockSchema = (typeDefs, mocks) => {
  const schema = makeExecutableSchema({ typeDefs });

  addMockFunctionsToSchema({ schema, mocks });
  return schema;
};

export default createMockSchema;
