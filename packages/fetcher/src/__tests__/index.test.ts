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

describe("Fetcher accepts FormData as a body", () => {
  beforeEach(nockBeforeEach);
  afterEach(nockAfterEach);

  it("node-fetch", async () => {
    const formData = new FormData();
    formData.append("foo", "bar");

    nock("https://example.com")
      .post("/", (body) => {
        expect(body).toMatch(`Content-Disposition: form-data; name="foo"\r\n\r\nbar`);
        return true;
      })
      .reply(200, "ok");

    await nodeFetch("https://example.com/", {
      method: "POST",
      body: formData,
    });
  });

  it("make-fetch-happen", async () => {
    const formData = new FormData();
    formData.append("foo", "bar");

    nock("https://example.com")
      .post("/", (body) => {
        expect(body).toMatch(`Content-Disposition: form-data; name="foo"\r\n\r\nbar`);
        return true;
      })
      .reply(200, "ok");

    await makeFetchHappen("https://example.com/", {
      method: "POST",
      body: formData,
    });
  });

  it("undici", async () => {
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
        }
      })
      .reply(200, "ok");

    // undici doesn't support `form-data`'s `FormData` class
    const formData = new UndiciFormData();
    formData.append("foo", "bar");

    const result = await undiciFetch("https://example.com/", {
      method: "POST",
      body: formData,
    });

    const t = await result.text();
    expect(t).toMatchInlineSnapshot(`"ok"`);
  });
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
