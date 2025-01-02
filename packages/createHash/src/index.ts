import { isNodeLike } from "@apollo/utils.isnodelike";

export function createHash(kind: string): import("crypto").Hash {
  // Some Node-like environments (like next.js Turbopack) apparently
  // don't have module.require, so double-check before we call it.
  // (But don't change the value of isNodeLike because other logic depends on it,
  // like Apollo Server signal handling defaults.) This does mean that
  // Turbopack will call sha.js instead of the native crypto module, but
  // it sure beats throwing because module.require does not exist.
  if (isNodeLike && module.require) {
    // Use module.require instead of just require to avoid bundling whatever
    // crypto polyfills a non-Node bundler might fall back to.
    return module.require("crypto").createHash(kind);
  }
  return require("sha.js")(kind);
}
