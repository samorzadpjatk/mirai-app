/**
 * InMemoryChallengeSubmissionGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryChallengeSubmissionGateway } from "./InMemoryChallengeSubmissionGateway";
import type { ChallengeSubmission } from "@mirai-app/domain";
import {
  ChallengeSubmissionId,
  ChallengeId,
  GroupId,
  DatabaseError,
} from "@mirai-app/domain";

const createTestSubmission = (
  id: string,
  overrides?: Partial<ChallengeSubmission>,
): ChallengeSubmission => {
  const now = new Date("2024-01-01");
  return {
    id: ChallengeSubmissionId.unsafeCreate(id),
    challengeId: overrides?.challengeId ?? ChallengeId.unsafeCreate("challenge-default"),
    groupId: overrides?.groupId ?? GroupId.unsafeCreate("group-default"),
    imageIds: overrides?.imageIds ?? [],
    videoId: overrides?.videoId ?? null,
    textContent: overrides?.textContent ?? "Test submission content",
    latitude: overrides?.latitude ?? null,
    longitude: overrides?.longitude ?? null,
    status: overrides?.status ?? "PENDING",
    reviewedById: overrides?.reviewedById ?? null,
    reviewedAt: overrides?.reviewedAt ?? null,
    rejectionReason: overrides?.rejectionReason ?? null,
    awardedPoints: overrides?.awardedPoints ?? null,
    bonusPoints: overrides?.bonusPoints ?? null,
    ranking: overrides?.ranking ?? null,
    voteCount: overrides?.voteCount ?? 0,
    voteScore: overrides?.voteScore ?? 0,
    createdAt: overrides?.createdAt ?? now,
    updatedAt: overrides?.updatedAt ?? now,
  };
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

      // instanceof error verification (only reachable if test fails)
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
