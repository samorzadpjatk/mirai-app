/**
 * @mirai-app/use-cases - Use Cases Layer Exports
 *
 * This package contains application orchestration logic.
 * It depends only on @mirai-app/domain (innermost layer).
 */

// =============================================================================
// Shared DTO Types (Generic pagination and common types)
// =============================================================================
// These generic types are used across all DTOs for consistent pagination.
// =============================================================================
export type {
  PaginatedResult,
  CursorPaginatedResult,
  PagedResult,
  PaginationOptions,
  CursorPaginationOptions,
  PagedPaginationOptions,
} from "./system/shared/dto";

// =============================================================================
// DTOs (Data Transfer Objects)
// =============================================================================
// DTOs are used by gateways to return data instead of domain entities.
// This ensures the presentation layer doesn't depend on domain internals.
// =============================================================================

// Activity DTOs
export type {
  ActivityFeedDTO,
  ActivityReactionDTO,
  ActivityPaginatedResult,
  ActivityPagedResult,
  ActivityCursorResult,
} from "./activity/dto";

// User DTOs
export type { UserDTO, UserPaginatedResult } from "./user/dto";

// User pagination types
export type { UserCursorData, UserConnectionArgs } from "./user/ports/gateway";

// Trip DTOs
export type {
  TripDTO,
  TripParticipantDTO,
  TripPaginatedResult,
} from "./trip/dto";

// Trip pagination types
export type { TripCursorData, TripConnectionArgs } from "./trip/ports/gateway";

// Event DTOs and Enums
export type {
  EventDTO,
  EventParticipantDTO,
  EventPaginatedResult,
} from "./event/dto";
export { EventType, EventStatus } from "./event/dto";

// Event pagination types
export type {
  EventCursorData,
  EventConnectionArgs,
} from "./event/ports/gateway";

// Challenge DTOs
export type {
  ChallengeDTO,
  ChallengeSubmissionDTO,
  ChallengeVoteDTO,
  ChallengePaginatedResult,
  SubmissionPaginatedResult,
  ChallengeSubmissionCreatedAtCursorData,
  ChallengeSubmissionVoteScoreCursorData,
} from "./challenge/dto";

// Group DTOs
export type {
  GroupDTO,
  GroupMemberDTO,
  GroupPaginatedResult,
} from "./group/dto";

// Sponsor DTOs
export type {
  SponsorDTO,
  TripSponsorDTO,
  SponsorPaginatedResult,
} from "./sponsor/dto";

// Reward DTOs
export type {
  RewardDTO,
  RewardPurchaseDTO,
  RewardPaginatedResult,
  PurchasePaginatedResult,
} from "./reward/dto";

// Location DTOs
export type {
  LocationDTO,
  LocationSharingDTO,
  LocationPaginatedResult,
} from "./location/dto";

// Notification DTOs
export type {
  NotificationDTO,
  NotificationDeliveryDTO,
  NotificationScheduleDTO,
  NotificationPaginatedResult,
} from "./notification/dto";

// PushSubscription DTOs
export type {
  PushSubscriptionDTO,
  PushSubscriptionConnection,
} from "./notification/ports/push-subscription/dto";

// Report DTOs
export type { SubmissionReportDTO, ReportPaginatedResult } from "./report/dto";

// =============================================================================
// Ports (Repository and Service Interfaces)
// =============================================================================
// Note: These interfaces are exported for implementation by the adapters layer.
// They may show as "orphan" in dependency-cruiser because the static analyzer
// cannot trace imports through the package barrel. They ARE used by:
// - Interactors within this package (constructor injection)
// - Repository implementations in @mirai-app/adapters
// =============================================================================
// User Domain
export type { UserGateway } from "./user/ports/gateway";
export { UserGatewayTag } from "./user/ports/gateway";

// Trip Domain
export type { TripGateway } from "./trip/ports/gateway";
export { TripGatewayTag } from "./trip/ports/gateway";

// Group Domain
export type { GroupGateway } from "./group/ports/gateway";
export { GroupGatewayTag } from "./group/ports/gateway";

// Challenge Domain
export type {
  ChallengeGateway,
  ChallengeConnectionArgs,
  ChallengeCursorData,
} from "./challenge/ports/gateway";
export { ChallengeGatewayTag } from "./challenge/ports/gateway";
export type {
  ChallengeSubmissionGateway,
  ChallengeSubmissionCreatedAtConnectionArgs,
  ChallengeSubmissionVoteScoreConnectionArgs,
} from "./challenge/ports/submission/gateway";
export { ChallengeSubmissionGatewayTag } from "./challenge/ports/submission/gateway";
export type {
  ChallengeVoteGateway,
  ChallengeVoteConnectionArgs,
  ChallengeVoteCursorData,
} from "./challenge/ports/vote/gateway";
export { ChallengeVoteGatewayTag } from "./challenge/ports/vote/gateway";

