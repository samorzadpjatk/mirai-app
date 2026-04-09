/**
 * UseCaseModule - Application Business Logic Module
 *
 * Provides all 75 use case implementations as injectable services.
 * This module serves as the application orchestration layer in Clean Architecture,
 * coordinating domain entities through workflows and business processes.
 *
 * ## Use Case Catalog (75 use cases organized by domain)
 *
 * ### User Domain (3 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getUserUseCase` | GetUserUseCase | UserRepository |
 * | `createUserUseCase` | CreateUserUseCase | UserRepository |
 * | `updateUserUseCase` | UpdateUserUseCase | UserRepository |
 *
 * ### Challenge Domain (4 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getChallengeUseCase` | GetChallengeUseCase | ChallengeRepository |
 * | `createChallengeUseCase` | CreateChallengeUseCase | ChallengeRepository |
 * | `updateChallengeUseCase` | UpdateChallengeUseCase | ChallengeRepository |
 * | `updateChallengeStatusUseCase` | UpdateChallengeStatusUseCase | ChallengeRepository |
 *
 * ### Group Domain (3 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getGroupUseCase` | GetGroupUseCase | GroupRepository |
 * | `createGroupUseCase` | CreateGroupUseCase | GroupRepository |
 * | `updateGroupUseCase` | UpdateGroupUseCase | GroupRepository |
 *
 * ### Challenge Submission Domain (6 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `createSubmissionUseCase` | CreateSubmissionUseCase | ChallengeSubmissionRepository |
 * | `getSubmissionUseCase` | GetSubmissionUseCase | ChallengeSubmissionRepository |
 * | `getSubmissionByChallengeAndGroupUseCase` | GetSubmissionByChallengeAndGroupUseCase | ChallengeSubmissionRepository |
 * | `updateSubmissionUseCase` | UpdateSubmissionUseCase | ChallengeSubmissionRepository |
 * | `deleteSubmissionUseCase` | DeleteSubmissionUseCase | ChallengeSubmissionRepository |
 * | `listSubmissionsByChallengeUseCase` | ListSubmissionsByChallengeUseCase | ChallengeSubmissionRepository |
 *
 * ### Challenge Vote Domain (7 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getMyVotesUseCase` | GetMyVotesUseCase | ChallengeVoteRepository |
 * | `getVotesByChallengeUseCase` | GetVotesByChallengeUseCase | ChallengeVoteRepository |
 * | `getChallengeVotingProgressUseCase` | GetChallengeVotingProgressUseCase | ChallengeVoteRepository |
 * | `getJudgedStaffVotingProgressUseCase` | GetJudgedStaffVotingProgressUseCase | ChallengeVoteRepository |
 * | `submitVoteUseCase` | SubmitVoteUseCase | ChallengeVoteRepository |
 * | `submitVotesUseCase` | SubmitVotesUseCase | ChallengeVoteRepository |
 * | `forceEndVotingUseCase` | ForceEndVotingUseCase | ChallengeVoteRepository |
 *
 * ### Location Domain (5 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getLocationUseCase` | GetLocationUseCase | LocationRepository |
 * | `createLocationUseCase` | CreateLocationUseCase | LocationRepository |
 * | `updateLocationUseCase` | UpdateLocationUseCase | LocationRepository |
 * | `listLocationsUseCase` | ListLocationsUseCase | LocationRepository |
 * | `updateSharingSettingsUseCase` | UpdateSharingSettingsUseCase | LocationRepository |
 * | `addSharingUserUseCase` | AddSharingUserUseCase | LocationRepository |
 * | `removeSharingUserUseCase` | RemoveSharingUserUseCase | LocationRepository |
 * | `getSharingSettingsUseCase` | GetSharingSettingsUseCase | LocationRepository |
 *
 * ### Notification Domain (1 use case)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getNotificationUseCase` | GetNotificationUseCase | NotificationRepository |
 *
 * ### Activity Feed Domain (3 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getActivityFeedUseCase` | GetActivityFeedUseCase | ActivityFeedRepository |
 * | `createActivityUseCase` | CreateActivityUseCase | ActivityFeedRepository |
 * | `addReactionUseCase` | AddReactionUseCase | ActivityFeedRepository |
 *
 * ### Submission Report Domain (2 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `createReportUseCase` | CreateReportUseCase | SubmissionReportRepository |
 * | `getReportsUseCase` | GetReportsUseCase | SubmissionReportRepository |
 *
 * ### Sponsor Domain (7 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `createSponsorUseCase` | CreateSponsorUseCase | SponsorRepository |
 * | `getSponsorUseCase` | GetSponsorUseCase | SponsorRepository |
 * | `updateSponsorUseCase` | UpdateSponsorUseCase | SponsorRepository |
 * | `deleteSponsorUseCase` | DeleteSponsorUseCase | SponsorRepository |
 * | `listSponsorsUseCase` | ListSponsorsUseCase | SponsorRepository |
 * | `linkSponsorToTripUseCase` | LinkSponsorToTripUseCase | SponsorRepository |
 * | `unlinkSponsorFromTripUseCase` | UnlinkSponsorFromTripUseCase | SponsorRepository |
 *
 * ### Reward Domain (10 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getRewardUseCase` | GetRewardUseCase | RewardRepository |
 * | `createRewardUseCase` | CreateRewardUseCase | RewardRepository |
 * | `updateRewardUseCase` | UpdateRewardUseCase | RewardRepository |
 * | `setRewardHiddenUseCase` | SetRewardHiddenUseCase | RewardRepository |
 * | `deleteRewardUseCase` | DeleteRewardUseCase | RewardRepository |
 * | `listRewardsUseCase` | ListRewardsUseCase | RewardRepository |
 * | `purchaseRewardUseCase` | PurchaseRewardUseCase | RewardRepository, RewardPurchaseRepository, TripPointsCalculator, GroupCoinsService, TripAccessChecker |
 * | `updatePurchaseStatusUseCase` | UpdatePurchaseStatusUseCase | RewardPurchaseRepository |
 * | `updateMyPurchaseStatusUseCase` | UpdateMyPurchaseStatusUseCase | RewardPurchaseRepository |
 * | `getPurchaseHistoryUseCase` | GetPurchaseHistoryUseCase | RewardPurchaseRepository |
 *
 * ### Coin Transaction Domain (6 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getCoinStatisticsUseCase` | GetCoinStatisticsUseCase | CoinTransactionRepository |
 * | `getMostActiveAdminStatsUseCase` | GetMostActiveAdminStatsUseCase | CoinTransactionRepository |
 * | `getCoinTransactionsUseCase` | GetCoinTransactionsUseCase | CoinTransactionRepository |
 * | `getCoinQuickStatsUseCase` | GetCoinQuickStatsUseCase | CoinTransactionRepository |
 * | `getCoinAdditionalInsightsUseCase` | GetCoinAdditionalInsightsUseCase | CoinTransactionRepository |
 * | `addCoinsUseCase` | AddCoinsUseCase | CoinTransactionRepository |
 * | `removeCoinsUseCase` | RemoveCoinsUseCase | CoinTransactionRepository |
 *
 * ### Notification Delivery Domain (5 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getDeliveriesUseCase` | GetDeliveriesUseCase | NotificationDeliveryRepository |
 * | `getDeliveryByNotificationIdUseCase` | GetDeliveryByNotificationIdUseCase | NotificationDeliveryRepository |
 * | `getDeliveryStatsUseCase` | GetDeliveryStatsUseCase | NotificationDeliveryRepository |
 * | `getFailedDeliveriesUseCase` | GetFailedDeliveriesUseCase | NotificationDeliveryRepository |
 *
 * ### Notification Schedule Domain (12 use cases)
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `getNotificationSchedulesUseCase` | GetNotificationSchedulesUseCase | NotificationScheduleRepository |
 * | `getNotificationScheduleByIdUseCase` | GetNotificationScheduleByIdUseCase | NotificationScheduleRepository |
 * | `createNotificationScheduleUseCase` | CreateNotificationScheduleUseCase | NotificationScheduleRepository |
 * | `updateNotificationScheduleUseCase` | UpdateNotificationScheduleUseCase | NotificationScheduleRepository |
 * | `deleteNotificationScheduleUseCase` | DeleteNotificationScheduleUseCase | NotificationScheduleRepository |
 * | `getActiveNotificationSchedulesUseCase` | GetActiveNotificationSchedulesUseCase | NotificationScheduleRepository |
 * | `getUpcomingNotificationSchedulesUseCase` | GetUpcomingNotificationSchedulesUseCase | NotificationScheduleRepository |
 * | `updateNotificationScheduleLastRunUseCase` | UpdateNotificationScheduleLastRunUseCase | NotificationScheduleRepository |
 * | `toggleNotificationScheduleActiveUseCase` | ToggleNotificationScheduleActiveUseCase | NotificationScheduleRepository |
 * | `bulkToggleNotificationScheduleActiveUseCase` | BulkToggleNotificationScheduleActiveUseCase | NotificationScheduleRepository |
 * | `bulkDeleteNotificationSchedulesUseCase` | BulkDeleteNotificationSchedulesUseCase | NotificationScheduleRepository |
 * | `duplicateNotificationScheduleUseCase` | DuplicateNotificationScheduleUseCase | NotificationScheduleRepository |
 * | `getNotificationScheduleExecutionHistoryUseCase` | GetNotificationScheduleExecutionHistoryUseCase | NotificationScheduleRepository |
 *
 * ## Usage
 *
 * ### Resolving Use Cases
 *
 * ```typescript
 * import { container } from "@mirai-app/frameworks/di";
 *
 * // Resolve by token name
 * const getUserUseCase = container.resolve("getUserUseCase");
 *
 * // In a controller with constructor injection
 * class UserController {
 *   constructor(private deps: UseCaseModuleDeps) {}
 *
 *   async getUser(input: GetUserInput) {
 *     return this.deps.getUserUseCase.execute(input);
 *   }
 * }
 * ```
 *
 * ## Dependencies
 *
 * This module depends on `RepositoryModule` being available in the container.
 * All use cases receive their repository dependencies through the container cradle.
 *
 * ## Provider Format
 *
 * This module uses the awilix-modular format compatible with the container's
 * `registerModule` function. Use cases are configured as factory objects that
 * get resolved with their repository dependencies from the cradle.
 *
 * ## Scope Strategy
 *
 * All use cases are registered with **SCOPED** lifetime (request-scoped):
 * - Use cases may hold request-specific state
 * - Each request gets fresh use case instances
 * - Prevents cross-request state contamination
 * - Supports request-scoped transaction management
 *
 * @module UseCaseModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

// =============================================================================
// Use Case Imports - User Domain
// =============================================================================
import { GetUserUseCase } from "../interactors/GetUser";
import { CreateUserUseCase } from "../interactors/CreateUser";
import { UpdateUserUseCase } from "../interactors/UpdateUser";

// =============================================================================
// Use Case Imports - Challenge Domain
// =============================================================================
import { GetChallengeUseCase } from "../interactors/GetChallenge";
import { CreateChallengeUseCase } from "../interactors/CreateChallenge";
import { UpdateChallengeUseCase } from "../interactors/UpdateChallenge";
import { UpdateChallengeStatusUseCase } from "../interactors/UpdateChallengeStatus";

// =============================================================================
// Use Case Imports - Group Domain
// =============================================================================
import { GetGroupUseCase } from "../interactors/GetGroup";
import { CreateGroupUseCase } from "../interactors/CreateGroup";
import { UpdateGroupUseCase } from "../interactors/UpdateGroup";

// =============================================================================
// Use Case Imports - Challenge Submission Domain
// =============================================================================
import { CreateSubmissionUseCase } from "../interactors/CreateSubmission";
import { GetSubmissionUseCase } from "../interactors/GetSubmission";
import { GetSubmissionByChallengeAndGroupUseCase } from "../interactors/GetSubmissionByChallengeAndGroup";
import { UpdateSubmissionUseCase } from "../interactors/UpdateSubmission";
import { DeleteSubmissionUseCase } from "../interactors/DeleteSubmission";
import { ListSubmissionsByChallengeUseCase } from "../interactors/ListSubmissionsByChallenge";

// =============================================================================
// Use Case Imports - Challenge Vote Domain
// =============================================================================
import { GetMyVotesUseCase } from "../interactors/GetMyVotes";
import { GetVotesByChallengeUseCase } from "../interactors/GetVotesByChallenge";
import { GetChallengeVotingProgressUseCase } from "../interactors/GetChallengeVotingProgress";
import { GetJudgedStaffVotingProgressUseCase } from "../interactors/GetJudgedStaffVotingProgress";
import { SubmitVoteUseCase } from "../interactors/SubmitVote";
import { SubmitVotesUseCase } from "../interactors/SubmitVotes";
import { ForceEndVotingUseCase } from "../interactors/ForceEndVoting";

// =============================================================================
// Use Case Imports - Location Domain
// =============================================================================
import { GetLocationUseCase } from "../interactors/GetLocation";
import { CreateLocationUseCase } from "../interactors/CreateLocation";
import { UpdateLocationUseCase } from "../interactors/UpdateLocation";
import { ListLocationsUseCase } from "../interactors/ListLocations";
import { UpdateSharingSettingsUseCase } from "../interactors/UpdateSharingSettings";
import { AddSharingUserUseCase } from "../interactors/AddSharingUser";
import { RemoveSharingUserUseCase } from "../interactors/RemoveSharingUser";
import { GetSharingSettingsUseCase } from "../interactors/GetSharingSettings";

// =============================================================================
// Use Case Imports - Notification Domain
// =============================================================================
import { GetNotificationUseCase } from "../interactors/GetNotification";

// =============================================================================
// Use Case Imports - Activity Feed Domain
// =============================================================================
import { GetActivityFeedUseCase } from "../interactors/GetActivityFeed";
import { CreateActivityUseCase } from "../interactors/CreateActivity";
import { AddReactionUseCase } from "../interactors/AddReaction";

// =============================================================================
// Use Case Imports - Submission Report Domain
// =============================================================================
import { CreateReportUseCase } from "../interactors/CreateReport";
import { GetReportsUseCase } from "../interactors/GetReports";

// =============================================================================
// Use Case Imports - Sponsor Domain
// =============================================================================
import { CreateSponsorUseCase } from "../interactors/CreateSponsor";
import { GetSponsorUseCase } from "../interactors/GetSponsor";
import { UpdateSponsorUseCase } from "../interactors/UpdateSponsor";
import { DeleteSponsorUseCase } from "../interactors/DeleteSponsor";
import { ListSponsorsUseCase } from "../interactors/ListSponsors";
import { LinkSponsorToTripUseCase } from "../interactors/LinkSponsorToTrip";
import { UnlinkSponsorFromTripUseCase } from "../interactors/UnlinkSponsorFromTrip";

// =============================================================================
// Use Case Imports - Reward Domain
// =============================================================================
import { GetRewardUseCase } from "../interactors/GetReward";
import { CreateRewardUseCase } from "../interactors/CreateReward";
import { UpdateRewardUseCase } from "../interactors/UpdateReward";
import { SetRewardHiddenUseCase } from "../interactors/SetRewardHidden";
import { DeleteRewardUseCase } from "../interactors/DeleteReward";
import { ListRewardsUseCase } from "../interactors/ListRewards";
import { PurchaseRewardUseCase } from "../interactors/PurchaseReward";
import { UpdatePurchaseStatusUseCase } from "../interactors/UpdatePurchaseStatus";
import { UpdateMyPurchaseStatusUseCase } from "../interactors/UpdateMyPurchaseStatus";
import { GetPurchaseHistoryUseCase } from "../interactors/GetPurchaseHistory";

// =============================================================================
// Use Case Imports - Coin Transaction Domain
// =============================================================================
import { GetCoinStatisticsUseCase } from "../interactors/GetCoinStatistics";
import { GetMostActiveAdminStatsUseCase } from "../interactors/GetMostActiveAdminStats";
import { GetCoinTransactionsUseCase } from "../interactors/GetCoinTransactions";
import { GetCoinQuickStatsUseCase } from "../interactors/GetCoinQuickStats";
import { GetCoinAdditionalInsightsUseCase } from "../interactors/GetCoinAdditionalInsights";
import { AddCoinsUseCase } from "../interactors/AddCoins";
import { RemoveCoinsUseCase } from "../interactors/RemoveCoins";

// =============================================================================
// Use Case Imports - Notification Delivery Domain
// =============================================================================
import { GetDeliveriesUseCase } from "../interactors/GetDeliveries";
import { GetDeliveryByNotificationIdUseCase } from "../interactors/GetDeliveryByNotificationId";
import { GetDeliveryStatsUseCase } from "../interactors/GetDeliveryStats";
import { GetFailedDeliveriesUseCase } from "../interactors/GetFailedDeliveries";

// =============================================================================
// Use Case Imports - Notification Schedule Domain
// =============================================================================
import { GetNotificationSchedulesUseCase } from "../interactors/GetNotificationSchedules";
import { GetNotificationScheduleByIdUseCase } from "../interactors/GetNotificationScheduleById";
import { CreateNotificationScheduleUseCase } from "../interactors/CreateNotificationSchedule";
import { UpdateNotificationScheduleUseCase } from "../interactors/UpdateNotificationSchedule";
import { DeleteNotificationScheduleUseCase } from "../interactors/DeleteNotificationSchedule";
import { GetActiveNotificationSchedulesUseCase } from "../interactors/GetActiveNotificationSchedules";
import { GetUpcomingNotificationSchedulesUseCase } from "../interactors/GetUpcomingNotificationSchedules";
import { UpdateNotificationScheduleLastRunUseCase } from "../interactors/UpdateNotificationScheduleLastRun";
import { ToggleNotificationScheduleActiveUseCase } from "../interactors/ToggleNotificationScheduleActive";
import { BulkToggleNotificationScheduleActiveUseCase } from "../interactors/BulkToggleNotificationScheduleActive";
import { BulkDeleteNotificationSchedulesUseCase } from "../interactors/BulkDeleteNotificationSchedules";
import { DuplicateNotificationScheduleUseCase } from "../interactors/DuplicateNotificationSchedule";
import { GetNotificationScheduleExecutionHistoryUseCase } from "../interactors/GetNotificationScheduleExecutionHistory";

// =============================================================================
// Type Imports (for type definitions)
// =============================================================================

import type {
  UserRepository,
  ChallengeRepository,
  ChallengeSubmissionRepository,
  ChallengeVoteRepository,
  LocationRepository,
  NotificationRepository,
  ActivityFeedRepository,
  SubmissionReportRepository,
  SponsorRepository,
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
  CoinTransactionRepository,
  NotificationDeliveryRepository,
  NotificationScheduleRepository,
} from "../ports";

// =============================================================================
// Injection Tokens
// =============================================================================

/**
 * Use case injection tokens
 *
 * String-based tokens for use case resolution. Using consistent
 * camelCase naming convention based on use case name.
 */
