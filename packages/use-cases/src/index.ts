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
export type {
  AuthPort,
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "./auth/ports/port";
export { AuthPortTag } from "./auth/ports/port";
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
} from "./system/shared/realtime/port";
export { RealtimePortTag } from "./system/shared/realtime/port";

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
  StorageError,
  FileNotFoundError,
  UploadError,
  BucketNotFoundError,
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
// Coordinating Interactors (migrated from adapters layer)
// =============================================================================
export { GroupCoinsInteractor } from "./group/interactors/group-coins";
export {
  TripAccessChecker,
  type GroupLeaderCheckResult,
} from "./trip/interactors/access-checker";
export { TripPointsCalculator } from "./trip/interactors/points-calculator";
export {
  RankingActivityInteractor,
  type RankSnapshot,
} from "./ranking/interactors/ranking-activity";
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
} from "./interactors/user/create";
export {
  updateUserUseCase,
  type UpdateUserInput,
  type UpdateUserOutput,
  UserNotFoundError,
  UserUpdateError,
} from "./interactors/user/update";
export {
  GetUserUseCase,
  type GetUserInput,
  type GetUserOutput,
  GetUserNotFoundError,
} from "./interactors/user/get";
export {
  deleteUserUseCase,
  type DeleteUserInput,
  type DeleteUserOutput,
  DeleteUserNotFoundError,
  DeleteUserError,
} from "./interactors/user/delete";
export {
  authenticateUserUseCase,
  type AuthenticateUserInput,
  type AuthenticateUserOutput,
} from "./interactors/user/authenticate";

export {
  getChallengeUseCase,
  type GetChallengeInput,
  type GetChallengeOutput,
  ChallengeNotFoundError,
  ChallengeLoadError,
} from "./interactors/challenge/get";
export {
  createChallengeUseCase,
  type CreateChallengeInput,
  type CreateChallengeOutput,
  ChallengeCreationError,
  ChallengeRepositoryError,
} from "./interactors/challenge/create";
export {
  updateChallengeUseCase,
  type UpdateChallengeInput,
  type UpdateChallengeOutput,
  ChallengeNotFoundError as UpdateChallengeNotFoundError,
  ChallengeUpdateValidationError,
  ChallengeTerminalStateError,
  ChallengeUpdateRepositoryError,
} from "./interactors/challenge/update";
export {
  updateChallengeStatusUseCase,
  type UpdateChallengeStatusInput,
  type UpdateChallengeStatusOutput,
  ChallengeNotFoundError as UpdateChallengeStatusNotFoundError,
  InvalidStatusTransitionError,
  ChallengeUpdateError,
} from "./interactors/challenge/update-status";

// Group Domain Use Cases (Effect-based)
export {
  getGroupUseCase,
  type GetGroupInput,
  type GetGroupOutput,
  GetGroupNotFoundError,
} from "./interactors/group/get";
export {
  createGroupUseCase,
  type CreateGroupInput,
  type CreateGroupOutput,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
} from "./interactors/group/create";
export {
  updateGroupUseCase,
  type UpdateGroupInput,
  type UpdateGroupOutput,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
} from "./interactors/group/update";
export {
  deleteGroupUseCase,
  type DeleteGroupInput,
  type DeleteGroupOutput,
  DeleteGroupNotFoundError,
  DeleteGroupError,
} from "./interactors/group/delete";

export {
  assignUserToGroupUseCase,
  type AssignUserToGroupInput,
  type AssignUserToGroupOutput,
  GroupNotFoundError,
  AssignUserToGroupUserNotFoundError,
  ParticipantNotFoundError,
  type AssignUserToGroupError,
} from "./interactors/group/assign-user";

export {
  removeUserFromGroupUseCase,
  type RemoveUserFromGroupInput,
  type RemoveUserFromGroupOutput,
  NotGroupMemberError,
  type RemoveUserFromGroupError,
} from "./interactors/group/remove-user";

export {
  getNotificationUseCase,
  type GetNotificationInput,
  type GetNotificationOutput,
  NotificationNotFoundError,
} from "./interactors/notification/get";

export {
  createNotificationUseCase,
  type CreateNotificationInput,
  type CreateNotificationOutput,
  NotificationCreationError,
  NotificationRepositoryError as CreateNotificationRepositoryError,
} from "./interactors/notification/create";

