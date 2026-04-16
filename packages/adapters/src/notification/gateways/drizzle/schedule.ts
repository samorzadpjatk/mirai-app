import type {
  NotificationScheduleType,
  NotificationScheduleFilter,
  PaginationOptions,
} from "@mirai-app/domain";
import type {
  NotificationScheduleGateway,
  NotificationScheduleDTO,
  PaginatedResult,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationSchedules,
  notificationScheduleExecutions,
  notifications,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { NotificationScheduleDrizzleMapper } from "../../../notification/mappers/drizzle/schedule-mapper";

/**
 * DrizzleNotificationScheduleGateway
 *
 * Implements the NotificationScheduleGateway port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 * Returns NotificationScheduleDTOs instead of domain entities.
 */
export class DrizzleNotificationScheduleGateway
  extends BaseDrizzleGateway<
    NotificationScheduleDTO,
    typeof notificationSchedules.$inferSelect,
    Partial<typeof notificationSchedules.$inferInsert>,
    typeof notificationSchedules
  >
  implements NotificationScheduleGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: notificationSchedules,
      mapper: NotificationScheduleDrizzleMapper.instance,
    });
  }

  // Override base class methods to match interface error types
  override create(
    entity: NotificationScheduleDTO,
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never> {
    return super.create(entity);
  }

  override findById(
    id: string,
  ): Effect.Effect<NotificationScheduleDTO | null, DatabaseError, never> {
    return super.findById(id);
  }

  override update(
    entity: NotificationScheduleDTO & { id: string },
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never> {
    return super.update(entity);
  }

  override delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return super.delete(id);
  }

  override exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return super.exists(id);
  }

  /**
   * Find schedules by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(notificationSchedules)
          .where(eq(notificationSchedules.tripId, tripId))
          .orderBy(desc(notificationSchedules.createdAt));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find notification schedules by trip ID",
          cause: error,
        }),
    });
  }

  /**
   * Find schedule by name
   */
  findByName(
    name: string,
  ): Effect.Effect<NotificationScheduleDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select()
          .from(notificationSchedules)
          .where(eq(notificationSchedules.name, name))
          .limit(1);

        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByName",
          message: "Failed to find notification schedule by name",
          cause: error,
        }),
    });
  }

  /**
   * Find schedule by trip ID and name
   */
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationScheduleDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select()
          .from(notificationSchedules)
          .where(
            and(
              eq(notificationSchedules.tripId, tripId),
              eq(notificationSchedules.name, name),
            ),
          )
          .limit(1);

        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndName",
          message: "Failed to find notification schedule by trip ID and name",
          cause: error,
        }),
    });
  }

  /**
   * Find schedules by type
   */
  findByType(
    type: NotificationScheduleType,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(notificationSchedules)
          .where(eq(notificationSchedules.notificationType, type.toString()))
          .orderBy(desc(notificationSchedules.createdAt));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByType",
          message: "Failed to find notification schedules by type",
          cause: error,
        }),
    });
  }

  /**
   * Find all schedules with pagination and filters
   * Note: Renamed from findAll to avoid collision with BaseDrizzleGateway.findAll
   */
  findAllPaginated(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Effect.Effect<
    PaginatedResult<NotificationScheduleDTO>,
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(options?.filter);

        const limit = options?.pagination?.limit ?? 50;
        const offset = options?.pagination?.offset ?? 0;

        const [records, totalResult] = await Promise.all([
          this.db
            .select()
            .from(notificationSchedules)
            .where(whereClause)
            .orderBy(desc(notificationSchedules.createdAt))
            .limit(limit)
            .offset(offset),
          this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(notificationSchedules)
            .where(whereClause)
            .limit(1),
        ]);

        const total = totalResult[0]?.count ?? 0;

        return {
          items: records.map((record) => this.mapper.toDTO(record)),
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find all notification schedules",
          cause: error,
        }),
    });
  }

  /**
   * Find active schedules
   */
  findActive(
    now?: Date,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const currentTime = now ?? new Date();

        const records = await this.db
          .select()
          .from(notificationSchedules)
          .where(
            and(
              eq(notificationSchedules.isSent, false),
              lte(notificationSchedules.scheduledFor, currentTime),
            ),
          )
          .orderBy(asc(notificationSchedules.scheduledFor));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActive",
          message: "Failed to find active notification schedules",
          cause: error,
        }),
    });
  }

  /**
   * Find upcoming schedules
   */
  findUpcoming(
    days?: number,
    now?: Date,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const currentTime = now ?? new Date();
        const futureDate = new Date(currentTime);
        futureDate.setDate(futureDate.getDate() + (days ?? 7));

        const records = await this.db
          .select()
          .from(notificationSchedules)
          .where(
            and(
              eq(notificationSchedules.isSent, false),
              eq(notificationSchedules.isDraft, false),
              gte(notificationSchedules.scheduledFor, currentTime),
              lte(notificationSchedules.scheduledFor, futureDate),
            ),
          )
          .orderBy(asc(notificationSchedules.scheduledFor));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findUpcoming",
          message: "Failed to find upcoming notification schedules",
          cause: error,
        }),
    });
  }

  /**
   * Delete multiple schedules
   */
  deleteMany(ids: string[]): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (ids.length === 0) return 0;

        let deletedCount = 0;
        for (const id of ids) {
          const [result] = await this.db
            .delete(notificationSchedules)
            .where(eq(notificationSchedules.id, id))
            .returning();
          if (result) deletedCount++;
        }

        return deletedCount;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "deleteMany",
          message: "Failed to delete multiple notification schedules",
          cause: error,
        }),
    });
  }

  /**
   * Count schedules by filter
   */
  count(
    filter?: NotificationScheduleFilter,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filter);

        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationSchedules)
          .where(whereClause)
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "count",
          message: "Failed to count notification schedules",
          cause: error,
        }),
    });
  }

  /**
   * Update last run time
   */
  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(notificationSchedules)
          .set({ scheduledFor: lastRun })
          .where(eq(notificationSchedules.id, id))
          .returning();

        if (!record) {
          throw new Error(
            `Failed to update lastRun for schedule ${id}: not found`,
          );
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateLastRun",
          message: `Failed to update last run time for schedule ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Toggle schedule active state
   */
  toggleActive(
    id: string,
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [current] = await this.db
          .select({ isDraft: notificationSchedules.isDraft })
          .from(notificationSchedules)
          .where(eq(notificationSchedules.id, id))
          .limit(1);

        if (!current) {
          throw new Error("Notification schedule not found");
        }

        const [record] = await this.db
          .update(notificationSchedules)
          .set({ isDraft: !current.isDraft })
          .where(eq(notificationSchedules.id, id))
          .returning();

        if (!record) {
          throw new Error(`Failed to toggle active state for schedule ${id}`);
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "toggleActive",
          message: `Failed to toggle active state for schedule ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Bulk toggle active state
   */
  bulkToggleActive(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (ids.length === 0) return 0;

        let updatedCount = 0;
        for (const id of ids) {
          const [result] = await this.db
            .update(notificationSchedules)
            .set({ isDraft: !isActive })
            .where(eq(notificationSchedules.id, id))
            .returning();
          if (result) updatedCount++;
        }

        return updatedCount;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "bulkToggleActive",
          message: "Failed to bulk toggle active state",
          cause: error,
        }),
    });
  }

  /**
   * Get execution history for a schedule
   */
  getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Effect.Effect<
    Array<{
      id: string;
      executedAt: Date;
      notification: {
        id: string;
        title: string;
        body: string;
        createdAt: Date;
      } | null;
    }>,
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const executions = await this.db
          .select({
            id: notificationScheduleExecutions.id,
            executedAt: notificationScheduleExecutions.executedAt,
            notificationId: notifications.id,
            notificationTitle: notifications.title,
            notificationBody: notifications.body,
            notificationCreatedAt: notifications.createdAt,
          })
          .from(notificationScheduleExecutions)
          .leftJoin(
            notifications,
            eq(notificationScheduleExecutions.notificationId, notifications.id),
          )
          .where(eq(notificationScheduleExecutions.scheduleId, scheduleId))
          .orderBy(desc(notificationScheduleExecutions.executedAt))
          .limit(limit);

        return executions.map((e) => ({
          id: e.id,
          executedAt: e.executedAt,
          notification: e.notificationId
            ? {
                id: e.notificationId,
                title: e.notificationTitle ?? "",
                body: e.notificationBody ?? "",
                createdAt: e.notificationCreatedAt ?? e.executedAt,
              }
            : null,
        }));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getExecutionHistory",
          message: `Failed to get execution history for schedule ${scheduleId}`,
          cause: error,
        }),
    });
  }

  /**
   * Count executions for a schedule
   */
  countExecutions(
    scheduleId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationScheduleExecutions)
          .where(eq(notificationScheduleExecutions.scheduleId, scheduleId))
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countExecutions",
          message: `Failed to count executions for schedule ${scheduleId}`,
          cause: error,
        }),
    });
  }

  /**
   * Build where clause from filter
   */
  private buildWhereClause(
    filter?: NotificationScheduleFilter,
  ): ReturnType<typeof and> | undefined {
    const conditions = [];

    if (!filter) {
      return undefined;
    }

    if (filter.tripId !== undefined && filter.tripId !== null) {
      conditions.push(eq(notificationSchedules.tripId, filter.tripId));
    }

    if (filter.notificationType) {
      conditions.push(
        eq(
          notificationSchedules.notificationType,
          filter.notificationType.toString(),
        ),
      );
    }

    if (filter.isActive !== undefined) {
      conditions.push(eq(notificationSchedules.isSent, !filter.isActive));
    }

    if (filter.startDateFrom) {
      conditions.push(
        gte(notificationSchedules.scheduledFor, filter.startDateFrom),
      );
    }

    if (filter.startDateTo) {
      conditions.push(
        lte(notificationSchedules.scheduledFor, filter.startDateTo),
      );
    }

    if (filter.search) {
      // Simple search by name (case-insensitive would need ILIKE in Postgres)
      conditions.push(
        sql`LOWER(${notificationSchedules.name}) LIKE LOWER(${"%" + filter.search + "%"})`,
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
