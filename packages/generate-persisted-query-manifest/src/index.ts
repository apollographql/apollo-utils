import { createFragmentRegistry } from "@apollo/client/cache";
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from "@apollo/client/core";
import { sortTopLevelDefinitions } from "@apollo/persisted-query-lists";
import { gqlPluckFromCodeStringSync } from "@graphql-tools/graphql-tag-pluck";
import { glob } from "glob";
import {
  type OperationDefinitionNode,
  parse,
  print,
  type DocumentNode,
  Kind,
} from "graphql";
import { first, sortBy } from "lodash";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export interface GeneratePersistedQueryManifestOptions {
  files?: string[];

  globInclude?: string[];
  globExclude?: string[];
}

export interface PersistedQueryManifestOperation {
  id: string;
  name: string;
  type: "query" | "mutation" | "subscription";
  body: string;
}
export interface PersistedQueryManifest {
  format: "apollo-persisted-query-manifest";
  version: 1;
  operations: PersistedQueryManifestOperation[];
}

export async function generatePersistedQueryManifest(
  options: GeneratePersistedQueryManifestOptions = {},
): Promise<PersistedQueryManifest> {
  const files = new Set<string>(options.files ?? []);
  const globInclude = options.globInclude ?? [
    "src/**/*.{graphql,tsx,jsx,ts,js}",
  ];
  const globExclude = options.globExclude ?? [
    "**/*.spec.{js,jsx,ts,tsx}",
    "**/*.story.{js,jsx,ts,tsx}",
    "**/*.test.{js,jsx,ts,tsx}",
  ];
  for (const include of globInclude) {
    for (const f of await glob(include, { ignore: globExclude ?? [] })) {
      files.add(f);
    }
  }

  const documents = [...files].flatMap((filePath) => {
    const content = readFileSync(filePath, "utf-8");
    if (filePath.endsWith("graphql")) {
      return [{ ast: parse(content), filename: filePath }];
    } else {
      return gqlPluckFromCodeStringSync(
        filePath,
        readFileSync(filePath, "utf-8"),
      ).map((source) => ({ ast: parse(source.body), filename: source.name }));
    }
  });

  interface LocatedOperationDefinitionNode {
    node: OperationDefinitionNode;
    filename: string;
  }

  const seenFragmentNames = new Set<string>();
  const operationsByName = new Map<string, LocatedOperationDefinitionNode>();

  for (const document of documents) {
    for (const definition of document.ast.definitions) {
      if (definition.kind === "FragmentDefinition") {
        const name = definition.name.value;
        if (seenFragmentNames.has(name)) {
          throw new Error(`Duplicate fragment name: ${name}`);
        }
        seenFragmentNames.add(name);
      } else if (definition.kind === "OperationDefinition") {
        const name = definition.name?.value;
        if (!name) {
          throw new Error("Anonymous operations not supported");
        }
        if (operationsByName.has(name)) {
          throw new Error(
            `Duplicate operation name '${name}' in ${
              operationsByName.get(name)?.filename
            } and ${document.filename}`,
          );
        }
        operationsByName.set(name, {
          node: definition,
          filename: document.filename,
        });
      }
    }
  }

  // Using createFragmentRegistry means our minimum AC version is 3.7. We can
  // probably go back to 3.2 (original createPersistedQueryLink) if we just
  // reimplement/copy the fragment registry code here.
  const fragments = createFragmentRegistry(...documents.map(({ ast }) => ast));

  const manifestOperations: PersistedQueryManifestOperation[] = [];

  const client = new ApolloClient({
    cache: new InMemoryCache({
      fragments,
    }),
    link: new ApolloLink((operation) => {
      const body = print(sortTopLevelDefinitions(operation.query));
      manifestOperations.push({
        id: createHash("sha256").update(body).digest("hex"),
        name: operation.operationName,
        type: (
          operation.query.definitions.find(
            (d) => d.kind === "OperationDefinition",
          ) as OperationDefinitionNode
        ).operation,
        body,
      });

      return Observable.of({ data: null });
    }),
  });

  for (const [_, operation] of sortBy([...operationsByName.entries()], first)) {
    const document: DocumentNode = {
      kind: Kind.DOCUMENT,
      definitions: [operation.node],
    };
    await client.query({ query: document, fetchPolicy: "no-cache" });
  }

  return {
    format: "apollo-persisted-query-manifest",
    version: 1,
    operations: manifestOperations,
  };
}
