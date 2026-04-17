import { Context, Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";

/**
 * ChallengeSubmission Port - Repository interface with Context.Tag for Effect DI
 */
export interface IChallengeSubmissionPort {
  findById(
    id: string,
  ): Effect.Effect<ChallengeSubmission | null, IPortError, never>;
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmission[], IPortError, never>;
  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmission | null, IPortError, never>;
  findByGroupId(
    groupId: string,
  ): Effect.Effect<ChallengeSubmission[], IPortError, never>;
  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, IPortError, never>;
  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, IPortError, never>;
  countPendingByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, IPortError, never>;
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
