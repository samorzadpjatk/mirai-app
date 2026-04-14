/**
 * TestIds - Predefined UUIDs for testing
 *
 * Use these constants instead of hardcoding UUIDs in tests.
 * This ensures consistency and makes test maintenance easier.
 *
 * @example
 * ```typescript
 * import { TestIds } from "@mirai-app/domain";
 * import { UserId } from "@mirai-app/domain";
 *
 * const userId = UserId.create(TestIds.USER);
 * const adminId = UserId.create(TestIds.ADMIN);
 * ```
 */

/**
 * Base UUID sequence for tests
 * Format: 550e8400-e29b-41d4-a716-446655440XXX
 */
export const TestIds = {
  // User IDs (common)
  USER: "550e8400-e29b-41d4-a716-446655440000",
  USER_1: "550e8400-e29b-41d4-a716-446655440001",
  USER_2: "550e8400-e29b-41d4-a716-446655440002",
  USER_3: "550e8400-e29b-41d4-a716-446655440003",
  ADMIN: "550e8400-e29b-41d4-a716-446655440010",
  MODERATOR: "550e8400-e29b-41d4-a716-446655440020",

  // Trip IDs
  TRIP: "550e8400-e29b-41d4-a716-446655440100",
  TRIP_1: "550e8400-e29b-41d4-a716-446655440101",
  TRIP_2: "550e8400-e29b-41d4-a716-446655440102",

  // Group IDs
  GROUP: "550e8400-e29b-41d4-a716-446655440200",
  GROUP_1: "550e8400-e29b-41d4-a716-446655440201",

  // Challenge IDs
  CHALLENGE: "550e8400-e29b-41d4-a716-446655440300",
  CHALLENGE_1: "550e8400-e29b-41d4-a716-446655440301",

  // Activity IDs
  ACTIVITY: "550e8400-e29b-41d4-a716-446655440400",

  // Location IDs
  LOCATION: "550e8400-e29b-41d4-a716-446655440500",

  // Notification IDs
  NOTIFICATION: "550e8400-e29b-41d4-a716-446655440600",

  // Schedule IDs
  SCHEDULE: "550e8400-e29b-41d4-a716-446655440700",

  // Submission IDs
  SUBMISSION: "550e8400-e29b-41d4-a716-446655440800",
  SUBMISSION_1: "550e8400-e29b-41d4-a716-446655440801",

  // Vote IDs
  VOTE: "550e8400-e29b-41d4-a716-446655440900",

  // Reward IDs
  REWARD: "550e8400-e29b-41d4-a716-446655441000",

  // Purchase IDs
  PURCHASE: "550e8400-e29b-41d4-a716-446655441100",

  // Transaction IDs
  TRANSACTION: "550e8400-e29b-41d4-a716-446655441200",
  TX_1: "550e8400-e29b-41d4-a716-446655441201",
  TX_2: "550e8400-e29b-41d4-a716-446655441202",
  TX_3: "550e8400-e29b-41d4-a716-446655441203",

  // Report IDs
  REPORT: "550e8400-e29b-41d4-a716-446655441300",

  // Sponsor IDs
  SPONSOR: "550e8400-e29b-41d4-a716-446655441400",

  // Delivery IDs
  DELIVERY: "550e8400-e29b-41d4-a716-446655441500",

  // Special/Edge cases
  NON_EXISTENT: "550e8400-e29b-41d4-a716-446655449999",
  ALTERNATE: "550e8400-e29b-41d4-a716-446655449998",
} as const;

/**
 * Type for test ID keys
 */
export type TestIdKey = keyof typeof TestIds;
