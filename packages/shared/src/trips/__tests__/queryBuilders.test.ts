import { describe, it, expect } from "vitest";
import { buildTripQueryInput, getNextTripPageParam, calculateAllTrips } from "../queryBuilders";

describe("buildTripQueryInput", () => {
  it("should build query with pageParam 0", () => {
    const result = buildTripQueryInput(0);
    expect(result).toEqual({ pagination: { limit: 20, offset: 0 } });
  });
  it("should build query with offset from pageParam", () => {
    const result = buildTripQueryInput(20);
    expect(result).toEqual({ pagination: { limit: 20, offset: 20 } });
  });
  it("should handle falsy pageParam as 0", () => {
    const result = buildTripQueryInput(0);
    expect(result.pagination.offset).toBe(0);
  });
});

describe("getNextTripPageParam", () => {
  it("should return next offset when hasMore is true", () => {
    const result = getNextTripPageParam({ pagination: { hasMore: true, offset: 0, limit: 20 } });
    expect(result).toBe(20);
  });
  it("should return undefined when hasMore is false", () => {
    const result = getNextTripPageParam({ pagination: { hasMore: false, offset: 20, limit: 20 } });
    expect(result).toBeUndefined();
  });
  it("should handle different offset and limit values", () => {
    const result = getNextTripPageParam({ pagination: { hasMore: true, offset: 40, limit: 20 } });
    expect(result).toBe(60);
  });
});

describe("calculateAllTrips", () => {
  it("should return tripsData when available", () => {
    const trips = [
      { id: "1", name: "Trip 1" },
      { id: "2", name: "Trip 2" },
    ];
    expect(calculateAllTrips(trips, null)).toEqual(trips);
  });
  it("should return cachedTrips when tripsData is null", () => {
    const cached = [{ id: "3", name: "Cached" }];
    expect(calculateAllTrips(null, cached)).toEqual(cached);
  });
  it("should return empty array when both are null", () => {
    expect(calculateAllTrips(null, null)).toEqual([]);
  });
  it("should prefer tripsData over cachedTrips when both are available", () => {
    const trips = [{ id: "1", name: "Fresh" }];
    const cached = [{ id: "2", name: "Cached" }];
    expect(calculateAllTrips(trips, cached)).toEqual(trips);
  });
  it("should return a copy of tripsData (not the same reference)", () => {
    const trips = [{ id: "1" }];
    const result = calculateAllTrips(trips, null);
    expect(result).toEqual(trips);
    expect(result).not.toBe(trips);
  });
});
