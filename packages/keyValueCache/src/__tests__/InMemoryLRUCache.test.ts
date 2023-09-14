import type { LRUCache } from "lru-cache";
import { InMemoryLRUCache } from "..";

interface CustomKeyValueCacheSetOptions
  extends LRUCache.SetOptions<string, string, Record<string, string>> {
  tags?: string[];
}

describe("InMemoryLRUCache", () => {
  const cache = new InMemoryLRUCache();

  it("can set and get", async () => {
    await cache.set("hello", "world");

    expect(await cache.get("hello")).toEqual("world");
    expect(await cache.get("missing")).toEqual(undefined);
  });

  it("can set and delete", async () => {
    await cache.set("hello2", "world");
    expect(await cache.get("hello2")).toEqual("world");

    await cache.delete("hello2");
    expect(await cache.get("hello2")).toEqual(undefined);
  });

  it("can expire keys based on ttl", async () => {
    await cache.set("short", "s", { ttl: 0.01 });
    await cache.set("long", "l", { ttl: 0.05 });
    expect(await cache.get("short")).toEqual("s");
    expect(await cache.get("long")).toEqual("l");

    await sleep(15);
    expect(await cache.get("short")).toEqual(undefined);
    expect(await cache.get("long")).toEqual("l");

    await sleep(40);
    expect(await cache.get("short")).toEqual(undefined);
    expect(await cache.get("long")).toEqual(undefined);
  });

  it("does not expire when ttl is null", async () => {
    await cache.set("forever", "yours", { ttl: null });
    expect(await cache.get("forever")).toEqual("yours");

    await sleep(1000);
    expect(await cache.get("forever")).toEqual("yours");
  });

  it("with custom extended options", async () => {
    const customCache = new InMemoryLRUCache<
      string,
      CustomKeyValueCacheSetOptions
    >();
    const spyOnCacheSet = jest.spyOn((customCache as any).cache, "set");

    await customCache.set("key", "foo");
    expect(spyOnCacheSet).toBeCalledWith("key", "foo", undefined);

    expect(await customCache.get("key")).toBe("foo");
    await customCache.delete("key");
    expect(await customCache.get("key")).toBe(undefined);

    await customCache.set("keyWithOptions", "bar", {
      ttl: 1000,
      tags: ["tag1", "tag2"],
    });
    expect(spyOnCacheSet).toBeCalledWith("keyWithOptions", "bar", {
      ttl: 1000000,
      tags: ["tag1", "tag2"],
    });

    expect(await customCache.get("keyWithOptions")).toBe("bar");
    await customCache.delete("keyWithOptions");
    expect(await customCache.get("keyWithOptions")).toBe(undefined);
  });
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
