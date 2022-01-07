import {
  DocumentNode,
  FloatValueNode,
  IntValueNode,
  StringValueNode,
  visit,
} from "graphql";
// In the same spirit as the similarly named `hideLiterals` function, only
// hide sensitive (string and numeric) literals.
export function stripSensitiveLiterals(ast: DocumentNode): DocumentNode {
  return visit(ast, {
    IntValue(node): IntValueNode {
      return { ...node, value: "0" };
    },
    FloatValue(node): FloatValueNode {
      return { ...node, value: "0" };
    },
    StringValue(node): StringValueNode {
      return { ...node, value: "", block: false };
    },
  });
}
