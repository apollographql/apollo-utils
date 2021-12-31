// @ts-check
import { createWriteStream, writeFileSync } from "fs";
import tar from "tar";
import packlist from "npm-packlist";
import { Command } from "@lerna/command";
import { Project } from "@lerna/project";
import { PackageGraph } from "@lerna/package-graph";
import { mkdir, stat, writeFile } from "fs/promises";

class PackCommand extends Command {
  constructor(argv) {
    super(argv);
    this.project = new Project(argv.cwd);
    this.packages = this.project.getPackagesSync();
    this.packageGraph = new PackageGraph(this.packages);
  }

  initialize() {}

  async execute() {
    await this.resolveLocalDependencyLinks();
    await this.serializeChanges();
    await this.packUpdated();
  }

  async resolveLocalDependencyLinks() {
    for (const [name, node] of this.packageGraph.entries()) {
      const pkg = this.packages.find((pkg) => pkg.name === name);
      for (const [depName, resolved] of node.localDependencies) {
        const depVersion = this.packageGraph.get(depName).pkg.version;
        // it no longer matters if we mutate the shared Package instance
        pkg.updateLocalDependency(resolved, depVersion, "");
      }
    }
  }

  async serializeChanges() {
    for (const pkg of this.packages) {
      await pkg.serialize();
    }
  }

  async packUpdated() {
    for (const pkg of this.packages) {
      const files = await packlist({ path: pkg.contents });
      const stream = tar.create(
        {
          cwd: pkg.contents,
          prefix: "package/",
          portable: true,
          // Provide a specific date in the 1980s for the benefit of zip,
          // which is confounded by files dated at the Unix epoch 0.
          mtime: new Date("1985-10-26T08:15:00.000Z"),
          gzip: true,
          // file: `./${getTarballName(pkg)}`
        },
        // NOTE: node-tar does some Magic Stuff depending on prefixes for files
        //       specifically with @ signs, so we just neutralize that one
        //       and any such future "features" by prepending `./`
        files.map((f) => `./${f}`),
      );

      const filePath = `./artifacts/${getTarballName(pkg)}`;
      // touch
      (await stat('./artifacts')).isDirectory() ?? await mkdir('./artifacts');
      await writeFile(filePath, "");
      const writeStream = createWriteStream(filePath);
      stream.pipe(writeStream);
    }
  }
}

function getTarballName(pkg) {
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}

(async () => {
  const pack = new PackCommand({ composed: false, cwd: process.cwd() });
  await pack.execute();
  debugger;
})();
