import type {
  ChallengeSubmissionRepository,
  ChallengeSubmission,
  SubmissionStatus,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { challengeSubmissions } from "@mirai-app/frameworks/drizzle/schema/challenge";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "./BaseDrizzleRepository";
import { ChallengeSubmissionDrizzleMapper } from "../../mappers/drizzle/ChallengeSubmissionDrizzleMapper";

/**
 * DrizzleChallengeSubmissionRepository
 *
 * Implements the ChallengeSubmissionRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleChallengeSubmissionRepository
  extends BaseDrizzleRepository<
    ChallengeSubmission,
    typeof challengeSubmissions.$inferSelect,
    Partial<typeof challengeSubmissions.$inferInsert>,
    Partial<typeof challengeSubmissions.$inferInsert>
  >
  implements ChallengeSubmissionRepository
{
  constructor(db: DrizzleDb) {
    super(
      db,
      { table: challengeSubmissions },
      ChallengeSubmissionDrizzleMapper.instance,
    );
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
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.challengeId, challengeId),
          eq(challengeSubmissions.groupId, groupId),
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
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.challengeId, challengeId))
      .orderBy(
        desc(challengeSubmissions.voteScore),
        asc(challengeSubmissions.createdAt),
      );

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions by group ID
   */
  async findByGroupId(groupId: string): Promise<ChallengeSubmission[]> {
    const records = await this.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.groupId, groupId))
      .orderBy(desc(challengeSubmissions.createdAt));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions by status
   */
  async findByStatus(status: SubmissionStatus): Promise<ChallengeSubmission[]> {
    const records = await this.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.status, status))
      .orderBy(desc(challengeSubmissions.createdAt));

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
    let query = this.db.select().from(challengeSubmissions);

    const conditions = [];
    if (params.challengeId) {
      conditions.push(eq(challengeSubmissions.challengeId, params.challengeId));
    }
    if (params.groupId) {
      conditions.push(eq(challengeSubmissions.groupId, params.groupId));
    }
    if (params.status) {
      conditions.push(eq(challengeSubmissions.status, params.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by
    if (params.orderBy === "voteScore") {
      query = query.orderBy(
        params.orderDirection === "asc"
          ? asc(challengeSubmissions.voteScore)
          : desc(challengeSubmissions.voteScore),
      );
    } else {
      query = query.orderBy(
        params.orderDirection === "asc"
          ? asc(challengeSubmissions.createdAt)
          : desc(challengeSubmissions.createdAt),
      );
    }

    // Pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.offset(params.offset);
    }

    const records = await query;
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
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.challengeId, challengeId),
          eq(challengeSubmissions.groupId, groupId),
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
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.challengeId, challengeId))
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
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.challengeId, challengeId),
          eq(challengeSubmissions.status, status),
        ),
      )
      .limit(1);

    return result?.count ?? 0;
  }
}
