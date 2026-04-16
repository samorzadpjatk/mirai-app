import { describe, it, expect } from "bun:test";
import { SponsorId } from "./sponsor-id";

describe("[UNIT] TripSponsorId", () => {
  describe("[UNIT] TripSponsorId.create", () => {
    it("should create TripSponsorId from non-empty string", () => {
      const validId = "some-trip-sponsor-id";
      const tripSponsorId = SponsorId.create(validId);
      expect(SponsorId.toString(tripSponsorId)).toBe(validId);
    });

    it("should create TripSponsorId from UUID string", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      const tripSponsorId = SponsorId.create(validUUID);
      expect(SponsorId.toString(tripSponsorId)).toBe(validUUID);
    });

    it("should throw for empty string", () => {
      expect(() => SponsorId.create("")).toThrow(
        "Invalid TripSponsorId: empty or undefined",
      );
    });

    it("should throw for whitespace-only string", () => {
      expect(() => SponsorId.create("   ")).toThrow(
        "Invalid TripSponsorId: empty or undefined",
      );
    });
  });

  describe("[UNIT] TripSponsorId.unsafeCreate", () => {
    it("should create TripSponsorId without validation", () => {
      const tripSponsorId = SponsorId.unsafeCreate("any-string");
      expect(SponsorId.toString(tripSponsorId)).toBe("any-string");
    });

    it("should create TripSponsorId with empty string via unsafeCreate", () => {
      const tripSponsorId = SponsorId.unsafeCreate("");
      expect(SponsorId.toString(tripSponsorId)).toBe("");
    });
  });

  describe("[UNIT] TripSponsorId.generate", () => {
    it("should generate a valid TripSponsorId", () => {
      const tripSponsorId = SponsorId.generate();
      expect(typeof tripSponsorId).toBe("string");
      expect(tripSponsorId.length).toBe(36); // UUID v4 length
    });

    it("should generate unique IDs", () => {
      const id1 = SponsorId.generate();
      const id2 = SponsorId.generate();
      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] TripSponsorId.equals", () => {
    it("should return true for same ID", () => {
      const id = SponsorId.generate();
      expect(SponsorId.equals(id, id)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = SponsorId.generate();
      const id2 = SponsorId.generate();
      expect(SponsorId.equals(id1, id2)).toBe(false);
    });

    it("should return true for equal values created via create", () => {
      const id1 = SponsorId.create("same-id");
      const id2 = SponsorId.create("same-id");
      expect(SponsorId.equals(id1, id2)).toBe(true);
    });
  });

  describe("[UNIT] TripSponsorId.toString", () => {
    it("should convert to string", () => {
      const id = SponsorId.generate();
      expect(SponsorId.toString(id)).toBe(id);
    });

    it("should convert created ID to string", () => {
      const id = SponsorId.create("my-custom-id");
      expect(SponsorId.toString(id)).toBe("my-custom-id");
    });
  });
});
