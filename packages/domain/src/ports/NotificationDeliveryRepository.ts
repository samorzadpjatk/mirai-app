import type { Effect } from "effect";
import type { DatabaseError } from "./DatabaseError";

/**
 * Delivery status for notification delivery
 */
export type DeliveryStatus =
  | "pending"
  | "success"
  | "partial_failure"
  | "failure";

/**
 * NotificationDelivery entity
 */
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

/**
 * Filters for delivery queries
 */
export interface DeliveryFilters {
  tripId?: string;
  status?: DeliveryStatus;
  scheduleId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit: number;
  offset: number;
}

/**
 * Delivery statistics
 */
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

/**
 * NotificationDeliveryRepository Port
 *
 * This interface defines what operations the application needs
 * for notification delivery management.
 */
export interface NotificationDeliveryRepository {
  /**
   * Find deliveries with pagination and filters
   */
  findMany(
    filters: Partial<DeliveryFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], DatabaseError, never>;

  /**
   * Count deliveries by filters
   */
  count(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Find delivery by notification ID
   */
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationDelivery | null, DatabaseError, never>;

  /**
   * Get delivery statistics
   */
  getStats(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<DeliveryStats, DatabaseError, never>;

  /**
   * Find failed or partially failed deliveries
   */
  findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], DatabaseError, never>;

  /**
   * Count failed deliveries
   */
  countFailed(tripId: string): Effect.Effect<number, DatabaseError, never>;
}
