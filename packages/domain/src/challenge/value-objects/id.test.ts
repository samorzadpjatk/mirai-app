import { describe, it, expect } from "bun:test";
import { Id } from "./id";

describe("[UNIT] ChallengeId", () => {
  describe("[UNIT] Id.create", () => {
    it("should create ChallengeId from valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const challengeId = Id.create(validUUID);
      expect(Id.toString(challengeId)).toBe(validUUID);
    });

    it("should throw for invalid UUID", () => {
      expect(() => Id.create("not-a-uuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => Id.create("")).toThrow();
    });
  });

  describe("[UNIT] Id.unsafeCreate", () => {
    it("should create ChallengeId without validation", () => {
      const id = Id.unsafeCreate("any-string");
      expect(Id.toString(id)).toBe("any-string");
    });
  });

  describe("[UNIT] Id.generate", () => {
    it("should generate a valid ChallengeId", () => {
      const challengeId = Id.generate();
      expect(typeof challengeId).toBe("string");
      expect(challengeId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = Id.generate();
      const id2 = Id.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] Id.equals", () => {
    it("should return true for same ID", () => {
      const id = Id.generate();
      expect(Id.equals(id, id)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = Id.generate();
      const id2 = Id.generate();
      expect(Id.equals(id1, id2)).toBe(false);
    });
  });

  describe("[UNIT] Id.toString", () => {
    it("should convert to string", () => {
      const id = Id.generate();
      expect(Id.toString(id)).toBe(id);
    });
  });
});
