/**
 * ChallengeSubmissionDrizzleGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryChallengeSubmissionGateway } from "../in-memory/InMemoryChallengeSubmissionGateway";
import {
  ChallengeSubmission,
  ChallengeSubmissionId,
  ChallengeId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

const createTestSubmission = (
  id: string,
  overrides?: Partial<ChallengeSubmission>,
): ChallengeSubmission => {
  return {
    id: ChallengeSubmissionId.unsafeCreate(id),
    challengeId: ChallengeId.unsafeCreate("challenge-default"),
    userId: UserId.unsafeCreate("user-default"),
    content: overrides?.content ?? "Test submission content",
    imageUrl: overrides?.imageUrl ?? null,
    location: overrides?.location ?? null,
    status: overrides?.status ?? "pending",
    submittedAt: new Date("2024-01-01"),
    score: overrides?.score ?? null,
  } as ChallengeSubmission;
};

describe("[UNIT] InMemoryChallengeSubmissionGateway", () => {
  let gateway: InMemoryChallengeSubmissionGateway;

  beforeEach(() => {
    gateway = new InMemoryChallengeSubmissionGateway();
  });

  describe("findById", () => {
    it("should return null when submission not found", async () => {
      const effect = gateway.findById(
        ChallengeSubmissionId.unsafeCreate("nonexistent"),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return submission when found", async () => {
      const submission = createTestSubmission("sub-123");
      await Effect.runPromise(gateway.create(submission));

      const effect = gateway.findById(submission.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(submission.id);
      }
    });
  });

  describe("create", () => {
    it("should create and return submission using Either pattern", async () => {
      const submission = createTestSubmission("new-sub");
      const effect = gateway.create(submission);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(submission.id);
      }

      // Verify with instanceof error checking
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("Either pattern demonstration", () => {
    it("should use Effect.either with Either.isLeft/isRight", async () => {
      const submission = createTestSubmission("pattern-test");
      const effect = gateway.create(submission);

      // Use Effect.either for type-safe error handling
      const either = await Effect.runPromise(Effect.either(effect));

      // Use Either.isRight for success checking
      expect(Either.isRight(either)).toBe(true);

      // Use Either.isLeft for error checking
      expect(Either.isLeft(either)).toBe(false);

      // Use instanceof for error type verification
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.message).toBeDefined();
      }
    });
  });
});
