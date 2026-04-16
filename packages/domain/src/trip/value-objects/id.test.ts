import { describe, it, expect } from "bun:test";
import { Id } from "./id";

describe("[UNIT] TripId", () => {
  describe("[UNIT] TripId.create", () => {
    it("should create TripId from valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const tripId = Id.create(validUUID);
      expect(Id.toString(tripId)).toBe(validUUID);
    });

    it("should throw for invalid UUID", () => {
      expect(() => Id.create("not-a-uuid")).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => Id.create("")).toThrow();
    });
  });

  describe("[UNIT] TripId.unsafeCreate", () => {
    it("should create TripId without validation", () => {
      const tripId = Id.unsafeCreate("any-string");
      expect(Id.toString(tripId)).toBe("any-string");
    });
  });

  describe("[UNIT] TripId.generate", () => {
    it("should generate a valid TripId", () => {
      const tripId = Id.generate();
      expect(typeof tripId).toBe("string");
      expect(tripId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = Id.generate();
      const id2 = Id.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] TripId.equals", () => {
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

  describe("[UNIT] TripId.toString", () => {
    it("should convert to string", () => {
      const id = Id.generate();
      expect(Id.toString(id)).toBe(id);
    });
  });
});
