/**
 * RepositoryModule - Data Access Layer Module
 *
 * Provides all 16 Prisma repository implementations as injectable services.
 * This module serves as the data access layer in the Clean Architecture,
 * bridging domain entities with the Prisma ORM.
 *
 * ## Repository Catalog (16 repositories)
 *
 * | Token | Class | Interface |
 * |-------|-------|-----------|
 * | `userRepository` | PrismaUserRepository | UserRepository |
 * | `tripRepository` | PrismaTripRepository | TripRepository |
 * | `challengeRepository` | PrismaChallengeRepository | ChallengeRepository |
 * | `groupRepository` | PrismaGroupRepository | GroupRepository |
 * | `locationRepository` | PrismaLocationRepository | LocationRepository |
 * | `notificationRepository` | PrismaNotificationRepository | NotificationRepository |
 * | `challengeSubmissionRepository` | PrismaChallengeSubmissionRepository | ChallengeSubmissionRepository |
 * | `challengeVoteRepository` | PrismaChallengeVoteRepository | ChallengeVoteRepository |
 * | `activityFeedRepository` | PrismaActivityFeedRepository | ActivityFeedRepository |
 * | `sponsorRepository` | PrismaSponsorRepository | SponsorRepository |
 * | `submissionReportRepository` | PrismaSubmissionReportRepository | SubmissionReportRepository |
 * | `rewardRepository` | PrismaRewardRepository | RewardRepository |
 * | `rewardPurchaseRepository` | PrismaRewardPurchaseRepository | RewardPurchaseRepository |
 * | `coinTransactionRepository` | PrismaCoinTransactionRepository | CoinTransactionRepository |
 * | `notificationDeliveryRepository` | PrismaNotificationDeliveryRepository | NotificationDeliveryRepository |
 * | `notificationScheduleRepository` | PrismaNotificationScheduleRepository | NotificationScheduleRepository |
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
 * This module depends on `prismaClient` being available in the container.
 * PrismaClient is typically registered at the root level in AppModule or
 * a Common/Framework module.
 *
 * ## Provider Format
 *
 * This module uses the awilix-modular format compatible with the container's
 * `registerModule` function. Providers are configured as factory objects that
 * get resolved with the prismaClient dependency.
 *
 * @module RepositoryModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";

// =============================================================================
// Repository Imports
// =============================================================================

import { PrismaUserRepository } from "../gateways/PrismaUserRepository";
import { PrismaTripRepository } from "../gateways/PrismaTripRepository";
import { PrismaChallengeRepository } from "../gateways/PrismaChallengeRepository";
import { PrismaGroupRepository } from "../gateways/PrismaGroupRepository";
import { PrismaLocationRepository } from "../gateways/PrismaLocationRepository";
import { PrismaNotificationRepository } from "../gateways/PrismaNotificationRepository";
import { PrismaChallengeSubmissionRepository } from "../gateways/PrismaChallengeSubmissionRepository";
import { PrismaChallengeVoteRepository } from "../gateways/PrismaChallengeVoteRepository";
import { PrismaActivityFeedRepository } from "../gateways/PrismaActivityFeedRepository";
import { PrismaSponsorRepository } from "../gateways/PrismaSponsorRepository";
import { PrismaSubmissionReportRepository } from "../gateways/PrismaSubmissionReportRepository";
import {
  PrismaRewardRepository,
  PrismaRewardPurchaseRepository,
} from "../gateways/PrismaRewardRepository";
import { PrismaCoinTransactionRepository } from "../gateways/PrismaCoinTransactionRepository";
import { PrismaNotificationDeliveryRepository } from "../gateways/PrismaNotificationDeliveryRepository";
import { PrismaNotificationScheduleRepository } from "../gateways/PrismaNotificationScheduleRepository";

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

  /** PrismaClient from parent container */
  prisma: unknown; // PrismaClient type from frameworks
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
    [REPOSITORY_TOKENS.UserRepository]: typeof PrismaUserRepository;
    [REPOSITORY_TOKENS.TripRepository]: typeof PrismaTripRepository;
    [REPOSITORY_TOKENS.ChallengeRepository]: typeof PrismaChallengeRepository;
    [REPOSITORY_TOKENS.GroupRepository]: typeof PrismaGroupRepository;
    [REPOSITORY_TOKENS.LocationRepository]: typeof PrismaLocationRepository;
    [REPOSITORY_TOKENS.NotificationRepository]: typeof PrismaNotificationRepository;
    [REPOSITORY_TOKENS.ChallengeSubmissionRepository]: typeof PrismaChallengeSubmissionRepository;
    [REPOSITORY_TOKENS.ChallengeVoteRepository]: typeof PrismaChallengeVoteRepository;
    [REPOSITORY_TOKENS.ActivityFeedRepository]: typeof PrismaActivityFeedRepository;
    [REPOSITORY_TOKENS.SponsorRepository]: typeof PrismaSponsorRepository;
    [REPOSITORY_TOKENS.SubmissionReportRepository]: typeof PrismaSubmissionReportRepository;
    [REPOSITORY_TOKENS.RewardRepository]: typeof PrismaRewardRepository;
    [REPOSITORY_TOKENS.RewardPurchaseRepository]: typeof PrismaRewardPurchaseRepository;
    [REPOSITORY_TOKENS.CoinTransactionRepository]: typeof PrismaCoinTransactionRepository;
    [REPOSITORY_TOKENS.NotificationDeliveryRepository]: typeof PrismaNotificationDeliveryRepository;
    [REPOSITORY_TOKENS.NotificationScheduleRepository]: typeof PrismaNotificationScheduleRepository;
  };
  exports: RepositoryToken[];
}

