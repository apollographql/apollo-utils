import FormData from "form-data";
import makeFetchHappen from "make-fetch-happen";
import nock from "nock";
import nodeFetch from "node-fetch";
import {
  fetch as undiciFetch,
  FormData as UndiciFormData,
  MockAgent,
  setGlobalDispatcher,
} from "undici";
import type { Fetcher } from "..";

const [nodeMajor] = process.version
  .slice(1) // remove 'v'
  .split(".", 1)
  .map(Number);

// This "test suite" actually does all its work at compile time.
describe("implements Fetcher", () => {
  function isAFetcher(_fetcher: Fetcher) {}

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

function mockRequestWithFormData() {
  nock("https://example.com")
    .post("/", (body) => {
      expect(body).toMatch(
        `Content-Disposition: form-data; name="foo"\r\n\r\nbar`,
      );
      return true;
    })
    .reply(200, "ok");
}

describe("Fetcher accepts FormData generic for body typing", () => {
  beforeEach(nockBeforeEach);
  afterEach(nockAfterEach);
  
  it("no generic specified, no FormData allowed", async () => {
    const fetcher: Fetcher = nodeFetch;
    const formData = new FormData();
    formData.append("foo", "bar");

    mockRequestWithFormData();

    await fetcher("https://example.com/", {
      method: "POST",
      // @ts-expect-error
      body: formData,
    });
  });

  it("node-fetch", async () => {
    const fetcher: Fetcher<FormData> = nodeFetch;
    const formData = new FormData();
    formData.append("foo", "bar");

    mockRequestWithFormData();

    await fetcher("https://example.com/", {
      method: "POST",
      body: formData,
    });
  });

  it("make-fetch-happen", async () => {
    const fetcher: Fetcher<FormData> = makeFetchHappen;
    const formData = new FormData();
    formData.append("foo", "bar");

    mockRequestWithFormData();

    await fetcher("https://example.com/", {
      method: "POST",
      body: formData,
    });
  });

  (nodeMajor! >= 16 ? it : it.skip)("undici", async () => {
    const fetcher: Fetcher<UndiciFormData> = undiciFetch;
    // We can't use nock with undici, but undici provides mocking utilities
    // https://github.com/nock/nock/issues/2183
    const agent = new MockAgent({ connections: 1 });
    agent.disableNetConnect();
    setGlobalDispatcher(agent);

    const client = agent.get("https://example.com");

    client
      .intercept({
        path: "/",
        method: "POST",
        // This is unexpected. the body is typed as a string but it's the actual
        // FormData object still. Pretty sure this is a bug.
        body(body: any) {
          const bar = body.get("foo");
          return bar === "bar";
        },
      })
      .reply(200, "ok");

    // undici doesn't support `form-data`'s `FormData` class
    const formData = new UndiciFormData();
    formData.append("foo", "bar");

    const result = await fetcher("https://example.com/", {
      method: "POST",
      body: formData,
    });

    const t = await result.text();
    expect(t).toMatchInlineSnapshot(`"ok"`);
  });
});

// Ensures an active and clean nock before every test
function nockBeforeEach() {
  if (!nock.isActive()) {
    nock.activate();
  }
  // Cleaning _before_ each test ensures that any mocks from a previous test
  // which failed don't affect the current test.
  nock.cleanAll();
}

// Ensures a test is complete (all expected requests were run) and a clean
// global state after each test.
function nockAfterEach() {
  // unmock HTTP interceptor
  nock.restore();
  // effectively nock.isDone() but with more helpful messages in test failures
  expect(nock.activeMocks()).toEqual([]);
}
