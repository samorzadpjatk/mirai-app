/**
 * InMemoryChallengeVoteGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryChallengeVoteGateway } from "./InMemoryChallengeVoteGateway";
import type { ChallengeVote } from "@mirai-app/domain";
import {
  ChallengeVoteId,
  ChallengeSubmissionId,
  ChallengeId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

const createTestVote = (
  id: string,
  overrides?: Partial<ChallengeVote>,
): ChallengeVote => {
  return {
    id: ChallengeVoteId.unsafeCreate(id),
    challengeId: ChallengeId.unsafeCreate("challenge-default"),
    submissionId: ChallengeSubmissionId.unsafeCreate("submission-default"),
    voterId: UserId.unsafeCreate("user-default"),
    votePosition: 1,
    votePoints: overrides?.votePoints ?? 100,
    normalizedWeight: 1.0,
    votedAt: new Date("2024-01-01"),
  };
};

describe("[UNIT] InMemoryChallengeVoteGateway", () => {
  let gateway: InMemoryChallengeVoteGateway;

  beforeEach(() => {
    gateway = new InMemoryChallengeVoteGateway();
  });

  describe("findById", () => {
    it("should return null when vote not found", async () => {
      const effect = gateway.findById(
        ChallengeVoteId.unsafeCreate("nonexistent"),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return vote when found", async () => {
      const vote = createTestVote("vote-123");
      await Effect.runPromise(gateway.create(vote));

      const effect = gateway.findById(vote.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(vote.id);
      }
    });
  });

  describe("create", () => {
    it("should create and return vote with Either pattern", async () => {
      const vote = createTestVote("new-vote");
      const effect = gateway.create(vote);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(vote.id);
      }

      // Error type verification with instanceof
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("Either pattern", () => {
    it("should demonstrate Either.isLeft/isRight with instanceof", async () => {
      const vote = createTestVote("pattern-vote");
      const effect = gateway.create(vote);

      const either = await Effect.runPromise(Effect.either(effect));

      // Success path
      expect(Either.isRight(either)).toBe(true);

      // Error path (not triggered here but pattern shown)
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
