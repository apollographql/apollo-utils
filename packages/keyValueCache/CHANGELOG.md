# @apollo/utils.keyvaluecache

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
