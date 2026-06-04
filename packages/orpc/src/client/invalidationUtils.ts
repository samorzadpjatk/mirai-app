import type { useQueryClient } from "@tanstack/react-query";

function matchQueryPath(query: unknown, segments: string[]): boolean {
  const key = (query as { queryKey: unknown[] }).queryKey;
  const path = Array.isArray(key[0]) ? key[0] : key;
  return Array.isArray(path) && segments.every((segment, i) => path[i] === segment);
}

/**
 * Utility functions for advanced query invalidation patterns
 */

/**
 * Invalidate queries with cascading effects using Promise.all for parallel execution
 */
export async function invalidateCascadingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  queryGroups: string[][],
) {
  await Promise.all(
    queryGroups.map((group) =>
      queryClient.invalidateQueries({
        predicate: (query) => matchQueryPath(query, group),
      }),
    ),
  );
}

/**
 * Invalidate queries with predicate function for fine-grained control
 */
export async function invalidateWithPredicate(
  queryClient: ReturnType<typeof useQueryClient>,
  predicate: (query: unknown) => boolean,
) {
  await queryClient.invalidateQueries({ predicate });
}

/**
 * Common query invalidation groups for the app
 */
export const QUERY_GROUPS = {
  REWARDS: [["reward"]] as string[][],
  REWARDS_ADMIN: [["reward"], ["admin"]] as string[][],
  CHALLENGES: [["challenge"]] as string[][],
  CHALLENGE_SUBMISSIONS: [["challengeSubmission"]] as string[][],
  NOTIFICATIONS: [["notification"], ["notificationSchedule"]] as string[][],
  USER_DATA: [["user"], ["group"]] as string[][],
  TRIPS: [["trip"]] as string[][],
  ADMIN: [["admin"]] as string[][],
  GROUPS: [["group"]] as string[][],
  SCHEDULES: [["schedule"], ["notificationSchedule"]] as string[][],
  TRANSACTIONS: [["transaction"], ["coin"]] as string[][],
  JUDGEMENTS: [["judgement"]] as string[][],
  LOCATION: [["location"]] as string[][],
  MAP: [["map"], ["mapOverlay"]] as string[][],
} as const;

/**
 * Helper for reward-related cascading invalidation
 */
export async function invalidateRewardQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  includeAdmin = false,
) {
  const groups = includeAdmin ? [QUERY_GROUPS.REWARDS_ADMIN.flat()] : [QUERY_GROUPS.REWARDS.flat()];

  await invalidateCascadingQueries(queryClient, groups);
}

/**
 * Helper for challenge-related cascading invalidation
 */
export async function invalidateChallengeQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await invalidateCascadingQueries(queryClient, [
    ...QUERY_GROUPS.CHALLENGES,
    ...QUERY_GROUPS.CHALLENGE_SUBMISSIONS,
  ]);
}

/**
 * Helper for user-related cascading invalidation
 */
export async function invalidateUserQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  includeGroups = true,
) {
  const groups = includeGroups
    ? [...QUERY_GROUPS.USER_DATA, ...QUERY_GROUPS.GROUPS]
    : QUERY_GROUPS.USER_DATA;

  await invalidateCascadingQueries(queryClient, groups);
}

/**
 * Helper for group-related cascading invalidation
 */
export async function invalidateGroupQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  includeUsers = true,
) {
  const groups = includeUsers
    ? [...QUERY_GROUPS.GROUPS, ...QUERY_GROUPS.USER_DATA]
    : QUERY_GROUPS.GROUPS;

  await invalidateCascadingQueries(queryClient, groups);
}

/**
 * Helper for admin-related cascading invalidation
 */
export async function invalidateAdminQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  domains?: (keyof Omit<typeof QUERY_GROUPS, "REWARDS" | "REWARDS_ADMIN">)[],
) {
  const groups = domains
    ? domains.flatMap((domain) => QUERY_GROUPS[domain])
    : [
        ...QUERY_GROUPS.ADMIN,
        ...QUERY_GROUPS.USER_DATA,
        ...QUERY_GROUPS.GROUPS,
        ...QUERY_GROUPS.TRIPS,
        ...QUERY_GROUPS.CHALLENGES,
        ...QUERY_GROUPS.SCHEDULES,
        ...QUERY_GROUPS.TRANSACTIONS,
      ];

  await invalidateCascadingQueries(queryClient, groups);
}

/**
 * Helper for transaction-related cascading invalidation
 */
export async function invalidateTransactionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  includeGroups = true,
) {
  const groups = includeGroups
    ? [...QUERY_GROUPS.TRANSACTIONS, ...QUERY_GROUPS.GROUPS]
    : QUERY_GROUPS.TRANSACTIONS;

  await invalidateCascadingQueries(queryClient, groups);
}

/**
 * Helper for notification-related cascading invalidation
 */
export async function invalidateNotificationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  includeSchedules = true,
) {
  const groups = includeSchedules ? QUERY_GROUPS.NOTIFICATIONS : [["notification"]];

  await invalidateCascadingQueries(queryClient, groups);
}

/**
 * Helper for location-related cascading invalidation
 */
export async function invalidateLocationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await invalidateCascadingQueries(queryClient, QUERY_GROUPS.LOCATION);
}

/**
 * Helper for trip-related cascading invalidation
 */
export async function invalidateTripQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await invalidateCascadingQueries(queryClient, QUERY_GROUPS.TRIPS);
}

/**
 * Helper for file-related cascading invalidation
 */
export async function invalidateFileQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({
    predicate: (query) => matchQueryPath(query, ["file"]),
  });
}
