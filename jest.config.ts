import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  projects: ["<rootDir>/packages/*/jest.config.ts"],
};

export default config;
