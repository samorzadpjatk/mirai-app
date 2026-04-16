import { describe, it, expect } from "bun:test";
import {
  validateAddCoinsInput,
  validateRemoveCoinsInput,
  type AddCoinsInput,
  type RemoveCoinsInput,
} from "./coin-schema";

describe("[UNIT] Coin Schema Validators", () => {
  const validTripId = "550e8400-e29b-41d4-a716-446655440001";
  const validGroupId = "550e8400-e29b-41d4-a716-446655440002";

  describe("validateAddCoinsInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
        expect(result.data.groupId).toBe(validGroupId);
        expect(result.data.amount).toBe(50);
      }
    });

    it("should validate with reason", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 100,
        reason: "Bonus for completing challenge",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe("Bonus for completing challenge");
      }
    });

    it("should validate with amount = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 1,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1);
      }
    });

    it("should validate with large amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 1000000,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with empty reason", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 50,
        reason: "",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        tripId: "invalid-trip-id",
        groupId: validGroupId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid groupId format", () => {
      const input = {
        tripId: validTripId,
        groupId: "invalid-group-id",
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject amount = 0", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 0,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 1");
      }
    });

    it("should reject negative amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: -10,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 1");
      }
    });

    it("should allow fractional amount (schema does not enforce integer)", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 10.5,
      };
      const result = validateAddCoinsInput(input);
      // Schema uses Schema.Number without int() - fractional amounts are allowed
      expect(result.success).toBe(true);
    });

    it("should reject missing tripId", () => {
      const input = {
        groupId: validGroupId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing groupId", () => {
      const input = {
        tripId: validTripId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string tripId", () => {
      const input = {
        tripId: 123,
        groupId: validGroupId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string groupId", () => {
      const input = {
        tripId: validTripId,
        groupId: 456,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-number amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: "50",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with wrong segment lengths", () => {
      const input = {
        tripId: "550e8400-e29b-41d4-a716-44665544", // too short
        groupId: validGroupId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with invalid characters", () => {
      const input = {
        tripId: validTripId,
        groupId: "550e8400-e29b-41d4-a716-XXXXXXXXXXXX",
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID without hyphens", () => {
      const input = {
        tripId: "550e8400e29b41d4a716446655440001",
        groupId: validGroupId,
        amount: 50,
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateRemoveCoinsInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripId).toBe(validTripId);
        expect(result.data.groupId).toBe(validGroupId);
        expect(result.data.amount).toBe(25);
      }
    });

    it("should validate with reason", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 30,
        reason: "Penalty for rule violation",
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe("Penalty for rule violation");
      }
    });

    it("should validate with amount = 1 (minimum)", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 1,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with large amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 999999,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with empty reason", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 10,
        reason: "",
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid tripId format", () => {
      const input = {
        tripId: "invalid-trip-id",
        groupId: validGroupId,
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid groupId format", () => {
      const input = {
        tripId: validTripId,
        groupId: "invalid-group-id",
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject amount = 0", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 0,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 1");
      }
    });

    it("should reject negative amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: -5,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at least 1");
      }
    });

    it("should allow fractional amount (schema does not enforce integer)", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: 15.5,
      };
      const result = validateRemoveCoinsInput(input);
      // Schema uses Schema.Number without int() - fractional amounts are allowed
      expect(result.success).toBe(true);
    });

    it("should reject missing tripId", () => {
      const input = {
        groupId: validGroupId,
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing groupId", () => {
      const input = {
        tripId: validTripId,
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string tripId", () => {
      const input = {
        tripId: 123,
        groupId: validGroupId,
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string groupId", () => {
      const input = {
        tripId: validTripId,
        groupId: 456,
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-number amount", () => {
      const input = {
        tripId: validTripId,
        groupId: validGroupId,
        amount: "25",
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with wrong segment lengths", () => {
      const input = {
        tripId: validTripId,
        groupId: "550e8400-e29b-41d4-a716-44665544", // too short
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with invalid characters", () => {
      const input = {
        tripId: "550e8400-e29b-41d4-a716-XXXXXXXXXXXX",
        groupId: validGroupId,
        amount: 25,
      };
      const result = validateRemoveCoinsInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("UUID format validation edge cases", () => {
    const validInput = {
      tripId: validTripId,
      groupId: validGroupId,
      amount: 10,
    };

    it("should accept lowercase UUID", () => {
      const input = {
        ...validInput,
        tripId: "550e8400-e29b-41d4-a716-446655440001",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should accept uppercase UUID", () => {
      const input = {
        ...validInput,
        tripId: "550E8400-E29B-41D4-A716-446655440001",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should accept mixed case UUID", () => {
      const input = {
        ...validInput,
        tripId: "550E8400-e29b-41D4-A716-446655440001",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject UUID with extra hyphens", () => {
      const input = {
        ...validInput,
        tripId: "550e8400-e29b-41d4-a716-446655-440001",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with missing hyphens", () => {
      const input = {
        ...validInput,
        tripId: "550e8400e29b41d4a716446655440001",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject UUID with spaces", () => {
      const input = {
        ...validInput,
        tripId: "550e8400-e29b-41d4-a716-44665544000 ",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty UUID string", () => {
      const input = {
        ...validInput,
        tripId: "",
      };
      const result = validateAddCoinsInput(input);
      expect(result.success).toBe(false);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateAddCoinsInput: comprehensive validation including:
 *   - Required: tripId (UUID), groupId (UUID), amount (>= 1)
 *   - Optional: reason (string, can be empty)
 *   - UUID format validation (8-4-4-4-12 pattern, case insensitive)
 * - validateRemoveCoinsInput: same validation rules as add
 *   - Required: tripId (UUID), groupId (UUID), amount (>= 1)
 *   - Optional: reason (string, can be empty)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Edge case amounts (1, large numbers)
 * - Invalid UUID formats (wrong segments, invalid chars, missing hyphens)
 * - Amount validation (zero, negative, fractional)
 * - Type validation (non-string IDs, non-number amounts)
 * - Missing required fields
 * - Optional reason field (present, empty, missing)
 * - UUID case insensitivity (lowercase, uppercase, mixed)
 */
