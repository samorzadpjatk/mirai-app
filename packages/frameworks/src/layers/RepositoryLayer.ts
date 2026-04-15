/**
 * RepositoryLayer - Effect Layer composition for all repository bindings
 *
 * This module provides factory functions that create Effect Layers binding
 * repository Context.Tags to their Drizzle gateway implementations.
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
import { DrizzleUserGateway } from "@mirai-app/adapters/gateways/user/drizzle/gateway";
import { DrizzleGroupGateway } from "@mirai-app/adapters/gateways/group/drizzle/gateway";
import { DrizzleLocationGateway } from "@mirai-app/adapters/gateways/location/drizzle/gateway";

// Trip/Reward Domain
import { DrizzleTripGateway } from "@mirai-app/adapters/gateways/trip/drizzle/gateway";
import {
  DrizzleRewardGateway,
  DrizzleRewardPurchaseGateway,
} from "@mirai-app/adapters/gateways/reward/drizzle/gateway";

// Challenge Domain
import { DrizzleChallengeGateway } from "@mirai-app/adapters/gateways/challenge/drizzle/gateway";
import { DrizzleChallengeSubmissionGateway } from "@mirai-app/adapters/gateways/challenge/drizzle/submission";
import { DrizzleChallengeVoteGateway } from "@mirai-app/adapters/gateways/challenge/drizzle/vote";

// Notification Domain
import { DrizzleNotificationGateway } from "@mirai-app/adapters/gateways/notification/drizzle/gateway";
import { DrizzleNotificationDeliveryGateway } from "@mirai-app/adapters/gateways/notification/drizzle/delivery";
import { DrizzleNotificationScheduleGateway } from "@mirai-app/adapters/gateways/notification/drizzle/schedule";

// Content/Activity Domain
import { DrizzleActivityFeedGateway } from "@mirai-app/adapters/gateways/activity-feed/drizzle/gateway";
import { DrizzleEventGateway } from "@mirai-app/adapters/gateways/event/drizzle/gateway";
import { DrizzleSponsorGateway } from "@mirai-app/adapters/gateways/sponsor/drizzle/gateway";

// Reporting/Admin Domain
import { DrizzleSubmissionReportGateway } from "@mirai-app/adapters/gateways/submission-report/drizzle/gateway";
import { DrizzleCoinTransactionGateway } from "@mirai-app/adapters/gateways/coin-transaction/drizzle/gateway";

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
    Layer.succeed(UserRepositoryTag, new DrizzleUserGateway(db)),
    Layer.succeed(GroupRepositoryTag, new DrizzleGroupGateway(db)),
    Layer.succeed(LocationRepositoryTag, new DrizzleLocationGateway(db)),
  );

/**
 * Trip/Reward domain repositories
 * - TripRepositoryTag
 * - RewardRepositoryTag
 * - RewardPurchaseRepositoryTag
 */
export const makeTripRewardDomainLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    Layer.succeed(TripRepositoryTag, new DrizzleTripGateway(db)),
    Layer.succeed(RewardRepositoryTag, new DrizzleRewardGateway(db)),
    Layer.succeed(
      RewardPurchaseRepositoryTag,
      new DrizzleRewardPurchaseGateway(db),
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
    Layer.succeed(ChallengeRepositoryTag, new DrizzleChallengeGateway(db)),
    Layer.succeed(
      ChallengeSubmissionRepositoryTag,
      new DrizzleChallengeSubmissionGateway(db),
    ),
    Layer.succeed(
      ChallengeVoteRepositoryTag,
      new DrizzleChallengeVoteGateway(db),
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
      new DrizzleNotificationGateway(db),
    ),
    Layer.succeed(
      NotificationDeliveryRepositoryTag,
      new DrizzleNotificationDeliveryGateway(db),
    ),
    Layer.succeed(
      NotificationScheduleRepositoryTag,
      new DrizzleNotificationScheduleGateway(db),
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
      new DrizzleActivityFeedGateway(db),
    ),
    Layer.succeed(EventRepositoryTag, new DrizzleEventGateway(db)),
    Layer.succeed(SponsorRepositoryTag, new DrizzleSponsorGateway(db)),
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
      new DrizzleSubmissionReportGateway(db),
    ),
    Layer.succeed(
      CoinTransactionRepositoryTag,
      new DrizzleCoinTransactionGateway(db),
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
