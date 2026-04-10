import type { ChallengeVote } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../gateways/BaseDrizzleRepository";
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
  Partial<typeof challengeVotes.$inferInsert>,
  Partial<typeof challengeVotes.$inferInsert>
> {
  /**
   * Convert a Drizzle ChallengeVote record to a domain entity
   */
  toDomain(record: typeof challengeVotes.$inferSelect): ChallengeVote {
    return {
      id: record.id,
      challengeId: record.challengeId,
      submissionId: record.submissionId,
      voterId: record.voterId,
      position: record.position,
      weight: record.weight,
      isStaffVote: record.isStaffVote,
      votedAt: record.createdAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    } as unknown as ChallengeVote;
  }

  /**
   * Convert a domain ChallengeVote entity to Drizzle insert input
   */
  toDrizzleCreate(
    entity: ChallengeVote,
  ): Partial<typeof challengeVotes.$inferInsert> {
    return {
      id: entity.id as string,
      challengeId: entity.challengeId,
      submissionId: entity.submissionId,
      voterId: entity.voterId,
      tripParticipantId: (entity as any).tripParticipantId ?? entity.voterId,
      position: entity.position as "UPVOTE" | "DOWNVOTE" | "NEUTRAL",
      weight: entity.weight,
      isStaffVote: entity.isStaffVote,
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
    return {
      position: entity.position as "UPVOTE" | "DOWNVOTE" | "NEUTRAL",
      weight: entity.weight,
      isStaffVote: entity.isStaffVote,
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
      ...(record.position && { position: record.position }),
      ...(record.weight !== undefined && { weight: record.weight }),
      ...(record.isStaffVote !== undefined && {
        isStaffVote: record.isStaffVote,
      }),
    };
  }

  static readonly instance = new ChallengeVoteDrizzleMapper();
}
