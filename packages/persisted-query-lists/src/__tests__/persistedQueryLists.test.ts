import {
  generatePersistedQueryIdsAtRuntime,
  sortTopLevelDefinitions,
  generatePersistedQueryIdsFromManifest,
  createPersistedQueryManifestVerificationLink,
  type CreatePersistedQueryManifestVerificationLinkOptions,
} from "..";

import {
  execute,
  toPromise,
  ApolloLink,
  Observable,
  type GraphQLRequest,
} from "@apollo/client/core";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import {
  createOperation as createLinkOperation,
  transformOperation,
} from "@apollo/client/link/utils";
import { sha256 } from "crypto-hash";
import { parse, print } from "graphql";

function createOperation({
  query,
}: Omit<GraphQLRequest, "query"> & { query: string }) {
  return createLinkOperation({}, transformOperation({ query: parse(query) }));
}

// A link that shows what extensions and context would have been sent.
const returnExtensionsAndContextLink = new ApolloLink((operation) => {
  return Observable.of({
    data: {
      extensions: operation.extensions,
      context: operation.getContext(),
    },
  });
});

describe("persisted-query-lists", () => {
  describe("generatePersistedQueryIdsAtRuntime", () => {
    it("basic test", async () => {
      const link = createPersistedQueryLink(
        generatePersistedQueryIdsAtRuntime({ sha256 }),
      ).concat(returnExtensionsAndContextLink);
      const result = await toPromise(
        execute(link, {
          query: parse("fragment F on Query { f } query Q { ...F }"),
        }),
      );
      const expectedSha256 = await sha256(
        "query Q {\n  ...F\n}\n\nfragment F on Query {\n  f\n}",
      );
      expect(result.data?.extensions?.persistedQuery?.sha256Hash).toBe(
        expectedSha256,
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "context": {
              "http": {
                "includeExtensions": true,
                "includeQuery": false,
              },
            },
            "extensions": {
              "persistedQuery": {
                "sha256Hash": "a380c7a6286bee9726f3e0ada97971008cb6ddf13de56444ae2c363499b2d2ee",
                "version": 1,
              },
            },
          },
        }
      `);
    });
  });

  describe("generatePersistedQueryIdsFromManifest", () => {
    it("basic test", async () => {
      const manifest = {
        format: "apollo-persisted-query-manifest",
        version: 1,
        operations: [
          {
            id: "foobar-id",
            name: "Foobar",
            type: "query",
            body: "query Foobar { f }",
          },
          {
            id: "baz-id",
            name: "Baz",
            type: "query",
            body: "query Blarg { fff }",
          },
        ],
      };

      const link = createPersistedQueryLink(
        generatePersistedQueryIdsFromManifest({
          loadManifest: () => Promise.resolve(manifest),
        }),
      ).concat(returnExtensionsAndContextLink);

      async function run(document: string) {
        return await toPromise(execute(link, { query: parse(document) }));
      }
      // Normal case: you're using the right operation from the list.
      expect(await run("query Foobar { f }")).toMatchInlineSnapshot(`
        {
          "data": {
            "context": {
              "http": {
                "includeExtensions": true,
                "includeQuery": false,
              },
            },
            "extensions": {
              "persistedQuery": {
                "sha256Hash": "foobar-id",
                "version": 1,
              },
            },
          },
        }
      `);
      // But also note that it just matches the operation name given at runtime
      // against the "name" in the manifest; it ignores the "body" in the
      // manifest and the rest of the runtime body.
      expect(await run("query Baz { f }")).toMatchInlineSnapshot(`
        {
          "data": {
            "context": {
              "http": {
                "includeExtensions": true,
                "includeQuery": false,
              },
            },
            "extensions": {
              "persistedQuery": {
                "sha256Hash": "baz-id",
                "version": 1,
              },
            },
          },
        }
      `);
    });

    it("error loading manifest", async () => {
      const link = createPersistedQueryLink(
        generatePersistedQueryIdsFromManifest({
          loadManifest: () => Promise.reject(new Error("nope")),
        }),
      ).concat(returnExtensionsAndContextLink);

      await expect(
        toPromise(execute(link, { query: parse("{__typename}") })),
      ).rejects.toThrow("nope");
    });
  });

  describe("sortTopLevelDefinitions", () => {
    it("basic test", () => {
      function sort(query: string): string {
        return print(sortTopLevelDefinitions(parse(query)));
      }

      expect(
        sort(
          "fragment F on T {f} fragment D on T {f} query X {f} mutation B {f} fragment A on T {f} subscription {f}",
        ),
      ).toMatchInlineSnapshot(`
              "subscription {
                f
              }

              mutation B {
                f
              }

              query X {
                f
              }

              fragment A on T {
                f
              }

              fragment D on T {
                f
              }

              fragment F on T {
                f
              }"
          `);
    });
  });

  describe("createPersistedQueryManifestVerificationLink", () => {
    describe("basic tests", () => {
      async function runAgainstLink(
        options: Omit<
          CreatePersistedQueryManifestVerificationLinkOptions,
          "loadManifest"
        >,
        document: string,
      ) {
        const manifest = {
          format: "apollo-persisted-query-manifest",
          version: 1,
          operations: [
            {
              id: "foobar-id",
              name: "Foobar",
              type: "query",
              body: "query Foobar {\n  f\n}",
            },
          ],
        };

        const link = createPersistedQueryManifestVerificationLink({
          loadManifest: () => Promise.resolve(manifest),
          ...options,
        }).concat(returnExtensionsAndContextLink);

        return await toPromise(execute(link, { query: parse(document) }));
      }

      it("anonymous operation", async () => {
        const onError = jest.fn();
        await runAgainstLink({ onError }, "{ x }");
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith({
          reason: "AnonymousOperation",
          operation: createOperation({ query: "{ x }" }),
        });
      });

      it("multi-operation document", async () => {
        const onError = jest.fn();
        await runAgainstLink({ onError }, "query Q { a } query QQ { b }");
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith({
          reason: "MultipleOperations",
          operation: createOperation({ query: "query Q { a } query QQ { b }" }),
        });
      });

      it("no-operations document", async () => {
        const onError = jest.fn();
        await runAgainstLink({ onError }, "fragment F on T { f }");
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith({
          reason: "NoOperations",
          operation: createOperation({ query: "fragment F on T { f }" }),
        });
      });

      it("unknown operation name", async () => {
        const onError = jest.fn();
        await runAgainstLink({ onError }, "query Foo { f }");
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith({
          reason: "UnknownOperation",
          operation: createOperation({ query: "query Foo { f }" }),
        });
      });

      it("different body", async () => {
        const onError = jest.fn();
        await runAgainstLink({ onError }, "query Foobar { different }");
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith({
          reason: "QueryMismatch",
          operation: createOperation({ query: "query Foobar { different }" }),
          manifestDefinition: print(parse("query Foobar {\n  f\n}")),
        });
      });

      it("operation on the manifest", async () => {
        const onError = jest.fn();
        await runAgainstLink({ onError }, "query Foobar {\n  f\n}");
        expect(onError).not.toHaveBeenCalled();
      });
    });

    it("error loading manifest", async () => {
      const link = createPersistedQueryManifestVerificationLink({
        // Make the load truly async.
        loadManifest: () => Promise.reject(new Error("nope")),
      }).concat(returnExtensionsAndContextLink);

      await expect(
        toPromise(execute(link, { query: parse("{__typename}") })),
      ).rejects.toThrow("nope");
    });
  });
});
