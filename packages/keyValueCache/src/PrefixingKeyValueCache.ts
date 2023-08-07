import type { KeyValueCache, KeyValueCacheSetOptions } from ".";

const prefixesAreUnnecessaryForIsolationSymbol = Symbol(
  "prefixesAreUnnecessaryForIsolation",
);

// PrefixingKeyValueCache wraps another cache and adds a prefix to all keys used
// by all operations. This allows multiple features to share the same underlying
// cache without conflicts.
//
// Note that PrefixingKeyValueCache explicitly does not implement methods like
// flush() that aren't part of KeyValueCache, even though most KeyValueCache
// implementations also have a flush() method. Most implementations of flush()
// send a simple command that wipes the entire backend cache system, which
// wouldn't support "only wipe the part of the cache with this prefix", so
// trying to provide a flush() method here could be confusingly dangerous.
export class PrefixingKeyValueCache<
  V = string,
  O extends KeyValueCacheSetOptions = KeyValueCacheSetOptions,
> implements KeyValueCache<V, O>
{
  private prefix: string;
  [prefixesAreUnnecessaryForIsolationSymbol]?: true;

  constructor(
    private wrapped: KeyValueCache<V, O>,
    prefix: string,
  ) {
    if (PrefixingKeyValueCache.prefixesAreUnnecessaryForIsolation(wrapped)) {
      this.prefix = "";
      // If we try to again prefix this cache, we should still skip the
      // prefixing. (This would be cleaner if we made PrefixingKeyValueCaches
      // via a static method rather than the constructor and could just return
      // `wrapped`...)
      this[prefixesAreUnnecessaryForIsolationSymbol] = true;
    } else {
      this.prefix = prefix;
    }
  }

  get(key: string) {
    return this.wrapped.get(this.prefix + key);
  }
  set(key: string, value: V, options?: O) {
    return this.wrapped.set(this.prefix + key, value, options);
  }
  delete(key: string) {
    return this.wrapped.delete(this.prefix + key);
  }

  // Checks to see if a cache is a PrefixesAreUnnecessaryForIsolationCache,
  // without using instanceof (so that installing multiple copies of this
  // package doesn't break things).
  static prefixesAreUnnecessaryForIsolation<
    V = string,
    O extends KeyValueCacheSetOptions = KeyValueCacheSetOptions,
  >(c: KeyValueCache<V, O>): boolean {
    return prefixesAreUnnecessaryForIsolationSymbol in c;
  }

  static cacheDangerouslyDoesNotNeedPrefixesForIsolation<
    V = string,
    O extends KeyValueCacheSetOptions = KeyValueCacheSetOptions,
  >(c: KeyValueCache<V, O>): KeyValueCache<V, O> {
    return new PrefixesAreUnnecessaryForIsolationCache(c);
  }
}

// This class lets you opt a cache out of the prefixing provided by
// PrefixingKeyValueCache. See the README for details.
class PrefixesAreUnnecessaryForIsolationCache<
  V = string,
  O extends KeyValueCacheSetOptions = KeyValueCacheSetOptions,
> implements KeyValueCache<V, O>
{
  [prefixesAreUnnecessaryForIsolationSymbol] = true;

  constructor(private wrapped: KeyValueCache<V, O>) {}

  get(key: string) {
    return this.wrapped.get(key);
  }
  set(key: string, value: V, options?: O) {
    return this.wrapped.set(key, value, options);
  }
  delete(key: string) {
    return this.wrapped.delete(key);
  }
}
