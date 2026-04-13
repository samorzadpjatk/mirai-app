/**
 * Interactors Barrel Export
 *
 * This module re-exports all use case interactors for convenient
 * subpath imports via `@mirai-app/use-cases/interactors`.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   AuthenticateUserUseCase,
 *   AuthorizeAdminUseCase,
 *   logTelemetryUseCase,
 * } from "@mirai-app/use-cases/interactors";
 * ```
 *
 * @module interactors
 */

// =============================================================================
// Auth & Telemetry Use Cases
// =============================================================================
export {
  authenticateUserUseCase,
  type AuthenticateUserInput,
  type AuthenticateUserOutput,
} from "./AuthenticateUser";

export {
  AuthorizeAdminUseCase,
  authorizeAdminUseCase,
  type AuthorizeAdminInput,
  type AuthorizeAdminOutput,
} from "./AuthorizeAdmin";

export {
  AuthorizeModeratorUseCase,
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  type AuthorizeModeratorOutput,
} from "./AuthorizeModerator";

export {
  logTelemetryUseCase,
  type LogTelemetryInput,
  type LogTelemetryOutput,
  LogTelemetryError,
} from "./LogTelemetry";

// =============================================================================
// User Use Cases (Effect-based)
// =============================================================================
export {
  createUserUseCase,
  type CreateUserInput,
  type CreateUserOutput,
  UserAlreadyExistsError,
  UserCreationError,
} from "./CreateUser";

export {
  updateUserUseCase,
  type UpdateUserInput,
  type UpdateUserOutput,
  UserNotFoundError,
  UserUpdateError,
} from "./UpdateUser";

export {
  getUserUseCase,
  type GetUserInput,
  type GetUserOutput,
  GetUserNotFoundError,
} from "./GetUser";

export {
  deleteUserUseCase,
  type DeleteUserInput,
  type DeleteUserOutput,
  DeleteUserNotFoundError,
  DeleteUserError,
} from "./DeleteUser";

// =============================================================================
// Location Use Cases (Effect-based)
// =============================================================================
export {
  createLocationUseCase,
  type CreateLocationInput,
  type CreateLocationOutput,
  LocationCreationError,
  LocationUpdateError,
} from "./CreateLocation";

export {
  updateLocationUseCase,
  type UpdateLocationInput,
  type UpdateLocationOutput,
  LocationCreateError,
  LocationUpdateValidationError,
} from "./UpdateLocation";

export {
  deleteLocationUseCase,
  type DeleteLocationInput,
  type DeleteLocationOutput,
  DeleteLocationNotFoundError,
  DeleteLocationError,
} from "./DeleteLocation";

export {
  shareLocationUseCase,
  type ShareLocationInput,
  type ShareLocationOutput,
  ShareLocationNotFoundError,
  ShareLocationValidationError,
  ShareLocationSelfShareError,
} from "./ShareLocation";

// =============================================================================
// Notification Use Cases (Effect-based)
// =============================================================================
export {
  createNotificationUseCase,
  type CreateNotificationInput,
  type CreateNotificationOutput,
  NotificationCreationError,
  NotificationRepositoryError,
} from "./CreateNotification";

export {
  updateNotificationUseCase,
  type UpdateNotificationInput,
  type UpdateNotificationOutput,
  NotificationNotFoundError as UpdateNotificationNotFoundError,
  NotificationUpdateError,
  NotificationValidationError as UpdateNotificationValidationError,
  NotificationStateError as UpdateNotificationStateError,
} from "./UpdateNotification";

export {
  deleteNotificationUseCase,
  type DeleteNotificationInput,
  type DeleteNotificationOutput,
  NotificationNotFoundError as DeleteNotificationNotFoundError,
  NotificationDeleteError,
  NotificationAlreadySentError,
} from "./DeleteNotification";

export {
  scheduleNotificationUseCase,
  type ScheduleNotificationInput,
  type ScheduleNotificationOutput,
  NotificationNotFoundError as ScheduleNotificationNotFoundError,
  NotificationScheduleError,
  NotificationValidationError as ScheduleNotificationValidationError,
  NotificationStateError as ScheduleNotificationStateError,
} from "./ScheduleNotification";

// =============================================================================
// Notification Schedule Use Cases
// =============================================================================
// Group Use Cases (Effect-based)
// =============================================================================
export {
  createGroupUseCase,
  type CreateGroupInput,
  type CreateGroupOutput,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
} from "./CreateGroup";

export {
  updateGroupUseCase,
  type UpdateGroupInput,
  type UpdateGroupOutput,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
} from "./UpdateGroup";

export {
  getGroupUseCase,
  type GetGroupInput,
  type GetGroupOutput,
  GetGroupNotFoundError,
} from "./GetGroup";

export {
  deleteGroupUseCase,
  type DeleteGroupInput,
  type DeleteGroupOutput,
  DeleteGroupNotFoundError,
  DeleteGroupError,
} from "./DeleteGroup";

