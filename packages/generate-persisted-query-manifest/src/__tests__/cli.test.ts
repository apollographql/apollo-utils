import path from "node:path";
import { gql } from "@apollo/client/core";
import { type DocumentNode, print } from "graphql";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { createHash } from "node:crypto";
import { equal } from "@wry/equality";
import { readFileSync } from "node:fs";
import type { PersistedQueryManifestOperation } from "../index";
import { addTypenameToDocument } from "@apollo/client/utilities";

test("prints help message with --help", async () => {
  const { cleanup, runCommand } = await setup();

  const { code, stdout } = await runCommand("--help");

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
  const { cleanup, runCommand } = await setup();
  const { version } = JSON.parse(
    readFileSync(path.resolve(__dirname, "../../package.json"), "utf8"),
  );

  const { code, stdout } = await runCommand("--version");

  expect(code).toBe(0);
  expect(stdout).toEqual([version]);

  await cleanup();
});

test("writes manifest file and prints location", async () => {
  const { cleanup, exists, runCommand } = await setup();

  const { code, stdout } = await runCommand();

  expect(stdout).toEqual(["Manifest written to persisted-query-manifest.json"]);
  expect(code).toBe(0);
  expect(await exists("./persisted-query-manifest.json")).toBe(true);

  await cleanup();
});

test("can extract operations from .graphql files", async () => {
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;
  const { cleanup, writeFile, readFile, runCommand } = await setup();

  await writeFile("./src/query.graphql", print(query));

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(query),
      name: "GreetingQuery",
      body: print(query),
      type: "query",
    },
  ]);

  await cleanup();
});

test("can extract operations from .gql files", async () => {
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;
  const { cleanup, writeFile, readFile, runCommand } = await setup();

  await writeFile("./src/query.gql", print(query));

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(query),
      name: "GreetingQuery",
      body: print(query),
      type: "query",
    },
  ]);

  await cleanup();
});

test("can extract operations from JavaScript files", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile(
    "./src/my-component.js",
    `
import { gql } from '@apollo/client';

const QUERY = gql\`
  query GreetingQuery {
    greeting
  }
\`;
`,
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(query),
      name: "GreetingQuery",
      body: print(query),
      type: "query",
    },
  ]);

  await cleanup();
});

test("can extract operations from TypeScript files", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

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
`,
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(query),
      name: "GreetingQuery",
      body: print(query),
      type: "query",
    },
  ]);

  await cleanup();
});

test("can extract operations from TypeScript React files", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

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
`,
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(query),
      name: "GreetingQuery",
      body: print(query),
      type: "query",
    },
  ]);

  await cleanup();
});

test("ensures manifest bodies and id hash applies document transforms", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query CurrentUserQuery {
      currentUser {
        id
      }
    }
  `;

  await writeFile("./src/current-user-query.graphql", print(query));

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");
  const withTypename = addTypenameToDocument(query);

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(withTypename),
      name: "CurrentUserQuery",
      body: print(withTypename),
      type: "query",
    },
  ]);

  await cleanup();
});

test("can extract multiple operations", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

  const query2 = gql`
    query HelloQuery {
      hello
    }
  `;

  await writeFile("./src/greeting-query.graphql", print(query));
  await writeFile("./src/hello-query.graphql", print(query2));

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(query),
      name: "GreetingQuery",
      body: print(query),
      type: "query",
    },
    {
      id: sha256(query2),
      name: "HelloQuery",
      body: print(query2),
      type: "query",
    },
  ]);

  await cleanup();
});

test("can extract mutations", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const mutation = gql`
    mutation CreateUserMutation($user: UserInput!) {
      createUser(user: $user)
    }
  `;

  await writeFile("./src/create-user-mutation.graphql", print(mutation));

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(mutation),
      name: "CreateUserMutation",
      body: print(mutation),
      type: "mutation",
    },
  ]);

  await cleanup();
});

test("can extract subscriptions", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const subscription = gql`
    subscription UserCreatedSubscription($id: ID!) {
      userCreated(id: $id)
    }
  `;

  await writeFile(
    "./src/user-created-subscription.graphql",
    print(subscription),
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(subscription),
      name: "UserCreatedSubscription",
      body: print(subscription),
      type: "subscription",
    },
  ]);

  await cleanup();
});

test("writes manifest file with no operations when none found", async () => {
  const { cleanup, readFile, runCommand } = await setup();

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([]);

  await cleanup();
});

test("can specify custom document location with config file", async () => {
  const { cleanup, readFile, runCommand, writeFile } = await setup();
  const rootQuery = gql`
    query RootQuery {
      root
    }
  `;

  const greetingQuery = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile("./root-query.graphql", print(rootQuery));
  await writeFile("./queries/greeting-query.graphql", print(greetingQuery));
  // Ensure we have at least one file that doesn't match the search pattern
  await writeFile("./ignored-query.graphql", `query IgnoredQuery { ignored }`);

  await writeFile(
    "./persisted-query-manifest.config.json",
    JSON.stringify({
      documents: ["./root-query.graphql", "./queries/**/*.graphql"],
    }),
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(greetingQuery),
      name: "GreetingQuery",
      body: print(greetingQuery),
      type: "query",
    },
    {
      id: sha256(rootQuery),
      name: "RootQuery",
      body: print(rootQuery),
      type: "query",
    },
  ]);

  await cleanup();
});

async function setup() {
  const utils = await prepareEnvironment();

  const writeFile: typeof utils.writeFile = (path, contents) => {
    return utils.writeFile(path, contents.trim());
  };

  const runCommand = (args?: string) => {
    return utils.execute("node", getCommand(args));
  };

  return { ...utils, writeFile, runCommand };
}

function sha256(query: DocumentNode) {
  return createHash("sha256").update(print(query)).digest("hex");
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
