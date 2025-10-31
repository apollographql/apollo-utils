import { gql } from "@apollo/client";
import { addTypenameToDocument } from "@apollo/client/utilities";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { equal } from "@wry/equality";
import { print, type DocumentNode } from "graphql";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { generate } from "@graphql-codegen/cli";
import { addTypenameSelectionDocumentTransform } from "@graphql-codegen/client-preset";
import type { PersistedQueryManifestOperation } from "../index";

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
      "-l, --list-files     prints the files matched from the documents pattern",
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

test("prints list of matched files with --list-files option", async () => {
  const { cleanup, runCommand, writeFile } = await setup();

  await writeFile("./src/query.graphql", "");
  await writeFile("./src/components/legacy.js", "");
  await writeFile("./src/components/my-component.tsx", "");
  await writeFile("./src/queries/root.graphql", "");
  // Include a file that isn't part of the globbed pattern
  await writeFile("./not-included.ts", "");

  const { code, stdout } = await runCommand("--list-files");

  expect(code).toBe(0);
  expect(stdout).toMatchInlineSnapshot(`
    [
      "src/components/legacy.js",
      "src/components/my-component.tsx",
      "src/queries/root.graphql",
      "src/query.graphql",
    ]
  `);

  await cleanup();
});

test("writes manifest file and prints location", async () => {
  const { cleanup, exists, runCommand } = await setup();

  const { code, stdout } = await runCommand();

  expect(stdout).toEqual([
    "✓ Manifest written to persisted-query-manifest.json with 0 operations.",
  ]);
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

test("normalizes query documents to ensure consistent formatting", async () => {
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;
  const { cleanup, writeFile, readFile, runCommand } = await setup();

  // Write a file with inconsistent formatting applied to the GraphQL query
  // to ensure its formatted consistently
  await writeFile(
    "./src/query.graphql",
    `
query   GreetingQuery
{
      greeting }
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
      isLoggedIn @client
      currentUser {
        id
      }
    }
  `;

  await writeFile("./src/current-user-query.graphql", print(query));

  const { code } = await runCommand();
  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(query),
      name: "CurrentUserQuery",
      body: print(query),
      type: "query",
    },
  ]);

  await cleanup();
});

test.skip("can disable adding __typename", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query CurrentUserQuery {
      currentUser {
        id
      }
    }
  `;

  await writeFile("./src/current-user-query.graphql", print(query));

  await writeFile(
    "./persisted-query-manifest.config.json",
    JSON.stringify({ addTypename: false }),
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      // Explicitly do not call addTypenameToDocument here.
      id: sha256(query),
      name: "CurrentUserQuery",
      // Explicitly do not call addTypenameToDocument here.
      body: print(query),
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

test("handles fragments imported from other files in .graphql files", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query CurrentUserQuery {
      currentUser {
        ...CurrentUserFragment
      }
    }
  `;
  const fragment = gql`
    fragment CurrentUserFragment on CurrentUser {
      id
    }
  `;

  await writeFile(
    "./src/query.graphql",
    `
#import "./fragment.graphql"

${print(query)}
`,
  );
  await writeFile("./src/fragment.graphql", print(fragment));

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");
  const combined = gql`
    ${query}
    ${fragment}
  `;

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(addTypenameToDocument(combined)),
      name: "CurrentUserQuery",
      body: print(addTypenameToDocument(combined)),
      type: "query",
    },
  ]);

  await cleanup();
});

test("handles interpolated fragments in queries used with `gql`", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query CurrentUserQuery {
      currentUser {
        ...CurrentUserFragment
      }
    }
  `;
  const fragment = gql`
    fragment CurrentUserFragment on CurrentUser {
      id
    }
  `;

  await writeFile(
    "./src/my-component.js",
    `
import { gql } from '@apollo/client';
import { fragment } from './fragment';

const query = gql\`
  query CurrentUserQuery {
    currentUser {
      ...CurrentUserFragment
    }
  }

  \${fragment}
\`
`,
  );
  await writeFile(
    "./src/fragment.js",
    `
import { gql } from '@apollo/client';

export const fragment = gql\`
  fragment CurrentUserFragment on CurrentUser {
    id
  }
\`;
`,
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");
  const combined = addTypenameToDocument(gql`
    ${query}
    ${fragment}
  `);

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(addTypenameToDocument(combined)),
      name: "CurrentUserQuery",
      body: print(combined),
      type: "query",
    },
  ]);

  await cleanup();
});

