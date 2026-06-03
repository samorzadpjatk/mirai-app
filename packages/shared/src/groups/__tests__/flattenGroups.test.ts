import { describe, expect, it } from "vitest";
import { flattenGroups } from "../flattenGroups";

describe("flattenGroups", () => {
  it("returns empty array for undefined input", () => {
    expect(flattenGroups(undefined)).toEqual([]);
  });

  it("flattens single page", () => {
    expect(flattenGroups([{ groups: [{ id: "1" }] }])).toEqual([{ id: "1" }]);
  });

  it("flattens multiple pages", () => {
    expect(flattenGroups([{ groups: [{ id: "1" }] }, { groups: [{ id: "2" }] }])).toEqual([
      { id: "1" },
      { id: "2" },
    ]);
  });
});
