export { createDb, closeDb } from "./client";
export type { DB, TransactionDB } from "./client";
export {
  roleEnum,
  submissionTypeEnum,
  scoringCategoryEnum,
  challengeStatusEnum,
  submissionStatusEnum,
  locationSharingRequestStatusEnum,
  rewardPurchaseStatusEnum,
  tripRoleEnum,
  users,
  trips,
  tripResourceLinks,
  tripResourceFiles,
  tripResourceTexts,
  tripResourceIcons,
  tripInsurances,
  tripInsuranceSteps,
  tripParticipants,
  groups,
  groupJoinRequests,
  rooms,
  challenges,
  challengeRecurrence,
  challengeLocationMatch,
  challengeText,
  challengeQrCode,
  challengeSubmissions,
  challengeVotes,
  submissionReports,
  activityFeeds,
  activityReactions,
  submissionActivities,
  challengeActivities,
  rankChangeActivities,
  userPosts,
  notificationSchedules,
  notifications,
  notificationScheduleExecutions,
  notificationPushes,
  notificationDeliveries,
  pushSubscriptions,
  locations,
  locationSharingRequests,
  locationShares,
  rewards,
  rewardPurchases,
  coinTransactions,
  sponsors,
  tripSponsors,
  tripSponsorDisplay,
  auditLogs,
  // userAgents removed - telemetry table dropped
  usersRelations,
  tripsRelations,
  tripResourceLinksRelations,
  tripResourceFilesRelations,
  tripResourceTextsRelations,
  tripResourceIconsRelations,
  tripInsurancesRelations,
  tripInsuranceStepsRelations,
  tripParticipantsRelations,
  groupsRelations,
  groupJoinRequestsRelations,
  roomsRelations,
  challengesRelations,
  challengeSubmissionsRelations,
  challengeVotesRelations,
  challengeTextRelations,
  challengeQrCodeRelations,
  submissionReportsRelations,
  activityFeedsRelations,
  activityReactionsRelations,
  submissionActivitiesRelations,
  challengeActivitiesRelations,
  rankChangeActivitiesRelations,
  userPostsRelations,
  coinTransactionsRelations,
  notificationSchedulesRelations,
  notificationsRelations,
  notificationScheduleExecutionsRelations,
  notificationPushesRelations,
  notificationDeliveriesRelations,
  pushSubscriptionsRelations,
  locationsRelations,
  locationSharingRequestsRelations,
  locationSharesRelations,
  rewardsRelations,
  rewardPurchasesRelations,
  sponsorsRelations,
  tripSponsorsRelations,
  tripSponsorDisplayRelations,
  auditLogsRelations,
  // userAgentsRelations removed - telemetry table dropped
  schemaTables,
} from "./schema";
export { runMigrations } from "./migrate";

import type { roleEnum } from "./schema/enums";
import type { users } from "./schema/users";
export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];

import type { tripResourceFiles } from "./schema/tripResourceFiles";
import type { tripResourceIcons } from "./schema/tripResourceIcons";
import type { tripResourceLinks } from "./schema/tripResourceLinks";
import type { tripResourceTexts } from "./schema/tripResourceTexts";
import type { tripInsuranceSteps, tripInsurances, tripParticipants, trips } from "./schema/trips";
export type Trip = typeof trips.$inferSelect;
export type TripResourceLink = typeof tripResourceLinks.$inferSelect;
export type TripResourceFile = typeof tripResourceFiles.$inferSelect;
export type TripResourceText = typeof tripResourceTexts.$inferSelect;
export type TripResourceIcon = typeof tripResourceIcons.$inferSelect;
export type TripInsurance = typeof tripInsurances.$inferSelect;
export type TripInsuranceStep = typeof tripInsuranceSteps.$inferSelect;
export type TripParticipant = typeof tripParticipants.$inferSelect;

import type { groupJoinRequests, groups } from "./schema/groups";
export type Group = typeof groups.$inferSelect;
export type GroupJoinRequest = typeof groupJoinRequests.$inferSelect;

import type { rooms } from "./schema/rooms";
export type Room = typeof rooms.$inferSelect;

import type { challengeLocationMatch } from "./schema/challengeLocationMatch";
import type { challengeQrCode } from "./schema/challengeQrCode";
import type { challengeRecurrence } from "./schema/challengeRecurrence";
import type { challengeText } from "./schema/challengeText";
import type {
  challengeSubmissions,
  challengeVotes,
  challenges,
  submissionReports,
} from "./schema/challenges";
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeRecurrence = typeof challengeRecurrence.$inferSelect;
export type ChallengeLocationMatch = typeof challengeLocationMatch.$inferSelect;
export type ChallengeText = typeof challengeText.$inferSelect;
export type ChallengeQrCode = typeof challengeQrCode.$inferSelect;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type ChallengeVote = typeof challengeVotes.$inferSelect;
export type SubmissionReport = typeof submissionReports.$inferSelect;

import type {
  activityFeeds,
  activityReactions,
  challengeActivities,
  rankChangeActivities,
  submissionActivities,
  userPosts,
} from "./schema/activities";
export type ActivityFeed = typeof activityFeeds.$inferSelect;
export type ActivityReaction = typeof activityReactions.$inferSelect;
export type SubmissionActivity = typeof submissionActivities.$inferSelect;
export type ChallengeActivity = typeof challengeActivities.$inferSelect;
export type RankChangeActivity = typeof rankChangeActivities.$inferSelect;
export type UserPost = typeof userPosts.$inferSelect;

import type {
  notificationDeliveries,
  notificationPushes,
  notificationScheduleExecutions,
  notificationSchedules,
  notifications,
  pushSubscriptions,
} from "./schema/notifications";
export type NotificationSchedule = typeof notificationSchedules.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationScheduleExecution = typeof notificationScheduleExecutions.$inferSelect;
export type NotificationPush = typeof notificationPushes.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

import type { locationShares, locationSharingRequests, locations } from "./schema/locations";
export type Location = typeof locations.$inferSelect;
export type LocationSharingRequest = typeof locationSharingRequests.$inferSelect;
export type LocationShare = typeof locationShares.$inferSelect;

import type { coinTransactions, rewardPurchases, rewards } from "./schema/rewards";
export type Reward = typeof rewards.$inferSelect;
export type RewardPurchase = typeof rewardPurchases.$inferSelect;
export type CoinTransaction = typeof coinTransactions.$inferSelect;

import type { sponsors, tripSponsors } from "./schema/sponsors";
import type { tripSponsorDisplay } from "./schema/tripSponsorDisplay";
export type Sponsor = typeof sponsors.$inferSelect;
export type TripSponsor = typeof tripSponsors.$inferSelect;
export type TripSponsorDisplay = typeof tripSponsorDisplay.$inferSelect;

// UserAgent type removed - telemetry table dropped
