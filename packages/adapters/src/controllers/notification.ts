import { z } from "zod";
import type { NotificationRepository } from "@mirai-app/use-cases";
import {
  GetNotificationUseCase,
  type GetNotificationInput,
} from "@mirai-app/use-cases";
import {
  NotificationStatus,
  NotificationPriority,
  Notification,
} from "@mirai-app/domain";

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
};

/**
 * NotificationController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class NotificationController {
  constructor(private notificationRepository: NotificationRepository) {}

  /**
   * Get a notification by ID
   */
  async getById(input: unknown): Promise<
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
          isSent: boolean;
          isScheduled: boolean;
          isReadyToSend: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetNotificationUseCase(this.notificationRepository);
    const result = await useCase.execute({ notificationId: parsed.data.id });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const notifications = await this.notificationRepository.findByTripId(
      parsed.data.tripId,
    );

    return {
      success: true,
      data: notifications.map((notification) => ({
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
    };
  }

  /**
   * Create a new notification
   * Note: This works directly with the repository since CreateNotificationUseCase
   * doesn't exist yet. When the use case is created, this should delegate to it.
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

    // Create domain entity directly until CreateNotificationUseCase exists
    const notificationResult = Notification.create({
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url,
      createdById: parsed.data.createdById,
      tripId: parsed.data.tripId,
      priority: parsed.data.priority as NotificationPriority,
      scheduledFor: parsed.data.scheduledFor,
    });

    if (notificationResult.kind === "err") {
      return { success: false, error: notificationResult.error };
    }

    // Persist notification
    const saved = await this.notificationRepository.create(
      notificationResult.value,
    );

    return {
      success: true,
      data: {
        id: saved.id,
        title: saved.title,
        body: saved.body,
        url: saved.url,
        status: saved.status,
        priority: saved.priority,
        tripId: saved.tripId,
        createdById: saved.createdById,
        createdAt: saved.createdAt,
        isScheduled: saved.isScheduled(),
      },
    };
  }

  /**
   * Update a notification
   * Note: This works directly with the repository since UpdateNotificationUseCase
   * doesn't exist yet.
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

    // Find existing notification
    const notification = await this.notificationRepository.findById(
      parsed.data.notificationId,
    );
    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    // Apply updates using entity method
    let updatedNotification = notification;

    if (
      parsed.data.title !== undefined ||
      parsed.data.body !== undefined ||
      parsed.data.url !== undefined
    ) {
      const contentResult = updatedNotification.updateContent({
        title: parsed.data.title,
        body: parsed.data.body,
        url: parsed.data.url,
      });

      if (contentResult.kind === "err") {
        return { success: false, error: contentResult.error };
      }

      updatedNotification = contentResult.value;
    }

    if (parsed.data.priority !== undefined) {
      const priorityResult = updatedNotification.updatePriority(
        parsed.data.priority as NotificationPriority,
      );

      if (priorityResult.kind === "err") {
        return { success: false, error: priorityResult.error };
      }

      updatedNotification = priorityResult.value;
    }

    if (parsed.data.scheduledFor !== undefined) {
      const scheduleResult = updatedNotification.updateSchedule(
        parsed.data.scheduledFor,
      );

      if (scheduleResult.kind === "err") {
        return { success: false, error: scheduleResult.error };
      }

      updatedNotification = scheduleResult.value;
    }

    // Persist changes
    const saved = await this.notificationRepository.update(updatedNotification);

    return {
      success: true,
      data: {
        id: saved.id,
        title: saved.title,
        body: saved.body,
        url: saved.url,
        status: saved.status,
        priority: saved.priority,
        tripId: saved.tripId,
        updatedAt: saved.updatedAt,
      },
    };
  }

  /**
   * Update notification status
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

    // Find existing notification
    const notification = await this.notificationRepository.findById(
      parsed.data.notificationId,
    );
    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    const previousStatus = notification.status;

    // Check if transition is valid
    if (
      !notification.canTransitionTo(parsed.data.newStatus as NotificationStatus)
    ) {
      return {
        success: false,
        error: `Invalid status transition from ${previousStatus} to ${parsed.data.newStatus}`,
      };
    }

    // Apply status update
    try {
      const updatedNotification = notification.updateStatus(
        parsed.data.newStatus as NotificationStatus,
      );

      // Persist changes
      const saved =
        await this.notificationRepository.update(updatedNotification);

      return {
        success: true,
        data: {
          id: saved.id,
          title: saved.title,
          previousStatus,
          newStatus: saved.status,
          updatedAt: saved.updatedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update status: ${error}`,
      };
    }
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

    const notifications = await this.notificationRepository.findAll({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return {
      success: true,
      data: notifications.map((notification) => ({
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
    };
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

    const notifications = await this.notificationRepository.findByStatus(
      parsed.data.status as NotificationStatus,
    );

    // Apply pagination manually
    const paginated = notifications.slice(
      parsed.data.offset,
      parsed.data.offset + parsed.data.limit,
    );

    return {
      success: true,
      data: paginated.map((notification) => ({
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
    };
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

    const notifications = await this.notificationRepository.findByPriority(
      parsed.data.priority as NotificationPriority,
    );

    // Apply pagination manually
    const paginated = notifications.slice(
      parsed.data.offset,
      parsed.data.offset + parsed.data.limit,
    );

    return {
      success: true,
      data: paginated.map((notification) => ({
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
    };
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
    const notifications = await this.notificationRepository.findReadyToSend();

    return {
      success: true,
      data: notifications.map((notification) => ({
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
    };
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
    const notifications = await this.notificationRepository.findOverdue();

    return {
      success: true,
      data: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        status: notification.status,
        priority: notification.priority,
        tripId: notification.tripId,
        scheduledFor: notification.scheduledFor,
        createdAt: notification.createdAt,
      })),
    };
  }

  /**
   * Delete a notification
   */
  async delete(
    input: unknown,
  ): Promise<
    | { success: true; data: { deleted: true } }
    | { success: false; error: string }
  > {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    // Check if notification exists
    const exists = await this.notificationRepository.exists(parsed.data.id);
    if (!exists) {
      return { success: false, error: "Notification not found" };
    }

    await this.notificationRepository.delete(parsed.data.id);

    return { success: true, data: { deleted: true } };
  }
}
