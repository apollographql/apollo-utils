import type { Fetcher } from "..";
import nodeFetch from "node-fetch";
import makeFetchHappen from "make-fetch-happen";
import { fetch as undiciFetch } from "undici";
import FormData from "form-data";
import nock from "nock";

// This "test suite" actually does all its work at compile time.
function isAFetcher(_fetcher: Fetcher) {}

describe("implements Fetcher", () => {
  it("node-fetch", () => {
    isAFetcher(nodeFetch);
  });

  it("make-fetch-happen", () => {
    isAFetcher(makeFetchHappen);
  });

  it("undici", () => {
    isAFetcher(undiciFetch);
  });
});

describe("accepts FormData as a body", () => {
  beforeEach(nockBeforeEach);
  afterEach(nockAfterEach);

  const formData = new FormData();
  formData.append("foo", "bar");

  it("node-fetch", async () => {
    nock("https://example.com").post("/", (body) => {
      console.log("hello!");
      console.log(body);
      expect(body).toMatchInlineSnapshot();
      return true;
    });
    const result = await nodeFetch("https://example.com/", {
      method: "POST",
      body: formData,
      headers: { "content-type": "x-www-form-urlencoded" },
    });
  });

  // it("make-fetch-happen", () => {
  //   makeFetchHappen('https://example.com', { body: formData });
  // });

  // it("undici", () => {
  //   undiciFetch('https://example.com', { body: formData });
  // });
});

// Ensures an active and clean nock before every test
export function nockBeforeEach() {
  if (!nock.isActive()) {
    nock.activate();
  }
  // Cleaning _before_ each test ensures that any mocks from a previous test
  // which failed don't affect the current test.
  nock.cleanAll();
}

// Ensures a test is complete (all expected requests were run) and a clean
// global state after each test.
export function nockAfterEach() {
  // unmock HTTP interceptor
  nock.restore();
  // effectively nock.isDone() but with more helpful messages in test failures
  expect(nock.activeMocks()).toEqual([]);
}
