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
  ): Promise<NotificationDelivery[]>;

  /**
   * Count deliveries by filters
   */
  count(filters?: Partial<DeliveryFilters>): Promise<number>;

  /**
   * Find delivery by notification ID
   */
  findByNotificationId(
    notificationId: string,
  ): Promise<NotificationDelivery | null>;

  /**
   * Get delivery statistics
   */
  getStats(filters?: Partial<DeliveryFilters>): Promise<DeliveryStats>;

  /**
   * Find failed or partially failed deliveries
   */
  findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Promise<NotificationDelivery[]>;

  /**
   * Count failed deliveries
   */
  countFailed(tripId: string): Promise<number>;
}
