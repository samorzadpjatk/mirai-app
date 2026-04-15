/**
 * Domain Ports - Repository Interfaces
 *
 * This module defines all repository interfaces (ports) for the domain layer.
 * These interfaces define what operations the application needs from any
 * repository implementation, following the Ports and Adapters pattern.
 *
 * Organized by domain/bounded context.
 *
 * Usage:
 * ```ts
 * import type { UserRepository, DatabaseError } from "@mirai-app/domain/ports";
 * ```
 */

// =============================================================================
// Shared Errors
// =============================================================================

export { DatabaseError } from "./database-error";

// =============================================================================
// Activity & Feed Domain
// =============================================================================

export type { ActivityFeedRepository } from "./activity/activity-feed-repository";
export type {
  PaginationOptions,
  PaginatedResult,
} from "./activity/activity-feed-repository";

// =============================================================================
// Challenge Domain
// =============================================================================

export type { ChallengeRepository } from "./challenge/challenge-repository";
export type { ChallengeSubmissionRepository } from "./challenge/challenge-submission-repository";
export type { ChallengeVoteRepository } from "./challenge/challenge-vote-repository";
export type { SubmissionReportRepository } from "./challenge/submission-report-repository";

// =============================================================================
// Event Domain
// =============================================================================

export type { EventRepository } from "./event/event-repository";

// =============================================================================
// Group Domain
// =============================================================================

export type { GroupRepository } from "./group/group-repository";
export type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  MostActiveAdminStat,
  CoinStatistics,
} from "./group/coin-transaction-repository";

// =============================================================================
// Location Domain
// =============================================================================

export type { LocationRepository } from "./location/location-repository";

// =============================================================================
// Notification Domain
// =============================================================================

export type { NotificationRepository } from "./notification/notification-repository";
export type { NotificationDeliveryRepository } from "./notification/notification-delivery-repository";
export type {
  NotificationScheduleExecutionRecord,
  NotificationScheduleRepository,
} from "./notification/notification-schedule-repository";
export type {
  DeliveryStatus,
  NotificationDelivery,
  DeliveryFilters,
  DeliveryStats,
} from "./notification/notification-delivery-repository";

// =============================================================================
// Reward Domain
// =============================================================================

export type {
  RewardRepository,
  RewardPurchaseRepository,
} from "./reward/reward-repository";

// =============================================================================
// Sponsor Domain
// =============================================================================

export type { SponsorRepository } from "./sponsor/sponsor-repository";

// =============================================================================
// Trip Domain
// =============================================================================

export type { TripRepository } from "./trip/trip-repository";

// =============================================================================
// User Domain
// =============================================================================

export type { UserRepository } from "./user/user-repository";
export type { AuthPort } from "./user/auth-port";

// =============================================================================
// System/Service Interfaces (Ports for External Services)
// =============================================================================

export type {
  PubSubService,
  SubscriptionHandle,
} from "./system/pub-sub-service";
export type {
  RealtimePort,
  RealtimeSubscription,
  ChannelConfig,
  ConnectionState,
  PresenceState,
} from "./system/realtime-port";
export type {
  StoragePort,
  FileMetadata,
  UploadOptions,
  SignedUrlInfo,
  StorageConfig,
  DownloadResult,
} from "./system/storage-port";
export type {
  TelemetryPort,
  TelemetryEvent,
  TelemetrySeverity,
} from "./system/telemetry-port";