// Location Domain
export type {
  LocationGateway,
  LocationConnectionArgs,
  LocationCursorData,
} from "./location/ports/gateway";
export { LocationGatewayTag } from "./location/ports/gateway";

// Activity Feed Domain
export type { ActivityFeedGateway } from "./activity/ports/gateway";
export { ActivityFeedGatewayTag } from "./activity/ports/gateway";

// Sponsor Domain
export type {
  SponsorGateway,
  SponsorConnectionArgs,
  SponsorCursorData,
} from "./sponsor/ports/gateway";
export { SponsorGatewayTag } from "./sponsor/ports/gateway";

// Event Domain
export type { EventGateway } from "./event/ports/gateway";
export { EventGatewayTag } from "./event/ports/gateway";

// Submission Report Domain
export type {
  SubmissionReportGateway,
  SubmissionReportCursorData,
  SubmissionReportConnectionArgs,
} from "./report/ports/gateway";
export { SubmissionReportGatewayTag } from "./report/ports/gateway";

// Notification Domain
export type { NotificationGateway } from "./notification/ports/gateway";
export { NotificationGatewayTag } from "./notification/ports/gateway";
export type { NotificationDeliveryGateway } from "./notification/ports/delivery/gateway";
export { NotificationDeliveryGatewayTag } from "./notification/ports/delivery/gateway";
export type { NotificationScheduleGateway } from "./notification/ports/schedule/gateway";
export { NotificationScheduleGatewayTag } from "./notification/ports/schedule/gateway";
export type { NotificationSenderGateway } from "./notification/ports/sender/gateway";
export { NotificationSenderGatewayTag } from "./notification/ports/sender/gateway";

// PushSubscription (NotificationPreference) Domain
export type { PushSubscriptionGateway } from "./notification/ports/push-subscription/gateway";
export { PushSubscriptionGatewayTag } from "./notification/ports/push-subscription/gateway";

// Coin Transaction Domain
export type { CoinTransactionGateway } from "./coin/ports/gateway";
export { CoinTransactionGatewayTag } from "./coin/ports/gateway";

// Reward Domain
export type {
  RewardGateway,
  RewardPurchaseGateway,
  RewardCursorData,
  RewardConnectionArgs,
  RewardPurchaseCursorData,
  RewardPurchaseConnectionArgs,
} from "./reward/ports/gateway";
export {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
  TripPointsCalculatorTag,
} from "./reward/ports/gateway";
export type { TripPointsCalculator } from "./reward/ports/gateway";
export type {
  CoinTransactionGateway,
  CoinTransaction,
  CoinTransactionFilters,
  MostActiveAdminStat,
  CoinStatistics,
  CoinTransactionCursorData,
  CoinTransactionConnectionArgs,
} from "./coin/ports/gateway";
export type {
  DeliveryFilters,
  DeliveryStats,
  DeliveryStatus,
  PaginationOptions as DeliveryPaginationOptions,
} from "./notification/ports/delivery/gateway";
export type {
  NotificationScheduleGateway,
  NotificationScheduleExecutionRecord,
} from "./notification/ports/schedule/gateway";

// =============================================================================
// Auth & Telemetry Ports (for DDD architecture)
// =============================================================================
export type { AuthPort } from "./auth/ports/port";
export {
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
  AuthPortTag,
} from "./auth/ports/port";
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
} from "./system/shared/realtime/port";
export {
  RealtimePortTag,
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "./system/shared/realtime/port";

// PubSubService exports (GraphQL Subscriptions Migration)
export type {
  PubSubService,
  SubscriptionHandle,
  PubSubError,
  SubscriptionFailedError,
  PublishFailedError,
} from "./system/shared/pubsub/service";
export { PubSubServiceTag } from "./system/shared/pubsub/service";

// StoragePort exports
export { StoragePortTag } from "./system/shared/storage/port";
export type {
  StoragePort,
  FileMetadata,
  UploadOptions,
  SignedUrlInfo,
  DownloadResult,
} from "./system/shared/storage/port";
export {
  StorageError,
  FileNotFoundError,
  UploadError,
  BucketNotFoundError,
  DownloadError,
  DeleteError,
} from "./system/shared/storage/port";

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
} from "./system/errors";

// =============================================================================
// Coordinating Interactors
// =============================================================================
// Note: The concrete implementations (DrizzleGroupCoinsService, DrizzleTripAccessChecker,
// DrizzleTripPointsCalculator, DrizzleRankingActivityService) have been moved to
// @mirai-app/adapters layer to comply with Clean Architecture.
// The port interfaces remain here for dependency injection.
// =============================================================================

