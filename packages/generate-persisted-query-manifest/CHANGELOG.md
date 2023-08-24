# @apollo/generate-persisted-query-manifest

## 1.1.0

### Minor Changes

- [#344](https://github.com/apollographql/apollo-utils/pull/344) [`b32a3d1`](https://github.com/apollographql/apollo-utils/commit/b32a3d13aacde6372332efaa761d92087c5ac74e) Thanks [@jerelmiller](https://github.com/jerelmiller)! - Add a `--list-files` option that lists the set of matched files against the `documents` pattern.

### Patch Changes

- [#345](https://github.com/apollographql/apollo-utils/pull/345) [`145836c`](https://github.com/apollographql/apollo-utils/commit/145836c351e032e048975fc02eb90179582a5d9e) Thanks [@jerelmiller](https://github.com/jerelmiller)! - Better error reporting when an error is raised while parsing a source file for GraphQL query strings (such as a syntax error). Previously the stack trace was reported to the console with little to no identifying information as to which file caused the error. The filename is now reported similarly to other errors encountered when running the CLI. An additional improvement is that it will now gather all errors, including syntax errors in a single pass so that syntax errors do not halt the program in place.

- [#348](https://github.com/apollographql/apollo-utils/pull/348) [`c3cbc4d`](https://github.com/apollographql/apollo-utils/commit/c3cbc4dfa66ccf7645fed78a8ed249615f848ac7) Thanks [@jerelmiller](https://github.com/jerelmiller)! - Adds the number of matched operations recorded to the manifest file in the success message once the CLI finishes. If no operations were found, a warning is now logged.

## 1.0.0

### Major Changes

- [#287](https://github.com/apollographql/apollo-utils/pull/287) [`1a64dfa`](https://github.com/apollographql/apollo-utils/commit/1a64dfabc47d0d735473aecd23d540cab6737ca8) Thanks [@glasser](https://github.com/glasser)! - Initial release
