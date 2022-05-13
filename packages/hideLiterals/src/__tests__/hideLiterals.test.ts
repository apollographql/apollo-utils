import gql from "graphql-tag";
import { hideLiterals } from "..";
import { print, stripIgnoredCharacters } from "graphql";

describe("hideLiterals", () => {
  const cases = [
    {
      name: "full test",
      input: gql`
        query Foo($b: Int, $a: Boolean) {
          user(
            name: "hello"
            age: 5
            pct: 0.4
            lst: ["a", "b", "c"]
            obj: { a: "a", b: 1 }
          ) {
            ...Bar
            ... on User {
              hello
              bee
            }
            tz
            aliased: name
            withInputs(
              str: "hi"
              int: 2
              flt: 0.3
              lst: ["", "", ""]
              obj: { q: "", s: 0 }
            )
          }
        }

        fragment Bar on User {
          age @skip(if: $a)
          ...Nested
        }

        fragment Nested on User {
          blah
        }
      `,
      output:
        'query Foo($b:Int$a:Boolean){user(name:"" age:0 pct:0 lst:[]obj:{}){...Bar ...on User{hello bee}tz aliased:name ' +
        'withInputs(str:"" int:0 flt:0 lst:[]obj:{})}}' +
        "fragment Bar on User{age@skip(if:$a)...Nested}fragment Nested on User{blah}",
    },
  ];
  cases.forEach(({ name, input, output }) => {
    test(name, () => {
      expect(stripIgnoredCharacters(print(hideLiterals(input)))).toEqual(
        output,
      );
    });
  });
});
