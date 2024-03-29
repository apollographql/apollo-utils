import type { KeyValueCache, KeyValueCacheSetOptions } from "./KeyValueCache";
import type { Logger } from "@apollo/utils.logger";

/**
 * This cache wraps a KeyValueCache and returns undefined (a cache miss) for any
 * errors thrown by the underlying cache. You can also provide a logger to
 * capture these errors rather than just swallow them.
 */
export class ErrorsAreMissesCache<
  V = string,
  SO extends KeyValueCacheSetOptions = KeyValueCacheSetOptions,
> implements KeyValueCache<V, SO>
{
  constructor(
    private cache: KeyValueCache<V, SO>,
    private logger?: Logger,
  ) {}

  async get(key: string): Promise<V | undefined> {
    try {
      return await this.cache.get(key);
    } catch (e) {
      if (this.logger) {
        if (e instanceof Error) {
          this.logger.error(e.message);
        } else {
          this.logger.error(e);
        }
      }
      return undefined;
    }
  }

  async set(key: string, value: V, opts?: SO): Promise<void> {
    return this.cache.set(key, value, opts);
  }

  async delete(key: string): Promise<boolean | void> {
    return this.cache.delete(key);
  }
}
