import type { Logger } from "@apollo/utils.logger";
import { ErrorsAreMissesCache } from "../ErrorsAreMissesCache";
import type { KeyValueCache, KeyValueCacheSetOptions } from "../KeyValueCache";

interface CustomKeyValueCacheSetOptions extends KeyValueCacheSetOptions {
  noDisposeOnSet?: boolean;
  noUpdateTTL?: boolean;
}

describe("ErrorsAreMissesCache", () => {
  const knownErrorMessage = "Service is down";
  const errorProneCache: KeyValueCache = {
    async get() {
      throw new Error(knownErrorMessage);
    },
    async set() {},
    async delete() {},
  };

  it("returns undefined when the underlying cache throws an error", async () => {
    const errorsAreMisses = new ErrorsAreMissesCache(errorProneCache);
    await expect(errorProneCache.get("foo")).rejects.toBeInstanceOf(Error);
    await expect(errorsAreMisses.get("foo")).resolves.toBe(undefined);
  });

  it("logs to provided logger when underlying cache throws", async () => {
    let loggedMessage = "";
    const logger: Logger = {
      debug() {},
      info() {},
      warn() {},
      error: (message) => {
        loggedMessage = message;
      },
    };

    const errorsAreMisses = new ErrorsAreMissesCache(errorProneCache, logger);
    await expect(errorsAreMisses.get("foo")).resolves.toBe(undefined);
    expect(loggedMessage).toBe(knownErrorMessage);
  });

  it("passes through calls to the underlying cache", async () => {
    const mockCache: KeyValueCache<string, CustomKeyValueCacheSetOptions> = {
      get: jest.fn(async () => "foo"),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const errorsAreMisses = new ErrorsAreMissesCache(mockCache);
    await expect(errorsAreMisses.get("key")).resolves.toBe("foo");
    expect(mockCache.get).toHaveBeenCalledWith("key");

    await errorsAreMisses.set("key", "foo");
    expect(mockCache.set).toHaveBeenCalledWith("key", "foo", undefined);
    await errorsAreMisses.set("keyWithOptions", "foo", {
      ttl: 1000,
      noDisposeOnSet: true,
      noUpdateTTL: true,
    });
    expect(mockCache.set).toHaveBeenLastCalledWith("keyWithOptions", "foo", {
      ttl: 1000,
      noDisposeOnSet: true,
      noUpdateTTL: true,
    });

    await errorsAreMisses.delete("key");
    expect(mockCache.delete).toHaveBeenCalledWith("key");
  });
});
