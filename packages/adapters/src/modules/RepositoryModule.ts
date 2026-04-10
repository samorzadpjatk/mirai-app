/**
 * RepositoryModule - Data Access Layer Module
 *
 * Provides all 17 repository implementations as injectable services.
 * This module serves as the data access layer in the Clean Architecture,
 * bridging domain entities with Drizzle ORM.
 *
 * ## Repository Catalog (17 repositories)
 *
 * | Token | Drizzle Class | Interface |
 * |-------|---------------|-----------|
 * | `userRepository` | DrizzleUserRepository | UserRepository |
 * | `tripRepository` | DrizzleTripRepository | TripRepository |
 * | `challengeRepository` | DrizzleChallengeRepository | ChallengeRepository |
 * | `groupRepository` | DrizzleGroupRepository | GroupRepository |
 * | `locationRepository` | DrizzleLocationRepository | LocationRepository |
 * | `notificationRepository` | DrizzleNotificationRepository | NotificationRepository |
 * | `challengeSubmissionRepository` | DrizzleChallengeSubmissionRepository | ChallengeSubmissionRepository |
 * | `challengeVoteRepository` | DrizzleChallengeVoteRepository | ChallengeVoteRepository |
 * | `activityFeedRepository` | DrizzleActivityFeedRepository | ActivityFeedRepository |
 * | `sponsorRepository` | DrizzleSponsorRepository | SponsorRepository |
 * | `submissionReportRepository` | DrizzleSubmissionReportRepository | SubmissionReportRepository |
 * | `rewardRepository` | DrizzleRewardRepository | RewardRepository |
 * | `rewardPurchaseRepository` | DrizzleRewardPurchaseRepository | RewardPurchaseRepository |
 * | `coinTransactionRepository` | DrizzleCoinTransactionRepository | CoinTransactionRepository |
 * | `notificationDeliveryRepository` | DrizzleNotificationDeliveryRepository | NotificationDeliveryRepository |
 * | `notificationScheduleRepository` | DrizzleNotificationScheduleRepository | NotificationScheduleRepository |
 * | `eventRepository` | DrizzleEventRepository | EventRepository |
 *
 * ## Usage
 *
 * ### Resolving Repositories
 *
 * ```typescript
 * import { container } from "@mirai-app/frameworks/di";
 *
 * // Resolve by token name
 * const userRepo = container.resolve("userRepository");
 *
 * // In a service with constructor injection
 * class UserService {
 *   constructor(private deps: RepositoryModuleDeps) {}
 *
 *   async getUser(id: string) {
 *     return this.deps.userRepository.findById(id);
 *   }
 * }
 * ```
 *
 * ## Dependencies
 *
 * This module depends on `drizzle` being available in the container.
 * The Drizzle client is typically registered at the root level in AppModule or
 * a Common/Framework module.
 *
 * ## Provider Format
 *
 * This module uses the awilix-modular format compatible with the container's
 * `registerModule` function. Providers are configured as factory objects that
 * get resolved with the drizzle dependency.
 *
 * @module RepositoryModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";

// =============================================================================
// Drizzle Repository Imports
// =============================================================================

import { DrizzleUserRepository } from "../gateways/drizzle/user";
import { DrizzleTripRepository } from "../gateways/drizzle/trip";
import { DrizzleGroupRepository } from "../gateways/drizzle/group";
import { DrizzleChallengeRepository } from "../gateways/drizzle/challenge";
import { DrizzleLocationRepository } from "../gateways/drizzle/location";
import { DrizzleNotificationRepository } from "../gateways/drizzle/notification";
import { DrizzleChallengeSubmissionRepository } from "../gateways/drizzle/challenge-submission";
import { DrizzleChallengeVoteRepository } from "../gateways/drizzle/challenge-vote";
import { DrizzleActivityFeedRepository } from "../gateways/drizzle/activity-feed";
import { DrizzleSponsorRepository } from "../gateways/drizzle/sponsor";
import { DrizzleSubmissionReportRepository } from "../gateways/drizzle/submission-report";
import {
  DrizzleRewardRepository,
  DrizzleRewardPurchaseRepository,
} from "../gateways/drizzle/reward";
import { DrizzleCoinTransactionRepository } from "../gateways/drizzle/coin-transaction";
import { DrizzleNotificationDeliveryRepository } from "../gateways/drizzle/notification-delivery";
import { DrizzleNotificationScheduleRepository } from "../gateways/drizzle/notification-schedule";
import { DrizzleEventRepository } from "../gateways/drizzle/event";

// =============================================================================
// Type Imports (for type definitions)
// =============================================================================

import type {
  UserRepository,
  TripRepository,
  ChallengeRepository,
  GroupRepository,
  LocationRepository,
  NotificationRepository,
  ChallengeSubmissionRepository,
  ChallengeVoteRepository,
  ActivityFeedRepository,
  SponsorRepository,
  SubmissionReportRepository,
  RewardRepository,
  RewardPurchaseRepository,
  CoinTransactionRepository,
  NotificationDeliveryRepository,
  NotificationScheduleRepository,
  EventRepository,
} from "@mirai-app/use-cases";

// =============================================================================
// Injection Tokens
// =============================================================================

/**
 * Repository injection tokens
 *
 * String-based tokens for repository resolution. Using consistent
 * camelCase naming convention based on entity name + "Repository".
 */