export const USE_CASE_TOKENS = {
  // User Domain
  GetUserUseCase: "getUserUseCase",
  CreateUserUseCase: "createUserUseCase",
  UpdateUserUseCase: "updateUserUseCase",

  // Challenge Domain
  GetChallengeUseCase: "getChallengeUseCase",
  CreateChallengeUseCase: "createChallengeUseCase",
  UpdateChallengeUseCase: "updateChallengeUseCase",
  UpdateChallengeStatusUseCase: "updateChallengeStatusUseCase",

  // Group Domain
  GetGroupUseCase: "getGroupUseCase",
  CreateGroupUseCase: "createGroupUseCase",
  UpdateGroupUseCase: "updateGroupUseCase",

  // Challenge Submission Domain
  CreateSubmissionUseCase: "createSubmissionUseCase",
  GetSubmissionUseCase: "getSubmissionUseCase",
  GetSubmissionByChallengeAndGroupUseCase:
    "getSubmissionByChallengeAndGroupUseCase",
  UpdateSubmissionUseCase: "updateSubmissionUseCase",
  DeleteSubmissionUseCase: "deleteSubmissionUseCase",
  ListSubmissionsByChallengeUseCase: "listSubmissionsByChallengeUseCase",

  // Challenge Vote Domain
  GetMyVotesUseCase: "getMyVotesUseCase",
  GetVotesByChallengeUseCase: "getVotesByChallengeUseCase",
  GetChallengeVotingProgressUseCase: "getChallengeVotingProgressUseCase",
  GetJudgedStaffVotingProgressUseCase: "getJudgedStaffVotingProgressUseCase",
  SubmitVoteUseCase: "submitVoteUseCase",
  SubmitVotesUseCase: "submitVotesUseCase",
  ForceEndVotingUseCase: "forceEndVotingUseCase",

  // Location Domain
  GetLocationUseCase: "getLocationUseCase",
  CreateLocationUseCase: "createLocationUseCase",
  UpdateLocationUseCase: "updateLocationUseCase",
  ListLocationsUseCase: "listLocationsUseCase",
  UpdateSharingSettingsUseCase: "updateSharingSettingsUseCase",
  AddSharingUserUseCase: "addSharingUserUseCase",
  RemoveSharingUserUseCase: "removeSharingUserUseCase",
  GetSharingSettingsUseCase: "getSharingSettingsUseCase",

  // Notification Domain
  GetNotificationUseCase: "getNotificationUseCase",

  // Activity Feed Domain
  GetActivityFeedUseCase: "getActivityFeedUseCase",
  CreateActivityUseCase: "createActivityUseCase",
  AddReactionUseCase: "addReactionUseCase",

  // Submission Report Domain
  CreateReportUseCase: "createReportUseCase",
  GetReportsUseCase: "getReportsUseCase",

  // Sponsor Domain
  CreateSponsorUseCase: "createSponsorUseCase",
  GetSponsorUseCase: "getSponsorUseCase",
  UpdateSponsorUseCase: "updateSponsorUseCase",
  DeleteSponsorUseCase: "deleteSponsorUseCase",
  ListSponsorsUseCase: "listSponsorsUseCase",
  LinkSponsorToTripUseCase: "linkSponsorToTripUseCase",
  UnlinkSponsorFromTripUseCase: "unlinkSponsorFromTripUseCase",

  // Reward Domain
  GetRewardUseCase: "getRewardUseCase",
  CreateRewardUseCase: "createRewardUseCase",
  UpdateRewardUseCase: "updateRewardUseCase",
  SetRewardHiddenUseCase: "setRewardHiddenUseCase",
  DeleteRewardUseCase: "deleteRewardUseCase",
  ListRewardsUseCase: "listRewardsUseCase",
  PurchaseRewardUseCase: "purchaseRewardUseCase",
  UpdatePurchaseStatusUseCase: "updatePurchaseStatusUseCase",
  UpdateMyPurchaseStatusUseCase: "updateMyPurchaseStatusUseCase",
  GetPurchaseHistoryUseCase: "getPurchaseHistoryUseCase",

  // Coin Transaction Domain
  GetCoinStatisticsUseCase: "getCoinStatisticsUseCase",
  GetMostActiveAdminStatsUseCase: "getMostActiveAdminStatsUseCase",
  GetCoinTransactionsUseCase: "getCoinTransactionsUseCase",
  GetCoinQuickStatsUseCase: "getCoinQuickStatsUseCase",
  GetCoinAdditionalInsightsUseCase: "getCoinAdditionalInsightsUseCase",
  AddCoinsUseCase: "addCoinsUseCase",
  RemoveCoinsUseCase: "removeCoinsUseCase",

  // Notification Delivery Domain
  GetDeliveriesUseCase: "getDeliveriesUseCase",
  GetDeliveryByNotificationIdUseCase: "getDeliveryByNotificationIdUseCase",
  GetDeliveryStatsUseCase: "getDeliveryStatsUseCase",
  GetFailedDeliveriesUseCase: "getFailedDeliveriesUseCase",

  // Notification Schedule Domain
  GetNotificationSchedulesUseCase: "getNotificationSchedulesUseCase",
  GetNotificationScheduleByIdUseCase: "getNotificationScheduleByIdUseCase",
  CreateNotificationScheduleUseCase: "createNotificationScheduleUseCase",
  UpdateNotificationScheduleUseCase: "updateNotificationScheduleUseCase",
  DeleteNotificationScheduleUseCase: "deleteNotificationScheduleUseCase",
  GetActiveNotificationSchedulesUseCase:
    "getActiveNotificationSchedulesUseCase",
  GetUpcomingNotificationSchedulesUseCase:
    "getUpcomingNotificationSchedulesUseCase",
  UpdateNotificationScheduleLastRunUseCase:
    "updateNotificationScheduleLastRunUseCase",
  ToggleNotificationScheduleActiveUseCase:
    "toggleNotificationScheduleActiveUseCase",
  BulkToggleNotificationScheduleActiveUseCase:
    "bulkToggleNotificationScheduleActiveUseCase",
  BulkDeleteNotificationSchedulesUseCase:
    "bulkDeleteNotificationSchedulesUseCase",
  DuplicateNotificationScheduleUseCase: "duplicateNotificationScheduleUseCase",
  GetNotificationScheduleExecutionHistoryUseCase:
    "getNotificationScheduleExecutionHistoryUseCase",
} as const;

