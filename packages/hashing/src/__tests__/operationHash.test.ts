import { operationHash } from "..";

describe("operationHash", () => {
  it("hashes an operation string", () => {
    expect(operationHash("query { foo }")).toEqual(
      "6aa12cae7e116b726dae8e1ea59ab89ea8b16b7d596c834341d10ca36e12efd6",
    );
  });
});
