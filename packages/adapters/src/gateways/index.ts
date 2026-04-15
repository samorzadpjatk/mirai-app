/**
 * Gateways Index
 *
 * Re-exports all gateway implementations for convenient importing.
 * Organized by domain (DDD) with framework subfolders.
 */

// =============================================================================
// Base Gateway Classes (Shared Infrastructure)
// =============================================================================
export { BaseDrizzleGateway } from "./_shared/drizzle-base";
export type {
  DrizzleEntityMapper,
  DrizzleGatewayConfig,
} from "./_shared/drizzle-base";

// =============================================================================
// User Domain
// =============================================================================
export { DrizzleUserGateway } from "./user/drizzle/gateway";
export { InMemoryUserGateway } from "./user/in-memory/gateway";

// =============================================================================
// Group Domain
// =============================================================================
export { DrizzleGroupGateway } from "./group/drizzle/gateway";
export { InMemoryGroupGateway } from "./group/in-memory/gateway";

// =============================================================================
// Trip Domain
// =============================================================================
export { DrizzleTripGateway } from "./trip/drizzle/gateway";
export { InMemoryTripGateway } from "./trip/in-memory/gateway";

// =============================================================================
// Location Domain
// =============================================================================
export { DrizzleLocationGateway } from "./location/drizzle/gateway";
export { InMemoryLocationGateway } from "./location/in-memory/gateway";

// =============================================================================
// Event Domain
// =============================================================================
export { DrizzleEventGateway } from "./event/drizzle/gateway";
export { InMemoryEventGateway } from "./event/in-memory/gateway";

// =============================================================================
// Challenge Domain
// =============================================================================
export { DrizzleChallengeGateway } from "./challenge/drizzle/gateway";
export { DrizzleChallengeSubmissionGateway } from "./challenge/drizzle/submission";
export { DrizzleChallengeVoteGateway } from "./challenge/drizzle/vote";
export { InMemoryChallengeGateway } from "./challenge/in-memory/gateway";
export { InMemoryChallengeSubmissionGateway } from "./challenge/in-memory/submission";
export { InMemoryChallengeVoteGateway } from "./challenge/in-memory/vote";

// =============================================================================
// Reward Domain
// =============================================================================
export { DrizzleRewardGateway } from "./reward/drizzle/gateway";
export {
  InMemoryRewardGateway,
  InMemoryRewardPurchaseGateway,
} from "./reward/in-memory/gateway";

// =============================================================================
// Sponsor Domain
// =============================================================================
export { DrizzleSponsorGateway } from "./sponsor/drizzle/gateway";
export { InMemorySponsorGateway } from "./sponsor/in-memory/gateway";

// =============================================================================
// Notification Domain
// =============================================================================
export { DrizzleNotificationGateway } from "./notification/drizzle/gateway";
export { DrizzleNotificationDeliveryGateway } from "./notification/drizzle/delivery";
export { DrizzleNotificationScheduleGateway } from "./notification/drizzle/schedule";
export { InMemoryNotificationGateway } from "./notification/in-memory/gateway";
export { InMemoryNotificationScheduleGateway } from "./notification/in-memory/schedule";
export { InMemoryNotificationDeliveryGateway } from "./notification/in-memory/delivery";

// =============================================================================
// Activity Feed Domain
// =============================================================================
export { DrizzleActivityFeedGateway } from "./activity-feed/drizzle/gateway";
export { InMemoryActivityFeedGateway } from "./activity-feed/in-memory/gateway";

// =============================================================================
// Coin Transaction Domain
// =============================================================================
export { DrizzleCoinTransactionGateway } from "./coin-transaction/drizzle/gateway";
export { InMemoryCoinTransactionGateway } from "./coin-transaction/in-memory/gateway";

// =============================================================================
// Submission Report Domain
// =============================================================================
export { DrizzleSubmissionReportGateway } from "./submission-report/drizzle/gateway";
export { InMemorySubmissionReportGateway } from "./submission-report/in-memory/gateway";

// =============================================================================
// Telemetry Domain
// =============================================================================
export { DrizzleTelemetryAdapter } from "./telemetry/drizzle/gateway";

// =============================================================================
// Auth Domain (User Authentication)
// =============================================================================
export { SupabaseAuthAdapter } from "./auth/supabase/adapter";
export { InMemoryAuthAdapter } from "./auth/in-memory/adapter";

// =============================================================================
// Realtime Infrastructure
// =============================================================================
export { SupabaseRealtimeAdapter } from "./realtime/supabase/adapter";
export { InMemoryRealtimeAdapter } from "./realtime/in-memory/adapter";

// =============================================================================
// Storage Infrastructure
// =============================================================================
export { SupabaseStorageAdapter } from "./storage/supabase/adapter";
export { InMemoryStorageAdapter } from "./storage/in-memory/adapter";
export { S3StorageAdapter } from "./storage/s3/adapter";

// =============================================================================
// In-Memory Testing Infrastructure (Convenience Re-exports)
// =============================================================================
export { InMemoryGateway } from "./_shared/in-memory-base";
export {
  createMockPrismaClient,
  createMockContext,
  type MockPrismaClient,
  type MockContext,
  type MockAuthUser,
  type CreateMockPrismaClientOptions,
  type CreateMockContextOptions,
} from "./_shared/in-memory-mocks";
