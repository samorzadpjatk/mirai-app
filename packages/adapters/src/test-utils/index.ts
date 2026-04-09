/**
 * Test Utilities - Mock Factories and In-Memory Repository Implementations
 *
 * Provides mock factories for Prisma/Supabase and in-memory implementations
 * of repository ports for unit testing. These utilities enable testing without
 * requiring a real database or external services.
 *
 * @example
 * ```typescript
 * import { InMemoryUserRepository, createMockContext } from "@mirai-app/adapters/test-utils";
 *
 * // Using mock factories
 * const mockContext = createMockContext({ userId: "user-123", role: "ADMIN" });
 *
 * // Using in-memory repositories
 * const repo = new InMemoryUserRepository();
 * repo.seed([mockUser]);
 *
 * const found = await repo.findById("user-123");
 * expect(found).not.toBeNull();
 *
 * repo.reset(); // Clean up for next test
 * ```
 */

// Mock factories
export {
  createMockPrismaClient,
  createMockContext,
  type MockPrismaClient,
  type MockContext,
  type MockAuthUser,
  type CreateMockPrismaClientOptions,
  type CreateMockContextOptions,
} from "./mocks";

// In-memory repositories
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
