// To be used / extended by all projects in the monorepo.
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/src/__tests__/tsconfig.json",
      },
    ],
  },
  // Prettier 3 is incompatible with jest at the time of this writing and needed
  // to generate inline snapshot tests. As a temporary workaround, we use
  // prettier v2 for Jest to allow inline snapshots to continue working.
  // See https://jestjs.io/docs/configuration#prettierpath-string for more info
  // on this fix and https://github.com/jestjs/jest/issues/14305 for tracking
  // this issue.
  prettierPath: require.resolve("prettier-2"),
};

export default config;