test("handles implied fragments in queries from `gql`", async () => {
  const { cleanup, writeFile, readFile, runCommand } = await setup();
  const query = gql`
    query CurrentUserQuery {
      currentUser {
        ...CurrentUserFragment
      }
    }
  `;
  const fragment = gql`
    fragment CurrentUserFragment on CurrentUser {
      id
    }
  `;

  await writeFile(
    "./src/my-component.js",
    `
import { gql } from '@apollo/client';

const query = gql\`
  query CurrentUserQuery {
    currentUser {
      ...CurrentUserFragment
    }
  }
\`
`,
  );
  await writeFile(
    "./src/fragment.js",
    `
import { gql } from '@apollo/client';

export const fragment = gql\`
  fragment CurrentUserFragment on CurrentUser {
    id
  }
\`;
`,
  );

  const { code } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");
  const combined = addTypenameToDocument(gql`
    ${query}
    ${fragment}
  `);

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(addTypenameToDocument(combined)),
      name: "CurrentUserQuery",
      body: print(combined),
      type: "query",
    },
  ]);

  await cleanup();
});

test("writes manifest file and logs warning when no operations are found", async () => {
  const { cleanup, readFile, runCommand } = await setup();

  const { code, stdout, stderr } = await runCommand();

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([]);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "Warning: no operations found during manifest generation. You may need to adjust the glob pattern used to search files in this project. See the README for more information on how to configure the glob pattern: https://www.npmjs.com/package/@apollo/generate-persisted-query-manifest",
    ]
  `);
  expect(stdout).toEqual([
    "✓ Manifest written to persisted-query-manifest.json with 0 operations.",
  ]);

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

test("can specify config path with --config option", async () => {
  const { cleanup, readFile, runCommand, writeFile } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile("./queries/greeting-query.graphql", print(query));
  await writeFile(
    "./config/persisted-query-manifest.json",
    JSON.stringify({
      documents: ["queries/**/*.graphql"],
    }),
  );

  const { code } = await runCommand(
    "--config config/persisted-query-manifest.json",
  );

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

test("can specify custom document transform in config using Apollo Client > 3.8", async () => {
  const { cleanup, runCommand, writeFile, readFile, installDependencies } =
    await setup();
  const query = gql`
    query GreetingQuery {
      user {
        id
        name @custom
      }
    }
  `;

  const expectedQuery = gql`
    query GreetingQuery {
      user {
        id
        name
      }
    }
  `;

  await installDependencies({
    "@apollo/client": "^3.8.0",
  });
  await writeFile("./src/greeting-query.graphql", print(query));
  await writeFile(
    "./persisted-query-manifest.config.ts",
    `
import { PersistedQueryManifestConfig } from '@apollo/generate-persisted-query-manifest';
import { DocumentTransform } from '@apollo/client/core';
import { removeDirectivesFromDocument } from '@apollo/client/utilities';

const documentTransform = new DocumentTransform((document) => {
  return removeDirectivesFromDocument([{ name: 'custom' }], document);
});

const config: PersistedQueryManifestConfig = {
  documentTransform,
};

export default config;
`,
  );

  const { code } = await runCommand();
  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(addTypenameToDocument(expectedQuery)),
      name: "GreetingQuery",
      body: print(addTypenameToDocument(expectedQuery)),
      type: "query",
    },
  ]);

  await cleanup();
});

test("integrates with GraphQL codegen persisted documents", async () => {
  const {
    cleanup,
    runCommand,
    writeFile,
    readFile,
    installDependencies,
    path: testPath,
  } = await setup();

  const greetingQuery = gql`
    query GreetingQuery($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `;

  const greetingExpectedQuery = gql`
    query GreetingQuery($id: ID!) {
      __typename
      user(id: $id) {
        __typename
        id
        name
      }
    }
  `;

  const currentUserQuery = gql`
    query CurrentUserQuery {
      currentUser {
        id
        username
      }
    }
  `;

  const currentUserExpectedQuery = gql`
    query CurrentUserQuery {
      __typename
      currentUser {
        __typename
        id
        username
      }
    }
  `;

  const schema = gql`
    type Query {
      currentUser: CurrentUser
      user(id: ID!): User
    }

    type CurrentUser {
      id: ID!
      username: String!
    }

    type User {
      id: ID!
      name: String!
    }
  `;

  await installDependencies({
    "@apollo/generate-persisted-query-manifest": `file:${path.resolve(
      __dirname,
      "../index.ts",
    )}`,
  });

  await writeFile("./schema.graphql", print(schema));
  await writeFile("./src/greeting-query.graphql", print(greetingQuery));
  await writeFile("./src/current-user-query.graphql", print(currentUserQuery));
  await generate({
    generates: {
      [path.join(testPath, "./src/gql/")]: {
        schema: path.resolve(testPath, "./schema.graphql"),
        documents: [path.join(testPath, "./src/**/*.graphql")],
        preset: "client",
        presetConfig: {
          persistedDocuments: true,
        },
        documentTransforms: [addTypenameSelectionDocumentTransform],
      },
    },
  });

  await writeFile(
    "./persisted-query-manifest.config.ts",
    `
import {
  PersistedQueryManifestConfig,
  fromGraphQLCodegenPersistedDocuments
} from '@apollo/generate-persisted-query-manifest';

const config: PersistedQueryManifestConfig = {
  documents: fromGraphQLCodegenPersistedDocuments('./src/gql/persisted-documents.json'),
};

export default config;
`,
  );

  const { code } = await runCommand();
  const manifest = await readFile("./persisted-query-manifest.json");

  expect(code).toBe(0);
  expect(manifest).toBeManifestWithOperations([
    {
      id: sha256(currentUserExpectedQuery),
      name: "CurrentUserQuery",
      body: print(currentUserExpectedQuery),
      type: "query",
    },
    {
      id: sha256(greetingExpectedQuery),
      name: "GreetingQuery",
      body: print(greetingExpectedQuery),
      type: "query",
    },
  ]);

  await cleanup();
});

test("errors when graphql codegen manifest doesn't exist", async () => {
  const { cleanup, runCommand, writeFile, installDependencies } = await setup();

  await installDependencies({
    "@apollo/generate-persisted-query-manifest": `file:${path.resolve(
      __dirname,
      "../index.ts",
    )}`,
  });

  await writeFile(
    "./persisted-query-manifest.config.ts",
    `
import {
  PersistedQueryManifestConfig,
  fromGraphQLCodegenPersistedDocuments
} from '@apollo/generate-persisted-query-manifest';

const config: PersistedQueryManifestConfig = {
  documents: fromGraphQLCodegenPersistedDocuments('./src/gql/persisted-documents.json'),
};

export default config;
`,
  );

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "./src/gql/persisted-documents.json",
      "1:1  error  ENOENT: GraphQL Codegen persisted documents file not found: './src/gql/persisted-documents.json'",
      "✖ 1 error",
    ]
  `);

  await cleanup();
});