export {
  updateNotificationUseCase,
  type UpdateNotificationInput,
  type UpdateNotificationOutput,
  NotificationNotFoundError as UpdateNotificationNotFoundError,
  NotificationUpdateError,
  NotificationValidationError as UpdateNotificationValidationError,
  NotificationStateError as UpdateNotificationStateError,
} from "./interactors/notification/update";

export {
  deleteNotificationUseCase,
  type DeleteNotificationInput,
  type DeleteNotificationOutput,
  NotificationNotFoundError as DeleteNotificationNotFoundError,
  NotificationDeleteError,
  NotificationAlreadySentError,
} from "./interactors/notification/delete";

export {
  scheduleNotificationUseCase,
  type ScheduleNotificationInput,
  type ScheduleNotificationOutput,
  NotificationNotFoundError as ScheduleNotificationNotFoundError,
  NotificationScheduleError,
  NotificationValidationError as ScheduleNotificationValidationError,
  NotificationStateError as ScheduleNotificationStateError,
} from "./interactors/notification/schedule";

export {
  getActivityFeedUseCase,
  type GetActivityFeedInput,
  type GetActivityFeedOutput,
} from "./interactors/activity/get-feed";

export {
  createActivityUseCase,
  type CreateActivityInput,
  type CreateActivityOutput,
} from "./interactors/activity/create";

export {
  addReactionUseCase,
  type AddReactionInput,
  type AddReactionOutput,
} from "./interactors/activity/add-reaction";

export {
  getActivityByIdUseCase,
  type GetActivityByIdInput,
  type GetActivityByIdOutput,
  ActivityNotFoundError as GetActivityByIdNotFoundError,
  ActivityRepositoryError as GetActivityByIdRepositoryError,
} from "./interactors/activity/get-by-id";

export {
  updateActivityUseCase,
  type UpdateActivityInput,
  type UpdateActivityOutput,
  UpdateActivityNotFoundError,
  UpdateActivityValidationError,
  UpdateActivityRepositoryError,
} from "./interactors/activity/update";

export {
  hideActivityUseCase,
  type HideActivityInput,
  type HideActivityOutput,
  HideActivityNotFoundError,
  HideActivityRepositoryError,
} from "./interactors/activity/hide";

export {
  unhideActivityUseCase,
  type UnhideActivityInput,
  type UnhideActivityOutput,
  UnhideActivityNotFoundError,
  UnhideActivityRepositoryError,
} from "./interactors/activity/unhide";

export {
  deleteActivityUseCase,
  type DeleteActivityInput,
  type DeleteActivityOutput,
  DeleteActivityNotFoundError,
  DeleteActivityRepositoryError,
} from "./interactors/activity/delete";

// Challenge Submission Use Cases (Effect-based)
export {
  createSubmissionUseCase,
  type CreateSubmissionInput,
  type CreateSubmissionOutput,
  SubmissionCreationError,
  DuplicateSubmissionError,
  SubmissionRepositoryError,
} from "./interactors/challenge/submission/create";
export {
  getSubmissionUseCase,
  type GetSubmissionInput,
  type GetSubmissionOutput,
  SubmissionNotFoundError,
  GetSubmissionRepositoryError,
} from "./interactors/challenge/submission/get";
export {
  getSubmissionByChallengeAndGroupUseCase,
  type GetSubmissionByChallengeAndGroupInput,
  type GetSubmissionByChallengeAndGroupOutput,
} from "./interactors/challenge/submission/get-by-challenge-and-group";
export {
  updateSubmissionUseCase,
  type UpdateSubmissionInput,
  type UpdateSubmissionOutput,
  SubmissionUpdateNotFoundError,
  SubmissionUpdateValidationError,
  InvalidReviewActionError,
  UpdateSubmissionRepositoryError,
} from "./interactors/challenge/submission/update";
export {
  deleteSubmissionUseCase,
  type DeleteSubmissionInput,
  type DeleteSubmissionOutput,
  SubmissionDeleteNotFoundError,
  SubmissionDeleteNotAllowedError,
  DeleteSubmissionRepositoryError,
} from "./interactors/challenge/submission/delete";
export {
  listSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
  type ListSubmissionsByChallengeOutput,
  ListSubmissionsRepositoryError,
} from "./interactors/challenge/submission/list-by-challenge";

