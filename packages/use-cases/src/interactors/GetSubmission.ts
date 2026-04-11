import type { Result } from "@mirai-app/domain";
import { ok, err, SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for GetSubmission use case
 */
export interface GetSubmissionInput {
  submissionId: SubmissionId;
}

/**
 * Output DTO for GetSubmission use case
 */
export interface GetSubmissionOutput {
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
  createdAt: Date;
  updatedAt: Date;
  // Related info (populated if available)
  group: {
    id: string;
    name: string;
    image: string | null;
    coins: number;
  } | null;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
}

/**
 * GetSubmission Use Case
 *
 * Retrieves a submission by ID.
 * Returns error if submission not found.
 */
export class GetSubmissionUseCase {
  constructor(private submissionRepository: ChallengeSubmissionRepository) {}

  async execute(
    input: GetSubmissionInput,
  ): Promise<Result<GetSubmissionOutput, string>> {
    const submission = await this.submissionRepository.findById(
      input.submissionId,
    );

    if (!submission) {
      return err("Submission not found");
    }

    return ok(this.toOutput(submission));
  }

  private toOutput(submission: {
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
    createdAt: Date;
    updatedAt: Date;
    group: {
      id: string;
      name: string;
      image: string | null;
      coins: number;
    } | null;
    reviewedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
    } | null;
  }): GetSubmissionOutput {
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
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      group: submission.group,
      reviewedBy: submission.reviewedBy,
    };
  }
}
