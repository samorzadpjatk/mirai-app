import { Effect } from "effect";
import {
  Notification,
  NotificationPriority,
  NotificationStatus,
} from "@mirai-app/domain";
import type { NotificationDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  notifications,
  NotificationSelect,
  NotificationInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * NotificationDrizzleMapper
 *
 * Maps between Drizzle database records and NotificationDTOs.
 * Follows the same pattern as UserDrizzleMapper.
 */
export class NotificationDrizzleMapper implements DrizzleEntityMapper<
  NotificationDTO,
  NotificationSelect,
  NotificationInsert
> {
  /**
   * Convert a Drizzle Notification record to a NotificationDTO
   */
  toDTO(record: NotificationSelect): NotificationDTO {
    return {
      id: record.id,
      tripId: record.tripId ?? null,
      title: record.title,
      content: record.body,
      type: "GENERAL" as import("@mirai-app/domain").NotificationType,
      status: this.mapStatusFromDrizzle(record.status),
      priority: this.mapPriorityFromDrizzle(record.priority),
      scheduledAt: record.scheduledFor ?? null,
      sentAt: record.sentAt ?? null,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert a Drizzle Notification record to a domain Notification entity
   * (kept for compatibility with code that needs domain entities)
   */
  toDomain(record: NotificationSelect): Notification {
    const priority = this.mapPriorityFromDrizzle(record.priority);
    const status = this.mapStatusFromDrizzle(record.status);

    const effect = Notification.create({
      id: record.id,
      tripId: record.tripId ?? null,
      title: record.title,
      body: record.body,
      url: record.url ?? null,
      status,
      priority,
      scheduledFor: record.scheduledFor ?? null,
      sentAt: record.sentAt ?? null,
      failureReason: record.failureReason ?? null,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    // Run the Effect synchronously
    const exit = Effect.runSyncExit(effect);

    // This should never fail if database has valid data
    if (exit._tag === "Failure") {
      throw new Error(`Failed to map Notification from Drizzle: ${exit.cause}`);
    }

    return exit.value;
  }

  /**
   * Convert a NotificationDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: NotificationDTO): NotificationInsert {
    return {
      id: dto.id,
      tripId: dto.tripId,
      title: dto.title,
      body: dto.content,
      url: null,
      status: dto.status,
      priority: dto.priority,
      scheduledFor: dto.scheduledAt,
      sentAt: dto.sentAt,
      failureReason: null,
      createdById: dto.createdById,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    } as NotificationInsert;
  }

  /**
   * Convert a NotificationDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: NotificationDTO): Partial<NotificationInsert> {
    return {
      title: dto.title,
      body: dto.content,
      status: dto.status,
      priority: dto.priority,
      scheduledFor: dto.scheduledAt,
      sentAt: dto.sentAt,
      updatedAt: new Date(),
    };
  }

  private mapPriorityFromDrizzle(priority: string): NotificationPriority {
    return (
      NotificationPriority[priority as keyof typeof NotificationPriority] ??
      NotificationPriority.NORMAL
    );
  }

  private mapStatusFromDrizzle(status: string): NotificationStatus {
    return (
      NotificationStatus[status as keyof typeof NotificationStatus] ??
      NotificationStatus.DRAFT
    );
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new NotificationDrizzleMapper();
}