// Re-export RankSnapshot type for ranking activities
export type { RankSnapshot } from "./ranking/ports/gateway";
export type { GroupLeaderCheckResult } from "./trip/ports/gateway";
// Notification Sender Use Cases
export {
  trackDeliveryStartUseCase,
  type TrackDeliveryStartInput,
  type TrackDeliveryStartOutput,
  TrackDeliveryStartError,
} from "./notification/interactors/sender/track-start";
export {
  trackDeliveryCompleteUseCase,
  type TrackDeliveryCompleteInput,
  type TrackDeliveryCompleteOutput,
  TrackDeliveryCompleteError,
} from "./notification/interactors/sender/track-complete";
export {
  trackDeliveryFailureUseCase,
  type TrackDeliveryFailureInput,
  type TrackDeliveryFailureOutput,
  TrackDeliveryFailureError,
} from "./notification/interactors/sender/track-failure";
export { UseCaseError as UseCaseOrchestrationError } from "./system/errors";

// User Use Cases (Effect-based)
export {
  createUserUseCase,
  type CreateUserInput,
  type CreateUserOutput,
  UserAlreadyExistsError,
  UserCreationError,
} from "./user/interactors/create";
export {
  updateUserUseCase,
  type UpdateUserInput,
  type UpdateUserOutput,
  UserNotFoundError,
  UserUpdateError,
} from "./user/interactors/update";
export {
  GetUserUseCase,
  type GetUserInput,
  type GetUserOutput,
  GetUserNotFoundError,
} from "./user/interactors/get";
export {
  deleteUserUseCase,
  type DeleteUserInput,
  type DeleteUserOutput,
  DeleteUserNotFoundError,
  DeleteUserError,
} from "./user/interactors/delete";
export {
  authenticateUserUseCase,
  type AuthenticateUserInput,
  type AuthenticateUserOutput,
} from "./user/interactors/authenticate";

export {
  getChallengeUseCase,
  type GetChallengeInput,
  type GetChallengeOutput,
  ChallengeNotFoundError,
  ChallengeLoadError,
} from "./challenge/interactors/get";
export {
  createChallengeUseCase,
  type CreateChallengeInput,
  type CreateChallengeOutput,
  ChallengeCreationError,
  ChallengeRepositoryError,
} from "./challenge/interactors/create";
export {
  updateChallengeUseCase,
  type UpdateChallengeInput,
  type UpdateChallengeOutput,
  ChallengeNotFoundError as UpdateChallengeNotFoundError,
  ChallengeUpdateValidationError,
  ChallengeTerminalStateError,
  ChallengeUpdateRepositoryError,
} from "./challenge/interactors/update";
export {
  updateChallengeStatusUseCase,
  type UpdateChallengeStatusInput,
  type UpdateChallengeStatusOutput,
  ChallengeNotFoundError as UpdateChallengeStatusNotFoundError,
  InvalidStatusTransitionError,
  ChallengeUpdateError,
} from "./challenge/interactors/update-status";
export {
  deleteChallengeUseCase,
  type DeleteChallengeInput,
  type DeleteChallengeOutput,
  ChallengeNotFoundError as DeleteChallengeNotFoundError,
  ChallengeAlreadyActiveError,
  ChallengeDeleteRepositoryError,
} from "./challenge/interactors/delete";

// Group Domain Use Cases (Effect-based)
export {
  getGroupUseCase,
  type GetGroupInput,
  type GetGroupOutput,
  GetGroupNotFoundError,
} from "./group/interactors/get";
export {
  createGroupUseCase,
  type CreateGroupInput,
  type CreateGroupOutput,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
} from "./group/interactors/create";
export {
  updateGroupUseCase,
  type UpdateGroupInput,
  type UpdateGroupOutput,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
} from "./group/interactors/update";
export {
  deleteGroupUseCase,
  type DeleteGroupInput,
  type DeleteGroupOutput,
  DeleteGroupNotFoundError,
  DeleteGroupError,
} from "./group/interactors/delete";

export {
  assignUserToGroupUseCase,
  type AssignUserToGroupInput,
  type AssignUserToGroupOutput,
  GroupNotFoundError,
  AssignUserToGroupUserNotFoundError,
  ParticipantNotFoundError,
  type AssignUserToGroupError,
} from "./group/interactors/assign-user";

export {
  removeUserFromGroupUseCase,
  type RemoveUserFromGroupInput,
  type RemoveUserFromGroupOutput,
  NotGroupMemberError,
  type RemoveUserFromGroupError,
} from "./group/interactors/remove-user";

