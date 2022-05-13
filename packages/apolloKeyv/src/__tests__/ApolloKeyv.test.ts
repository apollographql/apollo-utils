import type { KeyValueCache } from "@apollo/utils.keyvaluecache";
import Keyv from "keyv";
import { expectType } from "ts-expect";
import { ApolloKeyv } from "..";

describe("ApolloKeyv", () => {
  it("implements KeyValueCache", () => {
    expectType<KeyValueCache<string>>(new ApolloKeyv<string>());
  });

  it("defaults to `string` type", () => {
    // TS will actually over-infer the type of ApolloKeyv without this
    // intermediate variable (demonstrated more clearly in the next test).
    const apolloKeyv = new ApolloKeyv();
    expectType<KeyValueCache<string>>(apolloKeyv);
  });

  it("defaults to `string` type, incompatible with `number` type", () => {
    const apolloKeyv = new ApolloKeyv();
    // @ts-expect-error
    expectType<KeyValueCache<number>>(apolloKeyv);
  });

  it("infers type from keyv argument", () => {
    const numberKeyv = new Keyv<number>();
    expectType<KeyValueCache<number>>(new ApolloKeyv(numberKeyv));
  });

  describe("Keyv methods", () => {
    let keyv: Keyv<number>;
    let cache: ApolloKeyv<number>;

    beforeEach(async () => {
      keyv = new Keyv<number>();
      cache = new ApolloKeyv(keyv);

      // start with a populated cache for testing the methods
      await cache.set("foo", 1);
    });

    it("set", async () => {
      const setSpy = jest.spyOn(keyv, "set");
      await cache.set("bar", 1);
      expect(setSpy).toHaveBeenCalledWith("bar", 1);
    });

    it("set with ttl (in SECONDS)", async () => {
      const setSpy = jest.spyOn(keyv, "set");
      await cache.set("bar", 1, { ttl: 1 });
      expect(setSpy).toHaveBeenCalledWith("bar", 1, 1000);
    });

    it("get", async () => {
      const getSpy = jest.spyOn(keyv, "get");
      const result = await cache.get("foo");
      expect(result).toBe(1);
      expect(getSpy).toHaveBeenCalledWith("foo");
    });

    it("delete", async () => {
      const deleteSpy = jest.spyOn(keyv, "delete");
      const result = await cache.delete("foo");
      expect(result).toBeTruthy();
      expect(deleteSpy).toHaveBeenCalledWith("foo");
    });

    it("has", async () => {
      const hasSpy = jest.spyOn(keyv, "has");
      const result = await cache.has("foo");
      expect(result).toBeTruthy();
      expect(hasSpy).toHaveBeenCalledWith("foo");
    });
  });
});
