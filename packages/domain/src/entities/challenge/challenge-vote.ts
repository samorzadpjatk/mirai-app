import { Effect } from "effect";
import type { ChallengeVoteId } from "../../value-objects/ChallengeVoteId";
import { VotePosition } from "../../value-objects/VotePosition";
import { VoteWeight } from "../../value-objects/VoteWeight";
import { ValidationError } from "../../errors";

/**
 * ChallengeVote entity - represents a single vote cast in a challenge
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class ChallengeVote {
  private constructor(
    public readonly id: ChallengeVoteId,
    public readonly challengeId: string,
    public readonly submissionId: string,
    public readonly voterId: string,
    public readonly position: VotePosition,
    public readonly points: number,
    public readonly weight: VoteWeight,
    public readonly votedAt: Date,
  ) {}

  /**
   * Factory method to create a new ChallengeVote
   * Validates all input data
   *
   * Note: This is synchronous. The ID must be provided or generated externally.
   * Use createWithGeneratedId for automatic ID generation.
   */
  static create(props: {
    id?: ChallengeVoteId;
    challengeId: string;
    submissionId: string;
    voterId: string;
    position: number;
    points?: number;
    weight?: number;
    votedAt?: Date;
  }): Effect.Effect<ChallengeVote, ValidationError, never> {
    return Effect.gen(function* () {
      if (!props.challengeId || props.challengeId.trim() === "") {
        return yield* Effect.fail(ValidationError.required("challengeId"));
      }

      if (!props.submissionId || props.submissionId.trim() === "") {
        return yield* Effect.fail(ValidationError.required("submissionId"));
      }

      if (!props.voterId || props.voterId.trim() === "") {
        return yield* Effect.fail(ValidationError.required("voterId"));
      }

      const position = yield* VotePosition.create(props.position);

      const points = props.points ?? position.toPoints();
      if (points < 0) {
        return yield* Effect.fail(ValidationError.minValue("points", 0));
      }

      const weight =
        props.weight !== undefined
          ? yield* VoteWeight.create(props.weight)
          : VoteWeight.default();

      const id: ChallengeVoteId =
        props.id ?? (crypto.randomUUID() as ChallengeVoteId);

      return new ChallengeVote(
        id,
        props.challengeId.trim(),
        props.submissionId.trim(),
        props.voterId.trim(),
        position,
        points,
        weight,
        props.votedAt ?? new Date(),
      );
    });
  }

  /**
   * Get the weighted score for this vote
   * score = points * weight
   */
  getWeightedScore(): number {
    return this.weight.applyTo(this.points);
  }

  /**
   * Check if this vote is for a specific submission
   */
  isForSubmission(submissionId: string): boolean {
    return this.submissionId === submissionId;
  }

  /**
   * Check if this vote was cast by a specific voter
   */
  isCastBy(voterId: string): boolean {
    return this.voterId === voterId;
  }

  /**
   * Check if this vote is for a specific challenge
   */
  isForChallenge(challengeId: string): boolean {
    return this.challengeId === challengeId;
  }

  /**
   * Check if this vote has the default weight (1.0)
   */
  hasDefaultWeight(): boolean {
    return this.weight.isDefault();
  }

  /**
   * Get position as a readable string (1st, 2nd, 3rd)
   */
  getPositionDisplay(): string {
    switch (this.position.value) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      default:
        return `${this.position.value}th`;
    }
  }
}

/**
 * Vote validation result for batch vote operations
 */
export interface VoteValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a set of votes for a single challenge
 * Ensures:
 * - All positions are unique
 * - All submissions are unique
 * - Required positions are filled (1..n where n is requiredPositions)
 * - No position exceeds required positions
 */
export function validateVoteSet(
  votes: Array<{ submissionId: string; position: number }>,
  requiredPositions: number,
): VoteValidationResult {
  // Check for unique submission IDs
  const uniqueSubmissionIds = new Set(votes.map((v) => v.submissionId));
  if (uniqueSubmissionIds.size !== votes.length) {
    return {
      isValid: false,
      error: "Cannot vote multiple times on the same submission",
    };
  }

  // Check for unique positions
  const uniquePositions = new Set(votes.map((v) => v.position));
  if (uniquePositions.size !== votes.length) {
    return {
      isValid: false,
      error: "Vote positions must be unique",
    };
  }

  // Check that no position exceeds required positions first
  for (const vote of votes) {
    if (vote.position > requiredPositions) {
      return {
        isValid: false,
        error: `Position ${vote.position} exceeds maximum allowed position (${requiredPositions})`,
      };
    }
  }

  // Check that all required positions are filled
  const requiredPositionSet = new Set<number>();
  for (let i = 1; i <= requiredPositions; i++) {
    requiredPositionSet.add(i);
  }

  for (const vote of votes) {
    requiredPositionSet.delete(vote.position);
  }

  if (requiredPositionSet.size > 0) {
    const missing = Array.from(requiredPositionSet).sort().join(", ");
    return {
      isValid: false,
      error: `Required positions not filled: ${missing}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate vote statistics from a collection of votes
 */
export function calculateVoteStats(votes: ChallengeVote[]): {
  totalVotes: number;
  totalScore: number;
  averageScore: number;
} {
  const totalVotes = votes.length;
  const totalScore = votes.reduce(
    (sum, vote) => sum + vote.getWeightedScore(),
    0,
  );
  const averageScore = totalVotes > 0 ? totalScore / totalVotes : 0;

  return {
    totalVotes,
    totalScore,
    averageScore,
  };
}
