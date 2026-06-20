import type { ChallengeVote } from "@mirai-app/db/schema";

export interface ChallengeVoteInput {
  submissionId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight?: number;
}

/**
 * Builds the database insert values for challenge votes.
 */
export function buildVoteInsertValues(
  votes: ChallengeVoteInput[],
  challengeId: string,
  voterId: string,
): Omit<ChallengeVote, "id" | "votedAt" | "createdAt" | "updatedAt">[] {
  return votes.map((vote) => ({
    challengeId,
    submissionId: vote.submissionId,
    voterId,
    votePosition: vote.votePosition,
    votePoints: vote.votePoints,
    normalizedWeight: vote.normalizedWeight ?? 1.0,
  }));
}

/**
 * Tallies votes by submissionId, returning count and weighted score.
 */
export function tallyVotes(
  votes: { submissionId: string; votePoints: number; normalizedWeight: number }[],
): Map<string, { count: number; score: number }> {
  const tally = new Map<string, { count: number; score: number }>();

  for (const vote of votes) {
    const current = tally.get(vote.submissionId) ?? { count: 0, score: 0 };
    current.count += 1;
    current.score += vote.votePoints * vote.normalizedWeight;
    tally.set(vote.submissionId, current);
  }

  return tally;
}

/**
 * Computes the required number of vote positions from eligible submissions count.
 */
export function computeRequiredPositions(eligibleSubmissionsCount: number): number {
  return eligibleSubmissionsCount >= 2 ? Math.min(3, eligibleSubmissionsCount) : 0;
}

/**
 * Checks if all required positions (1..requiredPositions) are present in the set.
 */
export function hasAllRequiredPositions(
  positions: Set<number>,
  requiredPositions: number,
): boolean {
  if (requiredPositions <= 0) return false;

  for (let position = 1; position <= requiredPositions; position += 1) {
    if (!positions.has(position)) {
      return false;
    }
  }

  return true;
}
