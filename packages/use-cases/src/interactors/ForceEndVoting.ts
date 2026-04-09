import { Effect } from "effect";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";
import {
  UseCaseNotFoundError,
  UseCaseConflictError,
  UseCaseValidationError,
  UseCaseRepositoryError,
  type UseCaseError,
} from "../errors";

/**
 * Input for ForceEndVoting use case
 */
export interface ForceEndVotingInput {
  challengeId: string;
  tripId: string;
  adminId: string;
}

/**
 * Output DTO for ForceEndVoting use case
 */
export interface ForceEndVotingOutput {
  success: boolean;
  finalized: boolean;
  challengeId: string;
  challengeStatus: "COMPLETED";
  totalVotes: number;
}

/**
 * ForceEndVoting Use Case
 *
 * Forces the end of voting for a judged staff challenge.
 * This is an administrative action that:
 * - Validates the challenge is eligible for forced completion
 * - Recomputes all submission vote scores
 * - Marks the challenge as completed
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new ForceEndVotingUseCase(
 *   voteRepo,
 *   challengeRepo,
 *   submissionRepo,
 *   onChallengeCompleted
 * );
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("forceEndVotingUseCase");
 * ```
 */
export class ForceEndVotingUseCase {
  constructor(
    private voteRepository: ChallengeVoteRepository,
    private challengeRepository: ChallengeRepository,
    private submissionRepository: ChallengeSubmissionRepository,
    private onChallengeCompleted?: (params: {
      challengeId: string;
      tripId: string;
      adminId: string;
    }) => Promise<void>,
  ) {}

  execute(
    input: ForceEndVotingInput,
  ): Effect.Effect<ForceEndVotingOutput, UseCaseError> {
    const voteRepository = this.voteRepository;
    const challengeRepository = this.challengeRepository;
    const submissionRepository = this.submissionRepository;
    const onChallengeCompleted = this.onChallengeCompleted;

    return Effect.gen(function* () {
      // Validate input
      if (!input.challengeId || input.challengeId.trim() === "") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "challengeId",
            message: "challengeId is required",
          }),
        );
      }

      if (!input.tripId || input.tripId.trim() === "") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "tripId",
            message: "tripId is required",
          }),
        );
      }

      if (!input.adminId || input.adminId.trim() === "") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "adminId",
            message: "adminId is required",
          }),
        );
      }

      // Fetch challenge
      const challenge = yield* Effect.tryPromise({
        try: () => challengeRepository.findById(input.challengeId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.findById",
            message: "Failed to load challenge",
            cause,
          }),
      });

      if (!challenge) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Challenge",
            message: "Challenge not found",
          }),
        );
      }

      // Validate challenge is in correct trip
      if (challenge.tripId !== input.tripId) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Challenge",
            message: "Challenge not found in trip",
          }),
        );
      }

      // Validate it's a judged staff challenge
      if (challenge.scoringCategory !== "JUDGED_STAFF") {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Challenge",
            message: "Force end is available only for judged staff challenges",
          }),
        );
      }

      // Validate challenge is not already cancelled or completed
      if (challenge.status === "CANCELLED") {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Challenge",
            message: "Cancelled challenge cannot be finalized",
          }),
        );
      }

      // Get votes for counting
      const votes = yield* Effect.tryPromise({
        try: () => voteRepository.findByChallengeId(input.challengeId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.findByChallengeId",
            message: "Failed to load votes",
            cause,
          }),
      });

      if (challenge.status === "COMPLETED") {
        // Already completed, treat as success but not finalized
        return {
          success: true,
          finalized: false,
          challengeId: input.challengeId,
          challengeStatus: "COMPLETED" as const,
          totalVotes: votes.length,
        };
      }

      // Validate submission phase has ended
      if (!challenge.endTime) {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "endTime",
            message: "Staff voting requires submission end time",
          }),
        );
      }

      const now = new Date();
      if (challenge.endTime.getTime() > now.getTime()) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Challenge",
            message:
              "You can force end staff voting only after submission phase ends",
          }),
        );
      }

      // Recompute submission vote scores
      yield* Effect.tryPromise({
        try: () =>
          recomputeSubmissionVotes(
            submissionRepository,
            voteRepository,
            input.challengeId,
          ),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.recomputeSubmissionVotes",
            message: "Failed to recompute submission votes",
            cause,
          }),
      });

      // Update challenge status to COMPLETED
      yield* Effect.tryPromise({
        try: () =>
          challengeRepository.updateStatus(input.challengeId, "COMPLETED"),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.updateStatus",
            message: "Failed to update challenge status",
            cause,
          }),
      });

      // Trigger completion callback if provided (for activity feed, etc.)
      if (onChallengeCompleted) {
        yield* Effect.tryPromise({
          try: () =>
            onChallengeCompleted({
              challengeId: input.challengeId,
              tripId: input.tripId,
              adminId: input.adminId,
            }),
          catch: (cause) =>
            new UseCaseRepositoryError({
              operation: "ForceEndVoting.onChallengeCompleted",
              message: "Failed to trigger completion callback",
              cause,
            }),
        });
      }

      return {
        success: true,
        finalized: true,
        challengeId: input.challengeId,
        challengeStatus: "COMPLETED" as const,
        totalVotes: votes.length,
      };
    });
  }
}

