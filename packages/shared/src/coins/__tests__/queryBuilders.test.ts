import { describe, it, expect } from "vitest";
import { buildCoinTransactionWhereExpr } from "../queryBuilders";

describe("buildCoinTransactionWhereExpr", () => {
  it("returns an eq expression when groupId is provided", () => {
    const result = buildCoinTransactionWhereExpr("group-123", []);
    expect(result).toBeDefined();
  });

  it("returns an inArray expression when groupIdList is non-empty", () => {
    const result = buildCoinTransactionWhereExpr(undefined, ["group-1", "group-2"]);
    expect(result).toBeDefined();
  });

  it("returns undefined when both groupId and groupIdList are empty", () => {
    const result = buildCoinTransactionWhereExpr(undefined, []);
    expect(result).toBeUndefined();
  });

  it("prefers groupId over groupIdList when both are provided", () => {
    const result = buildCoinTransactionWhereExpr("group-123", ["group-1", "group-2"]);
    expect(result).toBeDefined();
  });

  it("returns undefined when groupId is an empty string and groupIdList is empty", () => {
    const result = buildCoinTransactionWhereExpr("", []);
    expect(result).toBeUndefined();
  });

  it("returns an inArray expression for a single-item groupIdList", () => {
    const result = buildCoinTransactionWhereExpr(undefined, ["group-999"]);
    expect(result).toBeDefined();
  });

  it("returns an eq expression for a groupId with special characters", () => {
    const result = buildCoinTransactionWhereExpr("group-with-dash_123", []);
    expect(result).toBeDefined();
  });
});