export {
  getNotificationUseCase,
  type GetNotificationInput,
  type GetNotificationOutput,
  NotificationNotFoundError,
} from "./notification/interactors/get";

export {
  createNotificationUseCase,
  type CreateNotificationInput,
  type CreateNotificationOutput,
  NotificationCreationError,
  NotificationRepositoryError as CreateNotificationRepositoryError,
} from "./notification/interactors/create";

export {
  updateNotificationUseCase,
  type UpdateNotificationInput,
  type UpdateNotificationOutput,
  NotificationNotFoundError as UpdateNotificationNotFoundError,
  NotificationUpdateError,
  NotificationValidationError as UpdateNotificationValidationError,
  NotificationStateError as UpdateNotificationStateError,
} from "./notification/interactors/update";

export {
  deleteNotificationUseCase,
  type DeleteNotificationInput,
  type DeleteNotificationOutput,
  NotificationNotFoundError as DeleteNotificationNotFoundError,
  NotificationDeleteError,
  NotificationAlreadySentError,
} from "./notification/interactors/delete";

export {
  scheduleNotificationUseCase,
  type ScheduleNotificationInput,
  type ScheduleNotificationOutput,
  NotificationNotFoundError as ScheduleNotificationNotFoundError,
  NotificationScheduleError,
  NotificationValidationError as ScheduleNotificationValidationError,
  NotificationStateError as ScheduleNotificationStateError,
} from "./notification/interactors/schedule";

export {
  getActivityFeedUseCase,
  type GetActivityFeedInput,
  type GetActivityFeedOutput,
} from "./activity/interactors/get-feed";

export {
  createActivityUseCase,
  type CreateActivityInput,
  type CreateActivityOutput,
} from "./activity/interactors/create";

export {
  addReactionUseCase,
  type AddReactionInput,
  type AddReactionOutput,
} from "./activity/interactors/add-reaction";

export {
  getActivityByIdUseCase,
  type GetActivityByIdInput,
  type GetActivityByIdOutput,
  ActivityNotFoundError as GetActivityByIdNotFoundError,
  ActivityRepositoryError as GetActivityByIdRepositoryError,
} from "./activity/interactors/get-by-id";

export {
  updateActivityUseCase,
  type UpdateActivityInput,
  type UpdateActivityOutput,
  UpdateActivityNotFoundError,
  UpdateActivityValidationError,
  UpdateActivityRepositoryError,
} from "./activity/interactors/update";

export {
  hideActivityUseCase,
  type HideActivityInput,
  type HideActivityOutput,
  HideActivityNotFoundError,
  HideActivityRepositoryError,
} from "./activity/interactors/hide";

export {
  unhideActivityUseCase,
  type UnhideActivityInput,
  type UnhideActivityOutput,
  UnhideActivityNotFoundError,
  UnhideActivityRepositoryError,
} from "./activity/interactors/unhide";

export {
  deleteActivityUseCase,
  type DeleteActivityInput,
  type DeleteActivityOutput,
  DeleteActivityNotFoundError,
  DeleteActivityRepositoryError,
} from "./activity/interactors/delete";

// Challenge Submission Use Cases (Effect-based)
export {
  createSubmissionUseCase,
  type CreateSubmissionInput,
  type CreateSubmissionOutput,
  SubmissionCreationError,
  DuplicateSubmissionError,
  SubmissionRepositoryError,
} from "./challenge/interactors/submission/create";
export {
  getSubmissionUseCase,
  type GetSubmissionInput,
  type GetSubmissionOutput,
  SubmissionNotFoundError,
  GetSubmissionRepositoryError,
} from "./challenge/interactors/submission/get";
export {
  getSubmissionByChallengeAndGroupUseCase,
  type GetSubmissionByChallengeAndGroupInput,
  type GetSubmissionByChallengeAndGroupOutput,
} from "./challenge/interactors/submission/get-by-challenge-and-group";
export {
  updateSubmissionUseCase,
  type UpdateSubmissionInput,
  type UpdateSubmissionOutput,
  SubmissionUpdateNotFoundError,
  SubmissionUpdateValidationError,
  InvalidReviewActionError,
  UpdateSubmissionRepositoryError,
} from "./challenge/interactors/submission/update";
export {
  deleteSubmissionUseCase,
  type DeleteSubmissionInput,
  type DeleteSubmissionOutput,
  SubmissionDeleteNotFoundError,
  SubmissionDeleteNotAllowedError,
  DeleteSubmissionRepositoryError,
} from "./challenge/interactors/submission/delete";
export {
  listSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
  type ListSubmissionsByChallengeOutput,
  ListSubmissionsRepositoryError,
} from "./challenge/interactors/submission/list-by-challenge";

