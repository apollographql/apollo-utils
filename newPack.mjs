// @ts-check
import { Command } from "@lerna/command";
import { PublishCommand } from "@lerna/publish";
import { Project } from "@lerna/project";
import { PackageGraph } from "@lerna/package-graph";

class PackCommand extends Command {
  constructor(argv) {
    super(argv);
    this.project = new Project(argv.cwd);
    this.packageGraph = new PackageGraph(this.project.getPackagesSync());
    debugger;
  }

  initialize() {}

  async execute() {
    await this.resolveLocalDependencyLinks();
    await this.serializeChanges();
    await this.packUpdated();
  }

  async resolveLocalDependencyLinks() {
    const packages = await this.project.getPackages();
    for (const [name, node] of this.packageGraph.entries()) {
      const pkg = packages.find((pkg) => pkg.name === name);
      for (const [depName, resolved] of node.localDependencies) {
        const depVersion = this.packageGraph.get(depName).pkg.version;
        // it no longer matters if we mutate the shared Package instance
        pkg.updateLocalDependency(resolved, depVersion, "");
      }
    }
  }

  async serializeChanges() {
    for(const pkg of this.project.getPackagesSync()){
      pkg.serialize();
    }
    debugger;
  }
}

(async () => {
  debugger;
  const pack = new PackCommand({ composed: false, cwd: process.cwd() });
  await pack.execute();
  debugger;
})();
