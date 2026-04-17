import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { NotificationSchedule } from "../entities/NotificationSchedule";
import type { NotificationScheduleId } from "../value-objects/NotificationId";

/**
 * NotificationSchedule Port
 * Defines repository operations for notification schedules
 */
export interface INotificationSchedulePort {
  findAll(params: {
    tripId?: string | null;
    notificationType?: string;
    isActive?: boolean;
    startDateFrom?: Date;
    startDateTo?: Date;
    search?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      schedules: NotificationSchedule[];
      total: number;
      hasMore: boolean;
    },
    IPortError,
    never
  >;
  findActive(): Effect.Effect<NotificationSchedule[], IPortError, never>;
  findUpcoming(
    days: number,
  ): Effect.Effect<NotificationSchedule[], IPortError, never>;
  findById(
    id: NotificationScheduleId,
  ): Effect.Effect<NotificationSchedule | null, IPortError, never>;
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, IPortError, never>;
  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  delete(id: NotificationScheduleId): Effect.Effect<void, IPortError, never>;
  deleteMany(ids: NotificationScheduleId[]): Effect.Effect<number, IPortError, never>;
  toggleActive(
    id: NotificationScheduleId,
    isActive: boolean,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  toggleMany(
    ids: NotificationScheduleId[],
    isActive: boolean,
  ): Effect.Effect<number, IPortError, never>;
  updateLastRun(
    id: NotificationScheduleId,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  countExecutions(id: NotificationScheduleId): Effect.Effect<number, IPortError, never>;
}
