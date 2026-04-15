import type { ChallengeVoteRepository } from "@mirai-app/domain/ports";
import type { ChallengeVote } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { challengeVotes } from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleGateway } from "../_shared/drizzle-base";

/**
 * DrizzleChallengeVoteGateway
 *
 * Implements the ChallengeVoteRepository port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 */
export class DrizzleChallengeVoteGateway
  extends BaseDrizzleGateway<
    ChallengeVote,
    typeof challengeVotes.$inferSelect,
    typeof challengeVotes.$inferInsert,
    typeof challengeVotes
  >
  implements ChallengeVoteRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: challengeVotes,
      mapper: ChallengeVoteDrizzleMapper.instance,
    });
  }

  /**
   * Create multiple votes in a batch
   */
  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (votes.length === 0) {
          return [];
        }

        const createdRecords = await this.db.transaction(async (tx) => {
          const results: (typeof challengeVotes.$inferSelect)[] = [];
          for (const vote of votes) {
            const positionEnum: "UPVOTE" | "DOWNVOTE" | "NEUTRAL" =
              vote.position.value === 1 ? "UPVOTE" : "NEUTRAL";

            const [inserted] = await tx
              .insert(challengeVotes)
              .values({
                id: vote.id as string,
                challengeId: vote.challengeId,
                submissionId: vote.submissionId,
                voterId: vote.voterId,
                tripParticipantId: vote.voterId,
                position: positionEnum,
                weight: vote.weight.value,
                isStaffVote: false,
                createdAt: vote.votedAt,
                updatedAt: vote.votedAt,
              })
              .returning();
            if (inserted) {
              results.push(inserted);
            }
          }
          return results;
        });

        return createdRecords.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "createMany",
          message: "Failed to create multiple votes",
          cause: error,
        }),
    });
  }

  /**
   * Find all votes for a challenge
   */
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(challengeVotes)
          .where(eq(challengeVotes.challengeId, challengeId))
          .orderBy(asc(challengeVotes.position));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByChallengeId",
          message: "Failed to find votes by challenge ID",
          cause: error,
        }),
    });
  }

  /**
   * Find all votes by a specific voter in a challenge
   */
  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(challengeVotes)
          .where(
            and(
              eq(challengeVotes.challengeId, challengeId),
              eq(challengeVotes.voterId, voterId),
            ),
          )
          .orderBy(asc(challengeVotes.position));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByChallengeAndVoter",
          message: "Failed to find votes by challenge and voter",
          cause: error,
        }),
    });
  }

  /**
   * Find all votes for a specific submission
   */
  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(challengeVotes)
          .where(eq(challengeVotes.submissionId, submissionId))
          .orderBy(asc(challengeVotes.position));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findBySubmissionId",
          message: "Failed to find votes by submission ID",
          cause: error,
        }),
    });
  }

  /**
   * Check if a voter has already voted in a challenge
   */
  hasVoted(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(challengeVotes)
          .where(
            and(
              eq(challengeVotes.challengeId, challengeId),
              eq(challengeVotes.voterId, voterId),
            ),
          )
          .limit(1);

        return (result?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "hasVoted",
          message: "Failed to check if voter has voted",
          cause: error,
        }),
    });
  }

  /**
   * Check if a voter has voted for a specific position in a challenge
   */
  hasVotedForPosition(
    challengeId: string,
    voterId: string,
    position: number,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(challengeVotes)
          .where(
            and(
              eq(challengeVotes.challengeId, challengeId),
              eq(challengeVotes.voterId, voterId),
            ),
          )
          .limit(1);

        return (result?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "hasVotedForPosition",
          message: "Failed to check if voter has voted for position",
          cause: error,
        }),
    });
  }

  /**
   * Get vote positions filled by a voter in a challenge
   */
  getVotedPositions(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<number[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const votes = await this.db
          .select({ position: challengeVotes.position })
          .from(challengeVotes)
          .where(
            and(
              eq(challengeVotes.challengeId, challengeId),
              eq(challengeVotes.voterId, voterId),
            ),
          );

        return votes.map((v) => {
          switch (v.position) {
            case "UPVOTE":
              return 1;
            case "DOWNVOTE":
              return -1;
            default:
              return 0;
          }
        });
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getVotedPositions",
          message: "Failed to get voted positions",
          cause: error,
        }),
    });
  }

  /**
   * Delete all votes for a challenge
   */
  deleteByChallengeId(
    challengeId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .delete(challengeVotes)
          .where(eq(challengeVotes.challengeId, challengeId));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "deleteByChallengeId",
          message: "Failed to delete votes by challenge ID",
          cause: error,
        }),
    });
  }
}
