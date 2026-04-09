import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

/**
 * Input for BulkDeleteNotificationSchedules use case
 */
export interface BulkDeleteNotificationSchedulesInput {
  ids: string[];
}

/**
 * Output for BulkDeleteNotificationSchedules use case
 */
export interface BulkDeleteNotificationSchedulesOutput {
  success: boolean;
  deletedCount: number;
  requestedCount: number;
  notFoundIds?: string[];
}

/**
 * BulkDeleteNotificationSchedules Use Case
 *
 * Deletes multiple notification schedules by ID.
 */
export class BulkDeleteNotificationSchedulesUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: BulkDeleteNotificationSchedulesInput,
  ): Promise<Result<BulkDeleteNotificationSchedulesOutput, string>> {
    if (input.ids.length === 0) {
      return err("At least one ID must be provided");
    }

    // Check which IDs exist
    const existingIds: string[] = [];
    const notFoundIds: string[] = [];

    for (const id of input.ids) {
      const exists = await this.repository.exists(id);
      if (exists) {
        existingIds.push(id);
      } else {
        notFoundIds.push(id);
      }
    }

    // Delete the existing ones
    let deletedCount = 0;
    if (existingIds.length > 0) {
      deletedCount = await this.repository.deleteMany(existingIds);
    }

    return ok({
      success: true,
      deletedCount,
      requestedCount: input.ids.length,
      ...(notFoundIds.length > 0 && { notFoundIds }),
    });
  }
}
