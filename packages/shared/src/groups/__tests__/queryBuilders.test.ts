import { describe, it, expect } from "vitest";
import { buildGroupQueryInput, getNextGroupPageParam } from "../queryBuilders";

describe("buildGroupQueryInput", () => {
  it("should build query with tripId and pageParam 0", () => {
    const result = buildGroupQueryInput("trip-123", 0);
    expect(result).toEqual({ tripId: "trip-123", pagination: { limit: 30, offset: 0 } });
  });
  it("should build query with offset from pageParam", () => {
    const result = buildGroupQueryInput("trip-123", 30);
    expect(result).toEqual({ tripId: "trip-123", pagination: { limit: 30, offset: 30 } });
  });
  it("should handle null tripId by defaulting to empty string", () => {
    const result = buildGroupQueryInput(null, 0);
    expect(result).toEqual({ tripId: "", pagination: { limit: 30, offset: 0 } });
  });
  it("should handle undefined tripId by defaulting to empty string", () => {
    const result = buildGroupQueryInput(undefined, 60);
    expect(result).toEqual({ tripId: "", pagination: { limit: 30, offset: 60 } });
  });
  it("should handle falsy pageParam as 0", () => {
    const result = buildGroupQueryInput("trip-123", 0);
    expect(result.pagination.offset).toBe(0);
  });
});

describe("getNextGroupPageParam", () => {
  it("should return next offset when hasMore is true", () => {
    const result = getNextGroupPageParam({ pagination: { hasMore: true, offset: 0, limit: 30 } });
    expect(result).toBe(30);
  });
  it("should return undefined when hasMore is false", () => {
    const result = getNextGroupPageParam({ pagination: { hasMore: false, offset: 30, limit: 30 } });
    expect(result).toBeUndefined();
  });
  it("should handle different offset and limit values", () => {
    const result = getNextGroupPageParam({ pagination: { hasMore: true, offset: 60, limit: 20 } });
    expect(result).toBe(80);
  });
  it("should return undefined at boundary when hasMore is false", () => {
    const result = getNextGroupPageParam({ pagination: { hasMore: false, offset: 90, limit: 30 } });
    expect(result).toBeUndefined();
  });
});
