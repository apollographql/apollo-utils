// To be used / extended by all projects in the monorepo.
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src"],
};

export default config;
