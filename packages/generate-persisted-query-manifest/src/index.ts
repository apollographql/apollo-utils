import { createFragmentRegistry } from "@apollo/client/cache";
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from "@apollo/client/core";
import type {
  ApolloClientOptions,
  // @ts-ignore
  DocumentTransform as RealDocumentTransform,
} from "@apollo/client/core";
import { sortTopLevelDefinitions } from "@apollo/persisted-query-lists";
import { gqlPluckFromCodeStringSync } from "@graphql-tools/graphql-tag-pluck";
import globby from "globby";
import {
  type OperationDefinitionNode,
  parse,
  print,
  type DocumentNode,
  visit,
  GraphQLError,
} from "graphql";
import { first, sortBy } from "lodash";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import vfile from "vfile";
import type { VFile } from "vfile";
import reporter from "vfile-reporter";
import chalk from "chalk";

type OperationType = "query" | "mutation" | "subscription";

// If the user uses Apollo Client 3.7, `DocumentTransform` won't exist.
// TypeScript will default the value to `any` in this case. We don't want to
// allow this property in this case, so we set the type to `never`.
type DocumentTransform = any extends RealDocumentTransform
  ? never
  : RealDocumentTransform;

interface CreateOperationIdOptions {
  operationName: string;
  type: OperationType;
  createDefaultId: () => string;
}

export interface PersistedQueryManifestConfig {
  /**
   * Paths to your GraphQL documents: queries, mutations, subscriptions, and fragments.
   * Prefix the pattern with `!` to specify a path that should be ignored.
   */
  documents?: string | string[];

  /**
   * A `DocumentTransform` instance that will be used to transform the GraphQL
   * document before it is saved to the manifest.
   *
   * For more information about document transforms, see the [Document
   * transforms](https://www.apollographql.com/docs/react/data/document-transforms)
   * documentation page.
   *
   * IMPORTANT: You must be running `@apollo/client` 3.8.0 or greater to use
   * this feature.
   *
   * @example
   * ```ts
   * import { DocumentTransform } from "@apollo/client/core";
   *
   * const config = {
   *   documentTransform: new DocumentTransform((document) => {
   *     // ... transform the document
   *
   *     return transformedDocument;
   *   })
   * }
   * ```
   *
   * @since 1.2.0
   */
  documentTransform?: DocumentTransform;

  /**
   * Path where the manifest file will be written.
   */
  output?: string;

  /**
   * Function that generates a manifest operation ID for a given query.
   *
   * Defaults to a sha256 hash of the query.
   */
  createOperationId?: (
    query: string,
    options: CreateOperationIdOptions,
  ) => string;
}

export interface PersistedQueryManifestOperation {
  id: string;
  name: string;
  type: OperationType;
  body: string;
}

export interface PersistedQueryManifest {
  format: "apollo-persisted-query-manifest";
  version: 1;
  operations: PersistedQueryManifestOperation[];
}

export const defaults = {
  documents: [
    "src/**/*.{graphql,gql,js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/*.spec.{js,jsx,ts,tsx}",
    "!**/*.story.{js,jsx,ts,tsx}",
    "!**/*.test.{js,jsx,ts,tsx}",
  ],
  output: "persisted-query-manifest.json",
  createOperationId: (query: string) => {
    return createHash("sha256").update(query).digest("hex");
  },
};

interface Location {
  line: number;
  column: number;
}

interface DocumentSource {
  node: DocumentNode | null;
  file: VFile;
  location: Location | undefined;
}

const COLORS = {
  identifier: chalk.magenta,
  filepath: chalk.underline.cyan,
  name: chalk.yellow,
};

const ERROR_MESSAGES = {
  anonymousOperation: (node: OperationDefinitionNode) => {
    return `Anonymous GraphQL operations are not supported. Please name your ${node.operation}.`;
  },
  uniqueFragment: (name: string, source: DocumentSource) => {
    return `Fragment named "${COLORS.name(
      name,
    )}" already defined in: ${COLORS.filepath(source.file.path)}`;
  },
  uniqueOperation: (name: string, source: DocumentSource) => {
    return `Operation named "${COLORS.name(
      name,
    )}" already defined in: ${COLORS.filepath(source.file.path)}`;
  },
  uniqueOperationId: (
    id: string,
    operationName: string,
    definedOperationName: string,
  ) => {
    return `\`createOperationId\` created an ID (${COLORS.identifier(
      id,
    )}) for operation named "${COLORS.name(
      operationName,
    )}" that has already been used for operation named "${COLORS.name(
      definedOperationName,
    )}".`;
  },
  parseError(error: Error) {
    return `${error.name}: ${error.message}`;
  },
};

function addError(
  source: Pick<DocumentSource, "file"> & Partial<DocumentSource>,
  message: string,
) {
  const vfileMessage = source.file.message(message, source.location);
  vfileMessage.fatal = true;
}

function parseLocationFromError(error: Error) {
  if (error instanceof GraphQLError && error.locations) {
    return error.locations[0];
  }

  const loc =
    "loc" in error &&
    typeof error.loc === "object" &&
    error.loc !== null &&
    error.loc;

  const line = loc && "line" in loc && typeof loc.line === "number" && loc.line;
  const column =
    loc && "column" in loc && typeof loc.column === "number" && loc.column;

  if (typeof line === "number" && typeof column === "number") {
    return { line, column };
  }

  return;
}

