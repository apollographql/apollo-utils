import type { KeyValueCache } from "@apollo/utils.keyvaluecache";
import Keyv, { type KeyvStoreAdapter } from "keyv";
import { expectType } from "ts-expect";
import { KeyvAdapter } from "..";

describe("KeyvAdapter", () => {
  it("implements KeyValueCache", () => {
    expectType<KeyValueCache<string>>(new KeyvAdapter<string>());
  });

  it("defaults to `string` type", () => {
    // TS will actually over-infer the type of KeyvAdapter without this
    // intermediate variable (demonstrated more clearly in the next test).
    const keyvAdapter = new KeyvAdapter();
    expectType<KeyValueCache<string>>(keyvAdapter);
  });

  it("defaults to `string` type, incompatible with `number` type", () => {
    const keyvAdapter = new KeyvAdapter();
    // @ts-expect-error
    expectType<KeyValueCache<number>>(keyvAdapter);
  });

  it("infers type from keyv argument", () => {
    const numberKeyv = new Keyv<number>();
    expectType<KeyValueCache<number>>(new KeyvAdapter(numberKeyv));
  });

  describe("Keyv methods", () => {
    let keyv: Keyv<number>;
    let keyvAdapter: KeyvAdapter<number>;

    beforeEach(async () => {
      keyv = new Keyv<number>();
      keyvAdapter = new KeyvAdapter(keyv);

      // start with a populated cache for testing the methods
      await keyvAdapter.set("foo", 1);
    });

    it("set", async () => {
      const setSpy = jest.spyOn(keyv, "set");
      await keyvAdapter.set("bar", 1);
      expect(setSpy).toHaveBeenCalledWith("bar", 1);
    });

    it("set with ttl (in SECONDS)", async () => {
      const setSpy = jest.spyOn(keyv, "set");
      await keyvAdapter.set("bar", 1, { ttl: 1 });
      expect(setSpy).toHaveBeenCalledWith("bar", 1, 1000);
    });

    it("correctly awaits `set` call", async () => {
      let storeSetCalled = false;
      const store = {
        set: async () => {
          await new Promise<void>((resolve) => setImmediate(() => resolve()));
          storeSetCalled = true;
        },
        get: async () => "abc",
        delete: async () => true,
        clear: async () => {},
        has: () => true,
      };

      keyv = new Keyv({ store });
      keyvAdapter = new KeyvAdapter(keyv);

      await keyvAdapter.set("bar", 1);
      expect(storeSetCalled).toBe(true);
    });

    it("get (batching enabled - default)", async () => {
      const getSpy = jest.spyOn(keyv, "get");
      const result = await keyvAdapter.get("foo");
      expect(result).toBe(1);
      expect(getSpy).toHaveBeenCalledWith(["foo"]);
    });

    it("get (batching disabled)", async () => {
      const keyvAdapter = new KeyvAdapter(keyv, { disableBatchReads: true });
      const getSpy = jest.spyOn(keyv, "get");
      const result = await keyvAdapter.get("foo");
      expect(result).toBe(1);
      expect(getSpy).toHaveBeenCalledWith("foo");
    });

    it("multiple `get`s are batched", async () => {
      class MapStore implements KeyvStoreAdapter {
        private map = new Map<string, any>();
        opts: any = {};
        namespace?: string;
        getMany = jest.fn((keys: string[]) =>
          Promise.resolve(keys.map((key) => this.map.get(key))),
        );
        get<Value>(key: string) {
          return Promise.resolve(this.map.get(key) as Value);
        }
        set(key: string, value: any) {
          this.map.set(key, value);
        }
        delete(key: string) {
          return Promise.resolve(this.map.delete(key));
        }
        clear() {
          this.map.clear();
          return Promise.resolve();
        }
        on(): this {
          return this;
        }
      }

      const storeWithGetMany = new MapStore();
      const keyv = new Keyv({ store: storeWithGetMany });
      const keyvAdapter = new KeyvAdapter(keyv);

      await keyvAdapter.set("foo", 1);
      await keyvAdapter.set("bar", 2);

      const getSpy = jest.spyOn(keyv, "get");
      const results = await Promise.all([
        keyvAdapter.get("foo"),
        keyvAdapter.get("bar"),
      ]);
      expect(results).toEqual([1, 2]);

      expect(keyv["opts"]["store"]["getMany"]).toHaveBeenCalledWith([
        "keyv:foo",
        "keyv:bar",
      ]);
      expect(getSpy).toHaveBeenCalledWith(["foo", "bar"]);
    });

    it("delete", async () => {
      const deleteSpy = jest.spyOn(keyv, "delete");
      const result = await keyvAdapter.delete("foo");
      expect(result).toBeTruthy();
      expect(deleteSpy).toHaveBeenCalledWith("foo");
    });
  });

  describe("Dataloader implementation details", () => {
    it("enforces the Dataloader contract (1:1 key to value)", async () => {
      class GetManyReturnsSingularUndefinedStore implements KeyvStoreAdapter {
        opts: any = {};
        namespace?: string;
        getMany(keys: string[]) {
          return Promise.resolve(Array(keys.length).fill(undefined));
        }
        get() {
          return Promise.resolve(undefined);
        }
        set() {
          return;
        }
        delete() {
          return Promise.resolve(true);
        }
        clear() {
          return Promise.resolve();
        }
        on(): this {
          return this;
        }
      }

      const keyvAdapter = new KeyvAdapter(
        new Keyv({ store: new GetManyReturnsSingularUndefinedStore() }),
      );
      await expect(keyvAdapter.get("abc")).resolves.toBeUndefined();
    });
  });
});
