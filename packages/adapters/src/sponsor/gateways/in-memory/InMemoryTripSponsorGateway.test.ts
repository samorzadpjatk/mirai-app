/**
 * InMemoryTripSponsorGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 * Uses AuthContext pattern with Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryTripSponsorGateway } from "./InMemoryTripSponsorGateway";
import type { TripSponsor } from "@mirai-app/domain";
import { TripSponsorId, TripId, SponsorId, DatabaseError } from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

// ============================================================================
// Mock Helpers
// ============================================================================

const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test",
  role: overrides?.role ?? "ADMIN", // Admin for write operations
  tripRoles: overrides?.tripRoles ?? {},
  isAuthenticated: overrides?.isAuthenticated ?? true,
  accessToken: overrides?.accessToken ?? "mock-access-token",
});

const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

const createTestLayer = (authContext?: AuthContext) =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

const createTestTripSponsor = (id: string): TripSponsor => {
  return {
    id: TripSponsorId.unsafeCreate(id),
    tripId: TripId.unsafeCreate("trip-default"),
    sponsorId: SponsorId.unsafeCreate("sponsor-default"),
    createdAt: new Date("2024-01-01"),
  };
};

describe("[UNIT] InMemoryTripSponsorGateway", () => {
  let gateway: InMemoryTripSponsorGateway;
  let testLayer: ReturnType<typeof createTestLayer>;

  beforeEach(() => {
    gateway = new InMemoryTripSponsorGateway();
    testLayer = createTestLayer();
  });

  describe("findById", () => {
    it("should return null when TripSponsor not found", async () => {
      const effect = gateway.findById(TripSponsorId.unsafeCreate("nonexistent")).pipe(
        Effect.provide(createTestLayer()),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return TripSponsor when found", async () => {
      const item = createTestTripSponsor("item-123");
      await Effect.runPromise(gateway.create(item).pipe(Effect.provide(createTestLayer())));

      const effect = gateway.findById(item.id).pipe(Effect.provide(createTestLayer()));
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
      const effect = gateway.create(item).pipe(Effect.provide(createTestLayer()));

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
      const effect = gateway.create(item).pipe(Effect.provide(createTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