// Location Use Cases
export {
  getLocationUseCase,
  type GetLocationInput,
  type GetLocationOutput,
  LocationNotFoundError,
} from "./interactors/location/get";
export {
  createLocationUseCase,
  type CreateLocationInput,
  type CreateLocationOutput,
  LocationCreationError,
  LocationUpdateError,
} from "./interactors/location/create";
export {
  updateLocationUseCase,
  type UpdateLocationInput,
  type UpdateLocationOutput,
  LocationCreateError,
  LocationUpdateValidationError,
} from "./interactors/location/update";
export {
  listLocationsUseCase,
  type ListLocationsInput,
  type ListLocationsOutput,
  type LocationOutput,
} from "./interactors/location/list";
export {
  updateSharingSettingsUseCase,
  type UpdateSharingSettingsInput,
  type UpdateSharingSettingsOutput,
  UpdateSharingSettingsValidationError,
  UpdateSharingSettingsRepositoryError,
} from "./interactors/location/sharing/update-settings";
export {
  addSharingUserUseCase,
  type AddSharingUserInput,
  type AddSharingUserOutput,
  CannotShareWithSelfError,
  AddSharingUserValidationError,
  AddSharingUserRepositoryError,
} from "./interactors/location/sharing/add-user";
export {
  removeSharingUserUseCase,
  type RemoveSharingUserInput,
  type RemoveSharingUserOutput,
  LocationNotFoundError as RemoveSharingUserLocationNotFoundError,
  RemoveSharingUserRepositoryError,
} from "./interactors/location/sharing/remove-user";
export {
  getSharingSettingsUseCase,
  type GetSharingSettingsInput,
  type GetSharingSettingsOutput,
  GetSharingSettingsRepositoryError,
} from "./interactors/location/sharing/get-settings";

// Notification Delivery Use Cases (Effect-based)
export {
  getDeliveriesUseCase,
  type GetDeliveriesInput,
  type GetDeliveriesOutput,
  GetDeliveriesError,
} from "./interactors/notification/delivery/list";
export {
  getDeliveryByNotificationIdUseCase,
  type GetDeliveryByNotificationIdInput,
  type GetDeliveryByNotificationIdOutput,
  DeliveryNotFoundError,
  GetDeliveryError,
} from "./interactors/notification/delivery/get-by-notification-id";
export {
  getDeliveryStatsUseCase,
  type GetDeliveryStatsInput,
  type GetDeliveryStatsOutput,
  GetDeliveryStatsError,
} from "./interactors/notification/delivery/get-stats";
export {
  getFailedDeliveriesUseCase,
  type GetFailedDeliveriesInput,
  type GetFailedDeliveriesOutput,
  GetFailedDeliveriesError,
} from "./interactors/notification/delivery/get-failed";

// Reward Use Cases (Effect-based)
export {
  getRewardUseCase,
  type GetRewardInput,
  type GetRewardOutput,
  RewardNotFoundError as GetRewardNotFoundError,
  RewardRepositoryError as GetRewardRepositoryError,
} from "./interactors/reward/get";
export {
  createRewardUseCase,
  type CreateRewardInput,
  type CreateRewardOutput,
  CreateRewardError,
  RewardRepositoryError as CreateRewardRepositoryError,
} from "./interactors/reward/create";
export {
  updateRewardUseCase,
  type UpdateRewardInput,
  type UpdateRewardOutput,
  RewardNotFoundError as UpdateRewardNotFoundError,
  UpdateRewardError,
  RewardRepositoryError as UpdateRewardRepositoryError,
} from "./interactors/reward/update";
export {
  setRewardHiddenUseCase,
  type SetRewardHiddenInput,
  type SetRewardHiddenOutput,
  RewardNotFoundError as SetRewardHiddenNotFoundError,
  SetRewardHiddenRepositoryError,
} from "./interactors/reward/set-hidden";
export {
  deleteRewardUseCase,
  type DeleteRewardInput,
  type DeleteRewardOutput,
  RewardNotFoundError as DeleteRewardNotFoundError,
  RewardHasPurchasesError,
} from "./interactors/reward/delete";
export {
  listRewardsUseCase,
  type ListRewardsInput,
  type ListRewardsOutput,
  type RewardWithCalculations,
  ListRewardsError,
  RewardRepositoryError as ListRewardRepositoryError,
  TripPointsCalculatorError as ListRewardsTripPointsCalculatorError,
} from "./interactors/reward/list";
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
} from "./interactors/reward/purchase";
export {
  updatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
  type UpdatePurchaseStatusOutput,
  PurchaseNotFoundError,
  NotAuthorizedError,
  InvalidPurchaseStatusTransitionError,
  UpdatePurchaseValidationError,
  UpdatePurchaseOperationError,
} from "./interactors/purchase/update-status";
export {
  updateMyPurchaseStatusUseCase,
  type UpdateMyPurchaseStatusInput,
  type UpdateMyPurchaseStatusOutput,
  MyPurchaseNotFoundError,
  NotGroupLeaderError as UpdateMyPurchaseNotGroupLeaderError,
  InvalidUserStatusTransitionError,
  InvalidCancellationError,
  UpdateMyPurchaseOperationError,
} from "./interactors/purchase/update-my-status";
export {
  getPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
  type GetPurchaseHistoryOutput,
  type PurchaseWithDetails,
  NoGroupAccessError,
  PurchaseRepositoryError,
  type GetPurchaseHistoryError,
} from "./interactors/purchase/get-history";

