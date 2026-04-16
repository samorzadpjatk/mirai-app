/**
 * Unit tests for cursor encoding/decoding utilities
 */

import { describe, it, expect } from "bun:test";
import { encodeCursor, decodeCursor, type CursorData } from "./cursor";

describe("[UNIT] cursor utilities", () => {
  describe("encodeCursor", () => {
    it("encodes cursor data to base64url string", () => {
      const data: CursorData = {
        id: "abc123",
        createdAt: "2024-01-15T10:00:00Z",
      };

      const cursor = encodeCursor(data);

      // Should be a non-empty string
      expect(typeof cursor).toBe("string");
      expect(cursor.length).toBeGreaterThan(0);

      // Should be URL-safe (no +, /, or = characters)
      expect(cursor).not.toContain("+");
      expect(cursor).not.toContain("/");
      expect(cursor).not.toContain("=");
    });

    it("encodes cursor with additional fields", () => {
      const data: CursorData = {
        id: "def456",
        createdAt: "2024-06-20T14:30:00Z",
        isPinned: true,
        voteScore: 42,
      };

      const cursor = encodeCursor(data);
      const decoded = decodeCursor(cursor);

      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe("def456");
      expect(decoded?.createdAt).toBe("2024-06-20T14:30:00Z");
      expect(decoded?.isPinned).toBe(true);
      expect(decoded?.voteScore).toBe(42);
    });
  });

  describe("decodeCursor", () => {
    it("decodes valid cursor correctly", () => {
      const data: CursorData = {
        id: "ghi789",
        createdAt: "2024-12-25T00:00:00Z",
      };
      const cursor = encodeCursor(data);

      const decoded = decodeCursor(cursor);

      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe("ghi789");
      expect(decoded?.createdAt).toBe("2024-12-25T00:00:00Z");
    });

    it("returns null for invalid base64 string", () => {
      const result = decodeCursor("!!!invalid-base64!!!");

      expect(result).toBeNull();
    });

    it("returns null for malformed JSON", () => {
      // Valid base64url but invalid JSON
      const invalidJson = Buffer.from("{not valid json}").toString("base64url");

      const result = decodeCursor(invalidJson);

      expect(result).toBeNull();
    });

    it("returns null for missing id field", () => {
      // Valid JSON but missing required id field
      const dataWithoutId = { createdAt: "2024-01-15T10:00:00Z" };
      const cursor = Buffer.from(JSON.stringify(dataWithoutId)).toString(
        "base64url",
      );

      const result = decodeCursor(cursor);

      expect(result).toBeNull();
    });

    it("returns null for non-string id field", () => {
      // Valid JSON but id is a number instead of string
      const dataWithNumberId = { id: 123, createdAt: "2024-01-15T10:00:00Z" };
      const cursor = Buffer.from(JSON.stringify(dataWithNumberId)).toString(
        "base64url",
      );

      const result = decodeCursor(cursor);

      expect(result).toBeNull();
    });

    it("returns null for null data", () => {
      const cursor = Buffer.from("null").toString("base64url");

      const result = decodeCursor(cursor);

      expect(result).toBeNull();
    });

    it("returns null for array data", () => {
      const cursor = Buffer.from("[1, 2, 3]").toString("base64url");

      const result = decodeCursor(cursor);

      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = decodeCursor("");

      expect(result).toBeNull();
    });
  });

  describe("round-trip encoding/decoding", () => {
    it("preserves data through encode/decode cycle", () => {
      const original: CursorData = {
        id: "test-id-123",
        createdAt: "2024-03-15T12:30:45.123Z",
      };

      const cursor = encodeCursor(original);
      const decoded = decodeCursor(cursor);

      expect(decoded).toEqual(original);
    });

    it("preserves data with extended fields through round-trip", () => {
      const original: CursorData = {
        id: "complex-id",
        createdAt: "2024-07-04T09:00:00Z",
        isPinned: false,
        voteScore: -5,
        extraField: { nested: "value" },
      };

      const cursor = encodeCursor(original);
      const decoded = decodeCursor(cursor);

      expect(decoded).toEqual(original);
    });

    it("handles edge case timestamps", () => {
      const testCases: CursorData[] = [
        { id: "1", createdAt: "1970-01-01T00:00:00Z" },
        { id: "2", createdAt: "9999-12-31T23:59:59Z" },
        { id: "3", createdAt: "2024-02-29T00:00:00Z" }, // Leap year
      ];

      for (const original of testCases) {
        const cursor = encodeCursor(original);
        const decoded = decodeCursor(cursor);
        expect(decoded).toEqual(original);
      }
    });

    it("handles special characters in id", () => {
      const original: CursorData = {
        id: "id-with-special-chars-123_abc.xyz",
        createdAt: "2024-01-15T10:00:00Z",
      };

      const cursor = encodeCursor(original);
      const decoded = decodeCursor(cursor);

      expect(decoded).toEqual(original);
    });
  });

  describe("base64url encoding specifics", () => {
    it("produces URL-safe output without padding", () => {
      // Data that would normally produce +, /, or = in standard base64
      const data: CursorData = {
        id: "???", // This tends to produce special chars
        createdAt: "2024-01-15T10:00:00Z",
      };

      const cursor = encodeCursor(data);

      // Verify URL-safe characters only
      expect(cursor).toMatch(/^[A-Za-z0-9_-]*$/);
    });

    it("can decode standard base64 if needed", () => {
      // Ensure compatibility with standard base64 strings
      const data: CursorData = {
        id: "test",
        createdAt: "2024-01-15T10:00:00Z",
      };
      const standardBase64 = Buffer.from(JSON.stringify(data)).toString(
        "base64",
      );

      // base64url can decode standard base64
      const decoded = decodeCursor(standardBase64);

      expect(decoded).toEqual(data);
    });
  });
});
