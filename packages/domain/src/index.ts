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
  // Note: isValidUUID is exported from branded-id (for ID validation)
  validateUUID,
  isValidURL,
  isFutureDate,
  isPastDate,
  isValidDateRange,
} from "./utils/validation";

// Branded ID factory (for creating type-safe identifiers)
export {
  createBrandedId,
  isValidUUID,
  isValidCUID,
  type BrandedId,
  type BrandedIdFactory,
} from "./utils/branded-id";

// Test constants (for test files)
export { TestIds, type TestIdKey } from "./utils/test-ids";

// Mock factories (for test files)
export {
  Mocks,
  mockUser,
  mockAdmin,
  mockModerator,
  mockUsers,
  mockTrip,
  mockGroup,
  mockChallenge,
} from "./utils/mock-factories";

// Unified Domain Error Hierarchy (consolidates 124 error classes into 20 types)
// All new code should use these error classes
export {
  DomainError,
  ValidationError,
  FieldValidationError,
  SchemaValidationError,
  ConstraintViolationError,
  InvariantError,
  NotFoundError,
  EntityNotFoundError,
  ResourceNotFoundError,
  StateTransitionError,
  InvalidStateError,
  UnauthorizedError,
  ForbiddenError,
  AuthenticationError,
  ConflictError,
  DuplicateError,
  ConcurrentModificationError,
  QuotaExceededError,
  DatabaseError,
  NetworkError,
  ServiceUnavailableError,
  ResourceUnavailableError,
  ConfigurationError,
  UnexpectedError,
  AppError,
  type DomainErrors,
  isDomainError,
  isValidationError,
  isNotFoundError,
  isStateTransitionError,
  isUnauthorizedError,
  isConflictError,
  isInvariantError,
  isDatabaseError,
  getDomainErrorMessage,
  getDomainErrorCode,
} from "./errors/unified-errors";

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

// Entities - organized by domain/bounded context

// User Domain
export * from "./entities/user/user";
export * from "./entities/user/user-agent";

// Challenge Domain
export * from "./entities/challenge/challenge";
export * from "./entities/challenge/challenge-submission";
export * from "./entities/challenge/challenge-vote";
export * from "./entities/challenge/submission-report";

// Activity & Feed Domain
export * from "./entities/activity/activity-feed";
export * from "./entities/activity/activity-reaction";

// Group Domain
export * from "./entities/group/group";
export * from "./entities/group/group-join-request";
export * from "./entities/group/coin-transaction";

// Trip Domain
export * from "./entities/trip/trip";
export * from "./entities/trip/trip-participant";
export * from "./entities/trip/trip-insurance";
export * from "./entities/trip/trip-resource";

// Event Domain
export * from "./entities/event/event";
export * from "./entities/event/user-event";

// Location Domain
export * from "./entities/location/location";
export * from "./entities/location/location-sharing-request";

// Notification Domain
export * from "./entities/notification/notification";
export * from "./entities/notification/notification-delivery";
export * from "./entities/notification/notification-schedule";
export * from "./entities/notification/notification-schedule-execution-record";
export * from "./entities/notification/push-subscription";

// Reward Domain
export * from "./entities/reward/reward";
export * from "./entities/reward/reward-purchase";

// Sponsor Domain
export * from "./entities/sponsor/sponsor";
export * from "./entities/sponsor/trip-sponsor";

// Nested Interfaces (re-exported from parent entities)
export type {
  ChallengeMetadata,
  RankChangeMetadata,
  SubmissionMetadata,
  PostMetadata,
} from "./entities/activity/activity-feed";
export type { InsuranceStep } from "./entities/trip/trip-insurance";
export type { PushDeliveryRecord } from "./entities/notification/notification-delivery";

// Value Objects - organized by domain (DDD pattern: folder indicates domain)
// User domain
export {
  Id as UserId,
  type Id as UserIdType,
  AuthContext,
} from "./value-objects/user";

// Group domain
export { Id as GroupId, type Id as GroupIdType } from "./value-objects/group";

// Challenge domain
export {
  Id as ChallengeId,
  type Id as ChallengeIdType,
  VoteId as ChallengeVoteId,
  type VoteId as ChallengeVoteIdType,
  SubmissionId,
  ReportId,
  ReportReason,
  VotePosition,
  VoteWeight,
} from "./value-objects/challenge";

// Trip domain
export {
  Id as TripId,
  type Id as TripIdType,
  SponsorId as TripSponsorId,
  type SponsorId as TripSponsorIdType,
} from "./value-objects/trip";

// Activity domain
export {
  Id as ActivityId,
  type Id as ActivityIdType,
} from "./value-objects/activity";

// Notification domain
export {
  Id as NotificationId,
  type Id as NotificationIdType,
  ScheduleId as NotificationScheduleId,
  type ScheduleId as NotificationScheduleIdType,
} from "./value-objects/notification";

// Reward domain
export {
  Id as RewardId,
  type Id as RewardIdType,
  CoinAmount,
} from "./value-objects/reward";

// Location domain
export {
  Id as LocationId,
  type Id as LocationIdType,
} from "./value-objects/location";

// Sponsor domain
export {
  Id as SponsorId,
  type Id as SponsorIdType,
} from "./value-objects/sponsor";

// Domain Events (Phase 2: Real-Time Architecture)
export * from "./events";

// Enums - All domain enums organized by area
export * from "./enums";

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
