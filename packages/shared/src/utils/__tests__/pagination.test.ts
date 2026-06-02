import { describe, it, expect } from "vitest";
import { buildPaginatedResponse } from "../pagination";

describe("buildPaginatedResponse", () => {
  it("builds a paginated response with items and hasMore true", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const result = buildPaginatedResponse(items, 100, 10, 0);
    expect(result).toEqual({
      items,
      pagination: {
        total: 100,
        limit: 10,
        offset: 0,
        hasMore: true,
      },
    });
  });

  it("builds a paginated response with hasMore false at the last page", () => {
    const items = [{ id: "91" }, { id: "92" }];
    const result = buildPaginatedResponse(items, 100, 10, 90);
    expect(result).toEqual({
      items,
      pagination: {
        total: 100,
        limit: 10,
        offset: 90,
        hasMore: false,
      },
    });
  });

  it("builds a paginated response with empty items", () => {
    const result = buildPaginatedResponse([], 0, 20, 0);
    expect(result).toEqual({
      items: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  });

  it("returns hasMore false when offset plus limit equals total", () => {
    const items = [{ id: "1" }];
    const result = buildPaginatedResponse(items, 10, 10, 0);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("handles a zero limit", () => {
    const items = [{ id: "1" }];
    const result = buildPaginatedResponse(items, 5, 0, 0);
    expect(result).toEqual({
      items,
      pagination: {
        total: 5,
        limit: 0,
        offset: 0,
        hasMore: true,
      },
    });
  });

  it("handles large offsets and totals correctly", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: String(i + 1) }));
    const result = buildPaginatedResponse(items, 10000, 5, 9995);
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.total).toBe(10000);
  });
});
