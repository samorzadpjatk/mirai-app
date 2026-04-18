import { Effect } from "effect";
import { NotificationScheduleId, NotificationId } from "@mirai-app/domain";
import {
  NotificationSchedulePortTag,
  NotificationScheduleExecutionPortTag,
  NotificationPortTag,
} from "../../ports/NotificationPort";

/**
 * Input for GetScheduleExecutionHistoryUseCase
 */
export interface GetScheduleExecutionHistoryInput {
  scheduleId: NotificationScheduleId;
  limit: number;
}

/**
 * Get Schedule Execution History Use Case
 *
 * Retrieves execution history for a notification schedule.
 */
export class GetScheduleExecutionHistoryUseCase {
  execute(input: GetScheduleExecutionHistoryInput) {
    return Effect.gen(function* () {
      const executionPort = yield* NotificationScheduleExecutionPortTag;
      const notificationPort = yield* NotificationPortTag;

      const executions = yield* executionPort.findByScheduleId(
        input.scheduleId,
        input.limit,
      );

      // Fetch all notifications in parallel
      const notificationIds = executions
        .map((e) => e.notificationId)
        .filter((id): id is NonNullable<typeof id> => id !== null);

      const uniqueNotificationIds = [
        ...new Set(notificationIds),
      ];

      const notifications = yield* Effect.all(
        uniqueNotificationIds.map((id) =>
          notificationPort.findById(NotificationId.unsafeCreate(id)),
        ),
        { concurrency: "unbounded" },
      );

      // Create a lookup map for quick access
      const notificationMap = new Map(
        notifications
          .filter((n): n is NonNullable<typeof n> => n !== null)
          .map((n) => [NotificationId.toString(n.id), n]),
      );

      return {
        executions: executions.map((e) => {
          const notification = e.notificationId
            ? notificationMap.get(e.notificationId) ?? null
            : null;

          return {
            id: e.id,
            scheduleId: e.scheduleId,
            notificationId: e.notificationId,
            executedAt: e.executedAt,
            notification: notification
              ? {
                  id: NotificationId.toString(notification.id),
                  tripId: notification.tripId
                    ? notification.tripId.toString()
                    : null,
                  title: notification.title,
                  body: notification.body,
                  url: notification.url,
                  createdById: notification.createdById.toString(),
                  createdAt: notification.createdAt,
                  updatedAt: notification.updatedAt,
                }
              : null,
          };
        }),
      };
    });
  }
}
