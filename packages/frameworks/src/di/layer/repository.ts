/**
 * Repository Layer - Effect Layer Composition for All Domain Repositories
 *
 * This module binds all Context.Tags from the use-cases layer to their
 * concrete implementations from the adapters layer.
 */

import { Layer } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

import { UserPortTag } from "@mirai-app/use-cases/user/ports/UserPort";
import { TripParticipantPortTag } from "@mirai-app/use-cases/user/ports/TripParticipantPort";
import { TripPortTag } from "@mirai-app/use-cases/trip/ports/TripPort";
import { GroupPortTag } from "@mirai-app/use-cases/group/ports/GroupPort";
import { GroupJoinRequestPortTag } from "@mirai-app/use-cases/group/ports/GroupJoinRequestPort";
import { ChallengePortTag } from "@mirai-app/use-cases/challenge/ports/ChallengePort";
import { ChallengeSubmissionPortTag } from "@mirai-app/use-cases/challenge-submission/ports/ChallengeSubmissionPort";
import { ChallengeVotePortTag } from "@mirai-app/use-cases/challenge-vote/ports/ChallengeVotePort";
import {
  NotificationPortTag,
  PushSubscriptionPortTag,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  LocationPortTag,
  LocationSharingRequestPortTag,
} from "@mirai-app/use-cases/location/ports";
import {
  ActivityFeedPortTag,
  ActivityReactionPortTag,
} from "@mirai-app/use-cases/activity-feed/ports";
import {
  RewardPortTag,
  RewardPurchasePortTag,
} from "@mirai-app/use-cases/reward/ports";
import { CoinTransactionPortTag } from "@mirai-app/use-cases/coin/ports/CoinTransactionPort";
import {
  SponsorPortTag,
  TripSponsorPortTag,
} from "@mirai-app/use-cases/sponsor/ports";
import { SubmissionReportPortTag } from "@mirai-app/use-cases/submission-report/ports/SubmissionReportPort";
import {
  StoragePathResolverPortTag,
  StoragePortTag,
} from "@mirai-app/use-cases/storage/ports";

// Adapter implementations
import {
  UserDrizzleGateway,
  TripParticipantDrizzleGateway,
  TripDrizzleGateway,
  GroupDrizzleGateway,
  GroupJoinRequestDrizzleGateway,
  ChallengeDrizzleGateway,
  ChallengeSubmissionDrizzleGateway,
  ChallengeVoteDrizzleGateway,
  NotificationDrizzleGateway,
  PushSubscriptionDrizzleGateway,
  LocationDrizzleGateway,
  ActivityFeedDrizzleGateway,
  ActivityReactionDrizzleGateway,
  RewardDrizzleGateway,
  RewardPurchaseDrizzleGateway,
  CoinTransactionDrizzleGateway,
  SponsorDrizzleGateway,
  TripSponsorDrizzleGateway,
  SubmissionReportDrizzleGateway,
  LocationSharingRequestDrizzleGateway,
  SupabaseStorageGateway,
} from "@mirai-app/adapters";

// Storage path resolver implementation from adapters
import { DefaultStoragePathResolver } from "@mirai-app/adapters";

/**
 * Configuration for creating repository layers
 */
export interface RepositoryLayerConfig {
  /** Drizzle database client */
  db: DrizzleDb;
  /** Supabase client - required for storage operations */
  supabase?: SupabaseClient;
}

/**
 * Creates the complete repository Layer with all domain repositories.
 *
 * Binds all Context.Tags from use-cases to their Drizzle implementations.
 *
 * @example
 * ```typescript
 * const repoLayer = makeRepositoryLayer({ db });
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserPortTag;
 *   const tripRepo = yield* TripPortTag;
 *   // ... all repositories available
 * }).pipe(Effect.provide(repoLayer));
 * ```
 */
export const makeRepositoryLayer = (config: RepositoryLayerConfig) => {
  return Layer.mergeAll(
    makeUserRepositoryLayer(config),
    makeTripRepositoryLayer(config),
    makeGroupRepositoryLayer(config),
    makeChallengeRepositoryLayer(config),
    makeChallengeSubmissionRepositoryLayer(config),
    makeChallengeVoteRepositoryLayer(config),
    makeNotificationRepositoryLayer(config),
    makeLocationRepositoryLayer(config),
    makeActivityFeedRepositoryLayer(config),
    makeRewardRepositoryLayer(config),
    makeCoinTransactionRepositoryLayer(config),
    makeSponsorRepositoryLayer(config),
    makeSubmissionReportRepositoryLayer(config),
    makeStorageRepositoryLayer(config),
  );
};

/**
 * Creates the User repository Layer.
 */
export const makeUserRepositoryLayer = (config: RepositoryLayerConfig) => {
  const userGateway = new UserDrizzleGateway(config.db);
  const tripParticipantGateway = new TripParticipantDrizzleGateway(config.db);

  return Layer.merge(
    Layer.succeed(UserPortTag, userGateway),
    Layer.succeed(TripParticipantPortTag, tripParticipantGateway),
  );
};

/**
 * Creates the Trip repository Layer.
 */
export const makeTripRepositoryLayer = (config: RepositoryLayerConfig) => {
  const tripGateway = new TripDrizzleGateway(config.db);

  return Layer.succeed(TripPortTag, tripGateway);
};

/**
 * Creates the Group repository Layer.
 */
