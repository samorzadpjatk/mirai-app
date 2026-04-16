import { sql, eq, and, inArray, desc, asc, lt } from "drizzle-orm";
import {
  notifications,
  type NotificationSelect,
  type NotificationInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import {
  NotificationStatus,
  type NotificationPriority,
} from "@mirai-app/domain";
import type {
  NotificationGateway,
  NotificationDTO,
  NotificationPaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { NotificationDrizzleMapper } from "../../../notification/mappers/drizzle/mapper";

/**
 * DrizzleNotificationGateway
 *
 * Gateway implementation using Drizzle ORM for Notification entity.
 * Returns NotificationDTOs instead of domain entities to satisfy the NotificationGateway interface.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   notificationGateway: asFunction(() => new DrizzleNotificationGateway(db)).singleton(),
 * });
 * ```
 */
export class DrizzleNotificationGateway
  extends BaseDrizzleGateway<
    NotificationDTO,
    NotificationSelect,
    NotificationInsert,
    typeof notifications
  >
  implements NotificationGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: notifications,
      mapper: NotificationDrizzleMapper.instance,
    });
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.tripId, tripId))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find notifications by trip ID",
          cause: error,
        }),
    });
  }

  findByPriority(
    priority: NotificationPriority,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.priority, priority))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByPriority",
          message: "Failed to find notifications by priority",
          cause: error,
        }),
    });
  }

  findByStatus(
    status: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find notifications by status",
          cause: error,
        }),
    });
  }

  findByTripIdAndStatus(
    tripId: string,
    status: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(eq(this.table.tripId, tripId), eq(this.table.status, status)),
          )
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatus",
          message: "Failed to find notifications by trip ID and status",
          cause: error,
        }),
    });
  }

  findReadyToSend(): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              eq(this.table.status, NotificationStatus.READY),
              sql`(${this.table.scheduledFor} IS NULL OR ${this.table.scheduledFor} <= ${now})`,
            ),
          )
          .orderBy(
            sql`CASE ${this.table.priority}
              WHEN 'URGENT' THEN 4
              WHEN 'HIGH' THEN 3
              WHEN 'NORMAL' THEN 2
              WHEN 'LOW' THEN 1
            END DESC`,
            asc(this.table.createdAt),
          );
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findReadyToSend",
          message: "Failed to find notifications ready to send",
          cause: error,
        }),
    });
  }

  findOverdue(): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              eq(this.table.status, NotificationStatus.DRAFT),
              sql`${this.table.scheduledFor} IS NOT NULL`,
              lt(this.table.scheduledFor, now),
            ),
          )
          .orderBy(asc(this.table.scheduledFor));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findOverdue",
          message: "Failed to find overdue notifications",
          cause: error,
        }),
    });
  }

  findByCreatedById(
    createdById: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.createdById, createdById))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByCreatedById",
          message: "Failed to find notifications by creator ID",
          cause: error,
        }),
    });
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<NotificationPaginatedResult, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // Get total count
        const countResult = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table);
        const totalCount = countResult[0]?.count ?? 0;

        // Get paginated records
        let query = this.db
          .select()
          .from(this.table)
          .orderBy(desc(this.table.createdAt));

        if (options?.limit) {
          query = query.limit(options.limit);
        }
        if (options?.offset) {
          query = query.offset(options.offset);
        }

        const records = await query;
        const items = records.map((r) => this.mapper.toDTO(r));

        return {
          items,
          totalCount,
          hasMore:
            options?.offset !== undefined
              ? options.offset + items.length < totalCount
              : false,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find all notifications",
          cause: error,
        }),
    });
  }

  countByStatus(status: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.status, status));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByStatus",
          message: "Failed to count notifications by status",
          cause: error,
        }),
    });
  }

  countPendingByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(
            and(
              eq(this.table.tripId, tripId),
              inArray(this.table.status, [
                NotificationStatus.DRAFT,
                NotificationStatus.READY,
              ]),
            ),
          );
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countPendingByTripId",
          message: "Failed to count pending notifications by trip ID",
          cause: error,
        }),
    });
  }
}
