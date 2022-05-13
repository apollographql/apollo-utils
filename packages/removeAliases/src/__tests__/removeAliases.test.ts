import gql from "graphql-tag";
import { removeAliases } from "..";
import { print } from "graphql";

describe("removeAliases", () => {
  it("removes aliases from Field nodes", () => {
    expect(
      print(
        removeAliases(gql`
          query MyQuery {
            alias: field
            field
            fieldWithSelections {
              selection1
              selection2
            }
            aliasedSelections: fieldWithSelections {
              selection1
              selection2
            }
          }
        `),
      ),
    ).toMatchInlineSnapshot(`
      "query MyQuery {
        field
        field
        fieldWithSelections {
          selection1
          selection2
        }
        fieldWithSelections {
          selection1
          selection2
        }
      }"
    `);
  });
});
