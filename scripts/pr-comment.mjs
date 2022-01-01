import fetch from "node-fetch";

console.log(process.env.STORED_ARTIFACTS);
console.log(process.env.CIRCLE_TOKEN);
console.log(process.env.TESTING);
console.log(process.env);

(async () => {
  const response = await fetch({
    url: "https://circleci.com/api/v2/project/github/trevor-scheer/apollo-utils/$CIRCLE_BUILD_NUM/artifacts",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${process.env.CIRCLE_TOKEN}`,
    },
  });

  console.log(await response.json());
})();
