import { Effect } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";
import { ChallengeStatus } from "@mirai-app/domain";
import type { ChallengeVote, ChallengeSubmission } from "@mirai-app/domain";

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
 * Error when challenge is not found
 */
export class ForceEndChallengeNotFoundError extends Error {
  readonly _tag = "ForceEndChallengeNotFoundError";
  constructor() {
    super("Challenge not found");
  }
}

/**
 * Error when validation fails
 */
export class ForceEndValidationError extends Error {
  readonly _tag = "ForceEndValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error when challenge is in wrong trip
 */
export class ChallengeWrongTripError extends Error {
  readonly _tag = "ChallengeWrongTripError";
  constructor() {
    super("Challenge not found in trip");
  }
}

/**
 * Error when operation fails
 */
export class ForceEndOperationError extends Error {
  readonly _tag = "ForceEndOperationError";
  constructor(
    public readonly operation: string,
    public override readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

/**
 * Dependencies for ForceEndVoting use case
 */
export interface ForceEndVotingDeps {
  onChallengeCompleted?: (params: {
    challengeId: string;
    tripId: string;
    adminId: string;
  }) => Promise<void>;
}

/**
 * ForceEndVoting Use Case (Effect-based)
 *
 * Forces the end of voting for a judged staff challenge.
 * This is an administrative action that:
 * - Validates the challenge is eligible for forced completion
 * - Recomputes all submission vote scores
 * - Marks the challenge as completed
 */
export function forceEndVotingUseCase(
  input: ForceEndVotingInput,
  deps: ForceEndVotingDeps = {},
): Effect.Effect<
  ForceEndVotingOutput,
  | ForceEndChallengeNotFoundError
  | ForceEndValidationError
  | ChallengeWrongTripError
  | ForceEndOperationError,
  | ChallengeVoteRepositoryTag
  | ChallengeRepositoryTag
  | ChallengeSubmissionRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;
    const challengeRepo = yield* ChallengeRepositoryTag;
    const submissionRepo = yield* ChallengeSubmissionRepositoryTag;

    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return yield* Effect.fail(
        new ForceEndValidationError("Challenge ID is required"),
      );
    }

    if (!input.tripId || input.tripId.trim() === "") {
      return yield* Effect.fail(
        new ForceEndValidationError("Trip ID is required"),
      );
    }

    if (!input.adminId || input.adminId.trim() === "") {
      return yield* Effect.fail(
        new ForceEndValidationError("Admin ID is required"),
      );
    }

    // Fetch challenge
    const challenge = yield* challengeRepo.findById(input.challengeId);

    if (!challenge) {
      return yield* Effect.fail(new ForceEndChallengeNotFoundError());
    }

    // Validate challenge is in correct trip
    if (challenge.tripId !== input.tripId) {
      return yield* Effect.fail(new ChallengeWrongTripError());
    }

    // Validate it's a judged staff challenge
    if (challenge.scoringCategory !== "JUDGED_STAFF") {
      return yield* Effect.fail(
        new ForceEndValidationError(
          "Force end is available only for judged staff challenges",
        ),
      );
    }

    // Validate challenge is not already cancelled or completed
    if (challenge.status === "CANCELLED") {
      return yield* Effect.fail(
        new ForceEndValidationError("Cancelled challenge cannot be finalized"),
      );
    }

    // Get votes for counting
    const votes = yield* voteRepo.findByChallengeId(input.challengeId);

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
        new ForceEndValidationError(
          "Staff voting requires submission end time",
        ),
      );
    }

    const now = new Date();
    if (challenge.endTime.getTime() > now.getTime()) {
      return yield* Effect.fail(
        new ForceEndValidationError(
          "You can force end staff voting only after submission phase ends",
        ),
      );
    }

    // Recompute submission vote scores
    yield* recomputeSubmissionVotes(
      submissionRepo,
      voteRepo,
      input.challengeId,
    );

    // Update challenge status to COMPLETED
    yield* challengeRepo.updateStatus(
      input.challengeId,
      ChallengeStatus.COMPLETED,
    );

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
          new ForceEndOperationError("trigger completion callback", cause),
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

// Helper function for recomputing submission votes
function recomputeSubmissionVotes(
  submissionRepository: {
    findByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<ChallengeSubmission[], never, never>;
    update: (
      submission: ChallengeSubmission,
    ) => Effect.Effect<ChallengeSubmission, never, never>;
  },
  voteRepository: {
    findByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<ChallengeVote[], never, never>;
  },
  challengeId: string,
): Effect.Effect<void, ForceEndOperationError, never> {
  return Effect.gen(function* () {
    // Get all submissions for this challenge
    const submissions =
      yield* submissionRepository.findByChallengeId(challengeId);

    // Get all votes
    const votes = yield* voteRepository.findByChallengeId(challengeId);

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
      yield* submissionRepository.update(updated);
    }
  }).pipe(
    Effect.mapError(
      (cause) =>
        new ForceEndOperationError("recompute submission votes", cause),
    ),
  );
}
