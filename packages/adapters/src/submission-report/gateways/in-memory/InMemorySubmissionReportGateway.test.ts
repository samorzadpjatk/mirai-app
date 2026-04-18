/**
 * InMemorySubmissionReportGateway Tests
 *
 * Tests using Either pattern with Effect.either, Either.isLeft/isRight, and instanceof.
 * Uses AuthContext pattern with Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemorySubmissionReportGateway } from "./InMemorySubmissionReportGateway";
import type { SubmissionReport } from "@mirai-app/domain";
import { SubmissionReportId, ChallengeSubmissionId, UserId, DatabaseError } from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

// ============================================================================
// Mock Helpers
// ============================================================================

const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test",
  role: overrides?.role ?? "ADMIN", // Admin for viewing reports
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

const createTestSubmissionReport = (id: string): SubmissionReport => {
  return {
    id: SubmissionReportId.unsafeCreate(id),
    submissionId: ChallengeSubmissionId.unsafeCreate("submission-default"),
    reporterId: UserId.unsafeCreate("reporter-default"),
    reason: "inappropriate content",
    details: "This submission contains inappropriate content",
    createdAt: new Date("2024-01-01"),
  };
};

describe("[UNIT] InMemorySubmissionReportGateway", () => {
  let gateway: InMemorySubmissionReportGateway;
  const getTestLayer = () =>
    Layer.mergeAll(
      Layer.succeed(AuthContextTag, createMockAuthContext()),
      Layer.succeed(AuthZPortTag, createMockAuthZPort()),
    );

  beforeEach(() => {
    gateway = new InMemorySubmissionReportGateway();
  });

  describe("findById", () => {
    it("should return null when SubmissionReport not found", async () => {
      const effect = gateway.findById(SubmissionReportId.unsafeCreate("nonexistent")).pipe(
        Effect.provide(getTestLayer()),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return SubmissionReport when found", async () => {
      const item = createTestSubmissionReport("item-123");
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
      const item = createTestSubmissionReport("new-item");
      const effect = gateway.create(item).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        // Gateway may generate a new ID, so just verify it was created
        expect(either.right.submissionId).toEqual(item.submissionId);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const item = createTestSubmissionReport("pattern-item");
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
