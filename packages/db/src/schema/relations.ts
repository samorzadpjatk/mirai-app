import { relations } from "drizzle-orm";
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
import { sponsors, tripSponsors } from "./sponsors";
import { tripResourceFiles } from "./tripResourceFiles";
import { tripResourceIcons } from "./tripResourceIcons";
import { tripResourceLinks } from "./tripResourceLinks";
import { tripResourceTexts } from "./tripResourceTexts";
import { tripSponsorDisplay } from "./tripSponsorDisplay";
import { tripInsuranceSteps, tripInsurances, tripParticipants, trips } from "./trips";
import { users } from "./users";

export const usersRelations = relations(users, ({ one, many }) => ({
  organizerGroup: many(groups),
  coinTransactionsAdmin: many(coinTransactions, {
    relationName: "UserCoinTransactionsAdmin",
  }),
  notificationSchedules: many(notificationSchedules, {
    relationName: "NotificationScheduleAdmin",
  }),
  receivedPushNotifications: many(notificationPushes),
  sentPushNotifications: many(notifications, {
    relationName: "NotificationAdmin",
  }),
  pushSubscriptions: many(pushSubscriptions),
  location: one(locations),
  locationsSharedWithMe: many(locationShares),
  sentLocationRequests: many(locationSharingRequests, {
    relationName: "SentLocationSharingRequests",
  }),
  receivedLocationRequests: many(locationSharingRequests, {
    relationName: "ReceivedLocationSharingRequests",
  }),
  trips: many(tripParticipants),
  activityFeedAdmin: many(activityFeeds, {
    relationName: "ActivityFeedAdmin",
  }),
  activityFeedHidden: many(activityFeeds, {
    relationName: "ActivityFeedHiddenBy",
  }),
  activityReactions: many(activityReactions, {
    relationName: "ActivityReactionUser",
  }),
  challengeSubmissions: many(challengeSubmissions),
  createdRewards: many(rewards, { relationName: "RewardCreator" }),
  rewardPurchases: many(rewardPurchases, {
    relationName: "RewardPurchaser",
  }),
  rewardPurchaseStatusUpdates: many(rewardPurchases, {
    relationName: "RewardPurchaseStatusUpdater",
  }),
  groupJoinRequests: many(groupJoinRequests),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  tripResourceLinks: many(tripResourceLinks),
  tripResourceFiles: many(tripResourceFiles),
  tripResourceTexts: many(tripResourceTexts),
  tripResourceIcons: many(tripResourceIcons),
  participants: many(tripParticipants),
  notifications: many(notifications),
  notificationSchedules: many(notificationSchedules),
  notificationDeliveries: many(notificationDeliveries),
  challenges: many(challenges),
  rewards: many(rewards),
  activityFeed: many(activityFeeds),
  groupJoinRequests: many(groupJoinRequests),
  tripSponsors: many(tripSponsors),
  tripSponsorDisplays: many(tripSponsorDisplay),
  tripInsurance: one(tripInsurances),
  groups: many(groups),
}));

export const tripResourceLinksRelations = relations(tripResourceLinks, ({ one }) => ({
  trip: one(trips, {
    fields: [tripResourceLinks.tripId],
    references: [trips.id],
  }),
}));

export const tripResourceFilesRelations = relations(tripResourceFiles, ({ one }) => ({
  trip: one(trips, {
    fields: [tripResourceFiles.tripId],
    references: [trips.id],
  }),
}));

export const tripResourceTextsRelations = relations(tripResourceTexts, ({ one }) => ({
  trip: one(trips, {
    fields: [tripResourceTexts.tripId],
    references: [trips.id],
  }),
}));

export const tripResourceIconsRelations = relations(tripResourceIcons, ({ one }) => ({
  trip: one(trips, {
    fields: [tripResourceIcons.tripId],
    references: [trips.id],
  }),
}));

export const tripInsurancesRelations = relations(tripInsurances, ({ one, many }) => ({
  trip: one(trips, {
    fields: [tripInsurances.tripId],
    references: [trips.id],
  }),
  steps: many(tripInsuranceSteps),
}));

export const tripInsuranceStepsRelations = relations(tripInsuranceSteps, ({ one }) => ({
  insurance: one(tripInsurances, {
    fields: [tripInsuranceSteps.insuranceId],
    references: [tripInsurances.id],
  }),
}));

