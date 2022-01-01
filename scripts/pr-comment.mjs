// @ts-check
import fetch from "node-fetch";
import { request } from "@octokit/request";

const { CI_PULL_REQUEST, CIRCLE_BUILD_NUM, CIRCLE_TOKEN, GITHUB_TOKEN } =
  process.env;

if (!CI_PULL_REQUEST) {
  console.log('no PR');
  process.exit(0);
}

const ghAuthed = request.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});

(async () => {
  const response = await fetch(
    `https://circleci.com/api/v2/project/github/trevor-scheer/apollo-utils/${CIRCLE_BUILD_NUM}/artifacts`,
    {
      headers: {
        Accept: "application/json",
        "Circle-Token": `${CIRCLE_TOKEN}`,
      },
    },
  );

  const artifactLinks = (await response.json()).items.map((item) => item.url);

  const comments = await ghAuthed("POST /graphql", {
    query: `#graphql
      query GetPrComments($url: URI!) { 
        resource(url: $url) {
          ... on PullRequest {
            id
            comments(first: 10) {
              nodes {
                id
                body
                author { login }
              }
            }
          }
        }
      }
    `,
    variables: {
      url: CI_PULL_REQUEST,
    },
  });

  const pr = comments.data.data.resource;

  const commentSubject = "The following artifacts were published to CircleCI:";
  const existingCommentId = pr.comments.nodes.find((comment) =>
    comment.body.includes(commentSubject),
  )?.id;

  const body = [
    commentSubject,
    artifactLinks.map((url) => `- ${url}`).join("\n") + "\n",
    "These can be `npm install`ed into your project like so:",
    `>\`npm i ${artifactLinks[0]}\`\n`,
    "This comment will be updated on every successful build.",
  ].join("\n");

  if (existingCommentId) {
    await ghAuthed("POST /graphql", {
      query: `#graphql
        mutation UpdateComment($input: UpdateIssueCommentInput!) {
          updateIssueComment(input: $input) {
            clientMutationId
          }
        }
      `,
      variables: {
        input: {
          id: existingCommentId,
          body,
        },
      },
    });
  } else {
    await ghAuthed("POST /graphql", {
      query: `#graphql
      mutation AddComment($input: AddCommentInput!) {
        addComment(input: $input) {
          clientMutationId
        }
      }
    `,
      variables: {
        input: {
          subjectId: pr.id,
          body,
        },
      },
    });
  }
})();
