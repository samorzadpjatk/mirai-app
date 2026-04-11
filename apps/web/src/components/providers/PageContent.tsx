"use client";

import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { LoadingSpinner } from "../ui/LoadingSpinner";

type LazyPage = React.LazyExoticComponent<ComponentType<any>>;

const resolve = <T extends Record<string, ComponentType<any>>>(
  loader: () => Promise<T>,
  name: keyof T,
): LazyPage =>
  lazy(() => loader().then((m) => ({ default: m[name]! })));

const pages: Record<string, LazyPage> = {
  // Dashboard
  dashboard: resolve(
    () => import("../admin/dashboard/DashboardContent"),
    "DashboardContent",
  ),

  // Users
  users: resolve(
    () => import("../admin/users/UsersPageContent"),
    "UsersPageContent",
  ),
  "users-new": resolve(
    () => import("../admin/users/CreateUserContent"),
    "CreateUserContent",
  ),
  "users-edit": resolve(
    () => import("../admin/users/EditUserContent"),
    "EditUserContent",
  ),

  // Challenges
  challenges: resolve(
    () => import("../admin/challenges/ChallengesPageContent"),
    "ChallengesPageContent",
  ),
  "challenges-new": resolve(
    () => import("../admin/challenges/CreateChallengeContent"),
    "CreateChallengeContent",
  ),
  "challenge-details": resolve(
    () => import("../admin/challenges/ChallengeDetailsContent"),
    "ChallengeDetailsContent",
  ),
  "challenge-edit": resolve(
    () => import("../admin/challenges/ChallengeForm"),
    "ChallengeForm",
  ),
  "challenge-submissions": resolve(
    () => import("../admin/challenges/ChallengeSubmissionsPage"),
    "ChallengeSubmissionsPage",
  ),
  "challenge-judging": resolve(
    () => import("../admin/challenges/JudgingPage"),
    "JudgingPage",
  ),
  "challenge-voting": resolve(
    () => import("../admin/challenges/StaffVotingPage"),
    "StaffVotingPage",
  ),

  // Groups
  groups: resolve(
    () => import("../admin/groups/GroupsPageContent"),
    "GroupsPageContent",
  ),
  "groups-new": resolve(
    () => import("../admin/groups/CreateGroupContent"),
    "CreateGroupContent",
  ),
  "groups-edit": resolve(
    () => import("../admin/groups/EditGroupContent"),
    "EditGroupContent",
  ),

  // Rewards
  rewards: resolve(
    () => import("../admin/rewards/RewardsPageContent"),
    "RewardsPageContent",
  ),
  "rewards-new": resolve(
    () => import("../admin/rewards/CreateRewardContent"),
    "CreateRewardContent",
  ),
  "rewards-edit": resolve(
    () => import("../admin/rewards/EditRewardContent"),
    "EditRewardContent",
  ),

  // Notifications
  notifications: resolve(
    () => import("../admin/notifications/NotificationsPageContent"),
    "NotificationsPageContent",
  ),
  "notifications-new": resolve(
    () => import("../admin/notifications/CreateNotificationContent"),
    "CreateNotificationContent",
  ),

  // Schedules
  schedules: resolve(
    () => import("../admin/schedules/SchedulesPageContent"),
    "SchedulesPageContent",
  ),

  // Transactions
  transactions: resolve(
    () => import("../admin/transactions/TransactionsPageContent"),
    "TransactionsPageContent",
  ),

  // Activity
  activity: resolve(
    () => import("../admin/activity/ActivityPageContent"),
    "ActivityPageContent",
  ),
  "activity-new": resolve(
    () => import("../admin/activity/ActivityForm"),
    "ActivityForm",
  ),
  "activity-edit": resolve(
    () => import("../admin/activity/ActivityForm"),
    "ActivityForm",
  ),

  // Coins
  coins: resolve(
    () => import("../admin/coins/CoinsPageContent"),
    "CoinsPageContent",
  ),
  "coins-operation": resolve(
    () => import("../admin/coins/CoinOperationContent"),
    "CoinOperationContent",
  ),
};

interface PageContentProps {
  page: string;
  pageProps?: Record<string, string>;
}

export function PageContent({ page, pageProps = {} }: PageContentProps) {
  const Page = pages[page];

  if (!Page) {
    return (
      <div className="text-sm text-text-secondary">Page not found: {page}</div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner label="Loading..." />}>
      <Page key={page} {...pageProps} />
    </Suspense>
  );
}
