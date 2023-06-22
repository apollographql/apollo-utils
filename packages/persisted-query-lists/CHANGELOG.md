# @apollo/persisted-query-lists

## 1.0.0-alpha.4

### Patch Changes

- [#315](https://github.com/apollographql/apollo-utils/pull/315) [`12b76e2`](https://github.com/apollographql/apollo-utils/commit/12b76e24fb29bb43540798a142497b37ba4bd016) Thanks [@jerelmiller](https://github.com/jerelmiller)! - Allow the persisted query manifest to be loaded synchronously for both `createPersistedQueryManifestVerificationLink` and `generatePersistedQueryIdsFromManifest`.

- [#308](https://github.com/apollographql/apollo-utils/pull/308) [`b5ca31c`](https://github.com/apollographql/apollo-utils/commit/b5ca31c18b1689c08be21bed79ea37c81152abed) Thanks [@jerelmiller](https://github.com/jerelmiller)! - **`createPersistedQueryManifestVerificationLink`**

  - Consolidate the callbacks to a single `onVerificationFailed` callback with a `reason` property that describes the verification failure.
  - The full `operation` is now available as a property to the `onVerificationFailed` callback.

  ```ts
  createPersistedQueryManifestVerificationLink({
    onVerificationFailed(details) {
      // The reason the verification failed, such as an anonymous operation
      console.log(details.reason);

      // The operation that caused the verification failure
      console.log(details.operation);
    },
  });
  ```

## 1.0.0-alpha.3

### Patch Changes

- [#287](https://github.com/apollographql/apollo-utils/pull/287) [`fb4f6da`](https://github.com/apollographql/apollo-utils/commit/fb4f6da57acf48ba6eba90011a42d8a9397f6649) Thanks [@glasser](https://github.com/glasser)! - Change `generatePersistedQueryIdsFromManifest` to take an async `loadManifest`. Ensure Promises don't have unhandled rejections.

## 1.0.0-alpha.2

### Patch Changes

- [#291](https://github.com/apollographql/apollo-utils/pull/291) [`f72c2d0`](https://github.com/apollographql/apollo-utils/commit/f72c2d08da2e14d477e9c8528d47c2f219554537) Thanks [@jerelmiller](https://github.com/jerelmiller)! - Allow v3.8.0 prerelease versions of @apollo/client.

## 1.0.0-alpha.1

### Patch Changes

- [#287](https://github.com/apollographql/apollo-utils/pull/287) [`9b5c8d9`](https://github.com/apollographql/apollo-utils/commit/9b5c8d92e3f47b43c32b4b014428c49cc0b38219) Thanks [@glasser](https://github.com/glasser)! - Change createPersistedQueryManifestVerificationLink to load manifest asynchronously.

## 1.0.0-alpha.0

### Major Changes

- [#287](https://github.com/apollographql/apollo-utils/pull/287) [`f4a710d`](https://github.com/apollographql/apollo-utils/commit/f4a710dbe22bf1b579299e1438ac6cb45ec912ab) Thanks [@glasser](https://github.com/glasser)! - Initial release
