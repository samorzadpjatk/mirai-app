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
import { Lifetime } from "awilix";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exports: Record<string, any>;
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
      // Core domain repositories - all Drizzle (using factory functions)
      [REPOSITORY_TOKENS.UserRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleUserRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.TripRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleTripRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.ChallengeRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleChallengeRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.GroupRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleGroupRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.LocationRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleLocationRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Notification & messaging repositories
      [REPOSITORY_TOKENS.NotificationRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleNotificationRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.NotificationDeliveryRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleNotificationDeliveryRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.NotificationScheduleRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleNotificationScheduleRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Challenge & submission repositories
      [REPOSITORY_TOKENS.ChallengeSubmissionRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleChallengeSubmissionRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.ChallengeVoteRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleChallengeVoteRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.ActivityFeedRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleActivityFeedRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Reward & gamification repositories
      [REPOSITORY_TOKENS.RewardRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleRewardRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.RewardPurchaseRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleRewardPurchaseRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.CoinTransactionRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleCoinTransactionRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Support & moderation repositories
      [REPOSITORY_TOKENS.SponsorRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleSponsorRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.SubmissionReportRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleSubmissionReportRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Event repository
      [REPOSITORY_TOKENS.EventRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleEventRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
    },

    exports: {
      // Core domain - re-export providers config
      [REPOSITORY_TOKENS.UserRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleUserRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.TripRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleTripRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.ChallengeRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleChallengeRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.GroupRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleGroupRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.LocationRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleLocationRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Notification & messaging
      [REPOSITORY_TOKENS.NotificationRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleNotificationRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.NotificationDeliveryRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleNotificationDeliveryRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.NotificationScheduleRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleNotificationScheduleRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Challenge & submission
      [REPOSITORY_TOKENS.ChallengeSubmissionRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleChallengeSubmissionRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.ChallengeVoteRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleChallengeVoteRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.ActivityFeedRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleActivityFeedRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Reward & gamification
      [REPOSITORY_TOKENS.RewardRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleRewardRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.RewardPurchaseRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleRewardPurchaseRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.CoinTransactionRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleCoinTransactionRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Support & moderation
      [REPOSITORY_TOKENS.SponsorRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleSponsorRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
      [REPOSITORY_TOKENS.SubmissionReportRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleSubmissionReportRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },

      // Event
      [REPOSITORY_TOKENS.EventRepository]: {
        factory: (cradle: Record<string, unknown>) =>
          new DrizzleEventRepository(
            cradle.drizzle as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
          ),
        lifetime: Lifetime.SINGLETON,
      },
    },
  });

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { DrizzleUserRepository } from "../gateways/drizzle/user";
export { DrizzleTripRepository } from "../gateways/drizzle/trip";
export { DrizzleChallengeRepository } from "../gateways/drizzle/challenge";
export { DrizzleGroupRepository } from "../gateways/drizzle/group";
export { DrizzleLocationRepository } from "../gateways/drizzle/location";
export { DrizzleNotificationRepository } from "../gateways/drizzle/notification";
export { DrizzleChallengeSubmissionRepository } from "../gateways/drizzle/challenge-submission";
export { DrizzleChallengeVoteRepository } from "../gateways/drizzle/challenge-vote";
export { DrizzleActivityFeedRepository } from "../gateways/drizzle/activity-feed";
export { DrizzleSponsorRepository } from "../gateways/drizzle/sponsor";
export { DrizzleSubmissionReportRepository } from "../gateways/drizzle/submission-report";
export {
  DrizzleRewardRepository,
  DrizzleRewardPurchaseRepository,
} from "../gateways/drizzle/reward";
export { DrizzleCoinTransactionRepository } from "../gateways/drizzle/coin-transaction";
export { DrizzleNotificationDeliveryRepository } from "../gateways/drizzle/notification-delivery";
export { DrizzleNotificationScheduleRepository } from "../gateways/drizzle/notification-schedule";
export { DrizzleEventRepository } from "../gateways/drizzle/event";
