import type {
  NotificationScheduleRepository,
  NotificationSchedule,
  NotificationScheduleType,
  NotificationScheduleFilter,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationSchedules,
  notificationScheduleExecutions,
} from "@mirai-app/frameworks/drizzle/schema/notificationDelivery";
import { notifications } from "@mirai-app/frameworks/drizzle/schema/notification";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "./BaseDrizzleRepository";
import { NotificationScheduleDrizzleMapper } from "../mappers/NotificationScheduleDrizzleMapper";

/**
 * DrizzleNotificationScheduleRepository
 *
 * Implements the NotificationScheduleRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleNotificationScheduleRepository
  extends BaseDrizzleRepository<
    NotificationSchedule,
    typeof notificationSchedules.$inferSelect,
    Partial<typeof notificationSchedules.$inferInsert>,
    Partial<typeof notificationSchedules.$inferInsert>
  >
  implements NotificationScheduleRepository
{
  constructor(db: DrizzleDb) {
    super(
      db,
      { table: notificationSchedules },
      NotificationScheduleDrizzleMapper.instance,
    );
  }

  /**
   * Find schedules by trip ID
   */
  async findByTripId(tripId: string): Promise<NotificationSchedule[]> {
    const records = await this.db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.tripId, tripId))
      .orderBy(desc(notificationSchedules.createdAt));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find schedule by name
   */
  async findByName(name: string): Promise<NotificationSchedule | null> {
    const [record] = await this.db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.name, name))
      .limit(1);

    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find schedule by trip ID and name
   */
  async findByTripIdAndName(
    tripId: string,
    name: string,
  ): Promise<NotificationSchedule | null> {
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

    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find schedules by type
   */
  async findByType(
    type: NotificationScheduleType,
  ): Promise<NotificationSchedule[]> {
    const records = await this.db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.notificationType, type.toString()))
      .orderBy(desc(notificationSchedules.createdAt));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all schedules with pagination and filters
   */
  async findAll(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<NotificationSchedule>> {
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
      items: records.map((record) => this.mapper.toDomain(record)),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Find active schedules
   */
  async findActive(now?: Date): Promise<NotificationSchedule[]> {
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

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find upcoming schedules
   */
  async findUpcoming(
    days?: number,
    now?: Date,
  ): Promise<NotificationSchedule[]> {
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

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Delete multiple schedules
   */
  async deleteMany(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    // Delete in batches
    let deletedCount = 0;
    for (const id of ids) {
      const [result] = await this.db
        .delete(notificationSchedules)
        .where(eq(notificationSchedules.id, id))
        .returning();
      if (result) deletedCount++;
    }

    return deletedCount;
  }

  /**
   * Count schedules by filter
   */
  async count(filter?: NotificationScheduleFilter): Promise<number> {
    const whereClause = this.buildWhereClause(filter);

    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationSchedules)
      .where(whereClause)
      .limit(1);

    return result?.count ?? 0;
  }

  /**
   * Update last run time
   */
  async updateLastRun(
    id: string,
    lastRun: Date,
  ): Promise<NotificationSchedule> {
    const [record] = await this.db
      .update(notificationSchedules)
      .set({ scheduledFor: lastRun })
      .where(eq(notificationSchedules.id, id))
      .returning();

    return this.mapper.toDomain(record);
  }

  /**
   * Toggle schedule active state
   */
  async toggleActive(id: string): Promise<NotificationSchedule> {
    // Get current state
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

    return this.mapper.toDomain(record);
  }

  /**
   * Bulk toggle active state
   */
  async bulkToggleActive(ids: string[], isActive: boolean): Promise<number> {
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
  }

  /**
   * Get execution history for a schedule
   */
  async getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Promise<
    Array<{
      id: string;
      executedAt: Date;
      notification: {
        id: string;
        title: string;
        body: string;
        createdAt: Date;
      } | null;
    }>
  > {
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
  }

  /**
   * Count executions for a schedule
   */
  async countExecutions(scheduleId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationScheduleExecutions)
      .where(eq(notificationScheduleExecutions.scheduleId, scheduleId))
      .limit(1);

    return result?.count ?? 0;
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

    if (filter.tripId !== undefined) {
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
