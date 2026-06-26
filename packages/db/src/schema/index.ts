import {
  challengeStatusEnum,
  locationSharingRequestStatusEnum,
  rewardPurchaseStatusEnum,
  roleEnum,
  scoringCategoryEnum,
  submissionStatusEnum,
  submissionTypeEnum,
  tripRoleEnum,
} from "./enums";

export {
  activityFeeds,
  activityReactions,
  challengeActivities,
  rankChangeActivities,
  submissionActivities,
  userPosts,
} from "./activities";
export { auditLogs } from "./auditLogs";
export { challengeLocationMatch } from "./challengeLocationMatch";
export { challengeQrCode } from "./challengeQrCode";
export { challengeRecurrence } from "./challengeRecurrence";
export {
  challengeSubmissions,
  challenges,
  challengeVotes,
  submissionReports,
} from "./challenges";
export { challengeText } from "./challengeText";
export { groupJoinRequests, groups } from "./groups";
export { locationShares, locationSharingRequests, locations } from "./locations";
export {
  notificationDeliveries,
  notificationPushes,
  notificationScheduleExecutions,
  notificationSchedules,
  notifications,
  pushSubscriptions,
} from "./notifications";
// userAgents removed - telemetry should not be stored in application database
export {
  activityFeedsRelations,
  activityReactionsRelations,
  auditLogsRelations,
  challengeActivitiesRelations,
  challengeLocationMatchRelations,
  challengeQrCodeRelations,
  challengeRecurrenceRelations,
  challengeSubmissionsRelations,
  challengesRelations,
  challengeTextRelations,
  challengeVotesRelations,
  coinTransactionsRelations,
  groupJoinRequestsRelations,
  groupsRelations,
  locationSharesRelations,
  locationSharingRequestsRelations,
  locationsRelations,
  notificationDeliveriesRelations,
  notificationPushesRelations,
  notificationScheduleExecutionsRelations,
  notificationSchedulesRelations,
  notificationsRelations,
  pushSubscriptionsRelations,
  rankChangeActivitiesRelations,
  rewardPurchasesRelations,
  rewardsRelations,
  sponsorsRelations,
  submissionActivitiesRelations,
  submissionReportsRelations,
  tripInsuranceStepsRelations,
  tripInsurancesRelations,
  tripParticipantsRelations,
  tripResourceFilesRelations,
  tripResourceIconsRelations,
  tripResourceLinksRelations,
  tripResourceTextsRelations,
  tripSponsorDisplayRelations,
  tripSponsorsRelations,
  tripsRelations,
  userPostsRelations,
  usersRelations,
  // userAgentsRelations removed - telemetry table dropped
} from "./relations";
export { coinTransactions, rewardPurchases, rewards } from "./rewards";
export { sponsors, tripSponsors } from "./sponsors";
export { tripResourceFiles } from "./tripResourceFiles";
export { tripResourceIcons } from "./tripResourceIcons";
export { tripResourceLinks } from "./tripResourceLinks";
export { tripResourceTexts } from "./tripResourceTexts";
export { tripSponsorDisplay } from "./tripSponsorDisplay";
export {
  tripInsuranceSteps,
  tripInsurances,
  tripParticipants,
  trips,
} from "./trips";
export { users } from "./users";
export {
  challengeStatusEnum,
  locationSharingRequestStatusEnum,
  rewardPurchaseStatusEnum,
  roleEnum,
  scoringCategoryEnum,
  submissionStatusEnum,
  submissionTypeEnum,
  tripRoleEnum,
};

import {
  activityFeeds,
  activityReactions,
  challengeActivities,
  rankChangeActivities,
  submissionActivities,
  userPosts,
} from "./activities";
import { auditLogs } from "./auditLogs";
import { challengeLocationMatch } from "./challengeLocationMatch";
import { challengeQrCode } from "./challengeQrCode";
import { challengeRecurrence } from "./challengeRecurrence";
import { challengeSubmissions, challenges, challengeVotes, submissionReports } from "./challenges";
import { challengeText } from "./challengeText";
import { groupJoinRequests, groups } from "./groups";
import { locationShares, locationSharingRequests, locations } from "./locations";
import {
  notificationDeliveries,
  notificationPushes,
  notificationScheduleExecutions,
  notificationSchedules,
  notifications,
  pushSubscriptions,
} from "./notifications";
import { coinTransactions, rewardPurchases, rewards } from "./rewards";
import { sponsors, tripSponsors } from "./sponsors";
import { tripResourceFiles } from "./tripResourceFiles";
import { tripResourceIcons } from "./tripResourceIcons";
import { tripResourceLinks } from "./tripResourceLinks";
import { tripResourceTexts } from "./tripResourceTexts";
import { tripSponsorDisplay } from "./tripSponsorDisplay";
import { tripInsuranceSteps, tripInsurances, tripParticipants, trips } from "./trips";
import { users } from "./users";

export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Trip = typeof trips.$inferSelect;
export type TripResourceLink = typeof tripResourceLinks.$inferSelect;
export type TripResourceFile = typeof tripResourceFiles.$inferSelect;
export type TripResourceText = typeof tripResourceTexts.$inferSelect;
export type TripResourceIcon = typeof tripResourceIcons.$inferSelect;
export type TripInsurance = typeof tripInsurances.$inferSelect;
export type TripInsuranceStep = typeof tripInsuranceSteps.$inferSelect;
export type TripParticipant = typeof tripParticipants.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupJoinRequest = typeof groupJoinRequests.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeRecurrence = typeof challengeRecurrence.$inferSelect;
export type ChallengeLocationMatch = typeof challengeLocationMatch.$inferSelect;
export type ChallengeText = typeof challengeText.$inferSelect;
export type ChallengeQrCode = typeof challengeQrCode.$inferSelect;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type ChallengeVote = typeof challengeVotes.$inferSelect;
export type SubmissionReport = typeof submissionReports.$inferSelect;
export type ActivityFeed = typeof activityFeeds.$inferSelect;
export type ActivityReaction = typeof activityReactions.$inferSelect;
export type SubmissionActivity = typeof submissionActivities.$inferSelect;
export type ChallengeActivity = typeof challengeActivities.$inferSelect;
export type RankChangeActivity = typeof rankChangeActivities.$inferSelect;
export type UserPost = typeof userPosts.$inferSelect;
export type NotificationSchedule = typeof notificationSchedules.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationScheduleExecution = typeof notificationScheduleExecutions.$inferSelect;
export type NotificationPush = typeof notificationPushes.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type LocationSharingRequest = typeof locationSharingRequests.$inferSelect;
export type LocationShare = typeof locationShares.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type RewardPurchase = typeof rewardPurchases.$inferSelect;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
export type TripSponsor = typeof tripSponsors.$inferSelect;
export type TripSponsorDisplay = typeof tripSponsorDisplay.$inferSelect;

export const schemaTables = [
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
] as const;
