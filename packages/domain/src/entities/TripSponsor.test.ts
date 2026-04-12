import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { TripSponsor } from "./TripSponsor";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] TripSponsor Entity", () => {
  describe("TripSponsor.create", () => {
    it("should create trip sponsor with valid data", () => {
      const sponsor = Effect.runSync(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(sponsor.id).toBeDefined();
      expect(sponsor.tripId).toBe("trip-123");
      expect(sponsor.sponsorId).toBe("sponsor-456");
      expect(sponsor.createdAt).toBeInstanceOf(Date);
    });

    it("should reject empty tripId", () => {
      const effect = TripSponsor.create({
        tripId: "",
        sponsorId: "sponsor-456",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("tripId");
      }
    });

    it("should reject empty sponsorId", () => {
      const effect = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("sponsorId");
      }
    });

    it("should reject same tripId and sponsorId", () => {
      const effect = TripSponsor.create({
        tripId: "same-id",
        sponsorId: "same-id",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.message).toContain("different");
      }
    });
  });

  describe("TripSponsor.getCompositeId", () => {
    it("should return composite identifier", () => {
      const sponsor = Effect.runSync(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(sponsor.getCompositeId()).toBe("trip-123:sponsor-456");
    });
  });

  describe("TripSponsor.matches", () => {
    it("should match correct trip and sponsor", () => {
      const sponsor = Effect.runSync(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(sponsor.matches("trip-123", "sponsor-456")).toBe(true);
      expect(sponsor.matches("trip-123", "other")).toBe(false);
      expect(sponsor.matches("other", "sponsor-456")).toBe(false);
    });
  });

  describe("TripSponsor.isForTrip", () => {
    it("should check if for specific trip", () => {
      const sponsor = Effect.runSync(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(sponsor.isForTrip("trip-123")).toBe(true);
      expect(sponsor.isForTrip("other-trip")).toBe(false);
    });
  });

  describe("TripSponsor.isForSponsor", () => {
    it("should check if for specific sponsor", () => {
      const sponsor = Effect.runSync(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(sponsor.isForSponsor("sponsor-456")).toBe(true);
      expect(sponsor.isForSponsor("other-sponsor")).toBe(false);
    });
  });
});
