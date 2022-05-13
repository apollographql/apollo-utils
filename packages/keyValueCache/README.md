# KeyValueCache interface

```ts
export interface KeyValueCache<V = string> {
  get(key: string): Promise<V | undefined>;
  set(key: string, value: V, options?: KeyValueCacheSetOptions): Promise<void>;
  delete(key: string): Promise<boolean | void>;
}
```

This interface defines a minimally-compatible cache intended for (but not limited to) use by Apollo Server. It is notably implemented by `ApolloKeyv` from the `@apollo/utils.apollokeyv` package. (`ApolloKeyv` in conjunction with a `Keyv` is probably more interesting to you unless you're actually building a cache!)
