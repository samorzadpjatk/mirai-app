import type { Group } from "@mirai-app/db";
import { describe, expect, it } from "vitest";
import { checkCoinBalance, validateCoinTransaction } from "../validators";

const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: "group-123",
  name: "Test Group",
  description: "A test group",
  image: null,
  code: "1234",
  coins: 100,
  tripId: "trip-123",
  organizerId: "user-123",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockInput = (overrides: Record<string, unknown> = {}) => ({
  tripId: "trip-123",
  groupId: "group-123",
  amount: 50,
  reason: "Test reason",
  ...overrides,
});

describe("validateCoinTransaction", () => {
  it("returns null when group is valid for transaction", () => {
    const group = createMockGroup();
    const input = createMockInput();
    const result = validateCoinTransaction(group, input);
    expect(result).toBeNull();
  });

  it("returns error when group is null", () => {
    const input = createMockInput();
    const result = validateCoinTransaction(null, input);
    expect(result).toEqual({ error: "NOT_FOUND", message: "Group not found" });
  });

  it("returns error when group belongs to different trip", () => {
    const group = createMockGroup({ tripId: "different-trip" });
    const input = createMockInput();
    const result = validateCoinTransaction(group, input);
    expect(result).toEqual({ error: "NOT_FOUND", message: "Group not found" });
  });

  it("returns error when group is deleted", () => {
    const group = createMockGroup({ isDeleted: true });
    const input = createMockInput();
    const result = validateCoinTransaction(group, input);
    expect(result).toEqual({ error: "NOT_FOUND", message: "Group not found" });
  });
});

describe("checkCoinBalance", () => {
  it("returns null when group has enough coins", () => {
    const group = createMockGroup({ coins: 100 });
    const result = checkCoinBalance(group, 50);
    expect(result).toBeNull();
  });

  it("returns null when group has exactly enough coins", () => {
    const group = createMockGroup({ coins: 50 });
    const result = checkCoinBalance(group, 50);
    expect(result).toBeNull();
  });

  it("returns error when group has insufficient coins", () => {
    const group = createMockGroup({ coins: 30 });
    const result = checkCoinBalance(group, 50);
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Group does not have enough coins",
    });
  });

  it("returns error when group has zero coins", () => {
    const group = createMockGroup({ coins: 0 });
    const result = checkCoinBalance(group, 10);
    expect(result).toEqual({
      error: "BAD_REQUEST",
      message: "Group does not have enough coins",
    });
  });
});
