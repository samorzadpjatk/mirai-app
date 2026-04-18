/**
 * InMemoryCoinTransactionGateway Tests
 *
 * Tests using AuthContext pattern with Effect.gen and Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryCoinTransactionGateway } from "./InMemoryCoinTransactionGateway";
import {
  CoinTransactionId,
  DatabaseError,
  type CoinTransactionDTO,
  type IAuthZPort,
} from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";

// ============================================================================
// Mock Helpers
// ============================================================================

const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test",
  role: overrides?.role ?? "ADMIN",
  tripRoles: overrides?.tripRoles ?? { "trip-123": "LEADER" },
  isAuthenticated: overrides?.isAuthenticated ?? true,
  accessToken: overrides?.accessToken ?? "mock-access-token",
});

const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(undefined),
  checkRolePermission: () => Effect.succeed(true),
});

const createTestCoinTransactionDTO = (
  id: string,
  tripId: string = "trip-123",
  groupId: string = "group-123",
  amount: number = 100,
): CoinTransactionDTO => ({
  id,
  tripId,
  groupId,
  amount,
  reason: "Test transaction",
  adminId: "user-123",
  createdAt: new Date("2024-01-01"),
});

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] InMemoryCoinTransactionGateway with AuthContext", () => {
  let gateway: InMemoryCoinTransactionGateway;
  const getTestLayer = () =>
    Layer.mergeAll(
      Layer.succeed(AuthContextTag, createMockAuthContext()),
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
    );

  beforeEach(() => {
    gateway = new InMemoryCoinTransactionGateway();
  });

  describe("findById", () => {
    it("should return null when transaction not found", async () => {
      const effect = gateway
        .findById("nonexistent")
        .pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return transaction when found", async () => {
      const item = createTestCoinTransactionDTO("item-123");
      await Effect.runPromise(
        gateway.create(item).pipe(Effect.provide(getTestLayer())),
      );

      const effect = gateway.findById(item.id).pipe(Effect.provide(getTestLayer()));
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("create", () => {
    it("should create transaction with Either pattern", async () => {
      const item = createTestCoinTransactionDTO("new-item");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(item.id);
      }
    });
  });

  describe("findByTripId", () => {
    it("should find transactions by trip ID", async () => {
      const item1 = createTestCoinTransactionDTO("item-1", "trip-123");
      const item2 = createTestCoinTransactionDTO("item-2", "trip-123");
      const item3 = createTestCoinTransactionDTO("item-3", "trip-456");

      await Effect.runPromise(
        gateway.create(item1).pipe(Effect.provide(getTestLayer())),
      );
      await Effect.runPromise(
        gateway.create(item2).pipe(Effect.provide(getTestLayer())),
      );
      await Effect.runPromise(
        gateway.create(item3).pipe(Effect.provide(getTestLayer())),
      );

      const effect = gateway
        .findByTripId("trip-123")
        .pipe(Effect.provide(getTestLayer()));
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
        expect(either.right.map((t) => t.id)).toContain("item-1");
        expect(either.right.map((t) => t.id)).toContain("item-2");
      }
    });
  });

  describe("sumByGroupId", () => {
    it("should calculate sum of transactions for group", async () => {
      const item1 = createTestCoinTransactionDTO("item-1", "trip-123", "group-123", 100);
      const item2 = createTestCoinTransactionDTO("item-2", "trip-123", "group-123", 50);
      const item3 = createTestCoinTransactionDTO("item-3", "trip-123", "group-456", 75);

      await Effect.runPromise(
        gateway.create(item1).pipe(Effect.provide(getTestLayer())),
      );
      await Effect.runPromise(
        gateway.create(item2).pipe(Effect.provide(getTestLayer())),
      );
      await Effect.runPromise(
        gateway.create(item3).pipe(Effect.provide(getTestLayer())),
      );

      const effect = gateway
        .sumByGroupId("group-123")
        .pipe(Effect.provide(getTestLayer()));
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(150);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const item = createTestCoinTransactionDTO("pattern-item");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