// Helper function extracted for clarity and testability
async function recomputeSubmissionVotes(
  submissionRepository: ChallengeSubmissionRepository,
  voteRepository: ChallengeVoteRepository,
  challengeId: string,
): Promise<void> {
  // Get all submissions for this challenge
  const submissions = await submissionRepository.findByChallengeId(challengeId);

  // Get all votes
  const votes = await voteRepository.findByChallengeId(challengeId);

  // Calculate vote stats per submission
  const tally = new Map<string, { count: number; score: number }>();
  for (const vote of votes) {
    const current = tally.get(vote.submissionId) ?? { count: 0, score: 0 };
    current.count += 1;
    current.score += vote.getWeightedScore();
    tally.set(vote.submissionId, current);
  }

  // Update each submission with computed stats
  for (const submission of submissions) {
    const stats = tally.get(submission.id) ?? { count: 0, score: 0 };
    const updated = submission.updateVoteStats({
      voteCount: stats.count,
      voteScore: stats.score,
    });
    await submissionRepository.update(updated);
  }
}

/**
 * Output DTO for ForceEndVoting use case
 */
export interface ForceEndVotingOutput {
  success: boolean;
  finalized: boolean;
  challengeId: string;
  challengeStatus: "COMPLETED";
  totalVotes: number;
}

/**
 * Dependencies for ForceEndVoting use case
 */
export interface ForceEndVotingDependencies {
  voteRepository: ChallengeVoteRepository;
  challengeRepository: {
    findById(id: string): Promise<{
      id: string;
      tripId: string;
      status: string;
      scoringCategory: string;
      endTime: Date | null;
    } | null>;
    updateStatus(id: string, status: string): Promise<void>;
  };
  submissionRepository: {
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
  };
  onChallengeCompleted?: (params: {
    challengeId: string;
    tripId: string;
    adminId: string;
  }) => Promise<void>;
}

/**
 * ForceEndVoting Use Case
 *
 * Forces the end of voting for a judged staff challenge.
 * This is an administrative action that:
 * - Validates the challenge is eligible for forced completion
 * - Recomputes all submission vote scores
 * - Marks the challenge as completed
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new ForceEndVotingUseCase(deps);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("forceEndVotingUseCase");
 * ```
 */
export class ForceEndVotingUseCase {
  constructor(private deps: ForceEndVotingDependencies) {}