// Location Use Cases
export {
  getLocationUseCase,
  type GetLocationInput,
  type GetLocationOutput,
  LocationNotFoundError,
} from "./location/interactors/get";
export {
  createLocationUseCase,
  type CreateLocationInput,
  type CreateLocationOutput,
  LocationCreationError,
  LocationUpdateError,
} from "./location/interactors/create";
export {
  updateLocationUseCase,
  type UpdateLocationInput,
  type UpdateLocationOutput,
  LocationCreateError,
  LocationUpdateValidationError,
} from "./location/interactors/update";
export {
  listLocationsUseCase,
  type ListLocationsInput,
  type ListLocationsOutput,
  type LocationOutput,
} from "./location/interactors/list";
export {
  updateSharingSettingsUseCase,
  type UpdateSharingSettingsInput,
  type UpdateSharingSettingsOutput,
  UpdateSharingSettingsValidationError,
  UpdateSharingSettingsRepositoryError,
} from "./location/interactors/sharing/update-settings";
export {
  addSharingUserUseCase,
  type AddSharingUserInput,
  type AddSharingUserOutput,
  CannotShareWithSelfError,
  AddSharingUserValidationError,
  AddSharingUserRepositoryError,
} from "./location/interactors/sharing/add-user";
export {
  removeSharingUserUseCase,
  type RemoveSharingUserInput,
  type RemoveSharingUserOutput,
  LocationNotFoundError as RemoveSharingUserLocationNotFoundError,
  RemoveSharingUserRepositoryError,
} from "./location/interactors/sharing/remove-user";
export {
  getSharingSettingsUseCase,
  type GetSharingSettingsInput,
  type GetSharingSettingsOutput,
  GetSharingSettingsRepositoryError,
} from "./location/interactors/sharing/get-settings";

// Notification Delivery Use Cases (Effect-based)
export {
  getDeliveriesUseCase,
  type GetDeliveriesInput,
  type GetDeliveriesOutput,
  GetDeliveriesError,
} from "./notification/interactors/delivery/list";
export {
  getDeliveryByNotificationIdUseCase,
  type GetDeliveryByNotificationIdInput,
  type GetDeliveryByNotificationIdOutput,
  DeliveryNotFoundError,
  GetDeliveryError,
} from "./notification/interactors/delivery/get-by-notification-id";
export {
  getDeliveryStatsUseCase,
  type GetDeliveryStatsInput,
  type GetDeliveryStatsOutput,
  GetDeliveryStatsError,
} from "./notification/interactors/delivery/get-stats";
export {
  getFailedDeliveriesUseCase,
  type GetFailedDeliveriesInput,
  type GetFailedDeliveriesOutput,
  GetFailedDeliveriesError,
} from "./notification/interactors/delivery/get-failed";

// Reward Use Cases (Effect-based)
export {
  getRewardUseCase,
  type GetRewardInput,
  type GetRewardOutput,
  RewardNotFoundError as GetRewardNotFoundError,
  RewardRepositoryError as GetRewardRepositoryError,
} from "./reward/interactors/get";
export {
  createRewardUseCase,
  type CreateRewardInput,
  type CreateRewardOutput,
  CreateRewardError,
  RewardRepositoryError as CreateRewardRepositoryError,
} from "./reward/interactors/create";
export {
  updateRewardUseCase,
  type UpdateRewardInput,
  type UpdateRewardOutput,
  RewardNotFoundError as UpdateRewardNotFoundError,
  UpdateRewardError,
  RewardRepositoryError as UpdateRewardRepositoryError,
} from "./reward/interactors/update";
export {
  setRewardHiddenUseCase,
  type SetRewardHiddenInput,
  type SetRewardHiddenOutput,
  RewardNotFoundError as SetRewardHiddenNotFoundError,
  SetRewardHiddenRepositoryError,
} from "./reward/interactors/set-hidden";
export {
  deleteRewardUseCase,
  type DeleteRewardInput,
  type DeleteRewardOutput,
  RewardNotFoundError as DeleteRewardNotFoundError,
  RewardHasPurchasesError,
} from "./reward/interactors/delete";
export {
  listRewardsUseCase,
  type ListRewardsInput,
  type ListRewardsOutput,
  type RewardWithCalculations,
  ListRewardsError,
  RewardRepositoryError as ListRewardRepositoryError,
  TripPointsCalculatorError as ListRewardsTripPointsCalculatorError,
} from "./reward/interactors/list";
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
} from "./reward/interactors/purchase";
export {
  updatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
  type UpdatePurchaseStatusOutput,
  PurchaseNotFoundError,
  NotAuthorizedError,
  InvalidPurchaseStatusTransitionError,
  UpdatePurchaseValidationError,
  UpdatePurchaseOperationError,
} from "./purchase/interactors/update-status";
export {
  updateMyPurchaseStatusUseCase,
  type UpdateMyPurchaseStatusInput,
  type UpdateMyPurchaseStatusOutput,
  MyPurchaseNotFoundError,
  NotGroupLeaderError as UpdateMyPurchaseNotGroupLeaderError,
  InvalidUserStatusTransitionError,
  InvalidCancellationError,
  UpdateMyPurchaseOperationError,
} from "./purchase/interactors/update-my-status";
export {
  getPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
  type GetPurchaseHistoryOutput,
  type PurchaseWithDetails,
  NoGroupAccessError,
  PurchaseRepositoryError,
  type GetPurchaseHistoryError,
} from "./purchase/interactors/get-history";

