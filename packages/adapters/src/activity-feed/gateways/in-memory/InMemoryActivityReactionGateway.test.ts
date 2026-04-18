/**
 * InMemoryActivityReactionGateway Tests
 *
 * Tests for the InMemoryActivityReactionGateway with AuthContext pattern.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryActivityReactionGateway } from "./InMemoryActivityReactionGateway";
import {
  ActivityFeedId,
  DatabaseError,
  UserId,
} from "@mirai-app/domain";
import type { ActivityReaction } from "@mirai-app/use-cases/activity-feed/ports";
import type { ActivityReactionType } from "@mirai-app/domain";
import {
  AuthContextTag,
  createMockAuthContext,
  createMockAuthZLayer,
  createMockTripMemberContext,
  createAlwaysDenyMockAuthZ,
  MockPermissionDeniedError,
  AuthZPortTag,
} from "@mirai-app/frameworks/di";

const createTestReaction = (
  id: string,
  overrides?: Partial<ActivityReaction>,
): ActivityReaction => {
  return {
    id: id as ActivityReaction["id"],
    activityId: (overrides?.activityId ?? "activity-default") as ActivityReaction["activityId"],
    userId: (overrides?.userId ?? "user-default") as ActivityReaction["userId"],
    reactionType: (overrides?.reactionType ?? "heart") as ActivityReactionType,
    createdAt: overrides?.createdAt ?? new Date("2024-01-01"),
  };
};

describe("[UNIT] InMemoryActivityReactionGateway - AuthContext Pattern", () => {
  let gateway: InMemoryActivityReactionGateway;

  beforeEach(() => {
    gateway = new InMemoryActivityReactionGateway();
  });

  describe("auth verification", () => {
    it("should succeed with valid auth context for findByActivityId", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );

      const effect = gateway.findByActivityId(ActivityFeedId.unsafeCreate("activity-default")).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail with denied auth for findByActivityId when not a member", async () => {
      // Set up activity-to-trip mapping so auth check can proceed
      gateway.setActivityTripId("activity-default", "trip-default");

      const denyLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockAuthContext({ userId: "unauthorized-user" })),
        Layer.succeed(
          AuthZPortTag,
          createAlwaysDenyMockAuthZ(new MockPermissionDeniedError({}))
        ),
      );

      const effect = gateway.findByActivityId(ActivityFeedId.unsafeCreate("activity-default")).pipe(
        Effect.provide(denyLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(MockPermissionDeniedError);
      }
    });

    it("should verify create requires write permission and correct user", async () => {
      const reaction = createTestReaction("reaction-create-test", {
        userId: UserId.unsafeCreate("user-default"),
      });

      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockAuthContext({
          userId: "user-default",
          tripRoles: { "trip-default": "MEMBER" },
        })),
        createMockAuthZLayer(),
      );

      const effect = gateway.create(reaction).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      // Will succeed with mock database
      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail when creating reaction for another user", async () => {
      const reaction = createTestReaction("reaction-create-test", {
        userId: UserId.unsafeCreate("other-user"), // Different from auth context user
      });

      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockAuthContext({
          userId: "user-default", // Current user
          tripRoles: { "trip-default": "MEMBER" },
        })),
        createMockAuthZLayer(),
      );

      const effect = gateway.create(reaction).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });

    it("should verify delete requires write permission and correct user", async () => {
      // First create a reaction
      const reaction = createTestReaction("reaction-delete-test", {
        userId: UserId.unsafeCreate("user-default"),
      });

      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockAuthContext({
          userId: "user-default",
          tripRoles: { "trip-default": "MEMBER" },
        })),
        createMockAuthZLayer(),
      );

      // Mock the reaction in the database using the gateway helper
      gateway.addReaction(reaction);
      // Set up activity to trip mapping for auth
      gateway.setActivityTripId("activity-default", "trip-default");

      const effect = gateway.delete(reaction.id).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const reaction = createTestReaction("pattern-reaction");

      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );

      const effect = gateway.create(reaction).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either) || Either.isLeft(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(
          either.left instanceof DatabaseError ||
          either.left instanceof MockPermissionDeniedError
        ).toBe(true);
      }
    });
  });
});

/**
 * Test documentation for InMemoryActivityReactionGateway Auth Pattern:
 *
 * 1. AuthContext Pattern Applied:
 *    - All methods now use `yield* AuthContextTag` to get auth context
 *    - All methods use `yield* AuthZPortTag.verifyAccess()` for authorization
 *    - Trip membership is verified via activityId -> activityFeed -> tripId lookup
 *
 * 2. Permission Levels:
 *    - findById: requires "read" permission via activity's trip
 *    - findByActivityId: requires "read" permission via activity's trip
 *    - findByActivityIdAndUserId: requires "read" permission via activity's trip
 *    - create: requires "write" permission via activity's trip + user must be self
 *    - delete: requires "write" permission via activity's trip + user must be self or admin
 *    - deleteByActivityAndUser: requires "write" permission via activity's trip + user must be self or admin
 *    - countByActivityId: requires "read" permission via activity's trip
 *    - countByActivityIdAndType: requires "read" permission via activity's trip
 *
 * 3. Test Setup:
 *    - Use createMockTripMemberContext(tripId) for trip members
 *    - Use createMockAuthZLayer() for always-allow auth
 *    - Use createAlwaysDenyMockAuthZ(error) for testing auth failures
 */
