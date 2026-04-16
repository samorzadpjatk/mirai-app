import { ChallengeVote } from "@mirai-app/domain";
import { Effect } from "effect";
import type { ChallengeVoteDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type { challengeVotes } from "@mirai-app/frameworks/drizzle/schema";

/**
 * ChallengeVoteDrizzleMapper
 *
 * Maps between Drizzle database records and ChallengeVoteDTOs.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 *
 * Note: This mapper returns ChallengeVoteDTO instead of domain entities
 * to follow the DTO pattern established by UserGateway.
 */
export class ChallengeVoteDrizzleMapper implements DrizzleEntityMapper<
  ChallengeVoteDTO,
  typeof challengeVotes.$inferSelect,
  typeof challengeVotes.$inferInsert
> {
  /**
   * Convert a Drizzle ChallengeVote record to a ChallengeVoteDTO
   *
   * Note: This implements the DrizzleEntityMapper interface which expects toDomain,
   * but we return DTOs instead of domain entities following the UserGateway pattern.
   */
  toDomain(record: typeof challengeVotes.$inferSelect): ChallengeVoteDTO {
    return this.toDTO(record);
  }

  /**
   * Convert a Drizzle ChallengeVote record to a ChallengeVoteDTO
   */
  toDTO(record: typeof challengeVotes.$inferSelect): ChallengeVoteDTO {
    // Map position enum to numeric value
    const votePosition =
      record.position === "UPVOTE"
        ? 1
        : record.position === "DOWNVOTE"
          ? -1
          : 0;

    return {
      id: record.id,
      challengeId: record.challengeId,
      submissionId: record.submissionId,
      voterId: record.voterId,
      votePosition: votePosition,
      votePoints: this.calculatePoints(votePosition),
      normalizedWeight: record.weight,
      votedAt: record.createdAt,
    };
  }

  /**
   * Convert a Drizzle ChallengeVote record to a domain ChallengeVote entity
   */
  toEntity(record: typeof challengeVotes.$inferSelect): ChallengeVote {
    const effect = ChallengeVote.create({
      id: record.id as any,
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

    const exit = Effect.runSyncExit(effect);

    if (exit._tag === "Failure") {
      throw new Error(
        `Failed to map ChallengeVote from Drizzle: ${exit.cause}`,
      );
    }

    return exit.value;
  }

  /**
   * Convert a ChallengeVoteDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: ChallengeVoteDTO): typeof challengeVotes.$inferInsert {
    const positionEnum: "UPVOTE" | "DOWNVOTE" | "NEUTRAL" =
      dto.votePosition === 1 ? "UPVOTE" : "NEUTRAL";

    return {
      id: dto.id,
      challengeId: dto.challengeId,
      submissionId: dto.submissionId,
      voterId: dto.voterId,
      tripParticipantId: dto.voterId,
      position: positionEnum,
      weight: dto.normalizedWeight,
      isStaffVote: false,
      createdAt: dto.votedAt,
      updatedAt: dto.votedAt,
    };
  }

  /**
   * Convert a ChallengeVoteDTO to Drizzle update input
   */
  toDrizzleUpdate(
    dto: ChallengeVoteDTO,
  ): Partial<typeof challengeVotes.$inferInsert> {
    const positionEnum: "UPVOTE" | "DOWNVOTE" | "NEUTRAL" =
      dto.votePosition === 1 ? "UPVOTE" : "NEUTRAL";

    return {
      position: positionEnum,
      weight: dto.normalizedWeight,
      isStaffVote: false,
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate points based on vote position
   */
  private calculatePoints(position: number): number {
    switch (position) {
      case 1:
        return 3;
      case 2:
        return 2;
      case 3:
        return 1;
      default:
        return 0;
    }
  }

  static readonly instance = new ChallengeVoteDrizzleMapper();
}
