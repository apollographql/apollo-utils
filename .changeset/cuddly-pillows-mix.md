---
"@apollo/generate-persisted-query-manifest": patch
"@apollo/persisted-query-lists": patch
---

Change `generatePersistedQueryIdsFromManifest` to take an async `loadManifest`. Ensure Promises don't have unhandled rejections.
