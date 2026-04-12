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
export { LocationRepositoryTag } from "./ports/LocationRepository";
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
export {
  RewardRepositoryTag,
  TripPointsCalculatorTag,
  TripAccessCheckerTag,
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
export { NotificationScheduleRepositoryTag } from "./ports/NotificationScheduleRepository";

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

// User Use Cases (Effect-based)
export {
  createUserUseCase,
  type CreateUserInput,
  type CreateUserOutput,
  UserAlreadyExistsError,
  UserCreationError,
} from "./interactors/CreateUser";
export {
  updateUserUseCase,
  type UpdateUserInput,
  type UpdateUserOutput,
  UserNotFoundError,
  UserUpdateError,
} from "./interactors/UpdateUser";
export {
  getUserUseCase,
  type GetUserInput,
  type GetUserOutput,
  GetUserNotFoundError,
} from "./interactors/GetUser";
export {
  deleteUserUseCase,
  type DeleteUserInput,
  type DeleteUserOutput,
  DeleteUserNotFoundError,
  DeleteUserError,
} from "./interactors/DeleteUser";
export {
  authenticateUserUseCase,
  type AuthenticateUserInput,
  type AuthenticateUserOutput,
} from "./interactors/AuthenticateUser";

export {
  getChallengeUseCase,
  type GetChallengeInput,
  type GetChallengeOutput,
  ChallengeNotFoundError,
  ChallengeLoadError,
} from "./interactors/GetChallenge";
export {
  createChallengeUseCase,
  type CreateChallengeInput,
  type CreateChallengeOutput,
  ChallengeCreationError,
  ChallengeRepositoryError,
} from "./interactors/CreateChallenge";
export {
  updateChallengeUseCase,
  type UpdateChallengeInput,
  type UpdateChallengeOutput,
  ChallengeNotFoundError as UpdateChallengeNotFoundError,
  ChallengeUpdateValidationError,
  ChallengeTerminalStateError,
  ChallengeUpdateRepositoryError,
} from "./interactors/UpdateChallenge";
export {
  updateChallengeStatusUseCase,
  type UpdateChallengeStatusInput,
  type UpdateChallengeStatusOutput,
  ChallengeNotFoundError as UpdateChallengeStatusNotFoundError,
  InvalidStatusTransitionError,
  ChallengeUpdateError,
} from "./interactors/UpdateChallengeStatus";

// Group Domain Use Cases (Effect-based)
export {
  getGroupUseCase,
  type GetGroupInput,
  type GetGroupOutput,
  GetGroupNotFoundError,
} from "./interactors/GetGroup";
export {
  createGroupUseCase,
  type CreateGroupInput,
  type CreateGroupOutput,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
} from "./interactors/CreateGroup";
export {
  updateGroupUseCase,
  type UpdateGroupInput,
  type UpdateGroupOutput,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
} from "./interactors/UpdateGroup";
export {
  deleteGroupUseCase,
  type DeleteGroupInput,
  type DeleteGroupOutput,
  DeleteGroupNotFoundError,
  DeleteGroupError,
} from "./interactors/DeleteGroup";

export {
  getNotificationUseCase,
  type GetNotificationInput,
  type GetNotificationOutput,
  NotificationNotFoundError,
} from "./interactors/GetNotification";

export {
  getActivityFeedUseCase,
  type GetActivityFeedInput,
  type GetActivityFeedOutput,
} from "./interactors/GetActivityFeed";

export {
  createActivityUseCase,
  type CreateActivityInput,
  type CreateActivityOutput,
} from "./interactors/CreateActivity";

export {
  addReactionUseCase,
  type AddReactionInput,
  type AddReactionOutput,
} from "./interactors/AddReaction";

// Challenge Submission Use Cases (Effect-based)
export {
  createSubmissionUseCase,
  type CreateSubmissionInput,
  type CreateSubmissionOutput,
  SubmissionCreationError,
  DuplicateSubmissionError,
  SubmissionRepositoryError,
} from "./interactors/CreateSubmission";
export {
  getSubmissionUseCase,
  type GetSubmissionInput,
  type GetSubmissionOutput,
  SubmissionNotFoundError,
  GetSubmissionRepositoryError,
} from "./interactors/GetSubmission";
export {
  getSubmissionByChallengeAndGroupUseCase,
  type GetSubmissionByChallengeAndGroupInput,
  type GetSubmissionByChallengeAndGroupOutput,
} from "./interactors/GetSubmissionByChallengeAndGroup";
export {
  updateSubmissionUseCase,
  type UpdateSubmissionInput,
  type UpdateSubmissionOutput,
  SubmissionUpdateNotFoundError,
  SubmissionUpdateValidationError,
  InvalidReviewActionError,
  UpdateSubmissionRepositoryError,
} from "./interactors/UpdateSubmission";
export {
  deleteSubmissionUseCase,
  type DeleteSubmissionInput,
  type DeleteSubmissionOutput,
  SubmissionDeleteNotFoundError,
  SubmissionDeleteNotAllowedError,
  DeleteSubmissionRepositoryError,
} from "./interactors/DeleteSubmission";
export {
  listSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
  type ListSubmissionsByChallengeOutput,
  ListSubmissionsRepositoryError,
} from "./interactors/ListSubmissionsByChallenge";

// Location Use Cases
export {
  getLocationUseCase,
  type GetLocationInput,
  type GetLocationOutput,
  LocationNotFoundError,
} from "./interactors/GetLocation";
export {
  createLocationUseCase,
  type CreateLocationInput,
  type CreateLocationOutput,
  LocationCreationError,
  LocationUpdateError,
} from "./interactors/CreateLocation";
export {
  updateLocationUseCase,
  type UpdateLocationInput,
  type UpdateLocationOutput,
  LocationCreateError,
  LocationUpdateValidationError,
} from "./interactors/UpdateLocation";
export {
  listLocationsUseCase,
  type ListLocationsInput,
  type ListLocationsOutput,
  type LocationOutput,
} from "./interactors/ListLocations";
export {
  updateSharingSettingsUseCase,
  type UpdateSharingSettingsInput,
  type UpdateSharingSettingsOutput,
  UpdateSharingSettingsValidationError,
  UpdateSharingSettingsRepositoryError,
} from "./interactors/UpdateSharingSettings";
export {
  addSharingUserUseCase,
  type AddSharingUserInput,
  type AddSharingUserOutput,
  CannotShareWithSelfError,
  AddSharingUserValidationError,
  AddSharingUserRepositoryError,
} from "./interactors/AddSharingUser";
export {
  removeSharingUserUseCase,
  type RemoveSharingUserInput,
  type RemoveSharingUserOutput,
  LocationNotFoundError as RemoveSharingUserLocationNotFoundError,
  RemoveSharingUserRepositoryError,
} from "./interactors/RemoveSharingUser";
export {
  getSharingSettingsUseCase,
  type GetSharingSettingsInput,
  type GetSharingSettingsOutput,
  GetSharingSettingsRepositoryError,
} from "./interactors/GetSharingSettings";

// Notification Delivery Use Cases (Effect-based)
export {
  getDeliveriesUseCase,
  type GetDeliveriesInput,
  type GetDeliveriesOutput,
  GetDeliveriesError,
} from "./interactors/GetDeliveries";
export {
  getDeliveryByNotificationIdUseCase,
  type GetDeliveryByNotificationIdInput,
  type GetDeliveryByNotificationIdOutput,
  DeliveryNotFoundError,
  GetDeliveryError,
} from "./interactors/GetDeliveryByNotificationId";
export {
  getDeliveryStatsUseCase,
  type GetDeliveryStatsInput,
  type GetDeliveryStatsOutput,
  GetDeliveryStatsError,
} from "./interactors/GetDeliveryStats";
export {
  getFailedDeliveriesUseCase,
  type GetFailedDeliveriesInput,
  type GetFailedDeliveriesOutput,
  GetFailedDeliveriesError,
} from "./interactors/GetFailedDeliveries";

// Reward Use Cases (Effect-based)
export {
  getRewardUseCase,
  type GetRewardInput,
  type GetRewardOutput,
  RewardNotFoundError as GetRewardNotFoundError,
  RewardRepositoryError as GetRewardRepositoryError,
} from "./interactors/GetReward";
export {
  createRewardUseCase,
  type CreateRewardInput,
  type CreateRewardOutput,
  CreateRewardError,
  RewardRepositoryError as CreateRewardRepositoryError,
} from "./interactors/CreateReward";
export {
  updateRewardUseCase,
  type UpdateRewardInput,
  type UpdateRewardOutput,
  RewardNotFoundError as UpdateRewardNotFoundError,
  UpdateRewardError,
  RewardRepositoryError as UpdateRewardRepositoryError,
} from "./interactors/UpdateReward";
export {
  setRewardHiddenUseCase,
  type SetRewardHiddenInput,
  type SetRewardHiddenOutput,
  RewardNotFoundError as SetRewardHiddenNotFoundError,
  SetRewardHiddenRepositoryError,
} from "./interactors/SetRewardHidden";
export {
  deleteRewardUseCase,
  type DeleteRewardInput,
  type DeleteRewardOutput,
  RewardNotFoundError as DeleteRewardNotFoundError,
  RewardHasPurchasesError,
} from "./interactors/DeleteReward";
export {
  listRewardsUseCase,
  type ListRewardsInput,
  type ListRewardsOutput,
  type RewardWithCalculations,
  ListRewardsError,
  RewardRepositoryError as ListRewardRepositoryError,
  TripPointsCalculatorError as ListRewardsTripPointsCalculatorError,
} from "./interactors/ListRewards";
export {
  purchaseRewardUseCase,
  type PurchaseRewardInput,
  type PurchaseRewardOutput,
  RewardNotFoundError,
  TripEndedError,
  RewardHiddenError,
  InsufficientQuantityError,
  NotGroupLeaderError,
  InsufficientCoinsError,
  RewardRepositoryError,
  TripAccessCheckerError,
  TripPointsCalculatorError,
  GroupCoinsServiceError,
  PurchaseCreationError,
  type PurchaseRewardError,
} from "./interactors/PurchaseReward";
export {
  updatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
  type UpdatePurchaseStatusOutput,
  PurchaseNotFoundError,
  NotAuthorizedError,
  InvalidPurchaseStatusTransitionError,
  UpdatePurchaseValidationError,
  UpdatePurchaseOperationError,
} from "./interactors/UpdatePurchaseStatus";
export {
  updateMyPurchaseStatusUseCase,
  type UpdateMyPurchaseStatusInput,
  type UpdateMyPurchaseStatusOutput,
  MyPurchaseNotFoundError,
  NotGroupLeaderError as UpdateMyPurchaseNotGroupLeaderError,
  InvalidUserStatusTransitionError,
  InvalidCancellationError,
  UpdateMyPurchaseOperationError,
} from "./interactors/UpdateMyPurchaseStatus";
export {
  getPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
  type GetPurchaseHistoryOutput,
  type PurchaseWithDetails,
  NoGroupAccessError,
  PurchaseRepositoryError,
  type GetPurchaseHistoryError,
} from "./interactors/GetPurchaseHistory";

// Coin Transaction Use Cases
export {
  getCoinStatisticsUseCase,
  type GetCoinStatisticsInput,
  type GetCoinStatisticsOutput,
} from "./interactors/GetCoinStatistics";
export {
  getMostActiveAdminStatsUseCase,
  type GetMostActiveAdminStatsInput,
  type GetMostActiveAdminStatsOutput,
  CoinTransactionRepositoryError,
  type GetMostActiveAdminStatsError,
} from "./interactors/GetMostActiveAdminStats";
export {
  getCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
  type GetCoinTransactionsOutput,
} from "./interactors/GetCoinTransactions";
export {
  getCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
  type GetCoinQuickStatsOutput,
} from "./interactors/GetCoinQuickStats";
export {
  getCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
  type GetCoinAdditionalInsightsOutput,
  type FormattedUser,
} from "./interactors/GetCoinAdditionalInsights";
export {
  addCoinsUseCase,
  type AddCoinsInput,
  type AddCoinsOutput,
} from "./interactors/AddCoins";
export {
  removeCoinsUseCase,
  type RemoveCoinsInput,
  type RemoveCoinsOutput,
} from "./interactors/RemoveCoins";

// Challenge Vote Use Cases (Effect-based)
export {
  submitVoteUseCase,
  type SubmitVoteInput,
  type SubmitVoteOutput,
  SubmitVoteValidationError,
  VotePositionTakenError,
  AlreadyVotedError,
  VoteRepositoryError,
} from "./interactors/SubmitVote";
export {
  submitVotesUseCase,
  type SubmitVotesInput,
  type SubmitVotesOutput,
  type VoteInput,
  type VoteOutput,
  SubmitVotesValidationError,
  BatchAlreadyVotedError,
  InvalidVoteSetError,
  BatchVoteRepositoryError,
} from "./interactors/SubmitVotes";
export {
  getMyVotesUseCase,
  type GetMyVotesInput,
  type GetMyVotesOutput,
  type VoteDTO,
  GetMyVotesValidationError,
  GetMyVotesRepositoryError,
} from "./interactors/GetMyVotes";
export {
  getVotesByChallengeUseCase,
  type GetVotesByChallengeInput,
  type GetVotesByChallengeOutput,
  type ChallengeVoteDTO,
  GetVotesByChallengeValidationError,
  GetVotesByChallengeRepositoryError,
} from "./interactors/GetVotesByChallenge";
export {
  getChallengeVotingProgressUseCase,
  type GetChallengeVotingProgressInput,
  type GetChallengeVotingProgressOutput,
  type SubmissionVoteCount,
  GetVotingProgressValidationError,
  GetVotingProgressRepositoryError,
} from "./interactors/GetChallengeVotingProgress";
export {
  getJudgedStaffVotingProgressUseCase,
  type GetJudgedStaffVotingProgressInput,
  type GetJudgedStaffVotingProgressOutput,
  type AdminVotingInfo,
  GetVotingProgressValidationError as GetJudgedStaffVotingProgressValidationError,
  GetVotingProgressRepositoryError as GetJudgedStaffVotingProgressRepositoryError,
} from "./interactors/GetJudgedStaffVotingProgress";
export {
  forceEndVotingUseCase,
  type ForceEndVotingInput,
  type ForceEndVotingOutput,
  ForceEndChallengeNotFoundError,
  ForceEndValidationError,
  ChallengeWrongTripError,
  ForceEndOperationError,
} from "./interactors/ForceEndVoting";

// Individual Challenge Vote Operations (Effect-based)
export {
  createChallengeVoteUseCase,
  type CreateChallengeVoteInput,
  type CreateChallengeVoteOutput,
  ChallengeVoteCreationError,
  ChallengeVoteAlreadyExistsError,
  ChallengeVoteRepositoryError,
} from "./interactors/CreateChallengeVote";
export {
  updateChallengeVoteUseCase,
  type UpdateChallengeVoteInput,
  type UpdateChallengeVoteOutput,
  ChallengeVoteNotFoundError,
  ChallengeVoteValidationError,
  ChallengeVoteUpdateRepositoryError,
} from "./interactors/UpdateChallengeVote";
export {
  deleteChallengeVoteUseCase,
  type DeleteChallengeVoteInput,
  type DeleteChallengeVoteOutput,
  ChallengeVoteNotFoundError as DeleteChallengeVoteNotFoundError,
  ChallengeVoteDeleteRepositoryError,
} from "./interactors/DeleteChallengeVote";
export {
  getChallengeVoteByIdUseCase,
  type GetChallengeVoteByIdInput,
  type GetChallengeVoteByIdOutput,
  ChallengeVoteNotFoundError as GetChallengeVoteNotFoundError,
  ChallengeVoteGetRepositoryError,
} from "./interactors/GetChallengeVoteById";

// Submission Report Use Cases
export {
  createReportUseCase,
  type CreateReportInput,
  type CreateReportOutput,
} from "./interactors/CreateReport";
export {
  getReportsUseCase,
  type GetReportsInput,
  type GetReportsOutput,
  type ReporterOutput,
  type ReportOutput,
} from "./interactors/GetReports";

// Sponsor Use Cases
export {
  createSponsorUseCase,
  type CreateSponsorInput,
  type CreateSponsorOutput,
  CreateSponsorValidationError,
} from "./interactors/CreateSponsor";
export {
  getSponsorUseCase,
  type GetSponsorInput,
  type GetSponsorOutput,
  GetSponsorNotFoundError,
} from "./interactors/GetSponsor";
export {
  updateSponsorUseCase,
  type UpdateSponsorInput,
  type UpdateSponsorOutput,
  UpdateSponsorNotFoundError,
  UpdateSponsorValidationError,
} from "./interactors/UpdateSponsor";
export {
  deleteSponsorUseCase,
  type DeleteSponsorInput,
  type DeleteSponsorOutput,
  DeleteSponsorNotFoundError,
} from "./interactors/DeleteSponsor";
export {
  listSponsorsUseCase,
  type ListSponsorsInput,
  type ListSponsorsOutput,
  type SponsorListItem,
} from "./interactors/ListSponsors";
export {
  linkSponsorToTripUseCase,
  type LinkSponsorToTripInput,
  type LinkSponsorToTripOutput,
  LinkSponsorNotFoundError,
  SponsorAlreadyLinkedError,
  LinkSponsorRepositoryError,
} from "./interactors/LinkSponsorToTrip";
export {
  unlinkSponsorFromTripUseCase,
  type UnlinkSponsorFromTripInput,
  type UnlinkSponsorFromTripOutput,
  UnlinkSponsorRepositoryError,
} from "./interactors/UnlinkSponsorFromTrip";

// Notification Schedule Use Cases
export {
  getNotificationSchedulesUseCase,
  type GetNotificationSchedulesInput,
  type GetNotificationSchedulesOutput,
  type NotificationScheduleOutput,
} from "./interactors/GetNotificationSchedules";
export {
  getNotificationScheduleByIdUseCase,
  type GetNotificationScheduleByIdInput,
  type GetNotificationScheduleByIdOutput,
  GetScheduleNotFoundError,
} from "./interactors/GetNotificationScheduleById";
export {
  createNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
  type CreateNotificationScheduleOutput,
  DuplicateScheduleNameError,
  ScheduleValidationError,
} from "./interactors/CreateNotificationSchedule";
export {
  updateNotificationScheduleUseCase,
  type UpdateNotificationScheduleInput,
  type UpdateNotificationScheduleOutput,
  UpdateScheduleNotFoundError,
  UpdateScheduleValidationError,
} from "./interactors/UpdateNotificationSchedule";
export {
  deleteNotificationScheduleUseCase,
  type DeleteNotificationScheduleInput,
  type DeleteNotificationScheduleOutput,
  DeleteScheduleNotFoundError,
} from "./interactors/DeleteNotificationSchedule";
export {
  getActiveNotificationSchedulesUseCase,
  type GetActiveNotificationSchedulesInput,
  type GetActiveNotificationSchedulesOutput,
} from "./interactors/GetActiveNotificationSchedules";
export {
  getUpcomingNotificationSchedulesUseCase,
  type GetUpcomingNotificationSchedulesInput,
  type GetUpcomingNotificationSchedulesOutput,
} from "./interactors/GetUpcomingNotificationSchedules";
export {
  updateNotificationScheduleLastRunUseCase,
  type UpdateNotificationScheduleLastRunInput,
  type UpdateNotificationScheduleLastRunOutput,
  UpdateLastRunNotFoundError,
} from "./interactors/UpdateNotificationScheduleLastRun";
export {
  toggleNotificationScheduleActiveUseCase,
  type ToggleNotificationScheduleActiveInput,
  type ToggleNotificationScheduleActiveOutput,
  ToggleScheduleNotFoundError,
} from "./interactors/ToggleNotificationScheduleActive";
export {
  bulkToggleNotificationScheduleActiveUseCase,
  type BulkToggleNotificationScheduleActiveInput,
  type BulkToggleNotificationScheduleActiveOutput,
  BulkToggleValidationError,
} from "./interactors/BulkToggleNotificationScheduleActive";
export {
  bulkDeleteNotificationSchedulesUseCase,
  type BulkDeleteNotificationSchedulesInput,
  type BulkDeleteNotificationSchedulesOutput,
  BulkDeleteValidationError,
} from "./interactors/BulkDeleteNotificationSchedules";
export {
  duplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
  type DuplicateNotificationScheduleOutput,
  DuplicateScheduleNotFoundError,
  DuplicateScheduleError,
} from "./interactors/DuplicateNotificationSchedule";
export {
  getNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
  type GetNotificationScheduleExecutionHistoryOutput,
  type ExecutionHistoryItem,
  ScheduleNotFoundError as ExecutionHistoryScheduleNotFoundError,
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
  authorizeAdminUseCase,
  type AuthorizeAdminInput,
  type AuthorizeAdminOutput,
} from "./interactors/AuthorizeAdmin";
export {
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  type AuthorizeModeratorOutput,
} from "./interactors/AuthorizeModerator";

// Telemetry Use Case
export {
  logTelemetryUseCase,
  type LogTelemetryInput,
  type LogTelemetryOutput,
} from "./interactors/LogTelemetry";

// Trip CRUD Use Cases (Effect-based)
export {
  createTripUseCase,
  type CreateTripInput,
  type CreateTripOutput,
  TripCreationError,
} from "./interactors/CreateTrip";
export {
  updateTripUseCase,
  type UpdateTripInput,
  type UpdateTripOutput,
  UpdateTripNotFoundError,
  UpdateTripValidationError,
  UpdateTripStateError,
} from "./interactors/UpdateTrip";
export {
  getTripByIdUseCase,
  type GetTripByIdInput,
  type GetTripByIdOutput,
  GetTripByIdNotFoundError,
} from "./interactors/GetTripById";
export {
  deleteTripUseCase,
  type DeleteTripInput,
  type DeleteTripOutput,
  DeleteTripNotFoundError,
} from "./interactors/DeleteTrip";
