# `ApolloKeyv` class

The `ApolloKeyv` class is a simple wrapper for `Keyv` which implements the `KeyValueCache` interface from the `@apollo/utils.keyvaluecache` package. This class is intended for use by (but not limited to) Apollo Server's cache. `Keyv` supports a number of useful adapters like Redis, Mongo, SQLite, etc.

## Usage

Here's an example of using a Redis store for your ApolloServer cache:

Install the necessary packages:

```bash
npm install @apollo/utils.apollokeyv keyv @keyv/redis
```

In Apollo Server v3:
```ts
import { ApolloServer } from "apollo-server";
import { ApolloKeyv } from "@apollo/utils.apollokeyv";
import Keyv from "keyv";

new ApolloServer({
  cache: new ApolloKeyv(new Keyv("redis://...")),
});
```

In Apollo Server v4:
```ts
import { ApolloServer } from "@apollo/server";
import { ApolloKeyv } from "@apollo/utils.apollokeyv";
import Keyv from "keyv";

new ApolloServer({
  cache: new ApolloKeyv(new Keyv("redis://...")),
});
```