// =============================================================================
// Module Creation
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cradle = any;

/**
 * Create repository instances with PrismaClient injection
 *
 * Each factory receives the container's cradle (dependencies) and extracts
 * the 'prisma' dependency to pass to the repository constructor.
 */
function createUserRepository(cradle: Cradle): UserRepository {
  return new PrismaUserRepository(cradle.prisma);
}

function createTripRepository(cradle: Cradle): TripRepository {
  return new PrismaTripRepository(cradle.prisma);
}

function createChallengeRepository(cradle: Cradle): ChallengeRepository {
  return new PrismaChallengeRepository(cradle.prisma);
}

function createGroupRepository(cradle: Cradle): GroupRepository {
  return new PrismaGroupRepository(cradle.prisma);
}

function createLocationRepository(cradle: Cradle): LocationRepository {
  return new PrismaLocationRepository(cradle.prisma);
}

function createNotificationRepository(cradle: Cradle): NotificationRepository {
  return new PrismaNotificationRepository(cradle.prisma);
}

function createChallengeSubmissionRepository(
  cradle: Cradle,
): ChallengeSubmissionRepository {
  return new PrismaChallengeSubmissionRepository(cradle.prisma);
}

function createChallengeVoteRepository(
  cradle: Cradle,
): ChallengeVoteRepository {
  return new PrismaChallengeVoteRepository(cradle.prisma);
}

function createActivityFeedRepository(cradle: Cradle): ActivityFeedRepository {
  return new PrismaActivityFeedRepository(cradle.prisma);
}

function createSponsorRepository(cradle: Cradle): SponsorRepository {
  return new PrismaSponsorRepository(cradle.prisma);
}

function createSubmissionReportRepository(
  cradle: Cradle,
): SubmissionReportRepository {
  return new PrismaSubmissionReportRepository(cradle.prisma);
}

function createRewardRepository(cradle: Cradle): RewardRepository {
  return new PrismaRewardRepository(cradle.prisma);
}

function createRewardPurchaseRepository(
  cradle: Cradle,
): RewardPurchaseRepository {
  return new PrismaRewardPurchaseRepository(cradle.prisma);
}

function createCoinTransactionRepository(
  cradle: Cradle,
): CoinTransactionRepository {
  return new PrismaCoinTransactionRepository(cradle.prisma);
}

function createNotificationDeliveryRepository(
  cradle: Cradle,
): NotificationDeliveryRepository {
  return new PrismaNotificationDeliveryRepository(cradle.prisma);
}

