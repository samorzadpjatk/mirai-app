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
export { DrizzleUserRepository } from "./drizzle/user";
export { DrizzleTripRepository } from "./drizzle/trip";
export { DrizzleGroupRepository } from "./drizzle/group";
export { DrizzleChallengeRepository } from "./drizzle/challenge";
export { DrizzleLocationRepository } from "./drizzle/location";
export { DrizzleNotificationRepository } from "./drizzle/notification";
export { DrizzleActivityFeedRepository } from "./drizzle/activity-feed";
export { DrizzleRewardRepository } from "./drizzle/reward";
export { DrizzleChallengeSubmissionRepository } from "./drizzle/challenge-submission";
export { DrizzleChallengeVoteRepository } from "./drizzle/challenge-vote";
export { DrizzleCoinTransactionRepository } from "./drizzle/coin-transaction";
export { DrizzleNotificationDeliveryRepository } from "./drizzle/notification-delivery";
export { DrizzleNotificationScheduleRepository } from "./drizzle/notification-schedule";
export { DrizzleSponsorRepository } from "./drizzle/sponsor";
export { DrizzleSubmissionReportRepository } from "./drizzle/submission-report";
export { DrizzleTelemetryAdapter } from "./drizzle/telemetry";
export { DrizzleEventRepository } from "./drizzle/event";

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