export const REPOSITORY_TOKENS = {
  // Core domain repositories
  UserRepository: "userRepository",
  TripRepository: "tripRepository",
  ChallengeRepository: "challengeRepository",
  GroupRepository: "groupRepository",
  LocationRepository: "locationRepository",

  // Notification & messaging repositories
  NotificationRepository: "notificationRepository",
  NotificationDeliveryRepository: "notificationDeliveryRepository",
  NotificationScheduleRepository: "notificationScheduleRepository",

  // Challenge & submission repositories
  ChallengeSubmissionRepository: "challengeSubmissionRepository",
  ChallengeVoteRepository: "challengeVoteRepository",
  ActivityFeedRepository: "activityFeedRepository",

  // Reward & gamification repositories
  RewardRepository: "rewardRepository",
  RewardPurchaseRepository: "rewardPurchaseRepository",
  CoinTransactionRepository: "coinTransactionRepository",

  // Support & moderation repositories
  SponsorRepository: "sponsorRepository",
  SubmissionReportRepository: "submissionReportRepository",

  // Event repositories
  EventRepository: "eventRepository",
} as const;

/**
 * Type for repository token keys
 */
export type RepositoryToken =
  (typeof REPOSITORY_TOKENS)[keyof typeof REPOSITORY_TOKENS];

// =============================================================================
// Module Dependencies Type
// =============================================================================

/**
 * Repository module dependencies type
 *
 * Use this type for constructor injection when you need repositories.
 * All repositories are available as singleton-scoped services.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(private deps: RepositoryModuleDeps) {}
 *
 *   async getUserAndTrip(userId: string, tripId: string) {
 *     const [user, trip] = await Promise.all([
 *       this.deps.userRepository.findById(userId),
 *       this.deps.tripRepository.findById(tripId),
 *     ]);
 *     return { user, trip };
 *   }
 * }
 * ```
 */
export interface RepositoryModuleDeps {
  /** User data access */
  [REPOSITORY_TOKENS.UserRepository]: UserRepository;

  /** Trip data access */
  [REPOSITORY_TOKENS.TripRepository]: TripRepository;

  /** Challenge data access */
  [REPOSITORY_TOKENS.ChallengeRepository]: ChallengeRepository;

  /** Group data access */
  [REPOSITORY_TOKENS.GroupRepository]: GroupRepository;

  /** Location data access */
  [REPOSITORY_TOKENS.LocationRepository]: LocationRepository;

  /** Notification data access */
  [REPOSITORY_TOKENS.NotificationRepository]: NotificationRepository;

  /** Challenge submission data access */
  [REPOSITORY_TOKENS.ChallengeSubmissionRepository]: ChallengeSubmissionRepository;

  /** Challenge vote data access */
  [REPOSITORY_TOKENS.ChallengeVoteRepository]: ChallengeVoteRepository;

  /** Activity feed data access */
  [REPOSITORY_TOKENS.ActivityFeedRepository]: ActivityFeedRepository;

  /** Sponsor data access */
  [REPOSITORY_TOKENS.SponsorRepository]: SponsorRepository;

  /** Submission report data access */
  [REPOSITORY_TOKENS.SubmissionReportRepository]: SubmissionReportRepository;

  /** Reward data access */
  [REPOSITORY_TOKENS.RewardRepository]: RewardRepository;

