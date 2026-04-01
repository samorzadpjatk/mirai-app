// Admin hooks package
// This package contains shared hooks for admin functionality used by both web and native apps

// Export all admin hooks
export { useAdminUsers } from "./useAdminUsers";
export type {
  User as AdminUser,
  User,
  Group as AdminUserGroup,
  UsersPagination,
  UserSearchField,
} from "./useAdminUsers";

export { useAdminGroups } from "./useAdminGroups";
export type {
  Group as AdminGroup,
  User as AdminGroupUser,
  GroupsPagination,
} from "./useAdminGroups";

// Default Group alias maps to coins/group list shape used in native
export type Group = import("./useAdminCoins").Group;

export { useAdminChallenges } from "./useAdminChallenges";
export type {
  Challenge,
  Challenge as ChallengeItem,
  ChallengeStatus,
  ChallengeFilterStatus,
  ChallengeSortBy,
  AdminChallengeUI,
} from "./useAdminChallenges";

export { useAdminRewards } from "./useAdminRewards";
export type { Reward } from "./useAdminRewards";

export { useAdminActivity } from "./useAdminActivity";
export type { AdminActivity, ActivityType } from "./useAdminActivity";

export { useAdminNotifications } from "./useAdminNotifications";
export type {
  AdminNotification,
  NotificationStatus,
  Notification,
} from "./useAdminNotifications";

export { useAdminTransactions } from "./useAdminTransactions";
export type { TransactionItem } from "./useAdminTransactions";

export { useAdminCoins } from "./useAdminCoins";
export type { Group as AdminCoinsGroup } from "./useAdminCoins";

export { useAdminSchedules } from "./useAdminSchedules";
export type { NotificationSchedule } from "./useAdminSchedules";

export { useAdminTrips } from "./useAdminTrips";
export type { AdminTrip } from "./useAdminTrips";
