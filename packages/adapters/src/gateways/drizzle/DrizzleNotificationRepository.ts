import { sql, eq, and, inArray, desc } from "drizzle-orm";
import {
  notifications,
  type NotificationSelect,
  type NotificationInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Notification, type NotificationPriority } from "@mirai-app/domain";
import type { NotificationRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "./BaseDrizzleRepository";
import { NotificationDrizzleMapper } from "../../mappers/drizzle/NotificationDrizzleMapper";

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
}
