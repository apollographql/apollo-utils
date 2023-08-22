import path from "path";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { createHash } from "node:crypto";
import { equal } from "@wry/equality";
import type { PersistedQueryManifestOperation } from "../index";

test("Succeeds and writes manifest file with no operations", async () => {
  const { execute, cleanup, readFile } = await prepareEnvironment();

  const { code, stdout } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(stdout).toEqual(["Manifest written to persisted-query-manifest.json"]);
  expect(code).toBe(0);

  expect(manifest).toBeManifestWithOperations([]);

  await cleanup();
});

test("Can read operations from .graphql files by default", async () => {
  const query = `
query GreetingQuery {
  greeting
}
`.trim();
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();

  await writeFile("./src/query.graphql", query);

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    { id: sha256(query), name: "GreetingQuery", body: query, type: "query" },
  ]);

  await cleanup();
});

function sha256(query: string) {
  return createHash("sha256").update(query).digest("hex");
}

function getCommand(args: string = "") {
  return `${path.resolve(__dirname, "../../cli.js")} ${args}`.trim();
}

interface ApolloCustomMatchers<R = void> {
  toBeManifestWithOperations(operations: PersistedQueryManifestOperation[]): R;
}

declare global {
  namespace jest {
    interface Matchers<R = void> extends ApolloCustomMatchers<R> {}
  }
}

expect.extend({
  toBeManifestWithOperations(
    manifestJSON: string,
    operations: PersistedQueryManifestOperation[],
  ) {
    const manifest = JSON.parse(manifestJSON) as Record<string, unknown>;
    const pass = equal(manifest, {
      format: "apollo-persisted-query-manifest",
      version: 1,
      operations,
    });

    return {
      pass,
      message: () => {
        const diff = this.utils.diff(manifest, {
          format: "apollo-persisted-query-manifest",
          version: 1,
          operations,
        });

        return `Expected manifest ${
          this.isNot ? "not " : ""
        }to be persisted query manifest.\n\n${diff}`;
      },
    };
  },
});
