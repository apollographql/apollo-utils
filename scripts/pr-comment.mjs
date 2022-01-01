// @ts-check
import fetch from "node-fetch";
import { request } from "@octokit/request";

console.log(process.env);
console.log(
  "url is :" +
    `https://circleci.com/api/v2/project/github/trevor-scheer/apollo-utils/${process.env.CIRCLE_BUILD_NUM}/artifacts`,
);

const ghAuthed = request.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`,
  },
});

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

  process.env.CI_PULL_REQUEST;

  console.log(artifactLinks);

  const comments = await ghAuthed("POST /graphql", {
    query: `
      query GetPrComments($url: URI!) { 
        resource(url: $url) {
          ... on PullRequest {
            id
            comments(first: 10) {
              nodes {
                body
                author { login }
              }
            }
          }
        }
      }
    `,
    variables: {
      url: process.env.CI_PULL_REQUEST,
    },
  });

  console.log(comments.data);

  const prId = comments.data.resource.id;

  const newComment = await ghAuthed("POST /graphql", {
    query: `
      mutation AddComment($input: AddCommentInput!) {
        addComment(input: $input) {
          clientMutationId
        }
      }
    `,
    variables: {
      input: {
        subjectId: prId,
        body: "Hello World",
      }
    },
  });
})();
