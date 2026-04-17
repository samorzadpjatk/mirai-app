/**
 * SponsorDrizzleGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemorySponsorGateway } from "../in-memory/InMemorySponsorGateway";
import { Sponsor, SponsorId, TripId, DatabaseError } from "@mirai-app/domain";

const createTestSponsor = (id: string): Sponsor => {
  return {
    id: SponsorId.unsafeCreate(id),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Sponsor;
};

describe("[UNIT] InMemorySponsorGateway", () => {
  let gateway: InMemorySponsorGateway;

  beforeEach(() => {
    gateway = new InMemorySponsorGateway();
  });

  describe("findById", () => {
    it("should return null when Sponsor not found", async () => {
      const effect = gateway.findById(SponsorId.unsafeCreate("nonexistent"));
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return Sponsor when found", async () => {
      const item = createTestSponsor("item-123");
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
      const item = createTestSponsor("new-item");
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
      const item = createTestSponsor("pattern-item");
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
