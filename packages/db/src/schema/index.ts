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
  roleEnum,
  submissionTypeEnum,
  scoringCategoryEnum,
  challengeStatusEnum,
  submissionStatusEnum,
  locationSharingRequestStatusEnum,
  rewardPurchaseStatusEnum,
  tripRoleEnum,
};
export { users } from "./users";
export {
  trips,
  tripInsurances,
  tripInsuranceSteps,
  tripParticipants,
} from "./trips";
export { tripResourceLinks } from "./tripResourceLinks";
export { tripResourceFiles } from "./tripResourceFiles";
export { tripResourceTexts } from "./tripResourceTexts";
export { tripResourceIcons } from "./tripResourceIcons";
export { groups, groupJoinRequests } from "./groups";
export { rooms } from "./rooms";
export {
  challenges,
  challengeSubmissions,
  challengeVotes,
  submissionReports,
} from "./challenges";
export { challengeRecurrence } from "./challengeRecurrence";
export { challengeLocationMatch } from "./challengeLocationMatch";
export { challengeText } from "./challengeText";
export { challengeQrCode } from "./challengeQrCode";
export {
  activityFeeds,
  activityReactions,
  submissionActivities,
  challengeActivities,
  rankChangeActivities,
  userPosts,
} from "./activities";
export {
  notificationSchedules,
  notifications,
  notificationScheduleExecutions,
  notificationPushes,
  notificationDeliveries,
  pushSubscriptions,
} from "./notifications";
export { locations, locationSharingRequests, locationShares } from "./locations";
export { rewards, rewardPurchases, coinTransactions } from "./rewards";
export { sponsors, tripSponsors } from "./sponsors";
export { tripSponsorDisplay } from "./tripSponsorDisplay";
export { auditLogs } from "./auditLogs";
// userAgents removed - telemetry should not be stored in application database
export {
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
  roomsRelations,
  groupJoinRequestsRelations,
  challengesRelations,
  challengeRecurrenceRelations,
  challengeLocationMatchRelations,
  challengeTextRelations,
  challengeQrCodeRelations,
  challengeSubmissionsRelations,
  challengeVotesRelations,
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
} from "./relations";

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
import { challengeText } from "./challengeText";
import { challengeSubmissions, challengeVotes, challenges, submissionReports } from "./challenges";
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
import { rooms } from "./rooms";
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
export type Room = typeof rooms.$inferSelect;
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
] as const;
