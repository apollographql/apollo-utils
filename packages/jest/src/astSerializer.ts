import { ASTNode, print } from "graphql";
import type { NewPlugin } from "pretty-format";
import { isNode } from "graphql/language/ast";

const astSerializer: NewPlugin = {
  test(value: any) {
    return isNode(value);
  },

  serialize(value: ASTNode): string {
    return print(value);
  },
};

export { astSerializer };
