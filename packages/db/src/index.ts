export { createDb } from "./client";
export * from "./client";
export * from "./schema";
export type { TransactionDB } from "./client";

import type { users } from "./schema/users";
import type { roleEnum } from "./schema/enums";
export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];

import type {
  trips,
  tripResources,
  tripInsurances,
  tripInsuranceSteps,
  tripParticipants,
} from "./schema/trips";
export type Trip = typeof trips.$inferSelect;
export type TripResource = typeof tripResources.$inferSelect;
export type TripInsurance = typeof tripInsurances.$inferSelect;
export type TripInsuranceStep = typeof tripInsuranceSteps.$inferSelect;
export type TripParticipant = typeof tripParticipants.$inferSelect;

import type { events, userEvents } from "./schema/events";
export type Event = typeof events.$inferSelect;
export type UserEvent = typeof userEvents.$inferSelect;

import type { groups, groupJoinRequests } from "./schema/groups";
export type Group = typeof groups.$inferSelect;
export type GroupJoinRequest = typeof groupJoinRequests.$inferSelect;

import type {
  challenges,
  challengeSubmissions,
  challengeVotes,
  submissionReports,
} from "./schema/challenges";
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type ChallengeVote = typeof challengeVotes.$inferSelect;
export type SubmissionReport = typeof submissionReports.$inferSelect;

import type {
  activityFeeds,
  activityReactions,
  submissionActivities,
  challengeActivities,
  rankChangeActivities,
  userPosts,
} from "./schema/activities";
export type ActivityFeed = typeof activityFeeds.$inferSelect;
export type ActivityReaction = typeof activityReactions.$inferSelect;
export type SubmissionActivity = typeof submissionActivities.$inferSelect;
export type ChallengeActivity = typeof challengeActivities.$inferSelect;
export type RankChangeActivity = typeof rankChangeActivities.$inferSelect;
export type UserPost = typeof userPosts.$inferSelect;

import type {
  notificationSchedules,
  notifications,
  notificationScheduleExecutions,
  notificationPushes,
  notificationDeliveries,
  pushSubscriptions,
} from "./schema/notifications";
export type NotificationSchedule = typeof notificationSchedules.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationScheduleExecution = typeof notificationScheduleExecutions.$inferSelect;
export type NotificationPush = typeof notificationPushes.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

import type { locations, locationSharingRequests, locationShares } from "./schema/locations";
export type Location = typeof locations.$inferSelect;
export type LocationSharingRequest = typeof locationSharingRequests.$inferSelect;
export type LocationShare = typeof locationShares.$inferSelect;

import type { rewards, rewardPurchases, coinTransactions } from "./schema/rewards";
export type Reward = typeof rewards.$inferSelect;
export type RewardPurchase = typeof rewardPurchases.$inferSelect;
export type CoinTransaction = typeof coinTransactions.$inferSelect;

import type { sponsors, tripSponsors } from "./schema/sponsors";
export type Sponsor = typeof sponsors.$inferSelect;
export type TripSponsor = typeof tripSponsors.$inferSelect;

import type { userAgents } from "./schema/userAgents";
export type UserAgent = typeof userAgents.$inferSelect;
