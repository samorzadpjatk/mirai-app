import type { ChallengeSubmissionRepository } from "@mirai-app/domain/ports";
import type { ChallengeSubmission, SubmissionStatus } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  challengeSubmissions,
  type ChallengeSubmissionSelect,
  type ChallengeSubmissionInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleGateway } from "../_shared/drizzle-base";

/**
 * DrizzleChallengeSubmissionGateway
 *
 * Implements the ChallengeSubmissionRepository port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 */
export class DrizzleChallengeSubmissionGateway
  extends BaseDrizzleGateway<
    ChallengeSubmission,
    ChallengeSubmissionSelect,
    ChallengeSubmissionInsert,
    typeof challengeSubmissions
  >
  implements ChallengeSubmissionRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: challengeSubmissions,
      mapper: ChallengeSubmissionDrizzleMapper.instance,
    });
  }

  /**
   * Find submission by challenge ID and group ID
   */
  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never> {
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

        return record ? this.mapper.toDomain(record) : null;
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
   * Find submissions by challenge ID
   */
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.challengeId, challengeId))
          .orderBy(desc(this.table.voteScore), asc(this.table.createdAt));

        return records.map((record) => this.mapper.toDomain(record));
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
   * Find submissions by group ID
   */
  findByGroupId(
    groupId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.groupId, groupId))
          .orderBy(desc(this.table.createdAt));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByGroupId",
          message: "Failed to find submissions by group ID",
          cause: error,
        }),
    });
  }

  /**
   * Find submissions by status
   */
  findByStatus(
    status: SubmissionStatus,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status))
          .orderBy(desc(this.table.createdAt));

        return records.map((record) => this.mapper.toDomain(record));
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
    status?: SubmissionStatus;
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
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
        return records.map((record) => this.mapper.toDomain(record));
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
    status: SubmissionStatus,
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
