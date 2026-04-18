import type { IDomainEvent } from "../../shared/events";
import type { NotificationId } from "../value-objects/NotificationId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * NotificationCreated - Domain event fired when a new notification is created
 *
 * This event is published by the backend-server when a notification
 * is created, allowing the notification-sender to process and deliver it.
 *
 * @example
 * ```typescript
 * const event = new NotificationCreated({
 *   aggregateId: notificationId,
 *   tripId: tripId,
 *   title: "Trip Updated",
 *   body: "Your trip details have changed",
 *   url: "/trips/123",
 *   userIds: ["user-1", "user-2"],
 *   occurredAt: new Date(),
 * });
 * ```
 */
export class NotificationCreated implements IDomainEvent {
  readonly _tag = "NotificationCreated";
  readonly version = 1;

  constructor(
    readonly aggregateId: NotificationId,
    readonly tripId: TripId | null,
    readonly title: string,
    readonly body: string,
    readonly url: string,
    readonly userIds: string[],
    readonly occurredAt: Date,
  ) {}
}
