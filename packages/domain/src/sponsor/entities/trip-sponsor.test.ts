import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { TripSponsor } from "./trip-sponsor";
import { ValidationError } from "../../system/errors";

describe("[UNIT] TripSponsor", () => {
  describe("create", () => {
    it("creates trip sponsor with valid data", async () => {
      const effect = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "sponsor-456",
      });

      const tripSponsor = await Effect.runPromise(effect);
      expect(tripSponsor.tripId).toBe("trip-123");
      expect(tripSponsor.sponsorId).toBe("sponsor-456");
      expect(tripSponsor.id).toBeDefined();
      expect(tripSponsor.createdAt).toBeInstanceOf(Date);
    });

    it("creates trip sponsor with provided id and createdAt", async () => {
      const effect = TripSponsor.create({
        id: "ts-789",
        tripId: "trip-123",
        sponsorId: "sponsor-456",
        createdAt: new Date("2024-01-15"),
      });

      const tripSponsor = await Effect.runPromise(effect);
      expect(tripSponsor.id).toBe("ts-789");
      expect(tripSponsor.tripId).toBe("trip-123");
      expect(tripSponsor.sponsorId).toBe("sponsor-456");
      expect(tripSponsor.createdAt).toEqual(new Date("2024-01-15"));
    });

    it("trims whitespace from tripId and sponsorId", async () => {
      const effect = TripSponsor.create({
        tripId: "  trip-123  ",
        sponsorId: "  sponsor-456  ",
      });

      const tripSponsor = await Effect.runPromise(effect);
      expect(tripSponsor.tripId).toBe("trip-123");
      expect(tripSponsor.sponsorId).toBe("sponsor-456");
    });

    it("fails for empty tripId", async () => {
      const effect = TripSponsor.create({
        tripId: "",
        sponsorId: "sponsor-456",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
        expect(result.left.message).toBe("tripId is required");
      }
    });

    it("fails for whitespace-only tripId", async () => {
      const effect = TripSponsor.create({
        tripId: "   ",
        sponsorId: "sponsor-456",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails for undefined tripId", async () => {
      const effect = TripSponsor.create({
        tripId: undefined as unknown as string,
        sponsorId: "sponsor-456",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails for empty sponsorId", async () => {
      const effect = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("sponsorId");
        expect(result.left.message).toBe("sponsorId is required");
      }
    });

    it("fails for whitespace-only sponsorId", async () => {
      const effect = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("sponsorId");
      }
    });

    it("fails for undefined sponsorId", async () => {
      const effect = TripSponsor.create({
        tripId: "trip-123",
        sponsorId: undefined as unknown as string,
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("sponsorId");
      }
    });

    it("fails when tripId equals sponsorId", async () => {
      const effect = TripSponsor.create({
        tripId: "same-id",
        sponsorId: "same-id",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
        expect(result.left.message).toBe(
          "tripId and sponsorId must be different",
        );
      }
    });

    it("fails when tripId equals sponsorId after trimming", async () => {
      const effect = TripSponsor.create({
        tripId: "  same-id  ",
        sponsorId: "same-id",
      });

      const result = await Effect.runPromise(Effect.either(effect));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
      }
    });
  });

  describe("getCompositeId", () => {
    it("returns composite identifier", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.getCompositeId()).toBe("trip-123:sponsor-456");
    });
  });

  describe("matches", () => {
    it("returns true when both tripId and sponsorId match", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.matches("trip-123", "sponsor-456")).toBe(true);
    });

    it("returns false when tripId does not match", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.matches("trip-999", "sponsor-456")).toBe(false);
    });

    it("returns false when sponsorId does not match", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.matches("trip-123", "sponsor-999")).toBe(false);
    });

    it("returns false when neither matches", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.matches("trip-999", "sponsor-999")).toBe(false);
    });
  });

  describe("isForTrip", () => {
    it("returns true when tripId matches", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.isForTrip("trip-123")).toBe(true);
    });

    it("returns false when tripId does not match", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.isForTrip("trip-999")).toBe(false);
    });
  });

  describe("isForSponsor", () => {
    it("returns true when sponsorId matches", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.isForSponsor("sponsor-456")).toBe(true);
    });

    it("returns false when sponsorId does not match", async () => {
      const tripSponsor = await Effect.runPromise(
        TripSponsor.create({
          tripId: "trip-123",
          sponsorId: "sponsor-456",
        }),
      );

      expect(tripSponsor.isForSponsor("sponsor-999")).toBe(false);
    });
  });
});
