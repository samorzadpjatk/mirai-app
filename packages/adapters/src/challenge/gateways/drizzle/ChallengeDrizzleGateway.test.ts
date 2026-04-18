/**
 * ChallengeDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of IChallengePort.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryChallengeGateway } from "../in-memory/InMemoryChallengeGateway";
import {
  Challenge,
  ChallengeId,
  TripId,
  UserId,
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

// Create test layer with mocked auth dependencies
const createTestLayer = () =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, mockAuthContext),
    Layer.succeed(AuthZPortTag, mockAuthZPort),
  );

// Test data factory
const createTestChallenge = (
  id: string,
  overrides?: Partial<{
    tripId: string;
  }>,
): Challenge => {
  // Use a valid challenge structure from the domain
  return {
    id: ChallengeId.unsafeCreate(id),
    tripId: TripId.unsafeCreate(overrides?.tripId ?? "trip-default"),
    name: "Test Challenge",
    description: "A test challenge",
    image: null,
    submissionType: "TEXT",
    scoringCategory: "CREATIVITY",
    status: "VISIBLE",
    points: 100,
    minVotes: 1,
    duplicateSubmissionPenalty: 0,
    startTime: null,
    endTime: null,
    displayOrder: 0,
    maxSubmissions: 1,
    showVotes: false,
    isTripSpecific: true,
    autoApprove: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as unknown as Challenge;
};

describe("[UNIT] InMemoryChallengeGateway", () => {
  let gateway: InMemoryChallengeGateway;
  let testLayer: Layer.Layer<typeof AuthZPortTag | typeof AuthContextTag>;

  beforeEach(() => {
    gateway = new InMemoryChallengeGateway();
    testLayer = createTestLayer();
  });

  describe("findById", () => {
    it("should return null when challenge not found", async () => {
      const challengeId = ChallengeId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(challengeId).pipe(
        Effect.provide(testLayer),
      );

      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return challenge when found", async () => {
      const challenge = createTestChallenge("challenge-123");
      await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(testLayer)),
      );

      const result = await Effect.runPromise(
        gateway.findById(challenge.id).pipe(Effect.provide(testLayer)),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(challenge.id);
    });
  });

  describe("findByTripId", () => {
    it("should return challenges for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const challenge1 = createTestChallenge("c1", { tripId: "trip-abc" });
      const challenge2 = createTestChallenge("c2", { tripId: "trip-abc" });

      await Effect.runPromise(
        gateway.create(challenge1).pipe(Effect.provide(testLayer)),
      );
      await Effect.runPromise(
        gateway.create(challenge2).pipe(Effect.provide(testLayer)),
      );

      const result = await Effect.runPromise(gateway.findByTripId(tripId));
      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create and return challenge", async () => {
      const challenge = createTestChallenge("new-challenge");
      const result = await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(testLayer)),
      );

      expect(result.id).toEqual(challenge.id);
    });
  });

  describe("update", () => {
    it("should update existing challenge", async () => {
      const challenge = createTestChallenge("update-challenge");
      await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(testLayer)),
      );

      const updated = { ...challenge, name: "Updated" };
      const result = await Effect.runPromise(
        gateway.update(updated).pipe(Effect.provide(testLayer)),
      );

      expect(result.name).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("should delete challenge", async () => {
      const challenge = createTestChallenge("delete-challenge");
      await Effect.runPromise(
        gateway.create(challenge).pipe(Effect.provide(testLayer)),
      );

      await Effect.runPromise(
        gateway.delete(challenge.id).pipe(Effect.provide(testLayer)),
      );

      const found = await Effect.runPromise(
        gateway.findById(challenge.id).pipe(Effect.provide(testLayer)),
      );
      expect(found).toBeNull();
    });
  });

  describe("Either pattern", () => {
    it("should use Either.isLeft/isRight with instanceof", async () => {
      const challenge = createTestChallenge("pattern-challenge");
      const effect = gateway.create(challenge).pipe(
        Effect.provide(testLayer),
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
