import type { Result } from "@mirai-app/domain";
import { ok, err, SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for ListSubmissionsByChallenge use case
 */
export interface ListSubmissionsByChallengeInput {
  challengeId: string;
  orderBy?: "voteScore" | "createdAt";
  orderDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/**
 * Output DTO for ListSubmissionsByChallenge use case
 */
export interface ListSubmissionsByChallengeOutput {
  submissions: Array<{
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
  }>;
  totalCount: number;
}

/**
 * ListSubmissionsByChallenge Use Case
 *
 * Lists all submissions for a challenge with pagination and sorting.
 */
export class ListSubmissionsByChallengeUseCase {
  constructor(private submissionRepository: ChallengeSubmissionRepository) {}

  async execute(
    input: ListSubmissionsByChallengeInput,
  ): Promise<Result<ListSubmissionsByChallengeOutput, string>> {
    const submissions = await this.submissionRepository.findMany({
      challengeId: input.challengeId,
      orderBy: input.orderBy ?? "voteScore",
      orderDirection: input.orderDirection ?? "desc",
      ...(input.limit !== undefined && { limit: input.limit }),
      ...(input.offset !== undefined && { offset: input.offset }),
    });

    const totalCount = await this.submissionRepository.countByChallengeId(
      input.challengeId,
    );

    return ok({
      submissions: submissions.map((submission) => ({
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
      })),
      totalCount,
    });
  }
}
