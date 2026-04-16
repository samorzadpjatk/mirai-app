/**
 * @mirai-app/domain - Domain Layer Exports
 *
 * This package contains pure business logic with ZERO external dependencies.
 * All exports are pure TypeScript/JavaScript - no frameworks, no I/O.
 */

// =============================================================================
// Utilities (shared across all domains)
// =============================================================================

// Validation utilities (boolean validators)
export {
  isValidEmail,
  isValidURL,
  isFutureDate,
  isPastDate,
  isValidDateRange,
} from "./system/utils/validation";

// Geo utilities (distance calculations)
export { calculateDistance, isWithinRadius } from "./system/utils/geo";

// Effect-based validators
export {
  validateEmail,
  validateNotEmpty,
  validateMinLength,
  validateMaxLength,
  validateUUID,
} from "./system/utils/validation";

// Entity validation framework
export {
  validate,
  type StringRule,
  type NumberRule,
  type ArrayRule,
} from "./system/utils/entity-validation";

// Branded ID factory (for creating type-safe identifiers)
export {
  createBrandedId,
  isValidUUID,
  isValidCUID,
  type BrandedId,
  type BrandedIdFactory,
} from "./system/utils/branded-id";

// Pagination value objects for Relay Cursor Connections
export {
  type Connection,
  type Edge,
  type PageInfo,
  type ForwardPaginationArgs,
  type BackwardPaginationArgs,
  type PaginationArgs,
  isForwardPagination,
  isBackwardPagination,
} from "./value-objects/pagination";

// Test constants (for test files)
export { TestIds, type TestIdKey } from "./system/utils/test-ids";

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
} from "./system/utils/mock-factories";

// Unified Domain Error Hierarchy
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
} from "./system/errors/unified-errors";

// Gateway Error Interfaces (for type consistency across layers)
export {
  type GatewayError,
  type DatabaseGatewayError,
} from "./ports/gateway-error";

// State machine factory
export {
  createStateMachine,
  type StateMachineConfig,
  type StateMachine,
} from "./system/utils/state-machine";

// Immutable update helpers
export {
  timestamps,
  withUpdatedAt,
  updateEntity,
  type Timestamps,
  type TimestampOptions,
  type DomainEntity,
} from "./system/utils/immutable";

// =============================================================================
// Domain Events
// =============================================================================
// export * from "./events"; // TODO: Create events barrel

// =============================================================================
// User Domain
// =============================================================================
export * from "./user/entities/user";
export {
  Id as UserId,
  type Id as UserIdType,
  AuthContext,
} from "./user/value-objects";
export * from "./user/enums";

// =============================================================================
// Challenge Domain
// =============================================================================
export * from "./challenge/entities/challenge";
export * from "./challenge/entities/challenge-submission";
export * from "./challenge/entities/challenge-vote";
export * from "./challenge/entities/submission-report";
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
} from "./challenge/value-objects";
export * from "./challenge/enums";

// =============================================================================
// Activity & Feed Domain
// =============================================================================
export * from "./activity/entities/activity-feed";
export * from "./activity/entities/activity-reaction";
export {
  Id as ActivityId,
  type Id as ActivityIdType,
} from "./activity/value-objects";
export * from "./activity/enums";

// Nested Interfaces from activity entities
export type {
  ChallengeMetadata,
  RankChangeMetadata,
  SubmissionMetadata,
  PostMetadata,
} from "./activity/entities/activity-feed";

// =============================================================================
// Group Domain
// =============================================================================
export * from "./group/entities/group";
export * from "./group/entities/group-join-request";
export * from "./group/entities/coin-transaction";
export { Id as GroupId, type Id as GroupIdType } from "./group/value-objects";
export * from "./group/enums";

// =============================================================================
// Trip Domain
// =============================================================================
export * from "./trip/entities/trip";
export * from "./trip/entities/trip-participant";
export * from "./trip/entities/trip-insurance";
export * from "./trip/entities/trip-resource";
export {
  Id as TripId,
  type Id as TripIdType,
  SponsorId as TripSponsorId,
  type SponsorId as TripSponsorIdType,
} from "./trip/value-objects";
export * from "./trip/enums";
export type { InsuranceStep } from "./trip/entities/trip-insurance";

