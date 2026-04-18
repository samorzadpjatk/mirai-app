import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { NotificationDelivery } from "../entities/NotificationDelivery";
import type { NotificationDeliveryStats } from "../entities/NotificationDeliveryStats";
import type { NotificationDeliveryId } from "../value-objects/NotificationId";
import type { NotificationScheduleId } from "../value-objects/NotificationId";
import type { NotificationId } from "../value-objects/NotificationId";

/**
 * NotificationDelivery Port
 * Defines repository operations for notification deliveries
 *
 * Methods requiring authorization use AuthContext pattern via Effect context.
 */
export interface INotificationDeliveryPort {
  findAll(params: {
    tripId?: string;
    status?: string;
    scheduleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      deliveries: NotificationDelivery[];
      total: number;
    },
    IPortError,
    unknown
  >;
  findByNotificationId(
    notificationId: NotificationId,
  ): Effect.Effect<NotificationDelivery | null, IPortError, unknown>;
  findFailed(params: {
    tripId?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      deliveries: NotificationDelivery[];
      total: number;
    },
    IPortError,
    unknown
  >;
  getStats(params: {
    tripId?: string;
    startDate?: Date;
    endDate?: Date;
    scheduleId?: string;
  }): Effect.Effect<NotificationDeliveryStats, IPortError, unknown>;
  create(
    delivery: NotificationDelivery,
  ): Effect.Effect<NotificationDelivery, IPortError, unknown>;
  update(
    delivery: NotificationDelivery,
  ): Effect.Effect<NotificationDelivery, IPortError, unknown>;
}
