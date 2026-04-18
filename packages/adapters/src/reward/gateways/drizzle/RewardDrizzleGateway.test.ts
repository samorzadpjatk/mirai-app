/**
 * RewardDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of IRewardPort.
 * Uses AuthContext pattern with Effect.gen and Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryRewardGateway } from "../in-memory/InMemoryRewardGateway";
import { Reward, RewardId, TripId, DatabaseError } from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

// ============================================================================
// Mock AuthContext Helper
// ============================================================================

/**
 * Creates a mock AuthContext for testing
 */
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test",
  role: overrides?.role ?? "USER",
  tripRoles: overrides?.tripRoles ?? {},
  isAuthenticated: overrides?.isAuthenticated ?? true,
  accessToken: overrides?.accessToken ?? "mock-access-token",
});

/**
 * Creates a mock IAuthZPort that always allows access
 */
const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

/**
 * Creates a test layer with mocked AuthContext and AuthZPort
 */
const createTestLayer = (authContext?: AuthContext) =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

const createTestReward = (id: string, overrides?: Partial<Reward>): Reward => {
  return {
    id: RewardId.unsafeCreate(id),
    tripId: TripId.unsafeCreate("trip-default"),
    name: overrides?.name ?? "Test Reward",
    description: overrides?.description ?? "A test reward",
    imageUrl: overrides?.imageUrl ?? null,
    coinCost: overrides?.coinCost ?? 100,
    quantity: overrides?.quantity ?? 10,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Reward;
};

describe("[UNIT] InMemoryRewardGateway", () => {
  let gateway: InMemoryRewardGateway;
  let testLayer: Layer.Layer<typeof AuthZPortTag | typeof AuthContextTag>;

  beforeEach(() => {
    gateway = new InMemoryRewardGateway();
    testLayer = createTestLayer();
  });

  describe("findById", () => {
    it("should return null when reward not found", async () => {
      const effect = gateway.findById(RewardId.unsafeCreate("nonexistent")).pipe(Effect.provide(testLayer));
      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return reward when found", async () => {
      const reward = createTestReward("reward-123");
      await Effect.runPromise(gateway.create(reward).pipe(Effect.provide(testLayer)));

      const effect = gateway.findById(reward.id).pipe(Effect.provide(testLayer));
      const result = await Effect.runPromise(effect);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(reward.id);
    });
  });

  describe("findByTripId", () => {
    it("should return rewards for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const reward1 = { ...createTestReward("r1"), tripId };
      const reward2 = { ...createTestReward("r2"), tripId };

      await Effect.runPromise(gateway.create(reward1).pipe(Effect.provide(testLayer)));
      await Effect.runPromise(gateway.create(reward2).pipe(Effect.provide(testLayer)));

      const effect = gateway.findByTripId(tripId).pipe(Effect.provide(testLayer));
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create and return reward", async () => {
      const reward = createTestReward("new-reward");
      const effect = gateway.create(reward).pipe(Effect.provide(testLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(reward.id);
    });
  });

  describe("AuthContext pattern", () => {
    it("should use AuthContext with Layer.provide", async () => {
      // Create a custom auth context for testing with trip-specific roles
      const customAuthContext = createMockAuthContext({
        userId: "custom-user",
        role: "USER",
        tripRoles: { "trip-default": "LEADER" },
      });
      const customLayer = createTestLayer(customAuthContext);

      const reward = createTestReward("auth-test-reward");
      const effect = gateway.create(reward).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(reward.id);
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with instanceof for type safety", async () => {
      const reward = createTestReward("pattern-reward");
      const effect = gateway.create(reward).pipe(Effect.provide(testLayer));

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
