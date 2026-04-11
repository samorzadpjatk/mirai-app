import type { ChallengeSubmissionRepository } from "@mirai-app/use-cases";
import type { ChallengeSubmission, SubmissionStatus } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  challengeSubmissions,
  type ChallengeSubmissionSelect,
  type ChallengeSubmissionInsert,
} from "@mirai-app/frameworks/drizzle/schema/challenge";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "../base/repository";
import { ChallengeSubmissionDrizzleMapper } from "../../mappers/drizzle/challenge-submission";

/**
 * DrizzleChallengeSubmissionRepository
 *
 * Implements the ChallengeSubmissionRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleChallengeSubmissionRepository
  extends BaseDrizzleRepository<
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
  async findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<ChallengeSubmission | null> {
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
  }

  /**
   * Find submissions by challenge ID
   */
  async findByChallengeId(challengeId: string): Promise<ChallengeSubmission[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.challengeId, challengeId))
      .orderBy(desc(this.table.voteScore), asc(this.table.createdAt));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions by group ID
   */
  async findByGroupId(groupId: string): Promise<ChallengeSubmission[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.groupId, groupId))
      .orderBy(desc(this.table.createdAt));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions by status
   */
  async findByStatus(status: SubmissionStatus): Promise<ChallengeSubmission[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.status, status))
      .orderBy(desc(this.table.createdAt));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions with filtering and pagination options
   */
  async findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: SubmissionStatus;
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Promise<ChallengeSubmission[]> {
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

      // Order by
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

      // Pagination
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
  }

  /**
   * Check if submission exists for challenge and group
   */
  async existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<boolean> {
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
  }

  /**
   * Count submissions by challenge ID
   */
  async countByChallengeId(challengeId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.challengeId, challengeId))
      .limit(1);

    return result?.count ?? 0;
  }

  /**
   * Count submissions by challenge and status
   */
  async countByChallengeAndStatus(
    challengeId: string,
    status: SubmissionStatus,
  ): Promise<number> {
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
  }
}
