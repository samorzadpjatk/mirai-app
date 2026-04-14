import { z } from "zod";
import { Effect, type Layer } from "effect";
import {
  getMyVotesUseCase,
  getVotesByChallengeUseCase,
  getChallengeVotingProgressUseCase,
  getJudgedStaffVotingProgressUseCase,
  submitVoteUseCase,
  submitVotesUseCase,
  forceEndVotingUseCase,
  ChallengeVoteRepositoryTag,
  type VoteDTO,
  type ChallengeVoteDTO,
  type SubmissionVoteCount,
  type AdminVotingInfo,
} from "@mirai-app/use-cases";

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
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * ChallengeVoteController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class ChallengeVoteController {
  constructor(
    private appLayer: Layer.Layer<unknown>,
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

    const effect = getMyVotesUseCase({
      challengeId: parsed.data.challengeId,
      voterId: parsed.data.voterId,
    });
    return await runWithLayer(effect, this.appLayer);
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

    const effect = getVotesByChallengeUseCase({
      challengeId: parsed.data.challengeId,
    });
    return await runWithLayer(effect, this.appLayer);
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

    const effect = getChallengeVotingProgressUseCase({
      challengeId: parsed.data.challengeId,
    });
    return await runWithLayer(effect, this.appLayer);
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

    const effect = getJudgedStaffVotingProgressUseCase({
      challengeId: parsed.data.challengeId,
      tripId: parsed.data.tripId,
      adminParticipantIds: parsed.data.adminParticipantIds,
      requiredPositions: parsed.data.requiredPositions,
      eligibleSubmissionsCount: parsed.data.eligibleSubmissionsCount,
    });
    return await runWithLayer(effect, this.appLayer);
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

    const effect = submitVoteUseCase({
      challengeId: parsed.data.challengeId,
      submissionId: parsed.data.submissionId,
      voterId: parsed.data.voterId,
      position: parsed.data.position,
      points: parsed.data.points,
      normalizedWeight: parsed.data.normalizedWeight,
      allowPartial: parsed.data.allowPartial,
    });
    return await runWithLayer(effect, this.appLayer);
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

    const effect = submitVotesUseCase({
      challengeId: parsed.data.challengeId,
      voterId: parsed.data.voterId,
      votes: parsed.data.votes,
      requiredPositions: parsed.data.requiredPositions,
    });
    return await runWithLayer(effect, this.appLayer);
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

    const effect = forceEndVotingUseCase(
      {
        challengeId: parsed.data.challengeId,
        tripId: parsed.data.tripId,
        adminId: parsed.data.adminId,
      },
      {
        onChallengeCompleted: this.onChallengeCompleted,
      },
    );
    return await runWithLayer(effect, this.appLayer);
  }
}
