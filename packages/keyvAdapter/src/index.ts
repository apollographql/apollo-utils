import type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from "@apollo/utils.keyvaluecache";
import Keyv from "keyv";
import Dataloader from "dataloader";

interface KeyvAdapterOptions {
  disableBatchReads?: boolean;
}

export class KeyvAdapter<V = string> implements KeyValueCache<V> {
  private readonly keyv: Keyv<V>;
  private readonly dataloader: Dataloader<string, V | undefined> | undefined;

  constructor(keyv?: Keyv<V>, options?: KeyvAdapterOptions) {
    this.keyv = keyv ?? new Keyv<V>();
    this.dataloader = options?.disableBatchReads
      ? undefined
      : new Dataloader(
          (keys) =>
            // @ts-expect-error Typings error in `keyv`, see: https://github.com/jaredwray/keyv/pull/359
            this.keyv.get([...keys]),
          { cache: false },
        );
  }

  async get(key: string): Promise<V | undefined> {
    return this.dataloader ? this.dataloader.load(key) : this.keyv.get(key);
  }

  async set(
    key: string,
    value: V,
    opts?: KeyValueCacheSetOptions,
  ): Promise<void> {
    // Maybe an unnecessary precaution, just being careful with 0 here. Keyv
    // currently handles 0 as `undefined`. Also `NaN` is typeof `number`
    if (typeof opts?.ttl === "number" && !Number.isNaN(opts.ttl)) {
      await this.keyv.set(key, value, opts.ttl * 1000);
    } else {
      await this.keyv.set(key, value);
    }
  }

  async delete(key: string): Promise<boolean> {
    return this.keyv.delete(key);
  }
}
