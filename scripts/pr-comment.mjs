// @ts-check
import fetch from "node-fetch";

console.log(process.env);
console.log(
  "url is :" +
    `https://circleci.com/api/v2/project/github/trevor-scheer/apollo-utils/${process.env.CIRCLE_BUILD_NUM}/artifacts`,
);

(async () => {
  const response = await fetch(
    `https://circleci.com/api/v2/project/github/trevor-scheer/apollo-utils/${process.env.CIRCLE_BUILD_NUM}/artifacts`,
    {
      headers: {
        Accept: "application/json",
        "Circle-Token": `${process.env.CIRCLE_TOKEN}`,
      },
    },
  );

  const artifactLinks = (await response.json()).items.map((item) => item.url);

  console.log(artifactLinks);
})();