/**
 * Type for use case token keys
 */
export type UseCaseToken =
  (typeof USE_CASE_TOKENS)[keyof typeof USE_CASE_TOKENS];

// =============================================================================
// Module Dependencies Type
// =============================================================================

/**
 * Repository dependencies from RepositoryModule
 *
 * Use cases depend on these repositories being available in the container.
 */
interface RepositoryDependencies {
  /** User data access */
  userRepository: UserRepository;

  /** Challenge data access */
  challengeRepository: ChallengeRepository;

  /** Challenge submission data access */
  challengeSubmissionRepository: ChallengeSubmissionRepository;

  /** Challenge vote data access */
  challengeVoteRepository: ChallengeVoteRepository;

  /** Location data access */
  locationRepository: LocationRepository;

  /** Notification data access */
  notificationRepository: NotificationRepository;

  /** Activity feed data access */
  activityFeedRepository: ActivityFeedRepository;

  /** Submission report data access */
  submissionReportRepository: SubmissionReportRepository;

  /** Sponsor data access */
  sponsorRepository: SponsorRepository;

  /** Reward data access */
  rewardRepository: RewardRepository;

  /** Reward purchase data access */
  rewardPurchaseRepository: RewardPurchaseRepository;

  /** Coin transaction data access */
  coinTransactionRepository: CoinTransactionRepository;

  /** Notification delivery data access */
  notificationDeliveryRepository: NotificationDeliveryRepository;

  /** Notification schedule data access */
  notificationScheduleRepository: NotificationScheduleRepository;

  /** Trip points calculator service */
  tripPointsCalculator: TripPointsCalculator;

  /** Group coins service */
  groupCoinsService: GroupCoinsService;

  /** Trip access checker service */
  tripAccessChecker: TripAccessChecker;
}

/**
 * Use case module dependencies type
 *
 * Use this type for constructor injection when you need use cases.
 * All use cases are available as scoped services.
 *
 * @example
 * ```typescript
 * class MyController {
 *   constructor(private deps: UseCaseModuleDeps) {}
 *
 *   async handleUserRequest(input: GetUserInput) {
 *     return this.deps.getUserUseCase.execute(input);
 *   }
 * }
 * ```
 */
export interface UseCaseModuleDeps extends RepositoryDependencies {
  // User Domain
  /** Get user by ID */
  [USE_CASE_TOKENS.GetUserUseCase]: GetUserUseCase;

  /** Create new user */
  [USE_CASE_TOKENS.CreateUserUseCase]: CreateUserUseCase;

  /** Update existing user */
  [USE_CASE_TOKENS.UpdateUserUseCase]: UpdateUserUseCase;

  // Challenge Domain
  /** Get challenge by ID */
  [USE_CASE_TOKENS.GetChallengeUseCase]: GetChallengeUseCase;

  /** Create new challenge */
  [USE_CASE_TOKENS.CreateChallengeUseCase]: CreateChallengeUseCase;

  /** Update existing challenge */
  [USE_CASE_TOKENS.UpdateChallengeUseCase]: UpdateChallengeUseCase;

  /** Update challenge status */
  [USE_CASE_TOKENS.UpdateChallengeStatusUseCase]: UpdateChallengeStatusUseCase;

  // Group Domain
  /** Get group by ID */
  [USE_CASE_TOKENS.GetGroupUseCase]: GetGroupUseCase;

  /** Create new group */
  [USE_CASE_TOKENS.CreateGroupUseCase]: CreateGroupUseCase;

  /** Update existing group */
  [USE_CASE_TOKENS.UpdateGroupUseCase]: UpdateGroupUseCase;

  // Challenge Submission Domain
  /** Create new submission */
  [USE_CASE_TOKENS.CreateSubmissionUseCase]: CreateSubmissionUseCase;

  /** Get submission by ID */
  [USE_CASE_TOKENS.GetSubmissionUseCase]: GetSubmissionUseCase;

  /** Get submission by challenge and group */
  [USE_CASE_TOKENS.GetSubmissionByChallengeAndGroupUseCase]: GetSubmissionByChallengeAndGroupUseCase;

  /** Update existing submission */
  [USE_CASE_TOKENS.UpdateSubmissionUseCase]: UpdateSubmissionUseCase;

  /** Delete submission */
  [USE_CASE_TOKENS.DeleteSubmissionUseCase]: DeleteSubmissionUseCase;

