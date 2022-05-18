import type {
  ASTVisitor,
  DocumentNode,
  FloatValueNode,
  IntValueNode,
  ListValueNode,
  ObjectValueNode,
  StringValueNode,
} from "graphql";
import { visit } from "graphql";

// In the same spirit as the similarly named `hideLiterals` function, only
// hide sensitive (string and numeric) literals.
export function stripSensitiveLiterals(
  ast: DocumentNode,
  hideListAndObjectLiterals: boolean = false,
): DocumentNode {
  const listAndObjectVisitorIfEnabled: ASTVisitor = hideListAndObjectLiterals
    ? {
        ListValue(node: ListValueNode): ListValueNode {
          return { ...node, values: [] };
        },
        ObjectValue(node: ObjectValueNode): ObjectValueNode {
          return { ...node, fields: [] };
        },
      }
    : {};

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
    ...listAndObjectVisitorIfEnabled,
  });
}
