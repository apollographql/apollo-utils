#!/usr/bin/env node

const { generatePersistedQueryManifest } = require("./dist/index.js");

generatePersistedQueryManifest()
  .then((manifest) => console.log(JSON.stringify(manifest, null, 2)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
