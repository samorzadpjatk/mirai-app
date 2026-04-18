/**
 * InMemorySponsorGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 * Uses AuthContext pattern with Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemorySponsorGateway } from "./InMemorySponsorGateway";
import { Sponsor, SponsorId, TripId, DatabaseError, type IAuthZPort } from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";

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

const createTestSponsor = (id: string): Sponsor => {
  return {
    id: SponsorId.unsafeCreate(id),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as Sponsor;
};

describe("[UNIT] InMemorySponsorGateway", () => {
  let gateway: InMemorySponsorGateway;
  const getTestLayer = () =>
    Layer.mergeAll(
      Layer.succeed(AuthContextTag, createMockAuthContext()),
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
    );

  beforeEach(() => {
    gateway = new InMemorySponsorGateway();
  });

  describe("findById", () => {
    it("should return null when Sponsor not found", async () => {
      const effect = gateway.findById(SponsorId.unsafeCreate("nonexistent")).pipe(
        Effect.provide(getTestLayer()),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return Sponsor when found", async () => {
      const item = createTestSponsor("item-123");
      await Effect.runPromise(gateway.create(item).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findById(item.id).pipe(Effect.provide(getTestLayer()));
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
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

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
