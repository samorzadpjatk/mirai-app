/**
 * Domain Events
 *
 * Domain events represent significant occurrences in the business domain.
 * They enable loose coupling between aggregates and side effects.
 *
 * Phase 2: Real-Time Architecture
 * - Events power the EventBus for in-process pub/sub
 * - NotificationCreated triggers NotificationDeliveryService
 * - LocationUpdated triggers LocationStreamingService
 */

export {
  type DomainEvent,
  type AnyDomainEvent,
  NotificationCreated,
  NotificationDelivered,
  NotificationDeliveryFailed,
  LocationUpdated,
  LocationSharingChanged,
  ChallengeSubmissionCreated,
  ChallengeCompleted,
  ActivityCreated,
  ActivityReactionAdded,
  UserOnline,
  UserOffline,
} from "./domain-events";