  /** List submissions by challenge */
  [USE_CASE_TOKENS.ListSubmissionsByChallengeUseCase]: ListSubmissionsByChallengeUseCase;

  // Challenge Vote Domain
  /** Get my votes */
  [USE_CASE_TOKENS.GetMyVotesUseCase]: GetMyVotesUseCase;

  /** Get votes by challenge */
  [USE_CASE_TOKENS.GetVotesByChallengeUseCase]: GetVotesByChallengeUseCase;

  /** Get challenge voting progress */
  [USE_CASE_TOKENS.GetChallengeVotingProgressUseCase]: GetChallengeVotingProgressUseCase;

  /** Get judged staff voting progress */
  [USE_CASE_TOKENS.GetJudgedStaffVotingProgressUseCase]: GetJudgedStaffVotingProgressUseCase;

  /** Submit single vote */
  [USE_CASE_TOKENS.SubmitVoteUseCase]: SubmitVoteUseCase;

  /** Submit multiple votes */
  [USE_CASE_TOKENS.SubmitVotesUseCase]: SubmitVotesUseCase;

  /** Force end voting */
  [USE_CASE_TOKENS.ForceEndVotingUseCase]: ForceEndVotingUseCase;

  // Location Domain
  /** Get location by ID */
  [USE_CASE_TOKENS.GetLocationUseCase]: GetLocationUseCase;

  /** Create new location */
  [USE_CASE_TOKENS.CreateLocationUseCase]: CreateLocationUseCase;

  /** Update existing location */
  [USE_CASE_TOKENS.UpdateLocationUseCase]: UpdateLocationUseCase;

  /** List locations */
  [USE_CASE_TOKENS.ListLocationsUseCase]: ListLocationsUseCase;

  /** Update sharing settings */
  [USE_CASE_TOKENS.UpdateSharingSettingsUseCase]: UpdateSharingSettingsUseCase;

  /** Add sharing user */
  [USE_CASE_TOKENS.AddSharingUserUseCase]: AddSharingUserUseCase;

  /** Remove sharing user */
  [USE_CASE_TOKENS.RemoveSharingUserUseCase]: RemoveSharingUserUseCase;

  /** Get sharing settings */
  [USE_CASE_TOKENS.GetSharingSettingsUseCase]: GetSharingSettingsUseCase;

  // Notification Domain
  /** Get notification by ID */
  [USE_CASE_TOKENS.GetNotificationUseCase]: GetNotificationUseCase;

  // Activity Feed Domain
  /** Get activity feed */
  [USE_CASE_TOKENS.GetActivityFeedUseCase]: GetActivityFeedUseCase;

  /** Create activity */
  [USE_CASE_TOKENS.CreateActivityUseCase]: CreateActivityUseCase;

  /** Add reaction */
  [USE_CASE_TOKENS.AddReactionUseCase]: AddReactionUseCase;

  // Submission Report Domain
  /** Create report */
  [USE_CASE_TOKENS.CreateReportUseCase]: CreateReportUseCase;

  /** Get reports */
  [USE_CASE_TOKENS.GetReportsUseCase]: GetReportsUseCase;

  // Sponsor Domain
  /** Create sponsor */
  [USE_CASE_TOKENS.CreateSponsorUseCase]: CreateSponsorUseCase;

  /** Get sponsor by ID */
  [USE_CASE_TOKENS.GetSponsorUseCase]: GetSponsorUseCase;

  /** Update sponsor */
  [USE_CASE_TOKENS.UpdateSponsorUseCase]: UpdateSponsorUseCase;

  /** Delete sponsor */
  [USE_CASE_TOKENS.DeleteSponsorUseCase]: DeleteSponsorUseCase;

  /** List sponsors */
  [USE_CASE_TOKENS.ListSponsorsUseCase]: ListSponsorsUseCase;

  /** Link sponsor to trip */
  [USE_CASE_TOKENS.LinkSponsorToTripUseCase]: LinkSponsorToTripUseCase;

  /** Unlink sponsor from trip */
  [USE_CASE_TOKENS.UnlinkSponsorFromTripUseCase]: UnlinkSponsorFromTripUseCase;

  // Reward Domain
  /** Get reward by ID */
  [USE_CASE_TOKENS.GetRewardUseCase]: GetRewardUseCase;

  /** Create reward */
  [USE_CASE_TOKENS.CreateRewardUseCase]: CreateRewardUseCase;

  /** Update reward */
  [USE_CASE_TOKENS.UpdateRewardUseCase]: UpdateRewardUseCase;

  /** Set reward hidden status */
  [USE_CASE_TOKENS.SetRewardHiddenUseCase]: SetRewardHiddenUseCase;

  /** Delete reward */
  [USE_CASE_TOKENS.DeleteRewardUseCase]: DeleteRewardUseCase;

  /** List rewards */
  [USE_CASE_TOKENS.ListRewardsUseCase]: ListRewardsUseCase;

  /** Purchase reward (complex use case) */
  [USE_CASE_TOKENS.PurchaseRewardUseCase]: PurchaseRewardUseCase;

  /** Update purchase status */
  [USE_CASE_TOKENS.UpdatePurchaseStatusUseCase]: UpdatePurchaseStatusUseCase;

  /** Update my purchase status */
  [USE_CASE_TOKENS.UpdateMyPurchaseStatusUseCase]: UpdateMyPurchaseStatusUseCase;

  /** Get purchase history */
  [USE_CASE_TOKENS.GetPurchaseHistoryUseCase]: GetPurchaseHistoryUseCase;

  // Coin Transaction Domain
  /** Get coin statistics */
  [USE_CASE_TOKENS.GetCoinStatisticsUseCase]: GetCoinStatisticsUseCase;

  /** Get most active admin stats */
  [USE_CASE_TOKENS.GetMostActiveAdminStatsUseCase]: GetMostActiveAdminStatsUseCase;

  /** Get coin transactions */
  [USE_CASE_TOKENS.GetCoinTransactionsUseCase]: GetCoinTransactionsUseCase;

  /** Get coin quick stats */
  [USE_CASE_TOKENS.GetCoinQuickStatsUseCase]: GetCoinQuickStatsUseCase;

  /** Get coin additional insights */
  [USE_CASE_TOKENS.GetCoinAdditionalInsightsUseCase]: GetCoinAdditionalInsightsUseCase;

  /** Add coins */
  [USE_CASE_TOKENS.AddCoinsUseCase]: AddCoinsUseCase;

  /** Remove coins */
  [USE_CASE_TOKENS.RemoveCoinsUseCase]: RemoveCoinsUseCase;

  // Notification Delivery Domain
  /** Get deliveries */
  [USE_CASE_TOKENS.GetDeliveriesUseCase]: GetDeliveriesUseCase;

  /** Get delivery by notification ID */
  [USE_CASE_TOKENS.GetDeliveryByNotificationIdUseCase]: GetDeliveryByNotificationIdUseCase;

  /** Get delivery stats */
  [USE_CASE_TOKENS.GetDeliveryStatsUseCase]: GetDeliveryStatsUseCase;

  /** Get failed deliveries */
  [USE_CASE_TOKENS.GetFailedDeliveriesUseCase]: GetFailedDeliveriesUseCase;

  // Notification Schedule Domain
  /** Get notification schedules */
  [USE_CASE_TOKENS.GetNotificationSchedulesUseCase]: GetNotificationSchedulesUseCase;

  /** Get notification schedule by ID */
  [USE_CASE_TOKENS.GetNotificationScheduleByIdUseCase]: GetNotificationScheduleByIdUseCase;

  /** Create notification schedule */
  [USE_CASE_TOKENS.CreateNotificationScheduleUseCase]: CreateNotificationScheduleUseCase;

  /** Update notification schedule */
  [USE_CASE_TOKENS.UpdateNotificationScheduleUseCase]: UpdateNotificationScheduleUseCase;

  /** Delete notification schedule */
  [USE_CASE_TOKENS.DeleteNotificationScheduleUseCase]: DeleteNotificationScheduleUseCase;

  /** Get active notification schedules */
  [USE_CASE_TOKENS.GetActiveNotificationSchedulesUseCase]: GetActiveNotificationSchedulesUseCase;

  /** Get upcoming notification schedules */
  [USE_CASE_TOKENS.GetUpcomingNotificationSchedulesUseCase]: GetUpcomingNotificationSchedulesUseCase;

  /** Update notification schedule last run */
  [USE_CASE_TOKENS.UpdateNotificationScheduleLastRunUseCase]: UpdateNotificationScheduleLastRunUseCase;

  /** Toggle notification schedule active status */
  [USE_CASE_TOKENS.ToggleNotificationScheduleActiveUseCase]: ToggleNotificationScheduleActiveUseCase;

  /** Bulk toggle notification schedule active status */
  [USE_CASE_TOKENS.BulkToggleNotificationScheduleActiveUseCase]: BulkToggleNotificationScheduleActiveUseCase;

  /** Bulk delete notification schedules */
  [USE_CASE_TOKENS.BulkDeleteNotificationSchedulesUseCase]: BulkDeleteNotificationSchedulesUseCase;

  /** Duplicate notification schedule */
  [USE_CASE_TOKENS.DuplicateNotificationScheduleUseCase]: DuplicateNotificationScheduleUseCase;

  /** Get notification schedule execution history */
  [USE_CASE_TOKENS.GetNotificationScheduleExecutionHistoryUseCase]: GetNotificationScheduleExecutionHistoryUseCase;
}

// =============================================================================
// Module Definition Type
// =============================================================================

/**
 * Use case module definition type
 *
 * Used for type checking and module composition.
 */
