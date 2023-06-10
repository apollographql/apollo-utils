---
"@apollo/generate-persisted-query-manifest": patch
---

Provides more robust error handling and reporting.

* Collect all errors while generating manifest and report them together at once. Previously it would exit as soon as an error was encountered, even if there were multiple issues.
* Update the error reporting format to make it much easier to determine which file contains the error.
