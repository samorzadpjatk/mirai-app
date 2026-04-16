import { describe, it, expect } from "bun:test";
import { Id } from "./id";

describe("[UNIT] SponsorId", () => {
  describe("[UNIT] SponsorId.create", () => {
    it("should create SponsorId from valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const sponsorId = Id.create(validUUID);
      expect(Id.toString(sponsorId)).toBe(validUUID);
    });

    it("should throw for invalid UUID", () => {
      expect(() => Id.create("not-a-uuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => Id.create("")).toThrow();
    });
  });

  describe("[UNIT] SponsorId.unsafeCreate", () => {
    it("should create SponsorId without validation", () => {
      const sponsorId = Id.unsafeCreate("any-string");
      expect(Id.toString(sponsorId)).toBe("any-string");
    });
  });

  describe("[UNIT] SponsorId.generate", () => {
    it("should generate a valid SponsorId", () => {
      const sponsorId = Id.generate();
      expect(typeof sponsorId).toBe("string");
      expect(sponsorId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = Id.generate();
      const id2 = Id.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] SponsorId.equals", () => {
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

  describe("[UNIT] SponsorId.toString", () => {
    it("should convert to string", () => {
      const id = Id.generate();
      expect(Id.toString(id)).toBe(id);
    });
  });
});
