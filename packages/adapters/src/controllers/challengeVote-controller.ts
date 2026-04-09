import { z } from "zod";
import type { ChallengeVoteRepository } from "@mirai-app/use-cases";
import {
  GetMyVotesUseCase,
  GetVotesByChallengeUseCase,
  GetChallengeVotingProgressUseCase,
  GetJudgedStaffVotingProgressUseCase,
  SubmitVoteUseCase,
  SubmitVotesUseCase,
  ForceEndVotingUseCase,
  type VoteDTO,
  type ChallengeVoteDTO,
  type SubmissionVoteCount,
  type AdminVotingInfo,
} from "@mirai-app/use-cases";

/**
 * Input validation schemas for challenge vote controller
 */
const schemas = {
  getMyVotes: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    voterId: z.string().min(1, "Voter ID is required"),
  }),

  getByChallenge: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
  }),

  getVotingProgress: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
  }),

  getJudgedStaffProgress: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    tripId: z.string().min(1, "Trip ID is required"),
    adminParticipantIds: z
      .array(z.string())
      .min(1, "At least one admin is required"),
    requiredPositions: z.number().int().min(1).max(3),
    eligibleSubmissionsCount: z.number().int().min(0),
  }),

  submitVote: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    submissionId: z.string().min(1, "Submission ID is required"),
    voterId: z.string().min(1, "Voter ID is required"),
    position: z.number().int().min(1).max(3, "Position must be 1, 2, or 3"),
    points: z.number().int().min(0).optional(),
    normalizedWeight: z.number().positive().optional(),
    allowPartial: z.boolean().optional(),
  }),

  submitVotes: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    voterId: z.string().min(1, "Voter ID is required"),
    votes: z
      .array(
        z.object({
          submissionId: z.string().min(1, "Submission ID is required"),
          position: z.number().int().min(1).max(3),
          points: z.number().int().min(0).optional(),
          normalizedWeight: z.number().positive().optional(),
        }),
      )
      .min(1, "At least one vote is required"),
    requiredPositions: z.number().int().min(1).max(3),
  }),

  forceEndVoting: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    tripId: z.string().min(1, "Trip ID is required"),
    adminId: z.string().min(1, "Admin ID is required"),
  }),
};

/**
 * ChallengeVoteController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class ChallengeVoteController {
  constructor(
    private voteRepository: ChallengeVoteRepository,
    private challengeRepository?: {
      findById(id: string): Promise<{
        id: string;
        tripId: string;
        status: string;
        scoringCategory: string;
        endTime: Date | null;
      } | null>;
      updateStatus(id: string, status: string): Promise<void>;
    },
    private submissionRepository?: {
      findByChallengeId(challengeId: string): Promise<
        Array<{
          id: string;
          challengeId: string;
          status: string;
        }>
      >;
      updateVoteStats(
        submissionId: string,
        stats: { voteCount: number; voteScore: number },
      ): Promise<void>;
    },
    private onChallengeCompleted?: (params: {
      challengeId: string;
      tripId: string;
      adminId: string;
    }) => Promise<void>,
  ) {}

  /**
   * Get my votes for a challenge
   */
  async getMyVotes(input: unknown): Promise<
    | {
        success: true;
        data: {
          votes: VoteDTO[];
          totalVotes: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getMyVotes.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetMyVotesUseCase(this.voteRepository);
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      voterId: parsed.data.voterId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get all votes for a challenge (moderator/admin view)
   */
  async getByChallenge(input: unknown): Promise<
    | {
        success: true;
        data: {
          votes: ChallengeVoteDTO[];
          totalVotes: number;
          uniqueVoters: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByChallenge.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetVotesByChallengeUseCase(this.voteRepository);
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get voting progress for a challenge
   */
  async getVotingProgress(input: unknown): Promise<
    | {
        success: true;
        data: {
          challengeId: string;
          totalVotes: number;
          submissionStats: SubmissionVoteCount[];
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getVotingProgress.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetChallengeVotingProgressUseCase(this.voteRepository);
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get judged staff voting progress
   */
  async getJudgedStaffProgress(input: unknown): Promise<
    | {
        success: true;
        data: {
          requiredPositions: number;
          eligibleSubmissionsCount: number;
          totalAdmins: number;
          votedAdmins: number;
          pendingAdmins: number;
          allAdminsVoted: boolean;
          adminProgress: AdminVotingInfo[];
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getJudgedStaffProgress.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetJudgedStaffVotingProgressUseCase(
      this.voteRepository,
    );
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      tripId: parsed.data.tripId,
      adminParticipantIds: parsed.data.adminParticipantIds,
      requiredPositions: parsed.data.requiredPositions,
      eligibleSubmissionsCount: parsed.data.eligibleSubmissionsCount,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Submit a single vote
   */
  async submitVote(input: unknown): Promise<
    | {
        success: true;
        data: VoteDTO;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.submitVote.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new SubmitVoteUseCase(this.voteRepository);
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      submissionId: parsed.data.submissionId,
      voterId: parsed.data.voterId,
      position: parsed.data.position,
      points: parsed.data.points,
      normalizedWeight: parsed.data.normalizedWeight,
      allowPartial: parsed.data.allowPartial,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Submit multiple votes (batch)
   */
  async submitVotes(input: unknown): Promise<
    | {
        success: true;
        data: {
          votes: VoteDTO[];
          totalVotesCast: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.submitVotes.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new SubmitVotesUseCase(this.voteRepository);
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      voterId: parsed.data.voterId,
      votes: parsed.data.votes,
      requiredPositions: parsed.data.requiredPositions,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Force end voting for a judged staff challenge
   */
  async forceEndVoting(input: unknown): Promise<
    | {
        success: true;
        data: {
          success: boolean;
          finalized: boolean;
          challengeId: string;
          challengeStatus: "COMPLETED";
          totalVotes: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.forceEndVoting.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    if (!this.challengeRepository || !this.submissionRepository) {
      return {
        success: false,
        error: "Required repositories not provided",
      };
    }

    const useCase = new ForceEndVotingUseCase(
      this.voteRepository,
      this.challengeRepository,
      this.submissionRepository,
      this.onChallengeCompleted,
    );

    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      tripId: parsed.data.tripId,
      adminId: parsed.data.adminId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }
}
