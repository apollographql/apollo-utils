# operationRegistrySignature

The operation registry signature function consists of removing extra whitespace,
sorting the AST in a deterministic manner, potentially hiding string and numeric
literals, and removing unused definitions. This is a less aggressive transform
than its usage reporting signature counterpart. This is used to generate a
signature used by Apollo's operation registry to identify operations.

## Usage

```ts
import { operationRegistrySignature } from "@apollo/utils.operationregistrysignature";

const signature = operationRegistrySignature(
  parse(`#graphql
    query Foo {
      bar
    }
  `),
  "Foo",
  { preserveStringAndNumericLiterals: true },
);
```