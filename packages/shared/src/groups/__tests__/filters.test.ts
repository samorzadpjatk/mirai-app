import { describe, expect, it } from "vitest";
import { filterGroupsBySearch } from "../filters";

describe("filterGroupsBySearch", () => {
  it("returns all when query is empty", () => {
    const groups = [{ name: "Alpha" }, { name: "Beta" }];
    expect(filterGroupsBySearch(groups, "")).toEqual(groups);
  });

  it("filters by lowercase match", () => {
    const groups = [{ name: "Alpha" }, { name: "Beta" }];
    const result = filterGroupsBySearch(groups, "al");
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Alpha");
  });

  it("filters case-insensitively", () => {
    const groups = [{ name: "Alpha" }, { name: "Beta" }];
    const result = filterGroupsBySearch(groups, "AL");
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Alpha");
  });

  it("returns empty when no matches", () => {
    const groups = [{ name: "Alpha" }];
    expect(filterGroupsBySearch(groups, "xyz")).toEqual([]);
  });

  it("preserves original order", () => {
    const groups: Array<{ name: string }> = [
      { name: "Gamma" },
      { name: "Alpha" },
      { name: "Beta" },
    ];
    const result = filterGroupsBySearch(groups, "a");
    expect(result.map((g) => g.name)).toEqual(["Gamma", "Alpha", "Beta"]);
  });
});
