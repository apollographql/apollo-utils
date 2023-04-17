# @apollo/utils.keyvadapter

## 3.0.0

### Major Changes

- [#271](https://github.com/apollographql/apollo-utils/pull/271) [`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v14

### Patch Changes

- Updated dependencies [[`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd), [`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd)]:
  - @apollo/utils.keyvaluecache@3.0.0

## 2.0.2

### Patch Changes

- [#266](https://github.com/apollographql/apollo-utils/pull/266) [`ba46d81`](https://github.com/apollographql/apollo-utils/commit/ba46d817a97a6bad9b0ec6ff0720f01edc806091) Thanks [@renovate](https://github.com/apps/renovate)! - Start building packages with TypeScript v5, which should have no effect for consumers

- Updated dependencies [[`ba46d81`](https://github.com/apollographql/apollo-utils/commit/ba46d817a97a6bad9b0ec6ff0720f01edc806091)]:
  - @apollo/utils.keyvaluecache@2.1.1

## 2.0.1

### Patch Changes

- [#260](https://github.com/apollographql/apollo-utils/pull/260) [`957493f`](https://github.com/apollographql/apollo-utils/commit/957493f6fc128306125c9dbc2726aecc63461418) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Fix issue with KeyvAdapter where `Keyv.getMany` returns `undefined`,
  causing `KeyvAdapter` to violate the `DataLoader` contract.

  DataLoader always expects a `Promise<Array<V>>` having the same length
  as the `keys` that were given to it. This problem stems from a
  shortcoming of the `Keyv` typings, since it doesn't declare that a
  `get([...keys])` can return a singular `undefined` (but it can in
  the case of errors / `Store.getMany` can return a singular `undefined`).

## 2.0.0

### Major Changes

- [#216](https://github.com/apollographql/apollo-utils/pull/216) [`7d89c43`](https://github.com/apollographql/apollo-utils/commit/7d89c433039cd597998e99124f04866ac2a2c3d5) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v12; all packages now require Node.js version >=14.

### Patch Changes

- Updated dependencies [[`7d89c43`](https://github.com/apollographql/apollo-utils/commit/7d89c433039cd597998e99124f04866ac2a2c3d5)]:
  - @apollo/utils.keyvaluecache@2.0.0

## 1.1.2

### Patch Changes

- [#189](https://github.com/apollographql/apollo-utils/pull/189) [`191572b`](https://github.com/apollographql/apollo-utils/commit/191572b2bf59e9942f874ce52e8a11d80bc08c98) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Upgrade keyv dependency which incorporates a bugfix for getMany

## 1.1.1

### Patch Changes

- [#153](https://github.com/apollographql/apollo-utils/pull/153) [`4a7a886`](https://github.com/apollographql/apollo-utils/commit/4a7a8864a8c83bac1787fb59a1be45fcbf334c84) Thanks [@hoonoh](https://github.com/hoonoh)! - Adds typescript class generics to match Keyv class generics.

## 1.1.0

### Minor Changes

- [#122](https://github.com/apollographql/apollo-utils/pull/122) [`ed4c0a1`](https://github.com/apollographql/apollo-utils/commit/ed4c0a11cb3146e624109261d0b6b7260da132c8) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Support batch reads via Keyv's multi-key `get` function overload. Allow for users to opt out of this behavior via the `disableBatchReads` option.

## 1.0.1

### Patch Changes

- [#106](https://github.com/apollographql/apollo-utils/pull/106) [`0b3fe0a`](https://github.com/apollographql/apollo-utils/commit/0b3fe0ac4d11bb5a2ac42f7c099b200a296756f1) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Add missing entry points for new caching packages

- Updated dependencies [[`0b3fe0a`](https://github.com/apollographql/apollo-utils/commit/0b3fe0ac4d11bb5a2ac42f7c099b200a296756f1)]:
  - @apollo/utils.keyvaluecache@1.0.1

## 1.0.0

### Major Changes

- [#93](https://github.com/apollographql/apollo-utils/pull/93) [`7ce10c7`](https://github.com/apollographql/apollo-utils/commit/7ce10c7bdf8dce0f7ee59e37ae9c973139b6de13) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Introduce package which extracts `KeyValueCache`, `PrefixingKeyValueCache`, and `InMemoryLRUCache` from Apollo Server and adds a separate Keyv adapter which implements the `KeyValueCache` interface. This also introduces an `ErrorsAreMissesCache` for adding tolerance and logging to errors when using caching clients which might be susceptible to connection failures or other types of errors.

### Patch Changes

- Updated dependencies [[`7ce10c7`](https://github.com/apollographql/apollo-utils/commit/7ce10c7bdf8dce0f7ee59e37ae9c973139b6de13)]:
  - @apollo/utils.keyvaluecache@1.0.0
