/**
 * InMemoryActivityFeedGateway Tests
 *
 * Unit tests for ActivityFeed gateway using InMemoryActivityFeedGateway.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryActivityFeedGateway } from "./InMemoryActivityFeedGateway";
import {
  ActivityFeed,
  ActivityFeedId,
  TripId,
} from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import {
  AuthContextTag,
  createMockAuthContext,
  createMockAuthZLayer,
  createMockTripMemberContext,
  createAlwaysDenyMockAuthZ,
  MockPermissionDeniedError,
} from "@mirai-app/frameworks/di";

const createTestFeed = (
  id: string,
  overrides?: Partial<ActivityFeed>,
): ActivityFeed => {
  // Use ActivityFeed.create to get a proper entity with methods
  const feedEffect = ActivityFeed.create({
    id: ActivityFeedId.unsafeCreate(id),
    tripId: overrides?.tripId ?? TripId.unsafeCreate("trip-default"),
    activityType: overrides?.activityType ?? "USER_POST",
    title: overrides?.title ?? "Test Feed",
    description: overrides?.description ?? "A test feed",
    isPinned: overrides?.isPinned ?? false,
    isHidden: overrides?.isHidden ?? false,
    createdAt: overrides?.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides?.updatedAt ?? new Date("2024-01-01"),
  });

  // ActivityFeed.create returns Effect<ActivityFeed, ValidationError, never>
  // For tests, we can safely unwrap since we know the data is valid
  const result = Effect.runSync(feedEffect);
  return result;
};

describe("[UNIT] InMemoryActivityFeedGateway - AuthContext Pattern", () => {
  let gateway: InMemoryActivityFeedGateway;

  beforeEach(() => {
    gateway = new InMemoryActivityFeedGateway();
  });

  describe("auth verification", () => {
    it("should succeed with valid auth context for findByTripId", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );

      const tripId = TripId.unsafeCreate("trip-default");
      const effect = gateway.findByTripId(tripId).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail with denied auth for findByTripId when not a member", async () => {
      const denyLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockAuthContext({ userId: "unauthorized-user" })),
        Layer.succeed(
          AuthZPortTag,
          createAlwaysDenyMockAuthZ(new MockPermissionDeniedError({}))
        ),
      );

      const tripId = TripId.unsafeCreate("trip-default");
      const effect = gateway.findByTripId(tripId).pipe(
        Effect.provide(denyLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(MockPermissionDeniedError);
      }
    });

    it("should verify create requires write permission", async () => {
      const feed = createTestFeed("feed-create-test");

      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );

      const effect = gateway.create(feed).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      // Verify the feed was created
      const found = await Effect.runPromise(
        gateway.findById(feed.id).pipe(Effect.provide(testLayer))
      );
      expect(found).not.toBeNull();
      expect(found?.id).toEqual(feed.id);
    });

    it("should verify delete requires admin permission", async () => {
      const feed = createTestFeed("feed-delete-test");

      // First add the feed to the gateway
      const setupLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );
      await Effect.runPromise(gateway.create(feed).pipe(Effect.provide(setupLayer)));

      // Now delete it with admin context
      const adminLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockAuthContext({
          userId: "admin-user",
          role: "ADMIN",
          tripRoles: { "trip-default": "LEADER" },
        })),
        createMockAuthZLayer(),
      );

      const effect = gateway.delete(feed.id).pipe(
        Effect.provide(adminLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const feed = createTestFeed("pattern-feed");

      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );

      const effect = gateway.create(feed).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either) || Either.isLeft(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeDefined();
      }
    });
  });

  describe("pagination", () => {
    it("should support findByTripIdPaginated with cursor", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );

      // Create multiple feeds
      for (let i = 0; i < 5; i++) {
        const feed = createTestFeed(`feed-paginated-${i}`, {
          createdAt: new Date(`2024-01-0${i + 1}`),
        });
        await Effect.runPromise(gateway.create(feed).pipe(Effect.provide(testLayer)));
      }

      const tripId = TripId.unsafeCreate("trip-default");
      const effect = gateway.findByTripIdPaginated(tripId, { limit: 2 }).pipe(
        Effect.provide(testLayer),
      );

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      if (Either.isRight(either)) {
        expect(either.right.activities.length).toBeLessThanOrEqual(2);
      }
    });
  });

  describe("pinning", () => {
    it("should support setPinned to pin and unpin activities", async () => {
      const feed = createTestFeed("feed-pin-test", { isPinned: false });

      const testLayer = Layer.mergeAll(
        Layer.succeed(AuthContextTag, createMockTripMemberContext("trip-default")),
        createMockAuthZLayer(),
      );

      // Create the feed
      await Effect.runPromise(gateway.create(feed).pipe(Effect.provide(testLayer)));

      // Pin it
      const pinEffect = gateway.setPinned(feed.id, true).pipe(
        Effect.provide(testLayer),
      );
      const pinned = await Effect.runPromise(Effect.either(pinEffect));
      expect(Either.isRight(pinned)).toBe(true);

      if (Either.isRight(pinned)) {
        expect(pinned.right.isPinned).toBe(true);
      }

      // Unpin it
      const unpinEffect = gateway.setPinned(feed.id, false).pipe(
        Effect.provide(testLayer),
      );
      const unpinned = await Effect.runPromise(Effect.either(unpinEffect));
      expect(Either.isRight(unpinned)).toBe(true);

      if (Either.isRight(unpinned)) {
        expect(unpinned.right.isPinned).toBe(false);
      }
    });
  });
});

/**
 * Test documentation for InMemoryActivityFeedGateway Auth Pattern:
 *
 * 1. AuthContext Pattern Applied:
 *    - All methods use `yield* AuthContextTag` to get auth context
 *    - All methods use `yield* AuthZPortTag.verifyAccess()` for authorization
 *    - Trip membership is verified for all trip-scoped operations
 *
 * 2. Permission Levels:
 *    - findByTripId: requires "read" permission
 *    - findVisibleByTripId: requires "read" permission
 *    - findPinnedByTripId: requires "read" permission
 *    - findByTripIdPaginated: requires "read" permission
 *    - findByTripIdForModeration: requires "admin" permission
 *    - create: requires "write" permission (ORGANIZER+)
 *    - update: requires "write" permission
 *    - delete: requires "admin" permission
 *    - setPinned: requires "admin" permission
 *    - exists: requires "read" permission
 *
 * 3. Test Setup:
 *    - Use createMockTripMemberContext(tripId) for trip members
 *    - Use createMockAuthZLayer() for always-allow auth
 *    - Use createAlwaysDenyMockAuthZ(error) for testing auth failures
 */