test("errors when graphql codegen manifest is malformed", async () => {
  const { cleanup, runCommand, writeFile, installDependencies } = await setup();

  await installDependencies({
    "@apollo/generate-persisted-query-manifest": `file:${path.resolve(
      __dirname,
      "../index.ts",
    )}`,
  });

  await writeFile(
    "./src/gql/persisted-documents.json",
    `
[
  {
    "operationName": "CurrentUserQuery",
    "query": "query CurrentUserQuery { currentUser { id } }"
  }
]
`,
  );
  await writeFile(
    "./persisted-query-manifest.config.ts",
    `
import {
  PersistedQueryManifestConfig,
  fromGraphQLCodegenPersistedDocuments
} from '@apollo/generate-persisted-query-manifest';

const config: PersistedQueryManifestConfig = {
  documents: fromGraphQLCodegenPersistedDocuments('./src/gql/persisted-documents.json'),
};

export default config;
`,
  );

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "./src/gql/persisted-documents.json",
      "1:1  error  GraphQL Codegen persisted documents manifest is malformed. Either the file was not generated by GraphQL Codegen or the format has been updated and is no longer compatible with this utility.",
      "✖ 1 error",
    ]
  `);

  await cleanup();
});

test("errors when graphql codegen manifest is not JSON serialized", async () => {
  const { cleanup, runCommand, writeFile, installDependencies } = await setup();

  await installDependencies({
    "@apollo/generate-persisted-query-manifest": `file:${path.resolve(
      __dirname,
      "../index.ts",
    )}`,
  });

  await writeFile(
    "./src/gql/persisted-documents.json",
    "completely wrong format",
  );
  await writeFile(
    "./persisted-query-manifest.config.ts",
    `
import {
  PersistedQueryManifestConfig,
  fromGraphQLCodegenPersistedDocuments
} from '@apollo/generate-persisted-query-manifest';

const config: PersistedQueryManifestConfig = {
  documents: fromGraphQLCodegenPersistedDocuments('./src/gql/persisted-documents.json'),
};

export default config;
`,
  );

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchObject([
    "./src/gql/persisted-documents.json",
    // Different versions of node output a slightly different error message, so
    // we match on a common part of the error rather than using an inline
    // snapshot.
    expect.stringContaining("SyntaxError: Unexpected token"),
    "✖ 1 error",
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

test("errors on duplicate operations across files", async () => {
  const { cleanup, runCommand, writeFile } = await setup();
  const query = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile("./src/query-1.graphql", print(query));
  await writeFile("./src/query-2.graphql", print(query));

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "src/query-1.graphql",
      "1:1  error  Operation named "GreetingQuery" already defined in: src/query-2.graphql",
      "src/query-2.graphql",
      "1:1  error  Operation named "GreetingQuery" already defined in: src/query-1.graphql",
      "✖ 2 errors",
    ]
  `);

  await cleanup();
});

