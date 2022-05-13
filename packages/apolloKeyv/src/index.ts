import type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from "@apollo/utils.keyvaluecache";
import Keyv from "keyv";

export class ApolloKeyv<V = string> implements KeyValueCache<V> {
  private readonly keyv: Keyv<V>;

  constructor(keyv?: Keyv<V>) {
    this.keyv = keyv ?? new Keyv<V>();
  }

  async get(key: string) {
    return this.keyv.get(key);
  }

  async set(key: string, value: V, opts?: KeyValueCacheSetOptions) {
    // Maybe an unnecessary precaution, just being careful with 0 here. Keyv
    // currently handles 0 as `undefined`. Also `NaN` is typeof `number`
    if (typeof opts?.ttl === "number" && !Number.isNaN(opts.ttl)) {
      this.keyv.set(key, value, opts.ttl * 1000);
    } else {
      this.keyv.set(key, value);
    }
  }

  async delete(key: string) {
    return this.keyv.delete(key);
  }

  async clear() {
    return this.keyv.clear();
  }

  async has(key: string) {
    return this.keyv.has(key);
  }
}
