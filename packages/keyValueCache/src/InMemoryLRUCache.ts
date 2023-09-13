import { LRUCache } from "lru-cache";
import type { KeyValueCache, KeyValueCacheSetOptions } from "./KeyValueCache";

export type InMemoryLRUCacheSetOptions<
  V extends {} = string,
  FC = unknown,
> = Omit<LRUCache.SetOptions<string, V, FC>, "ttl"> & KeyValueCacheSetOptions;

// LRUCache wrapper to implement the KeyValueCache interface.
export class InMemoryLRUCache<
  V extends {} = string,
  SO extends InMemoryLRUCacheSetOptions<V> = InMemoryLRUCacheSetOptions<V>,
> implements KeyValueCache<V, SO>
{
  private cache: LRUCache<string, V>;

  constructor(lruCacheOpts?: LRUCache.Options<string, V, any>) {
    this.cache = new LRUCache({
      sizeCalculation: InMemoryLRUCache.sizeCalculation,
      // Create ~about~ a 30MiB cache by default. Configurable by providing
      // `lruCacheOpts`.
      maxSize: Math.pow(2, 20) * 30,
      ...lruCacheOpts,
    });
  }

  /**
   * default size calculator for strings and serializable objects, else naively
   * return 1
   */
  static sizeCalculation<V extends {}>(item: V) {
    if (typeof item === "string") {
      return item.length;
    }
    if (typeof item === "object") {
      // will throw if the object has circular references
      return Buffer.byteLength(JSON.stringify(item), "utf8");
    }
    return 1;
  }

  async set(key: string, value: V, options?: SO) {
    // If a TTL in seconds is provided, convert it to milliseconds.
    // Otherwise, default it to 0 to indicate "no TTL".
    const lruOptions = options
      ? { ...options, ttl: options.ttl ? options.ttl * 1000 : 0 }
      : undefined;
    this.cache.set(key, value, lruOptions);
  }

  async get(key: string) {
    return this.cache.get(key);
  }

  async delete(key: string) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  keys() {
    // LRUCache.keys() returns a generator (we just want an array)
    return [...this.cache.keys()];
  }
}
