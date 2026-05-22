import { describe, it, expect } from "@jest/globals";
import { formatRankingPosition } from "../trips/groups/details/GroupStatsGrid";

describe("formatRankingPosition", () => {
  it("should format ranking with hash prefix", () => {
    expect(formatRankingPosition(1)).toBe("#1");
    expect(formatRankingPosition(5)).toBe("#5");
  });

  it("should return dash for null", () => {
    expect(formatRankingPosition(null)).toBe("--");
  });

  it("should return dash for undefined", () => {
    expect(formatRankingPosition(undefined)).toBe("--");
  });

  it("should return dash for zero", () => {
    expect(formatRankingPosition(0)).toBe("--");
  });
});