export const tripParticipantsRelations = relations(tripParticipants, ({ one, many }) => ({
  user: one(users, {
    fields: [tripParticipants.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [tripParticipants.tripId],
    references: [trips.id],
  }),
  group: one(groups, {
    fields: [tripParticipants.groupId],
    references: [groups.id],
  }),
  challengeVotes: many(challengeVotes),
  submissionReports: many(submissionReports),
  userPosts: many(userPosts),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  trip: one(trips, {
    fields: [groups.tripId],
    references: [trips.id],
  }),
  organizer: one(users, {
    fields: [groups.organizerId],
    references: [users.id],
  }),
  participants: many(tripParticipants),
  coinTransactions: many(coinTransactions),
  challengeSubmissions: many(challengeSubmissions),
  rewardPurchases: many(rewardPurchases),
  submissionActivities: many(submissionActivities, {
    relationName: "SubmissionActivityGroup",
  }),
  rankChangeActivities: many(rankChangeActivities, {
    relationName: "RankChangeActivityGroup",
  }),
  joinRequests: many(groupJoinRequests),
}));

export const groupJoinRequestsRelations = relations(groupJoinRequests, ({ one }) => ({
  trip: one(trips, {
    fields: [groupJoinRequests.tripId],
    references: [trips.id],
  }),
  group: one(groups, {
    fields: [groupJoinRequests.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupJoinRequests.userId],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  trip: one(trips, {
    fields: [challenges.tripId],
    references: [trips.id],
  }),
  submissions: many(challengeSubmissions),
  votes: many(challengeVotes),
  submissionActivities: many(submissionActivities, {
    relationName: "SubmissionActivityChallenge",
  }),
  challengeActivities: many(challengeActivities, {
    relationName: "ChallengeActivityChallenge",
  }),
  recurrence: one(challengeRecurrence, {
    fields: [challenges.id],
    references: [challengeRecurrence.challengeId],
  }),
  location: one(challengeLocationMatch, {
    fields: [challenges.id],
    references: [challengeLocationMatch.challengeId],
  }),
  text: one(challengeText, {
    fields: [challenges.id],
    references: [challengeText.challengeId],
  }),
  qrCode: one(challengeQrCode, {
    fields: [challenges.id],
    references: [challengeQrCode.challengeId],
  }),
}));

export const challengeRecurrenceRelations = relations(challengeRecurrence, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeRecurrence.challengeId],
    references: [challenges.id],
  }),
}));

export const challengeLocationMatchRelations = relations(challengeLocationMatch, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeLocationMatch.challengeId],
    references: [challenges.id],
  }),
}));

export const challengeTextRelations = relations(challengeText, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeText.challengeId],
    references: [challenges.id],
  }),
}));

export const challengeQrCodeRelations = relations(challengeQrCode, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeQrCode.challengeId],
    references: [challenges.id],
  }),
}));

export const challengeSubmissionsRelations = relations(challengeSubmissions, ({ one, many }) => ({
  challenge: one(challenges, {
    fields: [challengeSubmissions.challengeId],
    references: [challenges.id],
  }),
  group: one(groups, {
    fields: [challengeSubmissions.groupId],
    references: [groups.id],
  }),
  reviewedBy: one(users, {
    fields: [challengeSubmissions.reviewedById],
    references: [users.id],
  }),
  votes: many(challengeVotes),
  reports: many(submissionReports),
  submissionActivities: many(submissionActivities),
}));

export const challengeVotesRelations = relations(challengeVotes, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeVotes.challengeId],
    references: [challenges.id],
  }),
  submission: one(challengeSubmissions, {
    fields: [challengeVotes.submissionId],
    references: [challengeSubmissions.id],
  }),
  voter: one(tripParticipants, {
    fields: [challengeVotes.voterId],
    references: [tripParticipants.id],
  }),
}));

export const submissionReportsRelations = relations(submissionReports, ({ one }) => ({
  submission: one(challengeSubmissions, {
    fields: [submissionReports.submissionId],
    references: [challengeSubmissions.id],
  }),
  reporter: one(tripParticipants, {
    fields: [submissionReports.reporterId],
    references: [tripParticipants.id],
  }),
}));

export const activityFeedsRelations = relations(activityFeeds, ({ one, many }) => ({
  trip: one(trips, {
    fields: [activityFeeds.tripId],
    references: [trips.id],
  }),
  hiddenBy: one(users, {
    fields: [activityFeeds.hiddenByAdmin],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [activityFeeds.createdByAdmin],
    references: [users.id],
  }),
  reactions: many(activityReactions),
  submissionActivity: one(submissionActivities),
  challengeActivity: one(challengeActivities),
  rankChangeActivity: one(rankChangeActivities),
  userPost: one(userPosts),
}));

export const activityReactionsRelations = relations(activityReactions, ({ one }) => ({
  activity: one(activityFeeds, {
    fields: [activityReactions.activityId],
    references: [activityFeeds.id],
  }),
  user: one(users, {
    fields: [activityReactions.userId],
    references: [users.id],
  }),
}));

export const submissionActivitiesRelations = relations(submissionActivities, ({ one }) => ({
  activity: one(activityFeeds, {
    fields: [submissionActivities.activityId],
    references: [activityFeeds.id],
  }),
  submission: one(challengeSubmissions, {
    fields: [submissionActivities.submissionId],
    references: [challengeSubmissions.id],
  }),
  challenge: one(challenges, {
    fields: [submissionActivities.challengeId],
    references: [challenges.id],
  }),
  group: one(groups, {
    fields: [submissionActivities.groupId],
    references: [groups.id],
  }),
}));

