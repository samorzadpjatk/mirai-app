import { describe, it, expect } from "vitest";
import { buildCoinTransactionValues } from "../builders";

describe("buildCoinTransactionValues", () => {
  it("builds values for add transaction with reason", () => {
    const input = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 50,
      reason: "Bonus coins",
    };
    const result = buildCoinTransactionValues(input, "admin-123", true);
    expect(result).toEqual({
      groupId: "group-123",
      amount: 50,
      reason: "Bonus coins",
      adminId: "admin-123",
    });
  });

  it("builds values for add transaction without reason", () => {
    const input = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 50,
    };
    const result = buildCoinTransactionValues(input, "admin-123", true);
    expect(result).toEqual({
      groupId: "group-123",
      amount: 50,
      reason: null,
      adminId: "admin-123",
    });
  });

  it("builds values for remove transaction with reason", () => {
    const input = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 50,
      reason: "Penalty",
    };
    const result = buildCoinTransactionValues(input, "admin-123", false);
    expect(result).toEqual({
      groupId: "group-123",
      amount: -50,
      reason: "Penalty",
      adminId: "admin-123",
    });
  });

  it("builds values for remove transaction without reason", () => {
    const input = {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 50,
    };
    const result = buildCoinTransactionValues(input, "admin-123", false);
    expect(result).toEqual({
      groupId: "group-123",
      amount: -50,
      reason: null,
      adminId: "admin-123",
    });
  });
});
