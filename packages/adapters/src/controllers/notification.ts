import { z } from "zod";
import { Effect, type Layer } from "effect";
import {
  getNotificationUseCase,
  createNotificationUseCase,
  updateNotificationUseCase,
  deleteNotificationUseCase,
  scheduleNotificationUseCase,
  type CreateNotificationInput,
  type UpdateNotificationInput,
  type DeleteNotificationInput,
  type ScheduleNotificationInput,
  NotificationCreationError,
  NotificationRepositoryError,
  UpdateNotificationNotFoundError,
  NotificationUpdateError,
  UpdateNotificationValidationError,
  UpdateNotificationStateError,
  DeleteNotificationNotFoundError,
  NotificationDeleteError,
  NotificationAlreadySentError,
  ScheduleNotificationNotFoundError,
  NotificationScheduleError,
  ScheduleNotificationValidationError,
  ScheduleNotificationStateError,
} from "@mirai-app/use-cases";
import { NotificationStatus, NotificationPriority } from "@mirai-app/domain";

/**
 * Input validation schemas for notification controller
 */
const schemas = {
  getById: z.object({
    id: z.string().uuid("Invalid notification ID format"),
  }),

  getByTripId: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
  }),

  create: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters"),
    body: z
      .string()
      .min(1, "Body is required")
      .max(2000, "Body must be at most 2000 characters"),
    url: z.string().url("Invalid URL").nullable().optional(),
    tripId: z.string().uuid("Invalid trip ID format").nullable().optional(),
    createdById: z.string().uuid("Invalid user ID format"),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    scheduledFor: z.coerce.date().nullable().optional(),
  }),

  update: z.object({
    notificationId: z.string().uuid("Invalid notification ID format"),
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .optional(),
    body: z
      .string()
      .min(1, "Body is required")
      .max(2000, "Body must be at most 2000 characters")
      .optional(),
    url: z.string().url("Invalid URL").nullable().optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    scheduledFor: z.coerce.date().nullable().optional(),
  }),

  updateStatus: z.object({
    notificationId: z.string().uuid("Invalid notification ID format"),
    newStatus: z.enum(["DRAFT", "READY", "SENT", "FAILED", "CANCELLED"]),
  }),

  list: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),

  listByStatus: z.object({
    status: z.enum(["DRAFT", "READY", "SENT", "FAILED", "CANCELLED"]),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),

  listByPriority: z.object({
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),

  schedule: z.object({
    notificationId: z.string().uuid("Invalid notification ID format"),
    scheduledFor: z.coerce.date(),
  }),
};

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
 * NotificationController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class NotificationController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get a notification by ID
   */
  async getById(input: unknown) {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getNotificationUseCase({
      notificationId: parsed.data.id,
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Get notifications by trip ID
   */
  async getByTripId(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          title: string;
          body: string;
          status: string;
          priority: string;
          tripId: string | null;
          createdById: string;
          createdAt: Date;
          isSent: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByTripId.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = 
      .findByTripId(parsed.data.tripId)
      .pipe(
        Effect.map((notifications) =>
          notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            status: notification.status,
            priority: notification.priority,
            tripId: notification.tripId,
            createdById: notification.createdById,
            createdAt: notification.createdAt,
            isSent: notification.isSent(),
          })),
        ),
      );

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Create a new notification
   * Delegates to CreateNotificationUseCase with Effect pattern.
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          title: string;
          body: string;
          url: string | null;
          status: string;
          priority: string;
          tripId: string | null;
          createdById: string;
          createdAt: Date;
          isScheduled: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.create.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createNotificationUseCase({
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url,
      createdById: parsed.data.createdById,
      tripId: parsed.data.tripId,
      priority: parsed.data.priority as NotificationPriority,
      scheduledFor: parsed.data.scheduledFor,
    });

    return await runWithLayer(effect, (result) => ({
      id: result.id,
      title: result.title,
      body: result.body,
      url: result.url,
      status: result.status,
      priority: result.priority,
      tripId: result.tripId,
      createdById: result.createdById,
      createdAt: result.createdAt,
      isScheduled: result.scheduledFor !== null,
    }));
  }

  /**
   * Update a notification
   * Delegates to UpdateNotificationUseCase with Effect pattern.
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          title: string;
          body: string;
          url: string | null;
          status: string;
          priority: string;
          tripId: string | null;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.update.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateNotificationUseCase({
      notificationId: parsed.data.notificationId,
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url,
      priority: parsed.data.priority as NotificationPriority,
    });

    return await runWithLayer(effect, (result) => ({
      id: result.id,
      title: result.title,
      body: result.body,
      url: result.url,
      status: result.status,
      priority: result.priority,
      tripId: result.tripId,
      updatedAt: result.updatedAt,
    }));
  }

  /**
   * Update notification status
   * Delegates to UpdateNotificationUseCase with status update.
   */
  async updateStatus(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          title: string;
          previousStatus: string;
          newStatus: string;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.updateStatus.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateNotificationUseCase({
      notificationId: parsed.data.notificationId,
      status: parsed.data.newStatus as NotificationStatus,
    });

    return await runWithLayer(effect, (result) => ({
      id: result.id,
      title: result.title,
      previousStatus: result.status, // The use case returns the updated entity
      newStatus: result.status,
      updatedAt: result.updatedAt,
    }));
  }

  /**
   * Schedule a notification
   * Delegates to ScheduleNotificationUseCase with Effect pattern.
   */
  async schedule(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          title: string;
          body: string;
          url: string | null;
          status: string;
          priority: string;
          tripId: string | null;
          scheduledFor: Date;
          sentAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.schedule.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = scheduleNotificationUseCase({
      notificationId: parsed.data.notificationId,
      scheduledFor: parsed.data.scheduledFor,
    });

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * List all notifications with pagination
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          title: string;
          body: string;
          status: string;
          priority: string;
          tripId: string | null;
          createdById: string;
          createdAt: Date;
          isSent: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.list.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = 
      .findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      })
      .pipe(
        Effect.map((notifications) =>
          notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            status: notification.status,
            priority: notification.priority,
            tripId: notification.tripId,
            createdById: notification.createdById,
            createdAt: notification.createdAt,
            isSent: notification.isSent(),
          })),
        ),
      );

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * List notifications by status
   */
  async listByStatus(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          title: string;
          body: string;
          status: string;
          priority: string;
          tripId: string | null;
          createdById: string;
          createdAt: Date;
          isSent: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.listByStatus.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = 
      .findByStatus(parsed.data.status as NotificationStatus)
      .pipe(
        Effect.map((notifications) => {
          const paginated = notifications.slice(
            parsed.data.offset,
            parsed.data.offset + parsed.data.limit,
          );
          return paginated.map((notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            status: notification.status,
            priority: notification.priority,
            tripId: notification.tripId,
            createdById: notification.createdById,
            createdAt: notification.createdAt,
            isSent: notification.isSent(),
          }));
        }),
      );

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * List notifications by priority
   */
  async listByPriority(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          title: string;
          body: string;
          status: string;
          priority: string;
          tripId: string | null;
          createdById: string;
          createdAt: Date;
          isSent: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.listByPriority.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = 
      .findByPriority(parsed.data.priority as NotificationPriority)
      .pipe(
        Effect.map((notifications) => {
          const paginated = notifications.slice(
            parsed.data.offset,
            parsed.data.offset + parsed.data.limit,
          );
          return paginated.map((notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            status: notification.status,
            priority: notification.priority,
            tripId: notification.tripId,
            createdById: notification.createdById,
            createdAt: notification.createdAt,
            isSent: notification.isSent(),
          }));
        }),
      );

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Find notifications ready to be sent
   */
  async findReadyToSend(): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          title: string;
          body: string;
          status: string;
          priority: string;
          tripId: string | null;
          createdById: string;
          createdAt: Date;
          isScheduled: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    const effect = .findReadyToSend().pipe(
      Effect.map((notifications) =>
        notifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          status: notification.status,
          priority: notification.priority,
          tripId: notification.tripId,
          createdById: notification.createdById,
          createdAt: notification.createdAt,
          isScheduled: notification.isScheduled(),
        })),
      ),
    );

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Find overdue scheduled notifications
   */
  async findOverdue(): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          title: string;
          body: string;
          status: string;
          priority: string;
          tripId: string | null;
          scheduledFor: Date | null;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const effect = .findOverdue().pipe(
      Effect.map((notifications) =>
        notifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          status: notification.status,
          priority: notification.priority,
          tripId: notification.tripId,
          scheduledFor: notification.scheduledFor,
          createdAt: notification.createdAt,
        })),
      ),
    );

    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Delete a notification
   * Delegates to DeleteNotificationUseCase with Effect pattern.
   */
  async delete(
    input: unknown,
  ): Promise<
    | { success: true; data: { deleted: true; id: string } }
    | { success: false; error: string }
  > {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = deleteNotificationUseCase({
      notificationId: parsed.data.id,
    });

    return await runWithLayer(effect, (result) => ({
      deleted: result.success,
      id: result.deletedNotificationId,
    }));
  }
}
