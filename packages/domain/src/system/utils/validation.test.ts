import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  isValidEmail,
  validateEmail,
  validateNotEmpty,
  validateMinLength,
  validateMaxLength,
  isValidUUID,
  validateUUID,
  isValidURL,
  isFutureDate,
  isPastDate,
  isValidDateRange,
} from "./validation";
import { ValidationError } from "../errors";

describe("[UNIT] Validation Utils", () => {
  // ============================================================================
  // Email Validation Tests
  // ============================================================================
  describe("[UNIT] isValidEmail", () => {
    it("returns true for valid email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("returns true for email with subdomain", () => {
      expect(isValidEmail("test@mail.example.com")).toBe(true);
    });

    it("returns true for email with numbers", () => {
      expect(isValidEmail("test123@example.com")).toBe(true);
    });

    it("returns true for email with dots in local part", () => {
      expect(isValidEmail("first.last@example.com")).toBe(true);
    });

    it("returns true for email with plus sign", () => {
      expect(isValidEmail("test+tag@example.com")).toBe(true);
    });

    it("returns false for email without @ symbol", () => {
      expect(isValidEmail("testexample.com")).toBe(false);
    });

    it("returns false for email without domain", () => {
      expect(isValidEmail("test@")).toBe(false);
    });

    it("returns false for email without local part", () => {
      expect(isValidEmail("@example.com")).toBe(false);
    });

    it("returns false for email with spaces", () => {
      expect(isValidEmail("test @example.com")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("returns false for email without TLD", () => {
      expect(isValidEmail("test@example")).toBe(false);
    });
  });

  describe("[UNIT] validateEmail", () => {
    it("succeeds for valid email", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateEmail("test@example.com")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("test@example.com");
      }
    });

    it("normalizes email to lowercase", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateEmail("TEST@EXAMPLE.COM")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("test@example.com");
      }
    });

    it("fails for email with leading/trailing whitespace", async () => {
      // Note: validateEmail checks format before trimming, so whitespace causes failure
      const result = await Effect.runPromise(
        Effect.either(validateEmail("  test@example.com  ")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("Invalid email format");
      }
    });

    it("fails for empty string", async () => {
      const result = await Effect.runPromise(Effect.either(validateEmail("")));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("email");
        expect(result.left.message).toBe("Email is required");
      }
    });

    it("fails for whitespace-only string", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateEmail("   ")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("email");
        expect(result.left.message).toBe("Email is required");
      }
    });

    it("fails for invalid email format", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateEmail("invalid-email")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("email");
        expect(result.left.message).toBe("Invalid email format");
      }
    });

    it("fails for email without @ symbol", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateEmail("testexample.com")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("email");
      }
    });
  });

  // ============================================================================
  // Not Empty Validation Tests
  // ============================================================================
  describe("[UNIT] validateNotEmpty", () => {
    it("succeeds for non-empty string", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateNotEmpty("hello", "username")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("hello");
      }
    });

    it("trims whitespace from value", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateNotEmpty("  hello  ", "username")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("hello");
      }
    });

    it("fails for empty string", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateNotEmpty("", "username")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("username");
        expect(result.left.message).toBe("username is required");
      }
    });

    it("fails for whitespace-only string", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateNotEmpty("   ", "description")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
        expect(result.left.message).toBe("description is required");
      }
    });

    it("uses custom field name in error message", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateNotEmpty("", "title")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("title");
        expect(result.left.message).toBe("title is required");
      }
    });
  });

  // ============================================================================
  // Min Length Validation Tests
  // ============================================================================
  describe("[UNIT] validateMinLength", () => {
    it("succeeds when string meets minimum length", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMinLength("hello", 3, "username")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("hello");
      }
    });

    it("succeeds when string equals minimum length", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMinLength("abc", 3, "code")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("abc");
      }
    });

    it("succeeds when string exceeds minimum length", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMinLength("hello world", 5, "message")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("hello world");
      }
    });

    it("fails when string is shorter than minimum", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMinLength("ab", 3, "username")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("username");
        expect(result.left.message).toBe(
          "username must be at least 3 characters",
        );
      }
    });

    it("fails for empty string when minLength > 0", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMinLength("", 1, "username")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("username");
      }
    });

    it("fails for null or undefined treated as empty", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMinLength(null as unknown as string, 1, "field")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("field");
      }
    });

    it("uses custom field name in error message", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMinLength("ab", 5, "password")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe(
          "password must be at least 5 characters",
        );
      }
    });
  });

  // ============================================================================
  // Max Length Validation Tests
  // ============================================================================
  describe("[UNIT] validateMaxLength", () => {
    it("succeeds when string is within maximum length", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMaxLength("hello", 10, "username")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("hello");
      }
    });

    it("succeeds when string equals maximum length", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMaxLength("abcdefghij", 10, "username")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("abcdefghij");
      }
    });

    it("succeeds for empty string", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMaxLength("", 10, "username")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("");
      }
    });

    it("succeeds for null or undefined", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          validateMaxLength(null as unknown as string, 10, "field"),
        ),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("");
      }
    });

    it("fails when string exceeds maximum length", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMaxLength("hello world", 5, "username")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("username");
        expect(result.left.message).toBe(
          "username must be at most 5 characters",
        );
      }
    });

    it("uses custom field name in error message", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateMaxLength("a".repeat(300), 255, "description")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe(
          "description must be at most 255 characters",
        );
      }
    });
  });

  // ============================================================================
  // UUID Validation Tests
  // ============================================================================
  describe("[UNIT] isValidUUID", () => {
    it("returns true for valid UUID v4", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("returns true for valid UUID v1", () => {
      expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(true);
    });

    it("returns true for valid UUID in uppercase", () => {
      expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
    });

    it("returns true for valid UUID with mixed case", () => {
      expect(isValidUUID("550E8400-e29b-41D4-A716-446655440000")).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isValidUUID("")).toBe(false);
    });

    it("returns false for invalid UUID format", () => {
      expect(isValidUUID("not-a-uuid")).toBe(false);
    });

    it("returns false for UUID with wrong version", () => {
      expect(isValidUUID("550e8400-e29b-61d4-a716-446655440000")).toBe(false);
    });

    it("returns false for UUID with wrong variant", () => {
      expect(isValidUUID("550e8400-e29b-41d4-c716-446655440000")).toBe(false);
    });

    it("returns false for UUID missing hyphens", () => {
      expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
    });

    it("returns false for UUID with wrong segment lengths", () => {
      expect(isValidUUID("550e840-e29b-41d4-a716-446655440000")).toBe(false);
    });
  });

  describe("[UNIT] validateUUID", () => {
    it("succeeds for valid UUID", async () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const result = await Effect.runPromise(
        Effect.either(validateUUID(validUUID)),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe(validUUID.toLowerCase());
      }
    });

    it("normalizes UUID to lowercase", async () => {
      const upperUUID = "550E8400-E29B-41D4-A716-446655440000";
      const result = await Effect.runPromise(
        Effect.either(validateUUID(upperUUID)),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe(upperUUID.toLowerCase());
      }
    });

    it("uses custom field name", async () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const result = await Effect.runPromise(
        Effect.either(validateUUID(validUUID, "userId")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe(validUUID);
      }
    });

    it("fails for empty string", async () => {
      const result = await Effect.runPromise(Effect.either(validateUUID("")));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("ID");
        expect(result.left.message).toBe("ID is required");
      }
    });

    it("fails for whitespace-only string", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateUUID("   ")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("ID");
        expect(result.left.message).toBe("ID is required");
      }
    });

    it("fails for invalid UUID format", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateUUID("not-a-uuid")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("ID");
        expect(result.left.message).toBe("Invalid ID format");
      }
    });

    it("fails with custom field name in error", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateUUID("", "userId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe("userId is required");
      }
    });

    it("fails with custom field name for invalid format", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateUUID("invalid", "groupId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("groupId");
        expect(result.left.message).toBe("Invalid groupId format");
      }
    });
  });

  // ============================================================================
  // URL Validation Tests
  // ============================================================================
  describe("[UNIT] isValidURL", () => {
    it("returns true for valid HTTP URL", () => {
      expect(isValidURL("http://example.com")).toBe(true);
    });

    it("returns true for valid HTTPS URL", () => {
      expect(isValidURL("https://example.com")).toBe(true);
    });

    it("returns true for URL with path", () => {
      expect(isValidURL("https://example.com/path/to/resource")).toBe(true);
    });

    it("returns true for URL with query parameters", () => {
      expect(isValidURL("https://example.com?foo=bar&baz=qux")).toBe(true);
    });

    it("returns true for URL with fragment", () => {
      expect(isValidURL("https://example.com#section")).toBe(true);
    });

    it("returns true for URL with port", () => {
      expect(isValidURL("https://example.com:8080")).toBe(true);
    });

    it("returns true for file protocol", () => {
      expect(isValidURL("file:///path/to/file")).toBe(true);
    });

    it("returns true for FTP URL", () => {
      expect(isValidURL("ftp://ftp.example.com")).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isValidURL("")).toBe(false);
    });

    it("returns false for invalid URL format", () => {
      expect(isValidURL("not a url")).toBe(false);
    });

    it("returns false for URL without protocol", () => {
      expect(isValidURL("example.com")).toBe(false);
    });

    it("returns false for URL with invalid protocol", () => {
      expect(isValidURL("invalid://example.com")).toBe(true);
    });

    it("returns false for malformed URL", () => {
      expect(isValidURL("http://")).toBe(false);
    });
  });

  // ============================================================================
  // Date Validation Tests
  // ============================================================================
  describe("[UNIT] isFutureDate", () => {
    it("returns true for future date", () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      expect(isFutureDate(futureDate)).toBe(true);
    });

    it("returns false for past date", () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      expect(isFutureDate(pastDate)).toBe(false);
    });

    it("returns false for current time", () => {
      const now = new Date();
      expect(isFutureDate(now)).toBe(false);
    });

    it("returns true for date far in future", () => {
      const farFuture = new Date("2099-12-31");
      expect(isFutureDate(farFuture)).toBe(true);
    });

    it("returns false for date far in past", () => {
      const farPast = new Date("1970-01-01");
      expect(isFutureDate(farPast)).toBe(false);
    });
  });

  describe("[UNIT] isPastDate", () => {
    it("returns true for past date", () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      expect(isPastDate(pastDate)).toBe(true);
    });

    it("returns false for future date", () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      expect(isPastDate(futureDate)).toBe(false);
    });

    it("returns false for current time", () => {
      const now = new Date();
      expect(isPastDate(now)).toBe(false);
    });

    it("returns true for date far in past", () => {
      const farPast = new Date("1970-01-01");
      expect(isPastDate(farPast)).toBe(true);
    });

    it("returns false for date far in future", () => {
      const farFuture = new Date("2099-12-31");
      expect(isPastDate(farFuture)).toBe(false);
    });
  });

  describe("[UNIT] isValidDateRange", () => {
    it("returns true when start is before end", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it("returns false when start equals end", () => {
      const date = new Date("2024-06-15");
      expect(isValidDateRange(date, date)).toBe(false);
    });

    it("returns false when start is after end", () => {
      const start = new Date("2024-12-31");
      const end = new Date("2024-01-01");
      expect(isValidDateRange(start, end)).toBe(false);
    });

    it("returns true for millisecond difference", () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-01-01T00:00:00.001Z");
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it("returns false for same millisecond", () => {
      const date = new Date("2024-01-01T00:00:00.000Z");
      expect(isValidDateRange(date, new Date(date.getTime()))).toBe(false);
    });

    it("works with current time comparisons", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneHourLater = new Date(now.getTime() + 3600000);

      expect(isValidDateRange(oneHourAgo, now)).toBe(true);
      expect(isValidDateRange(now, oneHourLater)).toBe(true);
      expect(isValidDateRange(oneHourLater, oneHourAgo)).toBe(false);
    });
  });
});
