/**
 * Gateways Index
 *
 * Re-exports all repository implementations for convenient importing.
 * Organized by ORM library (Prisma and Drizzle).
 */

// =============================================================================
// Base Repository Classes
// =============================================================================
export { BasePrismaRepository } from "./BasePrismaRepository";
export { BaseDrizzleRepository } from "./base/repository";
export type {
  DrizzleEntityMapper,
  DrizzleRepositoryConfig,
} from "./base/repository";

// =============================================================================
// Prisma ORM Repositories (Legacy)
// =============================================================================
// NOTE: All Prisma repositories have been migrated to Drizzle and removed
// Use the Drizzle equivalents in ./drizzle/

// =============================================================================
// Drizzle ORM Repositories (Phase 1 Migration)
// =============================================================================
export { DrizzleUserRepository } from "./drizzle/DrizzleUserRepository";
export { DrizzleTripRepository } from "./drizzle/DrizzleTripRepository";
export { DrizzleGroupRepository } from "./drizzle/DrizzleGroupRepository";
export { DrizzleChallengeRepository } from "./drizzle/DrizzleChallengeRepository";
export { DrizzleLocationRepository } from "./drizzle/DrizzleLocationRepository";
export { DrizzleNotificationRepository } from "./drizzle/DrizzleNotificationRepository";
export { DrizzleActivityFeedRepository } from "./drizzle/DrizzleActivityFeedRepository";
export { DrizzleRewardRepository } from "./drizzle/DrizzleRewardRepository";
export { DrizzleChallengeSubmissionRepository } from "./drizzle/DrizzleChallengeSubmissionRepository";
export { DrizzleChallengeVoteRepository } from "./drizzle/DrizzleChallengeVoteRepository";
export { DrizzleCoinTransactionRepository } from "./drizzle/DrizzleCoinTransactionRepository";
export { DrizzleNotificationDeliveryRepository } from "./drizzle/DrizzleNotificationDeliveryRepository";
export { DrizzleNotificationScheduleRepository } from "./drizzle/DrizzleNotificationScheduleRepository";
export { DrizzleSponsorRepository } from "./drizzle/DrizzleSponsorRepository";
export { DrizzleSubmissionReportRepository } from "./drizzle/DrizzleSubmissionReportRepository";
export { DrizzleTelemetryAdapter } from "./drizzle/DrizzleTelemetryAdapter";

// =============================================================================
// In-Memory Repositories (Phase 2: Testing Infrastructure)
// =============================================================================
export { InMemoryRepository } from "./in-memory/base";
export { InMemoryUserRepository } from "./in-memory/user";
export { InMemoryGroupRepository } from "./in-memory/group";
export { InMemoryTripRepository } from "./in-memory/trip";
export { InMemoryChallengeRepository } from "./in-memory/challenge";
export { InMemoryChallengeSubmissionRepository } from "./in-memory/challenge-submission";
export { InMemoryChallengeVoteRepository } from "./in-memory/challenge-vote";
export { InMemoryLocationRepository } from "./in-memory/location";
export { InMemoryNotificationRepository } from "./in-memory/notification";
export { InMemoryNotificationScheduleRepository } from "./in-memory/notification-schedule";
export { InMemoryNotificationDeliveryRepository } from "./in-memory/notification-delivery";
export {
  InMemoryRewardRepository,
  InMemoryRewardPurchaseRepository,
} from "./in-memory/reward";
export { InMemorySponsorRepository } from "./in-memory/sponsor";
export { InMemoryCoinTransactionRepository } from "./in-memory/coin-transaction";
export { InMemoryActivityFeedRepository } from "./in-memory/activity-feed";
export { InMemorySubmissionReportRepository } from "./in-memory/submission-report";

// =============================================================================
// Auth Adapters (Phase 0: Supabase-Agnostic Architecture)
// =============================================================================
export { SupabaseAuthAdapter } from "./auth/SupabaseAuthAdapter";
export { InMemoryAuthAdapter } from "./auth/InMemoryAuthAdapter";

// =============================================================================
// Realtime Adapters (Phase 0: Supabase-Agnostic Architecture)
// =============================================================================
export { SupabaseRealtimeAdapter } from "./realtime/SupabaseRealtimeAdapter";
export { InMemoryRealtimeAdapter } from "./realtime/InMemoryRealtimeAdapter";

// =============================================================================
// Storage Adapters (Phase 0: Supabase-Agnostic Architecture)
// =============================================================================
export { SupabaseStorageAdapter } from "./storage/SupabaseStorageAdapter";
export { InMemoryStorageAdapter } from "./storage/InMemoryStorageAdapter";