// =============================================================================
// Event Domain
// =============================================================================
export * from "./event/entities/event";
export * from "./event/entities/user-event";
export type {
  TripGateway,
  TripCursorData,
  TripConnectionArgs,
} from "./trip/ports/trip-gateway";
export * from "./trip/entities/trip";
export * from "./trip/enums";

// =============================================================================
// User Domain Ports
// =============================================================================
export type {
  UserGateway,
  UserCursorData,
  UserConnectionArgs,
} from "./user/ports/user-gateway";

// =============================================================================
// Challenge Domain Ports
// =============================================================================
export type {
  ChallengeGateway,
  ChallengeCursorData,
  ChallengeConnectionArgs,
  ChallengeSubmissionGateway,
  ChallengeSubmissionCreatedAtCursorData,
  ChallengeSubmissionVoteScoreCursorData,
  ChallengeSubmissionCreatedAtConnectionArgs,
  ChallengeSubmissionVoteScoreConnectionArgs,
  ChallengeVoteGateway,
  ChallengeVoteCursorData,
  ChallengeVoteConnectionArgs,
  SubmissionReportGateway,
  SubmissionReportCursorData,
  SubmissionReportConnectionArgs,
} from "./challenge/ports";

// =============================================================================
// Group Domain Ports
// =============================================================================
export type {
  GroupGateway,
  GroupCursorData,
  GroupConnectionArgs,
} from "./group/ports/group-gateway";

// =============================================================================
// Location Domain Ports
// =============================================================================
export type {
  LocationGateway,
  LocationSharingRequestCursorData,
  LocationSharingRequestConnectionArgs,
} from "./location/ports/location-gateway";

// =============================================================================
// Notification Domain Ports
// =============================================================================
export type {
  NotificationScheduleGateway,
  NotificationScheduleCursorData,
  NotificationScheduleConnectionArgs,
  NotificationDeliveryGateway,
  NotificationDeliveryCursorData,
  NotificationDeliveryConnectionArgs,
} from "./notification/ports";

// =============================================================================
// Location Domain
// =============================================================================
export * from "./location/entities/location";
export * from "./location/entities/location-sharing-request";
export {
  Id as LocationId,
  type Id as LocationIdType,
} from "./location/value-objects";
export * from "./location/enums";

// =============================================================================
// Notification Domain
// =============================================================================
export * from "./notification/entities/notification";
export * from "./notification/entities/notification-delivery";
export * from "./notification/entities/notification-schedule";
export * from "./notification/entities/notification-schedule-execution-record";
export * from "./notification/entities/push-subscription";
export {
  Id as NotificationId,
  type Id as NotificationIdType,
  ScheduleId as NotificationScheduleId,
  type ScheduleId as NotificationScheduleIdType,
} from "./notification/value-objects";
export * from "./notification/enums";
export type { PushDeliveryRecord } from "./notification/entities/notification-delivery";

// =============================================================================
// Reward Domain
// =============================================================================
export * from "./reward/entities/reward";
export * from "./reward/entities/reward-purchase";
export {
  Id as RewardId,
  type Id as RewardIdType,
  PurchaseId as RewardPurchaseId,
  type PurchaseId as RewardPurchaseIdType,
  CoinAmount,
} from "./reward/value-objects";
export * from "./reward/enums";

// =============================================================================
// Sponsor Domain
// =============================================================================
export * from "./sponsor/entities/sponsor";
export * from "./sponsor/entities/trip-sponsor";
export {
  Id as SponsorId,
  type Id as SponsorIdType,
} from "./sponsor/value-objects";

// =============================================================================
// Domain Enums (barrel export)
// =============================================================================
export * from "./enums";

// =============================================================================
// Domain Ports (barrel export)
// =============================================================================
// export * from "./ports"; // TODO: Create ports barrel
