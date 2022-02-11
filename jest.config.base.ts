// To be used / extended by all projects in the monorepo.
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src"],
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/src/__tests__/tsconfig.json",
    },
  },
};

export default config;
