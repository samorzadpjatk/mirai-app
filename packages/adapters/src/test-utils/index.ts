/**
 * Test Utilities - In-Memory Repository Implementations
 *
 * Provides in-memory implementations of repository ports for unit testing.
 * These repositories store data in memory and provide realistic CRUD behavior
 * without requiring a database.
 *
 * @example
 * ```typescript
 * import { InMemoryUserRepository } from "@mirai-app/adapters/test-utils";
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

export { InMemoryRepository } from "./InMemoryRepository";
export { InMemoryUserRepository } from "./InMemoryUserRepository";
export { InMemoryChallengeRepository } from "./InMemoryChallengeRepository";
export { InMemoryGroupRepository } from "./InMemoryGroupRepository";
export { InMemoryTripRepository } from "./InMemoryTripRepository";
export {
  InMemoryRewardRepository,
  InMemoryRewardPurchaseRepository,
} from "./InMemoryRewardRepository";
export { InMemoryCoinTransactionRepository } from "./InMemoryCoinTransactionRepository";
export { InMemoryLocationRepository } from "./InMemoryLocationRepository";
export { InMemoryNotificationRepository } from "./InMemoryNotificationRepository";
export { InMemoryNotificationScheduleRepository } from "./InMemoryNotificationScheduleRepository";
export { InMemoryNotificationDeliveryRepository } from "./InMemoryNotificationDeliveryRepository";
export { InMemoryChallengeSubmissionRepository } from "./InMemoryChallengeSubmissionRepository";
export { InMemoryChallengeVoteRepository } from "./InMemoryChallengeVoteRepository";
export { InMemoryActivityFeedRepository } from "./InMemoryActivityFeedRepository";
export { InMemorySponsorRepository } from "./InMemorySponsorRepository";
export { InMemorySubmissionReportRepository } from "./InMemorySubmissionReportRepository";
