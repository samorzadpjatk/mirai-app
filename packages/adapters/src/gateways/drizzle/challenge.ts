import { sql, eq, and, lte, gte } from "drizzle-orm";
import {
  challenges,
  type ChallengeSelect,
  type ChallengeInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import {
  Challenge,
  type ChallengeStatus,
  type SubmissionType,
  type ScoringCategory,
} from "@mirai-app/domain";
import type { ChallengeRepository } from "@mirai-app/domain/ports";
import { BaseDrizzleRepository } from "../base/repository";
import { ChallengeDrizzleMapper } from "../../mappers/drizzle/challenge";
import { DatabaseError } from "@mirai-app/domain/ports";

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

  findByTripId(
    tripId: string,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.tripId, tripId));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find challenges by trip ID",
          cause: error,
        }),
    });
  }

  findByStatus(
    status: ChallengeStatus,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find challenges by status",
          cause: error,
        }),
    });
  }

  findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(eq(this.table.tripId, tripId), eq(this.table.status, status)),
          );
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatus",
          message: "Failed to find challenges by trip ID and status",
          cause: error,
        }),
    });
  }

  findBySubmissionType(
    type: SubmissionType,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.submissionType, type));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findBySubmissionType",
          message: "Failed to find challenges by submission type",
          cause: error,
        }),
    });
  }

  findByScoringCategory(
    category: ScoringCategory,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.scoringCategory, category));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByScoringCategory",
          message: "Failed to find challenges by scoring category",
          cause: error,
        }),
    });
  }

  findActive(): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, "ACTIVE"));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActive",
          message: "Failed to find active challenges",
          cause: error,
        }),
    });
  }

  findOpenForSubmission(): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findOpenForSubmission",
          message: "Failed to find challenges open for submission",
          cause: error,
        }),
    });
  }

  findRecurring(): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.isRecurring, true));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findRecurring",
          message: "Failed to find recurring challenges",
          cause: error,
        }),
    });
  }

  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        let query = this.db.select().from(this.table);
        if (options?.limit) query = query.limit(options.limit) as typeof query;
        if (options?.offset)
          query = query.offset(options.offset) as typeof query;
        const records = await query;
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find challenges with pagination",
          cause: error,
        }),
    });
  }

  updateStatus(
    id: string,
    status: ChallengeStatus,
  ): Effect.Effect<Challenge, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ status, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Challenge with id ${id} not found`);
        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateStatus",
          message: `Failed to update challenge status for id ${id}`,
          cause: error,
        }),
    });
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.tripId, tripId));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByTripId",
          message: "Failed to count challenges by trip ID",
          cause: error,
        }),
    });
  }
}
