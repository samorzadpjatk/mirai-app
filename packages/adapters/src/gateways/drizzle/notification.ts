import { sql, eq, and, inArray, desc, asc, isNull, lte, lt } from "drizzle-orm";
import {
  notifications,
  type NotificationSelect,
  type NotificationInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import {
  Notification,
  NotificationStatus,
  type NotificationPriority,
} from "@mirai-app/domain";
import type { NotificationRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { NotificationDrizzleMapper } from "../../mappers/drizzle/notification";

/**
 * DrizzleNotificationRepository
 *
 * Repository implementation using Drizzle ORM for Notification entity.
 */
export class DrizzleNotificationRepository
  extends BaseDrizzleRepository<
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

  async findByTripId(tripId: string): Promise<Notification[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.tripId, tripId))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByPriority(
    priority: NotificationPriority,
  ): Promise<Notification[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.priority, priority))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findRecent(limit: number = 10): Promise<Notification[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .orderBy(desc(this.table.createdAt))
      .limit(limit);
    return records.map((r) => this.mapper.toDomain(r));
  }

  async countByTripId(tripId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.tripId, tripId));
    return result[0]?.count ?? 0;
  }

  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.status, status))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByTripIdAndStatus(
    tripId: string,
    status: NotificationStatus,
  ): Promise<Notification[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.tripId, tripId), eq(this.table.status, status)))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findReadyToSend(): Promise<Notification[]> {
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
        // Priority order: URGENT > HIGH > NORMAL > LOW
        sql`CASE ${this.table.priority}
          WHEN 'URGENT' THEN 4
          WHEN 'HIGH' THEN 3
          WHEN 'NORMAL' THEN 2
          WHEN 'LOW' THEN 1
        END DESC`,
        asc(this.table.createdAt),
      );
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findOverdue(): Promise<Notification[]> {
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
  }

  async findByCreatedById(createdById: string): Promise<Notification[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.createdById, createdById))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async countByStatus(status: NotificationStatus): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.status, status));
    return result[0]?.count ?? 0;
  }

  async countPendingByTripId(tripId: string): Promise<number> {
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
  }
}
