/**
 * Test Infrastructure for @mirai-app/use-cases
 *
 * Provides Layer-based test utilities for Effect-based testing.
 *
 * @module @mirai-app/use-cases/test
 *
 * @example
 * ```typescript
 * import {
 *   runWithTestLayer,
 *   createUserRepositoryMock,
 *   createGroupRepositoryMock,
 * } from '@mirai-app/use-cases/test';
 * import { Layer, Effect } from 'effect';
 *
 * // Create test layer with mocks
 * const testLayer = Layer.mergeAll(
 *   createUserRepositoryMock({ users: [mockUser] }),
 *   createGroupRepositoryMock(),
 * );
 *
 * // Run test with provided layer
 * const result = await runWithTestLayer(
 *   Effect.gen(function* () {
 *     const repo = yield* UserRepositoryTag;
 *     return yield* repo.findById('user-123');
 *   }),
 *   testLayer
 * );
 * ```
 */

// Core test helpers
export {
  /** Runs an Effect program with a test layer and returns a Promise */
  runWithTestLayer,
  /** Runs an Effect program with a test layer and returns Exit */
  runWithTestLayerExit,
  /** Runs an Effect program with a test layer and returns Either */
  runWithTestLayerEither,
  /** Creates a Layer from a Context.Tag and implementation */
  createTestLayer,
  /** Creates a Layer that fails with a specified error */
  createFailingLayer,
  /** Merges multiple test layers into a single layer */
  mergeTestLayers,
  /** Creates a Layer from an Effect that builds the service */
  createTestLayerFromEffect,
  /** Asserts that an Exit is a success */
  assertSuccess,
  /** Asserts that an Exit is a failure */
  assertFailure,
  /** Checks if an Exit represents a specific error type */
  isFailureWithTag,
  /** Type alias for test requirements */
  type TestRequirements,
  /** Helper type for extracting service interface from Context.Tag */
  type ServiceFromTag,
  /** Helper type for extracting identifier from Context.Tag */
  type IdentifierFromTag,
} from "./test-helpers.js";

// Repository mocks
export {
  /** Creates an in-memory UserRepository mock */
  createUserRepositoryMock,
  /** Creates an in-memory GroupRepository mock */
  createGroupRepositoryMock,
  /** Creates an in-memory ChallengeRepository mock */
  createChallengeRepositoryMock,
  /** Creates an in-memory ChallengeSubmissionRepository mock */
  createChallengeSubmissionRepositoryMock,
  /** Creates an in-memory ChallengeVoteRepository mock */
  createChallengeVoteRepositoryMock,
  /** Creates an in-memory LocationRepository mock */
  createLocationRepositoryMock,
  /** Creates an in-memory TripRepository mock */
  createTripRepositoryMock,
  /** Creates an in-memory RewardRepository mock */
  createRewardRepositoryMock,
  /** Creates an in-memory RewardPurchaseRepository mock */
  createRewardPurchaseRepositoryMock,
  /** Creates an in-memory SponsorRepository mock */
  createSponsorRepositoryMock,
  /** Creates an in-memory NotificationRepository mock */
  createNotificationRepositoryMock,
  /** Creates an in-memory NotificationScheduleRepository mock */
  createNotificationScheduleRepositoryMock,
  /** Creates an in-memory NotificationDeliveryRepository mock */
  createNotificationDeliveryRepositoryMock,
  /** Creates an in-memory CoinTransactionRepository mock */
  createCoinTransactionRepositoryMock,
  /** Creates an in-memory EventRepository mock */
  createEventRepositoryMock,
  /** Creates an in-memory ActivityFeedRepository mock */
  createActivityFeedRepositoryMock,
  /** Creates an in-memory SubmissionReportRepository mock */
  createSubmissionReportRepositoryMock,
  /** Options for UserRepository mock */
  type UserRepositoryMockOptions,
  /** Options for GroupRepository mock */
  type GroupRepositoryMockOptions,
  /** Options for ChallengeRepository mock */
  type ChallengeRepositoryMockOptions,
  /** Options for ChallengeSubmissionRepository mock */
  type ChallengeSubmissionRepositoryMockOptions,
  /** Options for ChallengeVoteRepository mock */
  type ChallengeVoteRepositoryMockOptions,
  /** Options for LocationRepository mock */
  type LocationRepositoryMockOptions,
  /** Options for TripRepository mock */
  type TripRepositoryMockOptions,
  /** Options for RewardRepository mock */
  type RewardRepositoryMockOptions,
  /** Options for RewardPurchaseRepository mock */
  type RewardPurchaseRepositoryMockOptions,
  /** Options for SponsorRepository mock */
  type SponsorRepositoryMockOptions,
  /** Options for NotificationRepository mock */
  type NotificationRepositoryMockOptions,
  /** Options for NotificationScheduleRepository mock */
  type NotificationScheduleRepositoryMockOptions,
  /** Options for NotificationDeliveryRepository mock */
  type NotificationDeliveryRepositoryMockOptions,
  /** Options for CoinTransactionRepository mock */
  type CoinTransactionRepositoryMockOptions,
  /** Options for EventRepository mock */
  type EventRepositoryMockOptions,
  /** Options for ActivityFeedRepository mock */
  type ActivityFeedRepositoryMockOptions,
  /** Options for SubmissionReportRepository mock */
  type SubmissionReportRepositoryMockOptions,
} from "./repository-mocks.js";
