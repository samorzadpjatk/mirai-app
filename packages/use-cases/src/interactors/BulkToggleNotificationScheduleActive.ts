import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

/**
 * Input for BulkToggleNotificationScheduleActive use case
 */
export interface BulkToggleNotificationScheduleActiveInput {
  ids: string[];
  isActive: boolean;
}

/**
 * Output for BulkToggleNotificationScheduleActive use case
 */
export interface BulkToggleNotificationScheduleActiveOutput {
  success: boolean;
  updatedCount: number;
}

/**
 * BulkToggleNotificationScheduleActive Use Case
 *
 * Updates the isActive status for multiple notification schedules.
 */
export class BulkToggleNotificationScheduleActiveUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: BulkToggleNotificationScheduleActiveInput,
  ): Promise<Result<BulkToggleNotificationScheduleActiveOutput, string>> {
    if (input.ids.length === 0) {
      return err("At least one ID must be provided");
    }

    const updatedCount = await this.repository.bulkToggleActive(
      input.ids,
      input.isActive,
    );

    return ok({
      success: true,
      updatedCount,
    });
  }
}
