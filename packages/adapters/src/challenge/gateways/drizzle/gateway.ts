import { eq, and, lte, gte, desc, sql, type SQL } from "drizzle-orm";
import {
  challenges,
  type ChallengeSelect,
  type ChallengeInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import { type ChallengeStatus, type ScoringCategory } from "@mirai-app/domain";
import type { ChallengeGateway, ChallengeDTO } from "@mirai-app/use-cases";
import {
  DatabaseError,
  type Connection,
  type Edge,
  type PageInfo,
} from "@mirai-app/domain";
import type { ChallengeConnectionArgs } from "@mirai-app/use-cases";
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

  /**
   * Helper to build a Connection result from items and pagination info
   */
  private buildConnectionResult(
    items: ChallengeDTO[],
    hasMore: boolean,
    _args: ChallengeConnectionArgs,
  ): Connection<ChallengeDTO> {
    // Build edges with cursors
    const edges: Edge<ChallengeDTO>[] = items.map((item) => ({
      node: item,
      cursor: this.encodeCursor(item.id, item.createdAt),
    }));

    // Build pageInfo
    const pageInfo: PageInfo = {
      hasNextPage: hasMore,
      hasPreviousPage: false, // Forward pagination doesn't track previous
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    };

    return {
      edges,
      nodes: items,
      pageInfo,
    };
  }

  /**
   * Encode cursor from id and createdAt
   */
  private encodeCursor(id: string, createdAt: Date): string {
    const data = { id, createdAt: createdAt.toISOString() };
    return Buffer.from(JSON.stringify(data)).toString("base64url");
  }

  /**
   * Decode cursor to id and createdAt
   */
  private decodeCursor(cursor: string): { id: string; createdAt: Date } | null {
    try {
      const json = Buffer.from(cursor, "base64url").toString("utf-8");
      const data = JSON.parse(json) as { id: string; createdAt: string };
      return { id: data.id, createdAt: new Date(data.createdAt) };
    } catch {
      return null;
    }
  }

  /**
   * Get pagination limit with defaults and max
   */
  private getPaginationLimit(first?: number | null): number {
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 20;
    if (first === undefined || first === null) return DEFAULT_LIMIT;
    return Math.min(Math.max(1, first), MAX_LIMIT);
  }

  findByTripIdConnection(
    tripId: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        // Build conditions
        const conditions = [eq(this.table.tripId, tripId)];

        // Add cursor condition for pagination
        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        // Fetch limit + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdConnection",
          message: "Failed to find challenges by trip ID with pagination",
          cause: error,
        }),
    });
  }

  findByStatusConnection(
    status: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        const conditions = [eq(this.table.status, status as ChallengeStatus)];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatusConnection",
          message: "Failed to find challenges by status with pagination",
          cause: error,
        }),
    });
  }

  findByTripIdAndStatusConnection(
    tripId: string,
    status: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        const conditions = [
          eq(this.table.tripId, tripId),
          eq(this.table.status, status as ChallengeStatus),
        ];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatusConnection",
          message:
            "Failed to find challenges by trip ID and status with pagination",
          cause: error,
        }),
    });
  }

  findBySubmissionTypeConnection(
    type: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        const conditions = [eq(this.table.submissionType, type as never)];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findBySubmissionTypeConnection",
          message:
            "Failed to find challenges by submission type with pagination",
          cause: error,
        }),
    });
  }

  findByScoringCategoryConnection(
    category: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        const conditions = [
          eq(this.table.scoringCategory, category as ScoringCategory),
        ];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByScoringCategoryConnection",
          message:
            "Failed to find challenges by scoring category with pagination",
          cause: error,
        }),
    });
  }

  findActiveConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        const conditions = [eq(this.table.status, "ACTIVE")];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActiveConnection",
          message: "Failed to find active challenges with pagination",
          cause: error,
        }),
    });
  }

  findOpenForSubmissionConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;
        const now = new Date();

        const conditions = [
          eq(this.table.status, "ACTIVE"),
          lte(this.table.startTime, now),
          gte(this.table.endTime, now),
        ];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findOpenForSubmissionConnection",
          message:
            "Failed to find challenges open for submission with pagination",
          cause: error,
        }),
    });
  }

  findRecurringConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        const conditions = [eq(this.table.isRecurring, true)];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findRecurringConnection",
          message: "Failed to find recurring challenges with pagination",
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
          .set({ status: status as ChallengeStatus, updatedAt: new Date() })
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

  findAllConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = this.getPaginationLimit(args.first);
        const cursor = args.after;

        const conditions: (SQL<unknown> | undefined)[] = [];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        return this.buildConnectionResult(items, hasMore, args);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAllConnection",
          message: "Failed to find all challenges with pagination",
          cause: error,
        }),
    });
  }
}
