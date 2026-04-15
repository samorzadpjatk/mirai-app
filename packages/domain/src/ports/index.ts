/**
 * Domain Ports - Repository Interfaces
 *
 * This module defines all repository interfaces (ports) for the domain layer.
 * These interfaces define what operations the application needs from any
 * repository implementation, following the Ports and Adapters pattern.
 *
 * Implementations (in adapters layer):
 * - Drizzle*Repository: Uses Drizzle ORM
 * - InMemory*Repository: For testing
 *
 * Usage:
 * ```ts
 * import type { UserRepository, DatabaseError } from "@mirai-app/domain/ports";
 * ```
 */

// =============================================================================
// Shared Errors
// =============================================================================

export { DatabaseError } from "./DatabaseError";

// =============================================================================
// Repository Interfaces
// =============================================================================

export type { ActivityFeedRepository } from "./ActivityFeedRepository";
export type { ChallengeRepository } from "./ChallengeRepository";
export type { ChallengeSubmissionRepository } from "./ChallengeSubmissionRepository";
export type { ChallengeVoteRepository } from "./ChallengeVoteRepository";
export type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  MostActiveAdminStat,
  CoinStatistics,
} from "./CoinTransactionRepository";
export type { EventRepository } from "./EventRepository";
export type { GroupRepository } from "./GroupRepository";
export type { LocationRepository } from "./LocationRepository";
export type { NotificationDeliveryRepository } from "./NotificationDeliveryRepository";
export type { NotificationRepository } from "./NotificationRepository";
export type {
  NotificationScheduleExecutionRecord,
  NotificationScheduleRepository,
} from "./NotificationScheduleRepository";
export type {
  RewardRepository,
  RewardPurchaseRepository,
} from "./RewardRepository";
export type { SponsorRepository } from "./SponsorRepository";
export type { SubmissionReportRepository } from "./SubmissionReportRepository";
export type { TripRepository } from "./TripRepository";
export type { UserRepository } from "./UserRepository";

// =============================================================================
// Service Interfaces (Ports for External Services)
// =============================================================================

export type { AuthPort } from "./AuthPort";
export type { PubSubService, SubscriptionHandle } from "./PubSubService";
export type {
  RealtimePort,
  RealtimeSubscription,
  ChannelConfig,
  ConnectionState,
  PresenceState,
} from "./RealtimePort";
export type {
  StoragePort,
  FileMetadata,
  UploadOptions,
  SignedUrlInfo,
  StorageConfig,
  DownloadResult,
} from "./StoragePort";
export type {
  TelemetryPort,
  TelemetryEvent,
  TelemetrySeverity,
} from "./TelemetryPort";

// =============================================================================
// Shared Types
// =============================================================================

export type {
  PaginationOptions,
  PaginatedResult,
} from "./ActivityFeedRepository";
export type {
  DeliveryStatus,
  NotificationDelivery,
  DeliveryFilters,
  DeliveryStats,
} from "./NotificationDeliveryRepository";