export const challengeActivitiesRelations = relations(challengeActivities, ({ one }) => ({
  activity: one(activityFeeds, {
    fields: [challengeActivities.activityId],
    references: [activityFeeds.id],
  }),
  challenge: one(challenges, {
    fields: [challengeActivities.challengeId],
    references: [challenges.id],
  }),
}));

export const rankChangeActivitiesRelations = relations(rankChangeActivities, ({ one }) => ({
  activity: one(activityFeeds, {
    fields: [rankChangeActivities.activityId],
    references: [activityFeeds.id],
  }),
  group: one(groups, {
    fields: [rankChangeActivities.groupId],
    references: [groups.id],
  }),
}));

export const userPostsRelations = relations(userPosts, ({ one }) => ({
  activity: one(activityFeeds, {
    fields: [userPosts.activityId],
    references: [activityFeeds.id],
  }),
  author: one(tripParticipants, {
    fields: [userPosts.authorId],
    references: [tripParticipants.id],
  }),
}));

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  group: one(groups, {
    fields: [coinTransactions.groupId],
    references: [groups.id],
  }),
  admin: one(users, {
    fields: [coinTransactions.adminId],
    references: [users.id],
  }),
}));

export const notificationSchedulesRelations = relations(notificationSchedules, ({ one, many }) => ({
  trip: one(trips, {
    fields: [notificationSchedules.tripId],
    references: [trips.id],
  }),
  createdBy: one(users, {
    fields: [notificationSchedules.createdById],
    references: [users.id],
  }),
  notificationExecutions: many(notificationScheduleExecutions),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  trip: one(trips, {
    fields: [notifications.tripId],
    references: [trips.id],
  }),
  createdBy: one(users, {
    fields: [notifications.createdById],
    references: [users.id],
  }),
  pushes: many(notificationPushes),
  scheduleExecutions: many(notificationScheduleExecutions),
  delivery: one(notificationDeliveries),
}));

export const notificationScheduleExecutionsRelations = relations(
  notificationScheduleExecutions,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationScheduleExecutions.notificationId],
      references: [notifications.id],
    }),
    schedule: one(notificationSchedules, {
      fields: [notificationScheduleExecutions.scheduleId],
      references: [notificationSchedules.id],
    }),
  }),
);

export const notificationPushesRelations = relations(notificationPushes, ({ one }) => ({
  targetUser: one(users, {
    fields: [notificationPushes.targetUserId],
    references: [users.id],
  }),
  notification: one(notifications, {
    fields: [notificationPushes.notificationId],
    references: [notifications.id],
  }),
}));

export const notificationDeliveriesRelations = relations(notificationDeliveries, ({ one }) => ({
  trip: one(trips, {
    fields: [notificationDeliveries.tripId],
    references: [trips.id],
  }),
  notification: one(notifications, {
    fields: [notificationDeliveries.notificationId],
    references: [notifications.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  usersToShareWith: many(locationShares),
}));

export const locationSharingRequestsRelations = relations(locationSharingRequests, ({ one }) => ({
  sender: one(users, {
    fields: [locationSharingRequests.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [locationSharingRequests.receiverId],
    references: [users.id],
  }),
}));

export const locationSharesRelations = relations(locationShares, ({ one }) => ({
  location: one(locations, {
    fields: [locationShares.locationId],
    references: [locations.id],
  }),
  user: one(users, {
    fields: [locationShares.userId],
    references: [users.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  trip: one(trips, {
    fields: [rewards.tripId],
    references: [trips.id],
  }),
  createdBy: one(users, {
    fields: [rewards.createdById],
    references: [users.id],
  }),
  purchases: many(rewardPurchases),
}));

export const rewardPurchasesRelations = relations(rewardPurchases, ({ one }) => ({
  reward: one(rewards, {
    fields: [rewardPurchases.rewardId],
    references: [rewards.id],
  }),
  group: one(groups, {
    fields: [rewardPurchases.groupId],
    references: [groups.id],
  }),
  purchasedBy: one(users, {
    fields: [rewardPurchases.purchasedById],
    references: [users.id],
  }),
  statusUpdatedBy: one(users, {
    fields: [rewardPurchases.statusUpdatedById],
    references: [users.id],
  }),
}));

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  tripSponsors: many(tripSponsors),
  tripSponsorDisplays: many(tripSponsorDisplay),
}));

export const tripSponsorsRelations = relations(tripSponsors, ({ one }) => ({
  trip: one(trips, {
    fields: [tripSponsors.tripId],
    references: [trips.id],
  }),
  sponsor: one(sponsors, {
    fields: [tripSponsors.sponsorId],
    references: [sponsors.id],
  }),
}));

export const tripSponsorDisplayRelations = relations(tripSponsorDisplay, ({ one }) => ({
  trip: one(trips, {
    fields: [tripSponsorDisplay.tripId],
    references: [trips.id],
  }),
  sponsor: one(sponsors, {
    fields: [tripSponsorDisplay.sponsorId],
    references: [sponsors.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  performedBy: one(users, {
    fields: [auditLogs.performedById],
    references: [users.id],
  }),
}));

// userAgentsRelations removed - telemetry table dropped
