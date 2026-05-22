import { describe, it, expect } from "@jest/globals";
import {
  calculateNextIndexFromScroll,
  calculateBoundedIndex,
  canOpenFullscreen,
  needsFullscreenClose,
} from "~/components/trips/groups/details/GroupApprovedChallenges";

describe("calculateNextIndexFromScroll", () => {
  it("should calculate index from scroll offset", () => {
    expect(calculateNextIndexFromScroll(100, 50)).toBe(2);
    expect(calculateNextIndexFromScroll(0, 100)).toBe(0);
  });

  it("should handle zero width gracefully", () => {
    expect(calculateNextIndexFromScroll(0, 0)).toBe(0);
  });
});

describe("calculateBoundedIndex", () => {
  it("should return index within bounds", () => {
    expect(calculateBoundedIndex(2, 5)).toBe(2);
  });

  it("should cap at max index", () => {
    expect(calculateBoundedIndex(10, 5)).toBe(5);
  });

  it("should floor at zero", () => {
    expect(calculateBoundedIndex(-1, 5)).toBe(0);
  });
});

describe("canOpenFullscreen", () => {
  it("should return true when there are submissions", () => {
    expect(canOpenFullscreen(1)).toBe(true);
    expect(canOpenFullscreen(5)).toBe(true);
  });

  it("should return false when no submissions", () => {
    expect(canOpenFullscreen(0)).toBe(false);
  });
});

describe("needsFullscreenClose", () => {
  it("should return true when no submissions", () => {
    expect(needsFullscreenClose(0)).toBe(true);
  });

  it("should return false when there are submissions", () => {
    expect(needsFullscreenClose(1)).toBe(false);
    expect(needsFullscreenClose(5)).toBe(false);
  });
});
