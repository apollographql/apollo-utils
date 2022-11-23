---
"@apollo/utils.keyvaluecache": patch
---

Fix the version range specified for `lru-cache` which was previously invalid. Unpin the range now that we've dropped support for node@12
and this was originally a `@types/node@12` issue.
