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
export { BaseDrizzleRepository } from "./BaseDrizzleRepository";
export type {
  DrizzleEntityMapper,
  DrizzleRepositoryConfig,
} from "./BaseDrizzleRepository";

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
