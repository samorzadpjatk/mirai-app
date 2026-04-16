/**
 * @mirai-app/adapters - Adapters Layer Exports
 *
 * This package contains interface adapters that bridge use cases to external frameworks.
 * Depends on @mirai-app/domain and @mirai-app/use-cases.
 */

// =============================================================================
// Controllers (GraphQL resolvers, API endpoints)
// =============================================================================
export { UserController } from "./user/controllers/controller";
export { CoinController } from "./coin/controllers/coin-controller";
export { CoinTransactionController } from "./coin/controllers/transaction-controller";
export { NotificationDeliveryController } from "./notification/controllers/delivery-controller";
export { ChallengeController } from "./challenge/controllers/controller";
export { NotificationController } from "./notification/controllers/controller";
export { TripController } from "./trip/controllers/controller";
export { GroupController } from "./group/controllers/controller";
export { ActivityFeedController } from "./activity/controllers/controller";
export { ChallengeSubmissionController } from "./challenge/controllers/submission-controller";
export { LocationController } from "./location/controllers/controller";
export { RewardController } from "./reward/controllers/controller";
export {
  NotificationScheduleController,
  type NotificationScheduleOutput,
} from "./notification/controllers/schedule-controller";
export { ChallengeVoteController } from "./challenge/controllers/vote-controller";
export { StorageController } from "./storage/controllers/controller";
export { SubmissionReportController } from "./submission/controllers/controller";
export { SponsorController } from "./sponsor/controllers/controller";
export { EventController } from "./event/controllers/controller";

// =============================================================================
// Phase 0: Supabase-Agnostic Architecture Adapters
// =============================================================================

// Auth Adapters
export { SupabaseAuthAdapter } from "./auth/gateways/supabase/adapter";
export { InMemoryAuthAdapter } from "./auth/gateways/in-memory/adapter";

// Realtime Adapters
export { SupabaseRealtimeAdapter } from "./system/shared/gateways/realtime/supabase/adapter";
export { InMemoryRealtimeAdapter } from "./system/shared/gateways/realtime/in-memory/adapter";

// Storage Adapters
export { SupabaseStorageAdapter } from "./system/shared/gateways/storage/supabase/adapter";
export { InMemoryStorageAdapter } from "./system/shared/gateways/storage/in-memory/adapter";

// =============================================================================
// Phase 2: Real-Time Architecture (In-Process Infrastructure Services)
// =============================================================================
// Note: Coordinating services (GroupCoinsService, TripAccessChecker, etc.)
// have been moved to @mirai-app/use-cases layer per Clean Architecture.
// Only infrastructure services remain in adapters layer.
// =============================================================================

// EventBus for domain event pub/sub
export {
  EventBus,
  globalEventBus,
  type EventHandler,
  type EventSubscription,
} from "./system/shared/services/event-bus";

// ConnectionManager for WebSocket connection tracking
export {
  ConnectionManager,
  type ConnectionInfo,
  type BroadcastLocation,
} from "./system/shared/services/connection-manager";

// LocationStreamingService for real-time location broadcasts
export { LocationStreamingService } from "./location/services/location-streaming";

// EventEmitter PubSub for GraphQL subscriptions
export { EventEmitterPubSub } from "./system/shared/services/event-emitter-pub-sub";

// Note: NotificationDeliveryService and NotificationService have been removed.
// These were not actively used in the codebase. If needed, they should be
// reimplemented following Clean Architecture principles in the use-cases layer.

export { TokenExtractor } from "./system/utils/token-extractor";

// =============================================================================
// Trip Services (Drizzle implementations of use-case ports)
// =============================================================================
export {
  DrizzleTripPointsCalculator,
  PointsCalculatorError,
} from "./trip/services";
export { DrizzleTripAccessChecker, AccessCheckerError } from "./trip/services";

// =============================================================================
// Group Services (Drizzle implementations of use-case ports)
// =============================================================================
export {
  DrizzleGroupCoinsService,
  GroupCoinsServiceError,
} from "./group/services";

// =============================================================================
// Ranking Services (Drizzle implementations of use-case ports)
// =============================================================================
export {
  DrizzleRankingActivityService,
  RankingActivityError,
} from "./ranking/services";

// =============================================================================
// Mappers (Domain <-> DTO <-> Database) - Drizzle ORM
// =============================================================================
export { UserDrizzleMapper } from "./user/mappers/drizzle/mapper";
export { TripDrizzleMapper } from "./trip/mappers/drizzle/mapper";
export { GroupDrizzleMapper } from "./group/mappers/drizzle/mapper";
export { ChallengeDrizzleMapper } from "./challenge/mappers/drizzle/mapper";
export { LocationDrizzleMapper } from "./location/mappers/drizzle/mapper";
export { NotificationDrizzleMapper } from "./notification/mappers/drizzle/mapper";
export { ActivityFeedDrizzleMapper } from "./activity/mappers/drizzle/mapper";
export { RewardDrizzleMapper } from "./reward/mappers/drizzle/mapper";

