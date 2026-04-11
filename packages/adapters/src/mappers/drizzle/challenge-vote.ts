import { ChallengeVote } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type { challengeVotes } from "@mirai-app/frameworks/drizzle/schema/challenge";

/**
 * ChallengeVoteDrizzleMapper
 *
 * Maps between Drizzle database records and domain ChallengeVote entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class ChallengeVoteDrizzleMapper implements DrizzleEntityMapper<
  ChallengeVote,
  typeof challengeVotes.$inferSelect,
  typeof challengeVotes.$inferInsert
> {
  /**
   * Convert a Drizzle ChallengeVote record to a domain entity
   */
  toDomain(record: typeof challengeVotes.$inferSelect): ChallengeVote {
    // Map Drizzle record to ChallengeVote using entity factory
    const result = ChallengeVote.create({
      id: record.id as any, // ChallengeVoteId branded type
      challengeId: record.challengeId,
      submissionId: record.submissionId,
      voterId: record.voterId,
      position:
        record.position === "UPVOTE"
          ? 1
          : record.position === "DOWNVOTE"
            ? -1
            : 0,
      votedAt: record.createdAt,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to map ChallengeVote: ${result.error}`);
    }
    return result.value;
  }

  /**
   * Convert a domain ChallengeVote entity to Drizzle insert input
   */
  toDrizzleInsert(entity: ChallengeVote): typeof challengeVotes.$inferInsert {
    // Map VotePosition (1, 2, 3) to enum ("UPVOTE", "NEUTRAL", "NEUTRAL")
    const positionEnum: "UPVOTE" | "DOWNVOTE" | "NEUTRAL" =
      entity.position.value === 1 ? "UPVOTE" : "NEUTRAL";

    return {
      id: entity.id as string,
      challengeId: entity.challengeId,
      submissionId: entity.submissionId,
      voterId: entity.voterId,
      tripParticipantId: entity.voterId,
      position: positionEnum,
      weight: entity.weight.value,
      isStaffVote: false,
      createdAt: entity.votedAt,
      updatedAt: entity.votedAt,
    };
  }

  /**
   * Convert a domain ChallengeVote entity to Drizzle update input
   */
  toDrizzleUpdate(
    entity: ChallengeVote,
  ): Partial<typeof challengeVotes.$inferInsert> {
    // Map VotePosition (1, 2, 3) to enum ("UPVOTE", "NEUTRAL", "NEUTRAL")
    const positionEnum: "UPVOTE" | "DOWNVOTE" | "NEUTRAL" =
      entity.position.value === 1 ? "UPVOTE" : "NEUTRAL";

    return {
      position: positionEnum,
      weight: entity.weight.value,
      isStaffVote: false,
      updatedAt: new Date(),
    };
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof challengeVotes.$inferSelect>,
  ): Partial<ChallengeVote> {
    return {
      ...(record.id && { id: record.id }),
      ...(record.challengeId && { challengeId: record.challengeId }),
      ...(record.submissionId && { submissionId: record.submissionId }),
      ...(record.voterId && { voterId: record.voterId }),
    } as Partial<ChallengeVote>;
  }

  static readonly instance = new ChallengeVoteDrizzleMapper();
}
