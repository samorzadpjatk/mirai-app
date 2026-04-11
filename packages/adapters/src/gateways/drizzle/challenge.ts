import { sql, eq, and, lte, gte } from "drizzle-orm";
import {
  challenges,
  type ChallengeSelect,
  type ChallengeInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import {
  Challenge,
  type ChallengeStatus,
  type SubmissionType,
  type ScoringCategory,
} from "@mirai-app/domain";
import type { ChallengeRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { ChallengeDrizzleMapper } from "../../mappers/drizzle/challenge";

/**
 * DrizzleChallengeRepository
 *
 * Repository implementation using Drizzle ORM for Challenge entity.
 */
export class DrizzleChallengeRepository
  extends BaseDrizzleRepository<
    Challenge,
    ChallengeSelect,
    ChallengeInsert,
    typeof challenges
  >
  implements ChallengeRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: challenges,
      mapper: ChallengeDrizzleMapper.instance,
    });
  }

  async findByTripId(tripId: string): Promise<Challenge[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.tripId, tripId));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByStatus(status: ChallengeStatus): Promise<Challenge[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.status, status));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Promise<Challenge[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.tripId, tripId), eq(this.table.status, status)));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findBySubmissionType(type: SubmissionType): Promise<Challenge[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.submissionType, type));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByScoringCategory(category: ScoringCategory): Promise<Challenge[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.scoringCategory, category));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findActive(): Promise<Challenge[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.status, "ACTIVE"));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findOpenForSubmission(): Promise<Challenge[]> {
    const now = new Date();
    const records = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.status, "ACTIVE"),
          lte(this.table.startTime, now),
          gte(this.table.endTime, now),
        ),
      );
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findRecurring(): Promise<Challenge[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isRecurring, true));
    return records.map((r) => this.mapper.toDomain(r));
  }

  override async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Challenge[]> {
    let query = this.db.select().from(this.table);
    if (options?.limit) query = query.limit(options.limit) as typeof query;
    if (options?.offset) query = query.offset(options.offset) as typeof query;
    const records = await query;
    return records.map((r) => this.mapper.toDomain(r));
  }

  async updateStatus(id: string, status: ChallengeStatus): Promise<Challenge> {
    const [record] = await this.db
      .update(this.table)
      .set({ status, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`Challenge with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  async countByTripId(tripId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.tripId, tripId));
    return result[0]?.count ?? 0;
  }
}
