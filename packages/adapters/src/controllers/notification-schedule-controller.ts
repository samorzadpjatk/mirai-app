import { z } from "zod";
import type { NotificationScheduleRepository } from "@mirai-app/use-cases";
import {
  GetNotificationSchedulesUseCase,
  GetNotificationScheduleByIdUseCase,
  CreateNotificationScheduleUseCase,
  UpdateNotificationScheduleUseCase,
  DeleteNotificationScheduleUseCase,
  ToggleNotificationScheduleActiveUseCase,
  DuplicateNotificationScheduleUseCase,
  BulkDeleteNotificationSchedulesUseCase,
  BulkToggleNotificationScheduleActiveUseCase,
  GetActiveNotificationSchedulesUseCase,
  GetUpcomingNotificationSchedulesUseCase,
  UpdateNotificationScheduleLastRunUseCase,
  GetNotificationScheduleExecutionHistoryUseCase,
} from "@mirai-app/use-cases";
import { NotificationScheduleType } from "@mirai-app/domain";

/**
 * Input validation schemas for notification schedule controller
 */
const schemas = {
  getAll: z.object({
    pagination: z
      .object({
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      })
      .optional(),
    filter: z
      .object({
        tripId: z.string().nullable().optional(),
        notificationType: z
          .enum([
            "CHALLENGE",
            "INFO",
            "REMINDER",
            "ANNOUNCEMENT",
            "DAILY_RANKING",
          ])
          .optional(),
        isActive: z.boolean().optional(),
        startDateFrom: z.coerce.date().optional(),
        startDateTo: z.coerce.date().optional(),
        search: z.string().optional(),
      })
      .optional(),
  }),

  getById: z.object({
    id: z.string().uuid("Invalid schedule ID format"),
  }),

  getUpcoming: z.object({
    days: z.number().int().min(1).max(30).optional(),
  }),

  create: z.object({
    name: z.string().min(1).max(100),
    tripId: z.string().uuid().nullable().optional(),
    notificationType: z.enum([
      "CHALLENGE",
      "INFO",
      "REMINDER",
      "ANNOUNCEMENT",
      "DAILY_RANKING",
    ]),
    notificationTitle: z.string().max(200).nullable().optional(),
    notificationBody: z.string().max(2000).nullable().optional(),
    notificationUrl: z.string().url().max(500).nullable().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    isActive: z.boolean().optional(),
    createdById: z.string().uuid(),
  }),

  update: z.object({
    id: z.string().uuid("Invalid schedule ID format"),
    name: z.string().min(1).max(100).optional(),
    notificationTitle: z.string().max(200).nullable().optional(),
    notificationBody: z.string().max(2000).nullable().optional(),
    notificationUrl: z.string().url().max(500).nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    hour: z.number().int().min(0).max(23).optional(),
    minute: z.number().int().min(0).max(59).optional(),
    isActive: z.boolean().optional(),
  }),

  delete: z.object({
    id: z.string().uuid("Invalid schedule ID format"),
  }),

  bulkDelete: z.object({
    ids: z.array(z.string().uuid()).min(1),
  }),

  toggleActive: z.object({
    id: z.string().uuid("Invalid schedule ID format"),
  }),

  bulkToggleActive: z.object({
    ids: z.array(z.string().uuid()).min(1),
    isActive: z.boolean(),
  }),

  duplicate: z.object({
    id: z.string().uuid("Invalid schedule ID format"),
    name: z.string().min(1).max(100).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    newCreatedById: z.string().uuid(),
  }),

  updateLastRun: z.object({
    id: z.string().uuid("Invalid schedule ID format"),
    lastRun: z.coerce.date(),
  }),

  getExecutionHistory: z.object({
    scheduleId: z.string().uuid("Invalid schedule ID format"),
    limit: z.number().int().min(1).max(100).optional(),
  }),
};

/**
 * Output type for schedule operations
 */
export type NotificationScheduleOutput = {
  id: string;
  name: string;
  tripId: string | null;
  notificationType: string;
  notificationTitle: string | null;
  notificationBody: string | null;
  notificationUrl: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
  createdById: string;
  lastRun: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isCurrentlyActive: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  formattedTime: string;
};

/**
 * Controller result type
 */
type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * NotificationScheduleController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class NotificationScheduleController {
  constructor(private repository: NotificationScheduleRepository) {}

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
    const parsed = schemas.getAll.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetNotificationSchedulesUseCase(this.repository);
    const result = await useCase.execute({
      filter: parsed.data.filter,
      pagination: parsed.data.pagination,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get a notification schedule by ID
   */
  async getById(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetNotificationScheduleByIdUseCase(this.repository);
    const result = await useCase.execute({ id: parsed.data.id });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get active notification schedules
   */
  async getActive(): Promise<ControllerResult<NotificationScheduleOutput[]>> {
    const useCase = new GetActiveNotificationSchedulesUseCase(this.repository);
    const result = await useCase.execute();

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get upcoming notification schedules
   */
  async getUpcoming(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput[]>> {
    const parsed = schemas.getUpcoming.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetUpcomingNotificationSchedulesUseCase(
      this.repository,
    );
    const result = await useCase.execute({ days: parsed.data.days });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Create a new notification schedule
   */
  async create(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = schemas.create.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new CreateNotificationScheduleUseCase(this.repository);
    const result = await useCase.execute({
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

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Update a notification schedule
   */
  async update(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = schemas.update.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new UpdateNotificationScheduleUseCase(this.repository);
    const result = await useCase.execute({
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

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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
    const parsed = schemas.delete.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new DeleteNotificationScheduleUseCase(this.repository);
    const result = await useCase.execute({ id: parsed.data.id });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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
    const parsed = schemas.bulkDelete.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new BulkDeleteNotificationSchedulesUseCase(this.repository);
    const result = await useCase.execute({ ids: parsed.data.ids });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Toggle the active status of a schedule
   */
  async toggleActive(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = schemas.toggleActive.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new ToggleNotificationScheduleActiveUseCase(
      this.repository,
    );
    const result = await useCase.execute({ id: parsed.data.id });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Bulk toggle active status
   */
  async bulkToggleActive(
    input: unknown,
  ): Promise<ControllerResult<{ success: boolean; updatedCount: number }>> {
    const parsed = schemas.bulkToggleActive.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new BulkToggleNotificationScheduleActiveUseCase(
      this.repository,
    );
    const result = await useCase.execute({
      ids: parsed.data.ids,
      isActive: parsed.data.isActive,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Duplicate a notification schedule
   */
  async duplicate(
    input: unknown,
  ): Promise<ControllerResult<{ schedule: NotificationScheduleOutput }>> {
    const parsed = schemas.duplicate.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new DuplicateNotificationScheduleUseCase(this.repository);
    const result = await useCase.execute({
      id: parsed.data.id,
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      newCreatedById: parsed.data.newCreatedById,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Update last run timestamp
   */
  async updateLastRun(
    input: unknown,
  ): Promise<ControllerResult<NotificationScheduleOutput>> {
    const parsed = schemas.updateLastRun.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new UpdateNotificationScheduleLastRunUseCase(
      this.repository,
    );
    const result = await useCase.execute({
      id: parsed.data.id,
      lastRun: parsed.data.lastRun,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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
    const parsed = schemas.getExecutionHistory.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetNotificationScheduleExecutionHistoryUseCase(
      this.repository,
    );
    const result = await useCase.execute({
      scheduleId: parsed.data.scheduleId,
      limit: parsed.data.limit,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }
}
