/**
 * RepositoryLayer - Effect Layer composition for all repository bindings
 *
 * This module provides factory functions that create Effect Layers binding
 * repository Context.Tags to their Drizzle implementations.
 *
 * Pattern follows CLAUDE.md §10.4 Layer composition guidelines:
 * - Layer.succeed for direct bindings (no async required)
 * - Layer.mergeAll for composition
 * - Grouped by domain for readability
 *
 * @module layers/RepositoryLayer
 */

import { Layer } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";

// =============================================================================
// Repository Tags (Ports)
// =============================================================================

import {
  // User/Group Domain
  UserRepositoryTag,
  GroupRepositoryTag,
  LocationRepositoryTag,
  // Trip/Reward Domain
  TripRepositoryTag,
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  // Challenge Domain
  ChallengeRepositoryTag,
  ChallengeSubmissionRepositoryTag,
  ChallengeVoteRepositoryTag,
  // Notification Domain
  NotificationRepositoryTag,
  NotificationDeliveryRepositoryTag,
  NotificationScheduleRepositoryTag,
  // Content/Activity Domain
  ActivityFeedRepositoryTag,
  EventRepositoryTag,
  SponsorRepositoryTag,
  // Reporting/Admin Domain
  SubmissionReportRepositoryTag,
  CoinTransactionRepositoryTag,
} from "@mirai-app/use-cases";

// =============================================================================
// Drizzle Implementations (Gateways)
// =============================================================================

// User/Group Domain
import { DrizzleUserRepository } from "@mirai-app/adapters/gateways/drizzle/user";
import { DrizzleGroupRepository } from "@mirai-app/adapters/gateways/drizzle/group";
import { DrizzleLocationRepository } from "@mirai-app/adapters/gateways/drizzle/location";

// Trip/Reward Domain
import { DrizzleTripRepository } from "@mirai-app/adapters/gateways/drizzle/trip";
import {
  DrizzleRewardRepository,
  DrizzleRewardPurchaseRepository,
} from "@mirai-app/adapters/gateways/drizzle/reward";

// Challenge Domain
import { DrizzleChallengeRepository } from "@mirai-app/adapters/gateways/drizzle/challenge";
import { DrizzleChallengeSubmissionRepository } from "@mirai-app/adapters/gateways/drizzle/challenge-submission";
import { DrizzleChallengeVoteRepository } from "@mirai-app/adapters/gateways/drizzle/challenge-vote";

// Notification Domain
import { DrizzleNotificationRepository } from "@mirai-app/adapters/gateways/drizzle/notification";
import { DrizzleNotificationDeliveryRepository } from "@mirai-app/adapters/gateways/drizzle/notification-delivery";
import { DrizzleNotificationScheduleRepository } from "@mirai-app/adapters/gateways/drizzle/notification-schedule";

// Content/Activity Domain
import { DrizzleActivityFeedRepository } from "@mirai-app/adapters/gateways/drizzle/activity-feed";
import { DrizzleEventRepository } from "@mirai-app/adapters/gateways/drizzle/event";
import { DrizzleSponsorRepository } from "@mirai-app/adapters/gateways/drizzle/sponsor";

// Reporting/Admin Domain
import { DrizzleSubmissionReportRepository } from "@mirai-app/adapters/gateways/drizzle/submission-report";
import { DrizzleCoinTransactionRepository } from "@mirai-app/adapters/gateways/drizzle/coin-transaction";

// =============================================================================
// Domain-Grouped Repository Factories
// =============================================================================

/**
 * User domain repositories
 * - UserRepositoryTag
 * - GroupRepositoryTag
 * - LocationRepositoryTag
 */
export const makeUserDomainLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    Layer.succeed(UserRepositoryTag, new DrizzleUserRepository(db)),
    Layer.succeed(GroupRepositoryTag, new DrizzleGroupRepository(db)),
    Layer.succeed(LocationRepositoryTag, new DrizzleLocationRepository(db)),
  );

