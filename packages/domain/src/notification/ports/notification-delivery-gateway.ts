import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for notification delivery pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface NotificationDeliveryCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for notification delivery connection pagination
 */
export interface NotificationDeliveryConnectionArgs {
  first?: number;
  after?: NotificationDeliveryCursorData | null;
}

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
 * NotificationDeliveryGateway Port
 *
 * This interface defines what operations the application needs
 * for notification delivery management.
 */
export interface NotificationDeliveryGateway {
  /**
   * Count deliveries by filters
   */
  count(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Get delivery statistics
   */
  getStats(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<DeliveryStats, DatabaseError, never>;

  /**
   * Count failed deliveries
   */
  countFailed(tripId: string): Effect.Effect<number, DatabaseError, never>;

  /**
   * Find failed or partially failed deliveries with cursor-based pagination
   */
  findFailedConnection(
    tripId: string,
    args: NotificationDeliveryConnectionArgs,
  ): Effect.Effect<Connection<NotificationDelivery>, DatabaseError, never>;

  /**
   * Find deliveries by notification ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByNotificationIdConnection(
    notificationId: string,
    args: NotificationDeliveryConnectionArgs,
  ): Effect.Effect<Connection<NotificationDelivery>, DatabaseError, never>;

  /**
   * Find deliveries by user ID with cursor-based pagination
   */
  findByUserIdConnection(
    userId: string,
    args: NotificationDeliveryConnectionArgs,
  ): Effect.Effect<Connection<NotificationDelivery>, DatabaseError, never>;
}
