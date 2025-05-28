# `@apollo/generate-persisted-query-manifest`

`generate-persisted-query-manifest` is a tool for generating [persisted query manifests](https://www.apollographql.com/docs/graphos/operations/persisted-queries) from the source code of Apollo Client Web projects. It scans a source code directory looking for GraphQL operations, applies the same transformations to them as Apollo Client Web would do at runtime, and compiles them into a persisted query manifest JSON file.

(It is not a general-purpose tool for creating PQM JSON files from arbitrary GraphQL operations: it is specifically tailored to the way Apollo Client Web transforms operations before sending them to servers.)

## Setup

First, install the `@apollo/generate-persisted-query-manifest` package as a dev dependency:

```sh
npm install --save-dev @apollo/generate-persisted-query-manifest
```

Use its CLI to extract queries from your app:

```sh
npx generate-persisted-query-manifest
```

## CLI configuration

To override the default options, you can provide a config file. Create a `persisted-query-manifest.config.json` file in the root of your project.

```json
{
  "documents": [
    "src/**/*.{graphql,gql,js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/*.spec.{js,jsx,ts,tsx}",
    "!**/*.story.{js,jsx,ts,tsx}",
    "!**/*.test.{js,jsx,ts,tsx}"
  ],
  "output": "persisted-query-manifest.json"
}
```

> NOTE: The config file is optional. Defaults for each option are displayed above.

If you would like to define the config file in a directory other than the root, you can tell the CLI the location of the config file using the `--config` option.

```
npx generate-persisted-query-manifest --config path/to/persisted-query-manifest.config.json
```

### Supported config file formats

The config file can be provided in a variety of formats and optionally prefixed with a dot (`.`). The CLI will search for a config file in these locations:

- `.persisted-query-manifest.config.json`
- `persisted-query-manifest.config.json`
- `.persisted-query-manifest.config.yml`
- `persisted-query-manifest.config.yml`
- `.persisted-query-manifest.config.yaml`
- `persisted-query-manifest.config.yaml`
- `.persisted-query-manifest.config.js`
- `persisted-query-manifest.config.js`
- `.persisted-query-manifest.config.ts`
- `persisted-query-manifest.config.ts`
- `.persisted-query-manifest.config.cjs`
- `persisted-query-manifest.config.cjs`
- A `persisted-query-manifest` key in `package.json`

## Configuration

To customize the CLI, create a config file using one of the formats described above in the root of your directory. If using a `.js` , `.cjs`, or `.ts` config file, your config object must be the default export.

### TypeScript

If you define your config file as a TypeScript file, you can get autocompletion and documentation on the options by importing the `PersistedQueryManifestConfig` type from the package.

```ts
// persisted-query-manifest.config.ts
import { PersistedQueryManifestConfig } from "@apollo/generate-persisted-query-manifest";

const config: PersistedQueryManifestConfig = {
  // options
};

export default config;
```

### Options

- `documents` - `string | string[]`

Tell the CLI where to look for your documents. You can use glob patterns to determine where to look. Prefix the pattern with `!` to ignore the path which is useful to ignore queries that might be defined in your tests or storybook stories not used in your production application.

Paths are interpreted relative to the current working directory, not the config file's directory. We recommend always running `generate-persisted-query-manifest` via an `npm run` script, which runs commands with the directory containing `package.json` as the current directory.

Default:

```json
[
  "src/**/*.{graphql,gql,js,jsx,ts,tsx}",
  "!**/*.d.ts",
  "!**/*.spec.{js,jsx,ts,tsx}",
  "!**/*.story.{js,jsx,ts,tsx}",
  "!**/*.test.{js,jsx,ts,tsx}"
]
```

#### Usage with GraphQL Codegen persisted documents

[GraphQL Codegen](https://the-guild.dev/graphql/codegen) is a popular code
generation utility used with GraphQL. You can use GraphQL Codegen's [persisted
documents](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#persisted-documents) feature with `generate-persisted-query-manifest` by providing the `documents` option with the `fromGraphQLCodegenPersistedDocuments` utility exported by this package. This is useful to prevent traversing the file system to parse GraphQL documents since GraphQL Codegen has already done the hard work for you.

```ts
import type { PersistedQueryManifestConfig } from "@apollo/generate-persisted-query-manifest";
import { fromGraphQLCodegenPersistedDocuments } from "@apollo/generate-persisted-query-manifest";

const config: PersistedQueryManifestConfig = {
  documents: fromGraphQLCodegenPersistedDocuments(
    "./src/gql/persisted-documents.json",
  ),
};

export default config;
```

> NOTE: Running these documents through this package is necessary to ensure the GraphQL document sent to the server by Apollo Client matches that in the manifest. While GraphQL Codegen's persisted documents transforms are intended to be similar to Apollo Client's, there are subtle differences that may prevent correct usage of Apollo's persisted queries. This also ensures forward compatibility with any future transforms introduced by Apollo Client that may alter the GraphQL document output.

- `output` - `string`

Tell the CLI the location of where to write your manifest file. Paths are interpreted relative to the current working directory.

Default: `persisted-query-manifest.json`

- `createOperationId` - Function `(query: string, options: CreateOperationIdOptions) => string`

A custom function that allows you to customize the `id` for a query operation. By default, a SHA 256 hash of the query string will be used to generate the `id`. This option can only be used if your config file is defined using a `.js`, `.cjs` or `.ts` extension.

When you use this option, you cannot use the `generatePersistedQueryIdsAtRuntime` function from `@apollo/persisted-query-lists` in your client, because that function assumes that you are using the default ID generation (SHA256 hash of the body). It is compatible with `generatePersistedQueryIdsFromManifest`.

```ts
interface CreateOperationIdOptions {
  /**
   * The name of the operation.
   */
  operationName: string;

  /**
   * The type of operation.
   */
  type: "query" | "mutation" | "subscription";

  /**
   * Helper function that returns the default generated ID for the operation.
   */
  createDefaultId: () => string;
}
```

Here is an example that uses a Base 64 encoded string for an operation named `TestOperation`, but uses the default generated ID for all others.

```ts
import { Buffer } from "node:buffer";

const config = {
  createOperationId(query, { operationName, type, createDefaultId }) {
    switch (operationName) {
      case "TestOperation":
        return Buffer.from(query).toString("base64");
      default:
        return createDefaultId();
    }
  },
};
```

- `documentTransform` - `DocumentTransform`

An `@apollo/client` `DocumentTransform` instance used to transform GraphQL documents before they are saved to the manifest. Use this option if you pass a `documentTransform` option to your Apollo Client instance.

For more information, see the Apollo Client [Document transforms](https://www.apollographql.com/docs/react/data/document-transforms) documentation.

> NOTE: This feature is only available if you use Apollo Client 3.8.0 or greater.

```ts
import { DocumentTransform } from "@apollo/client/core";

const config = {
  // Inlined for this example, but ideally this should use the same instance
  // that is passed to your Apollo Client instance
  documentTransform: new DocumentTransform((document) => {
    // ... transform the document

    return transformedDocument;
  }),
};
```

- `addTypename`: `boolean`

Whether to add `__typename` fields to selection sets in operations. Defaults to true; you should set this to false if you also pass `addTypename: false` to your `InMemoryCache` constructor in your app. (This can also be helpful if you are using this tool on a codebase that does not actually use Apollo Client Web, though it is not designed for that purpose.)

Note that the ability to pass `addTypename: false` will be removed in Apollo Client v4.