test("errors when declaring duplicate fragments across files", async () => {
  const { cleanup, runCommand, writeFile } = await setup();
  const query = gql`
    query CurrentUserQuery {
      currentUser {
        ...CurrentUserFragment
      }
    }
  `;

  const fragment = gql`
    fragment GreetingFragment on CurrentUser {
      id
    }
  `;

  await writeFile("./src/query.graphql", print(query));
  await writeFile("./src/fragment-1.graphql", print(fragment));
  await writeFile("./src/fragment-2.graphql", print(fragment));

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "src/fragment-1.graphql",
      "1:1  error  Fragment named "GreetingFragment" already defined in: src/fragment-2.graphql",
      "src/fragment-2.graphql",
      "1:1  error  Fragment named "GreetingFragment" already defined in: src/fragment-1.graphql",
      "✖ 2 errors",
    ]
  `);

  await cleanup();
});

test("errors createOperationId creates non-unique ids", async () => {
  const { cleanup, runCommand, writeFile } = await setup();
  const helloQuery = gql`
    query HelloQuery {
      hello
    }
  `;

  const greetingQuery = gql`
    query GreetingQuery {
      greeting
    }
  `;

  await writeFile("./src/hello.graphql", print(helloQuery));
  await writeFile("./src/greeting.graphql", print(greetingQuery));
  await writeFile(
    "./persisted-query-manifest.config.ts",
    `
import { PersistedQueryManifestConfig } from '@apollo/generate-persisted-query-manifest';

const config: PersistedQueryManifestConfig = {
  createOperationId() {
    return "1234"
  }
};

export default config;
`,
  );

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "persisted-query-manifest.config.ts",
      "1:1  error  \`createOperationId\` created an ID (1234) for operation named "HelloQuery" that has already been used for operation named "GreetingQuery".",
      "✖ 1 error",
    ]
  `);

  await cleanup();
});

test("handles syntax errors when parsing source files", async () => {
  const { cleanup, runCommand, writeFile } = await setup();

  await writeFile(
    "./src/greeting.graphql",
    `
query {
  greeting
`,
  );
  await writeFile(
    "./src/components/my-component.js",
    `
import { gql } from '@apollo/client';

const query;
`,
  );

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "src/components/my-component.js",
      "3:11  error  SyntaxError: Missing initializer in const declaration. (3:11)",
      "src/greeting.graphql",
      "2:11  error  GraphQLError: Syntax Error: Expected Name, found <EOF>.",
      "✖ 2 errors",
    ]
  `);

  await cleanup();
});

test("does not allow multiple operations in a single document", async () => {
  const { cleanup, runCommand, writeFile } = await setup();

  await writeFile(
    "./src/queries.graphql",
    `
query GreetingQuery {
  greeting
}

query GoodbyeQuery {
  goodbye
}
`,
  );

  await writeFile(
    "./src/mutations.graphql",
    `
mutation SayHello {
  sayHello
}

mutation SayGoodbye {
  goodbye
}
`,
  );

  await writeFile(
    "./src/subscriptions.graphql",
    `
subscription HelloSubscription {
  hello
}

subscription GoodbyeSubscription {
  goodbye
}
`,
  );
  await writeFile(
    "./src/mixed.graphql",
    `
mutation TestMutation {
  test
}

query TestQuery {
  test
}

subscription TestSubscription {
  test
}
`,
  );

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "src/mixed.graphql",
      "1:1  error  Cannot declare multiple operations in a single document.",
      "src/mutations.graphql",
      "1:1  error  Cannot declare multiple operations in a single document.",
      "src/queries.graphql",
      "1:1  error  Cannot declare multiple operations in a single document.",
      "src/subscriptions.graphql",
      "1:1  error  Cannot declare multiple operations in a single document.",
      "✖ 4 errors",
    ]
  `);

  await cleanup();
});

