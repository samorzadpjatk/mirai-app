import { Effect, type Layer } from "effect";
import {
  getNotificationSchedulesUseCase,
  getNotificationScheduleByIdUseCase,
  createNotificationScheduleUseCase,
  updateNotificationScheduleUseCase,
  deleteNotificationScheduleUseCase,
  toggleNotificationScheduleActiveUseCase,
  getActiveNotificationSchedulesUseCase,
  getUpcomingNotificationSchedulesUseCase,
  updateNotificationScheduleLastRunUseCase,
  bulkDeleteNotificationSchedulesUseCase,
  bulkToggleNotificationScheduleActiveUseCase,
  duplicateNotificationScheduleUseCase,
  getNotificationScheduleExecutionHistoryUseCase,
  NotificationScheduleGatewayTag,
  type NotificationScheduleOutput,
} from "@mirai-app/use-cases";
import {
  validateGetAllInput,
  validateGetByIdInput,
  validateGetUpcomingInput,
  validateCreateInput,
  validateUpdateInput,
  validateDeleteInput,
  validateBulkDeleteInput,
  validateToggleActiveInput,
  validateBulkToggleActiveInput,
  validateDuplicateInput,
  validateUpdateLastRunInput,
  validateGetExecutionHistoryInput,
} from "./validators/schedule-schema";

export {
  validateGetAllInput,
  validateGetByIdInput,
  validateGetUpcomingInput,
  validateCreateInput,
  validateUpdateInput,
  validateDeleteInput,
  validateBulkDeleteInput,
  validateToggleActiveInput,
  validateBulkToggleActiveInput,
  validateDuplicateInput,
  validateUpdateLastRunInput,
  validateGetExecutionHistoryInput,
};

import {
  NotificationScheduleType,
  type NotificationScheduleFilter,
  type PaginationOptions,
} from "@mirai-app/domain";

// Re-export types for consumers
export type { NotificationScheduleOutput };

/**
 * Input validation schemas for notification schedule controller
 */

/**
 * Controller result type
 */
