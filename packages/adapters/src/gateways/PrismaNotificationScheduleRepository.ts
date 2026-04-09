import type { NotificationScheduleRepository } from "@mirai-app/use-cases";
import type {
  NotificationSchedule,
  NotificationScheduleType,
  NotificationScheduleFilter,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { NotificationScheduleMapper } from "../mappers/NotificationScheduleMapper";

// Type definitions for Prisma inputs/outputs
type PrismaNotificationSchedule = {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  notificationType: string;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
  lastRun: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaNotificationScheduleCreateInput = {
  id: string;
  tripId: string;
  name: string;
  description?: string | null;
  notificationType: string;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
  lastRun?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaNotificationScheduleUpdateInput = {
  tripId?: string;
  name?: string;
  description?: string | null;
  notificationType?: string;
  startDate?: Date;
  endDate?: Date;
  hour?: number;
  minute?: number;
  isActive?: boolean;
  lastRun?: Date | null;
  updatedAt: Date;
};

/**
 * Adapter to make NotificationScheduleMapper compatible with EntityMapper interface
 */
const NotificationScheduleMapperAdapter: EntityMapper<
  NotificationSchedule,
  PrismaNotificationSchedule,
  PrismaNotificationScheduleCreateInput,
  PrismaNotificationScheduleUpdateInput
> = {
  toDomain: NotificationScheduleMapper.toDomain,
  toPrismaCreate: NotificationScheduleMapper.toPrismaCreate,
  toPrismaUpdate: NotificationScheduleMapper.toPrismaUpdate,
};

/**
 * PrismaNotificationScheduleRepository
 *
 * Implements the NotificationScheduleRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * Note: Complex polymorphic operations and multi-model queries remain
 * as custom implementations beyond the standard CRUD pattern.
 */
export class PrismaNotificationScheduleRepository
  extends BasePrismaRepository<
    NotificationSchedule,
    PrismaNotificationSchedule,
    PrismaNotificationScheduleCreateInput,
    PrismaNotificationScheduleUpdateInput
  >
  implements NotificationScheduleRepository
{
  constructor(prisma: PrismaClient) {
    super(
      prisma,
      { model: prisma.notificationSchedule },
      NotificationScheduleMapperAdapter,
    );
  }

  /**
   * Find schedules by trip ID
   */
  async findByTripId(tripId: string): Promise<NotificationSchedule[]> {
    const records = await this.model.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find schedule by name
   */
  async findByName(name: string): Promise<NotificationSchedule | null> {
    const records = await this.model.findMany({
      where: { name },
      take: 1,
    });

    if (records.length === 0) {
      return null;
    }

    return this.mapper.toDomain(records[0]);
  }

  /**
   * Find schedule by trip ID and name
   */
  async findByTripIdAndName(
    tripId: string,
    name: string,
  ): Promise<NotificationSchedule | null> {
    const records = await this.model.findMany({
      where: { tripId, name },
      take: 1,
    });

    if (records.length === 0) {
      return null;
    }

    return this.mapper.toDomain(records[0]);
  }

  /**
   * Find schedules by type
   */
  async findByType(
    type: NotificationScheduleType,
  ): Promise<NotificationSchedule[]> {
    const records = await this.model.findMany({
      where: { notificationType: type.toString() },
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all schedules with pagination and filters
   */
  async findAll(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<NotificationSchedule>> {
    const where = this.buildWhereClause(options?.filter);

    const limit = options?.pagination?.limit ?? 50;
    const offset = options?.pagination?.offset ?? 0;

    const [records, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.model.count({ where }),
    ]);

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

    const records = await this.model.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentTime },
        endDate: { gte: currentTime },
      },
      orderBy: [{ hour: "asc" }, { minute: "asc" }],
    });

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

    const records = await this.model.findMany({
      where: {
        isActive: true,
        startDate: { lte: futureDate },
        endDate: { gte: currentTime },
      },
      orderBy: { startDate: "asc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Delete multiple schedules
   */
  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.model.deleteMany({
      where: { id: { in: ids } },
    });

    return result.count;
  }

  /**
   * Count schedules by filter
   */
  async count(filter?: NotificationScheduleFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.model.count({ where });
  }

  /**
   * Update last run time
   */
  async updateLastRun(
    id: string,
    lastRun: Date,
  ): Promise<NotificationSchedule> {
    const record = await this.model.update({
      where: { id },
      data: { lastRun },
    });

    return this.mapper.toDomain(record);
  }

  /**
   * Toggle schedule active state
   */
  async toggleActive(id: string): Promise<NotificationSchedule> {
    // Get current state
    const current = await this.findById(id);
    if (!current) {
      throw new Error("Notification schedule not found");
    }

    const record = await this.model.update({
      where: { id },
      data: { isActive: !current.isActive },
    });

    return this.mapper.toDomain(record);
  }

  /**
   * Bulk toggle active state
   */
  async bulkToggleActive(ids: string[], isActive: boolean): Promise<number> {
    const result = await this.model.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });

    return result.count;
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
    const executions = await this.prisma.notificationScheduleExecution.findMany(
      {
        where: { scheduleId },
        orderBy: { executedAt: "desc" },
        take: limit,
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              body: true,
              createdAt: true,
            },
          },
        },
      },
    );

    return (
      executions as Array<{
        id: string;
        executedAt: Date;
        notification: {
          id: string;
          title: string;
          body: string;
          createdAt: Date;
        } | null;
      }>
    ).map((execution) => ({
      id: execution.id,
      executedAt: execution.executedAt,
      notification: execution.notification,
    }));
  }

  /**
   * Count executions for a schedule
   */
  async countExecutions(scheduleId: string): Promise<number> {
    return this.prisma.notificationScheduleExecution.count({
      where: { scheduleId },
    });
  }

  /**
   * Build Prisma where clause from filter
   */
  private buildWhereClause(
    filter?: NotificationScheduleFilter,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (!filter) {
      return where;
    }

    if (filter.tripId !== undefined) {
      where.tripId = filter.tripId;
    }

    if (filter.notificationType) {
      where.notificationType = filter.notificationType.toString();
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.startDateFrom || filter.startDateTo) {
      where.startDate = {};
      if (filter.startDateFrom) {
        (where.startDate as Record<string, unknown>).gte = filter.startDateFrom;
      }
      if (filter.startDateTo) {
        (where.startDate as Record<string, unknown>).lte = filter.startDateTo;
      }
    }

    if (filter.search) {
      where.name = {
        contains: filter.search,
        mode: "insensitive",
      };
    }

    return where;
  }
}
