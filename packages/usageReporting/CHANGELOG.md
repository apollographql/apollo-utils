# @apollo/utils.usagereporting

## 3.1.0

### Minor Changes

- [#299](https://github.com/apollographql/apollo-utils/pull/299) [`a4c17b2`](https://github.com/apollographql/apollo-utils/commit/a4c17b286790e094942e713f6c9999f8b548d39a) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Update usage reporting protobuf which introduces support for the `ConditionNode` in query planning.

## 3.0.0

### Major Changes

- [#271](https://github.com/apollographql/apollo-utils/pull/271) [`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v14

### Patch Changes

- Updated dependencies [[`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd)]:
  - @apollo/utils.printwithreducedwhitespace@3.0.0
  - @apollo/utils.stripsensitiveliterals@3.0.0
  - @apollo/utils.dropunuseddefinitions@3.0.0
  - @apollo/utils.removealiases@3.0.0
  - @apollo/utils.sortast@3.0.0

## 2.0.1

### Patch Changes

- [#266](https://github.com/apollographql/apollo-utils/pull/266) [`ba46d81`](https://github.com/apollographql/apollo-utils/commit/ba46d817a97a6bad9b0ec6ff0720f01edc806091) Thanks [@renovate](https://github.com/apps/renovate)! - Start building packages with TypeScript v5, which should have no effect for consumers

- Updated dependencies [[`ba46d81`](https://github.com/apollographql/apollo-utils/commit/ba46d817a97a6bad9b0ec6ff0720f01edc806091)]:
  - @apollo/utils.printwithreducedwhitespace@2.0.1
  - @apollo/utils.dropunuseddefinitions@2.0.1
  - @apollo/utils.removealiases@2.0.1
  - @apollo/utils.sortast@2.0.1
  - @apollo/utils.stripsensitiveliterals@2.0.1

## 2.0.0

### Major Changes

- [#216](https://github.com/apollographql/apollo-utils/pull/216) [`7d89c43`](https://github.com/apollographql/apollo-utils/commit/7d89c433039cd597998e99124f04866ac2a2c3d5) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v12; all packages now require Node.js version >=14.

### Patch Changes

- Updated dependencies [[`7d89c43`](https://github.com/apollographql/apollo-utils/commit/7d89c433039cd597998e99124f04866ac2a2c3d5)]:
  - @apollo/utils.dropunuseddefinitions@2.0.0
  - @apollo/utils.printwithreducedwhitespace@2.0.0
  - @apollo/utils.removealiases@2.0.0
  - @apollo/utils.sortast@2.0.0
  - @apollo/utils.stripsensitiveliterals@2.0.0

## 1.0.1

### Patch Changes

- [#219](https://github.com/apollographql/apollo-utils/pull/219) [`e8f8188`](https://github.com/apollographql/apollo-utils/commit/e8f81881959e1a1043ce452a51613ba17ad5de32) Thanks [@SimenB](https://github.com/SimenB)! - Migrate from `apollo-reporting-protobuf` to `@apollo/usage-reporting-protobuf`

## 1.0.0

### Major Changes

- [#92](https://github.com/apollographql/apollo-utils/pull/92) [`0d9db54`](https://github.com/apollographql/apollo-utils/commit/0d9db54464c8eaa93336bcfe3fa28dee59696b60) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Initial release of usage reporting signature (and its components)
  Initial release of calculateReferencedFieldsByType

### Patch Changes

- Updated dependencies [[`0d9db54`](https://github.com/apollographql/apollo-utils/commit/0d9db54464c8eaa93336bcfe3fa28dee59696b60)]:
  - @apollo/utils.removealiases@1.0.0
  - @apollo/utils.stripsensitiveliterals@1.2.0
