import fetch from "node-fetch";

console.log(
  "url is :" +
    `https://circleci.com/api/v2/project/github/trevor-scheer/apollo-utils/${process.env.CIRCLE_BUILD_NUM}/artifacts`,
);

(async () => {
  const response = await fetch({
    url: `https://circleci.com/api/v2/project/github/trevor-scheer/apollo-utils/${process.env.CIRCLE_BUILD_NUM}/artifacts`,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${process.env.CIRCLE_TOKEN}`,
    },
  });

  console.log(await response.json());
})();
