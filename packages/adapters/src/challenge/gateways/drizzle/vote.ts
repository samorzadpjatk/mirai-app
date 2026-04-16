import type {
  ChallengeVoteGateway,
  ChallengeVoteDTO,
  ChallengeVoteConnectionArgs,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { challengeVotes } from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError, type Connection } from "@mirai-app/domain";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { ChallengeVoteDrizzleMapper } from "../../../challenge/mappers/drizzle/vote-mapper";

/**
 * DrizzleChallengeVoteGateway
 *
 * Implements the ChallengeVoteGateway port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 * Returns ChallengeVoteDTOs instead of domain entities.
 */
export class DrizzleChallengeVoteGateway
  extends BaseDrizzleGateway<
    ChallengeVoteDTO,
    typeof challengeVotes.$inferSelect,
    typeof challengeVotes.$inferInsert,
    typeof challengeVotes
  >
  implements ChallengeVoteGateway
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
    votes: ChallengeVoteDTO[],
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (votes.length === 0) {
          return [];
        }

        const createdRecords = await this.db.transaction(async (tx) => {
          const results: (typeof challengeVotes.$inferSelect)[] = [];
          for (const vote of votes) {
            const positionEnum: "UPVOTE" | "DOWNVOTE" | "NEUTRAL" =
              vote.votePosition === 1 ? "UPVOTE" : "NEUTRAL";

            const [inserted] = await tx
              .insert(challengeVotes)
              .values({
                id: vote.id,
                challengeId: vote.challengeId,
                submissionId: vote.submissionId,
                voterId: vote.voterId,
                tripParticipantId: vote.voterId,
                position: positionEnum,
                weight: vote.normalizedWeight,
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

        return createdRecords.map((record) => this.mapper.toDTO(record));
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
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(challengeVotes)
          .where(eq(challengeVotes.challengeId, challengeId))
          .orderBy(asc(challengeVotes.position));

        return records.map((record) => this.mapper.toDTO(record));
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
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
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

        return records.map((record) => this.mapper.toDTO(record));
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
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(challengeVotes)
          .where(eq(challengeVotes.submissionId, submissionId))
          .orderBy(asc(challengeVotes.position));

        return records.map((record) => this.mapper.toDTO(record));
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find votes by challenge ID with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      challengeId,
      args,
      eq(this.table.challengeId, challengeId),
      "findByChallengeIdConnection",
    );
  }

  /**
   * Find votes by challenge and voter with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByChallengeAndVoterConnection(
    challengeId: string,
    voterId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      challengeId,
      args,
      and(
        eq(this.table.challengeId, challengeId),
        eq(this.table.voterId, voterId),
      ),
      "findByChallengeAndVoterConnection",
    );
  }

  /**
   * Find votes by submission ID with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findBySubmissionIdConnection(
    submissionId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      submissionId,
      args,
      eq(this.table.submissionId, submissionId),
      "findBySubmissionIdConnection",
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Uses (createdAt, id) > (cursor.createdAt, cursor.id) WHERE clause
   * Uses ORDER BY createdAt, id with LIMIT first + 1
   */
  private executeConnectionQuery(
    filterValue: string,
    args: ChallengeVoteConnectionArgs,
    filterCondition: ReturnType<typeof eq> | ReturnType<typeof and>,
    operation: string,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [filterCondition];

        // Add cursor condition: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.createdAt), asc(this.table.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

        // Build edges with cursors
        const edges = items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.votedAt.toISOString(),
          }),
        }));

        return {
          edges,
          nodes: items,
          pageInfo: {
            hasNextPage: hasMore,
            hasPreviousPage: !!cursor,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation,
          message: `Failed to execute ${operation}`,
          cause: error,
        }),
    });
  }
}
