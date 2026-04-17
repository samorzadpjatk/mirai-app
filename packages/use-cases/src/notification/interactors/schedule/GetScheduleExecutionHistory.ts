import { Effect } from "effect";
import {
  NotificationSchedulePortTag,
  NotificationScheduleExecutionPortTag,
} from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { ScheduleExecutionHistoryDTO } from "../../dto/NotificationDTOs";

/**
 * Input for GetScheduleExecutionHistoryUseCase
 */
export interface GetScheduleExecutionHistoryInput {
  scheduleId: string;
  limit: number;
}

/**
 * Get Schedule Execution History Use Case
 *
 * Retrieves execution history for a notification schedule.
 */
export class GetScheduleExecutionHistoryUseCase {
  execute(
    input: GetScheduleExecutionHistoryInput,
  ): Effect.Effect<
    ScheduleExecutionHistoryDTO,
    ApplicationError,
    NotificationSchedulePortTag | NotificationScheduleExecutionPortTag
  > {
    return Effect.gen(function* () {
      const executionPort = yield* NotificationScheduleExecutionPortTag;

      const executions = yield* executionPort.findByScheduleId(
        input.scheduleId,
        input.limit,
      );

      return {
        executions: executions.map((e) => ({
          id: e.id,
          scheduleId: e.scheduleId,
          notificationId: e.notificationId,
          executedAt: e.executedAt,
          notification: null, // To be hydrated by adapter
        })),
      };
    });
  }
}