function getDocumentSources(filepath: string): DocumentSource[] {
  const file = vfile({
    path: filepath,
    contents: readFileSync(filepath, "utf-8"),
  });

  try {
    if (file.extname === ".graphql" || file.extname === ".gql") {
      return [
        {
          node: parse(file.toString()),
          file,
          location: { line: 1, column: 1 },
        },
      ];
    }

    return gqlPluckFromCodeStringSync(filepath, file.toString()).map(
      (source) => ({
        node: parse(source.body),
        file,
        location: source.locationOffset,
      }),
    );
  } catch (e: unknown) {
    const error = e as Error;
    const source = {
      node: null,
      file,
      location: parseLocationFromError(error),
    };

    addError(source, ERROR_MESSAGES.parseError(error));

    return [source];
  }
}

function maybeReportErrorsAndExit(files: VFile | VFile[]) {
  if (!Array.isArray(files)) {
    files = [files];
  }

  if (files.some((file) => file.messages.length > 0)) {
    console.error(reporter(files, { quiet: true }));
    process.exit(1);
  }
}

function uniq<T>(arr: T[]) {
  return [...new Set(arr)];
}

// Unfortunately globby does not guarantee deterministic file sorting so we
// apply some sorting on the files in this function.
//
// https://github.com/sindresorhus/globby/issues/131
export async function getFilepaths(documents: string | string[]) {
  return [...uniq(await globby(documents))].sort((a, b) => a.localeCompare(b));
}

export async function generatePersistedQueryManifest(
  config: PersistedQueryManifestConfig = {},
  configFilePath: string | undefined,
): Promise<PersistedQueryManifest> {
  const {
    documents = defaults.documents,
    createOperationId = defaults.createOperationId,
  } = config;

  const configFile = vfile({
    path: configFilePath
      ? relative(process.cwd(), configFilePath)
      : "<virtual>",
  });
  const filepaths = await getFilepaths(documents);
  const sources = filepaths.flatMap(getDocumentSources);

  const fragmentsByName = new Map<string, DocumentSource[]>();
  const operationsByName = new Map<string, DocumentSource[]>();

  for (const source of sources) {
    if (!source.node) {
      continue;
    }

    visit(source.node, {
      FragmentDefinition(node) {
        const name = node.name.value;
        const sources = fragmentsByName.get(name) ?? [];

        if (sources.length) {
          sources.forEach((sibling) => {
            addError(source, ERROR_MESSAGES.uniqueFragment(name, sibling));
            addError(sibling, ERROR_MESSAGES.uniqueFragment(name, source));
          });
        }

        fragmentsByName.set(name, [...sources, source]);

        return false;
      },
      OperationDefinition(node) {
        const name = node.name?.value;

        if (!name) {
          addError(source, ERROR_MESSAGES.anonymousOperation(node));

          return false;
        }

        const sources = operationsByName.get(name) ?? [];

        if (sources.length) {
          sources.forEach((sibling) => {
            addError(source, ERROR_MESSAGES.uniqueOperation(name, sibling));
            addError(sibling, ERROR_MESSAGES.uniqueOperation(name, source));
          });
        }

        operationsByName.set(name, [...sources, source]);

        return false;
      },
    });
  }

  maybeReportErrorsAndExit(uniq(sources.map((source) => source.file)));

  // Using createFragmentRegistry means our minimum AC version is 3.7. We can
  // probably go back to 3.2 (original createPersistedQueryLink) if we just
  // reimplement/copy the fragment registry code here.
  const fragments = createFragmentRegistry(
    ...sources.map(({ node }) => node).filter(Boolean),
  );
  const manifestOperationIds = new Map<string, string>();
  const manifestOperations: PersistedQueryManifestOperation[] = [];
  const clientConfig: Partial<ApolloClientOptions<any>> = {};

  if (config.documentTransform) {
    clientConfig.documentTransform = config.documentTransform;
  }

  const client = new ApolloClient({
    ...clientConfig,
    cache: new InMemoryCache({
      fragments,
    }),
    link: new ApolloLink((operation) => {
      const body = print(sortTopLevelDefinitions(operation.query));
      const name = operation.operationName;
      const type = (
        operation.query.definitions.find(
          (d) => d.kind === "OperationDefinition",
        ) as OperationDefinitionNode
      ).operation;

      const id = createOperationId(body, {
        operationName: name,
        type,
        createDefaultId() {
          return defaults.createOperationId(body);
        },
      });

      // We only need to validate the `id` when using a config file. Without
      // a config file, our default id function will be used which is
      // guaranteed to create unique IDs.
      if (manifestOperationIds.has(id)) {
        addError(
          { file: configFile },
          ERROR_MESSAGES.uniqueOperationId(
            id,
            name,
            manifestOperationIds.get(id)!,
          ),
        );
      } else {
        manifestOperationIds.set(id, name);
      }

      manifestOperations.push({ id, name, type, body });

      return Observable.of({ data: null });
    }),
  });

  for (const [_, sources] of sortBy([...operationsByName.entries()], first)) {
    for (const source of sources) {
      if (source.node) {
        await client.query({ query: source.node, fetchPolicy: "no-cache" });
      }
    }
  }

  maybeReportErrorsAndExit(configFile);

  return {
    format: "apollo-persisted-query-manifest",
    version: 1,
    operations: manifestOperations,
  };
}
