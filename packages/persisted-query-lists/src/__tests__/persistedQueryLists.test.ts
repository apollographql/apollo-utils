import {
  generatePersistedQueryIdsAtRuntime,
  sortTopLevelDefinitions,
  generatePersistedQueryIdsFromManifest,
  createPersistedQueryManifestVerificationLink,
  CreatePersistedQueryManifestVerificationLinkOptions,
} from "..";

import {
  execute,
  toPromise,
  ApolloLink,
  Observable,
} from "@apollo/client/core";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { sha256 } from "crypto-hash";
import { parse, print } from "graphql";

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
        generatePersistedQueryIdsFromManifest({ manifest }),
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
    async function runAgainstLink(
      options: Omit<
        CreatePersistedQueryManifestVerificationLinkOptions,
        "manifest"
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
        manifest,
        ...options,
      }).concat(returnExtensionsAndContextLink);

      return await toPromise(execute(link, { query: parse(document) }));
    }

    it("anonymous operation", async () => {
      const onAnonymousOperation = jest.fn();
      const onMultiOperationDocument = jest.fn();
      const onNoOperationsDocument = jest.fn();
      const onUnknownOperationName = jest.fn();
      const onDifferentBody = jest.fn();
      await runAgainstLink(
        {
          onAnonymousOperation,
          onMultiOperationDocument,
          onNoOperationsDocument,
          onUnknownOperationName,
          onDifferentBody,
        },
        "{ x }",
      );
      expect(onAnonymousOperation).toHaveBeenCalled();
      expect(onMultiOperationDocument).not.toHaveBeenCalled();
      expect(onNoOperationsDocument).not.toHaveBeenCalled();
      expect(onUnknownOperationName).not.toHaveBeenCalled();
      expect(onDifferentBody).not.toHaveBeenCalled();
    });

    it("multi-operation document", async () => {
      const onAnonymousOperation = jest.fn();
      const onMultiOperationDocument = jest.fn();
      const onNoOperationsDocument = jest.fn();
      const onUnknownOperationName = jest.fn();
      const onDifferentBody = jest.fn();
      await runAgainstLink(
        {
          onAnonymousOperation,
          onMultiOperationDocument,
          onNoOperationsDocument,
          onUnknownOperationName,
          onDifferentBody,
        },
        "query Q { a } query QQ { b }",
      );
      expect(onAnonymousOperation).not.toHaveBeenCalled();
      expect(onMultiOperationDocument).toHaveBeenCalled();
      expect(onNoOperationsDocument).not.toHaveBeenCalled();
      expect(onUnknownOperationName).not.toHaveBeenCalled();
      expect(onDifferentBody).not.toHaveBeenCalled();
    });

    it("no-operations document", async () => {
      const onAnonymousOperation = jest.fn();
      const onMultiOperationDocument = jest.fn();
      const onNoOperationsDocument = jest.fn();
      const onUnknownOperationName = jest.fn();
      const onDifferentBody = jest.fn();
      await runAgainstLink(
        {
          onAnonymousOperation,
          onMultiOperationDocument,
          onNoOperationsDocument,
          onUnknownOperationName,
          onDifferentBody,
        },
        "fragment F on T { f }",
      );
      expect(onAnonymousOperation).not.toHaveBeenCalled();
      expect(onMultiOperationDocument).not.toHaveBeenCalled();
      expect(onNoOperationsDocument).toHaveBeenCalled();
      expect(onUnknownOperationName).not.toHaveBeenCalled();
      expect(onDifferentBody).not.toHaveBeenCalled();
    });

    it("unknown operation name", async () => {
      const onAnonymousOperation = jest.fn();
      const onMultiOperationDocument = jest.fn();
      const onNoOperationsDocument = jest.fn();
      const onUnknownOperationName = jest.fn();
      const onDifferentBody = jest.fn();
      await runAgainstLink(
        {
          onAnonymousOperation,
          onMultiOperationDocument,
          onNoOperationsDocument,
          onUnknownOperationName,
          onDifferentBody,
        },
        "query Foo { f }",
      );
      expect(onAnonymousOperation).not.toHaveBeenCalled();
      expect(onMultiOperationDocument).not.toHaveBeenCalled();
      expect(onNoOperationsDocument).not.toHaveBeenCalled();
      expect(onUnknownOperationName).toHaveBeenCalled();
      expect(onDifferentBody).not.toHaveBeenCalled();
    });

    it("different body", async () => {
      const onAnonymousOperation = jest.fn();
      const onMultiOperationDocument = jest.fn();
      const onNoOperationsDocument = jest.fn();
      const onUnknownOperationName = jest.fn();
      const onDifferentBody = jest.fn();
      await runAgainstLink(
        {
          onAnonymousOperation,
          onMultiOperationDocument,
          onNoOperationsDocument,
          onUnknownOperationName,
          onDifferentBody,
        },
        "query Foobar { different }",
      );
      expect(onAnonymousOperation).not.toHaveBeenCalled();
      expect(onMultiOperationDocument).not.toHaveBeenCalled();
      expect(onNoOperationsDocument).not.toHaveBeenCalled();
      expect(onUnknownOperationName).not.toHaveBeenCalled();
      expect(onDifferentBody).toHaveBeenCalled();
    });

    it("operation on the manifest", async () => {
      const onAnonymousOperation = jest.fn();
      const onMultiOperationDocument = jest.fn();
      const onNoOperationsDocument = jest.fn();
      const onUnknownOperationName = jest.fn();
      const onDifferentBody = jest.fn();
      await runAgainstLink(
        {
          onAnonymousOperation,
          onMultiOperationDocument,
          onNoOperationsDocument,
          onUnknownOperationName,
          onDifferentBody,
        },
        "query Foobar {\n  f\n}",
      );
      expect(onAnonymousOperation).not.toHaveBeenCalled();
      expect(onMultiOperationDocument).not.toHaveBeenCalled();
      expect(onNoOperationsDocument).not.toHaveBeenCalled();
      expect(onUnknownOperationName).not.toHaveBeenCalled();
      expect(onDifferentBody).not.toHaveBeenCalled();
    });
  });
});
