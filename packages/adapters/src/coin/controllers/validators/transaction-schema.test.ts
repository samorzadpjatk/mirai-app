import { describe, it, expect } from "bun:test";
import {
  validateGetStatisticsInput,
  validateGetMostActiveAdminStatsInput,
  validateGetAllInput,
  validateGetQuickStatsInput,
  validateGetAdditionalInsightsInput,
  validateGetCoinTransactionsInput,
} from "./transaction-schema";

describe("[UNIT] Coin Transaction Validators", () => {
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validGroupId = "550e8400-e29b-41d4-a716-446655440002";

  describe("validateGetStatisticsInput", () => {
    it("should validate valid trip ID", () => {
      const input = { tripId: validTripId };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "invalid-trip-id" };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string tripId", () => {
      const input = { tripId: 123 };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with wrong segment lengths", () => {
      const input = {
        tripId: "550e8400-e29b-41d4-a716-44665544", // too short
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with invalid characters", () => {
      const input = {
        tripId: "550e8400-e29b-41d4-a716-XXXXXXXXXXXX",
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID without hyphens", () => {
      const input = {
        tripId: "550e8400e29b41d4a716446655440001",
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetMostActiveAdminStatsInput", () => {
    it("should validate valid trip ID", () => {
      const input = { tripId: validTripId };
      const result = validateGetMostActiveAdminStatsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "not-a-uuid" };
      const result = validateGetMostActiveAdminStatsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetMostActiveAdminStatsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetAllInput", () => {
    it("should validate minimal input with tripId only", () => {
      const input = { tripId: validTripId };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should validate with pagination", () => {
      const input = {
        tripId: validTripId,
        pagination: {
          limit: 50,
          offset: 0,
        },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit only in pagination", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 25 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset only in pagination", () => {
      const input = {
        tripId: validTripId,
        pagination: { offset: 10 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 1 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 100 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with offset = 0 (minimum)", () => {
      const input = {
        tripId: validTripId,
        pagination: { offset: 0 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "invalid-trip" };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject pagination limit = 0", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 0 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject pagination limit > 100", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 101 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative pagination offset", () => {
      const input = {
        tripId: validTripId,
        pagination: { offset: -1 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer pagination limit", () => {
      const input = {
        tripId: validTripId,
        pagination: { limit: 10.5 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer pagination offset", () => {
      const input = {
        tripId: validTripId,
        pagination: { offset: 5.5 },
      };
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetAllInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetQuickStatsInput", () => {
    it("should validate valid trip ID", () => {
      const input = { tripId: validTripId };
      const result = validateGetQuickStatsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "not-a-uuid" };
      const result = validateGetQuickStatsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetQuickStatsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetAdditionalInsightsInput", () => {
    it("should validate valid trip ID", () => {
      const input = { tripId: validTripId };
      const result = validateGetAdditionalInsightsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "not-a-uuid" };
      const result = validateGetAdditionalInsightsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetAdditionalInsightsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetCoinTransactionsInput", () => {
    it("should validate minimal input with tripId only", () => {
      const input = { tripId: validTripId };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
      }
    });

    it("should validate with groupId filter", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit", () => {
      const input = {
        tripId: validTripId,
        limit: 50,
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        limit: 1,
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with limit = 100 (maximum)", () => {
      const input = {
        tripId: validTripId,
        limit: 100,
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        limit: 25,
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = { tripId: "invalid-trip" };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid groupId format", () => {
      const input = {
        tripId: validTripId,
        groupId: "invalid-group",
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit = 0", () => {
      const input = {
        tripId: validTripId,
        limit: 0,
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit > 100", () => {
      const input = {
        tripId: validTripId,
        limit: 101,
      };
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing tripId", () => {
      const input = {};
      const result = validateGetCoinTransactionsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("UUID format validation edge cases", () => {
    const validInput = { tripId: validTripId };

    it("should accept lowercase UUID", () => {
      const input = {
        tripId: "550e8400-e29b-41d4-a716-446655440001",
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(true);
    });

    it("should accept uppercase UUID", () => {
      const input = {
        tripId: "550E8400-E29B-41D4-A716-446655440001",
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(true);
    });

    it("should accept mixed case UUID", () => {
      const input = {
        tripId: "550E8400-e29b-41D4-A716-446655440001",
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject UUID with extra hyphens", () => {
      const input = {
        tripId: "550e8400-e29b-41d4-a716-446655-440001",
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty UUID string", () => {
      const input = { tripId: "" };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with spaces", () => {
      const input = {
        tripId: "550e8400-e29b-41d4-a716-44665544000 ",
      };
      const result = validateGetStatisticsInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateGetStatisticsInput: tripId (UUID format)
 * - validateGetMostActiveAdminStatsInput: tripId (UUID format)
 * - validateGetAllInput: tripId (UUID) + optional pagination with limit (1-100) and offset (>=0, both integers)
 * - validateGetQuickStatsInput: tripId (UUID format)
 * - validateGetAdditionalInsightsInput: tripId (UUID format)
 * - validateGetCoinTransactionsInput: tripId (UUID) + optional groupId (UUID) + optional limit (1-100)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Invalid UUID formats (wrong segments, invalid chars, missing hyphens)
 * - Pagination boundary values (limit: 1-100, offset: >=0)
 * - Integer validation for pagination fields
 * - Missing required fields
 * - UUID case insensitivity (lowercase, uppercase, mixed)
 * - Empty string handling
 */
