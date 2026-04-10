import type { EventRepository } from "@mirai-app/use-cases";
import { Event } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { EventMapper } from "../../mappers/prisma/EventMapper";

// Type definitions for Prisma inputs/outputs
type PrismaEvent = {
  id: string;
  creatorId: string;
  organizerGroupId: string | null;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
  files: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventCreateInput = {
  id: string;
  creatorId: string;
  organizerGroupId: string | null;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
  files: string[];
};

type EventUpdateInput = {
  creatorId: string;
  organizerGroupId: string | null;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
  files: string[];
};

/**
 * Adapter to make EventMapper compatible with EntityMapper interface
 */
const EventMapperAdapter: EntityMapper<
  Event,
  PrismaEvent,
  EventCreateInput,
  EventUpdateInput
> = {
  toDomain: EventMapper.toDomain,
  toPrismaCreate: EventMapper.toPrismaCreate,
  toPrismaUpdate: EventMapper.toPrismaUpdate,
};

/**
 * PrismaEventRepository
 *
 * Implements the EventRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * This repository manages both Event entities and UserEvent relationships
 * for tracking user interest and enlistment.
 *
 * @example
 * ```typescript
 * const eventRepo = new PrismaEventRepository(prisma);
 * const event = await eventRepo.findById("event-123");
 * ```
 */
export class PrismaEventRepository
  extends BasePrismaRepository<
    Event,
    PrismaEvent,
    EventCreateInput,
    EventUpdateInput
  >
  implements EventRepository
{
  constructor(prisma: PrismaClient) {
    super(
      prisma,
      { model: prisma.event as typeof prisma.event },
      EventMapperAdapter,
    );
  }

  /**
   * Find events by creator ID
   */
  async findByCreatorId(creatorId: string): Promise<Event[]> {
    const records = await this.model.findMany({
      where: { creatorId },
      orderBy: { startTime: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find events by organizer group ID
   */
  async findByOrganizerGroupId(groupId: string): Promise<Event[]> {
    const records = await this.model.findMany({
      where: { organizerGroupId: groupId },
      orderBy: { startTime: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find events by IDs
   */
  async findByIds(ids: string[]): Promise<Event[]> {
    if (ids.length === 0) return [];

    const records = await this.model.findMany({
      where: { id: { in: ids } },
    });
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
    const orderByField = options?.orderBy?.column ?? "startTime";
    const orderDirection = options?.orderBy?.direction ?? "asc";

    const records = await this.model.findMany({
      take: options?.limit,
      skip: options?.offset,
      orderBy: { [orderByField]: orderDirection },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find upcoming events (startTime > now)
   */
  async findUpcoming(): Promise<Event[]> {
    const now = new Date();
    const records = await this.model.findMany({
      where: { startTime: { gt: now } },
      orderBy: { startTime: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find ongoing events (startTime <= now <= endTime)
   */
  async findOngoing(): Promise<Event[]> {
    const now = new Date();
    const records = await this.model.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: { startTime: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find past events (endTime < now)
   */
  async findPast(): Promise<Event[]> {
    const now = new Date();
    const records = await this.model.findMany({
      where: { endTime: { lt: now } },
      orderBy: { startTime: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find events starting within a time range
   */
  async findStartingBetween(start: Date, end: Date): Promise<Event[]> {
    const records = await this.model.findMany({
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { startTime: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Count total events
   */
  async count(): Promise<number> {
    return (
      this.model as unknown as {
        count(args?: { where?: Record<string, unknown> }): Promise<number>;
      }
    ).count();
  }

  /**
   * Count events by organizer group ID
   */
  async countByOrganizerGroupId(groupId: string): Promise<number> {
    return (
      this.model as unknown as {
        count(args?: { where?: Record<string, unknown> }): Promise<number>;
      }
    ).count({
      where: { organizerGroupId: groupId },
    });
  }

  // ============================================================
  // User Event Operations (Interest/Enlistment)
  // ============================================================

  /**
   * Mark a user as interested in an event
   */
  async markInterested(userId: string, eventId: string): Promise<void> {
    await this.prisma.userEvent.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      create: {
        userId,
        eventId,
        interestedIn: true,
        enlistedIn: false,
      },
      update: {
        interestedIn: true,
      },
    });
  }

  /**
   * Mark a user as enlisted in an event
   */
  async markEnlisted(userId: string, eventId: string): Promise<void> {
    await this.prisma.userEvent.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      create: {
        userId,
        eventId,
        interestedIn: false,
        enlistedIn: true,
      },
      update: {
        enlistedIn: true,
      },
    });
  }

  /**
   * Remove a user's interest in an event
   */
  async removeInterest(userId: string, eventId: string): Promise<void> {
    await this.prisma.userEvent.updateMany({
      where: {
        userId,
        eventId,
      },
      data: {
        interestedIn: false,
      },
    });
  }

  /**
   * Remove a user's enlistment from an event
   */
  async removeEnlistment(userId: string, eventId: string): Promise<void> {
    await this.prisma.userEvent.updateMany({
      where: {
        userId,
        eventId,
      },
      data: {
        enlistedIn: false,
      },
    });
  }

  /**
   * Check if user is interested in event
   */
  async isInterested(userId: string, eventId: string): Promise<boolean> {
    const record = await this.prisma.userEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: { interestedIn: true },
    });
    return record?.interestedIn ?? false;
  }

  /**
   * Check if user is enlisted in event
   */
  async isEnlisted(userId: string, eventId: string): Promise<boolean> {
    const record = await this.prisma.userEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: { enlistedIn: true },
    });
    return record?.enlistedIn ?? false;
  }

  /**
   * Get interested users for an event
   */
  async getInterestedUsers(eventId: string): Promise<string[]> {
    const records = await this.prisma.userEvent.findMany({
      where: {
        eventId,
        interestedIn: true,
      },
      select: { userId: true },
    });
    return records.map((r) => r.userId);
  }

  /**
   * Get enlisted users for an event
   */
  async getEnlistedUsers(eventId: string): Promise<string[]> {
    const records = await this.prisma.userEvent.findMany({
      where: {
        eventId,
        enlistedIn: true,
      },
      select: { userId: true },
    });
    return records.map((r) => r.userId);
  }

  /**
   * Get events a user is interested in
   */
  async getInterestedEventsForUser(userId: string): Promise<Event[]> {
    const records = await this.model.findMany({
      where: {
        userEvents: {
          some: {
            userId,
            interestedIn: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Get events a user is enlisted in
   */
  async getEnlistedEventsForUser(userId: string): Promise<Event[]> {
    const records = await this.model.findMany({
      where: {
        userEvents: {
          some: {
            userId,
            enlistedIn: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Count interested users for an event
   */
  async countInterested(eventId: string): Promise<number> {
    return this.prisma.userEvent.count({
      where: {
        eventId,
        interestedIn: true,
      },
    });
  }

  /**
   * Count enlisted users for an event
   */
  async countEnlisted(eventId: string): Promise<number> {
    return this.prisma.userEvent.count({
      where: {
        eventId,
        enlistedIn: true,
      },
    });
  }
}
