import { Effect } from "effect";
import { ChallengeSubmissionGatewayTag } from "../../ports/submission/gateway";
import type { SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionDTO } from "../../dto";

/**
 * Input for GetSubmissionByChallengeAndGroup use case
 */
export interface GetSubmissionByChallengeAndGroupInput {
  challengeId: string;
  groupId: string;
}

/**
 * Output DTO for GetSubmissionByChallengeAndGroup use case
 */
export interface GetSubmissionByChallengeAndGroupOutput {
  id: SubmissionId;
  challengeId: string;
  userId: string;
  groupId: string | null;
  content: string | null;
  mediaUrls: string[];
  status: string;
  score: number | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  submittedAt: Date;
  updatedAt: Date;
}

/**
 * GetSubmissionByChallengeAndGroup Use Case
 *
 * Retrieves a submission by challenge ID and group ID (unique composite key).
 * Returns null if submission not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getSubmissionByChallengeAndGroupUseCase(input).pipe(
 *   Effect.provideService(ChallengeSubmissionGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getSubmissionByChallengeAndGroupUseCase(
  input: GetSubmissionByChallengeAndGroupInput,
): Effect.Effect<
  GetSubmissionByChallengeAndGroupOutput | null,
  never,
  ChallengeSubmissionGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* ChallengeSubmissionGatewayTag;

    const submission = yield* repo.findByChallengeAndGroup(
      input.challengeId,
      input.groupId,
    );

    if (!submission) {
      return null;
    }

    return toOutput(submission);
  });
}

/**
 * Helper function to convert submission to output DTO
 */
function toOutput(
  submission: ChallengeSubmissionDTO,
): GetSubmissionByChallengeAndGroupOutput {
  return {
    id: submission.id,
    challengeId: submission.challengeId,
    userId: submission.userId,
    groupId: submission.groupId,
    content: submission.content,
    mediaUrls: submission.mediaUrls,
    status: submission.status,
    score: submission.score,
    reviewedById: submission.reviewedById,
    reviewedAt: submission.reviewedAt,
    reviewNotes: submission.reviewNotes,
    submittedAt: submission.submittedAt,
    updatedAt: submission.updatedAt,
  };
}
