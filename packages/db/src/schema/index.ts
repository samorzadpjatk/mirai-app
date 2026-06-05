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
  tripInsurances,
  tripInsuranceSteps,
  tripParticipants,
} from "./trips";
export { tripResourceLinks } from "./tripResourceLinks";
export { tripResourceFiles } from "./tripResourceFiles";
export { tripResourceTexts } from "./tripResourceTexts";
export { tripResourceIcons } from "./tripResourceIcons";
export { groups, groupJoinRequests } from "./groups";
export {
  challenges,
  challengeSubmissions,
  challengeVotes,
  submissionReports,
} from "./challenges";
export { challengeRecurrence } from "./challengeRecurrence";
export { challengeLocation } from "./challengeLocation";
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
export { userAgents } from "./userAgents";
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
  groupJoinRequestsRelations,
  challengesRelations,
  challengeRecurrenceRelations,
  challengeLocationRelations,
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
import { challengeLocation } from "./challengeLocation";
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
import { tripInsuranceSteps, tripInsurances, tripParticipants, trips } from "./trips";
import { userAgents } from "./userAgents";
import { users } from "./users";

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
  challengeLocation,
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
  userAgents,
] as const;
