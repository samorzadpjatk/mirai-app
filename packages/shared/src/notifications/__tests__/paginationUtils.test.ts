import { describe, expect, it } from "vitest";
import { buildPaginationBounds, mapSubscriptionStatus } from "../paginationUtils";

describe("mapSubscriptionStatus", () => {
  it("returns isSubscribed false and empty subscriptions for empty array", () => {
    const result = mapSubscriptionStatus([]);
    expect(result.isSubscribed).toBe(false);
    expect(result.subscriptions).toEqual([]);
  });

  it("returns isSubscribed true and mapped subscriptions for non-empty array", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const subscriptions = [
      { id: "sub-1", token: "token-a", createdAt: now },
      { id: "sub-2", token: "token-b", createdAt: now },
    ];
    const result = mapSubscriptionStatus(subscriptions);
    expect(result.isSubscribed).toBe(true);
    expect(result.subscriptions).toEqual([
      { id: "sub-1", token: "token-a", createdAt: now },
      { id: "sub-2", token: "token-b", createdAt: now },
    ]);
  });

  it("returns isSubscribed true for single subscription", () => {
    const now = new Date("2024-06-01T12:00:00Z");
    const result = mapSubscriptionStatus([{ id: "sub-1", token: "token-a", createdAt: now }]);
    expect(result.isSubscribed).toBe(true);
    expect(result.subscriptions).toHaveLength(1);
    expect(result.subscriptions[0]).toEqual({
      id: "sub-1",
      token: "token-a",
      createdAt: now,
    });
  });

  it("preserves createdAt Date instances in output", () => {
    const now = new Date();
    const result = mapSubscriptionStatus([{ id: "sub-1", token: "token-a", createdAt: now }]);
    const sub = result.subscriptions[0]!;
    expect(sub.createdAt).toBeInstanceOf(Date);
    expect(sub.createdAt.getTime()).toBe(now.getTime());
  });
});

describe("buildPaginationBounds", () => {
  it("returns totalPages 0 when count is 0", () => {
    const result = buildPaginationBounds(0, 10);
    expect(result.totalPages).toBe(0);
  });

  it("returns totalPages 1 when count fits in single page", () => {
    const result = buildPaginationBounds(5, 10);
    expect(result.totalPages).toBe(1);
  });

  it("returns totalPages 2 when count exceeds pageSize", () => {
    const result = buildPaginationBounds(15, 10);
    expect(result.totalPages).toBe(2);
  });

  it("returns totalPages 1 when count equals pageSize", () => {
    const result = buildPaginationBounds(10, 10);
    expect(result.totalPages).toBe(1);
  });

  it("rounds up partial pages correctly", () => {
    const result = buildPaginationBounds(21, 10);
    expect(result.totalPages).toBe(3);
  });

  it("handles large counts correctly", () => {
    const result = buildPaginationBounds(1000, 25);
    expect(result.totalPages).toBe(40);
  });

  it("handles pageSize larger than count", () => {
    const result = buildPaginationBounds(3, 100);
    expect(result.totalPages).toBe(1);
  });
});
