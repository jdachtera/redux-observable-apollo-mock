import { ApolloLink } from "apollo-link";
import { SchemaLink } from "apollo-link-schema";

const createMockLink = schema => {
  const schemaLink = new SchemaLink({ schema });
  const promises = [];

  const waitLink = new ApolloLink((operation, forward) => {
    const res = forward(operation);
    promises.push(
      new Promise(resolve => res.map(data => process.nextTick(resolve) && data))
    );
    return res;
  });

  return {
    link: waitLink.concat(schemaLink),
    flush: () => Promise.all(promises)
  };
};

export default createMockLink;
