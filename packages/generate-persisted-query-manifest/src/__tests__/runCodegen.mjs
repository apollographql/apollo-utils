// Runs GraphQL Code Generator's `generate` in its own Node process. The codegen
// CLI depends on ES-module-only packages, which Jest's CommonJS runtime can't
// load, so the test spawns this script instead of importing the CLI directly.
import { generate } from "@graphql-codegen/cli";
import { addTypenameSelectionDocumentTransform } from "@graphql-codegen/client-preset";

const { outputDir, schema, documents } = JSON.parse(process.argv[2]);

await generate({
  generates: {
    [outputDir]: {
      schema,
      documents,
      preset: "client",
      presetConfig: {
        persistedDocuments: true,
      },
      documentTransforms: [addTypenameSelectionDocumentTransform],
    },
  },
});
