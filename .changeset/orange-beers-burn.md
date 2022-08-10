---
"@apollo/utils.fetcher": minor
---

FetcherRequestInit: add optional `signal?: any` to support aborting fetches. We believe that due to using `any`, this should not cause any function that implements `Fetcher` to stop typechecking, and we believe all of the most common implementations do support `signal`.
