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
