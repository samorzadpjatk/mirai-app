import { Effect, Data } from "effect";
import { ChallengeSubmissionId } from "@mirai-app/domain";
import { UserId } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import {
  ChallengeSubmissionPort,
  type ChallengeSubmission,
} from "../ports/ChallengeSubmissionPort";
import { GroupPort } from "../../group/ports/GroupPort";
import { CoinTransactionPort } from "../../coin/ports/CoinTransactionPort";
import {
  SubmissionNotFoundError,
  ReviewNotAllowedError,
  RejectionReasonRequiredError,
} from "../errors/SubmissionErrors";
import type { ReviewSubmissionResultDTO } from "../dto/ChallengeSubmissionDTOs";

/**
 * Input for ReviewSubmissionUseCase
 */
export interface ReviewSubmissionInput {
  submissionId: string;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
  awardedPoints?: number;
  bonusPoints?: number;
  ranking?: 1 | 2 | 3;
  reviewerId: string;
}

/**
 * Review Submission Use Case
 *
 * Reviews a submission (approve/reject) with points and ranking.
 */
export class ReviewSubmissionUseCase {
  execute(input: ReviewSubmissionInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;
      const submissionPort = yield* ChallengeSubmissionPort;
      const groupPort = yield* GroupPort;

      // Find submission
      const submission = yield* submissionPort.findById(ChallengeSubmissionId.unsafeCreate(input.submissionId));

      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Get challenge
      const challenge = yield* challengePort.findById(submission.challengeId);
      if (!challenge) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Check for judged staff challenges
      if (challenge.scoringCategory === "JUDGED_STAFF") {
        return yield* Effect.fail(
          new ReviewNotAllowedError({
            challengeId: submission.challengeId,
            scoringCategory: challenge.scoringCategory,
            message:
              "For judged staff challenges use staff voting flow instead of manual approve/reject",
          }),
        );
      }

      // Validate rejection reason
      if (input.status === "REJECTED" && !input.rejectionReason) {
        return yield* Effect.fail(
          new RejectionReasonRequiredError({
            submissionId: input.submissionId,
          }),
        );
      }

      // Calculate awarded points
      let awardedPoints = input.awardedPoints;
      if (
        awardedPoints === undefined &&
        challenge.scoringCategory === "SPEED"
      ) {
        // For speed challenges, calculate based on ranking
        switch (input.ranking) {
          case 1:
            awardedPoints = challenge.firstPlacePoints ?? challenge.basePoints;
            break;
          case 2:
            awardedPoints = challenge.secondPlacePoints ?? challenge.basePoints;
            break;
          case 3:
            awardedPoints = challenge.thirdPlacePoints ?? challenge.basePoints;
            break;
          default:
            awardedPoints = challenge.basePoints;
        }
      } else if (awardedPoints === undefined) {
        awardedPoints = challenge.basePoints;
      }

      const now = new Date();

      // Update submission
      const updated: ChallengeSubmission = {
        ...submission,
        status: input.status,
        rejectionReason:
          input.status === "REJECTED" ? (input.rejectionReason ?? null) : null,
        reviewedById: UserId.unsafeCreate(input.reviewerId),
        reviewedAt: now,
        awardedPoints: input.status === "APPROVED" ? awardedPoints : null,
        bonusPoints:
          input.status === "APPROVED" ? (input.bonusPoints ?? null) : null,
        ranking:
          challenge.scoringCategory === "SPEED" && input.status === "APPROVED"
            ? (input.ranking ?? null)
            : null,
        updatedAt: now,
      };

      const saved = yield* submissionPort.update(updated);

      // Award coins for approved submission
      if (input.status === "APPROVED" && awardedPoints > 0) {
        yield* groupPort.addCoins(submission.groupId, awardedPoints);
      }

      return {
        id: saved.id,
        challengeId: submission.challengeId,
        groupId: submission.groupId,
        status: saved.status,
        awardedPoints: saved.awardedPoints ?? 0,
        bonusPoints: saved.bonusPoints ?? 0,
        ranking: saved.ranking as 1 | 2 | 3 | null,
        reviewedAt: saved.reviewedAt!,
        reviewedById: saved.reviewedById!,
      } satisfies ReviewSubmissionResultDTO;
    });
  }
}