export const makeGroupRepositoryLayer = (config: RepositoryLayerConfig) => {
  const groupGateway = new GroupDrizzleGateway(config.db);
  const groupJoinRequestGateway = new GroupJoinRequestDrizzleGateway(config.db);

  return Layer.merge(
    Layer.succeed(GroupPortTag, groupGateway),
    Layer.succeed(GroupJoinRequestPortTag, groupJoinRequestGateway),
  );
};

/**
 * Creates the Challenge repository Layer.
 */
export const makeChallengeRepositoryLayer = (config: RepositoryLayerConfig) => {
  const challengeGateway = new ChallengeDrizzleGateway(config.db);

  return Layer.succeed(ChallengePortTag, challengeGateway);
};

/**
 * Creates the ChallengeSubmission repository Layer.
 */
export const makeChallengeSubmissionRepositoryLayer = (
  config: RepositoryLayerConfig,
) => {
  const submissionGateway = new ChallengeSubmissionDrizzleGateway(config.db);

  return Layer.succeed(ChallengeSubmissionPortTag, submissionGateway);
};

/**
 * Creates the ChallengeVote repository Layer.
 */
export const makeChallengeVoteRepositoryLayer = (
  config: RepositoryLayerConfig,
) => {
  const voteGateway = new ChallengeVoteDrizzleGateway(config.db);

  return Layer.succeed(ChallengeVotePortTag, voteGateway);
};

/**
 * Creates the Notification repository Layer.
 */
export const makeNotificationRepositoryLayer = (
  config: RepositoryLayerConfig,
) => {
  const notificationGateway = new NotificationDrizzleGateway(config.db);
  const pushSubscriptionGateway = new PushSubscriptionDrizzleGateway(config.db);

  return Layer.merge(
    Layer.succeed(NotificationPortTag, notificationGateway),
    Layer.succeed(PushSubscriptionPortTag, pushSubscriptionGateway),
  );
};

/**
 * Creates the Location repository Layer.
 *
 */
export const makeLocationRepositoryLayer = (config: RepositoryLayerConfig) => {
  const locationGateway = new LocationDrizzleGateway(config.db);
  const locationSharingGateway = new LocationSharingRequestDrizzleGateway(
    config.db,
  );

  return Layer.merge(
    Layer.succeed(LocationPortTag, locationGateway),
    Layer.succeed(LocationSharingRequestPortTag, locationSharingGateway),
  );
};

/**
 * Creates the ActivityFeed repository Layer.
 *
 */
export const makeActivityFeedRepositoryLayer = (
  config: RepositoryLayerConfig,
) => {
  const activityGateway = new ActivityFeedDrizzleGateway(config.db);
  const activityReactionGateway = new ActivityReactionDrizzleGateway(config.db);

  return Layer.merge(
    Layer.succeed(ActivityFeedPortTag, activityGateway),
    Layer.succeed(ActivityReactionPortTag, activityReactionGateway),
  );
};

/**
 * Creates the Reward repository Layer.
 */
export const makeRewardRepositoryLayer = (config: RepositoryLayerConfig) => {
  const rewardGateway = new RewardDrizzleGateway(config.db);
  const rewardPurchaseGateway = new RewardPurchaseDrizzleGateway(config.db);

  return Layer.merge(
    Layer.succeed(RewardPortTag, rewardGateway),
    Layer.succeed(RewardPurchasePortTag, rewardPurchaseGateway),
  );
};

/**
 * Creates the CoinTransaction repository Layer.
 */
export const makeCoinTransactionRepositoryLayer = (
  config: RepositoryLayerConfig,
) => {
  const coinGateway = new CoinTransactionDrizzleGateway(config.db);

  return Layer.succeed(CoinTransactionPortTag, coinGateway);
};

/**
 * Creates the Sponsor repository Layer.
 */
export const makeSponsorRepositoryLayer = (config: RepositoryLayerConfig) => {
  const sponsorGateway = new SponsorDrizzleGateway(config.db);
  const tripSponsorGateway = new TripSponsorDrizzleGateway(config.db);

  return Layer.merge(
    Layer.succeed(SponsorPortTag, sponsorGateway),
    Layer.succeed(TripSponsorPortTag, tripSponsorGateway),
  );
};

/**
 * Creates the TripSponsor repository Layer.
 */
export const makeTripSponsorRepositoryLayer = (
  config: RepositoryLayerConfig,
) => {
  const tripSponsorGateway = new TripSponsorDrizzleGateway(config.db);

  return Layer.succeed(TripSponsorPortTag, tripSponsorGateway);
};

/**
 * Creates the SubmissionReport repository Layer.
 */
export const makeSubmissionReportRepositoryLayer = (
  config: RepositoryLayerConfig,
) => {
  const reportGateway = new SubmissionReportDrizzleGateway(config.db);

  return Layer.succeed(SubmissionReportPortTag, reportGateway);
};

/**
 * Creates the Storage repository Layer.
 *
 * Provides StoragePathResolverPortTag always.
 * Provides StoragePortTag when supabase is provided in config.
 */
export const makeStorageRepositoryLayer = (config: RepositoryLayerConfig) => {
  const pathResolver = new DefaultStoragePathResolver();
  const pathResolverLayer = Layer.succeed(
    StoragePathResolverPortTag,
    pathResolver,
  );

  // Provide full storage gateway when supabase is available
  if (config.supabase) {
    const storageGateway = new SupabaseStorageGateway(config.supabase);
    const storageLayer = Layer.succeed(StoragePortTag, storageGateway);

    return Layer.merge(pathResolverLayer, storageLayer);
  }

  // Otherwise only provide the path resolver
  return pathResolverLayer;
};
