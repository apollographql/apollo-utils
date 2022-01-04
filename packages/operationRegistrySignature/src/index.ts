import type { DocumentNode } from "graphql";
import { dropUnusedDefinitions } from "@trevorscheer/utils.dropunuseddefinitions";
import { printWithReducedWhitespace } from "@trevorscheer/utils.printwithreducedwhitespace";
import { sortAST } from "@trevorscheer/utils.sortast";
import { stripSensitiveLiterals } from "@trevorscheer/utils.stripsensitiveliterals";

// The operation registry signature function consists of removing extra whitespace,
// sorting the AST in a deterministic manner, potentially hiding string and numeric
// literals, and removing unused definitions. This is a less aggressive transform
// than its usage reporting signature counterpart.
export function operationRegistrySignature(
  ast: DocumentNode,
  operationName: string,
  options: { preserveStringAndNumericLiterals: boolean } = {
    preserveStringAndNumericLiterals: false,
  },
): string {
  const withoutUnusedDefs = dropUnusedDefinitions(ast, operationName);
  const maybeWithLiterals = options.preserveStringAndNumericLiterals
    ? withoutUnusedDefs
    : stripSensitiveLiterals(withoutUnusedDefs);
  return printWithReducedWhitespace(sortAST(maybeWithLiterals));
}

export function defaultOperationRegistrySignature(
  ast: DocumentNode,
  operationName: string,
): string {
  return operationRegistrySignature(ast, operationName, {
    preserveStringAndNumericLiterals: false,
  });
}
