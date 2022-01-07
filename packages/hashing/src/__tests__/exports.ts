import * as allExports from '..';

it("exports hashing functions", () => {
  expect(Object.keys(allExports).length).toBe(2);
  expect(typeof allExports.createHash).toBe("function");
  expect(typeof allExports.operationHash).toBe("function");
});