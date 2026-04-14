import { Effect, type Layer } from "effect";
import {
  getNotificationUseCase,
  createNotificationUseCase,
  updateNotificationUseCase,
  deleteNotificationUseCase,
  scheduleNotificationUseCase,
  NotificationRepositoryTag,
  type CreateNotificationInput,
  type UpdateNotificationInput,
  type DeleteNotificationInput,
  type ScheduleNotificationInput,
  NotificationCreationError,
  CreateNotificationRepositoryError,
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
import {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
  validateListByPriorityInput,
  validateScheduleInput,
} from "./validators/notification-validators";

export {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
  validateListByPriorityInput,
  validateScheduleInput,
};

import { NotificationStatus, NotificationPriority } from "@mirai-app/domain";

/**
 * Input validation schemas for notification controller
 */

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
    const parsed = validateGetByIdInput(input);
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
    const parsed = validateGetByTripIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* NotificationRepositoryTag;
      const notifications = yield* repo.findByTripId(parsed.data.tripId);
      return notifications.map((notification) => ({
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
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateCreateInput(input);
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

    const result = await runWithLayer(
      effect,
      this.appLayer,
      (result: {
        id: string;
        title: string;
        body: string;
        url: string | null;
        status: string;
        priority: string;
        tripId: string | null;
        createdById: string;
        createdAt: Date;
        scheduledFor: Date | null;
      }) => ({
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
      }),
    );
    return result as
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
      | { success: false; error: string };
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
    const parsed = validateUpdateInput(input);
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

    return (await runWithLayer(
      effect,
      this.appLayer,
      (result: {
        id: string;
        title: string;
        body: string;
        url: string | null;
        status: string;
        priority: string;
        tripId: string | null;
        updatedAt: Date;
      }) => ({
        id: result.id,
        title: result.title,
        body: result.body,
        url: result.url,
        status: result.status,
        priority: result.priority,
        tripId: result.tripId,
        updatedAt: result.updatedAt,
      }),
    )) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateUpdateStatusInput(input);
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

    return (await runWithLayer(
      effect,
      this.appLayer,
      (result: {
        id: string;
        title: string;
        status: string;
        updatedAt: Date;
      }) => ({
        id: result.id,
        title: result.title,
        previousStatus: result.status, // The use case returns the updated entity
        newStatus: result.status,
        updatedAt: result.updatedAt,
      }),
    )) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateScheduleInput(input);
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

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateListInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* NotificationRepositoryTag;
      const notifications = yield* repo.findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      });
      return notifications.map((notification) => ({
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
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateListByStatusInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* NotificationRepositoryTag;
      const notifications = yield* repo.findByStatus(
        parsed.data.status as NotificationStatus,
      );
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
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateListByPriorityInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* NotificationRepositoryTag;
      const notifications = yield* repo.findByPriority(
        parsed.data.priority as NotificationPriority,
      );
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
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const effect = Effect.gen(function* () {
      const repo = yield* NotificationRepositoryTag;
      const notifications = yield* repo.findReadyToSend();
      return notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        status: notification.status,
        priority: notification.priority,
        tripId: notification.tripId,
        createdById: notification.createdById,
        createdAt: notification.createdAt,
        isScheduled: notification.isScheduled(),
      }));
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const effect = Effect.gen(function* () {
      const repo = yield* NotificationRepositoryTag;
      const notifications = yield* repo.findOverdue();
      return notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        status: notification.status,
        priority: notification.priority,
        tripId: notification.tripId,
        scheduledFor: notification.scheduledFor,
        createdAt: notification.createdAt,
      }));
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = deleteNotificationUseCase({
      notificationId: parsed.data.id,
    });

    return (await runWithLayer(
      effect,
      this.appLayer,
      (result: { success: boolean; deletedNotificationId: string }) => ({
        deleted: result.success,
        id: result.deletedNotificationId,
      }),
    )) as unknown as
      | {
          success: true;
          data: { deleted: true; id: string };
        }
      | { success: false; error: string };
  }
}
