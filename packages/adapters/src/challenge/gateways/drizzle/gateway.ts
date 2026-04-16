import { sql, eq, and, lte, gte } from "drizzle-orm";
import {
  challenges,
  type ChallengeSelect,
  type ChallengeInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import { type ChallengeStatus, type ScoringCategory } from "@mirai-app/domain";
import type {
  ChallengeGateway,
  ChallengeDTO,
  ChallengePaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { ChallengeDrizzleMapper } from "../../../challenge/mappers/drizzle/mapper";

/**
 * DrizzleChallengeGateway
 *
 * Gateway implementation using Drizzle ORM for Challenge entity.
 * Returns ChallengeDTOs instead of domain entities to satisfy the ChallengeGateway interface.
 */
export class DrizzleChallengeGateway
  extends BaseDrizzleGateway<
    ChallengeDTO,
    ChallengeSelect,
    ChallengeInsert,
    typeof challenges
  >
  implements ChallengeGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: challenges,
      mapper: ChallengeDrizzleMapper.instance,
    });
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.tripId, tripId));
        return records.map((r) => this.mapper.toDTO(r));
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
    status: string,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status));
        return records.map((r) => this.mapper.toDTO(r));
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
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(eq(this.table.tripId, tripId), eq(this.table.status, status)),
          );
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatus",
          message: "Failed to find challenges by trip ID and status",
          cause: error,
        }),
    });
  }

  findByScoringCategory(
    category: ScoringCategory,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.scoringCategory, category));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByScoringCategory",
          message: "Failed to find challenges by scoring category",
          cause: error,
        }),
    });
  }

  findActive(): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, "ACTIVE"));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActive",
          message: "Failed to find active challenges",
          cause: error,
        }),
    });
  }

  findOpenForSubmission(): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
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
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findOpenForSubmission",
          message: "Failed to find challenges open for submission",
          cause: error,
        }),
    });
  }

  findRecurring(): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.isRecurring, true));
        return records.map((r) => this.mapper.toDTO(r));
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
  }): Effect.Effect<ChallengePaginatedResult, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table);
        const total = countResult?.count ?? 0;

        // Get paginated records
        let query = this.db.select().from(this.table);
        if (limit) query = query.limit(limit) as typeof query;
        if (offset) query = query.offset(offset) as typeof query;

        const records = await query;
        const items = records.map((r) => this.mapper.toDTO(r));

        const hasMore = items.length === limit && offset + items.length < total;

        return {
          items,
          total,
          limit,
          offset,
          hasMore,
        };
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
    status: string,
  ): Effect.Effect<ChallengeDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ status, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Challenge with id ${id} not found`);
        return this.mapper.toDTO(record);
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
