import { Context, Effect } from "effect";

/**
 * NotificationDeliveryRepository Port
 *
 * This interface defines what operations the application needs
 * for notification delivery management.
 */

export type DeliveryStatus =
  | "pending"
  | "success"
  | "partial_failure"
  | "failure";

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  tripId: string;
  status: DeliveryStatus;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  deliveryStartedAt: Date;
  deliveryCompletedAt?: Date | null;
  errorLog?: string | null;
  scheduleId?: string | null;
  notification?: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    createdBy?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      authUserId?: string;
    } | null;
  } | null;
}

export interface DeliveryFilters {
  tripId?: string;
  status?: DeliveryStatus;
  scheduleId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

/**
 * Alias for pagination options in delivery context
 */
export type DeliveryPaginationOptions = PaginationOptions;

export interface DeliveryStats {
  totalDeliveries: number;
  totalRecipients: number;
  totalSuccess: number;
  totalFailures: number;
  avgSuccessPerDelivery: number;
  avgFailuresPerDelivery: number;
  successRate: number;
  statusBreakdown: Record<string, number>;
}

export interface NotificationDeliveryRepository {
  /**
   * Find deliveries with pagination and filters
   */
  findMany(
    filters: Partial<DeliveryFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], never, never>;

  /**
   * Count deliveries by filters
   */
  count(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<number, never, never>;

  /**
   * Find delivery by notification ID
   */
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationDelivery | null, never, never>;

  /**
   * Get delivery statistics
   */
  getStats(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<DeliveryStats, never, never>;

  /**
   * Find failed or partially failed deliveries
   */
  findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], never, never>;

  /**
   * Count failed deliveries
   */
  countFailed(tripId: string): Effect.Effect<number, never, never>;
}

/**
 * NotificationDeliveryRepository Context.Tag for Effect dependency injection
 */
export class NotificationDeliveryRepositoryTag extends Context.Tag(
  "NotificationDeliveryRepository",
)<
  NotificationDeliveryRepositoryTag,
  {
    findMany: (
      filters: Partial<DeliveryFilters>,
      pagination: DeliveryPaginationOptions,
    ) => Effect.Effect<NotificationDelivery[], never, never>;
    count: (
      filters?: Partial<DeliveryFilters>,
    ) => Effect.Effect<number, never, never>;
    findByNotificationId: (
      notificationId: string,
    ) => Effect.Effect<NotificationDelivery | null, never, never>;
    getStats: (
      filters?: Partial<DeliveryFilters>,
    ) => Effect.Effect<DeliveryStats, never, never>;
    findFailed: (
      tripId: string,
      pagination: DeliveryPaginationOptions,
    ) => Effect.Effect<NotificationDelivery[], never, never>;
    countFailed: (tripId: string) => Effect.Effect<number, never, never>;
  }
>() {}
