/**
 * Test Layer - Effect Layer utilities for testing
 *
 * This module provides utilities for creating test Layers with
 * mock implementations of repositories and services.
 *
 * ## Usage
 *
 * ```typescript
 * import { createTestLayer, runWithTestLayer } from "./test";
 * import { Effect } from "effect";
 * import { UserGatewayTag } from "@mirai-app/use-cases/ports/user/gateway";
 *
 * const testLayer = createTestLayer();
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserGatewayTag;
 *   return yield* userRepo.findById("123");
 * });
 *
 * const result = await runWithTestLayer(
 *   testLayer,
 *   program
 * );
 * ```
 */

import { Layer, Effect, Context } from "effect";

// Import InMemory gateways from adapters
import {
  InMemoryUserGateway,
  InMemoryTripGateway,
  InMemoryGroupGateway,
  InMemoryChallengeGateway,
  InMemoryChallengeSubmissionGateway,
  InMemoryChallengeVoteGateway,
  InMemoryNotificationGateway,
  InMemoryNotificationDeliveryGateway,
  InMemoryNotificationScheduleGateway,
  InMemoryLocationGateway,
  InMemoryActivityFeedGateway,
  InMemoryRewardGateway,
  InMemoryCoinTransactionGateway,
  InMemorySponsorGateway,
  InMemoryEventGateway,
  InMemorySubmissionReportGateway,
  InMemoryAuthAdapter,
  InMemoryStorageAdapter,
  InMemoryRealtimeAdapter,
  EventEmitterPubSub,
} from "@mirai-app/adapters";

// Import Context Tags and types from use-cases
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
  AuthPortTag,
  StoragePortTag,
  RealtimePortTag,
  PubSubServiceTag,
  type AuthPort,
  type StoragePort,
  type RealtimePort,
} from "@mirai-app/use-cases";

// =============================================================================
// Test Layer Configuration
// =============================================================================

/**
 * Configuration for creating test layers
 */
export interface TestLayerConfig {
  /** Optional custom mock implementations */
  mocks?: {
    auth?: Partial<AuthPort>;
    storage?: Partial<StoragePort>;
    realtime?: Partial<RealtimePort>;
  };
}

/**
 * Represents a test layer with all mock dependencies
 */
export interface TestLayer {
  /** The Effect Layer for dependency injection */
  layer: Layer.Layer<any, never, never>;
  /** Direct access to mock instances for assertions */
  mocks: {
    userGateway: InMemoryUserGateway;
    tripGateway: InMemoryTripGateway;
    groupGateway: InMemoryGroupGateway;
    challengeGateway: InMemoryChallengeGateway;
    challengeSubmissionGateway: InMemoryChallengeSubmissionGateway;
    challengeVoteGateway: InMemoryChallengeVoteGateway;
    notificationGateway: InMemoryNotificationGateway;
    notificationDeliveryGateway: InMemoryNotificationDeliveryGateway;
    notificationScheduleGateway: InMemoryNotificationScheduleGateway;
    locationGateway: InMemoryLocationGateway;
    activityFeedGateway: InMemoryActivityFeedGateway;
    rewardGateway: InMemoryRewardGateway;
    coinTransactionGateway: InMemoryCoinTransactionGateway;
    sponsorGateway: InMemorySponsorGateway;
    eventGateway: InMemoryEventGateway;
    submissionReportGateway: InMemorySubmissionReportGateway;
    authAdapter: InMemoryAuthAdapter;
    storageAdapter: InMemoryStorageAdapter;
    realtimeAdapter: InMemoryRealtimeAdapter;
    pubSub: EventEmitterPubSub;
  };
}

// =============================================================================
// Test Layer Creation
// =============================================================================

/**
 * Creates a complete test layer with all mock implementations
 *
 * This creates in-memory implementations of all repositories and services.
 *
 * @param config - Optional configuration for custom mocks
 * @returns A TestLayer with layer and mock instances
 *
 * @example
 * ```typescript
 * const testLayer = createTestLayer();
 *
 * // Use in tests
 * const result = await runWithTestLayer(
 *   testLayer,
 *   Effect.gen(function* () {
 *     const repo = yield* UserGatewayTag;
 *     return yield* repo.findById("1");
 *   })
 * );
 * ```
 */
