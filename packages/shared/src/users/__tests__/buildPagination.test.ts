import { describe, expect, it } from "vitest";
import { buildPagination } from "../buildPagination";

describe("buildPagination", () => {
  it("calculates pagination for first page with more results", () => {
    const result = buildPagination(100, 20, 0, 1);

    expect(result.totalPages).toBe(5);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
  });

  it("calculates pagination for middle page", () => {
    const result = buildPagination(100, 20, 40, 3);

    expect(result.totalPages).toBe(5);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(true);
  });

  it("calculates pagination for last page", () => {
    const result = buildPagination(100, 20, 80, 5);

    expect(result.totalPages).toBe(5);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(true);
  });

  it("handles total count not evenly divisible by limit", () => {
    const result = buildPagination(95, 20, 80, 5);

    expect(result.totalPages).toBe(5);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(true);
  });
});
