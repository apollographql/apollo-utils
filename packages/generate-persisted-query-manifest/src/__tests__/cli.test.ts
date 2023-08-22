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

{
  const ymlConfig = `
documents: 
  - queries/**/*.graphql
`;

  const jsConfig = `
module.exports = {
  documents: ['queries/**/*.graphql']
}
`;

  const tsConfig = `
import { PersistedQueryManifestConfig } from '@apollo/generate-persisted-query-manifest';

const config: PersistedQueryManifestOperation = {
  documents: ['queries/**/*.graphql'] 
}

export default config;
`;

  test.each([
    ["json", JSON.stringify({ documents: ["queries/**/*.graphql"] })],
    ["yml", ymlConfig],
    ["yaml", ymlConfig],
    ["js", jsConfig],
    ["cjs", jsConfig],
    ["ts", tsConfig],
  ])("can read config file with %s extension", async (extension, contents) => {
    const { cleanup, readFile, runCommand, writeFile } = await setup();
    const query = gql`
      query GreetingQuery {
        greeting
      }
    `;

    await writeFile("./queries/greeting-query.graphql", print(query));
    await writeFile(`./persisted-query-manifest.config.${extension}`, contents);

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
}

test("can read config from package.json under `persisted-query-manifest` key", async () => {
  const { cleanup, readFile, runCommand, writeFile } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile("./queries/greeting-query.graphql", print(query));
  await writeFile(
    "package.json",
    JSON.stringify({
      "persisted-query-manifest": {
        documents: ["queries/**/*.graphql"],
      },
    }),
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

test("can omit paths in document configuration with starting !", async () => {
  const { cleanup, readFile, runCommand, writeFile } = await setup();
  const greetingQuery = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile("./queries/greeting-query.graphql", print(greetingQuery));
  await writeFile(
    "./queries/ignored-query.graphql",
    `query IgnoredQuery { ignored }`,
  );

  await writeFile(
    "./persisted-query-manifest.config.json",
    JSON.stringify({
      documents: ["./queries/**/*.graphql", "!./queries/ignored-query.graphql"],
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
  ]);

  await cleanup();
});

test("can specify manifest output location using config file", async () => {
  const { cleanup, runCommand, writeFile, exists } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile("./src/greeting-query.graphql", print(query));

  await writeFile(
    "./persisted-query-manifest.config.json",
    JSON.stringify({ output: "./pql.json" }),
  );

  const { code } = await runCommand();

  expect(code).toBe(0);
  expect(await exists("./pql.json")).toBe(true);

  await cleanup();
});

test("can specify custom query ID using createOperationId function", async () => {
  const { cleanup, runCommand, writeFile, readFile } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

  const mutation = gql`
    mutation CreateUserMutation($user: UserInput!) {
      createUser(user: $user) {
        id
      }
    }
  `;

  await writeFile("./src/greeting-query.graphql", print(query));
  await writeFile("./src/create-user-mutation.graphql", print(mutation));
  await writeFile(
    "./persisted-query-manifest.config.ts",
    `
import { PersistedQueryManifestConfig } from '@apollo/generate-persisted-query-manifest';
import { Buffer } from "node:buffer";

const config: PersistedQueryManifestConfig = {
  createOperationId(query, { type, createDefaultId }) {
    switch (type) {
      case "query":
        return Buffer.from(query).toString("base64");
      default:
        return createDefaultId();
    }  
  }
};

export default config;
`,
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(addTypenameToDocument(mutation)),
      name: "CreateUserMutation",
      body: print(addTypenameToDocument(mutation)),
      type: "mutation",
    },
    {
      id: base64(query),
      name: "GreetingQuery",
      body: print(query),
      type: "query",
    },
  ]);

  await cleanup();
});

test("errors on anonymous operations", async () => {
  const { cleanup, runCommand, writeFile } = await setup();
  const query = gql`
    query {
      greeting
    }
  `;

  await writeFile("./src/query.graphql", print(query));

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "src/query.graphql",
      "1:1  error  Anonymous GraphQL operations are not supported. Please name your query.",
      "✖ 1 error",
    ]
  `);

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

function base64(query: DocumentNode) {
  return Buffer.from(print(query)).toString("base64");
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
