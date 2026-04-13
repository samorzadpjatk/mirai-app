/**
 * In-Memory Repository Implementations
 *
 * Provides in-memory implementations of all repository ports for unit testing.
 * These implementations store data in memory using Maps/Arrays and are useful
 * for testing use cases without requiring a real database.
 *
 * @example
 * ```typescript
 * import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";
 *
 * const repo = new InMemoryUserRepository();
 * repo.seed([mockUser]);
 *
 * const found = await repo.findById("user-123");
 * expect(found).not.toBeNull();
 *
 * repo.reset(); // Clean up for next test
 * ```
 */

// =============================================================================
// Base Repository Class
// =============================================================================
export { InMemoryRepository } from "./base";

// =============================================================================
// Entity Repositories
// =============================================================================
export { InMemoryUserRepository } from "./user";
export { InMemoryGroupRepository } from "./group";
export { InMemoryTripRepository } from "./trip";
export { InMemoryChallengeRepository } from "./challenge";
export { InMemoryChallengeSubmissionRepository } from "./challenge-submission";
export { InMemoryChallengeVoteRepository } from "./challenge-vote";
export { InMemoryLocationRepository } from "./location";
export { InMemoryNotificationRepository } from "./notification";
export { InMemoryNotificationScheduleRepository } from "./notification-schedule";
export { InMemoryNotificationDeliveryRepository } from "./notification-delivery";
export {
  InMemoryRewardRepository,
  InMemoryRewardPurchaseRepository,
} from "./reward";
export { InMemorySponsorRepository } from "./sponsor";
export { InMemoryCoinTransactionRepository } from "./coin-transaction";
export { InMemoryActivityFeedRepository } from "./activity-feed";
export { InMemoryEventRepository } from "./event";
export { InMemorySubmissionReportRepository } from "./submission-report";

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
} from "./mocks";
