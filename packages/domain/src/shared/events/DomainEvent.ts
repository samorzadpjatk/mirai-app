/**
 * IDomainEvent - Base interface for all domain events
 *
 * Domain events represent facts that have occurred in the system.
 * They are immutable and contain all data needed for event handlers.
 *
 * Key characteristics:
 * - Immutable (all fields readonly)
 * - Type-discriminated via _tag field for pattern matching
 * - Contains aggregate ID to link to the originating entity
 * - Timestamped for temporal ordering
 * - Versioned for schema evolution
 *
 * @example
 * ```typescript
 * class NotificationCreated implements IDomainEvent {
 *   readonly _tag = "NotificationCreated";
 *   readonly version = 1;
 *
 *   constructor(
 *     readonly aggregateId: NotificationId,
 *     readonly occurredAt: Date,
 *     // ... other fields
 *   ) {}
 * }
 * ```
 */
export interface IDomainEvent {
  /** Event type discriminator for pattern matching */
  readonly _tag: string;

  /** Entity identifier - links event to originating aggregate */
  readonly aggregateId: string;

  /** Timestamp when the event occurred */
  readonly occurredAt: Date;

  /** Schema version for backward compatibility during evolution */
  readonly version: number;
}
