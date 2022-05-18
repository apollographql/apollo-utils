import { ASTNode, print } from "graphql";
import { isNode } from "graphql/language/ast";

export const astSerializer = {
  test(value: any) {
    return isNode(value);
  },

  serialize(value: ASTNode): string {
    return print(value);
  },
};
