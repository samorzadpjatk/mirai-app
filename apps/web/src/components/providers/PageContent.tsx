'use client'

import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { YStack, Text } from '@mirai-app/ui'

/* eslint-disable @typescript-eslint/no-explicit-any */
type LazyPage = React.LazyExoticComponent<ComponentType<any>>

const resolve = <T extends Record<string, ComponentType<any>>>(
  loader: () => Promise<T>,
  name: keyof T
): LazyPage =>
  lazy(() => loader().then((m) => ({ default: m[name]! })))

/**
 * Lazy-loaded page components for code splitting.
 * Each route maps to a specific page content component.
 */
const pages: Record<string, LazyPage> = {
  // Dashboard
  dashboard: resolve(
    () => import('../admin/dashboard/DashboardContent'),
    'DashboardContent'
  ),

  // Users
  users: resolve(
    () => import('../admin/users/UsersPageContent'),
    'UsersPageContent'
  ),
  'users-new': resolve(
    () => import('../admin/users/CreateUserContent'),
    'CreateUserContent'
  ),
  'users-edit': resolve(
    () => import('../admin/users/EditUserContent'),
    'EditUserContent'
  ),

  // Challenges
  challenges: resolve(
    () => import('../admin/challenges/ChallengesPageContent'),
    'ChallengesPageContent'
  ),
  'challenges-new': resolve(
    () => import('../admin/challenges/CreateChallengeContent'),
    'CreateChallengeContent'
  ),
  'challenge-details': resolve(
    () => import('../admin/challenges/ChallengeDetailsContent'),
    'ChallengeDetailsContent'
  ),
  'challenge-edit': resolve(
    () => import('../admin/challenges/ChallengeForm'),
    'ChallengeForm'
  ),
  'challenge-submissions': resolve(
    () => import('../admin/challenges/ChallengeSubmissionsPage'),
    'ChallengeSubmissionsPage'
  ),
  'challenge-judging': resolve(
    () => import('../admin/challenges/JudgingPage'),
    'JudgingPage'
  ),
  'challenge-voting': resolve(
    () => import('../admin/challenges/StaffVotingPage'),
    'StaffVotingPage'
  ),

  // Groups
  groups: resolve(
    () => import('../admin/groups/GroupsPageContent'),
    'GroupsPageContent'
  ),
  'groups-new': resolve(
    () => import('../admin/groups/CreateGroupContent'),
    'CreateGroupContent'
  ),
  'groups-edit': resolve(
    () => import('../admin/groups/EditGroupContent'),
    'EditGroupContent'
  ),

  // Rewards
  rewards: resolve(
    () => import('../admin/rewards/RewardsPageContent'),
    'RewardsPageContent'
  ),
  'rewards-new': resolve(
    () => import('../admin/rewards/CreateRewardContent'),
    'CreateRewardContent'
  ),
  'rewards-edit': resolve(
    () => import('../admin/rewards/EditRewardContent'),
    'EditRewardContent'
  ),

  // Notifications
  notifications: resolve(
    () => import('../admin/notifications/NotificationsPageContent'),
    'NotificationsPageContent'
  ),
  'notifications-new': resolve(
    () => import('../admin/notifications/CreateNotificationContent'),
    'CreateNotificationContent'
  ),

  // Schedules
  schedules: resolve(
    () => import('../admin/schedules/SchedulesPageContent'),
    'SchedulesPageContent'
  ),
  'schedules-new': resolve(
    () => import('../admin/activity/CreateActivityContent'),
    'CreateActivityContent'
  ),
  'schedules-edit': resolve(
    () => import('../admin/activity/EditActivityContent'),
    'EditActivityContent'
  ),

  // Transactions
  transactions: resolve(
    () => import('../admin/transactions/TransactionsPageContent'),
    'TransactionsPageContent'
  ),

  // Activity (redirects to schedules)
  activity: resolve(
    () => import('../admin/activity/ActivityPageContent'),
    'ActivityPageContent'
  ),
  'activity-new': resolve(
    () => import('../admin/activity/CreateActivityContent'),
    'CreateActivityContent'
  ),
  'activity-edit': resolve(
    () => import('../admin/activity/EditActivityContent'),
    'EditActivityContent'
  ),

  // Coins
  coins: resolve(
    () => import('../admin/coins/CoinsPageContent'),
    'CoinsPageContent'
  ),
}

interface PageContentProps {
  page: string
  pageProps?: Record<string, string>
}

/**
 * Renders the page content based on the page identifier.
 * Uses React.lazy for code splitting - each page is loaded on demand.
 */
export function PageContent({ page, pageProps = {} }: PageContentProps) {
  const Page = pages[page]

  if (!Page) {
    return (
      <YStack padding="$4">
        <Text color="$colorMuted">Page not found: {page}</Text>
      </YStack>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner label="Loading..." centered={false} />}>
      <Page key={page} {...pageProps} />
    </Suspense>
  )
}
