---
"@apollo/generate-persisted-query-manifest": minor
---

Add ability to specify a custom document transform used during manifest generation.

NOTE: This should be the same document transform that is passed to your `ApolloClient` instance.

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
