import { Effect, Either } from "effect";
import { UserId, TripId, NotificationScheduleId, type User, type Trip } from "@mirai-app/domain";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import { UserPortTag } from "../../../user/ports/UserPort";
import { TripPortTag } from "../../../trip/ports/TripPort";
import type {
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
  execute(input: GetAllSchedulesInput) {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;
      const userPort = yield* UserPortTag;
      const tripPort = yield* TripPortTag;

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

      // Collect unique user IDs and trip IDs from schedules
      const userIds = new Set<string>();
      const tripIds = new Set<string>();

      for (const schedule of result.schedules) {
        if (schedule.createdById) {
          userIds.add(UserId.toString(schedule.createdById));
        }
        if (schedule.tripId) {
          tripIds.add(TripId.toString(schedule.tripId));
        }
      }

      // Fetch all related users and trips in parallel
      const userEffects = Array.from(userIds).map((userId) =>
        Effect.either(userPort.findById(UserId.unsafeCreate(userId))),
      );
      const tripEffects = Array.from(tripIds).map((tripId) =>
        Effect.either(tripPort.findById(TripId.unsafeCreate(tripId))),
      );
      const executionCountEffects = result.schedules.map((schedule) =>
        Effect.either(schedulePort.countExecutions(schedule.id)),
      );

      // Execute all fetches in parallel
      const [userResults, tripResults, executionCountResults] = yield* Effect.all([
        userEffects.length > 0 ? Effect.all(userEffects) : Effect.succeed([]),
        tripEffects.length > 0 ? Effect.all(tripEffects) : Effect.succeed([]),
        executionCountEffects.length > 0
          ? Effect.all(executionCountEffects)
          : Effect.succeed([]),
      ]);

      // Build lookup maps
      const userMap = new Map<string, User>();
      const userIdArray = Array.from(userIds);
      for (let i = 0; i < userIdArray.length; i++) {
        const userId = userIdArray[i];
        const result = userResults[i];
        if (userId && result && Either.isRight(result) && result.right) {
          userMap.set(userId, result.right);
        }
      }

      const tripMap = new Map<string, Trip>();
      const tripIdArray = Array.from(tripIds);
      for (let i = 0; i < tripIdArray.length; i++) {
        const tripId = tripIdArray[i];
        const result = tripResults[i];
        if (tripId && result && Either.isRight(result) && result.right) {
          tripMap.set(tripId, result.right);
        }
      }

      // Map schedules to fully populated DTOs
      const schedules = result.schedules.map((schedule, index) => {
        const createdById = UserId.toString(schedule.createdById);
        const tripId = schedule.tripId ? TripId.toString(schedule.tripId) : null;
        const user = userMap.get(createdById);
        const trip = tripId ? tripMap.get(tripId) : null;
        const executionCountResult = executionCountResults[index];
        const executionCount =
          executionCountResult && Either.isRight(executionCountResult)
            ? executionCountResult.right
            : 0;

        return {
          id: NotificationScheduleId.toString(schedule.id),
          name: schedule.name,
          tripId: tripId,
          notificationType: schedule.notificationType,
          notificationTitle: schedule.notificationTitle,
          notificationBody: schedule.notificationBody,
          notificationUrl: schedule.notificationUrl,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          hour: schedule.hour,
          minute: schedule.minute,
          isActive: schedule.isActive,
          lastRun: schedule.lastRun,
          createdById: createdById,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          createdBy: user
            ? {
                id: schedule.createdById,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
          trip: trip
            ? {
                id: schedule.tripId,
                name: trip.name,
              }
            : null,
          executionCount,
        };
      });

      return {
        schedules,
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
