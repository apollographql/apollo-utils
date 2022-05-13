// removeAliases gets rid of GraphQL aliases, a feature by which you can tell a
// server to return a field's data under a different name from the field name.
// Maybe this is useful if somebody somewhere inserts random aliases into their
// queries.

import { DocumentNode, FieldNode, visit } from "graphql";

export function removeAliases(ast: DocumentNode): DocumentNode {
  return visit(ast, {
    Field(node: FieldNode): FieldNode {
      const { alias, ...rest } = node;
      return rest;
    },
  });
}
