import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

/**
 * Input for DeleteNotificationSchedule use case
 */
export interface DeleteNotificationScheduleInput {
  id: string;
}

/**
 * Output for DeleteNotificationSchedule use case
 */
export interface DeleteNotificationScheduleOutput {
  success: boolean;
  message: string;
  deletedExecutionCount?: number;
}

/**
 * DeleteNotificationSchedule Use Case
 *
 * Deletes a notification schedule by ID.
 * Returns error if schedule not found.
 */
export class DeleteNotificationScheduleUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: DeleteNotificationScheduleInput,
  ): Promise<Result<DeleteNotificationScheduleOutput, string>> {
    // Check if schedule exists
    const existing = await this.repository.findById(input.id);

    if (!existing) {
      return err("Notification schedule not found");
    }

    // Count executions before deletion
    const executionCount = await this.repository.countExecutions(input.id);

    // Delete the schedule
    await this.repository.delete(input.id);

    return ok({
      success: true,
      message: `Schedule "${existing.name}" deleted successfully. ${executionCount} execution records were also removed.`,
      deletedExecutionCount: executionCount,
    });
  }
}
