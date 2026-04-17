import { Context, Effect } from "effect";
import type { DatabaseError } from "@mirai-app/domain";

/**
 * ChallengeSubmission Port - Repository interface with Context.Tag for Effect DI
 */
export interface IChallengeSubmissionPort {
  findById(
    id: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never>;
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never>;
  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never>;
  findByGroupId(
    groupId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never>;
  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never>;
  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never>;
  countPendingByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never>;
}

export class ChallengeSubmissionPortTag extends Context.Tag(
  "ChallengeSubmissionPort",
)<ChallengeSubmissionPortTag, IChallengeSubmissionPort>() {}

/**
 * ChallengeSubmission entity interface for use cases
 */
export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number | null;
  bonusPoints: number | null;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
}
