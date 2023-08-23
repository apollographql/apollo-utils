---
"@apollo/generate-persisted-query-manifest": patch
---

Better error reporting when an error is raised while parsing a source file for GraphQL query strings (such as a syntax error). Previously the stack trace was reported to the console with little to no identifying information as to which file caused the error. The filename is now reported similarly to other errors encountered when running the CLI. An additional improvement is that it will now gather all errors, including syntax errors in a single pass so that syntax errors do not halt the program in place.
