import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Notification } from "../entities/Notification";
import type { NotificationPush } from "../entities/NotificationPush";
import type { NotificationId } from "../value-objects/NotificationId";

/**
 * Notification Port
 * Defines repository operations for notifications
 */
export interface INotificationPort {
  findById(
    id: NotificationId,
  ): Effect.Effect<Notification | null, IPortError, never>;
  findByUserId(
    userId: string,
  ): Effect.Effect<Notification[], IPortError, never>;
  findPaginatedByUserId(
    userId: string,
    params: { page: number; pageSize: number },
  ): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  findByTripId(
    tripId: string,
  ): Effect.Effect<Notification[], IPortError, never>;
  findPaginated(params: {
    tripId?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  create(
    notification: Notification,
  ): Effect.Effect<Notification, IPortError, never>;
  update(
    notification: Notification,
  ): Effect.Effect<Notification, IPortError, never>;
  delete(id: NotificationId): Effect.Effect<void, IPortError, never>;
  markAsSent(id: NotificationId): Effect.Effect<void, IPortError, never>;
  markAsFailed(
    id: NotificationId,
    reason: string,
  ): Effect.Effect<void, IPortError, never>;
  findWithPushes(
    notificationId: NotificationId,
  ): Effect.Effect<
    { notification: Notification; pushes: NotificationPush[] } | null,
    IPortError,
    never
  >;
  getFailedPushes(
    notificationId: NotificationId,
  ): Effect.Effect<NotificationPush[], IPortError, never>;
  resetFailedPushes(
    notificationId: NotificationId,
  ): Effect.Effect<void, IPortError, never>;
}
