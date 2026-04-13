import { z } from "zod";
import { Effect } from "effect";
import type {
  ChallengeVoteRepository,
  ChallengeRepository,
  ChallengeSubmissionRepository,
} from "@mirai-app/use-cases";
import {
  getMyVotesUseCase,
  getVotesByChallengeUseCase,
  getChallengeVotingProgressUseCase,
  getJudgedStaffVotingProgressUseCase,
  submitVoteUseCase,
  submitVotesUseCase,
  forceEndVotingUseCase,
  ChallengeVoteRepositoryTag,
  ChallengeRepositoryTag,
  ChallengeSubmissionRepositoryTag,
  type VoteDTO,
  type ChallengeVoteDTO,
  type SubmissionVoteCount,
  type AdminVotingInfo,
} from "@mirai-app/use-cases";
import {
  toEffectChallengeVoteRepository,
  toEffectChallengeRepository,
  toEffectChallengeSubmissionRepository,
  effectToControllerResult,
} from "../utils/controller-helpers";

/**
 * Event payload for challenge completion callback
 */
interface ChallengeCompletedEvent {
  challengeId: string;
  tripId: string;
  adminId: string;
}

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
    private challengeRepository: ChallengeRepository,
    private submissionRepository: ChallengeSubmissionRepository,
    private onChallengeCompleted: (
      params: ChallengeCompletedEvent,
    ) => Promise<void>,
  ) {}

  /**
   * Get my votes for a challenge
   */
  async getMyVotes(input: unknown) {
    const parsed = schemas.getMyVotes.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectChallengeVoteRepository(this.voteRepository);
    const effect = getMyVotesUseCase({
      challengeId: parsed.data.challengeId,
      voterId: parsed.data.voterId,
    }).pipe(Effect.provideService(ChallengeVoteRepositoryTag, effectRepo));
    return await effectToControllerResult(effect);
  }

  /**
   * Get all votes for a challenge (moderator/admin view)
   */
  async getByChallenge(input: unknown) {
    const parsed = schemas.getByChallenge.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectChallengeVoteRepository(this.voteRepository);
    const effect = getVotesByChallengeUseCase({
      challengeId: parsed.data.challengeId,
    }).pipe(Effect.provideService(ChallengeVoteRepositoryTag, effectRepo));
    return await effectToControllerResult(effect);
  }

  /**
   * Get voting progress for a challenge
   */
  async getVotingProgress(input: unknown) {
    const parsed = schemas.getVotingProgress.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectChallengeVoteRepository(this.voteRepository);
    const effect = getChallengeVotingProgressUseCase({
      challengeId: parsed.data.challengeId,
    }).pipe(Effect.provideService(ChallengeVoteRepositoryTag, effectRepo));
    return await effectToControllerResult(effect);
  }

  /**
   * Get judged staff voting progress
   */
  async getJudgedStaffProgress(input: unknown) {
    const parsed = schemas.getJudgedStaffProgress.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectChallengeVoteRepository(this.voteRepository);
    const effect = getJudgedStaffVotingProgressUseCase({
      challengeId: parsed.data.challengeId,
      tripId: parsed.data.tripId,
      adminParticipantIds: parsed.data.adminParticipantIds,
      requiredPositions: parsed.data.requiredPositions,
      eligibleSubmissionsCount: parsed.data.eligibleSubmissionsCount,
    }).pipe(Effect.provideService(ChallengeVoteRepositoryTag, effectRepo));
    return await effectToControllerResult(effect);
  }

  /**
   * Submit a single vote
   */
  async submitVote(input: unknown) {
    const parsed = schemas.submitVote.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectChallengeVoteRepository(this.voteRepository);
    const effect = submitVoteUseCase({
      challengeId: parsed.data.challengeId,
      submissionId: parsed.data.submissionId,
      voterId: parsed.data.voterId,
      position: parsed.data.position,
      points: parsed.data.points,
      normalizedWeight: parsed.data.normalizedWeight,
      allowPartial: parsed.data.allowPartial,
    }).pipe(Effect.provideService(ChallengeVoteRepositoryTag, effectRepo));
    return await effectToControllerResult(effect);
  }

  /**
   * Submit multiple votes (batch)
   */
  async submitVotes(input: unknown) {
    const parsed = schemas.submitVotes.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectChallengeVoteRepository(this.voteRepository);
    const effect = submitVotesUseCase({
      challengeId: parsed.data.challengeId,
      voterId: parsed.data.voterId,
      votes: parsed.data.votes,
      requiredPositions: parsed.data.requiredPositions,
    }).pipe(Effect.provideService(ChallengeVoteRepositoryTag, effectRepo));
    return await effectToControllerResult(effect);
  }

  /**
   * Force end voting for a judged staff challenge
   */
  async forceEndVoting(input: unknown) {
    const parsed = schemas.forceEndVoting.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const voteRepo = toEffectChallengeVoteRepository(this.voteRepository);
    const challengeRepo = toEffectChallengeRepository(this.challengeRepository);
    const submissionRepo = toEffectChallengeSubmissionRepository(
      this.submissionRepository,
    );

    const effect = forceEndVotingUseCase(
      {
        challengeId: parsed.data.challengeId,
        tripId: parsed.data.tripId,
        adminId: parsed.data.adminId,
      },
      {
        onChallengeCompleted: this.onChallengeCompleted,
      },
    ).pipe(
      Effect.provideService(ChallengeVoteRepositoryTag, voteRepo),
      Effect.provideService(ChallengeRepositoryTag, challengeRepo),
      Effect.provideService(ChallengeSubmissionRepositoryTag, submissionRepo),
    );
    return await effectToControllerResult(effect);
  }
}