export const createTestLayer = (config: TestLayerConfig = {}): TestLayer => {
  // Create mock instances
  const mockInstances = {
    userGateway: new InMemoryUserGateway(),
    tripGateway: new InMemoryTripGateway(),
    groupGateway: new InMemoryGroupGateway(),
    challengeGateway: new InMemoryChallengeGateway(),
    challengeSubmissionGateway: new InMemoryChallengeSubmissionGateway(),
    challengeVoteGateway: new InMemoryChallengeVoteGateway(),
    notificationGateway: new InMemoryNotificationGateway(),
    notificationDeliveryGateway: new InMemoryNotificationDeliveryGateway(),
    notificationScheduleGateway: new InMemoryNotificationScheduleGateway(),
    locationGateway: new InMemoryLocationGateway(),
    activityFeedGateway: new InMemoryActivityFeedGateway(),
    rewardGateway: new InMemoryRewardGateway(),
    coinTransactionGateway: new InMemoryCoinTransactionGateway(),
    sponsorGateway: new InMemorySponsorGateway(),
    eventGateway: new InMemoryEventGateway(),
    submissionReportGateway: new InMemorySubmissionReportGateway(),
    authAdapter: new InMemoryAuthAdapter(),
    storageAdapter: new InMemoryStorageAdapter(),
    realtimeAdapter: new InMemoryRealtimeAdapter(),
    pubSub: new EventEmitterPubSub(),
  };

  // Apply custom mocks if provided
  if (config.mocks?.auth) {
    Object.assign(mockInstances.authAdapter, config.mocks.auth);
  }
  if (config.mocks?.storage) {
    Object.assign(mockInstances.storageAdapter, config.mocks.storage);
  }
  if (config.mocks?.realtime) {
    Object.assign(mockInstances.realtimeAdapter, config.mocks.realtime);
  }

  // Create the combined layer using successive merges
  const layer = Layer.succeed(UserGatewayTag, mockInstances.userGateway)
    .pipe(Layer.merge(Layer.succeed(TripGatewayTag, mockInstances.tripGateway)))
    .pipe(
      Layer.merge(Layer.succeed(GroupGatewayTag, mockInstances.groupGateway)),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(ChallengeGatewayTag, mockInstances.challengeGateway),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          ChallengeSubmissionGatewayTag,
          mockInstances.challengeSubmissionGateway,
        ),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          ChallengeVoteGatewayTag,
          mockInstances.challengeVoteGateway,
        ),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          NotificationGatewayTag,
          mockInstances.notificationGateway,
        ),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          NotificationDeliveryGatewayTag,
          mockInstances.notificationDeliveryGateway,
        ),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          NotificationScheduleGatewayTag,
          mockInstances.notificationScheduleGateway,
        ),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(LocationGatewayTag, mockInstances.locationGateway),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          ActivityFeedGatewayTag,
          mockInstances.activityFeedGateway,
        ),
      ),
    )
    .pipe(
      Layer.merge(Layer.succeed(RewardGatewayTag, mockInstances.rewardGateway)),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          CoinTransactionGatewayTag,
          mockInstances.coinTransactionGateway,
        ),
      ),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(SponsorGatewayTag, mockInstances.sponsorGateway),
      ),
    )
    .pipe(
      Layer.merge(Layer.succeed(EventGatewayTag, mockInstances.eventGateway)),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(
          SubmissionReportGatewayTag,
          mockInstances.submissionReportGateway,
        ),
      ),
    )
    .pipe(Layer.merge(Layer.succeed(AuthPortTag, mockInstances.authAdapter)))
    .pipe(
      Layer.merge(Layer.succeed(StoragePortTag, mockInstances.storageAdapter)),
    )
    .pipe(
      Layer.merge(
        Layer.succeed(RealtimePortTag, mockInstances.realtimeAdapter),
      ),
    )
    .pipe(Layer.merge(Layer.succeed(PubSubServiceTag, mockInstances.pubSub)));

  return {
    layer,
    mocks: mockInstances,
  };
};

// =============================================================================
// Test Execution Helpers
// =============================================================================

/**
 * Options for running tests with layers
 */
export interface TestLayerOptions {
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Runs an Effect program with a test layer
 *
 * @param layerOrTestLayer - Either a Layer or TestLayer
 * @param program - The Effect program to run
 * @param options - Optional test options
 * @returns The result of the program execution
 *
 * @example
 * ```typescript
 * const testLayer = createTestLayer();
 * const result = await runWithTestLayer(
 *   testLayer,
 *   Effect.gen(function* () {
 *     const repo = yield* UserGatewayTag;
 *     return yield* repo.findById("123");
 *   })
 * );
 * expect(result).toBeDefined();
 * ```
 */
export const runWithTestLayer = <T, E>(
  layerOrTestLayer: Layer.Layer<unknown> | TestLayer,
  program: Effect.Effect<T, E, unknown>,
  _options: TestLayerOptions = {},
): Promise<T> => {
  const layer =
    "layer" in layerOrTestLayer ? layerOrTestLayer.layer : layerOrTestLayer;

  const provided = program.pipe(Effect.provide(layer));
  return Effect.runPromise(provided);
};

// =============================================================================
// Mock Layer Helpers
// =============================================================================

/**
 * Creates a Layer from a single mock implementation
 *
 * @param tag - The Context.Tag to satisfy
 * @param implementation - The mock implementation
 * @returns A Layer providing the mock
 *
 * @example
 * ```typescript
 * const mockUserRepo = mockLayerOf(
 *   UserGatewayTag,
 *   {
 *     findById: () => Effect.succeed(null),
 *     save: (user) => Effect.succeed(user),
 *   }
 * );
 * ```
 */
export const mockLayerOf = <Id, Service>(
  tag: Context.Tag<Id, Service>,
  implementation: Service,
): Layer.Layer<Id> => {
  return Layer.succeed(tag, implementation);
};
