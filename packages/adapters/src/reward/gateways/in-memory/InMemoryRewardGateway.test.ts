/**
 * InMemoryRewardGateway Tests
 *
 * Unit tests for the in-memory implementation of IRewardPort.
 * Uses AuthContext pattern with Effect.gen and Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryRewardGateway } from "./InMemoryRewardGateway";
import { Reward, RewardId, TripId, UserId, DatabaseError } from "@mirai-app/domain";
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
const getTestLayer = (authContext?: AuthContext) =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

// Test data factory using Reward.create factory method
const createTestReward = async (
  id: string,
  overrides?: Partial<{
    name: string;
    description: string;
    tripId?: TripId;
  }>,
): Promise<Reward> => {
  const effect = Reward.create({
    id: RewardId.unsafeCreate(id),
    name: overrides?.name ?? "Test Reward",
    description: overrides?.description ?? "A test reward",
    availableQuantity: 10,
    coinCost: 100,
    tripId: overrides?.tripId ?? TripId.unsafeCreate("trip-default"),
    createdById: UserId.unsafeCreate("creator-default"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });
  return await Effect.runPromise(effect);
};

describe("[UNIT] InMemoryRewardGateway", () => {
  let gateway: InMemoryRewardGateway;

  beforeEach(() => {
    gateway = new InMemoryRewardGateway();
  });

  describe("findById", () => {
    it("should return null when reward not found", async () => {
      const effect = gateway.findById(RewardId.unsafeCreate("nonexistent")).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return reward when found", async () => {
      const reward = await createTestReward("reward-123");
      await Effect.runPromise(gateway.create(reward).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findById(reward.id).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(reward.id);
    });
  });

  describe("findByTripId", () => {
    it("should return rewards for trip", async () => {
      const tripId = TripId.unsafeCreate("trip-abc");
      const reward1 = await createTestReward("r1", { tripId });
      const reward2 = await createTestReward("r2", { tripId });

      await Effect.runPromise(gateway.create(reward1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(reward2).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findByTripId(tripId).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create and return reward", async () => {
      const reward = await createTestReward("new-reward");
      const effect = gateway.create(reward).pipe(Effect.provide(getTestLayer()));

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
      const customLayer = getTestLayer(customAuthContext);

      const reward = await createTestReward("auth-test-reward");
      const effect = gateway.create(reward).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(reward.id);
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with instanceof for type safety", async () => {
      const reward = await createTestReward("pattern-reward");
      const effect = gateway.create(reward).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
