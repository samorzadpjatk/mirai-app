/**
 * Root Query Type
 *
 * Defines the root Query type for the GraphQL schema.
 * Individual query fields are registered by importing resolver files
 * that use builder.queryField().
 *
 * @module Query
 */

import { builder } from "../builder";

// =============================================================================
// Import Resolvers
// =============================================================================

/**
 * Import Query type and resolvers
 *
 * This imports all query fields including:
 * - user(id: ID!): User
 * - users(limit: Int, offset: Int): [User!]!
 * - me: User
 * - challengeSubmission(id: ID!): ChallengeSubmission
 * - challengeSubmissionByChallengeAndGroup(challengeId: ID!, groupId: ID!): ChallengeSubmission
 * - challengeSubmissions(challengeId: ID!, ...): ChallengeSubmissionListResult
 * - activitiesByTrip(input: GetByTripInput!): ActivityFeedResult!
 * - activitiesByTripModeration(input: GetByTripModerationInput!): ActivityFeedModerationResult!
 * - activity(id: ID!): Activity
 * - notificationDeliveries(input: GetDeliveriesInput): NotificationDeliveryListResult!
 * - notificationDeliveryByNotificationId(input: GetDeliveryByNotificationIdInput!): NotificationDelivery
 * - deliveryStats(input: GetDeliveryStatsInput): DeliveryStats!
 * - failedDeliveries(input: GetFailedDeliveriesInput): NotificationDeliveryListResult!
 * - trips(pagination: TripPaginationInput): TripListResult!
 * - trip(id: ID!): Trip
 * - tripAdmin(id: ID!): Trip
 * - group(id: ID!): Group
 * - groupsByTrip(tripId: ID!): GroupsConnection!
 * - groupByCode(code: String!): Group
 * - groupsByOrganizer(organizerId: ID!): [Group!]!
 * - groupNamesByTrip(tripId: ID!): [GroupSummary!]!
 * - groupRanking(tripId: ID!): GroupRankingResult!
 * - coinStatistics(input: GetCoinStatisticsInput!): CoinStatistics
 * - mostActiveAdminStats(input: GetMostActiveAdminStatsInput!): MostActiveAdminStats
 * - coinTransactions(input: GetAllCoinTransactionsInput!): CoinTransactionsConnection
 * - coinQuickStats(input: GetCoinQuickStatsInput!): CoinQuickStats
 * - coinAdditionalInsights(input: GetCoinAdditionalInsightsInput!): CoinAdditionalInsights
 * - myCoinTransactions(input: GetUserCoinTransactionsInput!): [CoinTransaction!]!
 * - submissionReports(submissionId: ID!): SubmissionReportListResult
 * - myNotifications(input: NotificationPaginationInput): MyNotificationsResult!
 * - allNotifications(input: GetAllNotificationsInput): AllNotificationsResult!
 * - notification(id: ID!): Notification
 * - notificationSchedule(id: ID!): NotificationSchedule
 * - notificationSchedules(...): NotificationSchedulesConnection!
 * - activeNotificationSchedules(...): [NotificationSchedule!]!
 * - upcomingNotificationSchedules(...): [NotificationSchedule!]!
 * - notificationScheduleExecutionHistory(...): ExecutionHistoryResult!
 * - myLocation: Location
 * - friendsLocations: FriendsLocationsConnection
 * - mySharingSettings: LocationSharingSettings
 * - rewardsByTrip(tripId: ID!, pagination: PaginationInput): RewardsConnection!
 * - rewardsByTripAdmin(tripId: ID!, pagination: PaginationInput): RewardsConnection!
 * - reward(id: ID!): Reward
 * - purchaseHistory(tripId: ID!, pagination: PaginationInput): PurchaseHistoryConnection!
 * - totalAvailablePoints(tripId: ID!): TotalAvailablePointsPayload!
 * - createDownloadUrl(input: CreateDownloadUrlInput!): DownloadUrlResult
 * - createPublicUrl(input: CreatePublicUrlInput!): PublicUrlResult
 * - sponsors: SponsorListResult!
 * - sponsor(id: ID!): Sponsor
 * - sponsorsByTrip(tripId: ID!): [Sponsor!]!
 */
import "../resolvers/User";
import "../resolvers/challengeSubmission";
import "../resolvers/activityFeed";
import "../resolvers/notificationDelivery";
import "../resolvers/trip";
import "../resolvers/group";
import "../resolvers/coinTransaction";
import "../resolvers/submissionReport";
import "../resolvers/notifications";
import "../resolvers/notificationSchedule";
import "../resolvers/location";
import "../resolvers/reward";
import "../resolvers/storage";
import "../resolvers/sponsor";

// =============================================================================
// Query Type Extension (if needed)
// =============================================================================

/**
 * Extend the Query type if additional root fields are needed.
 * Individual domain resolvers should prefer builder.queryField().
 */
builder.queryType({
  description: "Root query type for fetching data",
  authScopes: {
    public: true,
  },
});

// =============================================================================
// Export
// =============================================================================

// Query type is automatically built by the schema
export {};