// Coin Transaction Use Cases
export {
  getCoinStatisticsUseCase,
  type GetCoinStatisticsInput,
  type GetCoinStatisticsOutput,
} from "./interactors/coin/get-statistics";
export {
  getMostActiveAdminStatsUseCase,
  type GetMostActiveAdminStatsInput,
  type GetMostActiveAdminStatsOutput,
  CoinTransactionRepositoryError,
  type GetMostActiveAdminStatsError,
} from "./interactors/coin/get-most-active-admin-stats";
export {
  getCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
  type GetCoinTransactionsOutput,
} from "./interactors/coin/get-transactions";
export {
  getCoinTransactionsConnectionUseCase,
  type GetCoinTransactionsConnectionInput,
  type GetCoinTransactionsConnectionOutput,
  GetTransactionsConnectionError,
} from "./interactors/coin/get-transactions-connection";
export {
  getCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
  type GetCoinQuickStatsOutput,
} from "./interactors/coin/get-quick-stats";
export {
  getCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
  type GetCoinAdditionalInsightsOutput,
  type FormattedUser,
} from "./interactors/coin/get-additional-insights";
export {
  addCoinsUseCase,
  type AddCoinsInput,
  type AddCoinsOutput,
} from "./interactors/coin/add";
export {
  removeCoinsUseCase,
  type RemoveCoinsInput,
  type RemoveCoinsOutput,
} from "./interactors/coin/remove";

// Challenge Vote Use Cases (Effect-based)
export {
  submitVoteUseCase,
  type SubmitVoteInput,
  type SubmitVoteOutput,
  SubmitVoteValidationError,
  VotePositionTakenError,
  AlreadyVotedError,
  VoteRepositoryError,
} from "./interactors/challenge/vote/submit";
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
} from "./interactors/challenge/vote/submit-batch";
export {
  getMyVotesUseCase,
  type GetMyVotesInput,
  type GetMyVotesOutput,
  type VoteDTO,
  GetMyVotesValidationError,
  GetMyVotesRepositoryError,
} from "./interactors/challenge/vote/get-my";
export {
  getVotesByChallengeUseCase,
  type GetVotesByChallengeInput,
  type GetVotesByChallengeOutput,
  type ChallengeVoteDTO,
  GetVotesByChallengeValidationError,
  GetVotesByChallengeRepositoryError,
} from "./interactors/challenge/vote/get-by-challenge";
export {
  getChallengeVotingProgressUseCase,
  type GetChallengeVotingProgressInput,
  type GetChallengeVotingProgressOutput,
  type SubmissionVoteCount,
  GetVotingProgressValidationError,
  GetVotingProgressRepositoryError,
} from "./interactors/challenge/voting-progress";
export {
  getJudgedStaffVotingProgressUseCase,
  type GetJudgedStaffVotingProgressInput,
  type GetJudgedStaffVotingProgressOutput,
  type AdminVotingInfo,
  GetVotingProgressValidationError as GetJudgedStaffVotingProgressValidationError,
  GetVotingProgressRepositoryError as GetJudgedStaffVotingProgressRepositoryError,
} from "./interactors/challenge/vote/get-judged-progress";
export {
  forceEndVotingUseCase,
  type ForceEndVotingInput,
  type ForceEndVotingOutput,
  ForceEndChallengeNotFoundError,
  ForceEndValidationError,
  ChallengeWrongTripError,
  ForceEndOperationError,
} from "./interactors/challenge/force-end-voting";

