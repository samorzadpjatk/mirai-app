/**
 * Notification DTOs
 *
 * Data Transfer Objects for Notification domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";
import type {
  NotificationStatus,
  NotificationPriority,
  NotificationType,
} from "@mirai-app/domain";

/**
 * NotificationDTO - Lightweight representation of a notification
 */
export interface NotificationDTO {
  id: string;
  tripId: string | null;
  title: string;
  content: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NotificationDeliveryDTO - Representation of a notification delivery
 */
export interface NotificationDeliveryDTO {
  id: string;
  notificationId: string;
  userId: string;
  channel: string;
  status: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  retryCount: number;
}

/**
 * NotificationScheduleDTO - Representation of a notification schedule
 */
export interface NotificationScheduleDTO {
  id: string;
  name: string;
  tripId: string | null;
  notificationType: NotificationType;
  notificationTitle: string | null;
  notificationBody: string | null;
  notificationUrl: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
  createdById: string;
  lastRun: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated result for notification queries
 */
export type NotificationPaginatedResult = PaginatedResult<NotificationDTO>;
