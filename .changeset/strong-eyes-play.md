---
"@apollo/persisted-query-lists": patch
---

**`createPersistedQueryManifestVerificationLink`**

- Consolidate the callbacks to a single `onVerificationFailed` callback with a `reason` property that describes the verification failure. 
- The full `operation` is now available as a property to the `onVerificationFailed` callback.

```ts
createPersistedQueryManifestVerificationLink({
  onVerificationFailed(details) {
    // The reason the verification failed, such as an anonymous operation
    console.log(details.reason)

    // The operation that caused the verification failure
    console.log(details.operation)
  }
})
```