// Individual Challenge Vote Operations (Effect-based)
export {
  createChallengeVoteUseCase,
  type CreateChallengeVoteInput,
  type CreateChallengeVoteOutput,
  ChallengeVoteCreationError,
  ChallengeVoteAlreadyExistsError,
  ChallengeVoteRepositoryError,
} from "./interactors/challenge/vote/create";
export {
  updateChallengeVoteUseCase,
  type UpdateChallengeVoteInput,
  type UpdateChallengeVoteOutput,
  ChallengeVoteNotFoundError,
  ChallengeVoteValidationError,
  ChallengeVoteUpdateRepositoryError,
} from "./interactors/challenge/vote/update";
export {
  deleteChallengeVoteUseCase,
  type DeleteChallengeVoteInput,
  type DeleteChallengeVoteOutput,
  ChallengeVoteNotFoundError as DeleteChallengeVoteNotFoundError,
  ChallengeVoteDeleteRepositoryError,
} from "./interactors/challenge/vote/delete";
export {
  getChallengeVoteByIdUseCase,
  type GetChallengeVoteByIdInput,
  type GetChallengeVoteByIdOutput,
  ChallengeVoteNotFoundError as GetChallengeVoteNotFoundError,
  ChallengeVoteGetRepositoryError,
} from "./interactors/challenge/vote/get-by-id";

// Submission Report Use Cases
export {
  createReportUseCase,
  type CreateReportInput,
  type CreateReportOutput,
} from "./interactors/report/create";
export {
  getReportsUseCase,
  type GetReportsInput,
  type GetReportsOutput,
  type ReporterOutput,
  type ReportOutput,
} from "./interactors/report/list";

// Sponsor Use Cases
export {
  createSponsorUseCase,
  type CreateSponsorInput,
  type CreateSponsorOutput,
  CreateSponsorValidationError,
} from "./interactors/sponsor/create";
export {
  getSponsorUseCase,
  type GetSponsorInput,
  type GetSponsorOutput,
  GetSponsorNotFoundError,
} from "./interactors/sponsor/get";
export {
  updateSponsorUseCase,
  type UpdateSponsorInput,
  type UpdateSponsorOutput,
  UpdateSponsorNotFoundError,
  UpdateSponsorValidationError,
} from "./interactors/sponsor/update";
export {
  deleteSponsorUseCase,
  type DeleteSponsorInput,
  type DeleteSponsorOutput,
  DeleteSponsorNotFoundError,
} from "./interactors/sponsor/delete";
export {
  listSponsorsUseCase,
  type ListSponsorsInput,
  type ListSponsorsOutput,
  type SponsorListItem,
} from "./interactors/sponsor/list";
export {
  linkSponsorToTripUseCase,
  type LinkSponsorToTripInput,
  type LinkSponsorToTripOutput,
  LinkSponsorNotFoundError,
  SponsorAlreadyLinkedError,
  LinkSponsorRepositoryError,
} from "./interactors/sponsor/link-to-trip";
export {
  unlinkSponsorFromTripUseCase,
  type UnlinkSponsorFromTripInput,
  type UnlinkSponsorFromTripOutput,
  UnlinkSponsorRepositoryError,
} from "./interactors/sponsor/unlink-from-trip";

