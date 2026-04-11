/**
 * Ports Index - Re-exports all port interfaces and types
 *
 * This file serves as the central entry point for all ports in the use-cases layer,
 * allowing consumers to import from '../ports' instead of individual files.
 *
 * @module ports
 */

// =============================================================================
// Repository Ports
// =============================================================================

export type { ActivityFeedRepository } from "./ActivityFeedRepository";
export type {
  AuthPort,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "./AuthPort";
export type { ChallengeRepository } from "./ChallengeRepository";
export type { ChallengeSubmissionRepository } from "./ChallengeSubmissionRepository";
export type { ChallengeVoteRepository } from "./ChallengeVoteRepository";
export type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  PaginationOptions as CoinTransactionPaginationOptions,
  CoinStatistics,
  MostActiveAdminStat,
} from "./CoinTransactionRepository";
export type { EventRepository } from "./EventRepository";
export type { GroupRepository } from "./GroupRepository";
export type { LocationRepository } from "./LocationRepository";
export type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  DeliveryStatus,
  DeliveryFilters,
  PaginationOptions as DeliveryPaginationOptions,
  DeliveryStats,
} from "./NotificationDeliveryRepository";
export type { NotificationRepository } from "./NotificationRepository";
export type {
  NotificationScheduleRepository,
  NotificationScheduleExecutionRecord,
} from "./NotificationScheduleRepository";
export type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
  PaginationOptions,
  PaginatedResult,
} from "./RewardRepository";
export type { SponsorRepository } from "./SponsorRepository";
export type {
  SubmissionReportRepository,
} from "./SubmissionReportRepository";
export type { TripRepository } from "./TripRepository";
export type { UserRepository } from "./UserRepository";

// =============================================================================
// Service Ports
// =============================================================================

export type {
  PubSubService,
  SubscriptionHandle,
  PubSubError,
  SubscriptionFailedError,
  PublishFailedError,
} from "./PubSubService";
export type {
  RealtimePort,
  RealtimeSubscription,
  ChannelConfig,
  PresenceState,
  ConnectionState,
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "./RealtimePort";
export type {
  StoragePort,
  StorageError,
  FileNotFoundError,
  UploadError,
  DownloadError,
  DeleteError,
  BucketNotFoundError,
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
  TelemetryError,
} from "./TelemetryPort";