// =============================================================================
// Sponsor Use Cases (Effect-based)
// =============================================================================
export {
  createSponsorUseCase,
  type CreateSponsorInput,
  type CreateSponsorOutput,
  CreateSponsorValidationError,
} from "./CreateSponsor";

export {
  updateSponsorUseCase,
  type UpdateSponsorInput,
  type UpdateSponsorOutput,
  UpdateSponsorNotFoundError,
  UpdateSponsorValidationError,
} from "./UpdateSponsor";

export {
  deleteSponsorUseCase,
  type DeleteSponsorInput,
  type DeleteSponsorOutput,
  DeleteSponsorNotFoundError,
} from "./DeleteSponsor";

export {
  getSponsorUseCase,
  type GetSponsorInput,
  type GetSponsorOutput,
  GetSponsorNotFoundError,
} from "./GetSponsor";

// =============================================================================
// Coin Use Cases (Effect-based)
// =============================================================================
export {
  addCoinsUseCase,
  type AddCoinsInput,
  type AddCoinsOutput,
  GroupNotFoundError as AddCoinsGroupNotFoundError,
  GroupNotInTripError,
  GroupDeletedError as AddCoinsGroupDeletedError,
  IncrementCoinsError,
  CreateTransactionError as AddCoinsCreateTransactionError,
} from "./AddCoins";

export {
  removeCoinsUseCase,
  type RemoveCoinsInput,
  type RemoveCoinsOutput,
  GroupNotFoundError as RemoveCoinsGroupNotFoundError,
  GroupNotInTripError as RemoveCoinsGroupNotInTripError,
  GroupDeletedError as RemoveCoinsGroupDeletedError,
  InsufficientCoinsError,
  DecrementCoinsError,
  CreateTransactionError as RemoveCoinsCreateTransactionError,
} from "./RemoveCoins";

export {
  getCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
  type GetCoinTransactionsOutput,
  GetTransactionsError,
} from "./GetCoinTransactions";

export {
  getCoinStatisticsUseCase,
  type GetCoinStatisticsInput,
  type GetCoinStatisticsOutput,
  GetStatisticsError,
} from "./GetCoinStatistics";

// =============================================================================
// Reward Use Cases (Effect-based)
// =============================================================================
export {
  createRewardUseCase,
  type CreateRewardInput,
  type CreateRewardOutput,
  CreateRewardError,
  RewardRepositoryError as CreateRewardRepositoryError,
} from "./CreateReward";

export {
  updateRewardUseCase,
  type UpdateRewardInput,
  type UpdateRewardOutput,
  RewardNotFoundError as UpdateRewardNotFoundError,
  UpdateRewardError,
  RewardRepositoryError as UpdateRewardRepositoryError,
} from "./UpdateReward";

export {
  getRewardUseCase,
  type GetRewardInput,
  type GetRewardOutput,
  RewardNotFoundError as GetRewardNotFoundError,
  RewardRepositoryError as GetRewardRepositoryError,
} from "./GetReward";

export {
  deleteRewardUseCase,
  type DeleteRewardInput,
  type DeleteRewardOutput,
  RewardNotFoundError as DeleteRewardNotFoundError,
  RewardHasPurchasesError,
} from "./DeleteReward";

export {
  listRewardsUseCase,
  type ListRewardsInput,
  type ListRewardsOutput,
  type RewardWithCalculations,
  ListRewardsError,
  RewardRepositoryError as ListRewardRepositoryError,
  TripPointsCalculatorError as ListRewardsTripPointsCalculatorError,
} from "./ListRewards";

export {
  setRewardHiddenUseCase,
  type SetRewardHiddenInput,
  type SetRewardHiddenOutput,
  RewardNotFoundError as SetRewardHiddenNotFoundError,
} from "./SetRewardHidden";

export {
  purchaseRewardUseCase,
  type PurchaseRewardInput,
  type PurchaseRewardOutput,
  type PurchaseRewardError,
  type RewardNotFoundError as PurchaseRewardNotFoundError,
  type TripEndedError,
  type RewardHiddenError,
  type InsufficientQuantityError,
  type NotGroupLeaderError,
  InsufficientCoinsError as PurchaseRewardInsufficientCoinsError,
} from "./PurchaseReward";

export {
  updatePurchaseStatusUseCase,
  type UpdatePurchaseStatusInput,
  type UpdatePurchaseStatusOutput,
} from "./UpdatePurchaseStatus";

export {
  updateMyPurchaseStatusUseCase,
  type UpdateMyPurchaseStatusInput,
  type UpdateMyPurchaseStatusOutput,
} from "./UpdateMyPurchaseStatus";

export {
  getPurchaseHistoryUseCase,
  type GetPurchaseHistoryInput,
  type GetPurchaseHistoryOutput,
  type PurchaseWithDetails,
  type GetPurchaseHistoryError,
} from "./GetPurchaseHistory";
