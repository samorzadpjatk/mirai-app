import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { TripResource } from "./TripResource";
import { ValidationError } from "../errors";

describe("[UNIT] TripResource Entity", () => {
  describe("[UNIT] TripResource.create", () => {
    it("should create trip resource with valid data", () => {
      const effect = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel Booking",
        url: "https://hotel.com/booking",
      });

      const entity = Effect.runSync(effect);
      expect(entity.id).toBeDefined();
      expect(entity.tripId).toBe("trip-123");
      expect(entity.type).toBe("link");
      expect(entity.label).toBe("Hotel Booking");
      expect(entity.url).toBe("https://hotel.com/booking");
      expect(entity.sortOrder).toBe(0);
      expect(entity.createdAt).toBeInstanceOf(Date);
    });

    it("should create trip resource with storage path", () => {
      const effect = TripResource.create({
        tripId: "trip-123",
        type: "document",
        label: "Trip Guide PDF",
        storagePath: "/documents/guide.pdf",
        fileName: "guide.pdf",
      });

      const entity = Effect.runSync(effect);
      expect(entity.storagePath).toBe("/documents/guide.pdf");
      expect(entity.fileName).toBe("guide.pdf");
      expect(entity.hasFile()).toBe(true);
    });

    it("should reject empty tripId", () => {
      const effect = TripResource.create({
        tripId: "",
        type: "link",
        label: "Hotel",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty type", () => {
      const effect = TripResource.create({
        tripId: "trip-123",
        type: "",
        label: "Hotel",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty label", () => {
      const effect = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject negative sortOrder", () => {
      const effect = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "Hotel",
        sortOrder: -1,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject label exceeding max length", () => {
      const effect = TripResource.create({
        tripId: "trip-123",
        type: "link",
        label: "a".repeat(101),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("[UNIT] TripResource.updateDetails", () => {
    it("should update label", () => {
      const resource = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "link",
          label: "Hotel",
        }),
      );

      const updated = Effect.runSync(
        resource.updateDetails({ label: "Updated Hotel" }),
      );

      expect(updated.label).toBe("Updated Hotel");
      expect(updated.id).toBe(resource.id);
    });

    it("should reject empty label update", () => {
      const resource = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "link",
          label: "Hotel",
        }),
      );

      const effect = resource.updateDetails({ label: "" });
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("[UNIT] TripResource.updateSortOrder", () => {
    it("should update sort order", () => {
      const resource = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "link",
          label: "Hotel",
          sortOrder: 0,
        }),
      );

      const updated = Effect.runSync(resource.updateSortOrder(5));
      expect(updated.sortOrder).toBe(5);
    });

    it("should reject negative sort order", () => {
      const resource = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "link",
          label: "Hotel",
        }),
      );

      const effect = resource.updateSortOrder(-1);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("[UNIT] TripResource type checking", () => {
    it("should identify link type", () => {
      const entity = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "link",
          label: "Hotel",
          url: "https://hotel.com",
        }),
      );

      expect(entity.isLink()).toBe(true);
      expect(entity.isDocument()).toBe(false);
      expect(entity.hasUrl()).toBe(true);
    });

    it("should identify document type", () => {
      const entity = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "document",
          label: "Guide",
          storagePath: "/docs/guide.pdf",
        }),
      );

      expect(entity.isDocument()).toBe(true);
      expect(entity.isLink()).toBe(false);
      expect(entity.hasFile()).toBe(true);
    });

    it("should identify contact type", () => {
      const entity = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "contact",
          label: "Emergency Contact",
        }),
      );

      expect(entity.isContact()).toBe(true);
      expect(entity.isLink()).toBe(false);
    });

    it("should return access URL", () => {
      const entity = Effect.runSync(
        TripResource.create({
          tripId: "trip-123",
          type: "link",
          label: "Hotel",
          url: "https://hotel.com",
          publicUrl: "https://public.hotel.com",
        }),
      );

      expect(entity.getAccessUrl()).toBe("https://public.hotel.com");
    });
  });
});
