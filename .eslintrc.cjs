module.exports = {
  overrides: [
    {
      files: ["packages/*/src/**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      parserOptions: {
        project: "tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            prefer: "type-imports",
            fixStyle: "inline-type-imports",
          },
        ],
      },
    },
  ],
  root: true,
};
