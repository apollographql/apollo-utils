// In Apollo Studio, we want to group requests making the same query together,
// and treat different queries distinctly. But what does it mean for two queries
// to be "the same"?  And what if you don't want to send the full text of the
// query to Apollo's servers, either because it contains sensitive data or
// because it contains extraneous operations or fragments?
//
// To solve these problems, ApolloServerPluginUsageReporting has the concept of
// "signatures". We don't (by default) send the full query string of queries to
// Apollo's servers. Instead, each trace has its query string's "signature".
//
// You can technically specify any function mapping a GraphQL query AST
// (DocumentNode) to string as your signature algorithm by providing it as the
// 'calculateSignature' option to ApolloServerPluginUsageReporting. (This option
// is not recommended, because Apollo's servers make some assumptions about the
// semantics of your operation based on the signature.) This file defines the
// default function used for this purpose: defaultUsageReportingSignature
// (formerly known as defaultEngineReportingSignature).
//
// This module utilizes several AST transformations from the adjacent
// 'transforms' file. (You could use them to build your own `calculateSignature`
// callback, but as mentioned above, you shouldn't really define that callback,
// so they are not exported from the package.)
//
// - dropUnusedDefinitions, which removes operations and fragments that aren't
//   going to be used in execution
// - stripSensitiveLiterals, which replaces all numeric and string literals as well as
//   list and object input values with "empty" values
// - removeAliases, which removes field aliasing from the query
// - sortAST, which sorts the children of most multi-child nodes consistently
// - printWithReducedWhitespace, a variant on graphql-js's 'print' which gets
//   rid of unneeded whitespace
//
// usageReportingSignature consists of applying all of these building blocks.
//
// Historical note: the default signature algorithm of the Go engineproxy
// performed all of the above operations, and Apollo's servers then re-ran a
// mostly identical signature implementation on received traces. This was
// primarily to deal with edge cases where some users used literal interpolation
// instead of GraphQL variables, included randomized alias names, etc. In
// addition, the servers relied on the fact that dropUnusedDefinitions had been
// called in order (and that the signature could be parsed as GraphQL) to
// extract the name of the operation for display. This caused confusion, as the
// query document shown in the Studio UI wasn't the same as the one actually
// sent. ApolloServerPluginUsageReporting (previously apollo-engine-reporting)
// uses a reporting API which requires it to explicitly include the operation
// name with each signature; this means that the server no longer needs to parse
// the signature or run its own signature algorithm on it, and the details of
// the signature algorithm are now up to the reporting agent. That said, not all
// Studio features will work properly if your signature function changes the
// signature in unexpected ways.
import { dropUnusedDefinitions } from "@apollo/utils.dropunuseddefinitions";
import { stripSensitiveLiterals } from "@apollo/utils.stripsensitiveliterals";
import { printWithReducedWhitespace } from "@apollo/utils.printwithreducedwhitespace";
import { removeAliases } from "@apollo/utils.removealiases";
import { sortAST } from "@apollo/utils.sortast";
import type { DocumentNode } from "graphql";

export function usageReportingSignature(
  ast: DocumentNode,
  operationName: string,
): string {
  return printWithReducedWhitespace(
    sortAST(
      removeAliases(
        stripSensitiveLiterals(dropUnusedDefinitions(ast, operationName), {
          hideListAndObjectLiterals: true,
        }),
      ),
    ),
  );
}