export interface UseCaseModuleDef {
  name: "UseCaseModule";
  providers: {
    // User Domain
    [USE_CASE_TOKENS.GetUserUseCase]: typeof GetUserUseCase;
    [USE_CASE_TOKENS.CreateUserUseCase]: typeof CreateUserUseCase;
    [USE_CASE_TOKENS.UpdateUserUseCase]: typeof UpdateUserUseCase;

    // Challenge Domain
    [USE_CASE_TOKENS.GetChallengeUseCase]: typeof GetChallengeUseCase;
    [USE_CASE_TOKENS.CreateChallengeUseCase]: typeof CreateChallengeUseCase;
    [USE_CASE_TOKENS.UpdateChallengeUseCase]: typeof UpdateChallengeUseCase;
    [USE_CASE_TOKENS.UpdateChallengeStatusUseCase]: typeof UpdateChallengeStatusUseCase;

    // Group Domain
    [USE_CASE_TOKENS.GetGroupUseCase]: typeof GetGroupUseCase;
    [USE_CASE_TOKENS.CreateGroupUseCase]: typeof CreateGroupUseCase;
    [USE_CASE_TOKENS.UpdateGroupUseCase]: typeof UpdateGroupUseCase;

    // Challenge Submission Domain
    [USE_CASE_TOKENS.CreateSubmissionUseCase]: typeof CreateSubmissionUseCase;
    [USE_CASE_TOKENS.GetSubmissionUseCase]: typeof GetSubmissionUseCase;
    [USE_CASE_TOKENS.GetSubmissionByChallengeAndGroupUseCase]: typeof GetSubmissionByChallengeAndGroupUseCase;
    [USE_CASE_TOKENS.UpdateSubmissionUseCase]: typeof UpdateSubmissionUseCase;
    [USE_CASE_TOKENS.DeleteSubmissionUseCase]: typeof DeleteSubmissionUseCase;
    [USE_CASE_TOKENS.ListSubmissionsByChallengeUseCase]: typeof ListSubmissionsByChallengeUseCase;

    // Challenge Vote Domain
    [USE_CASE_TOKENS.GetMyVotesUseCase]: typeof GetMyVotesUseCase;
    [USE_CASE_TOKENS.GetVotesByChallengeUseCase]: typeof GetVotesByChallengeUseCase;
    [USE_CASE_TOKENS.GetChallengeVotingProgressUseCase]: typeof GetChallengeVotingProgressUseCase;
    [USE_CASE_TOKENS.GetJudgedStaffVotingProgressUseCase]: typeof GetJudgedStaffVotingProgressUseCase;
    [USE_CASE_TOKENS.SubmitVoteUseCase]: typeof SubmitVoteUseCase;
    [USE_CASE_TOKENS.SubmitVotesUseCase]: typeof SubmitVotesUseCase;
    [USE_CASE_TOKENS.ForceEndVotingUseCase]: typeof ForceEndVotingUseCase;

    // Location Domain
    [USE_CASE_TOKENS.GetLocationUseCase]: typeof GetLocationUseCase;
    [USE_CASE_TOKENS.CreateLocationUseCase]: typeof CreateLocationUseCase;
    [USE_CASE_TOKENS.UpdateLocationUseCase]: typeof UpdateLocationUseCase;
    [USE_CASE_TOKENS.ListLocationsUseCase]: typeof ListLocationsUseCase;
    [USE_CASE_TOKENS.UpdateSharingSettingsUseCase]: typeof UpdateSharingSettingsUseCase;
    [USE_CASE_TOKENS.AddSharingUserUseCase]: typeof AddSharingUserUseCase;
    [USE_CASE_TOKENS.RemoveSharingUserUseCase]: typeof RemoveSharingUserUseCase;
    [USE_CASE_TOKENS.GetSharingSettingsUseCase]: typeof GetSharingSettingsUseCase;

    // Notification Domain
    [USE_CASE_TOKENS.GetNotificationUseCase]: typeof GetNotificationUseCase;

    // Activity Feed Domain
    [USE_CASE_TOKENS.GetActivityFeedUseCase]: typeof GetActivityFeedUseCase;
    [USE_CASE_TOKENS.CreateActivityUseCase]: typeof CreateActivityUseCase;
    [USE_CASE_TOKENS.AddReactionUseCase]: typeof AddReactionUseCase;

    // Submission Report Domain
    [USE_CASE_TOKENS.CreateReportUseCase]: typeof CreateReportUseCase;
    [USE_CASE_TOKENS.GetReportsUseCase]: typeof GetReportsUseCase;

    // Sponsor Domain
    [USE_CASE_TOKENS.CreateSponsorUseCase]: typeof CreateSponsorUseCase;
    [USE_CASE_TOKENS.GetSponsorUseCase]: typeof GetSponsorUseCase;
    [USE_CASE_TOKENS.UpdateSponsorUseCase]: typeof UpdateSponsorUseCase;
    [USE_CASE_TOKENS.DeleteSponsorUseCase]: typeof DeleteSponsorUseCase;
    [USE_CASE_TOKENS.ListSponsorsUseCase]: typeof ListSponsorsUseCase;
    [USE_CASE_TOKENS.LinkSponsorToTripUseCase]: typeof LinkSponsorToTripUseCase;
    [USE_CASE_TOKENS.UnlinkSponsorFromTripUseCase]: typeof UnlinkSponsorFromTripUseCase;

    // Reward Domain
    [USE_CASE_TOKENS.GetRewardUseCase]: typeof GetRewardUseCase;
    [USE_CASE_TOKENS.CreateRewardUseCase]: typeof CreateRewardUseCase;
    [USE_CASE_TOKENS.UpdateRewardUseCase]: typeof UpdateRewardUseCase;
    [USE_CASE_TOKENS.SetRewardHiddenUseCase]: typeof SetRewardHiddenUseCase;
    [USE_CASE_TOKENS.DeleteRewardUseCase]: typeof DeleteRewardUseCase;
    [USE_CASE_TOKENS.ListRewardsUseCase]: typeof ListRewardsUseCase;
    [USE_CASE_TOKENS.PurchaseRewardUseCase]: typeof PurchaseRewardUseCase;
    [USE_CASE_TOKENS.UpdatePurchaseStatusUseCase]: typeof UpdatePurchaseStatusUseCase;
    [USE_CASE_TOKENS.UpdateMyPurchaseStatusUseCase]: typeof UpdateMyPurchaseStatusUseCase;
    [USE_CASE_TOKENS.GetPurchaseHistoryUseCase]: typeof GetPurchaseHistoryUseCase;

    // Coin Transaction Domain
    [USE_CASE_TOKENS.GetCoinStatisticsUseCase]: typeof GetCoinStatisticsUseCase;
    [USE_CASE_TOKENS.GetMostActiveAdminStatsUseCase]: typeof GetMostActiveAdminStatsUseCase;
    [USE_CASE_TOKENS.GetCoinTransactionsUseCase]: typeof GetCoinTransactionsUseCase;
    [USE_CASE_TOKENS.GetCoinQuickStatsUseCase]: typeof GetCoinQuickStatsUseCase;
    [USE_CASE_TOKENS.GetCoinAdditionalInsightsUseCase]: typeof GetCoinAdditionalInsightsUseCase;
    [USE_CASE_TOKENS.AddCoinsUseCase]: typeof AddCoinsUseCase;
    [USE_CASE_TOKENS.RemoveCoinsUseCase]: typeof RemoveCoinsUseCase;

    // Notification Delivery Domain
    [USE_CASE_TOKENS.GetDeliveriesUseCase]: typeof GetDeliveriesUseCase;
    [USE_CASE_TOKENS.GetDeliveryByNotificationIdUseCase]: typeof GetDeliveryByNotificationIdUseCase;
    [USE_CASE_TOKENS.GetDeliveryStatsUseCase]: typeof GetDeliveryStatsUseCase;
    [USE_CASE_TOKENS.GetFailedDeliveriesUseCase]: typeof GetFailedDeliveriesUseCase;

    // Notification Schedule Domain
    [USE_CASE_TOKENS.GetNotificationSchedulesUseCase]: typeof GetNotificationSchedulesUseCase;
    [USE_CASE_TOKENS.GetNotificationScheduleByIdUseCase]: typeof GetNotificationScheduleByIdUseCase;
    [USE_CASE_TOKENS.CreateNotificationScheduleUseCase]: typeof CreateNotificationScheduleUseCase;
    [USE_CASE_TOKENS.UpdateNotificationScheduleUseCase]: typeof UpdateNotificationScheduleUseCase;
    [USE_CASE_TOKENS.DeleteNotificationScheduleUseCase]: typeof DeleteNotificationScheduleUseCase;
    [USE_CASE_TOKENS.GetActiveNotificationSchedulesUseCase]: typeof GetActiveNotificationSchedulesUseCase;
    [USE_CASE_TOKENS.GetUpcomingNotificationSchedulesUseCase]: typeof GetUpcomingNotificationSchedulesUseCase;
    [USE_CASE_TOKENS.UpdateNotificationScheduleLastRunUseCase]: typeof UpdateNotificationScheduleLastRunUseCase;
    [USE_CASE_TOKENS.ToggleNotificationScheduleActiveUseCase]: typeof ToggleNotificationScheduleActiveUseCase;
    [USE_CASE_TOKENS.BulkToggleNotificationScheduleActiveUseCase]: typeof BulkToggleNotificationScheduleActiveUseCase;
    [USE_CASE_TOKENS.BulkDeleteNotificationSchedulesUseCase]: typeof BulkDeleteNotificationSchedulesUseCase;
    [USE_CASE_TOKENS.DuplicateNotificationScheduleUseCase]: typeof DuplicateNotificationScheduleUseCase;
    [USE_CASE_TOKENS.GetNotificationScheduleExecutionHistoryUseCase]: typeof GetNotificationScheduleExecutionHistoryUseCase;
  };
  exports: UseCaseToken[];
}

// =============================================================================
// Factory Functions for Use Case Creation
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cradle = RepositoryDependencies & Record<string, any>;

// User Domain Factories
function createGetUserUseCase(cradle: Cradle): GetUserUseCase {
  return new GetUserUseCase(cradle.userRepository);
}

