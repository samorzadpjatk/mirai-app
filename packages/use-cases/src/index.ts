/**
 * @mirai-app/use-cases - Use Cases Layer Exports
 *
 * This package contains application orchestration logic.
 * It depends only on @mirai-app/domain (innermost layer).
 */

// =============================================================================
// Ports (Repository and Service Interfaces)
// =============================================================================
// Note: These interfaces are exported for implementation by the adapters layer.
// They may show as "orphan" in dependency-cruiser because the static analyzer
// cannot trace imports through the package barrel. They ARE used by:
// - Interactors within this package (constructor injection)
// - Repository implementations in @mirai-app/adapters
// =============================================================================
export type { UserRepository } from "./ports/UserRepository";
export type { ChallengeRepository } from "./ports/ChallengeRepository";
export type { NotificationRepository } from "./ports/NotificationRepository";
export type { TripRepository } from "./ports/TripRepository";
export type { GroupRepository } from "./ports/GroupRepository";
export type { ActivityFeedRepository } from "./ports/ActivityFeedRepository";
export type { ChallengeSubmissionRepository } from "./ports/ChallengeSubmissionRepository";
export type { LocationRepository } from "./ports/LocationRepository";
export type { ChallengeVoteRepository } from "./ports/ChallengeVoteRepository";
export type { SponsorRepository } from "./ports/SponsorRepository";
export type { SubmissionReportRepository } from "./ports/SubmissionReportRepository";
export type { EventRepository } from "./ports/EventRepository";
export type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
  PaginationOptions,
  PaginatedResult,
} from "./ports/RewardRepository";
export type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  MostActiveAdminStat,
  CoinStatistics,
} from "./ports/CoinTransactionRepository";
export type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  DeliveryFilters,
  DeliveryStats,
  DeliveryStatus,
  PaginationOptions as DeliveryPaginationOptions,
} from "./ports/NotificationDeliveryRepository";
export type {
  NotificationScheduleRepository,
  NotificationScheduleExecutionRecord,
} from "./ports/NotificationScheduleRepository";

