export interface KeyValueCache<
  V = string,
  SO extends KeyValueCacheSetOptions = KeyValueCacheSetOptions,
> {
  get(key: string): Promise<V | undefined>;
  set(key: string, value: V, options?: SO): Promise<void>;
  delete(key: string): Promise<boolean | void>;
}

export interface KeyValueCacheSetOptions {
  /**
   * Specified in **seconds**, the time-to-live (TTL) value limits the lifespan
   * of the data being stored in the cache.
   */
  ttl?: number | null;
}
