/**
 * GraphQL Resolver Helpers
 *
 * Type-safe controller access patterns for GraphQL resolvers.
 * Provides both generic access via `getController` and convenient
 * shortcuts via the `ControllersFrom` object.
 *
 * These helpers support the migration from awilix container-based
 * resolution to direct Effect-based controller access.
 *
 * ## Usage Patterns
 *
 * ### Direct access via controllers object (recommended):
 * ```typescript
 * const controller = context.controllers.userController;
 * ```
 *
 * ### Using getController helper:
 * ```typescript
 * const controller = getController(context, "userController");
 * ```
 *
 * ### Using ControllersFrom shortcuts:
 * ```typescript
 * const controller = ControllersFrom.user(context);
 * ```
 *
 * @module resolver-helpers
 * @since 1.3.0
 */

import type { GraphQLContext } from "../context";
import type {
  Controllers,
  UserController,
  TripController,
  ChallengeController,
  GroupController,
  LocationController,
  NotificationController,
  NotificationScheduleController,
  NotificationDeliveryController,
  ChallengeSubmissionController,
  ChallengeVoteController,
  ActivityFeedController,
  RewardController,
  CoinController,
  CoinTransactionController,
  SponsorController,
  SubmissionReportController,
  StorageController,
} from "@mirai-app/adapters";

// =============================================================================
// Generic Controller Access
// =============================================================================

/**
 * Generic type-safe controller accessor.
 *
 * Returns the specific controller type based on the name parameter,
 * providing full TypeScript intellisense and compile-time type checking.
 *
 * @param context - The GraphQL context containing controllers
 * @param name - The key of the controller to retrieve
 * @returns The controller instance with proper typing
 *
 * @example
 * ```typescript
 * const userController = getController(context, "userController");
 * // Type: UserController - full autocomplete available
 * const user = await userController.getById({ id: "123" });
 * ```
 *
 * @example
 * ```typescript
 * // Works with any controller key
 * const tripController = getController(context, "tripController");
 * const challengeController = getController(context, "challengeController");
 * ```
 */
export function getController<K extends keyof Controllers>(
  context: GraphQLContext,
  name: K,
): Controllers[K] {
  return context.controllers[name];
}

// =============================================================================
// Controller Shortcuts
// =============================================================================

/**
 * Convenient controller access shortcuts.
 *
 * Provides direct accessor functions for all 17 controllers,
 * eliminating the need to remember controller key names.
 *
 * @example
 * ```typescript
 * // Instead of:
 * const userController = context.controllers.userController;
 *
 * // Use:
 * const userController = ControllersFrom.user(context);
 * ```
 */
export const ControllersFrom = {
  /**
   * Get the UserController from context
   * @param context - GraphQL context
   * @returns UserController instance
   */
  user(context: GraphQLContext): UserController {
    return context.controllers.userController;
  },

  /**
   * Get the TripController from context
   * @param context - GraphQL context
   * @returns TripController instance
   */
  trip(context: GraphQLContext): TripController {
    return context.controllers.tripController;
  },

  /**
   * Get the ChallengeController from context
   * @param context - GraphQL context
   * @returns ChallengeController instance
   */
  challenge(context: GraphQLContext): ChallengeController {
    return context.controllers.challengeController;
  },

  /**
   * Get the GroupController from context
   * @param context - GraphQL context
   * @returns GroupController instance
   */
  group(context: GraphQLContext): GroupController {
    return context.controllers.groupController;
  },

  /**
   * Get the LocationController from context
   * @param context - GraphQL context
   * @returns LocationController instance
   */
  location(context: GraphQLContext): LocationController {
    return context.controllers.locationController;
  },

  /**
   * Get the NotificationController from context
   * @param context - GraphQL context
   * @returns NotificationController instance
   */
  notification(context: GraphQLContext): NotificationController {
    return context.controllers.notificationController;
  },

  /**
   * Get the NotificationScheduleController from context
   * @param context - GraphQL context
   * @returns NotificationScheduleController instance
   */
  notificationSchedule(
    context: GraphQLContext,
  ): NotificationScheduleController {
    return context.controllers.notificationScheduleController;
  },

  /**
   * Get the NotificationDeliveryController from context
   * @param context - GraphQL context
   * @returns NotificationDeliveryController instance
   */
  notificationDelivery(
    context: GraphQLContext,
  ): NotificationDeliveryController {
    return context.controllers.notificationDeliveryController;
  },

  /**
   * Get the ChallengeSubmissionController from context
   * @param context - GraphQL context
   * @returns ChallengeSubmissionController instance
   */
  challengeSubmission(context: GraphQLContext): ChallengeSubmissionController {
    return context.controllers.challengeSubmissionController;
  },

  /**
   * Get the ChallengeVoteController from context
   * @param context - GraphQL context
   * @returns ChallengeVoteController instance
   */
  challengeVote(context: GraphQLContext): ChallengeVoteController {
    return context.controllers.challengeVoteController;
  },

  /**
   * Get the ActivityFeedController from context
   * @param context - GraphQL context
   * @returns ActivityFeedController instance
   */
  activityFeed(context: GraphQLContext): ActivityFeedController {
    return context.controllers.activityFeedController;
  },

  /**
   * Get the RewardController from context
   * @param context - GraphQL context
   * @returns RewardController instance
   */
  reward(context: GraphQLContext): RewardController {
    return context.controllers.rewardController;
  },

  /**
   * Get the CoinController from context
   * @param context - GraphQL context
   * @returns CoinController instance
   */
  coin(context: GraphQLContext): CoinController {
    return context.controllers.coinController;
  },

  /**
   * Get the CoinTransactionController from context
   * @param context - GraphQL context
   * @returns CoinTransactionController instance
   */
  coinTransaction(context: GraphQLContext): CoinTransactionController {
    return context.controllers.coinTransactionController;
  },

  /**
   * Get the SponsorController from context
   * @param context - GraphQL context
   * @returns SponsorController instance
   */
  sponsor(context: GraphQLContext): SponsorController {
    return context.controllers.sponsorController;
  },

  /**
   * Get the SubmissionReportController from context
   * @param context - GraphQL context
   * @returns SubmissionReportController instance
   */
  submissionReport(context: GraphQLContext): SubmissionReportController {
    return context.controllers.submissionReportController;
  },

  /**
   * Get the StorageController from context
   * @param context - GraphQL context
   * @returns StorageController instance
   */
  storage(context: GraphQLContext): StorageController {
    return context.controllers.storageController;
  },
} as const;

// =============================================================================
// Type Exports
// =============================================================================

/**
 * Re-export Controller type aliases for convenience.
 * These types can be imported directly from resolver-helpers.
 */
export type {
  Controllers,
  UserController,
  TripController,
  ChallengeController,
  GroupController,
  LocationController,
  NotificationController,
  NotificationScheduleController,
  NotificationDeliveryController,
  ChallengeSubmissionController,
  ChallengeVoteController,
  ActivityFeedController,
  RewardController,
  CoinController,
  CoinTransactionController,
  SponsorController,
  SubmissionReportController,
  StorageController,
} from "@mirai-app/adapters";
