import type { Result } from "@repo/domain";
import { ok, err, ChallengeSubmission, SubmissionId } from "@repo/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for UpdateSubmission use case
 */
export interface UpdateSubmissionInput {
  submissionId: SubmissionId;
  // Content update fields (only allowed when PENDING)
  imageIds?: string[];
  videoId?: string | null;
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Review fields (moderator only)
  reviewAction?: "APPROVE" | "REJECT";
  reviewedById?: string;
  rejectionReason?: string;
  awardedPoints?: number;
  bonusPoints?: number;
  ranking?: number | null;
}

/**
 * Output DTO for UpdateSubmission use case
 */
export interface UpdateSubmissionOutput {
  id: SubmissionId;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
  updatedAt: Date;
}

/**
 * UpdateSubmission Use Case
 *
 * Updates a submission's content (when pending) or reviews it (moderator action).
 * Returns error if submission not found or update not allowed.
 */
export class UpdateSubmissionUseCase {
  constructor(private submissionRepository: ChallengeSubmissionRepository) {}

  async execute(
    input: UpdateSubmissionInput,
  ): Promise<Result<UpdateSubmissionOutput, string>> {
    // Find existing submission
    const existing = await this.submissionRepository.findById(
      input.submissionId,
    );
    if (!existing) {
      return err("Submission not found");
    }

    let updatedSubmission: ChallengeSubmission;

    // Handle review actions
    if (input.reviewAction) {
      if (input.reviewAction === "APPROVE") {
        const approveResult = existing.approve({
          reviewedById: input.reviewedById ?? "",
          ...(input.awardedPoints !== undefined && {
            awardedPoints: input.awardedPoints,
          }),
          ...(input.bonusPoints !== undefined && {
            bonusPoints: input.bonusPoints,
          }),
          ...(input.ranking !== undefined && { ranking: input.ranking }),
        });

        if (approveResult.kind === "err") {
          return err(approveResult.error);
        }
        updatedSubmission = approveResult.value;
      } else if (input.reviewAction === "REJECT") {
        const rejectResult = existing.reject({
          reviewedById: input.reviewedById ?? "",
          reason: input.rejectionReason ?? "",
        });

        if (rejectResult.kind === "err") {
          return err(rejectResult.error);
        }
        updatedSubmission = rejectResult.value;
      } else {
        return err("Invalid review action");
      }
    } else {
      // Handle content updates
      const updateResult = existing.updateContent({
        ...(input.imageIds !== undefined && { imageIds: input.imageIds }),
        ...(input.videoId !== undefined && { videoId: input.videoId }),
        ...(input.textContent !== undefined && {
          textContent: input.textContent,
        }),
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
      });

      if (updateResult.kind === "err") {
        return err(updateResult.error);
      }
      updatedSubmission = updateResult.value;
    }

    // Persist updated submission
    const saved = await this.submissionRepository.update(updatedSubmission);

    return ok(this.toOutput(saved));
  }

  private toOutput(submission: ChallengeSubmission): UpdateSubmissionOutput {
    return {
      id: submission.id,
      challengeId: submission.challengeId,
      groupId: submission.groupId,
      imageIds: submission.imageIds,
      videoId: submission.videoId,
      textContent: submission.textContent,
      latitude: submission.latitude,
      longitude: submission.longitude,
      status: submission.status,
      reviewedById: submission.reviewedById,
      reviewedAt: submission.reviewedAt,
      rejectionReason: submission.rejectionReason,
      awardedPoints: submission.awardedPoints,
      bonusPoints: submission.bonusPoints,
      ranking: submission.ranking,
      voteCount: submission.voteCount,
      voteScore: submission.voteScore,
      updatedAt: submission.updatedAt,
    };
  }
}