function createCreateUserUseCase(cradle: Cradle): CreateUserUseCase {
  return new CreateUserUseCase(cradle.userRepository);
}

function createUpdateUserUseCase(cradle: Cradle): UpdateUserUseCase {
  return new UpdateUserUseCase(cradle.userRepository);
}

// Challenge Domain Factories
function createGetChallengeUseCase(cradle: Cradle): GetChallengeUseCase {
  return new GetChallengeUseCase(cradle.challengeRepository);
}

function createCreateChallengeUseCase(cradle: Cradle): CreateChallengeUseCase {
  return new CreateChallengeUseCase(cradle.challengeRepository);
}

function createUpdateChallengeUseCase(cradle: Cradle): UpdateChallengeUseCase {
  return new UpdateChallengeUseCase(cradle.challengeRepository);
}

function createUpdateChallengeStatusUseCase(
  cradle: Cradle,
): UpdateChallengeStatusUseCase {
  return new UpdateChallengeStatusUseCase(cradle.challengeRepository);
}

// Group Domain Factories
function createGetGroupUseCase(cradle: Cradle): GetGroupUseCase {
  return new GetGroupUseCase(cradle.groupRepository);
}

function createCreateGroupUseCase(cradle: Cradle): CreateGroupUseCase {
  return new CreateGroupUseCase(cradle.groupRepository);
}

function createUpdateGroupUseCase(cradle: Cradle): UpdateGroupUseCase {
  return new UpdateGroupUseCase(cradle.groupRepository);
}

// Challenge Submission Domain Factories
function createCreateSubmissionUseCase(
  cradle: Cradle,
): CreateSubmissionUseCase {
  return new CreateSubmissionUseCase(cradle.challengeSubmissionRepository);
}

function createGetSubmissionUseCase(cradle: Cradle): GetSubmissionUseCase {
  return new GetSubmissionUseCase(cradle.challengeSubmissionRepository);
}

function createGetSubmissionByChallengeAndGroupUseCase(
  cradle: Cradle,
): GetSubmissionByChallengeAndGroupUseCase {
  return new GetSubmissionByChallengeAndGroupUseCase(
    cradle.challengeSubmissionRepository,
  );
}

function createUpdateSubmissionUseCase(
  cradle: Cradle,
): UpdateSubmissionUseCase {
  return new UpdateSubmissionUseCase(cradle.challengeSubmissionRepository);
}

function createDeleteSubmissionUseCase(
  cradle: Cradle,
): DeleteSubmissionUseCase {
  return new DeleteSubmissionUseCase(cradle.challengeSubmissionRepository);
}

function createListSubmissionsByChallengeUseCase(
  cradle: Cradle,
): ListSubmissionsByChallengeUseCase {
  return new ListSubmissionsByChallengeUseCase(
    cradle.challengeSubmissionRepository,
  );
}

// Challenge Vote Domain Factories
function createGetMyVotesUseCase(cradle: Cradle): GetMyVotesUseCase {
  return new GetMyVotesUseCase(cradle.challengeVoteRepository);
}

function createGetVotesByChallengeUseCase(
  cradle: Cradle,
): GetVotesByChallengeUseCase {
  return new GetVotesByChallengeUseCase(cradle.challengeVoteRepository);
}

function createGetChallengeVotingProgressUseCase(
  cradle: Cradle,
): GetChallengeVotingProgressUseCase {
  return new GetChallengeVotingProgressUseCase(cradle.challengeVoteRepository);
}

function createGetJudgedStaffVotingProgressUseCase(
  cradle: Cradle,
): GetJudgedStaffVotingProgressUseCase {
  return new GetJudgedStaffVotingProgressUseCase(
    cradle.challengeVoteRepository,
  );
}

function createSubmitVoteUseCase(cradle: Cradle): SubmitVoteUseCase {
  return new SubmitVoteUseCase(cradle.challengeVoteRepository);
}

function createSubmitVotesUseCase(cradle: Cradle): SubmitVotesUseCase {
  return new SubmitVotesUseCase(cradle.challengeVoteRepository);
}

function createForceEndVotingUseCase(cradle: Cradle): ForceEndVotingUseCase {
  return new ForceEndVotingUseCase(
    cradle.challengeVoteRepository,
    cradle.challengeRepository,
    cradle.challengeSubmissionRepository,
  );
}

// Location Domain Factories
function createGetLocationUseCase(cradle: Cradle): GetLocationUseCase {
  return new GetLocationUseCase(cradle.locationRepository);
}

function createCreateLocationUseCase(cradle: Cradle): CreateLocationUseCase {
  return new CreateLocationUseCase(cradle.locationRepository);
}

function createUpdateLocationUseCase(cradle: Cradle): UpdateLocationUseCase {
  return new UpdateLocationUseCase(cradle.locationRepository);
}

function createListLocationsUseCase(cradle: Cradle): ListLocationsUseCase {
  return new ListLocationsUseCase(cradle.locationRepository);
}

function createUpdateSharingSettingsUseCase(
  cradle: Cradle,
): UpdateSharingSettingsUseCase {
  return new UpdateSharingSettingsUseCase(cradle.locationRepository);
}

function createAddSharingUserUseCase(cradle: Cradle): AddSharingUserUseCase {
  return new AddSharingUserUseCase(cradle.locationRepository);
}

function createRemoveSharingUserUseCase(
  cradle: Cradle,
): RemoveSharingUserUseCase {
  return new RemoveSharingUserUseCase(cradle.locationRepository);
}

function createGetSharingSettingsUseCase(
  cradle: Cradle,
): GetSharingSettingsUseCase {
  return new GetSharingSettingsUseCase(cradle.locationRepository);
}

// Notification Domain Factories
function createGetNotificationUseCase(cradle: Cradle): GetNotificationUseCase {
  return new GetNotificationUseCase(cradle.notificationRepository);
}

// Activity Feed Domain Factories
function createGetActivityFeedUseCase(cradle: Cradle): GetActivityFeedUseCase {
  return new GetActivityFeedUseCase(cradle.activityFeedRepository);
}

function createCreateActivityUseCase(cradle: Cradle): CreateActivityUseCase {
  return new CreateActivityUseCase(cradle.activityFeedRepository);
}

function createAddReactionUseCase(cradle: Cradle): AddReactionUseCase {
  return new AddReactionUseCase(cradle.activityFeedRepository);
}

// Submission Report Domain Factories
function createCreateReportUseCase(cradle: Cradle): CreateReportUseCase {
  return new CreateReportUseCase(cradle.submissionReportRepository);
}

function createGetReportsUseCase(cradle: Cradle): GetReportsUseCase {
  return new GetReportsUseCase(cradle.submissionReportRepository);
}

// Sponsor Domain Factories
function createCreateSponsorUseCase(cradle: Cradle): CreateSponsorUseCase {
  return new CreateSponsorUseCase(cradle.sponsorRepository);
}

function createGetSponsorUseCase(cradle: Cradle): GetSponsorUseCase {
  return new GetSponsorUseCase(cradle.sponsorRepository);
}

function createUpdateSponsorUseCase(cradle: Cradle): UpdateSponsorUseCase {
  return new UpdateSponsorUseCase(cradle.sponsorRepository);
}

function createDeleteSponsorUseCase(cradle: Cradle): DeleteSponsorUseCase {
  return new DeleteSponsorUseCase(cradle.sponsorRepository);
}

function createListSponsorsUseCase(cradle: Cradle): ListSponsorsUseCase {
  return new ListSponsorsUseCase(cradle.sponsorRepository);
}

function createLinkSponsorToTripUseCase(
  cradle: Cradle,
): LinkSponsorToTripUseCase {
  return new LinkSponsorToTripUseCase(cradle.sponsorRepository);
}

function createUnlinkSponsorFromTripUseCase(
  cradle: Cradle,
): UnlinkSponsorFromTripUseCase {
  return new UnlinkSponsorFromTripUseCase(cradle.sponsorRepository);
}

// Reward Domain Factories
function createGetRewardUseCase(cradle: Cradle): GetRewardUseCase {
  return new GetRewardUseCase(cradle.rewardRepository);
}

function createCreateRewardUseCase(cradle: Cradle): CreateRewardUseCase {
  return new CreateRewardUseCase(cradle.rewardRepository);
}

function createUpdateRewardUseCase(cradle: Cradle): UpdateRewardUseCase {
  return new UpdateRewardUseCase(cradle.rewardRepository);
}

function createSetRewardHiddenUseCase(cradle: Cradle): SetRewardHiddenUseCase {
  return new SetRewardHiddenUseCase(cradle.rewardRepository);
}

function createDeleteRewardUseCase(cradle: Cradle): DeleteRewardUseCase {
  return new DeleteRewardUseCase(cradle.rewardRepository);
}

function createListRewardsUseCase(cradle: Cradle): ListRewardsUseCase {
  return new ListRewardsUseCase(
    cradle.rewardRepository,
    cradle.tripPointsCalculator,
  );
}

/**
 * Create PurchaseRewardUseCase with complex dependencies
 *
 * This is a complex use case requiring 5 dependencies:
 * - RewardRepository
 * - RewardPurchaseRepository
 * - TripPointsCalculator
 * - GroupCoinsService
 * - TripAccessChecker
 */
function createPurchaseRewardUseCase(cradle: Cradle): PurchaseRewardUseCase {
  return new PurchaseRewardUseCase(
    cradle.rewardRepository,
    cradle.rewardPurchaseRepository,
    cradle.tripPointsCalculator,
    cradle.groupCoinsService,
    cradle.tripAccessChecker,
  );
}

function createUpdatePurchaseStatusUseCase(
  cradle: Cradle,
): UpdatePurchaseStatusUseCase {
  return new UpdatePurchaseStatusUseCase(cradle.rewardPurchaseRepository);
}

