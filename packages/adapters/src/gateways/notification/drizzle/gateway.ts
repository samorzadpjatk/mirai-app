import { sql, eq, and, inArray, desc, asc, isNull, lte, lt } from "drizzle-orm";
import {
  notifications,
  type NotificationSelect,
  type NotificationInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import {
  Notification,
  NotificationStatus,
  type NotificationPriority,
} from "@mirai-app/domain";
import type { NotificationRepository } from "@mirai-app/domain/ports";
import { BaseDrizzleGateway } from "../_shared/drizzle-base";

/**
 * DrizzleNotificationGateway
 *
 * Gateway implementation using Drizzle ORM for Notification entity.
 */
export class DrizzleNotificationGateway
  extends BaseDrizzleGateway<
    Notification,
    NotificationSelect,
    NotificationInsert,
    typeof notifications
  >
  implements NotificationRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: notifications,
      mapper: NotificationDrizzleMapper.instance,
    });
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.tripId, tripId))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
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
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.priority, priority))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByPriority",
          message: "Failed to find notifications by priority",
          cause: error,
        }),
    });
  }

  findRecent(
    limit: number = 10,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .orderBy(desc(this.table.createdAt))
          .limit(limit);
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findRecent",
          message: "Failed to find recent notifications",
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
          message: "Failed to count notifications by trip ID",
          cause: error,
        }),
    });
  }

  findByStatus(
    status: NotificationStatus,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
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
    status: NotificationStatus,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(eq(this.table.tripId, tripId), eq(this.table.status, status)),
          )
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatus",
          message: "Failed to find notifications by trip ID and status",
          cause: error,
        }),
    });
  }

  findReadyToSend(): Effect.Effect<Notification[], DatabaseError, never> {
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
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findReadyToSend",
          message: "Failed to find notifications ready to send",
          cause: error,
        }),
    });
  }

  findOverdue(): Effect.Effect<Notification[], DatabaseError, never> {
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
        return records.map((r) => this.mapper.toDomain(r));
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
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.createdById, createdById))
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByCreatedById",
          message: "Failed to find notifications by creator ID",
          cause: error,
        }),
    });
  }

  countByStatus(
    status: NotificationStatus,
  ): Effect.Effect<number, DatabaseError, never> {
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
