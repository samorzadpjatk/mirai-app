import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

/**
 * Input for GetNotificationScheduleExecutionHistory use case
 */
export interface GetNotificationScheduleExecutionHistoryInput {
  scheduleId: string;
  limit?: number;
}

/**
 * Execution record output
 */
export interface ExecutionHistoryItem {
  id: string;
  executedAt: Date;
  notification: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
  } | null;
}

/**
 * Output for GetNotificationScheduleExecutionHistory use case
 */
export interface GetNotificationScheduleExecutionHistoryOutput {
  executions: ExecutionHistoryItem[];
}

/**
 * GetNotificationScheduleExecutionHistory Use Case
 *
 * Retrieves the execution history for a notification schedule.
 */
export class GetNotificationScheduleExecutionHistoryUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: GetNotificationScheduleExecutionHistoryInput,
  ): Promise<Result<GetNotificationScheduleExecutionHistoryOutput, string>> {
    // Check if schedule exists
    const exists = await this.repository.exists(input.scheduleId);

    if (!exists) {
      return err("Notification schedule not found");
    }

    const executions = await this.repository.getExecutionHistory(
      input.scheduleId,
      input.limit ?? 20,
    );

    return ok({
      executions,
    });
  }
}
