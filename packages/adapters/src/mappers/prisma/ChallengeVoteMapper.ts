import {
  ChallengeVote,
  ChallengeVoteId,
  VotePosition,
  VoteWeight,
} from "@mirai-app/domain";

/**
 * ChallengeVoteMapper
 *
 * Maps between Prisma database records and domain ChallengeVote entities.
 * This is a pure function with no side effects.
 */
export class ChallengeVoteMapper {
  /**
   * Convert a Prisma ChallengeVote record to a domain ChallengeVote entity
   */
  static toDomain(record: {
    id: string;
    challengeId: string;
    submissionId: string;
    voterId: string;
    votePosition: number;
    votePoints: number;
    normalizedWeight: number;
    votedAt: Date;
  }): ChallengeVote {
    const result = ChallengeVote.create({
      id: ChallengeVoteId.unsafeCreate(record.id),
      challengeId: record.challengeId,
      submissionId: record.submissionId,
      voterId: record.voterId,
      position: record.votePosition,
      points: record.votePoints,
      weight: record.normalizedWeight,
      votedAt: record.votedAt,
    });

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(
        `Failed to map ChallengeVote from database: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain ChallengeVote entity to Prisma create input
   */
  static toPrismaCreate(vote: ChallengeVote): {
    id: string;
    challengeId: string;
    submissionId: string;
    voterId: string;
    votePosition: number;
    votePoints: number;
    normalizedWeight: number;
    votedAt: Date;
  } {
    return {
      id: vote.id as string,
      challengeId: vote.challengeId,
      submissionId: vote.submissionId,
      voterId: vote.voterId,
      votePosition: vote.position.value,
      votePoints: vote.points,
      normalizedWeight: vote.weight.value,
      votedAt: vote.votedAt,
    };
  }

  /**
   * Convert a domain ChallengeVote entity to Prisma update input
   * Note: Votes are immutable in this system, but this is provided for completeness
   */
  static toPrismaUpdate(vote: ChallengeVote): {
    votePosition: number;
    votePoints: number;
    normalizedWeight: number;
  } {
    return {
      votePosition: vote.position.value,
      votePoints: vote.points,
      normalizedWeight: vote.weight.value,
    };
  }
}
