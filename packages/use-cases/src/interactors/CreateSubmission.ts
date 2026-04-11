import type { Result } from "@mirai-app/domain";
import { ok, err, ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for CreateSubmission use case
 */
export interface CreateSubmissionInput {
  challengeId: string;
  groupId: string;
  imageIds?: string[];
  videoId?: string | null;
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Output DTO for CreateSubmission use case
 */
export interface CreateSubmissionOutput {
  id: SubmissionId;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
  createdAt: Date;
}

/**
 * CreateSubmission Use Case
 *
 * Creates a new challenge submission for a group.
 * Returns error if submission already exists for this challenge and group.
 */
export class CreateSubmissionUseCase {
  constructor(private submissionRepository: ChallengeSubmissionRepository) {}

  async execute(
    input: CreateSubmissionInput,
  ): Promise<Result<CreateSubmissionOutput, string>> {
    // Check if submission already exists
    const exists = await this.submissionRepository.existsForChallengeAndGroup(
      input.challengeId,
      input.groupId,
    );
    if (exists) {
      return err("Submission already exists for this challenge and group");
    }

    // Create domain entity
    const submissionResult = ChallengeSubmission.create({
      challengeId: input.challengeId,
      groupId: input.groupId,
      ...(input.imageIds !== undefined && { imageIds: input.imageIds }),
      ...(input.videoId !== undefined && { videoId: input.videoId }),
      ...(input.textContent !== undefined && {
        textContent: input.textContent,
      }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
    });

    if (submissionResult.kind === "err") {
      return err(submissionResult.error.message);
    }

    // Persist submission
    const saved = await this.submissionRepository.create(
      submissionResult.value,
    );

    return ok(this.toOutput(saved));
  }

  private toOutput(submission: ChallengeSubmission): CreateSubmissionOutput {
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
      awardedPoints: submission.awardedPoints,
      bonusPoints: submission.bonusPoints,
      ranking: submission.ranking,
      voteCount: submission.voteCount,
      voteScore: submission.voteScore,
      createdAt: submission.createdAt,
    };
  }
}
