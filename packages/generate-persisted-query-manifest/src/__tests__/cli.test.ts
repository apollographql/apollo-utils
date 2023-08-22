import path from "path";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";

function getCommand(args: string = "") {
  return `${path.resolve(__dirname, "../../cli.js")} ${args}`.trim();
}

test("Succeeds and writes manifest file with no operations", async () => {
  const { execute, cleanup, readFile } = await prepareEnvironment();

  const { code, stdout } = await execute("node", getCommand());

  const manifest = await readFile("./persisted-query-manifest.json");

  expect(stdout).toEqual(["Manifest written to persisted-query-manifest.json"]);
  expect(code).toBe(0);

  expect(JSON.parse(manifest)).toEqual({
    format: "apollo-persisted-query-manifest",
    version: 1,
    operations: [],
  });

  await cleanup();
});
