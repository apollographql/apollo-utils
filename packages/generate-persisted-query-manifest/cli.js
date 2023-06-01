#!/usr/bin/env node

const { cosmiconfig } = require("cosmiconfig");
const { generatePersistedQueryManifest } = require("./dist/index.js");
const { TypeScriptLoader } = require("cosmiconfig-typescript-loader");

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

explorer
  .search()
  .then((result) => generatePersistedQueryManifest(result?.config))
  .then((manifest) => console.log(JSON.stringify(manifest, null, 2)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
