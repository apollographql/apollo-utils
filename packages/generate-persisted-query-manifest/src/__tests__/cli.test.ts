import path from "node:path";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { createHash } from "node:crypto";
import { equal } from "@wry/equality";
import { readFileSync } from "node:fs";
import type { PersistedQueryManifestOperation } from "../index";

test("prints help message with --help", async () => {
  const { execute, cleanup } = await prepareEnvironment();

  const { code, stdout } = await execute("node", getCommand("--help"));

  expect(code).toBe(0);
  expect(stdout).toMatchInlineSnapshot(`
    [
      "Usage: generate-persisted-query-manifest [options]",
      "Generate a persisted query manifest file",
      "Options:",
      "-c, --config <path>  path to the config file",
      "-v, --version        output the version number",
      "-h, --help           display help for command",
    ]
  `);

  await cleanup();
});

test("prints version number with --version", async () => {
  const { execute, cleanup } = await prepareEnvironment();
  const { version } = JSON.parse(
    readFileSync(path.resolve(__dirname, "../../package.json"), "utf8"),
  );

  const { code, stdout } = await execute("node", getCommand("--version"));

  expect(code).toBe(0);
  expect(stdout).toEqual([version]);

  await cleanup();
});

test("writes manifest file and prints location", async () => {
  const { execute, cleanup, exists } = await prepareEnvironment();

  const { code, stdout } = await execute("node", getCommand());

  expect(stdout).toEqual(["Manifest written to persisted-query-manifest.json"]);
  expect(code).toBe(0);
  expect(await exists("./persisted-query-manifest.json")).toBe(true);

  await cleanup();
});

test("can read operations from .graphql files", async () => {
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

test("can read operations from .gql files", async () => {
  const query = `
query GreetingQuery {
  greeting
}
`.trim();
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();

  await writeFile("./src/query.gql", query);

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    { id: sha256(query), name: "GreetingQuery", body: query, type: "query" },
  ]);

  await cleanup();
});

test("can extract operations from JavaScript files", async () => {
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();
  const query = `
query GreetingQuery {
  greeting
}
`.trim();

  await writeFile(
    "./src/my-component.js",
    `
import { gql } from '@apollo/client';

const QUERY = gql\`
  query GreetingQuery {
    greeting
  }
\`;
`.trim(),
  );

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    { id: sha256(query), name: "GreetingQuery", body: query, type: "query" },
  ]);

  await cleanup();
});

test("can extract operations from TypeScript files", async () => {
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();
  const query = `
query GreetingQuery {
  greeting
}
`.trim();

  await writeFile(
    "./src/my-component.ts",
    `
import { gql, TypedDocumentNode } from '@apollo/client';
import { GreetingQueryType } from './types';

const QUERY: TypedDocumentNode<GreetingQueryType> = gql\`
  query GreetingQuery {
    greeting
  }
\`;
`.trim(),
  );

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    { id: sha256(query), name: "GreetingQuery", body: query, type: "query" },
  ]);

  await cleanup();
});

test("can extract operations from TypeScript React files", async () => {
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();
  const query = `
query GreetingQuery {
  greeting
}
`.trim();

  await writeFile(
    "./src/my-component.tsx",
    `
import { gql, useQuery, TypedDocumentNode } from '@apollo/client';
import { GreetingQueryType } from './types';

const QUERY: TypedDocumentNode<GreetingQueryType> = gql\`
  query GreetingQuery {
    greeting
  }
\`;

function Greeting() {
  const { data } = useQuery(QUERY);

  return <div>{data.greeting}</div>;
}

export default Greeting;
`.trim(),
  );

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    { id: sha256(query), name: "GreetingQuery", body: query, type: "query" },
  ]);

  await cleanup();
});

test("can extract multiple operations", async () => {
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();
  const query = `
query GreetingQuery {
  greeting
}
`.trim();

  const query2 = `
query HelloQuery {
  hello
}
`.trim();

  await writeFile("./src/greeting-query.graphql", query);
  await writeFile("./src/hello-query.graphql", query2);

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    { id: sha256(query), name: "GreetingQuery", body: query, type: "query" },
    { id: sha256(query2), name: "HelloQuery", body: query2, type: "query" },
  ]);

  await cleanup();
});

test("can extract mutations", async () => {
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();
  const mutation = `
mutation CreateUserMutation($user: UserInput!) {
  createUser(user: $user) {
    __typename
    id
  }
}
`.trim();

  await writeFile("./src/create-user-mutation.graphql", mutation);

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(mutation),
      name: "CreateUserMutation",
      body: mutation,
      type: "mutation",
    },
  ]);

  await cleanup();
});

test("can extract subscriptions", async () => {
  const { execute, cleanup, writeFile, readFile } = await prepareEnvironment();
  const subscription = `
subscription UserCreatedSubscription($id: ID!) {
  userCreated(id: $id) {
    __typename
    id
  }
}
`.trim();

  await writeFile("./src/user-created-subscription.graphql", subscription);

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(subscription),
      name: "UserCreatedSubscription",
      body: subscription,
      type: "subscription",
    },
  ]);

  await cleanup();
});

test("writes manifest file with no operations when none found", async () => {
  const { execute, cleanup, readFile } = await prepareEnvironment();

  const { code } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([]);

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
        }to match persisted query manifest with operations.\n\n${diff}`;
      },
    };
  },
});
