/**
 * In-Memory Gateway Implementations
 *
 * Provides in-memory implementations of all repository ports for unit testing.
 * These implementations store data in memory using Maps/Arrays and are useful
 * for testing use cases without requiring a real database.
 *
 * @example
 * ```typescript
 * import { InMemoryUserGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";
 *
 * const gateway = new InMemoryUserGateway();
 * gateway.seed([mockUser]);
 *
 * const found = await gateway.findById("user-123");
 * expect(found).not.toBeNull();
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */

// =============================================================================
// Base Gateway Class
// =============================================================================
export { InMemoryGateway } from "./in-memory-base";

// =============================================================================
// User Domain
// =============================================================================
export { InMemoryUserGateway } from "../user/in-memory/gateway";

// =============================================================================
// Group Domain
// =============================================================================
export { InMemoryGroupGateway } from "../group/in-memory/gateway";

// =============================================================================
// Trip Domain
// =============================================================================
export { InMemoryTripGateway } from "../trip/in-memory/gateway";

// =============================================================================
// Location Domain
// =============================================================================
export { InMemoryLocationGateway } from "../location/in-memory/gateway";

// =============================================================================
// Event Domain
// =============================================================================
export { InMemoryEventGateway } from "../event/in-memory/gateway";

// =============================================================================
// Challenge Domain
// =============================================================================
export { InMemoryChallengeGateway } from "../challenge/in-memory/gateway";
export { InMemoryChallengeSubmissionGateway } from "../challenge/in-memory/submission";
export { InMemoryChallengeVoteGateway } from "../challenge/in-memory/vote";

// =============================================================================
// Reward Domain
// =============================================================================
export {
  InMemoryRewardGateway,
  InMemoryRewardPurchaseGateway,
} from "../reward/in-memory/gateway";

// =============================================================================
// Sponsor Domain
// =============================================================================
export { InMemorySponsorGateway } from "../sponsor/in-memory/gateway";

// =============================================================================
// Notification Domain
// =============================================================================
export { InMemoryNotificationGateway } from "../notification/in-memory/gateway";
export { InMemoryNotificationScheduleGateway } from "../notification/in-memory/schedule";
export { InMemoryNotificationDeliveryGateway } from "../notification/in-memory/delivery";

// =============================================================================
// Activity Feed Domain
// =============================================================================
export { InMemoryActivityFeedGateway } from "../activity-feed/in-memory/gateway";

// =============================================================================
// Coin Transaction Domain
// =============================================================================
export { InMemoryCoinTransactionGateway } from "../coin-transaction/in-memory/gateway";

// =============================================================================
// Submission Report Domain
// =============================================================================
export { InMemorySubmissionReportGateway } from "../submission-report/in-memory/gateway";

// =============================================================================
// Mock Factories
// =============================================================================
export {
  createMockPrismaClient,
  createMockContext,
  type MockPrismaClient,
  type MockContext,
  type MockAuthUser,
  type CreateMockPrismaClientOptions,
  type CreateMockContextOptions,
} from "./in-memory-mocks";