function createUpdateMyPurchaseStatusUseCase(
  cradle: Cradle,
): UpdateMyPurchaseStatusUseCase {
  return new UpdateMyPurchaseStatusUseCase(cradle.rewardPurchaseRepository);
}

function createGetPurchaseHistoryUseCase(
  cradle: Cradle,
): GetPurchaseHistoryUseCase {
  return new GetPurchaseHistoryUseCase(cradle.rewardPurchaseRepository);
}

// Coin Transaction Domain Factories
function createGetCoinStatisticsUseCase(
  cradle: Cradle,
): GetCoinStatisticsUseCase {
  return new GetCoinStatisticsUseCase(cradle.coinTransactionRepository);
}

function createGetMostActiveAdminStatsUseCase(
  cradle: Cradle,
): GetMostActiveAdminStatsUseCase {
  return new GetMostActiveAdminStatsUseCase(cradle.coinTransactionRepository);
}

function createGetCoinTransactionsUseCase(
  cradle: Cradle,
): GetCoinTransactionsUseCase {
  return new GetCoinTransactionsUseCase(cradle.coinTransactionRepository);
}

function createGetCoinQuickStatsUseCase(
  cradle: Cradle,
): GetCoinQuickStatsUseCase {
  return new GetCoinQuickStatsUseCase(cradle.coinTransactionRepository);
}

function createGetCoinAdditionalInsightsUseCase(
  cradle: Cradle,
): GetCoinAdditionalInsightsUseCase {
  return new GetCoinAdditionalInsightsUseCase(cradle.coinTransactionRepository);
}

function createAddCoinsUseCase(cradle: Cradle): AddCoinsUseCase {
  return new AddCoinsUseCase(cradle.coinTransactionRepository);
}

function createRemoveCoinsUseCase(cradle: Cradle): RemoveCoinsUseCase {
  return new RemoveCoinsUseCase(cradle.coinTransactionRepository);
}

// Notification Delivery Domain Factories
function createGetDeliveriesUseCase(cradle: Cradle): GetDeliveriesUseCase {
  return new GetDeliveriesUseCase(cradle.notificationDeliveryRepository);
}

function createGetDeliveryByNotificationIdUseCase(
  cradle: Cradle,
): GetDeliveryByNotificationIdUseCase {
  return new GetDeliveryByNotificationIdUseCase(
    cradle.notificationDeliveryRepository,
  );
}

function createGetDeliveryStatsUseCase(
  cradle: Cradle,
): GetDeliveryStatsUseCase {
  return new GetDeliveryStatsUseCase(cradle.notificationDeliveryRepository);
}

function createGetFailedDeliveriesUseCase(
  cradle: Cradle,
): GetFailedDeliveriesUseCase {
  return new GetFailedDeliveriesUseCase(cradle.notificationDeliveryRepository);
}