// Coin Transaction Use Cases
export {
  getCoinStatisticsUseCase,
  type GetCoinStatisticsInput,
  type GetCoinStatisticsOutput,
} from "./coin/interactors/get-statistics";
export {
  getMostActiveAdminStatsUseCase,
  type GetMostActiveAdminStatsInput,
  type GetMostActiveAdminStatsOutput,
  CoinTransactionRepositoryError,
  type GetMostActiveAdminStatsError,
} from "./coin/interactors/get-most-active-admin-stats";
export {
  getCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
  type GetCoinTransactionsOutput,
} from "./coin/interactors/get-transactions";
export {
  getCoinTransactionsConnectionUseCase,
  type GetCoinTransactionsConnectionInput,
  type GetCoinTransactionsConnectionOutput,
  GetTransactionsConnectionError,
} from "./coin/interactors/get-transactions-connection";
export {
  getCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
  type GetCoinQuickStatsOutput,
} from "./coin/interactors/get-quick-stats";
export {
  getCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
  type GetCoinAdditionalInsightsOutput,
  type FormattedUser,
} from "./coin/interactors/get-additional-insights";
export {
  addCoinsUseCase,
  type AddCoinsInput,
  type AddCoinsOutput,
} from "./coin/interactors/add";
export {
  removeCoinsUseCase,
  type RemoveCoinsInput,
  type RemoveCoinsOutput,
} from "./coin/interactors/remove";

// Challenge Vote Use Cases (Effect-based)
export {
  submitVoteUseCase,
  type SubmitVoteInput,
  type SubmitVoteOutput,
  SubmitVoteValidationError,
  VotePositionTakenError,
  AlreadyVotedError,
  VoteRepositoryError,
} from "./challenge/interactors/vote/submit";
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
} from "./challenge/interactors/vote/submit-batch";
export {
  getMyVotesUseCase,
  type GetMyVotesInput,
  type GetMyVotesOutput,
  type VoteDTO,
  GetMyVotesValidationError,
  GetMyVotesRepositoryError,
} from "./challenge/interactors/vote/get-my";
export {
  getVotesByChallengeUseCase,
  type GetVotesByChallengeInput,
  type GetVotesByChallengeOutput,
  type ChallengeVoteDTO,
  GetVotesByChallengeValidationError,
  GetVotesByChallengeRepositoryError,
} from "./challenge/interactors/vote/get-by-challenge";
export {
  getChallengeVotingProgressUseCase,
  type GetChallengeVotingProgressInput,
  type GetChallengeVotingProgressOutput,
  type SubmissionVoteCount,
  GetVotingProgressValidationError,
  GetVotingProgressRepositoryError,
} from "./challenge/interactors/voting-progress";
export {
  getJudgedStaffVotingProgressUseCase,
  type GetJudgedStaffVotingProgressInput,
  type GetJudgedStaffVotingProgressOutput,
  type AdminVotingInfo,
  GetVotingProgressValidationError as GetJudgedStaffVotingProgressValidationError,
  GetVotingProgressRepositoryError as GetJudgedStaffVotingProgressRepositoryError,
} from "./challenge/interactors/vote/get-judged-progress";
export {
  forceEndVotingUseCase,
  type ForceEndVotingInput,
  type ForceEndVotingOutput,
  ForceEndChallengeNotFoundError,
  ForceEndValidationError,
  ChallengeWrongTripError,
  ForceEndOperationError,
} from "./challenge/interactors/force-end-voting";

