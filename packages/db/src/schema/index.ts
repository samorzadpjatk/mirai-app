export {
  roleEnum,
  submissionTypeEnum,
  scoringCategoryEnum,
  challengeStatusEnum,
  submissionStatusEnum,
  locationSharingRequestStatusEnum,
  rewardPurchaseStatusEnum,
} from "./enums";
export { users } from "./users";
export {
  trips,
  tripResources,
  tripInsurances,
  tripInsuranceSteps,
  tripParticipants,
} from "./trips";
export { events, userEvents } from "./events";
export { groups, groupJoinRequests } from "./groups";
export {
  challenges,
  challengeSubmissions,
  challengeVotes,
  submissionReports,
} from "./challenges";
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
export { userAgents } from "./userAgents";
export {
  usersRelations,
  tripsRelations,
  tripResourcesRelations,
  tripInsurancesRelations,
  tripInsuranceStepsRelations,
  tripParticipantsRelations,
  eventsRelations,
  userEventsRelations,
  groupsRelations,
  groupJoinRequestsRelations,
  challengesRelations,
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
  userAgentsRelations,
} from "./relations";

import {
  activityFeeds,
  activityReactions,
  challengeActivities,
  rankChangeActivities,
  submissionActivities,
  userPosts,
} from "./activities";
import { challengeSubmissions, challengeVotes, challenges, submissionReports } from "./challenges";
import { events, userEvents } from "./events";
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
import {
  tripInsuranceSteps,
  tripInsurances,
  tripParticipants,
  tripResources,
  trips,
} from "./trips";
import { userAgents } from "./userAgents";
import { users } from "./users";

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
