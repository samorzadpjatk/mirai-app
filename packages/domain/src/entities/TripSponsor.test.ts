import { describe, it, expect } from "bun:test";
import { TripSponsor } from "./TripSponsor";

describe("[UNIT] TripSponsor Entity", () => {
  describe("TripSponsor.create", () => {
    it("should create trip sponsor with valid data", () => {
      const result = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.sponsorId).toBe("sponsor-456");
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should reject empty tripId", () => {
      const result = TripSponsor.create({
        tripId: "",
        sponsorId: "sponsor-456",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should reject empty sponsorId", () => {
      const result = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("sponsorId");
      }
    });

    it("should reject same tripId and sponsorId", () => {
      const result = TripSponsor.create({
        tripId: "same-id",
        sponsorId: "same-id",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("different");
      }
    });
  });

  describe("TripSponsor.getCompositeId", () => {
    it("should return composite identifier", () => {
      const result = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getCompositeId()).toBe("trip-123:sponsor-456");
      }
    });
  });

  describe("TripSponsor.matches", () => {
    it("should match correct trip and sponsor", () => {
      const result = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.matches("trip-123", "sponsor-456")).toBe(true);
        expect(result.value.matches("trip-123", "other")).toBe(false);
        expect(result.value.matches("other", "sponsor-456")).toBe(false);
      }
    });
  });

  describe("TripSponsor.isForTrip", () => {
    it("should check if for specific trip", () => {
      const result = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForTrip("trip-123")).toBe(true);
        expect(result.value.isForTrip("other-trip")).toBe(false);
      }
    });
  });

  describe("TripSponsor.isForSponsor", () => {
    it("should check if for specific sponsor", () => {
      const result = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForSponsor("sponsor-456")).toBe(true);
        expect(result.value.isForSponsor("other-sponsor")).toBe(false);
      }
    });
  });
});
