# `@apollo/generate-persisted-query-manifest`

## Setup

First install the package that will extract queries from your app

```sh
npm install --save-dev @apollo/generate-persisted-query-manifest
```

Run code extraction using the CLI

```sh
npx generate-persisted-query-manifest
```

By default, this will look at all `.graphql`, `.gql`, `.js`, `.jsx`, `.ts`, and `.tsx` files in your `src` directory, excluding storybook and test files. The manifest file will be written to the `persisted-query-manifest.json` file in your root directory.

If you need to provide further customization, such as customizing the location of where to search for your documents, you can provide a config file at the root of your project. The CLI will search for a config file in a variety of formats in these locations:

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

If you would like to name the config file something different, or put it in a different directory, you can tell the CLI where to find it using the `--config` option.

```
npx generate-persisted-query-manifest --config path/to/persisted-query-manifest.config.ts
```

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

Tell the CLI where to look for your documents. You can use glob patterns to determine where to look.

Default: `src/*/.{graphql,gql,js,jsx,ts,tsx}`

- `documentIgnorePatterns` - `string | string[]`

Tell the CLI to ignore these files when looking for documents. Useful to ignore queries that might be defined in your tests or storybook stories that are not used in your production application.

Default:

```json
[
  "**/*.d.ts",
  "**/*.spec.{js,jsx,ts,tsx}",
  "**/*.story.{js,jsx,ts,tsx}",
  "**/*.test.{js,jsx,ts,tsx}"
]
```

- `output` - `string`

Tell the CLI the location of where to write your manifest file.

Default: `persisted-query-manifest.json`

- `createOperationId` - Function `(query: string, options: CreateOperationIdOptions) => string`

A custom function that allows you to customize the `id` for a query operation. By default, a SHA 256 hash of the query string will be used to generate the `id`. This option can only be used if your config file is defined using a `.js` , `.cjs` or `.ts `extension.

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
