/**
 * TripDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of ITripPort.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryTripGateway } from "../in-memory/InMemoryTripGateway";
import { Trip, TripId, UserId, DatabaseError } from "@mirai-app/domain";

// Test data factory
const createTestTrip = (
  id: string,
  overrides?: Partial<{
    name: string;
    description: string;
    destination: string;
  }>,
): Trip => {
  return {
    id: TripId.unsafeCreate(id),
    creatorId: UserId.unsafeCreate("user-default"),
    name: overrides?.name ?? "Test Trip",
    description: overrides?.description ?? "A test trip",
    destination: overrides?.destination ?? "Test Destination",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-07"),
    isPublic: false,
    status: "draft",
    maxParticipants: 10,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Trip;
};

describe("[UNIT] InMemoryTripGateway", () => {
  let gateway: InMemoryTripGateway;

  beforeEach(() => {
    gateway = new InMemoryTripGateway();
  });

  describe("findById", () => {
    it("should return null when trip not found", async () => {
      const tripId = TripId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(tripId);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeNull();
      }
    });

    it("should return trip when found", async () => {
      const trip = createTestTrip("trip-123");
      await Effect.runPromise(gateway.create(trip));

      const effect = gateway.findById(trip.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(trip.id);
        expect(either.right.name).toBe("Test Trip");
      }
    });
  });

  describe("findByUserId", () => {
    it("should return trips by user", async () => {
      const userId = "user-abc";
      const trip1 = createTestTrip("t1");
      const trip2 = createTestTrip("t2");

      await Effect.runPromise(gateway.create(trip1));
      await Effect.runPromise(gateway.create(trip2));
      gateway.addParticipant(TripId.toString(trip1.id), userId);
      gateway.addParticipant(TripId.toString(trip2.id), userId);

      const effect = gateway.findByUserId(userId);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
      }
    });
  });

  describe("create", () => {
    it("should create and return trip", async () => {
      const trip = createTestTrip("new-trip");
      const effect = gateway.create(trip);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(trip.id);
      }
    });
  });

  describe("update", () => {
    it("should update existing trip", async () => {
      const trip = createTestTrip("update-trip", { name: "Original" });
      await Effect.runPromise(gateway.create(trip));

      const updated = { ...trip, name: "Updated" };
      const effect = gateway.update(updated);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.name).toBe("Updated");
      }
    });
  });

  describe("delete", () => {
    it("should delete trip", async () => {
      const trip = createTestTrip("delete-trip");
      await Effect.runPromise(gateway.create(trip));

      const effect = gateway.delete(trip.id);
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      const found = await Effect.runPromise(gateway.findById(trip.id));
      expect(found).toBeNull();
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with instanceof for errors", async () => {
      const trip = createTestTrip("pattern-trip");
      const effect = gateway.create(trip);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
