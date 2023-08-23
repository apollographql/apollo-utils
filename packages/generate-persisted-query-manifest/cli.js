#!/usr/bin/env node

const { Command } = require("commander");
const { cosmiconfig } = require("cosmiconfig");
const {
  generatePersistedQueryManifest,
  getFilepaths,
  defaults,
} = require("./dist/index.js");
const { TypeScriptLoader } = require("cosmiconfig-typescript-loader");
const { version } = require("./package.json");
const { writeFileSync } = require("node:fs");
const chalk = require("chalk");

const program = new Command();

const moduleName = "persisted-query-manifest";
const supportedExtensions = ["json", "yml", "yaml", "js", "ts", "cjs"];

const searchPlaces = supportedExtensions.flatMap((extension) => [
  `.${moduleName}.config.${extension}`,
  `${moduleName}.config.${extension}`,
]);

const explorer = cosmiconfig(moduleName, {
  searchPlaces: searchPlaces.concat("package.json"),
  loaders: {
    ".ts": TypeScriptLoader(),
  },
});

async function getUserConfig({ config: configPath }) {
  return configPath ? explorer.load(configPath) : explorer.search();
}

async function listFiles(config) {
  const filepaths = await getFilepaths(config?.documents ?? defaults.documents);

  if (filepaths.length > 0) {
    console.log(filepaths.join("\n"));
  }
}

program
  .name("generate-persisted-query-manifest")
  .description("Generate a persisted query manifest file")
  .option("-c, --config <path>", "path to the config file")
  .option(
    "-l, --list-files",
    "prints the files matched from the documents pattern",
  )
  .version(version, "-v, --version")
  .action(async (cliOptions) => {
    const result = await getUserConfig(cliOptions);

    if (cliOptions.listFiles) {
      await listFiles(result?.config);
      process.exit(0);
    }

    const outputPath = result?.config.output ?? defaults.output;

    const manifest = await generatePersistedQueryManifest(
      result?.config,
      result?.filepath,
    );
    writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    if (manifest.operations.length === 0) {
      console.warn(
        chalk.yellow(
          "Warning: no operations found during manifest generation. " +
            "You may need to adjust the glob pattern used to search " +
            "files in this project. See the README for more information on how to configure the glob pattern: " +
            "https://www.npmjs.com/package/@apollo/generate-persisted-query-manifest\n",
        ),
      );
    }

    console.log(
      `Manifest written to ${outputPath} with ${manifest.operations.length} operations.`,
    );
  });

program.parse();
