/**
 * Domain Events
 *
 * Domain events represent significant occurrences in the business domain.
 * They are used for loose coupling between aggregates and for triggering
 * side effects (like notifications) without bloating the core use cases.
 *
 * Phase 2: Real-Time Architecture
 * - Events enable the in-process pub/sub EventBus
 * - NotificationCreated triggers push delivery via NotificationDeliveryService
 * - LocationUpdated triggers real-time broadcasts via ConnectionManager
 *
 * All events:
 * - Are immutable (frozen after creation)
 * - Have a unique ID
 * - Have a timestamp
 * - May include aggregate IDs for correlation
 */

// =============================================================================
// Base Event Interface
// =============================================================================

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  /** Unique event identifier */
  readonly id: string;
  /** Event type discriminator */
  readonly type: string;
  /** When the event occurred */
  readonly occurredAt: Date;
  /** Optional correlation ID for tracing */
  readonly correlationId?: string;
}

// =============================================================================
// Notification Events
// =============================================================================

/**
 * Event fired when a new notification is created
 *
 * Triggers:
 * - NotificationDeliveryService (push notification delivery)
 * - ActivityFeed updates (if notification is public)
 * - Real-time subscription updates
 */
export class NotificationCreated implements DomainEvent {
  readonly type = "NotificationCreated" as const;

  constructor(
    readonly id: string,
    readonly notificationId: string,
    readonly recipientId: string,
    readonly title: string,
    readonly body: string,
    readonly priority: "LOW" | "NORMAL" | "HIGH" | "URGENT",
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

/**
 * Event fired when a notification is delivered
 *
 * Used for tracking delivery metrics and analytics.
 */
export class NotificationDelivered implements DomainEvent {
  readonly type = "NotificationDelivered" as const;

  constructor(
    readonly id: string,
    readonly notificationId: string,
    readonly recipientId: string,
    readonly channel: "PUSH" | "EMAIL" | "SMS" | "IN_APP",
    readonly deliveredAt: Date,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

/**
 * Event fired when notification delivery fails
 *
 * Triggers retry logic or dead-letter queue handling.
 */
export class NotificationDeliveryFailed implements DomainEvent {
  readonly type = "NotificationDeliveryFailed" as const;

  constructor(
    readonly id: string,
    readonly notificationId: string,
    readonly recipientId: string,
    readonly channel: "PUSH" | "EMAIL" | "SMS" | "IN_APP",
    readonly error: string,
    readonly retryCount: number,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

// =============================================================================
// Location Events
// =============================================================================

/**
 * Event fired when a user updates their location
 *
 * Triggers:
 * - ConnectionManager broadcasts to friends
 * - Location history recording
 * - Geofencing checks
 */
export class LocationUpdated implements DomainEvent {
  readonly type = "LocationUpdated" as const;

  constructor(
    readonly id: string,
    readonly userId: string,
    readonly latitude: number,
    readonly longitude: number,
    readonly accuracy: number | null,
    readonly altitude: number | null,
    readonly speed: number | null,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

/**
 * Event fired when location sharing settings change
 */
export class LocationSharingChanged implements DomainEvent {
  readonly type = "LocationSharingChanged" as const;

  constructor(
    readonly id: string,
    readonly userId: string,
    readonly isSharingLocation: boolean,
    readonly sharedWithUserIds: string[],
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

// =============================================================================
// Challenge Events
// =============================================================================

/**
 * Event fired when a challenge submission is created
 */
export class ChallengeSubmissionCreated implements DomainEvent {
  readonly type = "ChallengeSubmissionCreated" as const;

  constructor(
    readonly id: string,
    readonly submissionId: string,
    readonly challengeId: string,
    readonly userId: string,
    readonly groupId: string,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

/**
 * Event fired when a challenge is completed
 */
export class ChallengeCompleted implements DomainEvent {
  readonly type = "ChallengeCompleted" as const;

  constructor(
    readonly id: string,
    readonly challengeId: string,
    readonly winnerUserId: string,
    readonly winnerGroupId: string,
    readonly pointsAwarded: number,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

// =============================================================================
// Activity Feed Events
// =============================================================================

/**
 * Event fired when new activity is created
 */
export class ActivityCreated implements DomainEvent {
  readonly type = "ActivityCreated" as const;

  constructor(
    readonly id: string,
    readonly activityId: string,
    readonly activityType: string,
    readonly actorId: string,
    readonly tripId: string | null,
    readonly groupId: string | null,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

/**
 * Event fired when a reaction is added to an activity
 */
export class ActivityReactionAdded implements DomainEvent {
  readonly type = "ActivityReactionAdded" as const;

  constructor(
    readonly id: string,
    readonly activityId: string,
    readonly reactionId: string,
    readonly userId: string,
    readonly emoji: string,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

// =============================================================================
// User Events
// =============================================================================

/**
 * Event fired when a user goes online
 */
export class UserOnline implements DomainEvent {
  readonly type = "UserOnline" as const;

  constructor(
    readonly id: string,
    readonly userId: string,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

/**
 * Event fired when a user goes offline
 */
export class UserOffline implements DomainEvent {
  readonly type = "UserOffline" as const;

  constructor(
    readonly id: string,
    readonly userId: string,
    readonly lastSeenAt: Date,
    readonly occurredAt: Date,
    readonly correlationId?: string,
  ) {
    Object.freeze(this);
  }
}

// =============================================================================
// Event Type Union
// =============================================================================

/**
 * Union type of all domain events
 */
export type AnyDomainEvent =
  | NotificationCreated
  | NotificationDelivered
  | NotificationDeliveryFailed
  | LocationUpdated
  | LocationSharingChanged
  | ChallengeSubmissionCreated
  | ChallengeCompleted
  | ActivityCreated
  | ActivityReactionAdded
  | UserOnline
  | UserOffline;
