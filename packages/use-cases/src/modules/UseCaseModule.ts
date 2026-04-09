/**
 * UseCaseModule - Application Business Logic Module
 *
 * Provides all 75 use case implementations as injectable services using awilix-modular.
 * All use cases are registered with SCOPED lifetime for request isolation.
 *
 * @example
 * ```typescript
 * const getUserUseCase = container.resolve("getUserUseCase");
 * ```
 *
 * @module UseCaseModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

// Domain imports
import { GetUserUseCase } from "../interactors/GetUser";
import { CreateUserUseCase } from "../interactors/CreateUser";
import { UpdateUserUseCase } from "../interactors/UpdateUser";
import { GetChallengeUseCase } from "../interactors/GetChallenge";
import { CreateChallengeUseCase } from "../interactors/CreateChallenge";
import { UpdateChallengeUseCase } from "../interactors/UpdateChallenge";
import { UpdateChallengeStatusUseCase } from "../interactors/UpdateChallengeStatus";
import { GetGroupUseCase } from "../interactors/GetGroup";
import { CreateGroupUseCase } from "../interactors/CreateGroup";
import { UpdateGroupUseCase } from "../interactors/UpdateGroup";
import { CreateSubmissionUseCase } from "../interactors/CreateSubmission";
import { GetSubmissionUseCase } from "../interactors/GetSubmission";
import { GetSubmissionByChallengeAndGroupUseCase } from "../interactors/GetSubmissionByChallengeAndGroup";
import { UpdateSubmissionUseCase } from "../interactors/UpdateSubmission";
import { DeleteSubmissionUseCase } from "../interactors/DeleteSubmission";
import { ListSubmissionsByChallengeUseCase } from "../interactors/ListSubmissionsByChallenge";
import { GetMyVotesUseCase } from "../interactors/GetMyVotes";
import { GetVotesByChallengeUseCase } from "../interactors/GetVotesByChallenge";
import { GetChallengeVotingProgressUseCase } from "../interactors/GetChallengeVotingProgress";
import { GetJudgedStaffVotingProgressUseCase } from "../interactors/GetJudgedStaffVotingProgress";
import { SubmitVoteUseCase } from "../interactors/SubmitVote";
import { SubmitVotesUseCase } from "../interactors/SubmitVotes";
import { ForceEndVotingUseCase } from "../interactors/ForceEndVoting";
import { GetLocationUseCase } from "../interactors/GetLocation";
import { CreateLocationUseCase } from "../interactors/CreateLocation";
import { UpdateLocationUseCase } from "../interactors/UpdateLocation";
import { ListLocationsUseCase } from "../interactors/ListLocations";
import { UpdateSharingSettingsUseCase } from "../interactors/UpdateSharingSettings";
import { AddSharingUserUseCase } from "../interactors/AddSharingUser";
import { RemoveSharingUserUseCase } from "../interactors/RemoveSharingUser";
import { GetSharingSettingsUseCase } from "../interactors/GetSharingSettings";
import { GetNotificationUseCase } from "../interactors/GetNotification";
import { GetActivityFeedUseCase } from "../interactors/GetActivityFeed";
import { CreateActivityUseCase } from "../interactors/CreateActivity";
import { AddReactionUseCase } from "../interactors/AddReaction";
import { CreateReportUseCase } from "../interactors/CreateReport";
import { GetReportsUseCase } from "../interactors/GetReports";
import { CreateSponsorUseCase } from "../interactors/CreateSponsor";
import { GetSponsorUseCase } from "../interactors/GetSponsor";
import { UpdateSponsorUseCase } from "../interactors/UpdateSponsor";
import { DeleteSponsorUseCase } from "../interactors/DeleteSponsor";
import { ListSponsorsUseCase } from "../interactors/ListSponsors";
import { LinkSponsorToTripUseCase } from "../interactors/LinkSponsorToTrip";
import { UnlinkSponsorFromTripUseCase } from "../interactors/UnlinkSponsorFromTrip";
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
import { GetCoinStatisticsUseCase } from "../interactors/GetCoinStatistics";
import { GetMostActiveAdminStatsUseCase } from "../interactors/GetMostActiveAdminStats";
import { GetCoinTransactionsUseCase } from "../interactors/GetCoinTransactions";
import { GetCoinQuickStatsUseCase } from "../interactors/GetCoinQuickStats";
import { GetCoinAdditionalInsightsUseCase } from "../interactors/GetCoinAdditionalInsights";
import { AddCoinsUseCase } from "../interactors/AddCoins";
import { RemoveCoinsUseCase } from "../interactors/RemoveCoins";
import { GetDeliveriesUseCase } from "../interactors/GetDeliveries";
import { GetDeliveryByNotificationIdUseCase } from "../interactors/GetDeliveryByNotificationId";
import { GetDeliveryStatsUseCase } from "../interactors/GetDeliveryStats";
import { GetFailedDeliveriesUseCase } from "../interactors/GetFailedDeliveries";
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

// Port imports for dependency types
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cradle = {
  userRepository: UserRepository;
  challengeRepository: ChallengeRepository;
  challengeSubmissionRepository: ChallengeSubmissionRepository;
  challengeVoteRepository: ChallengeVoteRepository;
  locationRepository: LocationRepository;
  notificationRepository: NotificationRepository;
  activityFeedRepository: ActivityFeedRepository;
  submissionReportRepository: SubmissionReportRepository;
  sponsorRepository: SponsorRepository;
  rewardRepository: RewardRepository;
  rewardPurchaseRepository: RewardPurchaseRepository;
  coinTransactionRepository: CoinTransactionRepository;
  notificationDeliveryRepository: NotificationDeliveryRepository;
  notificationScheduleRepository: NotificationScheduleRepository;
  tripPointsCalculator: TripPointsCalculator;
  groupCoinsService: GroupCoinsService;
  tripAccessChecker: TripAccessChecker;
} & Record<string, any>;

// Injection tokens
export const USE_CASE_TOKENS = {
  GetUserUseCase: "getUserUseCase",
  CreateUserUseCase: "createUserUseCase",
  UpdateUserUseCase: "updateUserUseCase",
  GetChallengeUseCase: "getChallengeUseCase",
  CreateChallengeUseCase: "createChallengeUseCase",
  UpdateChallengeUseCase: "updateChallengeUseCase",
  UpdateChallengeStatusUseCase: "updateChallengeStatusUseCase",
  GetGroupUseCase: "getGroupUseCase",
  CreateGroupUseCase: "createGroupUseCase",
  UpdateGroupUseCase: "updateGroupUseCase",
  CreateSubmissionUseCase: "createSubmissionUseCase",
  GetSubmissionUseCase: "getSubmissionUseCase",
  GetSubmissionByChallengeAndGroupUseCase:
    "getSubmissionByChallengeAndGroupUseCase",
  UpdateSubmissionUseCase: "updateSubmissionUseCase",
  DeleteSubmissionUseCase: "deleteSubmissionUseCase",
  ListSubmissionsByChallengeUseCase: "listSubmissionsByChallengeUseCase",
  GetMyVotesUseCase: "getMyVotesUseCase",
  GetVotesByChallengeUseCase: "getVotesByChallengeUseCase",
  GetChallengeVotingProgressUseCase: "getChallengeVotingProgressUseCase",
  GetJudgedStaffVotingProgressUseCase: "getJudgedStaffVotingProgressUseCase",
  SubmitVoteUseCase: "submitVoteUseCase",
  SubmitVotesUseCase: "submitVotesUseCase",
  ForceEndVotingUseCase: "forceEndVotingUseCase",
  GetLocationUseCase: "getLocationUseCase",
  CreateLocationUseCase: "createLocationUseCase",
  UpdateLocationUseCase: "updateLocationUseCase",
  ListLocationsUseCase: "listLocationsUseCase",
  UpdateSharingSettingsUseCase: "updateSharingSettingsUseCase",
  AddSharingUserUseCase: "addSharingUserUseCase",
  RemoveSharingUserUseCase: "removeSharingUserUseCase",
  GetSharingSettingsUseCase: "getSharingSettingsUseCase",
  GetNotificationUseCase: "getNotificationUseCase",
  GetActivityFeedUseCase: "getActivityFeedUseCase",
  CreateActivityUseCase: "createActivityUseCase",
  AddReactionUseCase: "addReactionUseCase",
  CreateReportUseCase: "createReportUseCase",
  GetReportsUseCase: "getReportsUseCase",
  CreateSponsorUseCase: "createSponsorUseCase",
  GetSponsorUseCase: "getSponsorUseCase",
  UpdateSponsorUseCase: "updateSponsorUseCase",
  DeleteSponsorUseCase: "deleteSponsorUseCase",
  ListSponsorsUseCase: "listSponsorsUseCase",
  LinkSponsorToTripUseCase: "linkSponsorToTripUseCase",
  UnlinkSponsorFromTripUseCase: "unlinkSponsorFromTripUseCase",
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
  GetCoinStatisticsUseCase: "getCoinStatisticsUseCase",
  GetMostActiveAdminStatsUseCase: "getMostActiveAdminStatsUseCase",
  GetCoinTransactionsUseCase: "getCoinTransactionsUseCase",
  GetCoinQuickStatsUseCase: "getCoinQuickStatsUseCase",
  GetCoinAdditionalInsightsUseCase: "getCoinAdditionalInsightsUseCase",
  AddCoinsUseCase: "addCoinsUseCase",
  RemoveCoinsUseCase: "removeCoinsUseCase",
  GetDeliveriesUseCase: "getDeliveriesUseCase",
  GetDeliveryByNotificationIdUseCase: "getDeliveryByNotificationIdUseCase",
  GetDeliveryStatsUseCase: "getDeliveryStatsUseCase",
  GetFailedDeliveriesUseCase: "getFailedDeliveriesUseCase",
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

export type UseCaseToken =
  (typeof USE_CASE_TOKENS)[keyof typeof USE_CASE_TOKENS];

// Module dependencies type for constructor injection
export interface UseCaseModuleDeps {
  [USE_CASE_TOKENS.GetUserUseCase]: GetUserUseCase;
  [USE_CASE_TOKENS.CreateUserUseCase]: CreateUserUseCase;
  [USE_CASE_TOKENS.UpdateUserUseCase]: UpdateUserUseCase;
  [USE_CASE_TOKENS.GetChallengeUseCase]: GetChallengeUseCase;
  [USE_CASE_TOKENS.CreateChallengeUseCase]: CreateChallengeUseCase;
  [USE_CASE_TOKENS.UpdateChallengeUseCase]: UpdateChallengeUseCase;
  [USE_CASE_TOKENS.UpdateChallengeStatusUseCase]: UpdateChallengeStatusUseCase;
  [USE_CASE_TOKENS.GetGroupUseCase]: GetGroupUseCase;
  [USE_CASE_TOKENS.CreateGroupUseCase]: CreateGroupUseCase;
  [USE_CASE_TOKENS.UpdateGroupUseCase]: UpdateGroupUseCase;
  [USE_CASE_TOKENS.CreateSubmissionUseCase]: CreateSubmissionUseCase;
  [USE_CASE_TOKENS.GetSubmissionUseCase]: GetSubmissionUseCase;
  [USE_CASE_TOKENS.GetSubmissionByChallengeAndGroupUseCase]: GetSubmissionByChallengeAndGroupUseCase;
  [USE_CASE_TOKENS.UpdateSubmissionUseCase]: UpdateSubmissionUseCase;
  [USE_CASE_TOKENS.DeleteSubmissionUseCase]: DeleteSubmissionUseCase;
  [USE_CASE_TOKENS.ListSubmissionsByChallengeUseCase]: ListSubmissionsByChallengeUseCase;
  [USE_CASE_TOKENS.GetMyVotesUseCase]: GetMyVotesUseCase;
  [USE_CASE_TOKENS.GetVotesByChallengeUseCase]: GetVotesByChallengeUseCase;
  [USE_CASE_TOKENS.GetChallengeVotingProgressUseCase]: GetChallengeVotingProgressUseCase;
  [USE_CASE_TOKENS.GetJudgedStaffVotingProgressUseCase]: GetJudgedStaffVotingProgressUseCase;
  [USE_CASE_TOKENS.SubmitVoteUseCase]: SubmitVoteUseCase;
  [USE_CASE_TOKENS.SubmitVotesUseCase]: SubmitVotesUseCase;
  [USE_CASE_TOKENS.ForceEndVotingUseCase]: ForceEndVotingUseCase;
  [USE_CASE_TOKENS.GetLocationUseCase]: GetLocationUseCase;
  [USE_CASE_TOKENS.CreateLocationUseCase]: CreateLocationUseCase;
  [USE_CASE_TOKENS.UpdateLocationUseCase]: UpdateLocationUseCase;
  [USE_CASE_TOKENS.ListLocationsUseCase]: ListLocationsUseCase;
  [USE_CASE_TOKENS.UpdateSharingSettingsUseCase]: UpdateSharingSettingsUseCase;
  [USE_CASE_TOKENS.AddSharingUserUseCase]: AddSharingUserUseCase;
  [USE_CASE_TOKENS.RemoveSharingUserUseCase]: RemoveSharingUserUseCase;
  [USE_CASE_TOKENS.GetSharingSettingsUseCase]: GetSharingSettingsUseCase;
  [USE_CASE_TOKENS.GetNotificationUseCase]: GetNotificationUseCase;
  [USE_CASE_TOKENS.GetActivityFeedUseCase]: GetActivityFeedUseCase;
  [USE_CASE_TOKENS.CreateActivityUseCase]: CreateActivityUseCase;
  [USE_CASE_TOKENS.AddReactionUseCase]: AddReactionUseCase;
  [USE_CASE_TOKENS.CreateReportUseCase]: CreateReportUseCase;
  [USE_CASE_TOKENS.GetReportsUseCase]: GetReportsUseCase;
  [USE_CASE_TOKENS.CreateSponsorUseCase]: CreateSponsorUseCase;
  [USE_CASE_TOKENS.GetSponsorUseCase]: GetSponsorUseCase;
  [USE_CASE_TOKENS.UpdateSponsorUseCase]: UpdateSponsorUseCase;
  [USE_CASE_TOKENS.DeleteSponsorUseCase]: DeleteSponsorUseCase;
  [USE_CASE_TOKENS.ListSponsorsUseCase]: ListSponsorsUseCase;
  [USE_CASE_TOKENS.LinkSponsorToTripUseCase]: LinkSponsorToTripUseCase;
  [USE_CASE_TOKENS.UnlinkSponsorFromTripUseCase]: UnlinkSponsorFromTripUseCase;
  [USE_CASE_TOKENS.GetRewardUseCase]: GetRewardUseCase;
  [USE_CASE_TOKENS.CreateRewardUseCase]: CreateRewardUseCase;
  [USE_CASE_TOKENS.UpdateRewardUseCase]: UpdateRewardUseCase;
  [USE_CASE_TOKENS.SetRewardHiddenUseCase]: SetRewardHiddenUseCase;
  [USE_CASE_TOKENS.DeleteRewardUseCase]: DeleteRewardUseCase;
  [USE_CASE_TOKENS.ListRewardsUseCase]: ListRewardsUseCase;
  [USE_CASE_TOKENS.PurchaseRewardUseCase]: PurchaseRewardUseCase;
  [USE_CASE_TOKENS.UpdatePurchaseStatusUseCase]: UpdatePurchaseStatusUseCase;
  [USE_CASE_TOKENS.UpdateMyPurchaseStatusUseCase]: UpdateMyPurchaseStatusUseCase;
  [USE_CASE_TOKENS.GetPurchaseHistoryUseCase]: GetPurchaseHistoryUseCase;
  [USE_CASE_TOKENS.GetCoinStatisticsUseCase]: GetCoinStatisticsUseCase;
  [USE_CASE_TOKENS.GetMostActiveAdminStatsUseCase]: GetMostActiveAdminStatsUseCase;
  [USE_CASE_TOKENS.GetCoinTransactionsUseCase]: GetCoinTransactionsUseCase;
  [USE_CASE_TOKENS.GetCoinQuickStatsUseCase]: GetCoinQuickStatsUseCase;
  [USE_CASE_TOKENS.GetCoinAdditionalInsightsUseCase]: GetCoinAdditionalInsightsUseCase;
  [USE_CASE_TOKENS.AddCoinsUseCase]: AddCoinsUseCase;
  [USE_CASE_TOKENS.RemoveCoinsUseCase]: RemoveCoinsUseCase;
  [USE_CASE_TOKENS.GetDeliveriesUseCase]: GetDeliveriesUseCase;
  [USE_CASE_TOKENS.GetDeliveryByNotificationIdUseCase]: GetDeliveryByNotificationIdUseCase;
  [USE_CASE_TOKENS.GetDeliveryStatsUseCase]: GetDeliveryStatsUseCase;
  [USE_CASE_TOKENS.GetFailedDeliveriesUseCase]: GetFailedDeliveriesUseCase;
  [USE_CASE_TOKENS.GetNotificationSchedulesUseCase]: GetNotificationSchedulesUseCase;
  [USE_CASE_TOKENS.GetNotificationScheduleByIdUseCase]: GetNotificationScheduleByIdUseCase;
  [USE_CASE_TOKENS.CreateNotificationScheduleUseCase]: CreateNotificationScheduleUseCase;
  [USE_CASE_TOKENS.UpdateNotificationScheduleUseCase]: UpdateNotificationScheduleUseCase;
  [USE_CASE_TOKENS.DeleteNotificationScheduleUseCase]: DeleteNotificationScheduleUseCase;
  [USE_CASE_TOKENS.GetActiveNotificationSchedulesUseCase]: GetActiveNotificationSchedulesUseCase;
  [USE_CASE_TOKENS.GetUpcomingNotificationSchedulesUseCase]: GetUpcomingNotificationSchedulesUseCase;
  [USE_CASE_TOKENS.UpdateNotificationScheduleLastRunUseCase]: UpdateNotificationScheduleLastRunUseCase;
  [USE_CASE_TOKENS.ToggleNotificationScheduleActiveUseCase]: ToggleNotificationScheduleActiveUseCase;
  [USE_CASE_TOKENS.BulkToggleNotificationScheduleActiveUseCase]: BulkToggleNotificationScheduleActiveUseCase;
  [USE_CASE_TOKENS.BulkDeleteNotificationSchedulesUseCase]: BulkDeleteNotificationSchedulesUseCase;
  [USE_CASE_TOKENS.DuplicateNotificationScheduleUseCase]: DuplicateNotificationScheduleUseCase;
  [USE_CASE_TOKENS.GetNotificationScheduleExecutionHistoryUseCase]: GetNotificationScheduleExecutionHistoryUseCase;
}

// Use case type mapping for module definition
type UseCaseClass =
  | typeof GetUserUseCase
  | typeof CreateUserUseCase
  | typeof UpdateUserUseCase
  | typeof GetChallengeUseCase
  | typeof CreateChallengeUseCase
  | typeof UpdateChallengeUseCase
  | typeof UpdateChallengeStatusUseCase
  | typeof GetGroupUseCase
  | typeof CreateGroupUseCase
  | typeof UpdateGroupUseCase
  | typeof CreateSubmissionUseCase
  | typeof GetSubmissionUseCase
  | typeof GetSubmissionByChallengeAndGroupUseCase
  | typeof UpdateSubmissionUseCase
  | typeof DeleteSubmissionUseCase
  | typeof ListSubmissionsByChallengeUseCase
  | typeof GetMyVotesUseCase
  | typeof GetVotesByChallengeUseCase
  | typeof GetChallengeVotingProgressUseCase
  | typeof GetJudgedStaffVotingProgressUseCase
  | typeof SubmitVoteUseCase
  | typeof SubmitVotesUseCase
  | typeof ForceEndVotingUseCase
  | typeof GetLocationUseCase
  | typeof CreateLocationUseCase
  | typeof UpdateLocationUseCase
  | typeof ListLocationsUseCase
  | typeof UpdateSharingSettingsUseCase
  | typeof AddSharingUserUseCase
  | typeof RemoveSharingUserUseCase
  | typeof GetSharingSettingsUseCase
  | typeof GetNotificationUseCase
  | typeof GetActivityFeedUseCase
  | typeof CreateActivityUseCase
  | typeof AddReactionUseCase
  | typeof CreateReportUseCase
  | typeof GetReportsUseCase
  | typeof CreateSponsorUseCase
  | typeof GetSponsorUseCase
  | typeof UpdateSponsorUseCase
  | typeof DeleteSponsorUseCase
  | typeof ListSponsorsUseCase
  | typeof LinkSponsorToTripUseCase
  | typeof UnlinkSponsorFromTripUseCase
  | typeof GetRewardUseCase
  | typeof CreateRewardUseCase
  | typeof UpdateRewardUseCase
  | typeof SetRewardHiddenUseCase
  | typeof DeleteRewardUseCase
  | typeof ListRewardsUseCase
  | typeof PurchaseRewardUseCase
  | typeof UpdatePurchaseStatusUseCase
  | typeof UpdateMyPurchaseStatusUseCase
  | typeof GetPurchaseHistoryUseCase
  | typeof GetCoinStatisticsUseCase
  | typeof GetMostActiveAdminStatsUseCase
  | typeof GetCoinTransactionsUseCase
  | typeof GetCoinQuickStatsUseCase
  | typeof GetCoinAdditionalInsightsUseCase
  | typeof AddCoinsUseCase
  | typeof RemoveCoinsUseCase
  | typeof GetDeliveriesUseCase
  | typeof GetDeliveryByNotificationIdUseCase
  | typeof GetDeliveryStatsUseCase
  | typeof GetFailedDeliveriesUseCase
  | typeof GetNotificationSchedulesUseCase
  | typeof GetNotificationScheduleByIdUseCase
  | typeof CreateNotificationScheduleUseCase
  | typeof UpdateNotificationScheduleUseCase
  | typeof DeleteNotificationScheduleUseCase
  | typeof GetActiveNotificationSchedulesUseCase
  | typeof GetUpcomingNotificationSchedulesUseCase
  | typeof UpdateNotificationScheduleLastRunUseCase
  | typeof ToggleNotificationScheduleActiveUseCase
  | typeof BulkToggleNotificationScheduleActiveUseCase
  | typeof BulkDeleteNotificationSchedulesUseCase
  | typeof DuplicateNotificationScheduleUseCase
  | typeof GetNotificationScheduleExecutionHistoryUseCase;

// Module definition type
export interface UseCaseModuleDef {
  name: "UseCaseModule";
  providers: Record<UseCaseToken, UseCaseClass>;
  exports: UseCaseToken[];
}

// Factory helper
const scoped = <T>(factory: (cradle: Cradle) => T) => ({
  factory,
  lifetime: Lifetime.SCOPED,
});

// Module export
export const UseCaseModule: StaticModule<UseCaseModuleDef> =
  createStaticModule<UseCaseModuleDef>({
    name: "UseCaseModule",
    providers: {
      [USE_CASE_TOKENS.GetUserUseCase]: scoped(
        (c) => new GetUserUseCase(c.userRepository),
      ),
      [USE_CASE_TOKENS.CreateUserUseCase]: scoped(
        (c) => new CreateUserUseCase(c.userRepository),
      ),
      [USE_CASE_TOKENS.UpdateUserUseCase]: scoped(
        (c) => new UpdateUserUseCase(c.userRepository),
      ),
      [USE_CASE_TOKENS.GetChallengeUseCase]: scoped(
        (c) => new GetChallengeUseCase(c.challengeRepository),
      ),
      [USE_CASE_TOKENS.CreateChallengeUseCase]: scoped(
        (c) => new CreateChallengeUseCase(c.challengeRepository),
      ),
      [USE_CASE_TOKENS.UpdateChallengeUseCase]: scoped(
        (c) => new UpdateChallengeUseCase(c.challengeRepository),
      ),
      [USE_CASE_TOKENS.UpdateChallengeStatusUseCase]: scoped(
        (c) => new UpdateChallengeStatusUseCase(c.challengeRepository),
      ),
      [USE_CASE_TOKENS.GetGroupUseCase]: scoped(
        (c) => new GetGroupUseCase(c.groupRepository),
      ),
      [USE_CASE_TOKENS.CreateGroupUseCase]: scoped(
        (c) => new CreateGroupUseCase(c.groupRepository),
      ),
      [USE_CASE_TOKENS.UpdateGroupUseCase]: scoped(
        (c) => new UpdateGroupUseCase(c.groupRepository),
      ),
      [USE_CASE_TOKENS.CreateSubmissionUseCase]: scoped(
        (c) => new CreateSubmissionUseCase(c.challengeSubmissionRepository),
      ),
      [USE_CASE_TOKENS.GetSubmissionUseCase]: scoped(
        (c) => new GetSubmissionUseCase(c.challengeSubmissionRepository),
      ),
      [USE_CASE_TOKENS.GetSubmissionByChallengeAndGroupUseCase]: scoped(
        (c) =>
          new GetSubmissionByChallengeAndGroupUseCase(
            c.challengeSubmissionRepository,
          ),
      ),
      [USE_CASE_TOKENS.UpdateSubmissionUseCase]: scoped(
        (c) => new UpdateSubmissionUseCase(c.challengeSubmissionRepository),
      ),
      [USE_CASE_TOKENS.DeleteSubmissionUseCase]: scoped(
        (c) => new DeleteSubmissionUseCase(c.challengeSubmissionRepository),
      ),
      [USE_CASE_TOKENS.ListSubmissionsByChallengeUseCase]: scoped(
        (c) =>
          new ListSubmissionsByChallengeUseCase(
            c.challengeSubmissionRepository,
          ),
      ),
      [USE_CASE_TOKENS.GetMyVotesUseCase]: scoped(
        (c) => new GetMyVotesUseCase(c.challengeVoteRepository),
      ),
      [USE_CASE_TOKENS.GetVotesByChallengeUseCase]: scoped(
        (c) => new GetVotesByChallengeUseCase(c.challengeVoteRepository),
      ),
      [USE_CASE_TOKENS.GetChallengeVotingProgressUseCase]: scoped(
        (c) => new GetChallengeVotingProgressUseCase(c.challengeVoteRepository),
      ),
      [USE_CASE_TOKENS.GetJudgedStaffVotingProgressUseCase]: scoped(
        (c) =>
          new GetJudgedStaffVotingProgressUseCase(c.challengeVoteRepository),
      ),
      [USE_CASE_TOKENS.SubmitVoteUseCase]: scoped(
        (c) => new SubmitVoteUseCase(c.challengeVoteRepository),
      ),
      [USE_CASE_TOKENS.SubmitVotesUseCase]: scoped(
        (c) => new SubmitVotesUseCase(c.challengeVoteRepository),
      ),
      [USE_CASE_TOKENS.ForceEndVotingUseCase]: scoped(
        (c) =>
          new ForceEndVotingUseCase(
            c.challengeVoteRepository,
            c.challengeRepository,
            c.challengeSubmissionRepository,
          ),
      ),
      [USE_CASE_TOKENS.GetLocationUseCase]: scoped(
        (c) => new GetLocationUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.CreateLocationUseCase]: scoped(
        (c) => new CreateLocationUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.UpdateLocationUseCase]: scoped(
        (c) => new UpdateLocationUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.ListLocationsUseCase]: scoped(
        (c) => new ListLocationsUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.UpdateSharingSettingsUseCase]: scoped(
        (c) => new UpdateSharingSettingsUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.AddSharingUserUseCase]: scoped(
        (c) => new AddSharingUserUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.RemoveSharingUserUseCase]: scoped(
        (c) => new RemoveSharingUserUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.GetSharingSettingsUseCase]: scoped(
        (c) => new GetSharingSettingsUseCase(c.locationRepository),
      ),
      [USE_CASE_TOKENS.GetNotificationUseCase]: scoped(
        (c) => new GetNotificationUseCase(c.notificationRepository),
      ),
      [USE_CASE_TOKENS.GetActivityFeedUseCase]: scoped(
        (c) => new GetActivityFeedUseCase(c.activityFeedRepository),
      ),
      [USE_CASE_TOKENS.CreateActivityUseCase]: scoped(
        (c) => new CreateActivityUseCase(c.activityFeedRepository),
      ),
      [USE_CASE_TOKENS.AddReactionUseCase]: scoped(
        (c) => new AddReactionUseCase(c.activityFeedRepository),
      ),
      [USE_CASE_TOKENS.CreateReportUseCase]: scoped(
        (c) => new CreateReportUseCase(c.submissionReportRepository),
      ),
      [USE_CASE_TOKENS.GetReportsUseCase]: scoped(
        (c) => new GetReportsUseCase(c.submissionReportRepository),
      ),
      [USE_CASE_TOKENS.CreateSponsorUseCase]: scoped(
        (c) => new CreateSponsorUseCase(c.sponsorRepository),
      ),
      [USE_CASE_TOKENS.GetSponsorUseCase]: scoped(
        (c) => new GetSponsorUseCase(c.sponsorRepository),
      ),
      [USE_CASE_TOKENS.UpdateSponsorUseCase]: scoped(
        (c) => new UpdateSponsorUseCase(c.sponsorRepository),
      ),
      [USE_CASE_TOKENS.DeleteSponsorUseCase]: scoped(
        (c) => new DeleteSponsorUseCase(c.sponsorRepository),
      ),
      [USE_CASE_TOKENS.ListSponsorsUseCase]: scoped(
        (c) => new ListSponsorsUseCase(c.sponsorRepository),
      ),
      [USE_CASE_TOKENS.LinkSponsorToTripUseCase]: scoped(
        (c) => new LinkSponsorToTripUseCase(c.sponsorRepository),
      ),
      [USE_CASE_TOKENS.UnlinkSponsorFromTripUseCase]: scoped(
        (c) => new UnlinkSponsorFromTripUseCase(c.sponsorRepository),
      ),
      [USE_CASE_TOKENS.GetRewardUseCase]: scoped(
        (c) => new GetRewardUseCase(c.rewardRepository),
      ),
      [USE_CASE_TOKENS.CreateRewardUseCase]: scoped(
        (c) => new CreateRewardUseCase(c.rewardRepository),
      ),
      [USE_CASE_TOKENS.UpdateRewardUseCase]: scoped(
        (c) => new UpdateRewardUseCase(c.rewardRepository),
      ),
      [USE_CASE_TOKENS.SetRewardHiddenUseCase]: scoped(
        (c) => new SetRewardHiddenUseCase(c.rewardRepository),
      ),
      [USE_CASE_TOKENS.DeleteRewardUseCase]: scoped(
        (c) => new DeleteRewardUseCase(c.rewardRepository),
      ),
      [USE_CASE_TOKENS.ListRewardsUseCase]: scoped(
        (c) =>
          new ListRewardsUseCase(c.rewardRepository, c.tripPointsCalculator),
      ),
      [USE_CASE_TOKENS.PurchaseRewardUseCase]: scoped(
        (c) =>
          new PurchaseRewardUseCase(
            c.rewardRepository,
            c.rewardPurchaseRepository,
            c.tripPointsCalculator,
            c.groupCoinsService,
            c.tripAccessChecker,
          ),
      ),
      [USE_CASE_TOKENS.UpdatePurchaseStatusUseCase]: scoped(
        (c) => new UpdatePurchaseStatusUseCase(c.rewardPurchaseRepository),
      ),
      [USE_CASE_TOKENS.UpdateMyPurchaseStatusUseCase]: scoped(
        (c) => new UpdateMyPurchaseStatusUseCase(c.rewardPurchaseRepository),
      ),
      [USE_CASE_TOKENS.GetPurchaseHistoryUseCase]: scoped(
        (c) => new GetPurchaseHistoryUseCase(c.rewardPurchaseRepository),
      ),
      [USE_CASE_TOKENS.GetCoinStatisticsUseCase]: scoped(
        (c) => new GetCoinStatisticsUseCase(c.coinTransactionRepository),
      ),
      [USE_CASE_TOKENS.GetMostActiveAdminStatsUseCase]: scoped(
        (c) => new GetMostActiveAdminStatsUseCase(c.coinTransactionRepository),
      ),
      [USE_CASE_TOKENS.GetCoinTransactionsUseCase]: scoped(
        (c) => new GetCoinTransactionsUseCase(c.coinTransactionRepository),
      ),
      [USE_CASE_TOKENS.GetCoinQuickStatsUseCase]: scoped(
        (c) => new GetCoinQuickStatsUseCase(c.coinTransactionRepository),
      ),
      [USE_CASE_TOKENS.GetCoinAdditionalInsightsUseCase]: scoped(
        (c) =>
          new GetCoinAdditionalInsightsUseCase(c.coinTransactionRepository),
      ),
      [USE_CASE_TOKENS.AddCoinsUseCase]: scoped(
        (c) => new AddCoinsUseCase(c.coinTransactionRepository),
      ),
      [USE_CASE_TOKENS.RemoveCoinsUseCase]: scoped(
        (c) => new RemoveCoinsUseCase(c.coinTransactionRepository),
      ),
      [USE_CASE_TOKENS.GetDeliveriesUseCase]: scoped(
        (c) => new GetDeliveriesUseCase(c.notificationDeliveryRepository),
      ),
      [USE_CASE_TOKENS.GetDeliveryByNotificationIdUseCase]: scoped(
        (c) =>
          new GetDeliveryByNotificationIdUseCase(
            c.notificationDeliveryRepository,
          ),
      ),
      [USE_CASE_TOKENS.GetDeliveryStatsUseCase]: scoped(
        (c) => new GetDeliveryStatsUseCase(c.notificationDeliveryRepository),
      ),
      [USE_CASE_TOKENS.GetFailedDeliveriesUseCase]: scoped(
        (c) => new GetFailedDeliveriesUseCase(c.notificationDeliveryRepository),
      ),
      [USE_CASE_TOKENS.GetNotificationSchedulesUseCase]: scoped(
        (c) =>
          new GetNotificationSchedulesUseCase(c.notificationScheduleRepository),
      ),
      [USE_CASE_TOKENS.GetNotificationScheduleByIdUseCase]: scoped(
        (c) =>
          new GetNotificationScheduleByIdUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.CreateNotificationScheduleUseCase]: scoped(
        (c) =>
          new CreateNotificationScheduleUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.UpdateNotificationScheduleUseCase]: scoped(
        (c) =>
          new UpdateNotificationScheduleUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.DeleteNotificationScheduleUseCase]: scoped(
        (c) =>
          new DeleteNotificationScheduleUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.GetActiveNotificationSchedulesUseCase]: scoped(
        (c) =>
          new GetActiveNotificationSchedulesUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.GetUpcomingNotificationSchedulesUseCase]: scoped(
        (c) =>
          new GetUpcomingNotificationSchedulesUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.UpdateNotificationScheduleLastRunUseCase]: scoped(
        (c) =>
          new UpdateNotificationScheduleLastRunUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.ToggleNotificationScheduleActiveUseCase]: scoped(
        (c) =>
          new ToggleNotificationScheduleActiveUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.BulkToggleNotificationScheduleActiveUseCase]: scoped(
        (c) =>
          new BulkToggleNotificationScheduleActiveUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.BulkDeleteNotificationSchedulesUseCase]: scoped(
        (c) =>
          new BulkDeleteNotificationSchedulesUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.DuplicateNotificationScheduleUseCase]: scoped(
        (c) =>
          new DuplicateNotificationScheduleUseCase(
            c.notificationScheduleRepository,
          ),
      ),
      [USE_CASE_TOKENS.GetNotificationScheduleExecutionHistoryUseCase]: scoped(
        (c) =>
          new GetNotificationScheduleExecutionHistoryUseCase(
            c.notificationScheduleRepository,
          ),
      ),
    },
    exports: Object.values(USE_CASE_TOKENS),
  });