type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * NotificationScheduleController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class NotificationScheduleController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get all notification schedules with filtering and pagination
   */
  async getAll(input: unknown): Promise<
    ControllerResult<{
      schedules: NotificationScheduleOutput[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>
  > {
    const parsed = validateGetAllInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    // Map Zod schema filter to domain filter type
    const filter: NotificationScheduleFilter | undefined = parsed.data.filter
      ? {
          tripId: parsed.data.filter.tripId ?? undefined,
          notificationType: parsed.data.filter.notificationType,
          isActive: parsed.data.filter.isActive,
          startDateFrom: parsed.data.filter.startDateFrom,
          startDateTo: parsed.data.filter.startDateTo,
          search: parsed.data.filter.search,
        }
      : undefined;

    const pagination: PaginationOptions = {
      limit: parsed.data.pagination?.limit ?? 20,
      offset: parsed.data.pagination?.offset ?? 0,
    };

    const program = getNotificationSchedulesUseCase({
      filter,
      pagination,
    });

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<{
      schedules: NotificationScheduleOutput[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>;
  }

  /**
   * Get a notification schedule by ID
   */
  async getById(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = getNotificationScheduleByIdUseCase({
      id: parsed.data.id,
    });

    return (await runWithLayer(
      program,
      this.appLayer,
    )) as ControllerResult<NotificationScheduleOutput>;
  }

  /**
   * Get active notification schedules
   */
  async getActive(): Promise<ControllerResult<NotificationScheduleOutput[]>> {
    const program = getActiveNotificationSchedulesUseCase();

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<
      NotificationScheduleOutput[]
    >;
  }

  /**
   * Get upcoming notification schedules
   */
  async getUpcoming(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput[]>> {
    const parsed = validateGetUpcomingInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = getUpcomingNotificationSchedulesUseCase({
      days: parsed.data.days,
    });

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<
      NotificationScheduleOutput[]
    >;
  }

  /**
   * Create a new notification schedule
   */
  async create(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = validateCreateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = createNotificationScheduleUseCase({
      name: parsed.data.name,
      tripId: parsed.data.tripId,
      notificationType: parsed.data
        .notificationType as NotificationScheduleType,
      notificationTitle: parsed.data.notificationTitle,
      notificationBody: parsed.data.notificationBody,
      notificationUrl: parsed.data.notificationUrl,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      hour: parsed.data.hour,
      minute: parsed.data.minute,
      isActive: parsed.data.isActive,
      createdById: parsed.data.createdById,
    });

    return (await runWithLayer(
      program,
      this.appLayer,
    )) as ControllerResult<NotificationScheduleOutput>;
  }

  /**
   * Update a notification schedule
   */
  async update(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = validateUpdateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = updateNotificationScheduleUseCase({
      id: parsed.data.id,
      name: parsed.data.name,
      notificationTitle: parsed.data.notificationTitle,
      notificationBody: parsed.data.notificationBody,
      notificationUrl: parsed.data.notificationUrl,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      hour: parsed.data.hour,
      minute: parsed.data.minute,
      isActive: parsed.data.isActive,
    });

    return (await runWithLayer(
      program,
      this.appLayer,
    )) as ControllerResult<NotificationScheduleOutput>;
  }

  /**
   * Delete a notification schedule
   */
  async delete(input: unknown): Promise<
    ControllerResult<{
      success: boolean;
      message: string;
      deletedExecutionCount?: number;
    }>
  > {
    const parsed = validateDeleteInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = deleteNotificationScheduleUseCase({
      id: parsed.data.id,
    });

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<{
      success: boolean;
      message: string;
      deletedExecutionCount?: number;
    }>;
  }

  /**
   * Bulk delete notification schedules
   */
  async bulkDelete(input: unknown): Promise<
    ControllerResult<{
      success: boolean;
      deletedCount: number;
      requestedCount: number;
      notFoundIds?: string[];
    }>
  > {
    const parsed = validateBulkDeleteInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = bulkDeleteNotificationSchedulesUseCase({
      ids: Array.from(parsed.data.ids),
    });

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<{
      success: boolean;
      deletedCount: number;
      requestedCount: number;
      notFoundIds?: string[];
    }>;
  }

  /**
   * Toggle the active status of a schedule
   */
  async toggleActive(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = validateToggleActiveInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = toggleNotificationScheduleActiveUseCase({
      id: parsed.data.id,
    });

    return (await runWithLayer(
      program,
      this.appLayer,
    )) as ControllerResult<NotificationScheduleOutput>;
  }

  /**
   * Bulk toggle active status
   */
  async bulkToggleActive(
    input: unknown,
  ): Promise<ControllerResult<{ success: boolean; updatedCount: number }>> {
    const parsed = validateBulkToggleActiveInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = bulkToggleNotificationScheduleActiveUseCase({
      ids: Array.from(parsed.data.ids),
      isActive: parsed.data.isActive,
    });

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<{
      success: boolean;
      updatedCount: number;
    }>;
  }

  /**
   * Duplicate a notification schedule
   */
  async duplicate(
    input: unknown,
  ): Promise<ControllerResult<{ schedule: NotificationScheduleOutput }>> {
    const parsed = validateDuplicateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = duplicateNotificationScheduleUseCase({
      id: parsed.data.id,
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      newCreatedById: parsed.data.newCreatedById,
    });

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<{
      schedule: NotificationScheduleOutput;
    }>;
  }

  /**
   * Update last run timestamp
   */
  async updateLastRun(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = validateUpdateLastRunInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = updateNotificationScheduleLastRunUseCase({
      id: parsed.data.id,
      lastRun: parsed.data.lastRun,
    });

    return (await runWithLayer(
      program,
      this.appLayer,
    )) as ControllerResult<NotificationScheduleOutput>;
  }

  /**
   * Get execution history for a schedule
   */
  async getExecutionHistory(input: unknown): Promise<
    ControllerResult<{
      executions: Array<{
        id: string;
        executedAt: Date;
        notification: {
          id: string;
          title: string;
          body: string;
          createdAt: Date;
        } | null;
      }>;
    }>
  > {
    const parsed = validateGetExecutionHistoryInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = getNotificationScheduleExecutionHistoryUseCase({
      scheduleId: parsed.data.scheduleId,
      limit: parsed.data.limit,
    });

    return (await runWithLayer(program, this.appLayer)) as ControllerResult<{
      executions: Array<{
        id: string;
        executedAt: Date;
        notification: {
          id: string;
          title: string;
          body: string;
          createdAt: Date;
        } | null;
      }>;
    }>;
  }
}
