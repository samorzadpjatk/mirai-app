import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { NotificationSchedule } from "../entities/NotificationSchedule";
import type { NotificationScheduleId } from "../value-objects/NotificationId";

  /**
   * NotificationSchedule Port
   * Defines repository operations for notification schedules
   *
   * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
   * Notification schedules are trip-scoped - users need trip-level access.
   *
   * Note: Methods may require AuthContextTag and AuthZPortTag in the Effect context
   * for authorization. Each method documents its auth requirements:
   * - read: User can view if they have trip access
   * - write: User can modify if they are the creator or have admin/organizer role
   */
export interface INotificationSchedulePort {
  /**
   * Find all schedules with filtering
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   */
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
    unknown
  >;
  /**
   * Find active schedules
   * Note: Authorization via AuthContext (organizers and admins)
   */
  findActive(): Effect.Effect<NotificationSchedule[], IPortError, unknown>;

  /**
   * Find upcoming schedules within N days
   * Note: Authorization via AuthContext (organizers and admins)
   */
  findUpcoming(
    days: number,
  ): Effect.Effect<NotificationSchedule[], IPortError, unknown>;

  /**
   * Find schedule by ID
   * Note: Authorization via AuthContext (trip participants can view)
   */
  findById(
    id: NotificationScheduleId,
  ): Effect.Effect<NotificationSchedule | null, IPortError, unknown>;

  /**
   * Find schedule by trip ID and name
   * Note: Authorization via AuthContext (trip participants can view)
   */
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, IPortError, unknown>;

  /**
   * Create new schedule
   * Note: Authorization via AuthContext (organizers only)
   */
  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, IPortError, unknown>;

  /**
   * Update existing schedule
   * Note: Authorization via AuthContext (creator or organizer)
   */
  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, IPortError, unknown>;

  /**
   * Delete schedule by ID
   * Note: Authorization via AuthContext (creator or admin)
   */
  delete(id: NotificationScheduleId): Effect.Effect<void, IPortError, unknown>;
  /**
   * Delete multiple schedules
   * Note: Authorization via AuthContext (creator or admin for each)
   */
  deleteMany(ids: NotificationScheduleId[]): Effect.Effect<number, IPortError, unknown>;

  /**
   * Toggle schedule active state
   * Note: Authorization via AuthContext (organizers only)
   */
  toggleActive(
    id: NotificationScheduleId,
    isActive: boolean,
  ): Effect.Effect<NotificationSchedule, IPortError, unknown>;

  /**
   * Toggle multiple schedules
   * Note: Authorization via AuthContext (organizers only)
   */
  toggleMany(
    ids: NotificationScheduleId[],
    isActive: boolean,
  ): Effect.Effect<number, IPortError, unknown>;

  /**
   * Update schedule last run timestamp
   * Note: Authorization via AuthContext (system/background only)
   */
  updateLastRun(
    id: NotificationScheduleId,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, IPortError, unknown>;

  /**
   * Count schedule executions
   * Note: Authorization via AuthContext (trip participants can view)
   */
  countExecutions(id: NotificationScheduleId): Effect.Effect<number, IPortError, unknown>;
}
