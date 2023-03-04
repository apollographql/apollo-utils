# Apollo Utils

This monorepo is intended to be a home for various utilities which we use across a number of our projects. These utilities may include, but are not limited to:

- GraphQL-specific functions which don't necessarily belong in `graphql-js`
- Apollo-specific functions (i.e. `operationRegistrySignature`)
- Generic, commonly used JS/TS functions
- Commonly used TypeScript types

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## Introducing a new package

1. Run `npm init -w packages/<myNewPackage>` and follow the prompts. If you're unsure of description, author, or other fields in the `package.json` file, please refer to a neighbor package's `package.json` for inspiration.
2. Add appropriate entries for your package to the `tsconfig.build.json` and `tsconfig.test.json` files.
3. Create a `src/index.ts` file which is home to your top-level exports.
4. Create a `src/__tests__` folder. Test files should be added here (and use the `.test.ts` suffix).
5. Copy the following files from a neighbor package and adjust appropriately (if necessary):

- `.npmignore`
- `jest.config.js`
- `LICENSE`
- `tsconfig.json`
- `src/__tests__/tsconfig.json`

# TODO - add notes about ESM/CJS config and type-only vs runtime packages
