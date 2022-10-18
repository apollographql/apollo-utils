# @apollo/utils.fetcher

## 1.1.1

### Patch Changes

- [#209](https://github.com/apollographql/apollo-utils/pull/209) [`4d97c16`](https://github.com/apollographql/apollo-utils/commit/4d97c16eb56dc116742d2d8d93c423a6543b5ae9) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Support ESM for types-only packages

## 1.1.0

### Minor Changes

- [#182](https://github.com/apollographql/apollo-utils/pull/182) [`995c791`](https://github.com/apollographql/apollo-utils/commit/995c7915cb4159fd5ed7c343fff634412dcefc6b) Thanks [@glasser](https://github.com/glasser)! - FetcherRequestInit: add optional `signal?: any` to support aborting fetches. We believe that due to using `any`, this should not cause any function that implements `Fetcher` to stop typechecking, and we believe all of the most common implementations do support `signal`.

## 1.0.0

### Major Changes

- [#79](https://github.com/apollographql/apollo-utils/pull/79) [`6f34ad0`](https://github.com/apollographql/apollo-utils/commit/6f34ad075b7d44276d20e8d53c19daa810058e52) Thanks [@glasser](https://github.com/glasser)! - Initial release of Fetcher interface
