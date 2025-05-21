# @apollo/utils.keyvaluecache

## 4.0.0

### Major Changes

- [#452](https://github.com/apollographql/apollo-utils/pull/452) [`8cfba84`](https://github.com/apollographql/apollo-utils/commit/8cfba8403011ff2a4161cfe48cbec8aa0bc0eeb7) Thanks [@renovate](https://github.com/apps/renovate)! - Require Node v20; upgrade lru-cache to v11.

## 3.1.0

### Minor Changes

- [#337](https://github.com/apollographql/apollo-utils/pull/337) [`e02f708`](https://github.com/apollographql/apollo-utils/commit/e02f708579651a828b75d7148b1513fc45f0ad77) Thanks [@HishamAli81](https://github.com/HishamAli81)! - Updated the KeyValueCache.KeyValueCacheSetOptions type to be configurable, to be able to support custom key value caches that require additional cache set options.

## 3.0.0

### Major Changes

- [#271](https://github.com/apollographql/apollo-utils/pull/271) [`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v14

### Patch Changes

- [#271](https://github.com/apollographql/apollo-utils/pull/271) [`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Update lru-cache dependency from v7.x to v9.x

  The `InMemoryLRUCache` constructor accepts an `LRUCache.Options` object. This type has changed since v8.x, so you may need to update your usages accordingly.

  The changes in the options typings aren't documented in the changelog; please look at the source below for specifics.

  v7 options can be derived [here](https://github.com/isaacs/node-lru-cache/blob/7a6f529e2e7c1bc3c81f3ee996267ef2006de492/index.d.ts#L615).
  v8-9 options can be derived [here](https://github.com/isaacs/node-lru-cache/blob/88bb31c82d418488a18f1663a2a6383853b632a1/src/index.ts#L763).

- Updated dependencies [[`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd)]:
  - @apollo/utils.logger@3.0.0

## 2.1.1

### Patch Changes

- [#266](https://github.com/apollographql/apollo-utils/pull/266) [`ba46d81`](https://github.com/apollographql/apollo-utils/commit/ba46d817a97a6bad9b0ec6ff0720f01edc806091) Thanks [@renovate](https://github.com/apps/renovate)! - Start building packages with TypeScript v5, which should have no effect for consumers

- Updated dependencies [[`ba46d81`](https://github.com/apollographql/apollo-utils/commit/ba46d817a97a6bad9b0ec6ff0720f01edc806091)]:
  - @apollo/utils.logger@2.0.1

## 2.1.0

### Minor Changes

- [#236](https://github.com/apollographql/apollo-utils/pull/236) [`675409f`](https://github.com/apollographql/apollo-utils/commit/675409f5f1be6468940b786d6e772241768ccabc) Thanks [@glasser](https://github.com/glasser)! - New static methods `PrefixingKeyValueCache.cacheDangerouslyDoesNotNeedPrefixesForIsolation` and `PrefixingKeyValueCache.prefixesAreUnnecessaryForIsolation` allows you to opt a particular cache out of the prefixing done by a `PrefixingKeyValueCache`.

## 2.0.1

### Patch Changes

- [#226](https://github.com/apollographql/apollo-utils/pull/226) [`bcf0981`](https://github.com/apollographql/apollo-utils/commit/bcf098168069df513fc3153c7c3abcc51f5a67e4) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Fix the version range specified for `lru-cache` which was previously invalid. Unpin the range now that we've dropped support for node@12
  and this was originally a `@types/node@12` issue.

## 2.0.0

### Major Changes

- [#216](https://github.com/apollographql/apollo-utils/pull/216) [`7d89c43`](https://github.com/apollographql/apollo-utils/commit/7d89c433039cd597998e99124f04866ac2a2c3d5) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v12; all packages now require Node.js version >=14.

### Patch Changes

- Updated dependencies [[`7d89c43`](https://github.com/apollographql/apollo-utils/commit/7d89c433039cd597998e99124f04866ac2a2c3d5)]:
  - @apollo/utils.logger@2.0.0

## 1.0.1

### Patch Changes

- [#106](https://github.com/apollographql/apollo-utils/pull/106) [`0b3fe0a`](https://github.com/apollographql/apollo-utils/commit/0b3fe0ac4d11bb5a2ac42f7c099b200a296756f1) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Add missing entry points for new caching packages

## 1.0.0

### Major Changes

- [#93](https://github.com/apollographql/apollo-utils/pull/93) [`7ce10c7`](https://github.com/apollographql/apollo-utils/commit/7ce10c7bdf8dce0f7ee59e37ae9c973139b6de13) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Introduce package which extracts `KeyValueCache`, `PrefixingKeyValueCache`, and `InMemoryLRUCache` from Apollo Server and adds a separate Keyv adapter which implements the `KeyValueCache` interface. This also introduces an `ErrorsAreMissesCache` for adding tolerance and logging to errors when using caching clients which might be susceptible to connection failures or other types of errors.