// Notification Schedule Use Cases
export {
  getNotificationSchedulesUseCase,
  type GetNotificationSchedulesInput,
  type GetNotificationSchedulesOutput,
  type NotificationScheduleOutput,
} from "./interactors/notification/schedule/list";
export {
  getNotificationScheduleByIdUseCase,
  type GetNotificationScheduleByIdInput,
  type GetNotificationScheduleByIdOutput,
  GetScheduleNotFoundError,
} from "./interactors/notification/schedule/get-by-id";
export {
  createNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
  type CreateNotificationScheduleOutput,
  DuplicateScheduleNameError,
  ScheduleValidationError,
} from "./interactors/notification/schedule/create";
export {
  updateNotificationScheduleUseCase,
  type UpdateNotificationScheduleInput,
  type UpdateNotificationScheduleOutput,
  UpdateScheduleNotFoundError,
  UpdateScheduleValidationError,
} from "./interactors/notification/schedule/update";
export {
  deleteNotificationScheduleUseCase,
  type DeleteNotificationScheduleInput,
  type DeleteNotificationScheduleOutput,
  DeleteScheduleNotFoundError,
} from "./interactors/notification/schedule/delete";
export {
  getActiveNotificationSchedulesUseCase,
  type GetActiveNotificationSchedulesInput,
  type GetActiveNotificationSchedulesOutput,
} from "./interactors/notification/schedule/get-active";
export {
  getUpcomingNotificationSchedulesUseCase,
  type GetUpcomingNotificationSchedulesInput,
  type GetUpcomingNotificationSchedulesOutput,
} from "./interactors/notification/schedule/get-upcoming";
export {
  updateNotificationScheduleLastRunUseCase,
  type UpdateNotificationScheduleLastRunInput,
  type UpdateNotificationScheduleLastRunOutput,
  UpdateLastRunNotFoundError,
} from "./interactors/notification/schedule/update-last-run";
export {
  toggleNotificationScheduleActiveUseCase,
  type ToggleNotificationScheduleActiveInput,
  type ToggleNotificationScheduleActiveOutput,
  ToggleScheduleNotFoundError,
} from "./interactors/notification/schedule/toggle-active";
export {
  bulkToggleNotificationScheduleActiveUseCase,
  type BulkToggleNotificationScheduleActiveInput,
  type BulkToggleNotificationScheduleActiveOutput,
  BulkToggleValidationError,
} from "./interactors/notification/schedule/bulk-toggle-active";
export {
  bulkDeleteNotificationSchedulesUseCase,
  type BulkDeleteNotificationSchedulesInput,
  type BulkDeleteNotificationSchedulesOutput,
  BulkDeleteValidationError,
} from "./interactors/notification/schedule/bulk-delete";
export {
  duplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
  type DuplicateNotificationScheduleOutput,
  DuplicateScheduleNotFoundError,
  DuplicateScheduleError,
} from "./interactors/notification/schedule/duplicate";
export {
  getNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
  type GetNotificationScheduleExecutionHistoryOutput,
  type ExecutionHistoryItem,
  ScheduleNotFoundError as ExecutionHistoryScheduleNotFoundError,
} from "./interactors/notification/schedule/get-execution-history";

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
} from "./interactors/auth/authorize-admin";
export {
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  type AuthorizeModeratorOutput,
} from "./interactors/auth/authorize-moderator";

// Telemetry Use Case
export {
  logTelemetryUseCase,
  type LogTelemetryInput,
  type LogTelemetryOutput,
} from "./interactors/telemetry/log";

// Trip CRUD Use Cases (Effect-based)
export {
  createTripUseCase,
  type CreateTripInput,
  type CreateTripOutput,
  TripCreationError,
} from "./interactors/trip/create";
export {
  updateTripUseCase,
  type UpdateTripInput,
  type UpdateTripOutput,
  UpdateTripNotFoundError,
  UpdateTripValidationError,
  UpdateTripStateError,
} from "./interactors/trip/update";
export {
  getTripByIdUseCase,
  type GetTripByIdInput,
  type GetTripByIdOutput,
  GetTripByIdNotFoundError,
} from "./interactors/trip/get-by-id";
export {
  deleteTripUseCase,
  type DeleteTripInput,
  type DeleteTripOutput,
  DeleteTripNotFoundError,
} from "./interactors/trip/delete";

// Event Use Cases (Effect-based)
export {
  getEventUseCase,
  type GetEventInput,
  type GetEventOutput,
  EventNotFoundError,
  EventRepositoryError,
} from "./interactors/event/get";
export {
  createEventUseCase,
  type CreateEventInput,
  type CreateEventOutput,
  CreateEventValidationError,
  CreateEventRepositoryError,
} from "./interactors/event/create";
export {
  listEventsUseCase,
  type ListEventsInput,
  type ListEventsOutput,
  type EventListItem,
  ListEventsRepositoryError,
} from "./interactors/event/list";
