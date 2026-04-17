/**
 * LocationDrizzleGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryLocationGateway } from "../in-memory/InMemoryLocationGateway";
import { Location, LocationId, TripId, DatabaseError } from "@mirai-app/domain";

const createTestLocation = (
  id: string,
  overrides?: Partial<Location>,
): Location => {
  return {
    id: LocationId.unsafeCreate(id),
    tripId: TripId.unsafeCreate("trip-default"),
    name: overrides?.name ?? "Test Location",
    latitude: overrides?.latitude ?? 51.5074,
    longitude: overrides?.longitude ?? -0.1278,
    description: overrides?.description ?? null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Location;
};

describe("[UNIT] InMemoryLocationGateway", () => {
  let gateway: InMemoryLocationGateway;

  beforeEach(() => {
    gateway = new InMemoryLocationGateway();
  });

  describe("findById", () => {
    it("should return null when location not found", async () => {
      const effect = gateway.findById(LocationId.unsafeCreate("nonexistent"));
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return location when found", async () => {
      const location = createTestLocation("location-123");
      await Effect.runPromise(gateway.create(location));

      const effect = gateway.findById(location.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(location.id);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight", async () => {
      const location = createTestLocation("pattern-location");
      const effect = gateway.create(location);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