function createNotificationScheduleRepository(
  cradle: Cradle,
): NotificationScheduleRepository {
  return new PrismaNotificationScheduleRepository(cradle.prisma);
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * RepositoryModule - Static module containing all 16 repository providers
 *
 * All repositories are registered with singleton lifetime because:
 * - They are stateless (contain no mutable instance state)
 * - Thread-safe (PrismaClient handles connection pooling internally)
 * - Can be safely shared across concurrent requests
 * - No per-request state that requires scoping
 *
 * The factory pattern is used to inject PrismaClient into each repository.
 *
 * @example
 * ```typescript
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
 *
 * const container = initializeContainer([
 *   RepositoryModule,  // Provides all 16 repositories
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
      // Core domain repositories - using classes directly for dependency injection
      [REPOSITORY_TOKENS.UserRepository]: PrismaUserRepository,
      [REPOSITORY_TOKENS.TripRepository]: PrismaTripRepository,
      [REPOSITORY_TOKENS.ChallengeRepository]: PrismaChallengeRepository,
      [REPOSITORY_TOKENS.GroupRepository]: PrismaGroupRepository,
      [REPOSITORY_TOKENS.LocationRepository]: PrismaLocationRepository,

      // Notification & messaging repositories
      [REPOSITORY_TOKENS.NotificationRepository]: PrismaNotificationRepository,
      [REPOSITORY_TOKENS.NotificationDeliveryRepository]:
        PrismaNotificationDeliveryRepository,
      [REPOSITORY_TOKENS.NotificationScheduleRepository]:
        PrismaNotificationScheduleRepository,

      // Challenge & submission repositories
      [REPOSITORY_TOKENS.ChallengeSubmissionRepository]:
        PrismaChallengeSubmissionRepository,
      [REPOSITORY_TOKENS.ChallengeVoteRepository]:
        PrismaChallengeVoteRepository,
      [REPOSITORY_TOKENS.ActivityFeedRepository]: PrismaActivityFeedRepository,

      // Reward & gamification repositories
      [REPOSITORY_TOKENS.RewardRepository]: PrismaRewardRepository,
      [REPOSITORY_TOKENS.RewardPurchaseRepository]:
        PrismaRewardPurchaseRepository,
      [REPOSITORY_TOKENS.CoinTransactionRepository]:
        PrismaCoinTransactionRepository,

      // Support & moderation repositories
      [REPOSITORY_TOKENS.SponsorRepository]: PrismaSponsorRepository,
      [REPOSITORY_TOKENS.SubmissionReportRepository]:
        PrismaSubmissionReportRepository,
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
    ],
  });

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { PrismaUserRepository } from "../gateways/PrismaUserRepository";
export { PrismaTripRepository } from "../gateways/PrismaTripRepository";
export { PrismaChallengeRepository } from "../gateways/PrismaChallengeRepository";
export { PrismaGroupRepository } from "../gateways/PrismaGroupRepository";
export { PrismaLocationRepository } from "../gateways/PrismaLocationRepository";
export { PrismaNotificationRepository } from "../gateways/PrismaNotificationRepository";
export { PrismaChallengeSubmissionRepository } from "../gateways/PrismaChallengeSubmissionRepository";
export { PrismaChallengeVoteRepository } from "../gateways/PrismaChallengeVoteRepository";
export { PrismaActivityFeedRepository } from "../gateways/PrismaActivityFeedRepository";
export { PrismaSponsorRepository } from "../gateways/PrismaSponsorRepository";
export { PrismaSubmissionReportRepository } from "../gateways/PrismaSubmissionReportRepository";
export {
  PrismaRewardRepository,
  PrismaRewardPurchaseRepository,
} from "../gateways/PrismaRewardRepository";
export { PrismaCoinTransactionRepository } from "../gateways/PrismaCoinTransactionRepository";
export { PrismaNotificationDeliveryRepository } from "../gateways/PrismaNotificationDeliveryRepository";
export { PrismaNotificationScheduleRepository } from "../gateways/PrismaNotificationScheduleRepository";