// =============================================================================
// Auth & Telemetry Ports (for DDD architecture)
// =============================================================================
export type {
  AuthPort,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "./ports/AuthPort";
export type {
  TelemetryPort,
  TelemetryEvent,
  TelemetrySeverity,
  TelemetryError,
} from "./ports/TelemetryPort";

// =============================================================================
// Realtime & Storage Ports (Phase 0: Supabase-Agnostic Architecture)
// =============================================================================

// RealtimePort exports
export type {
  RealtimePort,
  RealtimeSubscription,
  ChannelConfig,
  PresenceState,
  ConnectionState,
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "./ports/RealtimePort";

// PubSubService exports (GraphQL Subscriptions Migration)
export type {
  PubSubService,
  SubscriptionHandle,
  PubSubError,
  SubscriptionFailedError,
  PublishFailedError,
} from "./ports/PubSubService";

// StoragePort exports
export type {
  StoragePort,
  FileMetadata,
  UploadOptions,
  SignedUrlInfo,
  StorageError,
  FileNotFoundError,
  UploadError,
  BucketNotFoundError,
} from "./ports/StoragePort";

export {
  type UseCaseNotFoundError,
  type UseCaseConflictError,
  type UseCaseValidationError,
  type UseCaseRepositoryError,
  type UseCaseError,
  AppError,
  isUseCaseError,
  getUseCaseErrorMessage,
  getUseCaseErrorCode,
} from "./errors";

// Interactors (Use Case Implementations)
export {
  GetUserUseCase,
  type GetUserInput,
  type GetUserOutput,
} from "./interactors/GetUser";
export {
  CreateUserUseCase,
  type CreateUserInput,
  type CreateUserOutput,
} from "./interactors/CreateUser";
export {
  UpdateUserUseCase,
  type UpdateUserInput,
  type UpdateUserOutput,
} from "./interactors/UpdateUser";
export {
  AuthenticateUserUseCase,
  type AuthenticateUserInput,
  type AuthenticateUserOutput,
} from "./interactors/AuthenticateUser";

export {
  GetChallengeUseCase,
  type GetChallengeInput,
  type GetChallengeOutput,
} from "./interactors/GetChallenge";
export {
  CreateChallengeUseCase,
  type CreateChallengeInput,
  type CreateChallengeOutput,
} from "./interactors/CreateChallenge";
export {
  UpdateChallengeUseCase,
  type UpdateChallengeInput,
  type UpdateChallengeOutput,
} from "./interactors/UpdateChallenge";
export {
  UpdateChallengeStatusUseCase,
  type UpdateChallengeStatusInput,
  type UpdateChallengeStatusOutput,
} from "./interactors/UpdateChallengeStatus";

// Group Domain Use Cases
export {
  GetGroupUseCase,
  type GetGroupInput,
  type GetGroupOutput,
} from "./interactors/GetGroup";
export {
  CreateGroupUseCase,
  type CreateGroupInput,
  type CreateGroupOutput,
} from "./interactors/CreateGroup";
export {
  UpdateGroupUseCase,
  type UpdateGroupInput,
  type UpdateGroupOutput,
} from "./interactors/UpdateGroup";

export {
  GetNotificationUseCase,
  type GetNotificationInput,
  type GetNotificationOutput,
} from "./interactors/GetNotification";

export {
  GetActivityFeedUseCase,
  type GetActivityFeedInput,
  type GetActivityFeedOutput,
} from "./interactors/GetActivityFeed";

export {
  CreateActivityUseCase,
  type CreateActivityInput,
  type CreateActivityOutput,
} from "./interactors/CreateActivity";

export {
  AddReactionUseCase,
  type AddReactionInput,
  type AddReactionOutput,
} from "./interactors/AddReaction";

// Challenge Submission Use Cases
export {
  CreateSubmissionUseCase,
  type CreateSubmissionInput,
  type CreateSubmissionOutput,
} from "./interactors/CreateSubmission";
export {
  GetSubmissionUseCase,
  type GetSubmissionInput,
  type GetSubmissionOutput,
} from "./interactors/GetSubmission";
export {
  GetSubmissionByChallengeAndGroupUseCase,
  type GetSubmissionByChallengeAndGroupInput,
  type GetSubmissionByChallengeAndGroupOutput,
} from "./interactors/GetSubmissionByChallengeAndGroup";
export {
  UpdateSubmissionUseCase,
  type UpdateSubmissionInput,
  type UpdateSubmissionOutput,
} from "./interactors/UpdateSubmission";
export {
  DeleteSubmissionUseCase,
  type DeleteSubmissionInput,
  type DeleteSubmissionOutput,
} from "./interactors/DeleteSubmission";
export {
  ListSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
  type ListSubmissionsByChallengeOutput,
} from "./interactors/ListSubmissionsByChallenge";

// Location Use Cases
export {
  GetLocationUseCase,
  type GetLocationInput,
  type GetLocationOutput,
} from "./interactors/GetLocation";
export {
  CreateLocationUseCase,
  type CreateLocationInput,
  type CreateLocationOutput,
} from "./interactors/CreateLocation";
export {
  UpdateLocationUseCase,
  type UpdateLocationInput,
  type UpdateLocationOutput,
} from "./interactors/UpdateLocation";
export {
  ListLocationsUseCase,
  type ListLocationsInput,
  type ListLocationsOutput,
  type LocationOutput,
} from "./interactors/ListLocations";
export {
  UpdateSharingSettingsUseCase,
  type UpdateSharingSettingsInput,
  type UpdateSharingSettingsOutput,
} from "./interactors/UpdateSharingSettings";
export {
  AddSharingUserUseCase,
  type AddSharingUserInput,
  type AddSharingUserOutput,
} from "./interactors/AddSharingUser";
export {
  RemoveSharingUserUseCase,
  type RemoveSharingUserInput,
  type RemoveSharingUserOutput,
} from "./interactors/RemoveSharingUser";
export {
  GetSharingSettingsUseCase,
  type GetSharingSettingsInput,
  type GetSharingSettingsOutput,
} from "./interactors/GetSharingSettings";

// Notification Delivery Use Cases
export {
  GetDeliveriesUseCase,
  type GetDeliveriesInput,
  type GetDeliveriesOutput,
} from "./interactors/GetDeliveries";
export {
  GetDeliveryByNotificationIdUseCase,
  type GetDeliveryByNotificationIdInput,
  type GetDeliveryByNotificationIdOutput,
} from "./interactors/GetDeliveryByNotificationId";
export {
  GetDeliveryStatsUseCase,
  type GetDeliveryStatsInput,
  type GetDeliveryStatsOutput,
} from "./interactors/GetDeliveryStats";
export {
  GetFailedDeliveriesUseCase,
  type GetFailedDeliveriesInput,
  type GetFailedDeliveriesOutput,
} from "./interactors/GetFailedDeliveries";

// Reward Use Cases
export {
  GetRewardUseCase,
  type GetRewardInput,
  type GetRewardOutput,
} from "./interactors/GetReward";
export {
  CreateRewardUseCase,
  type CreateRewardInput,
  type CreateRewardOutput,
} from "./interactors/CreateReward";
export {
  UpdateRewardUseCase,
  type UpdateRewardInput,
  type UpdateRewardOutput,
} from "./interactors/UpdateReward";
export {
  SetRewardHiddenUseCase,
  type SetRewardHiddenInput,
  type SetRewardHiddenOutput,
} from "./interactors/SetRewardHidden";
export {
  DeleteRewardUseCase,
  type DeleteRewardInput,
  type DeleteRewardOutput,
} from "./interactors/DeleteReward";
export {
  ListRewardsUseCase,
  type ListRewardsInput,
  type ListRewardsOutput,
  type RewardWithCalculations,
} from "./interactors/ListRewards";
export {
  PurchaseRewardUseCase,
  type PurchaseRewardInput,
  type PurchaseRewardOutput,
} from "./interactors/PurchaseReward";
export {
  UpdatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
  type UpdatePurchaseStatusOutput,
} from "./interactors/UpdatePurchaseStatus";
export {
  UpdateMyPurchaseStatusUseCase,
  type UpdateMyPurchaseStatusInput,
  type UpdateMyPurchaseStatusOutput,
} from "./interactors/UpdateMyPurchaseStatus";
export {
  GetPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
  type GetPurchaseHistoryOutput,
  type PurchaseWithDetails,
} from "./interactors/GetPurchaseHistory";

// Coin Transaction Use Cases
export {
  GetCoinStatisticsUseCase,
  type GetCoinStatisticsInput,
  type GetCoinStatisticsOutput,
} from "./interactors/GetCoinStatistics";
export {
  GetMostActiveAdminStatsUseCase,
  type GetMostActiveAdminStatsInput,
  type GetMostActiveAdminStatsOutput,
} from "./interactors/GetMostActiveAdminStats";
export {
  GetCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
  type GetCoinTransactionsOutput,
} from "./interactors/GetCoinTransactions";
export {
  GetCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
  type GetCoinQuickStatsOutput,
} from "./interactors/GetCoinQuickStats";
export {
  GetCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
  type GetCoinAdditionalInsightsOutput,
  type FormattedUser,
} from "./interactors/GetCoinAdditionalInsights";
export {
  AddCoinsUseCase,
  type AddCoinsInput,
  type AddCoinsOutput,
} from "./interactors/AddCoins";
export {
  RemoveCoinsUseCase,
  type RemoveCoinsInput,
  type RemoveCoinsOutput,
} from "./interactors/RemoveCoins";

// Challenge Vote Use Cases
export {
  GetMyVotesUseCase,
  type GetMyVotesInput,
  type GetMyVotesOutput,
  type VoteDTO,
} from "./interactors/GetMyVotes";
export {
  GetVotesByChallengeUseCase,
  type GetVotesByChallengeInput,
  type GetVotesByChallengeOutput,
  type ChallengeVoteDTO,
} from "./interactors/GetVotesByChallenge";
export {
  GetChallengeVotingProgressUseCase,
  type GetChallengeVotingProgressInput,
  type GetChallengeVotingProgressOutput,
  type SubmissionVoteCount,
} from "./interactors/GetChallengeVotingProgress";
export {
  GetJudgedStaffVotingProgressUseCase,
  type GetJudgedStaffVotingProgressInput,
  type GetJudgedStaffVotingProgressOutput,
  type AdminVotingInfo,
} from "./interactors/GetJudgedStaffVotingProgress";
export {
  SubmitVoteUseCase,
  type SubmitVoteInput,
  type SubmitVoteOutput,
} from "./interactors/SubmitVote";
export {
  SubmitVotesUseCase,
  type SubmitVotesInput,
  type SubmitVotesOutput,
  type VoteInput,
  type VoteOutput,
} from "./interactors/SubmitVotes";
export {
  ForceEndVotingUseCase,
  type ForceEndVotingInput,
  type ForceEndVotingOutput,
} from "./interactors/ForceEndVoting";

// Submission Report Use Cases
export {
  CreateReportUseCase,
  type CreateReportInput,
  type CreateReportOutput,
} from "./interactors/CreateReport";
export {
  GetReportsUseCase,
  type GetReportsInput,
  type GetReportsOutput,
  type ReporterOutput,
  type ReportOutput,
} from "./interactors/GetReports";

// Sponsor Use Cases
export {
  CreateSponsorUseCase,
  type CreateSponsorInput,
  type CreateSponsorOutput,
} from "./interactors/CreateSponsor";
export {
  GetSponsorUseCase,
  type GetSponsorInput,
  type GetSponsorOutput,
} from "./interactors/GetSponsor";
export {
  UpdateSponsorUseCase,
  type UpdateSponsorInput,
  type UpdateSponsorOutput,
} from "./interactors/UpdateSponsor";
export {
  DeleteSponsorUseCase,
  type DeleteSponsorInput,
  type DeleteSponsorOutput,
} from "./interactors/DeleteSponsor";
export {
  ListSponsorsUseCase,
  type ListSponsorsInput,
  type ListSponsorsOutput,
  type SponsorListItem,
} from "./interactors/ListSponsors";
export {
  LinkSponsorToTripUseCase,
  type LinkSponsorToTripInput,
  type LinkSponsorToTripOutput,
} from "./interactors/LinkSponsorToTrip";
export {
  UnlinkSponsorFromTripUseCase,
  type UnlinkSponsorFromTripInput,
  type UnlinkSponsorFromTripOutput,
} from "./interactors/UnlinkSponsorFromTrip";

// Notification Schedule Use Cases
export {
  GetNotificationSchedulesUseCase,
  type GetNotificationSchedulesInput,
  type GetNotificationSchedulesOutput,
  type NotificationScheduleOutput,
} from "./interactors/GetNotificationSchedules";
export {
  GetNotificationScheduleByIdUseCase,
  type GetNotificationScheduleByIdInput,
  type GetNotificationScheduleByIdOutput,
} from "./interactors/GetNotificationScheduleById";
export {
  CreateNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
  type CreateNotificationScheduleOutput,
} from "./interactors/CreateNotificationSchedule";
export {
  UpdateNotificationScheduleUseCase,
  type UpdateNotificationScheduleInput,
  type UpdateNotificationScheduleOutput,
} from "./interactors/UpdateNotificationSchedule";
export {
  DeleteNotificationScheduleUseCase,
  type DeleteNotificationScheduleInput,
  type DeleteNotificationScheduleOutput,
} from "./interactors/DeleteNotificationSchedule";
export {
  GetActiveNotificationSchedulesUseCase,
  type GetActiveNotificationSchedulesInput,
  type GetActiveNotificationSchedulesOutput,
} from "./interactors/GetActiveNotificationSchedules";
export {
  GetUpcomingNotificationSchedulesUseCase,
  type GetUpcomingNotificationSchedulesInput,
  type GetUpcomingNotificationSchedulesOutput,
} from "./interactors/GetUpcomingNotificationSchedules";
export {
  UpdateNotificationScheduleLastRunUseCase,
  type UpdateNotificationScheduleLastRunInput,
  type UpdateNotificationScheduleLastRunOutput,
} from "./interactors/UpdateNotificationScheduleLastRun";
export {
  ToggleNotificationScheduleActiveUseCase,
  type ToggleNotificationScheduleActiveInput,
  type ToggleNotificationScheduleActiveOutput,
} from "./interactors/ToggleNotificationScheduleActive";
export {
  BulkToggleNotificationScheduleActiveUseCase,
  type BulkToggleNotificationScheduleActiveInput,
  type BulkToggleNotificationScheduleActiveOutput,
} from "./interactors/BulkToggleNotificationScheduleActive";
export {
  BulkDeleteNotificationSchedulesUseCase,
  type BulkDeleteNotificationSchedulesInput,
  type BulkDeleteNotificationSchedulesOutput,
} from "./interactors/BulkDeleteNotificationSchedules";
export {
  DuplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
  type DuplicateNotificationScheduleOutput,
} from "./interactors/DuplicateNotificationSchedule";
export {
  GetNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
  type GetNotificationScheduleExecutionHistoryOutput,
  type ExecutionHistoryItem,
} from "./interactors/GetNotificationScheduleExecutionHistory";

// Utilities
export { wrapError, CommonErrors } from "./utils/error-helpers";
export {
  getPaginationDefaults,
  calculateHasMore,
  createPaginationMeta,
  DEFAULT_PAGINATION,
} from "./utils/pagination";

// =============================================================================
// Modules (Dependency Injection)
// =============================================================================
export {
  UseCaseModule,
  USE_CASE_TOKENS,
  type UseCaseModuleDeps,
  type UseCaseToken,
} from "./modules/UseCaseModule";

// =============================================================================
// Re-export domain types for convenience
// =============================================================================
export type { Result } from "@mirai-app/domain";

export { ok, err } from "@mirai-app/domain";

// Re-export domain enums needed by adapters layer
export { UserRole } from "@mirai-app/domain";

// Authorization Use Cases
export {
  AuthorizeAdminUseCase,
  authorizeAdminUseCase,
  type AuthorizeAdminInput,
  type AuthorizeAdminOutput,
} from "./interactors/AuthorizeAdmin";
export {
  AuthorizeModeratorUseCase,
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  type AuthorizeModeratorOutput,
} from "./interactors/AuthorizeModerator";

// Telemetry Use Case
export {
  LogTelemetryUseCase,
  type LogTelemetryInput,
  type LogTelemetryOutput,
} from "./interactors/LogTelemetry";
