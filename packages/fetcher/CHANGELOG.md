# @apollo/utils.fetcher

## 3.1.0

### Minor Changes

- [#376](https://github.com/apollographql/apollo-utils/pull/376) [`7af650b`](https://github.com/apollographql/apollo-utils/commit/7af650b5cc17f5cd599ec7c2acd32679dd18af19) Thanks [@rportugal](https://github.com/rportugal)! - Add `redirect` to `FetcherRequestInit`

## 3.0.0

### Major Changes

- [#271](https://github.com/apollographql/apollo-utils/pull/271) [`4e85af0`](https://github.com/apollographql/apollo-utils/commit/4e85af042dda5d0c97048ef14861417d1d2488bd) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v14

## 2.0.1

### Patch Changes

- [#266](https://github.com/apollographql/apollo-utils/pull/266) [`ba46d81`](https://github.com/apollographql/apollo-utils/commit/ba46d817a97a6bad9b0ec6ff0720f01edc806091) Thanks [@renovate](https://github.com/apps/renovate)! - Start building packages with TypeScript v5, which should have no effect for consumers

## 2.0.0

### Major Changes

- [#216](https://github.com/apollographql/apollo-utils/pull/216) [`7d89c43`](https://github.com/apollographql/apollo-utils/commit/7d89c433039cd597998e99124f04866ac2a2c3d5) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Drop support for Node.js v12; all packages now require Node.js version >=14.

## 1.1.1

### Patch Changes

- [#209](https://github.com/apollographql/apollo-utils/pull/209) [`4d97c16`](https://github.com/apollographql/apollo-utils/commit/4d97c16eb56dc116742d2d8d93c423a6543b5ae9) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Support ESM for types-only packages

## 1.1.0

### Minor Changes

- [#182](https://github.com/apollographql/apollo-utils/pull/182) [`995c791`](https://github.com/apollographql/apollo-utils/commit/995c7915cb4159fd5ed7c343fff634412dcefc6b) Thanks [@glasser](https://github.com/glasser)! - FetcherRequestInit: add optional `signal?: any` to support aborting fetches. We believe that due to using `any`, this should not cause any function that implements `Fetcher` to stop typechecking, and we believe all of the most common implementations do support `signal`.

## 1.0.0

### Major Changes

- [#79](https://github.com/apollographql/apollo-utils/pull/79) [`6f34ad0`](https://github.com/apollographql/apollo-utils/commit/6f34ad075b7d44276d20e8d53c19daa810058e52) Thanks [@glasser](https://github.com/glasser)! - Initial release of Fetcher interface
