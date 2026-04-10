import type { NotificationRepository } from "@mirai-app/use-cases";
import type {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { NotificationMapper } from "../../mappers/prisma/NotificationMapper";

// Type definitions for Prisma inputs/outputs
type PrismaNotification = {
  id: string;
  tripId: string;
  createdById: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  scheduledFor: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type NotificationCreateInput = {
  id: string;
  tripId: string;
  createdById: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  scheduledFor: Date | null;
  sentAt: Date | null;
};

type NotificationUpdateInput = {
  title: string;
  body: string;
  status: string;
  priority: string;
  scheduledFor: Date | null;
  sentAt: Date | null;
};

/**
 * Adapter to make NotificationMapper compatible with EntityMapper interface
 */
const NotificationMapperAdapter: EntityMapper<
  Notification,
  PrismaNotification,
  NotificationCreateInput,
  NotificationUpdateInput
> = {
  toDomain: NotificationMapper.toDomain,
  toPrismaCreate: NotificationMapper.toPrismaCreate,
  toPrismaUpdate: NotificationMapper.toPrismaUpdate,
};

/**
 * PrismaNotificationRepository
 *
 * Implements the NotificationRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const notificationRepo = new PrismaNotificationRepository(prisma);
 * const notification = await notificationRepo.findById("notification-123");
 * ```
 */
export class PrismaNotificationRepository
  extends BasePrismaRepository<
    Notification,
    PrismaNotification,
    NotificationCreateInput,
    NotificationUpdateInput
  >
  implements NotificationRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.notification }, NotificationMapperAdapter);
  }

  /**
   * Find notifications by trip ID
   */
  async findByTripId(tripId: string): Promise<Notification[]> {
    const records = await this.model.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find notifications by status
   */
  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    const records = await this.model.findMany({
      where: { status: status.toString() },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find notifications by trip ID and status
   */
  async findByTripIdAndStatus(
    tripId: string,
    status: NotificationStatus,
  ): Promise<Notification[]> {
    const records = await this.model.findMany({
      where: {
        tripId,
        status: status.toString(),
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find notifications by priority
   */
  async findByPriority(
    priority: NotificationPriority,
  ): Promise<Notification[]> {
    const records = await this.model.findMany({
      where: { priority: priority.toString() },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find notifications ready to be sent (status is READY and scheduled time has passed)
   */
  async findReadyToSend(): Promise<Notification[]> {
    const now = new Date();
    const records = await this.model.findMany({
      where: {
        status: "READY",
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
      },
      orderBy: { priority: "desc", createdAt: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find overdue notifications (DRAFT with scheduled time in the past)
   */
  async findOverdue(): Promise<Notification[]> {
    const now = new Date();
    const records = await this.model.findMany({
      where: {
        status: "DRAFT",
        scheduledFor: { lt: now },
      },
      orderBy: { scheduledFor: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find notifications created by a specific user
   */
  async findByCreatedById(createdById: string): Promise<Notification[]> {
    const records = await this.model.findMany({
      where: { createdById },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Count notifications by status
   */
  async countByStatus(status: NotificationStatus): Promise<number> {
    // @ts-expect-error - count method not in base type but available on Prisma model
    return this.model.count({
      where: { status: status.toString() },
    });
  }

  /**
   * Count pending notifications by trip ID
   */
  async countPendingByTripId(tripId: string): Promise<number> {
    // @ts-expect-error - count method not in base type but available on Prisma model
    return this.model.count({
      where: {
        tripId,
        status: { in: ["DRAFT", "READY"] },
      },
    });
  }
}