  /** Reward purchase data access */
  [REPOSITORY_TOKENS.RewardPurchaseRepository]: RewardPurchaseRepository;

  /** Coin transaction data access */
  [REPOSITORY_TOKENS.CoinTransactionRepository]: CoinTransactionRepository;

  /** Notification delivery data access */
  [REPOSITORY_TOKENS.NotificationDeliveryRepository]: NotificationDeliveryRepository;

  /** Notification schedule data access */
  [REPOSITORY_TOKENS.NotificationScheduleRepository]: NotificationScheduleRepository;

  /** Event data access */
  [REPOSITORY_TOKENS.EventRepository]: EventRepository;

  /** Drizzle client from parent container */
  drizzle: unknown; // DrizzleDb type from frameworks
}

// =============================================================================
// Module Definition Type
// =============================================================================

/**
 * Repository module definition type
 *
 * Used for type checking and module composition.
 */
export interface RepositoryModuleDef {
  name: "RepositoryModule";
  providers: {
    [REPOSITORY_TOKENS.UserRepository]: typeof DrizzleUserRepository;
    [REPOSITORY_TOKENS.TripRepository]: typeof DrizzleTripRepository;
    [REPOSITORY_TOKENS.ChallengeRepository]: typeof DrizzleChallengeRepository;
    [REPOSITORY_TOKENS.GroupRepository]: typeof DrizzleGroupRepository;
    [REPOSITORY_TOKENS.LocationRepository]: typeof DrizzleLocationRepository;
    [REPOSITORY_TOKENS.NotificationRepository]: typeof DrizzleNotificationRepository;
    [REPOSITORY_TOKENS.ChallengeSubmissionRepository]: typeof DrizzleChallengeSubmissionRepository;
    [REPOSITORY_TOKENS.ChallengeVoteRepository]: typeof DrizzleChallengeVoteRepository;
    [REPOSITORY_TOKENS.ActivityFeedRepository]: typeof DrizzleActivityFeedRepository;
    [REPOSITORY_TOKENS.SponsorRepository]: typeof DrizzleSponsorRepository;
    [REPOSITORY_TOKENS.SubmissionReportRepository]: typeof DrizzleSubmissionReportRepository;
    [REPOSITORY_TOKENS.RewardRepository]: typeof DrizzleRewardRepository;
    [REPOSITORY_TOKENS.RewardPurchaseRepository]: typeof DrizzleRewardPurchaseRepository;
    [REPOSITORY_TOKENS.CoinTransactionRepository]: typeof DrizzleCoinTransactionRepository;
    [REPOSITORY_TOKENS.NotificationDeliveryRepository]: typeof DrizzleNotificationDeliveryRepository;
    [REPOSITORY_TOKENS.NotificationScheduleRepository]: typeof DrizzleNotificationScheduleRepository;
    [REPOSITORY_TOKENS.EventRepository]: typeof DrizzleEventRepository;
  };
  exports: RepositoryToken[];
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * RepositoryModule - Static module containing all 17 repository providers
 *
 * All repositories are registered with singleton lifetime because:
 * - They are stateless (contain no mutable instance state)
 * - Thread-safe (Drizzle handles connection pooling internally)
 * - Can be safely shared across concurrent requests
 * - No per-request state that requires scoping
 *
 * @example
 * ```typescript
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
 *
 * const container = initializeContainer([
 *   RepositoryModule,  // Provides all 17 repositories
 * ]);
 *
 * // Resolve a repository
 * const userRepo = container.resolve("userRepository");
 * ```
 */
export const RepositoryModule: StaticModule<RepositoryModuleDef> =
  createStaticModule<RepositoryModuleDef>({
    name: "RepositoryModule",

    providers: {
      // Core domain repositories - all Drizzle
      [REPOSITORY_TOKENS.UserRepository]: DrizzleUserRepository,
      [REPOSITORY_TOKENS.TripRepository]: DrizzleTripRepository,
      [REPOSITORY_TOKENS.ChallengeRepository]: DrizzleChallengeRepository,
      [REPOSITORY_TOKENS.GroupRepository]: DrizzleGroupRepository,
      [REPOSITORY_TOKENS.LocationRepository]: DrizzleLocationRepository,

      // Notification & messaging repositories
      [REPOSITORY_TOKENS.NotificationRepository]: DrizzleNotificationRepository,
      [REPOSITORY_TOKENS.NotificationDeliveryRepository]:
        DrizzleNotificationDeliveryRepository,
      [REPOSITORY_TOKENS.NotificationScheduleRepository]:
        DrizzleNotificationScheduleRepository,

      // Challenge & submission repositories
      [REPOSITORY_TOKENS.ChallengeSubmissionRepository]:
        DrizzleChallengeSubmissionRepository,
      [REPOSITORY_TOKENS.ChallengeVoteRepository]:
        DrizzleChallengeVoteRepository,
      [REPOSITORY_TOKENS.ActivityFeedRepository]: DrizzleActivityFeedRepository,

      // Reward & gamification repositories
      [REPOSITORY_TOKENS.RewardRepository]: DrizzleRewardRepository,
      [REPOSITORY_TOKENS.RewardPurchaseRepository]:
        DrizzleRewardPurchaseRepository,
      [REPOSITORY_TOKENS.CoinTransactionRepository]:
        DrizzleCoinTransactionRepository,

      // Support & moderation repositories
      [REPOSITORY_TOKENS.SponsorRepository]: DrizzleSponsorRepository,
      [REPOSITORY_TOKENS.SubmissionReportRepository]:
        DrizzleSubmissionReportRepository,

      // Event repository
      [REPOSITORY_TOKENS.EventRepository]: DrizzleEventRepository,
    },

    exports: [
      // Core domain
      REPOSITORY_TOKENS.UserRepository,
      REPOSITORY_TOKENS.TripRepository,
      REPOSITORY_TOKENS.ChallengeRepository,
      REPOSITORY_TOKENS.GroupRepository,
      REPOSITORY_TOKENS.LocationRepository,

      // Notification & messaging
      REPOSITORY_TOKENS.NotificationRepository,
      REPOSITORY_TOKENS.NotificationDeliveryRepository,
      REPOSITORY_TOKENS.NotificationScheduleRepository,

      // Challenge & submission
      REPOSITORY_TOKENS.ChallengeSubmissionRepository,
      REPOSITORY_TOKENS.ChallengeVoteRepository,
      REPOSITORY_TOKENS.ActivityFeedRepository,

      // Reward & gamification
      REPOSITORY_TOKENS.RewardRepository,
      REPOSITORY_TOKENS.RewardPurchaseRepository,
      REPOSITORY_TOKENS.CoinTransactionRepository,

      // Support & moderation
      REPOSITORY_TOKENS.SponsorRepository,
      REPOSITORY_TOKENS.SubmissionReportRepository,

      // Event
      REPOSITORY_TOKENS.EventRepository,
    ],
  });

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { DrizzleUserRepository } from "../gateways/drizzle/DrizzleUserRepository";
export { DrizzleTripRepository } from "../gateways/drizzle/DrizzleTripRepository";
export { DrizzleChallengeRepository } from "../gateways/drizzle/DrizzleChallengeRepository";
export { DrizzleGroupRepository } from "../gateways/drizzle/DrizzleGroupRepository";
export { DrizzleLocationRepository } from "../gateways/drizzle/DrizzleLocationRepository";
export { DrizzleNotificationRepository } from "../gateways/drizzle/DrizzleNotificationRepository";
export { DrizzleChallengeSubmissionRepository } from "../gateways/drizzle/DrizzleChallengeSubmissionRepository";
export { DrizzleChallengeVoteRepository } from "../gateways/drizzle/DrizzleChallengeVoteRepository";
export { DrizzleActivityFeedRepository } from "../gateways/drizzle/DrizzleActivityFeedRepository";
export { DrizzleSponsorRepository } from "../gateways/drizzle/DrizzleSponsorRepository";
export { DrizzleSubmissionReportRepository } from "../gateways/drizzle/DrizzleSubmissionReportRepository";
export {
  DrizzleRewardRepository,
  DrizzleRewardPurchaseRepository,
} from "../gateways/drizzle/DrizzleRewardRepository";
export { DrizzleCoinTransactionRepository } from "../gateways/drizzle/DrizzleCoinTransactionRepository";
export { DrizzleNotificationDeliveryRepository } from "../gateways/drizzle/DrizzleNotificationDeliveryRepository";
export { DrizzleNotificationScheduleRepository } from "../gateways/drizzle/DrizzleNotificationScheduleRepository";
export { DrizzleEventRepository } from "../gateways/drizzle/DrizzleEventRepository";
