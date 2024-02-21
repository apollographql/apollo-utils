---
"@apollo/generate-persisted-query-manifest": minor
---

Add ability to specify a custom document transform used during manifest generation.

> [!NOTE]
> You must be running Apollo Client 3.8.0 or greater to use this feature.

> [!IMPORTANT]
> This should be the same document transform that is passed to your `ApolloClient` instance, otherwise you risk mismatches in the query output.

```ts
// persisted-query-manifest.config.ts
import { PersistedQueryManifestConfig } from "@apollo/generate-persisted-query-manifest";
import { DocumentTransform } from "@apollo/client/core";

const documentTransform = new DocumentTransform((document) => {
  // transform your document
  return transformedDocument;
})

const config: PersistedQueryManifestConfig = {
  documentTransform,
};

export default config;
```
