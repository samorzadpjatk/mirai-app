/**
 * @mirai-app/domain - Domain Layer Exports
 *
 * This package contains pure business logic with ZERO external dependencies.
 * All exports are pure TypeScript/JavaScript - no frameworks, no I/O.
 */

// Effect exports - native Effect framework integration
export { Effect, Either, Data } from "effect";

// Validation utilities
export {
  isValidEmail,
  validateEmail,
  validateNotEmpty,
  validateMinLength,
  validateMaxLength,
  isValidUUID,
  validateUUID,
  isValidURL,
  isFutureDate,
  isPastDate,
  isValidDateRange,
} from "./utils/validation";

// Result type for functional error handling
export {
  type Result,
  ok,
  err,
  isSuccess,
  isError,
  map,
  mapError,
  flatten,
  flatMap,
  getOrElse,
  unwrap,
} from "./utils/result";

// Domain error types - LEGACY (preserved for backward compatibility during migration)
// New code should use the Effect-based errors exported below
export {
  DomainError,
  ValidationError as LegacyValidationError,
  StateTransitionError as LegacyStateTransitionError,
  NotFoundError as LegacyNotFoundError,
} from "./errors/domain-errors";

// NEW: Entity validation framework (created in Phase 1)
export {
  validate,
  type StringRule,
  type NumberRule,
  type ArrayRule,
} from "./utils/entity-validation";

// NEW: State machine factory (created in Phase 1)
export {
  createStateMachine,
  type StateMachineConfig,
  type StateMachine,
} from "./utils/state-machine";

// NEW: Immutable update helpers (created in Phase 1)
export {
  timestamps,
  withUpdatedAt,
  updateEntity,
  type Timestamps,
  type TimestampOptions,
  type DomainEntity,
} from "./utils/immutable";

// NEW: Entity helper functions (created in Phase 1)
export { entityHelpers } from "./utils/entity-helpers";

// Entities
export * from "./entities/User";
export * from "./entities/Challenge";
export * from "./entities/Notification";
export * from "./entities/NotificationSchedule";
export * from "./entities/Group";
export * from "./entities/Trip";
export * from "./entities/ActivityFeed";
export * from "./entities/ChallengeSubmission";
// Reward - exclude RewardPurchaseStatus (exported from RewardPurchase instead)
export { Reward, REWARD_PURCHASE_STATUSES } from "./entities/Reward";
export * from "./entities/Location";
export * from "./entities/ChallengeVote";
export * from "./entities/Sponsor";
export * from "./entities/SubmissionReport";

// Trip Management Entities
export * from "./entities/TripResource";
export * from "./entities/TripInsurance";
// Note: TripInsuranceStep is now a nested interface within TripInsurance
export * from "./entities/TripParticipant";
export * from "./entities/TripSponsor";

// Event Management Entities
export * from "./entities/Event";
export * from "./entities/UserEvent";

// Group Management Entity
export * from "./entities/GroupJoinRequest";

// Activity Feed Entities (updated - child entities now nested)
export * from "./entities/ActivityReaction";
// Note: ChallengeActivity, RankChangeActivity, SubmissionActivity, UserPost
// are now nested interfaces within ActivityFeed

// Economy/Rewards Entities
export * from "./entities/CoinTransaction";
export * from "./entities/RewardPurchase";

// Notification Entities (updated - child entities now nested)
// Note: NotificationScheduleExecution removed (becomes simple execution log)
// Note: NotificationPush is now a nested interface within NotificationDelivery
export * from "./entities/NotificationDelivery";
export * from "./entities/PushSubscription";

// Location Entity
export * from "./entities/LocationSharingRequest";

// System Entity
export * from "./entities/UserAgent";

// Nested Interfaces (re-exported from parent entities)
export type {
  ChallengeMetadata,
  RankChangeMetadata,
  SubmissionMetadata,
  PostMetadata,
} from "./entities/ActivityFeed";
export type { InsuranceStep } from "./entities/TripInsurance";
export type { PushDeliveryRecord } from "./entities/NotificationDelivery";

// Value Objects
export * from "./value-objects/UserId";
export * from "./value-objects/ChallengeId";
export * from "./value-objects/NotificationId";
export * from "./value-objects/NotificationScheduleId";
export * from "./value-objects/TripId";
export * from "./value-objects/ActivityId";
export * from "./value-objects/SubmissionId";
export * from "./value-objects/RewardId";
export * from "./value-objects/CoinAmount";
export * from "./value-objects/LocationId";
export * from "./value-objects/ChallengeVoteId";
export * from "./value-objects/VotePosition";
export * from "./value-objects/VoteWeight";
export * from "./value-objects/SponsorId";
export * from "./value-objects/TripSponsorId";
export * from "./value-objects/ReportId";
export * from "./value-objects/ReportReason";
export * from "./value-objects/AuthContext";
// export * from "./value-objects/Email";

// Domain Events (Phase 2: Real-Time Architecture)
export * from "./events";

// Enums
export {
  UserRole,
  isUserRole,
  getAllUserRoles,
  isAdminRole,
  isModeratorRole,
} from "./enums/UserRole";

// ============================================================================
// Effect Framework Integration (NEW - Step 1.1)
// ============================================================================

// Effect utilities
export {
  fromPredicate,
  isPureEffect,
  assertPureEffect,
  type EntityEffect,
  type EffectSuccess,
  type EffectError,
  type EffectRequirements,
} from "./effect-utils";

// Effect-based domain errors using Data.TaggedError
// Note: DomainError type is renamed to EffectDomainError to avoid conflict with legacy DomainError class
export {
  ValidationError,
  NotFoundError,
  StateTransitionError,
  UnauthorizedError,
  ConflictError,
  InvariantError,
  InvalidStateError,
  ResourceUnavailableError,
  QuotaExceededError,
  type DomainError as EffectDomainError,
  isDomainError,
  isValidationError,
  isNotFoundError,
  isStateTransitionError,
  isUnauthorizedError,
  isConflictError,
  isInvariantError,
  getDomainErrorMessage,
  getDomainErrorCode,
} from "./errors/effect-errors";