// Additional Drizzle mappers for complete migration
export { ChallengeSubmissionDrizzleMapper } from "./challenge/mappers/drizzle/submission-mapper";
export { ChallengeVoteDrizzleMapper } from "./challenge/mappers/drizzle/vote-mapper";
export { CoinTransactionDTODrizzleMapper } from "./coin/mappers/drizzle/mapper";
export { SponsorDrizzleMapper } from "./sponsor/mappers/drizzle/mapper";
export { SubmissionReportDrizzleMapper } from "./submission/mappers/drizzle/mapper";
export { NotificationScheduleDrizzleMapper } from "./notification/mappers/drizzle/schedule-mapper";
export { NotificationDeliveryDrizzleMapper } from "./notification/mappers/drizzle/delivery-mapper";
export { EventDrizzleMapper } from "./event/mappers/drizzle/mapper";

// =============================================================================
// Phase 1: Drizzle ORM Migration Gateways
// =============================================================================
export {
  BaseDrizzleGateway,
  type DrizzleEntityMapper,
  type DrizzleGatewayConfig,
} from "./system/shared/gateways/drizzle-base";
export { DrizzleUserGateway } from "./user/gateways/drizzle/gateway";
export { DrizzleTripGateway } from "./trip/gateways/drizzle/gateway";
export { DrizzleGroupGateway } from "./group/gateways/drizzle/gateway";
export { DrizzleChallengeGateway } from "./challenge/gateways/drizzle/gateway";
export { DrizzleLocationGateway } from "./location/gateways/drizzle/gateway";
export { DrizzleNotificationGateway } from "./notification/gateways/drizzle/gateway";
export { DrizzleActivityFeedGateway } from "./activity/gateways/drizzle/gateway";
export { DrizzleRewardGateway } from "./reward/gateways/drizzle/gateway";

// Additional Drizzle gateways for complete migration
export { DrizzleChallengeSubmissionGateway } from "./challenge/gateways/drizzle/submission";
export { DrizzleChallengeVoteGateway } from "./challenge/gateways/drizzle/vote";
export { DrizzleCoinTransactionGateway } from "./coin/gateways/drizzle/gateway";
export { DrizzleNotificationDeliveryGateway } from "./notification/gateways/drizzle/delivery";
export { DrizzleNotificationScheduleGateway } from "./notification/gateways/drizzle/schedule";
export { DrizzleSponsorGateway } from "./sponsor/gateways/drizzle/gateway";
export { DrizzleSubmissionReportGateway } from "./submission/gateways/drizzle/gateway";

// Event gateway
export { DrizzleEventGateway } from "./event/gateways/drizzle/gateway";

// =============================================================================
// In-Memory Gateways (for Testing)
// =============================================================================

export { InMemoryUserGateway } from "./user/gateways/in-memory/gateway";
export { InMemoryTripGateway } from "./trip/gateways/in-memory/gateway";
export { InMemoryGroupGateway } from "./group/gateways/in-memory/gateway";
export { InMemoryChallengeGateway } from "./challenge/gateways/in-memory/gateway";
export { InMemoryChallengeSubmissionGateway } from "./challenge/gateways/in-memory/submission";
export { InMemoryChallengeVoteGateway } from "./challenge/gateways/in-memory/vote";
export { InMemoryNotificationGateway } from "./notification/gateways/in-memory/gateway";
export { InMemoryNotificationDeliveryGateway } from "./notification/gateways/in-memory/delivery";
export { InMemoryNotificationScheduleGateway } from "./notification/gateways/in-memory/schedule";
export { InMemoryLocationGateway } from "./location/gateways/in-memory/gateway";
export { InMemoryActivityFeedGateway } from "./activity/gateways/in-memory/gateway";
export { InMemoryRewardGateway } from "./reward/gateways/in-memory/gateway";
export { InMemoryCoinTransactionGateway } from "./coin/gateways/in-memory/gateway";
export { InMemorySponsorGateway } from "./sponsor/gateways/in-memory/gateway";
export { InMemoryEventGateway } from "./event/gateways/in-memory/gateway";
export { InMemorySubmissionReportGateway } from "./submission/gateways/in-memory/gateway";

// =============================================================================
// Re-export Inner Layers for Convenience
// =============================================================================

// Domain exports (for convenience)
export type {
  User,
  UserRole,
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
  Notification,
  NotificationStatus,
  NotificationPriority,
  Trip,
  TripStatus,
  Group,
  GroupStatus,
  Location,
  LocationAccuracy,
  Reward,
  RewardPurchase,
  RewardPurchaseStatus,
  RewardId,
  CoinAmount,
  ChallengeVote,
  VotePosition,
} from "@mirai-app/domain";
