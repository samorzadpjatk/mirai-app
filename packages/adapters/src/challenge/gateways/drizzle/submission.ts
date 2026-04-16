import type {
  ChallengeSubmissionGateway,
  ChallengeSubmissionDTO,
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
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { ChallengeSubmissionDrizzleMapper } from "../../mappers/drizzle/submission-mapper";

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
   * Find submissions by challenge ID with pagination
   */
  findByChallengeId(
    challengeId: string,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<
    {
      items: ChallengeSubmissionDTO[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 20;
        const offset = options?.offset ?? 0;

        let query = this.db
          .select()
          .from(this.table)
          .where(eq(this.table.challengeId, challengeId))
          .orderBy(desc(this.table.voteScore), asc(this.table.createdAt));

        query = query.limit(limit).offset(offset) as unknown as typeof query;

        const records = await query;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.challengeId, challengeId))
          .limit(1);

        const total = countResult?.count ?? 0;

        return {
          items: records.map((record) => this.mapper.toDTO(record)),
          total,
          limit,
          offset,
          hasMore: offset + records.length < total,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByChallengeId",
          message: "Failed to find submissions by challenge ID",
          cause: error,
        }),
    });
  }

  /**
   * Find submissions by user ID with pagination
   */
  findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<
    {
      items: ChallengeSubmissionDTO[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 20;
        const offset = options?.offset ?? 0;

        let query = this.db
          .select()
          .from(this.table)
          .where(eq(this.table.groupId, userId))
          .orderBy(desc(this.table.createdAt));

        query = query.limit(limit).offset(offset) as unknown as typeof query;

        const records = await query;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.groupId, userId))
          .limit(1);

        const total = countResult?.count ?? 0;

        return {
          items: records.map((record) => this.mapper.toDTO(record)),
          total,
          limit,
          offset,
          hasMore: offset + records.length < total,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserId",
          message: "Failed to find submissions by user ID",
          cause: error,
        }),
    });
  }

  /**
   * Find submissions by status
   */
  findByStatus(
    status: "PENDING" | "APPROVED" | "REJECTED",
  ): Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status))
          .orderBy(desc(this.table.createdAt));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find submissions by status",
          cause: error,
        }),
    });
  }

  /**
   * Find submissions with filtering and pagination options
   */
  findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const buildQuery = () => {
          let query = this.db.select().from(this.table);

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

          if (conditions.length > 0) {
            query = query.where(and(...conditions)) as unknown as typeof query;
          }

          if (params.orderBy === "voteScore") {
            query = query.orderBy(
              params.orderDirection === "asc"
                ? asc(this.table.voteScore)
                : desc(this.table.voteScore),
            ) as unknown as typeof query;
          } else {
            query = query.orderBy(
              params.orderDirection === "asc"
                ? asc(this.table.createdAt)
                : desc(this.table.createdAt),
            ) as unknown as typeof query;
          }

          if (params.limit) {
            query = query.limit(params.limit) as unknown as typeof query;
          }
          if (params.offset) {
            query = query.offset(params.offset) as unknown as typeof query;
          }

          return query;
        };

        const records = await buildQuery();
        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findMany",
          message: "Failed to find submissions with filters",
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
}
