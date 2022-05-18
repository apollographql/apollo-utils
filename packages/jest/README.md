# Jest utilities

This package represents a collection of useful jest-specific testing utilities employed by Apollo.

## astSerializer

For snapshot testing in graphql, seeing the printed document is a concise and human-readable approach to validating AST objects. Installing this serializer means that all GraphQL document ASTs will be printed into the snapshot using the `graphql-js` `print` function rather than printing out the entire AST object (which would be the default behavior).