import { z } from "zod";
import { Effect } from "effect";
import type { NotificationScheduleRepository } from "@mirai-app/use-cases";
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
  NotificationScheduleRepositoryTag,
  type NotificationScheduleOutput,
} from "@mirai-app/use-cases";
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
const schemas = {
  getAll: z.object({
    pagination: z
      .object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
      .optional(),
    filter: z
      .object({
        tripId: z.string().nullable().optional(),
        notificationType: z.nativeEnum(NotificationScheduleType).optional(),
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
    notificationType: z.nativeEnum(NotificationScheduleType),
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

    const pagination: PaginationOptions = parsed.data.pagination ?? {
      limit: 20,
      offset: 0,
    };

    const program = getNotificationSchedulesUseCase({
      filter,
      pagination,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = getNotificationScheduleByIdUseCase({
      id: parsed.data.id,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get active notification schedules
   */
  async getActive(): Promise<ControllerResult<NotificationScheduleOutput[]>> {
    const program = getActiveNotificationSchedulesUseCase().pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = getUpcomingNotificationSchedulesUseCase({
      days: parsed.data.days,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = deleteNotificationScheduleUseCase({
      id: parsed.data.id,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        deleteExecutions: (scheduleId: string) =>
          Effect.promise(
            () => this.repository.delete?.(scheduleId) || Promise.resolve(),
          ),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = bulkDeleteNotificationSchedulesUseCase({
      ids: parsed.data.ids,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = toggleNotificationScheduleActiveUseCase({
      id: parsed.data.id,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = bulkToggleNotificationScheduleActiveUseCase({
      ids: parsed.data.ids,
      isActive: parsed.data.isActive,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = duplicateNotificationScheduleUseCase({
      id: parsed.data.id,
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      newCreatedById: parsed.data.newCreatedById,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = updateNotificationScheduleLastRunUseCase({
      id: parsed.data.id,
      lastRun: parsed.data.lastRun,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
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

    const program = getNotificationScheduleExecutionHistoryUseCase({
      scheduleId: parsed.data.scheduleId,
      limit: parsed.data.limit,
    }).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        exists: (id: string) =>
          Effect.promise(() => this.repository.exists(id)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() =>
            this.repository.getExecutionHistory(scheduleId, limit),
          ),
        create: (schedule) =>
          Effect.promise(() => this.repository.create(schedule)),
        findById: (id: string) =>
          Effect.promise(() => this.repository.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.repository.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => this.repository.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() =>
            this.repository.findByTripIdAndName(tripId, name),
          ),
        findByType: (type) =>
          Effect.promise(() => this.repository.findByType(type)),
        findAll: (options) =>
          Effect.promise(() => this.repository.findAll(options)),
        findActive: (now) =>
          Effect.promise(() => this.repository.findActive(now)),
        findUpcoming: (days, now) =>
          Effect.promise(() => this.repository.findUpcoming(days, now)),
        update: (schedule) =>
          Effect.promise(() => this.repository.update(schedule)),
        delete: (id: string) =>
          Effect.promise(() => this.repository.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => this.repository.deleteMany(ids)),
        count: (filter) => Effect.promise(() => this.repository.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => this.repository.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => this.repository.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => this.repository.bulkToggleActive(ids, isActive)),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => this.repository.countExecutions(scheduleId)),
      }),
    );

    try {
      const output = await Effect.runPromise(program);
      return { success: true, data: output };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
