import {
  generatePersistedQueryIdsAtRuntime,
  sortTopLevelDefinitions,
  generatePersistedQueryIdsFromManifest,
  createPersistedQueryManifestVerificationLink,
  type CreatePersistedQueryManifestVerificationLinkOptions,
} from "..";

import { execute, ApolloLink } from "@apollo/client";
import { PersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { createOperation as createLinkOperation } from "@apollo/client/link/utils";
import { sha256 } from "crypto-hash";
import { parse, print } from "graphql";
import { lastValueFrom, of } from "rxjs";

function createOperation({
  query,
}: Omit<ApolloLink.Request, "query"> & { query: string }) {
  return createLinkOperation({ query: parse(query) }, { client: {} as any });
}

// A link that shows what extensions and context would have been sent.
const returnExtensionsAndContextLink = new ApolloLink((operation) => {
  return of({
    data: {
      extensions: operation.extensions,
      context: operation.getContext(),
    },
  });
});

describe("persisted-query-lists", () => {
  describe("generatePersistedQueryIdsAtRuntime", () => {
    it("basic test", async () => {
      const link = new PersistedQueryLink(generatePersistedQueryIdsAtRuntime({ sha256 })).concat(returnExtensionsAndContextLink);
      const result = await lastValueFrom(
        execute(
          link,
          {
            query: parse("fragment F on Query { f } query Q { ...F }"),
          },
          { client: {} as any },
        ),
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

      const link = new PersistedQueryLink(generatePersistedQueryIdsFromManifest({
        loadManifest: () => Promise.resolve(manifest),
      })).concat(returnExtensionsAndContextLink);

      async function run(document: string) {
        return await lastValueFrom(
          execute(link, { query: parse(document) }, { client: {} as any }),
        );
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
      const link = new PersistedQueryLink(generatePersistedQueryIdsFromManifest({
        loadManifest: () => Promise.reject(new Error("nope")),
      })).concat(returnExtensionsAndContextLink);

      await expect(
        lastValueFrom(
          execute(link, { query: parse("{__typename}") }, { client: {} as any }),
        ),
      ).rejects.toThrow("nope");
    });

    it("allows manifest to be loaded synchronously", async () => {
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
        ],
      };

      const link = new PersistedQueryLink(generatePersistedQueryIdsFromManifest({
        loadManifest: () => manifest,
      })).concat(returnExtensionsAndContextLink);

      expect(
        await lastValueFrom(
          execute(link, { query: parse("query Foobar { f }") }, { client: {} as any }),
        ),
      ).toMatchInlineSnapshot(`
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
              type: "query" as const,
              body: "query Foobar {\n  f\n}",
            },
          ],
        };

        const link = createPersistedQueryManifestVerificationLink({
          loadManifest: () => Promise.resolve(manifest),
          ...options,
        }).concat(returnExtensionsAndContextLink);

        return await lastValueFrom(
          execute(link, { query: parse(document) }, { client: {} as any }),
        );
      }

      it("anonymous operation", async () => {
        const onVerificationFailed = jest.fn();

        await runAgainstLink({ onVerificationFailed }, "{ x }");

        expect(onVerificationFailed).toHaveBeenCalledTimes(1);
        expect(onVerificationFailed).toHaveBeenCalledWith({
          reason: "AnonymousOperation",
          operation: createOperation({ query: "{ x }" }),
        });
      });

      it("multi-operation document", async () => {
        const onVerificationFailed = jest.fn();

        await runAgainstLink(
          { onVerificationFailed },
          "query Q { a } query QQ { b }",
        );

        expect(onVerificationFailed).toHaveBeenCalledTimes(1);
        expect(onVerificationFailed).toHaveBeenCalledWith({
          reason: "MultipleOperations",
          operation: createOperation({ query: "query Q { a } query QQ { b }" }),
        });
      });

      it("no-operations document", async () => {
        const onVerificationFailed = jest.fn();
        // Apollo Client v4 no longer allows executing a document with only
        // fragments via the public execute() helper (it throws earlier when
        // constructing the operation). To continue testing our verification
        // logic for fragment-only documents, we manually construct an
        // ApolloLink.Operation and call link.request directly.
        const manifest = {
          format: "apollo-persisted-query-manifest",
          version: 1,
          operations: [
            {
              id: "foobar-id",
              name: "Foobar",
              type: "query" as const,
              body: "query Foobar {\n  f\n}",
            },
          ],
        };

        const link = createPersistedQueryManifestVerificationLink({
          loadManifest: () => Promise.resolve(manifest),
          onVerificationFailed,
        }).concat(returnExtensionsAndContextLink);

        // Minimal handcrafted operation object (bypasses createOperation)
        const context: any = {};
        const operation: ApolloLink.Operation = {
          query: parse("fragment F on T { f }"),
          variables: {},
          operationName: "",
          extensions: {},
          getContext: () => context,
          setContext: (next: any) => Object.assign(context, next),
        } as any;

        // Directly invoke the request method so we can pass a fragment-only
        // document; provide a dummy forward observable.
        await lastValueFrom(
          (link.request as any)(operation, () => of({ data: {} })),
        );

        expect(onVerificationFailed).toHaveBeenCalledTimes(1);
        expect(onVerificationFailed).toHaveBeenCalledWith({
          reason: "NoOperations",
          operation: expect.objectContaining({ query: parse("fragment F on T { f }") }),
        });
      });

      it("unknown operation name", async () => {
        const onVerificationFailed = jest.fn();

        await runAgainstLink({ onVerificationFailed }, "query Foo { f }");

        expect(onVerificationFailed).toHaveBeenCalledTimes(1);
        expect(onVerificationFailed).toHaveBeenCalledWith({
          reason: "UnknownOperation",
          operation: createOperation({ query: "query Foo { f }" }),
        });
      });

      it("operation mismatch", async () => {
        const onVerificationFailed = jest.fn();

        await runAgainstLink(
          { onVerificationFailed },
          "query Foobar { different }",
        );

        expect(onVerificationFailed).toHaveBeenCalledTimes(1);
        expect(onVerificationFailed).toHaveBeenCalledWith({
          reason: "OperationMismatch",
          operation: createOperation({ query: "query Foobar { different }" }),
          manifestOperation: {
            id: "foobar-id",
            name: "Foobar",
            type: "query" as const,
            body: "query Foobar {\n  f\n}",
          },
        });
      });

      it("operation on the manifest", async () => {
        const onVerificationFailed = jest.fn();

        await runAgainstLink(
          { onVerificationFailed },
          "query Foobar {\n  f\n}",
        );

        expect(onVerificationFailed).not.toHaveBeenCalled();
      });

      it("allows manifest to be loaded synchronously", async () => {
        const manifest = {
          format: "apollo-persisted-query-manifest",
          version: 1,
          operations: [
            {
              id: "foobar-id",
              name: "Foobar",
              type: "query" as const,
              body: "query Foobar {\n  f\n}",
            },
          ],
        };

        const onVerificationFailed = jest.fn();

        const link = createPersistedQueryManifestVerificationLink({
          loadManifest: () => manifest,
          onVerificationFailed,
        }).concat(returnExtensionsAndContextLink);

        await lastValueFrom(
          execute(link, { query: parse("query Foobar {\n  f\n}") }, { client: {} as any }),
        );

        expect(onVerificationFailed).not.toHaveBeenCalled();
      });
    });

    it("error loading manifest", async () => {
      const link = createPersistedQueryManifestVerificationLink({
        // Make the load truly async.
        loadManifest: () => Promise.reject(new Error("nope")),
      }).concat(returnExtensionsAndContextLink);

      await expect(
        lastValueFrom(
          execute(link, { query: parse("{__typename}") }, { client: {} as any }),
        ),
      ).rejects.toThrow("nope");
    });
  });
});
