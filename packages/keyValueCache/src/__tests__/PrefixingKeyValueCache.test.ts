import { InMemoryLRUCache, type InMemoryLRUCacheSetOptions } from "..";
import { PrefixingKeyValueCache } from "../PrefixingKeyValueCache";

interface CustomKeyValueCacheSetOptions extends InMemoryLRUCacheSetOptions {
  tags?: string[];
}

describe("PrefixingKeyValueCache", () => {
  it("prefixes", async () => {
    const inner = new InMemoryLRUCache();
    const prefixing = new PrefixingKeyValueCache(inner, "prefix:");
    await prefixing.set("foo", "bar");
    expect(await prefixing.get("foo")).toBe("bar");
    expect(await inner.get("prefix:foo")).toBe("bar");
    await prefixing.delete("foo");
    expect(await prefixing.get("foo")).toBe(undefined);
  });

  it("PrefixesAreUnnecessaryForIsolationCache", async () => {
    const inner = new InMemoryLRUCache();
    const prefixesAreUnnecessaryForIsolationCache =
      PrefixingKeyValueCache.cacheDangerouslyDoesNotNeedPrefixesForIsolation(
        inner,
      );
    const prefixing = new PrefixingKeyValueCache(
      prefixesAreUnnecessaryForIsolationCache,
      "prefix:",
    );

    for (const cache of [prefixesAreUnnecessaryForIsolationCache, prefixing]) {
      await cache.set("x", "a");
      expect(await cache.get("x")).toBe("a");
      expect(inner.keys().length).toBe(1);
      // The prefix is not applied!
      expect(await inner.get("x")).toBe("a");
      await cache.delete("x");
      expect(await cache.get("x")).toBe(undefined);
      expect(inner.keys().length).toBe(0);
    }

    expect(
      PrefixingKeyValueCache.prefixesAreUnnecessaryForIsolation(inner),
    ).toBe(false);
    expect(
      PrefixingKeyValueCache.prefixesAreUnnecessaryForIsolation(
        prefixesAreUnnecessaryForIsolationCache,
      ),
    ).toBe(true);
    expect(
      PrefixingKeyValueCache.prefixesAreUnnecessaryForIsolation(prefixing),
    ).toBe(true);
  });

  it("prefixes with custom extended options", async () => {
    const inner = new InMemoryLRUCache<string, CustomKeyValueCacheSetOptions>();
    const spyOnCacheSet = jest.spyOn(inner, "set");
    const prefixing = new PrefixingKeyValueCache(inner, "prefix:");

    await prefixing.set("key", "foo");
    expect(spyOnCacheSet).toBeCalledWith("prefix:key", "foo", undefined);

    expect(await prefixing.get("key")).toBe("foo");
    expect(await inner.get("prefix:key")).toBe("foo");
    await prefixing.delete("key");
    expect(await prefixing.get("key")).toBe(undefined);

    await prefixing.set("keyWithOptions", "bar", {
      ttl: 1000,
      tags: ["tag1", "tag2"],
    });
    expect(spyOnCacheSet).toBeCalledWith("prefix:keyWithOptions", "bar", {
      ttl: 1000,
      tags: ["tag1", "tag2"],
    });

    expect(await prefixing.get("keyWithOptions")).toBe("bar");
    expect(await inner.get("prefix:keyWithOptions")).toBe("bar");
    await prefixing.delete("keyWithOptions");
    expect(await prefixing.get("keyWithOptions")).toBe(undefined);
  });
});