// Notification Schedule Domain Factories
function createGetNotificationSchedulesUseCase(
  cradle: Cradle,
): GetNotificationSchedulesUseCase {
  return new GetNotificationSchedulesUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createGetNotificationScheduleByIdUseCase(
  cradle: Cradle,
): GetNotificationScheduleByIdUseCase {
  return new GetNotificationScheduleByIdUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createCreateNotificationScheduleUseCase(
  cradle: Cradle,
): CreateNotificationScheduleUseCase {
  return new CreateNotificationScheduleUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createUpdateNotificationScheduleUseCase(
  cradle: Cradle,
): UpdateNotificationScheduleUseCase {
  return new UpdateNotificationScheduleUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createDeleteNotificationScheduleUseCase(
  cradle: Cradle,
): DeleteNotificationScheduleUseCase {
  return new DeleteNotificationScheduleUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createGetActiveNotificationSchedulesUseCase(
  cradle: Cradle,
): GetActiveNotificationSchedulesUseCase {
  return new GetActiveNotificationSchedulesUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createGetUpcomingNotificationSchedulesUseCase(
  cradle: Cradle,
): GetUpcomingNotificationSchedulesUseCase {
  return new GetUpcomingNotificationSchedulesUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createUpdateNotificationScheduleLastRunUseCase(
  cradle: Cradle,
): UpdateNotificationScheduleLastRunUseCase {
  return new UpdateNotificationScheduleLastRunUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createToggleNotificationScheduleActiveUseCase(
  cradle: Cradle,
): ToggleNotificationScheduleActiveUseCase {
  return new ToggleNotificationScheduleActiveUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createBulkToggleNotificationScheduleActiveUseCase(
  cradle: Cradle,
): BulkToggleNotificationScheduleActiveUseCase {
  return new BulkToggleNotificationScheduleActiveUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createBulkDeleteNotificationSchedulesUseCase(
  cradle: Cradle,
): BulkDeleteNotificationSchedulesUseCase {
  return new BulkDeleteNotificationSchedulesUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createDuplicateNotificationScheduleUseCase(
  cradle: Cradle,
): DuplicateNotificationScheduleUseCase {
  return new DuplicateNotificationScheduleUseCase(
    cradle.notificationScheduleRepository,
  );
}

function createGetNotificationScheduleExecutionHistoryUseCase(
  cradle: Cradle,
): GetNotificationScheduleExecutionHistoryUseCase {
  return new GetNotificationScheduleExecutionHistoryUseCase(
    cradle.notificationScheduleRepository,
  );
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * UseCaseModule - Static module containing all 75 use case providers
 *
 * All use cases are registered with scoped lifetime because:
 * - They may hold request-specific state
 * - Each request should get fresh instances
 * - Prevents cross-request state contamination
 * - Supports request-scoped transaction management
 *
 * The factory pattern is used to inject repository dependencies into each use case.
 * Complex use cases like PurchaseRewardUseCase receive multiple dependencies.
 *
 * @example
 * ```typescript
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { UseCaseModule } from "@mirai-app/use-cases/modules/UseCaseModule";
 * import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
 *
 * const container = initializeContainer([
 *   RepositoryModule,  // Provides all repositories
 *   UseCaseModule,     // Provides all use cases
 * ]);
 *
 * // Resolve a use case
 * const getUserUseCase = container.resolve("getUserUseCase");
 * ```
 */
export const UseCaseModule: StaticModule<UseCaseModuleDef> =
  createStaticModule<UseCaseModuleDef>({
    name: "UseCaseModule",

    providers: {
      // User Domain
      [USE_CASE_TOKENS.GetUserUseCase]: {
        factory: createGetUserUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.CreateUserUseCase]: {
        factory: createCreateUserUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateUserUseCase]: {
        factory: createUpdateUserUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Challenge Domain
      [USE_CASE_TOKENS.GetChallengeUseCase]: {
        factory: createGetChallengeUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.CreateChallengeUseCase]: {
        factory: createCreateChallengeUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateChallengeUseCase]: {
        factory: createUpdateChallengeUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateChallengeStatusUseCase]: {
        factory: createUpdateChallengeStatusUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Group Domain
      [USE_CASE_TOKENS.GetGroupUseCase]: {
        factory: createGetGroupUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.CreateGroupUseCase]: {
        factory: createCreateGroupUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateGroupUseCase]: {
        factory: createUpdateGroupUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Challenge Submission Domain
      [USE_CASE_TOKENS.CreateSubmissionUseCase]: {
        factory: createCreateSubmissionUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetSubmissionUseCase]: {
        factory: createGetSubmissionUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetSubmissionByChallengeAndGroupUseCase]: {
        factory: createGetSubmissionByChallengeAndGroupUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateSubmissionUseCase]: {
        factory: createUpdateSubmissionUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.DeleteSubmissionUseCase]: {
        factory: createDeleteSubmissionUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.ListSubmissionsByChallengeUseCase]: {
        factory: createListSubmissionsByChallengeUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Challenge Vote Domain
      [USE_CASE_TOKENS.GetMyVotesUseCase]: {
        factory: createGetMyVotesUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetVotesByChallengeUseCase]: {
        factory: createGetVotesByChallengeUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetChallengeVotingProgressUseCase]: {
        factory: createGetChallengeVotingProgressUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetJudgedStaffVotingProgressUseCase]: {
        factory: createGetJudgedStaffVotingProgressUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.SubmitVoteUseCase]: {
        factory: createSubmitVoteUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.SubmitVotesUseCase]: {
        factory: createSubmitVotesUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.ForceEndVotingUseCase]: {
        factory: createForceEndVotingUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Location Domain
      [USE_CASE_TOKENS.GetLocationUseCase]: {
        factory: createGetLocationUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.CreateLocationUseCase]: {
        factory: createCreateLocationUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateLocationUseCase]: {
        factory: createUpdateLocationUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.ListLocationsUseCase]: {
        factory: createListLocationsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateSharingSettingsUseCase]: {
        factory: createUpdateSharingSettingsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.AddSharingUserUseCase]: {
        factory: createAddSharingUserUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.RemoveSharingUserUseCase]: {
        factory: createRemoveSharingUserUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetSharingSettingsUseCase]: {
        factory: createGetSharingSettingsUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Notification Domain
      [USE_CASE_TOKENS.GetNotificationUseCase]: {
        factory: createGetNotificationUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Activity Feed Domain
      [USE_CASE_TOKENS.GetActivityFeedUseCase]: {
        factory: createGetActivityFeedUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.CreateActivityUseCase]: {
        factory: createCreateActivityUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.AddReactionUseCase]: {
        factory: createAddReactionUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Submission Report Domain
      [USE_CASE_TOKENS.CreateReportUseCase]: {
        factory: createCreateReportUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetReportsUseCase]: {
        factory: createGetReportsUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Sponsor Domain
      [USE_CASE_TOKENS.CreateSponsorUseCase]: {
        factory: createCreateSponsorUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetSponsorUseCase]: {
        factory: createGetSponsorUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateSponsorUseCase]: {
        factory: createUpdateSponsorUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.DeleteSponsorUseCase]: {
        factory: createDeleteSponsorUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.ListSponsorsUseCase]: {
        factory: createListSponsorsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.LinkSponsorToTripUseCase]: {
        factory: createLinkSponsorToTripUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UnlinkSponsorFromTripUseCase]: {
        factory: createUnlinkSponsorFromTripUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Reward Domain
      [USE_CASE_TOKENS.GetRewardUseCase]: {
        factory: createGetRewardUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.CreateRewardUseCase]: {
        factory: createCreateRewardUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateRewardUseCase]: {
        factory: createUpdateRewardUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.SetRewardHiddenUseCase]: {
        factory: createSetRewardHiddenUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.DeleteRewardUseCase]: {
        factory: createDeleteRewardUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.ListRewardsUseCase]: {
        factory: createListRewardsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.PurchaseRewardUseCase]: {
        factory: createPurchaseRewardUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdatePurchaseStatusUseCase]: {
        factory: createUpdatePurchaseStatusUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateMyPurchaseStatusUseCase]: {
        factory: createUpdateMyPurchaseStatusUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetPurchaseHistoryUseCase]: {
        factory: createGetPurchaseHistoryUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Coin Transaction Domain
      [USE_CASE_TOKENS.GetCoinStatisticsUseCase]: {
        factory: createGetCoinStatisticsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetMostActiveAdminStatsUseCase]: {
        factory: createGetMostActiveAdminStatsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetCoinTransactionsUseCase]: {
        factory: createGetCoinTransactionsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetCoinQuickStatsUseCase]: {
        factory: createGetCoinQuickStatsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetCoinAdditionalInsightsUseCase]: {
        factory: createGetCoinAdditionalInsightsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.AddCoinsUseCase]: {
        factory: createAddCoinsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.RemoveCoinsUseCase]: {
        factory: createRemoveCoinsUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Notification Delivery Domain
      [USE_CASE_TOKENS.GetDeliveriesUseCase]: {
        factory: createGetDeliveriesUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetDeliveryByNotificationIdUseCase]: {
        factory: createGetDeliveryByNotificationIdUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetDeliveryStatsUseCase]: {
        factory: createGetDeliveryStatsUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetFailedDeliveriesUseCase]: {
        factory: createGetFailedDeliveriesUseCase,
        lifetime: Lifetime.SCOPED,
      },

      // Notification Schedule Domain
      [USE_CASE_TOKENS.GetNotificationSchedulesUseCase]: {
        factory: createGetNotificationSchedulesUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetNotificationScheduleByIdUseCase]: {
        factory: createGetNotificationScheduleByIdUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.CreateNotificationScheduleUseCase]: {
        factory: createCreateNotificationScheduleUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateNotificationScheduleUseCase]: {
        factory: createUpdateNotificationScheduleUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.DeleteNotificationScheduleUseCase]: {
        factory: createDeleteNotificationScheduleUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetActiveNotificationSchedulesUseCase]: {
        factory: createGetActiveNotificationSchedulesUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetUpcomingNotificationSchedulesUseCase]: {
        factory: createGetUpcomingNotificationSchedulesUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.UpdateNotificationScheduleLastRunUseCase]: {
        factory: createUpdateNotificationScheduleLastRunUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.ToggleNotificationScheduleActiveUseCase]: {
        factory: createToggleNotificationScheduleActiveUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.BulkToggleNotificationScheduleActiveUseCase]: {
        factory: createBulkToggleNotificationScheduleActiveUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.BulkDeleteNotificationSchedulesUseCase]: {
        factory: createBulkDeleteNotificationSchedulesUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.DuplicateNotificationScheduleUseCase]: {
        factory: createDuplicateNotificationScheduleUseCase,
        lifetime: Lifetime.SCOPED,
      },
      [USE_CASE_TOKENS.GetNotificationScheduleExecutionHistoryUseCase]: {
        factory: createGetNotificationScheduleExecutionHistoryUseCase,
        lifetime: Lifetime.SCOPED,
      },
    },

    exports: [
      // User Domain
      USE_CASE_TOKENS.GetUserUseCase,
      USE_CASE_TOKENS.CreateUserUseCase,
      USE_CASE_TOKENS.UpdateUserUseCase,

      // Challenge Domain
      USE_CASE_TOKENS.GetChallengeUseCase,
      USE_CASE_TOKENS.CreateChallengeUseCase,
      USE_CASE_TOKENS.UpdateChallengeUseCase,
      USE_CASE_TOKENS.UpdateChallengeStatusUseCase,

      // Group Domain
      USE_CASE_TOKENS.GetGroupUseCase,
      USE_CASE_TOKENS.CreateGroupUseCase,
      USE_CASE_TOKENS.UpdateGroupUseCase,

      // Challenge Submission Domain
      USE_CASE_TOKENS.CreateSubmissionUseCase,
      USE_CASE_TOKENS.GetSubmissionUseCase,
      USE_CASE_TOKENS.GetSubmissionByChallengeAndGroupUseCase,
      USE_CASE_TOKENS.UpdateSubmissionUseCase,
      USE_CASE_TOKENS.DeleteSubmissionUseCase,
      USE_CASE_TOKENS.ListSubmissionsByChallengeUseCase,

      // Challenge Vote Domain
      USE_CASE_TOKENS.GetMyVotesUseCase,
      USE_CASE_TOKENS.GetVotesByChallengeUseCase,
      USE_CASE_TOKENS.GetChallengeVotingProgressUseCase,
      USE_CASE_TOKENS.GetJudgedStaffVotingProgressUseCase,
      USE_CASE_TOKENS.SubmitVoteUseCase,
      USE_CASE_TOKENS.SubmitVotesUseCase,
      USE_CASE_TOKENS.ForceEndVotingUseCase,

      // Location Domain
      USE_CASE_TOKENS.GetLocationUseCase,
      USE_CASE_TOKENS.CreateLocationUseCase,
      USE_CASE_TOKENS.UpdateLocationUseCase,
      USE_CASE_TOKENS.ListLocationsUseCase,
      USE_CASE_TOKENS.UpdateSharingSettingsUseCase,
      USE_CASE_TOKENS.AddSharingUserUseCase,
      USE_CASE_TOKENS.RemoveSharingUserUseCase,
      USE_CASE_TOKENS.GetSharingSettingsUseCase,

      // Notification Domain
      USE_CASE_TOKENS.GetNotificationUseCase,

      // Activity Feed Domain
      USE_CASE_TOKENS.GetActivityFeedUseCase,
      USE_CASE_TOKENS.CreateActivityUseCase,
      USE_CASE_TOKENS.AddReactionUseCase,

      // Submission Report Domain
      USE_CASE_TOKENS.CreateReportUseCase,
      USE_CASE_TOKENS.GetReportsUseCase,

      // Sponsor Domain
      USE_CASE_TOKENS.CreateSponsorUseCase,
      USE_CASE_TOKENS.GetSponsorUseCase,
      USE_CASE_TOKENS.UpdateSponsorUseCase,
      USE_CASE_TOKENS.DeleteSponsorUseCase,
      USE_CASE_TOKENS.ListSponsorsUseCase,
      USE_CASE_TOKENS.LinkSponsorToTripUseCase,
      USE_CASE_TOKENS.UnlinkSponsorFromTripUseCase,

      // Reward Domain
      USE_CASE_TOKENS.GetRewardUseCase,
      USE_CASE_TOKENS.CreateRewardUseCase,
      USE_CASE_TOKENS.UpdateRewardUseCase,
      USE_CASE_TOKENS.SetRewardHiddenUseCase,
      USE_CASE_TOKENS.DeleteRewardUseCase,
      USE_CASE_TOKENS.ListRewardsUseCase,
      USE_CASE_TOKENS.PurchaseRewardUseCase,
      USE_CASE_TOKENS.UpdatePurchaseStatusUseCase,
      USE_CASE_TOKENS.UpdateMyPurchaseStatusUseCase,
      USE_CASE_TOKENS.GetPurchaseHistoryUseCase,

      // Coin Transaction Domain
      USE_CASE_TOKENS.GetCoinStatisticsUseCase,
      USE_CASE_TOKENS.GetMostActiveAdminStatsUseCase,
      USE_CASE_TOKENS.GetCoinTransactionsUseCase,
      USE_CASE_TOKENS.GetCoinQuickStatsUseCase,
      USE_CASE_TOKENS.GetCoinAdditionalInsightsUseCase,
      USE_CASE_TOKENS.AddCoinsUseCase,
      USE_CASE_TOKENS.RemoveCoinsUseCase,

      // Notification Delivery Domain
      USE_CASE_TOKENS.GetDeliveriesUseCase,
      USE_CASE_TOKENS.GetDeliveryByNotificationIdUseCase,
      USE_CASE_TOKENS.GetDeliveryStatsUseCase,
      USE_CASE_TOKENS.GetFailedDeliveriesUseCase,

      // Notification Schedule Domain
      USE_CASE_TOKENS.GetNotificationSchedulesUseCase,
      USE_CASE_TOKENS.GetNotificationScheduleByIdUseCase,
      USE_CASE_TOKENS.CreateNotificationScheduleUseCase,
      USE_CASE_TOKENS.UpdateNotificationScheduleUseCase,
      USE_CASE_TOKENS.DeleteNotificationScheduleUseCase,
      USE_CASE_TOKENS.GetActiveNotificationSchedulesUseCase,
      USE_CASE_TOKENS.GetUpcomingNotificationSchedulesUseCase,
      USE_CASE_TOKENS.UpdateNotificationScheduleLastRunUseCase,
      USE_CASE_TOKENS.ToggleNotificationScheduleActiveUseCase,
      USE_CASE_TOKENS.BulkToggleNotificationScheduleActiveUseCase,
      USE_CASE_TOKENS.BulkDeleteNotificationSchedulesUseCase,
      USE_CASE_TOKENS.DuplicateNotificationScheduleUseCase,
      USE_CASE_TOKENS.GetNotificationScheduleExecutionHistoryUseCase,
    ],
  });
