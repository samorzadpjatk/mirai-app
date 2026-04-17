/**
 * ChallengeDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of IChallengePort.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryChallengeGateway } from "../in-memory/InMemoryChallengeGateway";
import {
  Challenge,
  ChallengeId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

// Test data factory
const createTestChallenge = (
  id: string,
  overrides?: Partial<{
    title: string;
    description: string;
    points: number;
  }>,
): Challenge => {
  return {
    id: ChallengeId.unsafeCreate(id),
    tripId: TripId.unsafeCreate("trip-default"),
    creatorId: UserId.unsafeCreate("user-default"),
    title: overrides?.title ?? "Test Challenge",
    description: overrides?.description ?? "A test challenge",
    points: overrides?.points ?? 100,
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-07"),
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Challenge;
};

describe("[UNIT] InMemoryChallengeGateway", () => {
  let gateway: InMemoryChallengeGateway;

  beforeEach(() => {
    gateway = new InMemoryChallengeGateway();
  });

  describe("findById", () => {
    it("should return null when challenge not found", async () => {
      const challengeId = ChallengeId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(challengeId);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeNull();
      }
    });

    it("should return challenge when found", async () => {
      const challenge = createTestChallenge("challenge-123");
      await Effect.runPromise(gateway.create(challenge));

      const effect = gateway.findById(challenge.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(challenge.id);
        expect(either.right.title).toBe("Test Challenge");
      }
    });
  });

  describe("findByTripId", () => {
    it("should return challenges for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const challenge1 = { ...createTestChallenge("c1"), tripId };
      const challenge2 = { ...createTestChallenge("c2"), tripId };

      await Effect.runPromise(gateway.create(challenge1));
      await Effect.runPromise(gateway.create(challenge2));

      const effect = gateway.findByTripId(tripId);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
      }
    });
  });

  describe("create", () => {
    it("should create and return challenge", async () => {
      const challenge = createTestChallenge("new-challenge");
      const effect = gateway.create(challenge);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(challenge.id);
      }
    });
  });

  describe("update", () => {
    it("should update existing challenge", async () => {
      const challenge = createTestChallenge("update-challenge", {
        title: "Original",
      });
      await Effect.runPromise(gateway.create(challenge));

      const updated = { ...challenge, title: "Updated" };
      const effect = gateway.update(updated);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.title).toBe("Updated");
      }
    });
  });

  describe("delete", () => {
    it("should delete challenge", async () => {
      const challenge = createTestChallenge("delete-challenge");
      await Effect.runPromise(gateway.create(challenge));

      const effect = gateway.delete(challenge.id);
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      const found = await Effect.runPromise(gateway.findById(challenge.id));
      expect(found).toBeNull();
    });
  });

  describe("Either pattern", () => {
    it("should use Either.isLeft/isRight with instanceof", async () => {
      const challenge = createTestChallenge("pattern-challenge");
      const effect = gateway.create(challenge);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
