import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type {
  PaginatedNotificationSchedulesDTO,
  NotificationScheduleFilterDTO,
  PaginationParamsDTO,
} from "../../dto/NotificationDTOs";

/**
 * Input for GetAllSchedulesUseCase
 */
export interface GetAllSchedulesInput {
  filter?: NotificationScheduleFilterDTO;
  pagination: PaginationParamsDTO;
}

/**
 * Get All Schedules Use Case
 *
 * Retrieves all notification schedules with filtering and pagination.
 */
export class GetAllSchedulesUseCase {
  execute(
    input: GetAllSchedulesInput,
  ): Effect.Effect<
    PaginatedNotificationSchedulesDTO,
    ApplicationError,
    NotificationSchedulePortTag
  > {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const result = yield* schedulePort.findAll({
        tripId: input.filter?.tripId,
        notificationType: input.filter?.notificationType,
        isActive: input.filter?.isActive,
        startDateFrom: input.filter?.startDateFrom,
        startDateTo: input.filter?.startDateTo,
        search: input.filter?.search,
        limit: input.pagination.limit,
        offset: input.pagination.offset,
      });

      return {
        schedules: result.schedules.map((s) => ({
          id: s.id,
          name: s.name,
          tripId: s.tripId,
          notificationType: s.notificationType,
          notificationTitle: s.notificationTitle,
          notificationBody: s.notificationBody,
          notificationUrl: s.notificationUrl,
          startDate: s.startDate,
          endDate: s.endDate,
          hour: s.hour,
          minute: s.minute,
          isActive: s.isActive,
          lastRun: s.lastRun,
          createdById: s.createdById,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          createdBy: null, // To be hydrated by adapter
          trip: null, // To be hydrated by adapter
          executionCount: 0, // To be hydrated by adapter
        })),
        pagination: {
          total: result.total,
          limit: input.pagination.limit,
          offset: input.pagination.offset,
          hasMore: result.hasMore,
        },
      };
    });
  }
}
