---
"@apollo/utils.keyvaluecache": patch
---

Update lru-cache dependency to v9.x

The `InMemoryLRUCache` constructor accepts an `LRUCache.Options` object. This type has changed since v8.x, so you may need to update your usages accordingly.

The changes in the options typings aren't documented in the changelog, please look at the source below for specifics.

v7 options can be derived [here](https://github.com/isaacs/node-lru-cache/blob/7a6f529e2e7c1bc3c81f3ee996267ef2006de492/index.d.ts#L615).
v8-9 options can be derived [here](https://github.com/isaacs/node-lru-cache/blob/88bb31c82d418488a18f1663a2a6383853b632a1/src/index.ts#L763).