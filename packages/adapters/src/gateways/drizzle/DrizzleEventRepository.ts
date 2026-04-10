import {
  events,
  userEvents,
  type EventSelect,
  type EventInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq, and, gt, lt, gte, lte, sql, inArray } from "drizzle-orm";
import { Event } from "@mirai-app/domain";
import type { EventRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "./BaseDrizzleRepository";
import { EventDrizzleMapper } from "../../mappers/drizzle/EventDrizzleMapper";

/**
 * DrizzleEventRepository
 *
 * Repository implementation using Drizzle ORM for Event entity.
 * This repository manages both the events table and the userEvents
 * join table for tracking user interest and enlistment.
 */
export class DrizzleEventRepository
  extends BaseDrizzleRepository<Event, EventSelect, EventInsert, typeof events>
  implements EventRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: events,
      mapper: EventDrizzleMapper.instance,
    });
  }

  /**
   * Find events by creator ID
   */
  async findByCreatorId(creatorId: string): Promise<Event[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.creatorId, creatorId))
      .orderBy(this.table.startTime);

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find events by organizer group ID
   */
  async findByOrganizerGroupId(groupId: string): Promise<Event[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.organizerGroupId, groupId))
      .orderBy(this.table.startTime);

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find events by IDs
   */
  async findByIds(ids: string[]): Promise<Event[]> {
    if (ids.length === 0) return [];

    const records = await this.db
      .select()
      .from(this.table)
      .where(inArray(this.table.id, ids));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all events with pagination
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: "asc" | "desc" };
  }): Promise<Event[]> {
    let query = this.db.select().from(this.table);

    // Apply ordering (default to startTime asc)
    const orderColumn = options?.orderBy?.column ?? "startTime";
    const orderDirection = options?.orderBy?.direction ?? "asc";

    const columnRef = (this.table as unknown as Record<string, unknown>)[
      orderColumn
    ];
    if (columnRef) {
      query = query.orderBy(
        orderDirection === "asc"
          ? (columnRef as never)
          : sql`${columnRef as never} DESC`,
      );
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    const records = await query;
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find upcoming events (startTime > now)
   */
  async findUpcoming(): Promise<Event[]> {
    const now = new Date();
    const records = await this.db
      .select()
      .from(this.table)
      .where(gt(this.table.startTime, now))
      .orderBy(this.table.startTime);

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find ongoing events (startTime <= now <= endTime)
   */
  async findOngoing(): Promise<Event[]> {
    const now = new Date();
    const records = await this.db
      .select()
      .from(this.table)
      .where(and(lte(this.table.startTime, now), gte(this.table.endTime, now)))
      .orderBy(this.table.startTime);

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find past events (endTime < now)
   */
  async findPast(): Promise<Event[]> {
    const now = new Date();
    const records = await this.db
      .select()
      .from(this.table)
      .where(lt(this.table.endTime, now))
      .orderBy(sql`${this.table.startTime} DESC`);

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find events starting within a time range
   */
  async findStartingBetween(start: Date, end: Date): Promise<Event[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(
        and(gte(this.table.startTime, start), lte(this.table.startTime, end)),
      )
      .orderBy(this.table.startTime);

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Count total events
   */
  async count(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table);

    return result[0]?.count ?? 0;
  }

  /**
   * Count events by organizer group ID
   */
  async countByOrganizerGroupId(groupId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.organizerGroupId, groupId));

    return result[0]?.count ?? 0;
  }

  // ============================================================
  // User Event Operations (Interest/Enlistment)
  // ============================================================

  /**
   * Mark a user as interested in an event
   */
  async markInterested(userId: string, eventId: string): Promise<void> {
    await this.db
      .insert(userEvents)
      .values({
        userId,
        eventId,
        interestedIn: true,
        enlistedIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userEvents.userId, userEvents.eventId],
        set: { interestedIn: true, updatedAt: new Date() },
      });
  }

  /**
   * Mark a user as enlisted in an event
   */
  async markEnlisted(userId: string, eventId: string): Promise<void> {
    await this.db
      .insert(userEvents)
      .values({
        userId,
        eventId,
        interestedIn: false,
        enlistedIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userEvents.userId, userEvents.eventId],
        set: { enlistedIn: true, updatedAt: new Date() },
      });
  }

  /**
   * Remove a user's interest in an event
   */
  async removeInterest(userId: string, eventId: string): Promise<void> {
    await this.db
      .update(userEvents)
      .set({ interestedIn: false, updatedAt: new Date() })
      .where(
        and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
      );
  }

  /**
   * Remove a user's enlistment from an event
   */
  async removeEnlistment(userId: string, eventId: string): Promise<void> {
    await this.db
      .update(userEvents)
      .set({ enlistedIn: false, updatedAt: new Date() })
      .where(
        and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
      );
  }

  /**
   * Check if user is interested in event
   */
  async isInterested(userId: string, eventId: string): Promise<boolean> {
    const [record] = await this.db
      .select({ interestedIn: userEvents.interestedIn })
      .from(userEvents)
      .where(
        and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
      )
      .limit(1);

    return record?.interestedIn ?? false;
  }

  /**
   * Check if user is enlisted in event
   */
  async isEnlisted(userId: string, eventId: string): Promise<boolean> {
    const [record] = await this.db
      .select({ enlistedIn: userEvents.enlistedIn })
      .from(userEvents)
      .where(
        and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
      )
      .limit(1);

    return record?.enlistedIn ?? false;
  }

  /**
   * Get interested users for an event
   */
  async getInterestedUsers(eventId: string): Promise<string[]> {
    const records = await this.db
      .select({ userId: userEvents.userId })
      .from(userEvents)
      .where(
        and(eq(userEvents.eventId, eventId), eq(userEvents.interestedIn, true)),
      );

    return records.map((r) => r.userId);
  }

  /**
   * Get enlisted users for an event
   */
  async getEnlistedUsers(eventId: string): Promise<string[]> {
    const records = await this.db
      .select({ userId: userEvents.userId })
      .from(userEvents)
      .where(
        and(eq(userEvents.eventId, eventId), eq(userEvents.enlistedIn, true)),
      );

    return records.map((r) => r.userId);
  }

  /**
   * Get events a user is interested in
   */
  async getInterestedEventsForUser(userId: string): Promise<Event[]> {
    const records = await this.db
      .select({
        id: this.table.id,
        creatorId: this.table.creatorId,
        organizerGroupId: this.table.organizerGroupId,
        title: this.table.title,
        startTime: this.table.startTime,
        endTime: this.table.endTime,
        location: this.table.location,
        description: this.table.description,
        files: this.table.files,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt,
      })
      .from(this.table)
      .innerJoin(userEvents, eq(this.table.id, userEvents.eventId))
      .where(
        and(eq(userEvents.userId, userId), eq(userEvents.interestedIn, true)),
      )
      .orderBy(this.table.startTime);

    return records.map((record) => this.mapper.toDomain(record as EventSelect));
  }

  /**
   * Get events a user is enlisted in
   */
  async getEnlistedEventsForUser(userId: string): Promise<Event[]> {
    const records = await this.db
      .select({
        id: this.table.id,
        creatorId: this.table.creatorId,
        organizerGroupId: this.table.organizerGroupId,
        title: this.table.title,
        startTime: this.table.startTime,
        endTime: this.table.endTime,
        location: this.table.location,
        description: this.table.description,
        files: this.table.files,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt,
      })
      .from(this.table)
      .innerJoin(userEvents, eq(this.table.id, userEvents.eventId))
      .where(
        and(eq(userEvents.userId, userId), eq(userEvents.enlistedIn, true)),
      )
      .orderBy(this.table.startTime);

    return records.map((record) => this.mapper.toDomain(record as EventSelect));
  }

  /**
   * Count interested users for an event
   */
  async countInterested(eventId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userEvents)
      .where(
        and(eq(userEvents.eventId, eventId), eq(userEvents.interestedIn, true)),
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Count enlisted users for an event
   */
  async countEnlisted(eventId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userEvents)
      .where(
        and(eq(userEvents.eventId, eventId), eq(userEvents.enlistedIn, true)),
      );

    return result[0]?.count ?? 0;
  }
}
