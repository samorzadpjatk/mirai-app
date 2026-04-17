/**
 * TripSponsorDrizzleGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryTripSponsorGateway } from "../in-memory/InMemoryTripSponsorGateway";
import { TripSponsor, TripSponsorId, TripId, DatabaseError } from "@mirai-app/domain";

const createTestTripSponsor = (id: string): TripSponsor => {
  return {
    id: TripSponsorId.unsafeCreate(id),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as TripSponsor;
};

describe("[UNIT] InMemoryTripSponsorGateway", () => {
  let gateway: InMemoryTripSponsorGateway;

  beforeEach(() => {
    gateway = new InMemoryTripSponsorGateway();
  });

  describe("findById", () => {
    it("should return null when TripSponsor not found", async () => {
      const effect = gateway.findById(TripSponsorId.unsafeCreate("nonexistent"));
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return TripSponsor when found", async () => {
      const item = createTestTripSponsor("item-123");
      await Effect.runPromise(gateway.create(item));

      const effect = gateway.findById(item.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("create", () => {
    it("should create with Either pattern", async () => {
      const item = createTestTripSponsor("new-item");
      const effect = gateway.create(item);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const item = createTestTripSponsor("pattern-item");
      const effect = gateway.create(item);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
