import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

/**
 * Admin voting progress info
 */
export interface AdminVotingInfo {
  participantId: string;
  votedPositions: number[];
  hasVotedAll: boolean;
}

/**
 * Input for GetJudgedStaffVotingProgress use case
 */
export interface GetJudgedStaffVotingProgressInput {
  challengeId: string;
  tripId: string;
  adminParticipantIds: string[];
  requiredPositions: number;
  eligibleSubmissionsCount: number;
}

/**
 * Output DTO for GetJudgedStaffVotingProgress use case
 */
export interface GetJudgedStaffVotingProgressOutput {
  requiredPositions: number;
  eligibleSubmissionsCount: number;
  totalAdmins: number;
  votedAdmins: number;
  pendingAdmins: number;
  allAdminsVoted: boolean;
  adminProgress: AdminVotingInfo[];
}

/**
 * GetJudgedStaffVotingProgress Use Case
 *
 * Calculates the voting progress for judged staff challenges.
 * Tracks which admins have completed their required voting positions.
 */
export class GetJudgedStaffVotingProgressUseCase {
  constructor(private voteRepository: ChallengeVoteRepository) {}

  async execute(
    input: GetJudgedStaffVotingProgressInput,
  ): Promise<Result<GetJudgedStaffVotingProgressOutput, string>> {
    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    if (!input.tripId || input.tripId.trim() === "") {
      return err("tripId is required");
    }

    if (input.requiredPositions <= 0) {
      return err("requiredPositions must be positive");
    }

    const totalAdmins = input.adminParticipantIds.length;

    // Handle case with no admins
    if (totalAdmins === 0) {
      return ok({
        requiredPositions: input.requiredPositions,
        eligibleSubmissionsCount: input.eligibleSubmissionsCount,
        totalAdmins: 0,
        votedAdmins: 0,
        pendingAdmins: 0,
        allAdminsVoted: false,
        adminProgress: [],
      });
    }

    // Get voting progress for each admin
    const adminProgress: AdminVotingInfo[] = [];
    let votedAdmins = 0;

    for (const participantId of input.adminParticipantIds) {
      const votedPositions = await this.voteRepository.getVotedPositions(
        input.challengeId,
        participantId,
      );

      // Check if all required positions are filled
      const hasVotedAll = this.hasAllRequiredPositions(
        votedPositions,
        input.requiredPositions,
      );

      if (hasVotedAll) {
        votedAdmins += 1;
      }

      adminProgress.push({
        participantId,
        votedPositions,
        hasVotedAll,
      });
    }

    const pendingAdmins = Math.max(totalAdmins - votedAdmins, 0);
    const allAdminsVoted =
      input.requiredPositions > 0 &&
      totalAdmins > 0 &&
      votedAdmins >= totalAdmins;

    return ok({
      requiredPositions: input.requiredPositions,
      eligibleSubmissionsCount: input.eligibleSubmissionsCount,
      totalAdmins,
      votedAdmins,
      pendingAdmins,
      allAdminsVoted,
      adminProgress,
    });
  }

  private hasAllRequiredPositions(
    positions: number[],
    requiredPositions: number,
  ): boolean {
    if (requiredPositions <= 0) return false;

    const positionSet = new Set(positions);
    for (let position = 1; position <= requiredPositions; position += 1) {
      if (!positionSet.has(position)) {
        return false;
      }
    }

    return true;
  }
}