  execute(
    input: ForceEndVotingInput,
  ): Effect.Effect<ForceEndVotingOutput, UseCaseError> {
    const deps = this.deps;

    return Effect.gen(function* () {
      // Validate input
      if (!input.challengeId || input.challengeId.trim() === "") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "challengeId",
            message: "challengeId is required",
          }),
        );
      }

      if (!input.tripId || input.tripId.trim() === "") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "tripId",
            message: "tripId is required",
          }),
        );
      }

      if (!input.adminId || input.adminId.trim() === "") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "adminId",
            message: "adminId is required",
          }),
        );
      }

      // Fetch challenge
      const challenge = yield* Effect.tryPromise({
        try: () => deps.challengeRepository.findById(input.challengeId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.findById",
            message: "Failed to load challenge",
            cause,
          }),
      });

      if (!challenge) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Challenge",
            message: "Challenge not found",
          }),
        );
      }

      // Validate challenge is in correct trip
      if (challenge.tripId !== input.tripId) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Challenge",
            message: "Challenge not found in trip",
          }),
        );
      }

      // Validate it's a judged staff challenge
      if (challenge.scoringCategory !== "JUDGED_STAFF") {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Challenge",
            message: "Force end is available only for judged staff challenges",
          }),
        );
      }

      // Validate challenge is not already cancelled or completed
      if (challenge.status === "CANCELLED") {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Challenge",
            message: "Cancelled challenge cannot be finalized",
          }),
        );
      }

      // Get votes for counting
      const votes = yield* Effect.tryPromise({
        try: () => deps.voteRepository.findByChallengeId(input.challengeId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.findByChallengeId",
            message: "Failed to load votes",
            cause,
          }),
      });

      if (challenge.status === "COMPLETED") {
        // Already completed, treat as success but not finalized
        return {
          success: true,
          finalized: false,
          challengeId: input.challengeId,
          challengeStatus: "COMPLETED" as const,
          totalVotes: votes.length,
        };
      }

      // Validate submission phase has ended
      if (!challenge.endTime) {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "endTime",
            message: "Staff voting requires submission end time",
          }),
        );
      }

      const now = new Date();
      if (challenge.endTime.getTime() > now.getTime()) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Challenge",
            message:
              "You can force end staff voting only after submission phase ends",
          }),
        );
      }

      // Recompute submission vote scores
      yield* Effect.tryPromise({
        try: () => recomputeSubmissionVotes(deps, input.challengeId, votes),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.recomputeSubmissionVotes",
            message: "Failed to recompute submission votes",
            cause,
          }),
      });

      // Update challenge status to COMPLETED
      yield* Effect.tryPromise({
        try: () =>
          deps.challengeRepository.updateStatus(input.challengeId, "COMPLETED"),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "ForceEndVoting.updateStatus",
            message: "Failed to update challenge status",
            cause,
          }),
      });

      // Trigger completion callback if provided (for activity feed, etc.)
      if (deps.onChallengeCompleted) {
        yield* Effect.tryPromise({
          try: () =>
            deps.onChallengeCompleted!({
              challengeId: input.challengeId,
              tripId: input.tripId,
              adminId: input.adminId,
            }),
          catch: (cause) =>
            new UseCaseRepositoryError({
              operation: "ForceEndVoting.onChallengeCompleted",
              message: "Failed to trigger completion callback",
              cause,
            }),
        });
      }

      return {
        success: true,
        finalized: true,
        challengeId: input.challengeId,
        challengeStatus: "COMPLETED" as const,
        totalVotes: votes.length,
      };
    });
  }
}

// Helper function extracted for clarity and testability
async function recomputeSubmissionVotes(
  deps: ForceEndVotingDependencies,
  challengeId: string,
  votes: Array<{ submissionId: string; getWeightedScore(): number }>,
): Promise<void> {
  // Get all submissions for this challenge
  const submissions =
    await deps.submissionRepository.findByChallengeId(challengeId);

  // Calculate vote stats per submission
  const tally = new Map<string, { count: number; score: number }>();
  for (const vote of votes) {
    const current = tally.get(vote.submissionId) ?? { count: 0, score: 0 };
    current.count += 1;
    current.score += vote.getWeightedScore();
    tally.set(vote.submissionId, current);
  }

  // Update each submission with computed stats
  for (const submission of submissions) {
    const stats = tally.get(submission.id) ?? { count: 0, score: 0 };
    await deps.submissionRepository.updateVoteStats(submission.id, {
      voteCount: stats.count,
      voteScore: stats.score,
    });
  }
}
