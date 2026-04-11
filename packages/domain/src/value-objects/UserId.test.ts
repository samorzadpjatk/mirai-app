import { describe, it, expect } from "bun:test";
import { UserId } from "./UserId";

describe("[UNIT] UserId", () => {
  describe("UserId.create", () => {
    it("should create UserId from valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const userId = UserId.create(validUUID);
      expect(UserId.toString(userId)).toBe(validUUID);
    });

    it("should throw for invalid UUID", () => {
      expect(() => UserId.create("not-a-uuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => UserId.create("")).toThrow();
    });
  });

  describe("UserId.generate", () => {
    it("should generate a valid UserId", () => {
      const userId = UserId.generate();
      expect(typeof userId).toBe("string");
      expect(userId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = UserId.generate();
      const id2 = UserId.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("UserId.equals", () => {
    it("should return true for same ID", () => {
      const id = UserId.generate();
      expect(UserId.equals(id, id)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = UserId.generate();
      const id2 = UserId.generate();
      expect(UserId.equals(id1, id2)).toBe(false);
    });
  });

  describe("UserId.toString", () => {
    it("should convert to string", () => {
      const id = UserId.generate();
      expect(UserId.toString(id)).toBe(id);
    });
  });
});
