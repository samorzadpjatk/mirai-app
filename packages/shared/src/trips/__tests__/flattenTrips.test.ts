import { describe, expect, it } from "vitest";
import { flattenTrips } from "../flattenTrips";

describe("flattenTrips", () => {
  it("returns null for undefined input", () => {
    expect(flattenTrips(undefined)).toBeNull();
  });

  it("flattens single page", () => {
    const pages = [{ trips: [{ id: "1", name: "A" }] }];
    expect(flattenTrips(pages)).toEqual([{ id: "1", name: "A" }]);
  });

  it("flattens multiple pages", () => {
    const pages = [{ trips: [{ id: "1", name: "A" }] }, { trips: [{ id: "2", name: "B" }] }];
    expect(flattenTrips(pages)).toEqual([
      { id: "1", name: "A" },
      { id: "2", name: "B" },
    ]);
  });

  it("handles empty pages", () => {
    const pages = [{ trips: [] }, { trips: [{ id: "1", name: "A" }] }];
    expect(flattenTrips(pages)).toEqual([{ id: "1", name: "A" }]);
  });

  it("handles missing trips key", () => {
    const pages = [{}, { trips: [{ id: "1", name: "A" }] }];
    expect(flattenTrips(pages)).toEqual([{ id: "1", name: "A" }]);
  });

  it("returns empty array for empty pages", () => {
    expect(flattenTrips([])).toEqual([]);
  });
});
