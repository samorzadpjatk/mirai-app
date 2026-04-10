import type { PrismaClient } from "@mirai-app/frameworks/prisma";
import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  DeliveryFilters,
  PaginationOptions,
  DeliveryStats,
} from "@mirai-app/use-cases";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { NotificationDeliveryMapper } from "../../mappers/prisma/NotificationDeliveryMapper";

// Type definitions for Prisma inputs/outputs
type PrismaNotificationDelivery = {
  id: string;
  notificationId: string;
  tripId: string | null;
  status: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  deliveryStartedAt: Date;
  deliveryCompletedAt: Date | null;
  errors: string | null;
  scheduleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  notification?: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    createdBy?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      authUserId: string;
    } | null;
  } | null;
};

type PrismaNotificationDeliveryCreateInput = {
  id: string;
  notificationId: string;
  tripId: string | null;
  status: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  deliveryStartedAt: Date;
  deliveryCompletedAt: Date | null;
  errors: string | null;
  scheduleId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaNotificationDeliveryUpdateInput = {
  notificationId?: string;
  tripId?: string | null;
  status?: string;
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
  deliveryStartedAt?: Date;
  deliveryCompletedAt?: Date | null;
  errors?: string | null;
  scheduleId?: string | null;
  updatedAt: Date;
};

/**
 * Adapter to make NotificationDeliveryMapper compatible with EntityMapper interface
 */
const NotificationDeliveryMapperAdapter: EntityMapper<
  NotificationDelivery,
  PrismaNotificationDelivery,
  PrismaNotificationDeliveryCreateInput,
  PrismaNotificationDeliveryUpdateInput
> = {
  toDomain: NotificationDeliveryMapper.toDomain,
  toPrismaCreate: NotificationDeliveryMapper.toPrismaCreate,
  toPrismaUpdate: NotificationDeliveryMapper.toPrismaUpdate,
};

/**
 * PrismaNotificationDeliveryRepository
 *
 * Implements the NotificationDeliveryRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const deliveryRepo = new PrismaNotificationDeliveryRepository(prisma);
 * const delivery = await deliveryRepo.findByNotificationId("notification-123");
 * ```
 */
export class PrismaNotificationDeliveryRepository
  extends BasePrismaRepository<
    NotificationDelivery,
    PrismaNotificationDelivery,
    PrismaNotificationDeliveryCreateInput,
    PrismaNotificationDeliveryUpdateInput
  >
  implements NotificationDeliveryRepository
{
  constructor(prisma: PrismaClient) {
    super(
      prisma,
      { model: prisma.notificationDelivery },
      NotificationDeliveryMapperAdapter,
    );
  }

  /**
   * Find deliveries with pagination and filters
   */
  async findMany(
    filters: Partial<DeliveryFilters>,
    pagination: PaginationOptions,
  ): Promise<NotificationDelivery[]> {
    const where = this.buildWhereClause(filters);

    const results = await this.model.findMany({
      where,
      orderBy: { deliveryStartedAt: "desc" },
      take: pagination.limit,
      skip: pagination.offset,
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
    });

    return results.map((record) =>
      this.mapper.toDomain(record as PrismaNotificationDelivery),
    );
  }

  /**
   * Count deliveries by filters
   */
  async count(filters?: Partial<DeliveryFilters>): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.model.count({ where });
  }

  /**
   * Find delivery by notification ID
   */
  async findByNotificationId(
    notificationId: string,
  ): Promise<NotificationDelivery | null> {
    const result = await this.model.findUnique({
      where: { notificationId },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            body: true,
            url: true,
            createdAt: true,
            tripId: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                authUserId: true,
              },
            },
          },
        },
      },
    });

    if (!result) return null;

    return this.mapper.toDomain(result as PrismaNotificationDelivery);
  }

  /**
   * Get delivery statistics
   */
  async getStats(filters?: Partial<DeliveryFilters>): Promise<DeliveryStats> {
    const where = this.buildWhereClause(filters);

    const [stats, statusBreakdown] = await Promise.all([
      this.model.aggregate({
        where,
        _count: { id: true },
        _sum: {
          totalRecipients: true,
          successCount: true,
          failureCount: true,
        },
        _avg: {
          successCount: true,
          failureCount: true,
        },
      }),
      this.model.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
    ]);

    const totalRecipients = stats._sum.totalRecipients ?? 0;
    const successCount = stats._sum.successCount ?? 0;

    const successRate =
      totalRecipients > 0 ? (successCount / totalRecipients) * 100 : 0;

    return {
      totalDeliveries: stats._count.id,
      totalRecipients,
      totalSuccess: successCount,
      totalFailures: stats._sum.failureCount ?? 0,
      avgSuccessPerDelivery: stats._avg.successCount ?? 0,
      avgFailuresPerDelivery: stats._avg.failureCount ?? 0,
      successRate,
      statusBreakdown: statusBreakdown.reduce(
        (acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Find failed or partially failed deliveries
   */
  async findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Promise<NotificationDelivery[]> {
    const results = await this.model.findMany({
      where: {
        tripId,
        OR: [{ status: "failure" }, { status: "partial_failure" }],
      },
      orderBy: { deliveryStartedAt: "desc" },
      take: pagination.limit,
      skip: pagination.offset,
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            body: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return results.map((record) =>
      this.mapper.toDomain(record as PrismaNotificationDelivery),
    );
  }

  /**
   * Count failed deliveries
   */
  async countFailed(tripId: string): Promise<number> {
    return this.model.count({
      where: {
        tripId,
        OR: [{ status: "failure" }, { status: "partial_failure" }],
      },
    });
  }

  private buildWhereClause(
    filters?: Partial<DeliveryFilters>,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filters?.tripId) {
      where.tripId = filters.tripId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.scheduleId) {
      where.scheduleId = filters.scheduleId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.deliveryStartedAt = {};
      if (filters.startDate) {
        (where.deliveryStartedAt as Record<string, Date>).gte =
          filters.startDate;
      }
      if (filters.endDate) {
        (where.deliveryStartedAt as Record<string, Date>).lte = filters.endDate;
      }
    }

    return where;
  }
}
