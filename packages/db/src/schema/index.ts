export * from "./enums";
export * from "./users";
export * from "./trips";
export * from "./events";
export * from "./groups";
export * from "./challenges";
export * from "./activities";
export * from "./notifications";
export * from "./locations";
export * from "./rewards";
export * from "./sponsors";
export * from "./userAgents";
export * from "./relations";

import { users } from "./users";
import {
  trips,
  tripResources,
  tripInsurances,
  tripInsuranceSteps,
  tripParticipants,
} from "./trips";
import { events, userEvents } from "./events";
import { groups, groupJoinRequests } from "./groups";
import { challenges, challengeSubmissions, challengeVotes, submissionReports } from "./challenges";
import {
  activityFeeds,
  activityReactions,
  submissionActivities,
  challengeActivities,
  rankChangeActivities,
  userPosts,
} from "./activities";
import {
  notificationSchedules,
  notifications,
  notificationScheduleExecutions,
  notificationPushes,
  notificationDeliveries,
  pushSubscriptions,
} from "./notifications";
import { locations, locationSharingRequests, locationShares } from "./locations";
import { rewards, rewardPurchases, coinTransactions } from "./rewards";
import { sponsors, tripSponsors } from "./sponsors";
import { userAgents } from "./userAgents";

export const schemaTables = [
  users,
  trips,
  tripResources,
  tripInsurances,
  tripInsuranceSteps,
  tripParticipants,
  events,
  userEvents,
  groups,
  groupJoinRequests,
  challenges,
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
  userAgents,
] as const;
