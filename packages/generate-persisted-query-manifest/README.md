# `@apollo/generate-persisted-query-manifest`

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

- `output` - `string`

Tell the CLI the location of where to write your manifest file.

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
