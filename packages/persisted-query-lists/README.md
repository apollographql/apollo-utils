# `@apollo/persisted-query-lists`

This package contains utilities for working with Apollo GraphQL persisted
queries. Specifically, this package contains an [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction)
that can be used to verify your persisted queries against a manifest as well as
helpers that work with the [Persisted Query Link](https://www.apollographql.com/docs/react/api/link/persisted-queries).

These functions correspond to different steps in the adoption of persisted queries:

- `createPersistedQueryManifestVerificationLink` allows you to verify that you've properly configured the `@apollo/generate-persisted-query-manifest` tool, without changing how your app communicates with your GraphQL server or requiring you to set up persisted queries in GraphOS/Router. This helps you build a deployment workflow that creates (and optionally publishes) your manifest.
- Once you're confident that your manifest is being properly generated and published by your deployment infrastructure, you can use `generatePersistedQueryIdsAtRuntime` to tell your app to send persisted query IDs in its GraphQL requests instead of the full GraphQL document. While you do need to generate and publish your manifest to GraphOS in order for this to work properly, you don't need to make the manifest available to your client at runtime if you use this mechanism, so it can be simpler to set up than `generatePersistedQueryIdsFromManifest`. However, this requires your app to calculate SHA256 hashes at runtime.
- Finally, you can use `generatePersistedQueryIdsFromManifest` to tell your app to send persisted query IDs by including the manifest directly inside your app. It uses your GraphQL operation's name to select which persisted query ID to send. This can perform better than `generatePersistedQueryIdsAtRuntime` by not requiring the client to calculate hashes.

## Setup

Install the package:

```sh
npm install @apollo/persisted-query-lists
```

## Usage

### `generatePersistedQueryIdsAtRuntime`

Helper function passed to [Persisted Query Link](https://www.apollographql.com/docs/react/api/link/persisted-queries)
that generates query hashes at runtime without the use of a manifest file. This
differs from the default behavior of the Persisted Query Link by disabling
automatic registration of persisted queries and sorting top-level definitions
to mimic the behavior of the manifest file. See [`generatePersistedQueryIdsFromManifest`](#generatepersistedqueryidsfrommanifest)
if you are able to integrate manifest file generation into your app's build process.

```ts
import { generatePersistedQueryIdsAtRuntime } from "@apollo/persisted-query-lists";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { sha256 } from "crypto-hash";

const persistedQueryLink = createPersistedQueryLink(
  generatePersistedQueryIdsAtRuntime({ sha256 }),
);
```

This function will not work properly if you use the `createOperationId` config option to `@apollo/generate-persisted-query-manifest`.

#### Options

- `sha256`: A SHA-256 hashing function. Can be sync or async. Providing a SHA-256
  hashing function is required.

### `generatePersistedQueryIdsFromManifest`

Helper function passed to [Persisted Query Link](https://www.apollographql.com/docs/react/api/link/persisted-queries)
that will read from your manifest configuration to get the persisted query ID.
Note that this function completely ignores the `body` in the manifest: it just looks for an operation whose `name` matches the operation your code is trying to execute, and uses its `id`.
See the [`@apollo/generate-persisted-query-manifest`](https://www.npmjs.com/package/@apollo/generate-persisted-query-manifest)
package to learn how to generate the manifest file.

```ts
import { generatePersistedQueryIdsFromManifest } from "@apollo/persisted-query-lists";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";

const persistedQueryLink = createPersistedQueryLink(
  generatePersistedQueryIdsFromManifest({
    loadManifest: () => import("./path/to/persisted-query-manifest.json"),
  }),
);
```

#### Options

- `loadManifest`: A function that returns your persisted query manifest
  configuration. Can be sync or async. We recommend using a dynamic import to
  avoid bundling the manifest configuration with your production build.

### `createPersistedQueryManifestVerificationLink`

An [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction)
that verifies that queries sent to your server can be matched to your manifest
configuration. See the [`@apollo/generate-persisted-query-manifest`](https://www.npmjs.com/package/@apollo/generate-persisted-query-manifest)
package to learn how to generate the manifest file.

NOTE: This link is not a terminating link and will forward the operation through
the link chain.

```ts
import { createPersistedQueryManifestVerificationLink } from "@apollo/persisted-query-lists";

const verificationLink = createPersistedQueryManifestVerificationLink({
  loadManifest: () => import("./path/to/persisted-query-manifest.json"),
  onVerificationFailed: (details) => {
    console.warn(details.reason);
  },
});
```

#### Options

- `loadManifest`: A function that returns your persisted query manifest
  configuration. Can by sync or async. We recommend using a dynamic import to
  avoid bundling the manifest configuration with your production build.

- `onVerificationFailed`: A function that is called when there is a verification
  failure for the operation about to be sent to the server. Each error that
  occurs will have a `reason` property describing the failure that occurred. See
  below for details on the various verification failures.

#### Verification failures

A verification failure will contain a `reason` property that describes the
failure that occurred. Additionally, each failure contains an [`operation`](https://www.apollographql.com/docs/react/api/link/introduction#the-operation-object)
property for the operation that triggered the verification failure.

The following failures may occur as described by the `reason` property:

- `AnonymousOperation`: Failure when the GraphQL operation does not contain an
  operation name. Persisted queries do not support anonymous operations.

- `MultipleOperations`: Failure when the GraphQL document contains multiple
  operations. Persisted queries do not support multiple operations in a single
  document.

- `NoOperations`: Failure when the GraphQL document does not contain an operation,
  such as a fragment definition. Persisted queries do not support GraphQL
  documents without operations.

- `UnknownOperation`: Failure when the GraphQL document cannot be matched to an
  operation in the manifest configuration. This is an indicator that you may need
  to regenerate your manifest configuration.

- `OperationMismatch`: Failure when an operation was found in your manifest
  configuration, matched by the operation name, but the operation body did not
  match the manifest configuration body. This error also provides a
  `manifestOperation` property that is the matched operation from your manifest
  configuration. This is an indicator that the manifest might contain an outdated
  query and that you might need to regenerate your manifest configuration.
