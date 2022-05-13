// Replace numeric, string, list, and object literals with "empty" values.
// Leaves enums alone (since there's no consistent "zero" enum). This can help
// combine similar queries if you substitute values directly into queries rather
// than use GraphQL variables, and can hide sensitive data in your query (say, a
// hardcoded API key) from Apollo's servers, but in general avoiding those
// situations is better than working around them.
import {
  DocumentNode,
  FloatValueNode,
  IntValueNode,
  ListValueNode,
  ObjectValueNode,
  StringValueNode,
  visit,
} from "graphql";

export function hideLiterals(ast: DocumentNode): DocumentNode {
  return visit(ast, {
    IntValue(node: IntValueNode): IntValueNode {
      return { ...node, value: "0" };
    },
    FloatValue(node: FloatValueNode): FloatValueNode {
      return { ...node, value: "0" };
    },
    StringValue(node: StringValueNode): StringValueNode {
      return { ...node, value: "", block: false };
    },
    ListValue(node: ListValueNode): ListValueNode {
      return { ...node, values: [] };
    },
    ObjectValue(node: ObjectValueNode): ObjectValueNode {
      return { ...node, fields: [] };
    },
  });
}
