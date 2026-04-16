/**
 * Repository Layers - Effect Layer bindings for Domain Gateways
 *
 * This module creates Effect Layers that bind gateway implementations
 * to their respective Context.Tags from the use-cases layer.
 */

import { Layer } from "effect";
import type { DrizzleDb } from "../../drizzle/client";

// Import Drizzle gateways from adapters (exported from main index)
import {
  DrizzleUserGateway,
  DrizzleTripGateway,
  DrizzleGroupGateway,
  DrizzleChallengeGateway,
  DrizzleChallengeSubmissionGateway,
  DrizzleChallengeVoteGateway,
  DrizzleNotificationGateway,
  DrizzleNotificationDeliveryGateway,
  DrizzleNotificationScheduleGateway,
  DrizzleLocationGateway,
  DrizzleActivityFeedGateway,
  DrizzleRewardGateway,
  DrizzleCoinTransactionGateway,
  DrizzleSponsorGateway,
  DrizzleEventGateway,
  DrizzleSubmissionReportGateway,
} from "@mirai-app/adapters";

// Import Context Tags from use-cases main index
import {
  UserGatewayTag,
  TripGatewayTag,
  GroupGatewayTag,
  ChallengeGatewayTag,
  ChallengeSubmissionGatewayTag,
  ChallengeVoteGatewayTag,
  NotificationGatewayTag,
  NotificationDeliveryGatewayTag,
  NotificationScheduleGatewayTag,
  LocationGatewayTag,
  ActivityFeedGatewayTag,
  RewardGatewayTag,
  CoinTransactionGatewayTag,
  SponsorGatewayTag,
  EventGatewayTag,
  SubmissionReportGatewayTag,
} from "@mirai-app/use-cases";

/**
 * Configuration for repository layers
 */
export interface RepositoryLayerConfig {
  /** Drizzle database client */
  db: DrizzleDb;
}

/**
 * Creates a Layer that provides the UserGateway implementation
 */
export const makeUserRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(UserGatewayTag, new DrizzleUserGateway(config.db));

/**
 * Creates a Layer that provides the TripGateway implementation
 */
export const makeTripRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(TripGatewayTag, new DrizzleTripGateway(config.db));

/**
 * Creates a Layer that provides the GroupGateway implementation
 */
export const makeGroupRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(GroupGatewayTag, new DrizzleGroupGateway(config.db));

/**
 * Creates a Layer that provides the ChallengeGateway implementation
 */
export const makeChallengeRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(ChallengeGatewayTag, new DrizzleChallengeGateway(config.db));

/**
 * Creates a Layer that provides the ChallengeSubmissionGateway implementation
 */
export const makeChallengeSubmissionRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    ChallengeSubmissionGatewayTag,
    new DrizzleChallengeSubmissionGateway(config.db),
  );

/**
 * Creates a Layer that provides the ChallengeVoteGateway implementation
 */
export const makeChallengeVoteRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    ChallengeVoteGatewayTag,
    new DrizzleChallengeVoteGateway(config.db),
  );

/**
 * Creates a Layer that provides the NotificationGateway implementation
 */
export const makeNotificationRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    NotificationGatewayTag,
    new DrizzleNotificationGateway(config.db),
  );

/**
 * Creates a Layer that provides the NotificationDeliveryGateway implementation
 */
export const makeNotificationDeliveryRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    NotificationDeliveryGatewayTag,
    new DrizzleNotificationDeliveryGateway(config.db),
  );

/**
 * Creates a Layer that provides the NotificationScheduleGateway implementation
 */
export const makeNotificationScheduleRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    NotificationScheduleGatewayTag,
    new DrizzleNotificationScheduleGateway(config.db),
  );

/**
 * Creates a Layer that provides the LocationGateway implementation
 */
export const makeLocationRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(LocationGatewayTag, new DrizzleLocationGateway(config.db));

/**
 * Creates a Layer that provides the ActivityFeedGateway implementation
 */
export const makeActivityFeedRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    ActivityFeedGatewayTag,
    new DrizzleActivityFeedGateway(config.db),
  );

/**
 * Creates a Layer that provides the RewardGateway implementation
 */
export const makeRewardRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(RewardGatewayTag, new DrizzleRewardGateway(config.db));

/**
 * Creates a Layer that provides the CoinTransactionGateway implementation
 */
export const makeCoinTransactionRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    CoinTransactionGatewayTag,
    new DrizzleCoinTransactionGateway(config.db),
  );

/**
 * Creates a Layer that provides the SponsorGateway implementation
 */
export const makeSponsorRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(SponsorGatewayTag, new DrizzleSponsorGateway(config.db));

/**
 * Creates a Layer that provides the EventGateway implementation
 */
export const makeEventRepositoryLayer = (config: RepositoryLayerConfig) =>
  Layer.succeed(EventGatewayTag, new DrizzleEventGateway(config.db));

/**
 * Creates a Layer that provides the SubmissionReportGateway implementation
 */
export const makeSubmissionReportRepositoryLayer = (
  config: RepositoryLayerConfig,
) =>
  Layer.succeed(
    SubmissionReportGatewayTag,
    new DrizzleSubmissionReportGateway(config.db),
  );

/**
 * Creates a combined Layer with all repository implementations
 *
 * This merges all individual repository layers into a single Layer
 * that can be provided to Effects requiring any repository.
 */
export const makeRepositoryLayer = (config: RepositoryLayerConfig) => {
  const userLayer = makeUserRepositoryLayer(config);
  const tripLayer = makeTripRepositoryLayer(config);
  const groupLayer = makeGroupRepositoryLayer(config);
  const challengeLayer = makeChallengeRepositoryLayer(config);
  const challengeSubmissionLayer =
    makeChallengeSubmissionRepositoryLayer(config);
  const challengeVoteLayer = makeChallengeVoteRepositoryLayer(config);
  const notificationLayer = makeNotificationRepositoryLayer(config);
  const notificationDeliveryLayer =
    makeNotificationDeliveryRepositoryLayer(config);
  const notificationScheduleLayer =
    makeNotificationScheduleRepositoryLayer(config);
  const locationLayer = makeLocationRepositoryLayer(config);
  const activityFeedLayer = makeActivityFeedRepositoryLayer(config);
  const rewardLayer = makeRewardRepositoryLayer(config);
  const coinTransactionLayer = makeCoinTransactionRepositoryLayer(config);
  const sponsorLayer = makeSponsorRepositoryLayer(config);
  const eventLayer = makeEventRepositoryLayer(config);
  const submissionReportLayer = makeSubmissionReportRepositoryLayer(config);

  // Combine using pipe to avoid issues with Layer.mergeAll
  return userLayer.pipe(
    Layer.merge(tripLayer),
    Layer.merge(groupLayer),
    Layer.merge(challengeLayer),
    Layer.merge(challengeSubmissionLayer),
    Layer.merge(challengeVoteLayer),
    Layer.merge(notificationLayer),
    Layer.merge(notificationDeliveryLayer),
    Layer.merge(notificationScheduleLayer),
    Layer.merge(locationLayer),
    Layer.merge(activityFeedLayer),
    Layer.merge(rewardLayer),
    Layer.merge(coinTransactionLayer),
    Layer.merge(sponsorLayer),
    Layer.merge(eventLayer),
    Layer.merge(submissionReportLayer),
  );
};
