# graphQLASTSerializer

For snapshot testing in graphql, seeing the printed document is a concise and human-readable approach to validating AST objects. Installing this serializer means that all GraphQL document ASTs will be printed into the snapshot using the `graphql-js` `print` function rather than printing out the entire AST object (which would be the default behavior).

You can use it in your test files like so:

```ts
import graphQLASTSerializer from "@apollo/utils.jest-graphql-ast-serializer";

expect.addSnapshotSerializer(graphQLASTSerializer);
```