test("gathers and reports all errors together", async () => {
  const { cleanup, runCommand, writeFile } = await setup();
  const anonymousQuery = gql`
    query {
      incorrect
    }
  `;
  const helloQuery = gql`
    query HelloQuery {
      hello
    }
  `;

  const currentUserQuery = gql`
    query CurrentUserQuery {
      currentUser {
        ...CurrentUserFragment
      }
    }
  `;

  const currentUserFragment = gql`
    fragment CurrentUserFragment on CurrentUser {
      id
    }
  `;

  await writeFile("./src/query.graphql", print(anonymousQuery));
  await writeFile("./src/hello-query.graphql", print(helloQuery));
  await writeFile("./src/hello2-query.graphql", print(helloQuery));
  await writeFile("./src/current-user-query.graphql", print(currentUserQuery));
  await writeFile(
    "./src/current-user-fragment.graphql",
    print(currentUserFragment),
  );
  await writeFile(
    "./src/current-user-fragment2.graphql",
    print(currentUserFragment),
  );
  await writeFile(
    "./src/syntax-error.graphql",
    `
query {
  greeting
`,
  );

  const { code, stderr } = await runCommand();

  expect(code).toBe(1);
  expect(stderr).toMatchInlineSnapshot(`
    [
      "src/current-user-fragment.graphql",
      "1:1  error  Fragment named "CurrentUserFragment" already defined in: src/current-user-fragment2.graphql",
      "src/current-user-fragment2.graphql",
      "1:1  error  Fragment named "CurrentUserFragment" already defined in: src/current-user-fragment.graphql",
      "src/hello-query.graphql",
      "1:1  error  Operation named "HelloQuery" already defined in: src/hello2-query.graphql",
      "src/hello2-query.graphql",
      "1:1  error  Operation named "HelloQuery" already defined in: src/hello-query.graphql",
      "src/query.graphql",
      "1:1  error  Anonymous GraphQL operations are not supported. Please name your query.",
      "src/syntax-error.graphql",
      "2:11  error  GraphQLError: Syntax Error: Expected Name, found <EOF>.",
      "✖ 6 errors",
    ]
  `);

  await cleanup();
});

async function setup() {
  const utils = await prepareEnvironment();

  const writeFile: typeof utils.writeFile = (path, contents) => {
    return utils.writeFile(path, contents.trim());
  };

  const installDependencies = async (dependencies: Record<string, string>) => {
    await writeFile("./package.json", JSON.stringify({ dependencies }));

    return utils.execute("npm", "install");
  };

  const runCommand = (...args: string[]) => {
    const cli = path.resolve(__dirname, "../../cli.js");

    return utils.execute("node", [cli, ...args].join(" "));
  };

  return { ...utils, writeFile, runCommand, installDependencies };
}

function sha256(query: DocumentNode) {
  return createHash("sha256").update(print(query)).digest("hex");
}

function base64(query: DocumentNode) {
  return Buffer.from(print(query)).toString("base64");
}

interface ApolloCustomMatchers<R = void> {
  toBeManifestWithOperations(operations: PersistedQueryManifestOperation[]): R;
}

declare global {
  namespace jest {
    interface Matchers<R = void> extends ApolloCustomMatchers<R> { }
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

        return `Expected manifest ${this.isNot ? "not " : ""
          }to match persisted query manifest with operations.\n\n${diff}`;
      },
    };
  },
});
