import type {
  ChallengeSubmissionGateway,
  ChallengeSubmissionDTO,
  ChallengeSubmissionVoteScoreConnectionArgs,
  ChallengeSubmissionCreatedAtConnectionArgs,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  challengeSubmissions,
  type ChallengeSubmissionSelect,
  type ChallengeSubmissionInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import type { Connection } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { ChallengeSubmissionDrizzleMapper } from "../../mappers/drizzle/submission-mapper";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

/**
 * DrizzleChallengeSubmissionGateway
 *
 * Implements the ChallengeSubmissionGateway port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 * All methods return ChallengeSubmissionDTOs instead of domain entities.
 */
export class DrizzleChallengeSubmissionGateway
  extends BaseDrizzleGateway<
    ChallengeSubmissionDTO,
    ChallengeSubmissionSelect,
    ChallengeSubmissionInsert,
    typeof challengeSubmissions
  >
  implements ChallengeSubmissionGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: challengeSubmissions,
      mapper: ChallengeSubmissionDrizzleMapper.instance,
    });
  }

  /**
   * Create a new submission
   */
  override create(
    submission: ChallengeSubmissionDTO,
  ): Effect.Effect<ChallengeSubmissionDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData = this.mapper.toDrizzleInsert(submission);
        const [record] = await this.db
          .insert(this.table)
          .values(insertData)
          .returning();
        if (!record) {
          throw new Error("Insert did not return a record");
        }
        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create submission",
          cause: error,
        }),
    });
  }

  /**
   * Find submission by ID
   */
  override findById(
    id: string,
  ): Effect.Effect<ChallengeSubmissionDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.id, id))
          .limit(1);
        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: "Failed to find submission by ID",
          cause: error,
        }),
    });
  }

  /**
   * Find submission by challenge ID and group ID
   */
  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmissionDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              eq(this.table.challengeId, challengeId),
              eq(this.table.groupId, groupId),
            ),
          )
          .limit(1);

        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByChallengeAndGroup",
          message: "Failed to find submission by challenge and group",
          cause: error,
        }),
    });
  }

  /**
   * Update submission
   */
  override update(
    submission: ChallengeSubmissionDTO,
  ): Effect.Effect<ChallengeSubmissionDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const updateData = this.mapper.toDrizzleUpdate(submission);
        const [record] = await this.db
          .update(this.table)
          .set(updateData)
          .where(eq(this.table.id, submission.id))
          .returning();
        if (!record) {
          throw new Error("Update did not return a record");
        }
        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "update",
          message: "Failed to update submission",
          cause: error,
        }),
    });
  }

  /**
   * Delete submission
   */
  override delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.delete(this.table).where(eq(this.table.id, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          message: "Failed to delete submission",
          cause: error,
        }),
    });
  }

  /**
   * Check if submission exists for challenge and group
   */
  existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(
            and(
              eq(this.table.challengeId, challengeId),
              eq(this.table.groupId, groupId),
            ),
          )
          .limit(1);

        return (result?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "existsForChallengeAndGroup",
          message:
            "Failed to check if submission exists for challenge and group",
          cause: error,
        }),
    });
  }

  /**
   * Count submissions by challenge ID
   */
  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.challengeId, challengeId))
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByChallengeId",
          message: "Failed to count submissions by challenge ID",
          cause: error,
        }),
    });
  }

  /**
   * Count submissions by challenge and status
   */
  countByChallengeAndStatus(
    challengeId: string,
    status: "PENDING" | "APPROVED" | "REJECTED",
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(
            and(
              eq(this.table.challengeId, challengeId),
              eq(this.table.status, status),
            ),
          )
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByChallengeAndStatus",
          message: "Failed to count submissions by challenge and status",
          cause: error,
        }),
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find submissions by challenge ID with cursor-based pagination
   * Uses (voteScore, id) sort for peer voting challenges
   * Returns highest scoring submissions first
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeSubmissionVoteScoreConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [eq(this.table.challengeId, challengeId)];

        // Add cursor condition: (voteScore, id) < (cursor.voteScore, cursor.id)
        // Note: We use < because we want lower scores (higher voteScore is better, so we want higher first)
        if (cursor) {
          conditions.push(
            sql`(${this.table.voteScore}, ${this.table.id}) < (${cursor.voteScore}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.voteScore), asc(this.table.id))
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
            createdAt: item.submittedAt.toISOString(),
            voteScore: item.voteScore,
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
          operation: "findByChallengeIdConnection",
          message:
            "Failed to find submissions by challenge ID with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find submissions by challenge ID with cursor-based pagination sorted by createdAt
   * Uses (createdAt, id) sort for chronological ordering
   */
  findByChallengeIdByCreatedAtConnection(
    challengeId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [eq(this.table.challengeId, challengeId)];

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
          .orderBy(desc(this.table.createdAt), asc(this.table.id))
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
            createdAt: item.submittedAt.toISOString(),
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
          operation: "findByChallengeIdByCreatedAtConnection",
          message:
            "Failed to find submissions by challenge ID (by createdAt) with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find all submissions by a group with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByGroupIdConnection(
    groupId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [eq(this.table.groupId, groupId)];

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
          .orderBy(desc(this.table.createdAt), asc(this.table.id))
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
            createdAt: item.submittedAt.toISOString(),
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
          operation: "findByGroupIdConnection",
          message:
            "Failed to find submissions by group ID with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find submissions by status with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByStatusConnection(
    status: "PENDING" | "APPROVED" | "REJECTED",
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [eq(this.table.status, status)];

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
          .orderBy(desc(this.table.createdAt), asc(this.table.id))
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
            createdAt: item.submittedAt.toISOString(),
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
          operation: "findByStatusConnection",
          message:
            "Failed to find submissions by status with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find submissions with advanced filtering and cursor-based pagination
   * Uses (voteScore, id) or (createdAt, id) sort depending on params.orderBy
   */
  findManyConnection(params: {
    challengeId?: string;
    groupId?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    first?: number;
    after?:
      | ChallengeSubmissionCreatedAtConnectionArgs["after"]
      | ChallengeSubmissionVoteScoreConnectionArgs["after"]
      | null;
  }): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(params.first ?? 20, 100);
        const cursor = params.after;
        const orderBy = params.orderBy ?? "createdAt";
        const orderDirection = params.orderDirection ?? "desc";

        // Build base conditions
        const conditions = [];
        if (params.challengeId) {
          conditions.push(eq(this.table.challengeId, params.challengeId));
        }
        if (params.groupId) {
          conditions.push(eq(this.table.groupId, params.groupId));
        }
        if (params.status) {
          conditions.push(eq(this.table.status, params.status));
        }

        // Add cursor condition based on sort order
        if (cursor) {
          if (
            orderBy === "voteScore" &&
            "voteScore" in cursor &&
            cursor.voteScore !== undefined
          ) {
            // For voteScore sorting: (voteScore, id) < (cursor.voteScore, cursor.id)
            if (orderDirection === "desc") {
              conditions.push(
                sql`(${this.table.voteScore}, ${this.table.id}) < (${cursor.voteScore}, ${cursor.id})`,
              );
            } else {
              conditions.push(
                sql`(${this.table.voteScore}, ${this.table.id}) > (${cursor.voteScore}, ${cursor.id})`,
              );
            }
          } else {
            // For createdAt sorting: (createdAt, id) > (cursor.createdAt, cursor.id)
            const cursorDate = new Date(cursor.createdAt);
            if (orderDirection === "desc") {
              conditions.push(
                sql`(${this.table.createdAt}, ${this.table.id}) < (${cursorDate}, ${cursor.id})`,
              );
            } else {
              conditions.push(
                sql`(${this.table.createdAt}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
              );
            }
          }
        }

        // Build order by clause
        const orderByClause =
          orderBy === "voteScore"
            ? orderDirection === "desc"
              ? desc(this.table.voteScore)
              : asc(this.table.voteScore)
            : orderDirection === "desc"
              ? desc(this.table.createdAt)
              : asc(this.table.createdAt);

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(orderByClause, asc(this.table.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

        // Build edges with cursors
        const edges = items.map((item) => {
          const cursorData: {
            id: string;
            createdAt: string;
            voteScore?: number;
          } = {
            id: item.id,
            createdAt: item.submittedAt.toISOString(),
          };
          if (orderBy === "voteScore") {
            cursorData.voteScore = item.voteScore;
          }
          return {
            node: item,
            cursor: encodeCursor(cursorData),
          };
        });

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
          operation: "findManyConnection",
          message:
            "Failed to find submissions with filters and cursor pagination",
          cause: error,
        }),
    });
  }
}
