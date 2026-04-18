/**
 * InMemoryChallengeGateway Tests
 *
 * Tests for the in-memory implementation of IChallengePort.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryChallengeGateway } from "./InMemoryChallengeGateway";
import {
  Challenge,
  ChallengeId,
  TripId,
  DatabaseError,
  type IAuthZPort,
} from "@mirai-app/domain";
import type { AuthContext } from "../../../infrastructure/effect";
import { AuthContextTag } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";

// Mock AuthContext for testing
const mockAuthContext: AuthContext = {
  userId: "user-test",
  role: "USER",
  tripRoles: { "trip-default": "LEADER" },
  isAuthenticated: true,
  accessToken: "test-token",
};

// Mock AuthZPort that always allows access
const mockAuthZPort: IAuthZPort = {
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
};

// Test data factory using Challenge.create
const createTestChallenge = async (
  id: string,
  overrides?: Partial<{
    tripId: string;
  }>,
): Promise<Challenge> => {
  const effect = Challenge.create({
    id: ChallengeId.unsafeCreate(id),
    tripId: TripId.unsafeCreate(overrides?.tripId ?? "trip-default"),
    name: "Test Challenge",
    description: "A test challenge",
    submissionType: "TEXT",
    scoringCategory: "SPEED",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });
  return await Effect.runPromise(effect);
};

describe("[UNIT] InMemoryChallengeGateway", () => {
  let gateway: InMemoryChallengeGateway;

  const getTestLayer = () =>
    Layer.mergeAll(
      Layer.succeed(AuthContextTag, mockAuthContext),
      Layer.succeed(AuthZPortTag, mockAuthZPort),
    );

  beforeEach(() => {
    gateway = new InMemoryChallengeGateway();
  });

  describe("findById", () => {
    it("should return null when challenge not found", async () => {
      const challengeId = ChallengeId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(challengeId).pipe(
        Effect.provide(getTestLayer()),
      );

      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return challenge when found", async () => {
      const challenge = await createTestChallenge("challenge-123");
      await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(getTestLayer())),
      );

      const result = await Effect.runPromise(
        gateway.findById(challenge.id).pipe(Effect.provide(getTestLayer())),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(challenge.id);
    });
  });

  describe("findByTripId", () => {
    it("should return challenges for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const challenge1 = await createTestChallenge("c1", { tripId: "trip-abc" });
      const challenge2 = await createTestChallenge("c2", { tripId: "trip-abc" });

      await Effect.runPromise(
        gateway.create(challenge1).pipe(Effect.provide(getTestLayer())),
      );
      await Effect.runPromise(
        gateway.create(challenge2).pipe(Effect.provide(getTestLayer())),
      );

      const result = await Effect.runPromise(gateway.findByTripId(tripId));
      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create and return challenge", async () => {
      const challenge = await createTestChallenge("new-challenge");
      const result = await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(getTestLayer())),
      );

      expect(result.id).toEqual(challenge.id);
    });
  });

  describe("update", () => {
    it("should update existing challenge", async () => {
      const challenge = await createTestChallenge("update-challenge");
      await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(getTestLayer())),
      );

      // Create updated challenge using factory method
      const updated = await createTestChallenge("update-challenge", { tripId: "trip-default" });
      const result = await Effect.runPromise(
        gateway.update(updated).pipe(Effect.provide(getTestLayer())),
      );

      expect(result.id).toEqual(challenge.id);
    });
  });

  describe("delete", () => {
    it("should delete challenge", async () => {
      const challenge = await createTestChallenge("delete-challenge");
      await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(getTestLayer())),
      );

      await Effect.runPromise(
        gateway.delete(challenge.id).pipe(Effect.provide(getTestLayer())),
      );

      const found = await Effect.runPromise(
        gateway.findById(challenge.id).pipe(Effect.provide(getTestLayer())),
      );
      expect(found).toBeNull();
    });
  });

  describe("Either pattern", () => {
    it("should use Either.isLeft/isRight with instanceof", async () => {
      const challenge = await createTestChallenge("pattern-challenge");
      const effect = gateway.create(challenge).pipe(
        Effect.provide(getTestLayer()),
      );

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
