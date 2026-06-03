import { describe, it, expect } from "vitest";
import { buildChallengeQueryInput, getNextChallengePageParam } from "../queryBuilders";

describe("buildChallengeQueryInput", () => {
  it("should build query with tripId and pageParam 0", () => {
    const result = buildChallengeQueryInput("trip-456", 0);
    expect(result).toEqual({ tripId: "trip-456", pagination: { limit: 30, offset: 0 } });
  });
  it("should build query with offset from pageParam", () => {
    const result = buildChallengeQueryInput("trip-456", 30);
    expect(result).toEqual({ tripId: "trip-456", pagination: { limit: 30, offset: 30 } });
  });
  it("should handle null tripId by defaulting to empty string", () => {
    const result = buildChallengeQueryInput(null, 0);
    expect(result).toEqual({ tripId: "", pagination: { limit: 30, offset: 0 } });
  });
  it("should handle undefined tripId by defaulting to empty string", () => {
    const result = buildChallengeQueryInput(undefined, 60);
    expect(result).toEqual({ tripId: "", pagination: { limit: 30, offset: 60 } });
  });
});

describe("getNextChallengePageParam", () => {
  it("should return next offset when hasMore is true", () => {
    const result = getNextChallengePageParam({
      pagination: { hasMore: true, offset: 0, limit: 30 },
    });
    expect(result).toBe(30);
  });
  it("should return undefined when hasMore is false", () => {
    const result = getNextChallengePageParam({
      pagination: { hasMore: false, offset: 30, limit: 30 },
    });
    expect(result).toBeUndefined();
  });
  it("should handle different offset and limit values", () => {
    const result = getNextChallengePageParam({
      pagination: { hasMore: true, offset: 60, limit: 20 },
    });
    expect(result).toBe(80);
  });
});

import { buildChallengeFilter } from "../queryBuilders";

describe("buildChallengeFilter", () => {
  it("should return isRecurring false without tripId", () => {
    expect(buildChallengeFilter()).toEqual({ isRecurring: false });
  });

  it("should include tripId when provided", () => {
    expect(buildChallengeFilter("trip-123")).toEqual({ isRecurring: false, tripId: "trip-123" });
  });

  it("should omit tripId for all trips", () => {
    expect(buildChallengeFilter("all")).toEqual({ isRecurring: false });
  });

  it("should omit tripId for null", () => {
    expect(buildChallengeFilter(null)).toEqual({ isRecurring: false });
  });
});
