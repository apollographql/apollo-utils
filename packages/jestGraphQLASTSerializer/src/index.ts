import { ASTNode, print } from "graphql";
import { isNode } from "graphql/language/ast";

// This is exported as a default so that it can (hopefully one day) be picked up
// by Jest's `snapshotSerializers` config option. For now, Jest doesn't
// correctly unwrap default exports when providing the name of a module in this
// manner.
export default {
  test(value: any) {
    return isNode(value);
  },

  serialize(value: ASTNode): string {
    return print(value);
  },
};
