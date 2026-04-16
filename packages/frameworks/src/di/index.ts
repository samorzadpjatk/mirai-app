/**
 * Dependency Injection Framework - Effect Layers
 *
 * This module provides Effect Layer-based dependency injection for the application.
 * It follows Clean Architecture by wiring implementations to interfaces (Context.Tags)
 * at the outermost (Frameworks) layer.
 */

export {
  // App Layer (unified composition)
  makeAppLayer,
  type AppLayerConfig,
} from "./layer/app";

export {
  // Repository Layer (Domain Gateways)
  makeRepositoryLayer,
  makeUserRepositoryLayer,
  makeTripRepositoryLayer,
  makeGroupRepositoryLayer,
  makeChallengeRepositoryLayer,
  makeChallengeSubmissionRepositoryLayer,
  makeChallengeVoteRepositoryLayer,
  makeNotificationRepositoryLayer,
  makeNotificationDeliveryRepositoryLayer,
  makeNotificationScheduleRepositoryLayer,
  makeLocationRepositoryLayer,
  makeActivityFeedRepositoryLayer,
  makeRewardRepositoryLayer,
  makeCoinTransactionRepositoryLayer,
  makeSponsorRepositoryLayer,
  makeEventRepositoryLayer,
  makeSubmissionReportRepositoryLayer,
  type RepositoryLayerConfig,
} from "./layer/repository";

export {
  // Service Layer (Infrastructure)
  makeServiceLayer,
  makeAuthLayer,
  makeStorageLayer,
  makeRealtimeLayer,
  makePubSubLayer,
  AuthPortTag,
  StoragePortTag,
  RealtimePortTag,
  PubSubServiceTag,
  type ServiceLayerConfig,
} from "./layer/service";

export {
  // Test Utilities
  createTestLayer,
  runWithTestLayer,
  mockLayerOf,
  type TestLayer,
  type TestLayerConfig,
} from "./layer/test";
