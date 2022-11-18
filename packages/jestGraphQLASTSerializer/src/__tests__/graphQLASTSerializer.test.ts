import { parse } from "graphql";
import graphQLASTSerializer from "../../dist";

describe("graphQLASTSerializer", () => {
  const ast = parse(`query Foo { test }`);
  const invalidAST = { kind: "invalid" };

  it("correctly identifies GraphQL AST nodes", () => {
    expect(graphQLASTSerializer.test(ast)).toBe(true);
    expect(graphQLASTSerializer.test(ast.definitions[0])).toBe(true);
  });

  it("correctly identifies non-AST nodes", () => {
    expect(graphQLASTSerializer.test("a string")).toBe(false);
    expect(graphQLASTSerializer.test(1)).toBe(false);
    expect(graphQLASTSerializer.test(invalidAST)).toBe(false);
  });

  it("serializes AST nodes", () => {
    expect(graphQLASTSerializer.serialize(ast)).toMatchInlineSnapshot(`
      "query Foo {
        test
      }"
    `);
  });

  it("throws on malformed AST", () => {
    expect(() =>
      // @ts-expect-error
      graphQLASTSerializer.serialize(invalidAST),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Invalid AST Node: { kind: "invalid" }."`,
    );
  });
});