// Individual Challenge Vote Operations (Effect-based)
export {
  createChallengeVoteUseCase,
  type CreateChallengeVoteInput,
  type CreateChallengeVoteOutput,
  ChallengeVoteCreationError,
  ChallengeVoteAlreadyExistsError,
  ChallengeVoteRepositoryError,
} from "./challenge/interactors/vote/create";
export {
  updateChallengeVoteUseCase,
  type UpdateChallengeVoteInput,
  type UpdateChallengeVoteOutput,
  ChallengeVoteNotFoundError,
  ChallengeVoteValidationError,
  ChallengeVoteUpdateRepositoryError,
} from "./challenge/interactors/vote/update";
export {
  deleteChallengeVoteUseCase,
  type DeleteChallengeVoteInput,
  type DeleteChallengeVoteOutput,
  ChallengeVoteNotFoundError as DeleteChallengeVoteNotFoundError,
  ChallengeVoteDeleteRepositoryError,
} from "./challenge/interactors/vote/delete";
export {
  getChallengeVoteByIdUseCase,
  type GetChallengeVoteByIdInput,
  type GetChallengeVoteByIdOutput,
  ChallengeVoteNotFoundError as GetChallengeVoteNotFoundError,
  ChallengeVoteGetRepositoryError,
} from "./challenge/interactors/vote/get-by-id";

// Submission Report Use Cases
export {
  createReportUseCase,
  type CreateReportInput,
  type CreateReportOutput,
} from "./report/interactors/create";
export {
  getReportsUseCase,
  type GetReportsInput,
  type GetReportsOutput,
  type ReporterOutput,
  type ReportOutput,
} from "./report/interactors/list";

// Sponsor Use Cases
export {
  createSponsorUseCase,
  type CreateSponsorInput,
  type CreateSponsorOutput,
  CreateSponsorValidationError,
} from "./sponsor/interactors/create";
export {
  getSponsorUseCase,
  type GetSponsorInput,
  type GetSponsorOutput,
  GetSponsorNotFoundError,
} from "./sponsor/interactors/get";
export {
  updateSponsorUseCase,
  type UpdateSponsorInput,
  type UpdateSponsorOutput,
  UpdateSponsorNotFoundError,
  UpdateSponsorValidationError,
} from "./sponsor/interactors/update";
export {
  deleteSponsorUseCase,
  type DeleteSponsorInput,
  type DeleteSponsorOutput,
  DeleteSponsorNotFoundError,
} from "./sponsor/interactors/delete";
export {
  listSponsorsUseCase,
  type ListSponsorsInput,
  type ListSponsorsOutput,
  type SponsorListItem,
} from "./sponsor/interactors/list";
export {
  linkSponsorToTripUseCase,
  type LinkSponsorToTripInput,
  type LinkSponsorToTripOutput,
  LinkSponsorNotFoundError,
  SponsorAlreadyLinkedError,
  LinkSponsorRepositoryError,
} from "./sponsor/interactors/link-to-trip";
export {
  unlinkSponsorFromTripUseCase,
  type UnlinkSponsorFromTripInput,
  type UnlinkSponsorFromTripOutput,
  UnlinkSponsorRepositoryError,
} from "./sponsor/interactors/unlink-from-trip";

// Notification Schedule Use Cases
export {
  getNotificationSchedulesUseCase,
  type GetNotificationSchedulesInput,
  type GetNotificationSchedulesOutput,
  type NotificationScheduleOutput,
} from "./notification/interactors/schedule/list";
export {
  getNotificationScheduleByIdUseCase,
  type GetNotificationScheduleByIdInput,
  type GetNotificationScheduleByIdOutput,
  GetScheduleNotFoundError,
} from "./notification/interactors/schedule/get-by-id";
export {
  createNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
  type CreateNotificationScheduleOutput,
  DuplicateScheduleNameError,
  ScheduleValidationError,
} from "./notification/interactors/schedule/create";
export {
  updateNotificationScheduleUseCase,
  type UpdateNotificationScheduleInput,
  type UpdateNotificationScheduleOutput,
  UpdateScheduleNotFoundError,
  UpdateScheduleValidationError,
} from "./notification/interactors/schedule/update";
export {
  deleteNotificationScheduleUseCase,
  type DeleteNotificationScheduleInput,
  type DeleteNotificationScheduleOutput,
  DeleteScheduleNotFoundError,
} from "./notification/interactors/schedule/delete";
export {
  getActiveNotificationSchedulesUseCase,
  type GetActiveNotificationSchedulesInput,
  type GetActiveNotificationSchedulesOutput,
} from "./notification/interactors/schedule/get-active";
export {
  getUpcomingNotificationSchedulesUseCase,
  type GetUpcomingNotificationSchedulesInput,
  type GetUpcomingNotificationSchedulesOutput,
} from "./notification/interactors/schedule/get-upcoming";
export {
  updateNotificationScheduleLastRunUseCase,
  type UpdateNotificationScheduleLastRunInput,
  type UpdateNotificationScheduleLastRunOutput,
  UpdateLastRunNotFoundError,
} from "./notification/interactors/schedule/update-last-run";
export {
  toggleNotificationScheduleActiveUseCase,
  type ToggleNotificationScheduleActiveInput,
  type ToggleNotificationScheduleActiveOutput,
  ToggleScheduleNotFoundError,
} from "./notification/interactors/schedule/toggle-active";
export {
  bulkToggleNotificationScheduleActiveUseCase,
  type BulkToggleNotificationScheduleActiveInput,
  type BulkToggleNotificationScheduleActiveOutput,
  BulkToggleValidationError,
} from "./notification/interactors/schedule/bulk-toggle-active";
export {
  bulkDeleteNotificationSchedulesUseCase,
  type BulkDeleteNotificationSchedulesInput,
  type BulkDeleteNotificationSchedulesOutput,
  BulkDeleteValidationError,
} from "./notification/interactors/schedule/bulk-delete";
export {
  duplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
  type DuplicateNotificationScheduleOutput,
  DuplicateScheduleNotFoundError,
  DuplicateScheduleError,
} from "./notification/interactors/schedule/duplicate";
export {
  getNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
  type GetNotificationScheduleExecutionHistoryOutput,
  type ExecutionHistoryItem,
  ScheduleNotFoundError as ExecutionHistoryScheduleNotFoundError,
} from "./notification/interactors/schedule/get-execution-history";

