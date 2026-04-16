import { describe, it, expect } from "bun:test";
import {
  createBrandedId,
  isValidUUID,
  isValidCUID,
  type BrandedId,
} from "./branded-id";

describe("[UNIT] branded-id", () => {
  describe("isValidUUID", () => {
    it("returns true for valid UUID v4", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it("returns true for valid UUID v1", () => {
      const validUUIDv1 = "550e8400-e29b-11d4-a716-446655440000";
      expect(isValidUUID(validUUIDv1)).toBe(true);
    });

    it("returns true for valid UUID v5", () => {
      const validUUIDv5 = "550e8400-e29b-51d4-a716-446655440000";
      expect(isValidUUID(validUUIDv5)).toBe(true);
    });

    it("returns true for uppercase UUID (case-insensitive)", () => {
      const uppercaseUUID = "550E8400-E29B-41D4-A716-446655440000";
      expect(isValidUUID(uppercaseUUID)).toBe(true);
    });

    it("returns false for invalid UUID format", () => {
      const invalidUUID = "not-a-uuid";
      expect(isValidUUID(invalidUUID)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidUUID("")).toBe(false);
    });

    it("returns false for UUID with wrong segment count", () => {
      const wrongSegments = "550e8400-e29b-41d4-a716";
      expect(isValidUUID(wrongSegments)).toBe(false);
    });

    it("returns false for UUID with non-hex characters", () => {
      const nonHexUUID = "550e8400-e29b-41d4-a716-4466554400zz";
      expect(isValidUUID(nonHexUUID)).toBe(false);
    });

    it("returns false for UUID with wrong variant", () => {
      const wrongVariant = "550e8400-e29b-41d4-c716-446655440000";
      expect(isValidUUID(wrongVariant)).toBe(false);
    });

    it("returns false for nullish values", () => {
      expect(isValidUUID("null")).toBe(false);
      expect(isValidUUID("undefined")).toBe(false);
    });
  });

  describe("isValidCUID", () => {
    it("returns true for valid CUID (c + 24 lowercase alphanumeric)", () => {
      const validCUID = "ckd0l7qwe000001mrf7v4f8ab";
      expect(isValidCUID(validCUID)).toBe(true);
    });

    it("returns true for CUID with all lowercase letters", () => {
      const validCUID = "cabcdefghijklmnopqrstuvwx"; // 24 lowercase letters after 'c'
      expect(isValidCUID(validCUID)).toBe(true);
    });

    it("returns true for CUID with all numbers", () => {
      const validCUID = "c123456789012345678901234";
      expect(isValidCUID(validCUID)).toBe(true);
    });

    it("returns true for UUID fallback (backward compatibility)", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      expect(isValidCUID(validUUID)).toBe(true);
    });

    it("returns false for CUID missing 'c' prefix", () => {
      const noPrefix = "kd0l7qwe000001mrf7v4f8abc";
      expect(isValidCUID(noPrefix)).toBe(false);
    });

    it("returns false for CUID with wrong length (too short)", () => {
      const tooShort = "ckd0l7qwe000001mrf7v4f8a"; // 23 chars after 'c'
      expect(isValidCUID(tooShort)).toBe(false);
    });

    it("returns false for CUID with wrong length (too long)", () => {
      const tooLong = "ckd0l7qwe000001mrf7v4f8abcd";
      expect(isValidCUID(tooLong)).toBe(false);
    });

    it("returns false for CUID with uppercase letters", () => {
      const uppercase = "cKD0L7QWE000001MRF7V4F8ABC";
      expect(isValidCUID(uppercase)).toBe(false);
    });

    it("returns false for CUID with special characters", () => {
      const specialChars = "c-kd0l7qwe000001mrf7v4f8a_";
      expect(isValidCUID(specialChars)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidCUID("")).toBe(false);
    });

    it("returns false for just 'c' prefix", () => {
      expect(isValidCUID("c")).toBe(false);
    });
  });

  describe("createBrandedId factory - create", () => {
    it("validates and returns branded ID for valid input", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";

      const result = TestId.create(validUUID);

      expect(result as string).toBe(validUUID);
      expect(typeof result).toBe("string");
    });

    it("throws for invalid ID", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const invalidId = "not-a-valid-id";

      expect(() => TestId.create(invalidId)).toThrow();
    });

    it("throws for empty string", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });

      expect(() => TestId.create("")).toThrow();
    });

    it("uses default error message format", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const invalidId = "invalid-id";

      expect(() => TestId.create(invalidId)).toThrow(
        "Invalid TestId format: invalid-id",
      );
    });

    it("uses custom string error message", () => {
      const TestId = createBrandedId("TestId", {
        validate: isValidUUID,
        errorMessage: "Custom error: ID is not valid",
      });
      const invalidId = "invalid-id";

      expect(() => TestId.create(invalidId)).toThrow(
        "Custom error: ID is not valid",
      );
    });

    it("uses custom function error message", () => {
      const TestId = createBrandedId("TestId", {
        validate: isValidUUID,
        errorMessage: (id) => `Custom function error for: ${id}`,
      });
      const invalidId = "bad-id";

      expect(() => TestId.create(invalidId)).toThrow(
        "Custom function error for: bad-id",
      );
    });
  });

  describe("createBrandedId factory - unsafeCreate", () => {
    it("bypasses validation and returns branded ID", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const anyId = "totally-invalid-id-format";

      const result = TestId.unsafeCreate(anyId);

      expect(result as string).toBe(anyId);
    });

    it("works with empty string", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });

      const result = TestId.unsafeCreate("");

      expect(result as string).toBe("");
    });

    it("works with special characters", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const specialId = "<script>alert('xss')</script>";

      const result = TestId.unsafeCreate(specialId);

      expect(result as string).toBe(specialId);
    });
  });

  describe("createBrandedId factory - generate", () => {
    it("creates valid UUID when useCryptoUUID is true", () => {
      const TestId = createBrandedId("TestId", {
        validate: isValidUUID,
        useCryptoUUID: true,
      });

      const result = TestId.generate();

      expect(isValidUUID(result)).toBe(true);
    });

    it("creates valid UUID by default (useCryptoUUID defaults to true)", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });

      const result = TestId.generate();

      expect(isValidUUID(result)).toBe(true);
    });

    it("creates unique IDs on multiple calls", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });

      const id1 = TestId.generate();
      const id2 = TestId.generate();
      const id3 = TestId.generate();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("throws when useCryptoUUID is false", () => {
      const TestId = createBrandedId("TestId", {
        validate: isValidUUID,
        useCryptoUUID: false,
      });

      expect(() => TestId.generate()).toThrow(
        "generate() not configured for this ID type",
      );
    });
  });

  describe("createBrandedId factory - equals", () => {
    it("returns true for identical IDs", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id1 = TestId.create("550e8400-e29b-41d4-a716-446655440000");
      const id2 = TestId.create(
        "550e8400-e29b-41d4-a716-446655440000",
      ) as ReturnType<typeof TestId.create>;

      expect(TestId.equals(id1, id2)).toBe(true);
    });

    it("returns false for different IDs", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id1 = TestId.generate();
      const id2 = TestId.generate() as ReturnType<typeof TestId.generate>;

      expect(TestId.equals(id1, id2)).toBe(false);
    });

    it("returns true for same reference", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id = TestId.generate();

      expect(TestId.equals(id, id as ReturnType<typeof TestId.generate>)).toBe(
        true,
      );
    });

    it("returns true for IDs created via unsafeCreate with same value", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id1 = TestId.unsafeCreate("same-id");
      const id2 = TestId.unsafeCreate("same-id") as ReturnType<
        typeof TestId.unsafeCreate
      >;

      expect(TestId.equals(id1, id2)).toBe(true);
    });
  });

  describe("createBrandedId factory - toString", () => {
    it("returns raw string value", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id = TestId.create("550e8400-e29b-41d4-a716-446655440000");

      const result = TestId.toString(id);

      expect(result).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(typeof result).toBe("string");
    });

    it("works with generated IDs", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id = TestId.generate();

      const result = TestId.toString(id);

      expect(typeof result).toBe("string");
      expect(result.length).toBe(36);
    });

    it("works with unsafeCreate IDs", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id = TestId.unsafeCreate("custom-id-value");

      const result = TestId.toString(id);

      expect(result).toBe("custom-id-value");
    });
  });

  describe("type safety", () => {
    it("creates distinct branded types", () => {
      const UserId = createBrandedId("UserId", { validate: isValidUUID });
      const PostId = createBrandedId("PostId", { validate: isValidUUID });

      const userId = UserId.generate();
      const postId = PostId.generate() as ReturnType<typeof PostId.generate>;

      expect(typeof userId).toBe("string");
      expect(typeof postId).toBe("string");
    });

    it("maintains brand through operations", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const id = TestId.generate();

      const str = TestId.toString(id);
      const recreated = TestId.unsafeCreate(str);

      expect(
        TestId.equals(id, recreated as ReturnType<typeof TestId.unsafeCreate>),
      ).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles UUIDs with different versions", () => {
      const validUUIDs = [
        "550e8400-e29b-11d4-a716-446655440000", // v1
        "550e8400-e29b-21d4-a716-446655440000", // v2
        "550e8400-e29b-31d4-a716-446655440000", // v3
        "550e8400-e29b-41d4-a716-446655440000", // v4
        "550e8400-e29b-51d4-a716-446655440000", // v5
      ];

      for (const uuid of validUUIDs) {
        expect(isValidUUID(uuid)).toBe(true);
      }
    });

    it("handles custom validators", () => {
      const SimpleId = createBrandedId("SimpleId", {
        validate: (id) => id?.trim() !== "",
      });

      expect(() => SimpleId.create("valid")).not.toThrow();
      expect(() => SimpleId.create("")).toThrow();
      expect(() => SimpleId.create("   ")).toThrow();
    });

    it("handles very long IDs with unsafeCreate", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const longId = "a".repeat(1000);

      const result = TestId.unsafeCreate(longId);

      expect(result as string).toBe(longId);
    });

    it("handles unicode in unsafeCreate", () => {
      const TestId = createBrandedId("TestId", { validate: isValidUUID });
      const unicodeId = "id-with-unicode-\u00e9-\u00f1-\u4e2d";

      const result = TestId.unsafeCreate(unicodeId);

      expect(result as string).toBe(unicodeId);
    });
  });
});
