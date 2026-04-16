import { Context, Effect } from "effect";
import type { NotificationDeliveryDTO } from "../../dto";
import type { DatabaseError } from "../errors";

/**
 * NotificationDeliveryGateway Port
 *
 * This interface defines what operations the application needs
 * for notification delivery management.
 * All methods return DTOs instead of domain entities.
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
    url?: string | null;
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
   * Find delivery by notification ID
   */
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationDelivery | null, DatabaseError, never>;

  /**
   * Find deliveries with filters and pagination
   */
  findMany(
    filters: Partial<DeliveryFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], DatabaseError, never>;

  /**
   * Find failed deliveries for a trip
   */
  findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], DatabaseError, never>;
}

/**
 * NotificationDeliveryGateway Context.Tag for Effect dependency injection
 */
export class NotificationDeliveryGatewayTag extends Context.Tag(
  "NotificationDeliveryGateway",
)<NotificationDeliveryGatewayTag, NotificationDeliveryGateway>() {}