/**
 * Trip/Reward domain repositories
 * - TripRepositoryTag
 * - RewardRepositoryTag
 * - RewardPurchaseRepositoryTag
 */
export const makeTripRewardDomainLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    Layer.succeed(TripRepositoryTag, new DrizzleTripRepository(db)),
    Layer.succeed(RewardRepositoryTag, new DrizzleRewardRepository(db)),
    Layer.succeed(
      RewardPurchaseRepositoryTag,
      new DrizzleRewardPurchaseRepository(db),
    ),
  );

/**
 * Challenge domain repositories
 * - ChallengeRepositoryTag
 * - ChallengeSubmissionRepositoryTag
 * - ChallengeVoteRepositoryTag
 */
export const makeChallengeDomainLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    Layer.succeed(ChallengeRepositoryTag, new DrizzleChallengeRepository(db)),
    Layer.succeed(
      ChallengeSubmissionRepositoryTag,
      new DrizzleChallengeSubmissionRepository(db),
    ),
    Layer.succeed(
      ChallengeVoteRepositoryTag,
      new DrizzleChallengeVoteRepository(db),
    ),
  );

/**
 * Notification domain repositories
 * - NotificationRepositoryTag
 * - NotificationDeliveryRepositoryTag
 * - NotificationScheduleRepositoryTag
 */
export const makeNotificationDomainLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    Layer.succeed(
      NotificationRepositoryTag,
      new DrizzleNotificationRepository(db),
    ),
    Layer.succeed(
      NotificationDeliveryRepositoryTag,
      new DrizzleNotificationDeliveryRepository(db),
    ),
    Layer.succeed(
      NotificationScheduleRepositoryTag,
      new DrizzleNotificationScheduleRepository(db),
    ),
  );

/**
 * Content/Activity domain repositories
 * - ActivityFeedRepositoryTag
 * - EventRepositoryTag
 * - SponsorRepositoryTag
 */
export const makeContentDomainLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    Layer.succeed(
      ActivityFeedRepositoryTag,
      new DrizzleActivityFeedRepository(db),
    ),
    Layer.succeed(EventRepositoryTag, new DrizzleEventRepository(db)),
    Layer.succeed(SponsorRepositoryTag, new DrizzleSponsorRepository(db)),
  );

/**
 * Reporting/Admin domain repositories
 * - SubmissionReportRepositoryTag
 * - CoinTransactionRepositoryTag
 */
export const makeReportingDomainLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    Layer.succeed(
      SubmissionReportRepositoryTag,
      new DrizzleSubmissionReportRepository(db),
    ),
    Layer.succeed(
      CoinTransactionRepositoryTag,
      new DrizzleCoinTransactionRepository(db),
    ),
  );

// =============================================================================
// Full Repository Layer
// =============================================================================

/**
 * Creates a complete Layer with all repository bindings.
 *
 * This is the primary factory for repository dependency injection.
 * All 19 repository Context.Tags are bound to their Drizzle implementations.
 *
 * @example
 * ```typescript
 * import { makeRepositoryLayer } from "@mirai-app/frameworks/layers/RepositoryLayer";
 * import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
 *
 * const db = createDrizzleClient(databaseUrl);
 * const repositoryLayer = makeRepositoryLayer(db);
 *
 * // Use in Effect program
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserRepositoryTag;
 *   return yield* userRepo.findById("123");
 * }).pipe(Effect.provide(repositoryLayer));
 * ```
 *
 * @param db - Drizzle database client
 * @returns Layer containing all repository bindings
 */
export const makeRepositoryLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    makeUserDomainLayer(db),
    makeTripRewardDomainLayer(db),
    makeChallengeDomainLayer(db),
    makeNotificationDomainLayer(db),
    makeContentDomainLayer(db),
    makeReportingDomainLayer(db),
  );

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type { DrizzleDb };
