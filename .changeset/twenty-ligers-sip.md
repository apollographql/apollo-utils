---
"@apollo/generate-persisted-query-manifest": patch
---

Add the ability to create custom manifest operation IDs by defining a `createCustomId` function in the config file.

```ts
// persisted-query-manifest.config.ts
import { PersistedQueryManifestConfig } from '@apollo/generate-persisted-query-manifest';
import { Buffer } from 'node:buffer'

const config: PersistedQueryManifestConfig = {
  createOperationId(query, { operationName, createDefaultId }) {
    switch (operationName) {
      case 'TestOperation':
        return Buffer.from(query).toString('base64');
      default:
        return createDefaultId();
    }
  }
}

export default config;
```
