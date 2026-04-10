/**
 * Gateways Index
 *
 * Re-exports all repository implementations for convenient importing.
 */

export { PrismaUserRepository } from "./PrismaUserRepository";
export { PrismaChallengeRepository } from "./PrismaChallengeRepository";
export { PrismaGroupRepository } from "./PrismaGroupRepository";
export { PrismaTripRepository } from "./PrismaTripRepository";
export { PrismaLocationRepository } from "./PrismaLocationRepository";
export { PrismaChallengeSubmissionRepository } from "./PrismaChallengeSubmissionRepository";
export { PrismaChallengeVoteRepository } from "./PrismaChallengeVoteRepository";
export { PrismaActivityFeedRepository } from "./PrismaActivityFeedRepository";
export { PrismaNotificationRepository } from "./PrismaNotificationRepository";
export { PrismaNotificationDeliveryRepository } from "./PrismaNotificationDeliveryRepository";
export { PrismaNotificationScheduleRepository } from "./PrismaNotificationScheduleRepository";
export { PrismaRewardRepository } from "./PrismaRewardRepository";
export { PrismaCoinTransactionRepository } from "./PrismaCoinTransactionRepository";
export { PrismaSponsorRepository } from "./PrismaSponsorRepository";
export { PrismaSubmissionReportRepository } from "./PrismaSubmissionReportRepository";
export { PrismaTelemetryAdapter } from "./PrismaTelemetryAdapter";
export { BasePrismaRepository } from "./BasePrismaRepository";

// =============================================================================
// Phase 1: Drizzle ORM Migration (Prisma to Drizzle)
// =============================================================================
export { BaseDrizzleRepository } from "./BaseDrizzleRepository";
export type {
  DrizzleEntityMapper,
  DrizzleRepositoryConfig,
} from "./BaseDrizzleRepository";
export { DrizzleUserRepository } from "./DrizzleUserRepository";
export { DrizzleTripRepository } from "./DrizzleTripRepository";
export { DrizzleGroupRepository } from "./DrizzleGroupRepository";
export { DrizzleChallengeRepository } from "./DrizzleChallengeRepository";
export { DrizzleLocationRepository } from "./DrizzleLocationRepository";
export { DrizzleNotificationRepository } from "./DrizzleNotificationRepository";
export { DrizzleActivityFeedRepository } from "./DrizzleActivityFeedRepository";
export { DrizzleRewardRepository } from "./DrizzleRewardRepository";

// Additional Drizzle repositories for complete migration
export { DrizzleChallengeSubmissionRepository } from "./DrizzleChallengeSubmissionRepository";
export { DrizzleChallengeVoteRepository } from "./DrizzleChallengeVoteRepository";
export { DrizzleCoinTransactionRepository } from "./DrizzleCoinTransactionRepository";
export { DrizzleNotificationDeliveryRepository } from "./DrizzleNotificationDeliveryRepository";
export { DrizzleNotificationScheduleRepository } from "./DrizzleNotificationScheduleRepository";
export { DrizzleSponsorRepository } from "./DrizzleSponsorRepository";
export { DrizzleSubmissionReportRepository } from "./DrizzleSubmissionReportRepository";

// =============================================================================
// Auth Adapters (Phase 0: Supabase-Agnostic Architecture)
// =============================================================================
export { SupabaseAuthAdapter } from "./auth/SupabaseAuthAdapter";

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
