// @ts-check
// const packlist = require("npm-packlist");
// const log = require("npmlog");
// const tar = require("tar");
// const tempWrite = require("temp-write");
// const { getPacked } = require("@lerna/get-packed");
// const { Package } = require("@lerna/package");
// const { runLifecycle } = require("@lerna/run-lifecycle");

import path from "path";
import packlist from "npm-packlist";
import log from "npmlog";
import tar from "tar";
import { getPacked } from "@lerna/get-packed";
import { Package } from "@lerna/package";
import { runLifecycle } from "@lerna/run-lifecycle";
import { Project } from "@lerna/project";
import { PackageGraph } from "@lerna/package-graph";
import { createWriteStream, writeFileSync } from "fs";

/**
 * @typedef {object} PackConfig
 * @property {typeof log} [log]
 * @property {string} [lernaCommand] If "publish", run "prepublishOnly" lifecycle
 * @property {boolean} [ignorePrepublish]
 */

/**
 * Pack a directory suitable for publishing, writing tarball to a tempfile.
 * @param {Package|string} _pkg Package instance or path to manifest
 * @param {PackConfig} options
 */
function packDirectory(_pkg, options) {
  const pkg = Package.lazy(_pkg);
  const opts = {
    log,
    ...options,
  };

  opts.log.verbose("pack-directory", path.relative(".", pkg.contents));

  let chain = Promise.resolve();

  if (opts.ignorePrepublish !== true) {
    chain = chain.then(() => runLifecycle(pkg, "prepublish", opts));
  }

  chain = chain.then(() => runLifecycle(pkg, "prepare", opts));

  if (opts.lernaCommand === "publish") {
    chain = chain.then(() => pkg.refresh());
    chain = chain.then(() => runLifecycle(pkg, "prepublishOnly", opts));
    chain = chain.then(() => pkg.refresh());
  }

  chain = chain.then(() => runLifecycle(pkg, "prepack", opts));
  // chain = chain.then(() => pkg.refresh());
  chain = chain.then(() => {
    return packlist({ path: pkg.contents });
  });
  chain = chain.then((files) =>
    tar.create(
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
    ),
  );

  chain = chain.then((stream) => {
    const filePath = `./${getTarballName(pkg)}`;
    // touch
    writeFileSync(filePath, "");
    const writeStream = createWriteStream(filePath);
    stream.pipe(writeStream);
    return filePath;
    // tempWrite(stream, getTarballName(pkg))
  });
  chain = chain.then((tarFilePath) =>
    getPacked(pkg, tarFilePath).then((packed) =>
      Promise.resolve()
        .then(() => runLifecycle(pkg, "postpack", opts))
        .then(() => packed),
    ),
  );

  return chain;
}

function getTarballName(pkg) {
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}

async function getLinkedPackages() {
  const project = new Project(".");
  const packages = await project.getPackages();
  const packageGraph = new PackageGraph(packages);

  for (const pkg of packages) {
    const localDependencies = packageGraph.get(pkg.name).localDependencies;
    for (const [depName, resolved] of localDependencies) {
      const depVersion = packageGraph.get(depName).version;
      pkg.updateLocalDependency(resolved, depVersion, "");
    }
  }

  return packages;
}

(async () => {
  const packages = await getLinkedPackages();

  packages.forEach(pkg => {
    pkg.serialize();
    packDirectory(pkg, {});
  });

})();