// Utilities
export { wrapError, CommonErrors } from "./system/utils/error-helpers";
export {
  getPaginationDefaults,
  calculateHasMore,
  createPaginationMeta,
  DEFAULT_PAGINATION,
} from "./system/utils/pagination";

// =============================================================================
// Context Tags (Effect Dependency Injection)
// =============================================================================
export * from "./system/context/tags";

// =============================================================================
// DTO Tags (Effect Dependency Injection for DTO Services)
// =============================================================================
// These tags enable dependency injection of DTO transformation services.
// Use them to access DTO mappers in Effect programs:
//   const userDTOService = yield* UserDTOTag;
// =============================================================================
export {
  // DTO Service Interfaces
  type UserDTOService,
  type ActivityFeedDTOService,
  type ChallengeDTOService,
  type EventDTOService,
  type GroupDTOService,
  type LocationDTOService,
  type NotificationDTOService,
  type RewardDTOService,
  type SponsorDTOService,
  type TripDTOService,
  type SubmissionReportDTOService,
  // DTO Service Context.Tags
  UserDTOTag,
  ActivityFeedDTOTag,
  ChallengeDTOTag,
  EventDTOTag,
  GroupDTOTag,
  LocationDTOTag,
  NotificationDTOTag,
  RewardDTOTag,
  SponsorDTOTag,
  TripDTOTag,
  SubmissionReportDTOTag,
} from "./system/di/dto-tags";

// Re-export domain enums needed by adapters layer
export { UserRole } from "@mirai-app/domain";

// Authorization Use Cases
export {
  authorizeAdminUseCase,
  type AuthorizeAdminInput,
  type AuthorizeAdminOutput,
} from "./auth/interactors/authorize-admin";
export {
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  type AuthorizeModeratorOutput,
} from "./auth/interactors/authorize-moderator";

// Telemetry Use Case
export {
  logTelemetryUseCase,
  type LogTelemetryInput,
  type LogTelemetryOutput,
} from "./telemetry/interactors/log";

// Trip CRUD Use Cases (Effect-based)
export {
  createTripUseCase,
  type CreateTripInput,
  type CreateTripOutput,
  TripCreationError,
} from "./trip/interactors/create";
export {
  updateTripUseCase,
  type UpdateTripInput,
  type UpdateTripOutput,
  UpdateTripNotFoundError,
  UpdateTripValidationError,
  UpdateTripStateError,
} from "./trip/interactors/update";
export {
  getTripByIdUseCase,
  type GetTripByIdInput,
  type GetTripByIdOutput,
  GetTripByIdNotFoundError,
} from "./trip/interactors/get-by-id";
export {
  deleteTripUseCase,
  type DeleteTripInput,
  type DeleteTripOutput,
  DeleteTripNotFoundError,
} from "./trip/interactors/delete";

// Event Use Cases (Effect-based)
export {
  getEventUseCase,
  type GetEventInput,
  type GetEventOutput,
  EventNotFoundError,
  EventRepositoryError,
} from "./event/interactors/get";
export {
  createEventUseCase,
  type CreateEventInput,
  type CreateEventOutput,
  CreateEventValidationError,
  CreateEventRepositoryError,
} from "./event/interactors/create";
export {
  listEventsUseCase,
  type ListEventsInput,
  type ListEventsOutput,
  type EventListItem,
  ListEventsRepositoryError,
} from "./event/interactors/list";
