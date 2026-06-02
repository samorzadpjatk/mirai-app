import { describe, it, expect } from "vitest";
import { deduplicateIds, extractFulfilledValues } from "../arrayUtils";

describe("deduplicateIds", () => {
  it("removes duplicate string ids", () => {
    const input = ["a", "b", "a", "c", "b"];
    expect(deduplicateIds(input)).toEqual(["a", "b", "c"]);
  });

  it("removes duplicate number ids", () => {
    const input = [1, 2, 1, 3, 2];
    expect(deduplicateIds(input)).toEqual([1, 2, 3]);
  });

  it("preserves order of first occurrence", () => {
    const input = ["z", "a", "z", "b", "a"];
    expect(deduplicateIds(input)).toEqual(["z", "a", "b"]);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateIds([])).toEqual([]);
  });

  it("returns same array when no duplicates", () => {
    const input = ["x", "y", "z"];
    expect(deduplicateIds(input)).toEqual(["x", "y", "z"]);
  });
});

describe("extractFulfilledValues", () => {
  it("filters out rejected results and extracts fulfilled values", () => {
    const results: PromiseSettledResult<number>[] = [
      { status: "fulfilled", value: 1 },
      { status: "rejected", reason: "error" },
      { status: "fulfilled", value: 3 },
    ];
    expect(extractFulfilledValues(results)).toEqual([1, 3]);
  });

  it("preserves order of fulfilled results", () => {
    const results: PromiseSettledResult<string>[] = [
      { status: "fulfilled", value: "first" },
      { status: "rejected", reason: "fail" },
      { status: "fulfilled", value: "second" },
      { status: "rejected", reason: "fail2" },
      { status: "fulfilled", value: "third" },
    ];
    expect(extractFulfilledValues(results)).toEqual(["first", "second", "third"]);
  });

  it("returns empty array when all rejected", () => {
    const results: PromiseSettledResult<number>[] = [
      { status: "rejected", reason: "error1" },
      { status: "rejected", reason: "error2" },
    ];
    expect(extractFulfilledValues(results)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(extractFulfilledValues([])).toEqual([]);
  });

  it("returns all values when all fulfilled", () => {
    const results: PromiseSettledResult<number>[] = [
      { status: "fulfilled", value: 10 },
      { status: "fulfilled", value: 20 },
      { status: "fulfilled", value: 30 },
    ];
    expect(extractFulfilledValues(results)).toEqual([10, 20, 30]);
  });
});
