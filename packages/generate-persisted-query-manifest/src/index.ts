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
  visit,
} from "graphql";
import { first, sortBy } from "lodash";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import vfile from "vfile";
import type { VFile } from "vfile";
import reporter from "vfile-reporter";

type RequireKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

export interface PersistedQueryManifestConfig {
  /**
   * Paths to your GraphQL documents: queries, mutations, subscriptions, and fragments.
   */
  documents?: string | string[];

  /**
   * Paths that should be ignored when searching for your GraphQL documents.
   */
  documentIgnorePatterns?: string | string[];

  /**
   * Path where the manifest file will be written.
   */
  output?: string;
}

type DefaultPersistedQueryManifestConfig = RequireKeys<
  PersistedQueryManifestConfig,
  "documents" | "documentIgnorePatterns" | "output"
>;

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

export const defaults: DefaultPersistedQueryManifestConfig = {
  documents: "src/**/*.{graphql,gql,js,jsx,ts,tsx}",
  documentIgnorePatterns: [
    "**/*.d.ts",
    "**/*.spec.{js,jsx,ts,tsx}",
    "**/*.story.{js,jsx,ts,tsx}",
    "**/*.test.{js,jsx,ts,tsx}",
  ],
  output: "persisted-query-manifest.json",
};

interface Location {
  line: number;
  column: number;
}

interface DocumentSource {
  node: DocumentNode;
  file: VFile;
  location: Location;
}

export async function generatePersistedQueryManifest(
  config: PersistedQueryManifestConfig = {},
): Promise<PersistedQueryManifest> {
  const filePaths = new Set<string>();
  const paths = config.documents ?? defaults.documents;
  const ignorePaths =
    config.documentIgnorePatterns ?? defaults.documentIgnorePatterns;

  for (const f of await glob(paths, { ignore: ignorePaths })) {
    filePaths.add(f);
  }

  const sources: DocumentSource[] = [...filePaths].flatMap((filePath) => {
    const file = vfile({
      path: filePath,
      contents: readFileSync(filePath, "utf-8"),
    });

    if (file.extname === ".graphql") {
      return [
        {
          node: parse(file.toString()),
          file,
          location: { line: 1, column: 1 },
        },
      ];
    }

    return gqlPluckFromCodeStringSync(filePath, file.toString()).map(
      (source) => ({
        node: parse(source.body),
        file,
        location: source.locationOffset,
      }),
    );
  });

  interface LocatedOperationDefinitionNode {
    node: OperationDefinitionNode;
    file: VFile;
  }

  const seenFragmentNames = new Set<string>();
  const operationsByName = new Map<string, LocatedOperationDefinitionNode>();

  for (const source of sources) {
    visit(source.node, {
      FragmentDefinition(node) {
        const name = node.name.value;

        if (seenFragmentNames.has(name)) {
          source.file.message(
            `Duplicate fragment name: ${name}`,
            source.location,
          );
        }

        seenFragmentNames.add(name);
      },
      OperationDefinition(node) {
        const name = node.name?.value;

        if (!name) {
          const message = source.file.message(
            "Anonymous operations are not supported",
            source.location,
          );

          message.fatal = true;

          return;
        }

        if (operationsByName.has(name)) {
          source.file.message(
            `Duplicate operation name '${name}' in ${
              operationsByName.get(name)!.file.path
            }`,
            source.location,
          );

          return;
        }

        operationsByName.set(name, {
          node,
          file: source.file,
        });
      },
    });
  }

  if (sources.some((document) => document.file.messages.length > 0)) {
    console.error(
      reporter([...new Set(sources.map((document) => document.file))], {
        quiet: true,
      }),
    );
    process.exit(1);
  }

  // Using createFragmentRegistry means our minimum AC version is 3.7. We can
  // probably go back to 3.2 (original createPersistedQueryLink) if we just
  // reimplement/copy the fragment registry code here.
  const fragments = createFragmentRegistry(...sources.map(({ node }) => node));

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
