/**
 * @mirai-app/adapters - Adapters Layer Exports
 *
 * This package contains interface adapters that bridge use cases to external frameworks.
 * Depends on @mirai-app/domain and @mirai-app/use-cases.
 */

// =============================================================================
// Controllers (tRPC routers, API endpoints)
// =============================================================================
export { UserController } from "./controllers/user/controller";
export { CoinController } from "./controllers/coin-transaction/coin-controller";
export { CoinTransactionController } from "./controllers/coin-transaction/transaction-controller";
export { NotificationDeliveryController } from "./controllers/notification/delivery-controller";
export { ChallengeController } from "./controllers/challenge/controller";
export { NotificationController } from "./controllers/notification/controller";
export { TripController } from "./controllers/trip/controller";
export { GroupController } from "./controllers/group/controller";
export { ActivityFeedController } from "./controllers/activity-feed/controller";
export { ChallengeSubmissionController } from "./controllers/challenge/submission-controller";
export { LocationController } from "./controllers/location/controller";
export { RewardController } from "./controllers/reward/controller";
export {
  NotificationScheduleController,
  type NotificationScheduleOutput,
} from "./controllers/notification/schedule-controller";
export { ChallengeVoteController } from "./controllers/challenge/vote-controller";
export { StorageController } from "./controllers/storage/controller";
export { SubmissionReportController } from "./controllers/submission-report/controller";
export { SponsorController } from "./controllers/sponsor/controller";

// Controller Factory (Effect DI Migration)
export {
  type Controllers,
  type BaseControllers,
  type ControllerFactory,
  type CreateControllersOptions,
  type ChallengeCompletedEvent,
  createControllers,
} from "./controllers";

// =============================================================================
// Phase 0: Supabase-Agnostic Architecture Adapters
// =============================================================================

// Auth Adapters
export { SupabaseAuthAdapter, InMemoryAuthAdapter } from "./gateways/auth";

// Realtime Adapters
export {
  SupabaseRealtimeAdapter,
  InMemoryRealtimeAdapter,
} from "./gateways/realtime";

// Storage Adapters
export {
  SupabaseStorageAdapter,
  InMemoryStorageAdapter,
} from "./gateways/storage";

// =============================================================================
// Phase 1: Drizzle ORM Services
// =============================================================================
export { DrizzleTripPointsCalculator } from "./services/trip/drizzle/points-calculator";
export { DrizzleGroupCoinsService } from "./services/group/drizzle/coins-service";
export { DrizzleTripAccessChecker } from "./services/trip/drizzle/access-checker";
export type { GroupLeaderCheckResult as DrizzleGroupLeaderCheckResult } from "./services/trip/drizzle/access-checker";
export { DrizzleCoinService } from "./services/coin/drizzle/service";
export { DrizzleCoinTransactionService } from "./services/coin/drizzle/transaction-service";
export { DrizzleNotificationSenderService } from "./services/notification/drizzle/sender-service";
export { DrizzleRewardService } from "./services/reward/drizzle/service";
export {
  DrizzleRankingActivityService,
  type RankSnapshot as DrizzleRankSnapshot,
} from "./services/ranking/drizzle/activity-service";

// =============================================================================
// Phase 2: Real-Time Architecture (In-Process Services)
// =============================================================================

// EventBus for domain event pub/sub
export {
  EventBus,
  globalEventBus,
  type EventHandler,
  type EventSubscription,
} from "./services/event-bus";

// ConnectionManager for WebSocket connection tracking
export {
  ConnectionManager,
  type ConnectionInfo,
  type BroadcastLocation,
} from "./services/connection-manager";

// LocationStreamingService for real-time location broadcasts
export { LocationStreamingService } from "./services/location-streaming";

// NotificationDeliveryService for push notifications
export {
  NotificationDeliveryService,
  type PushSubscription,
  type PushSubscriptionRepository,
  type DeliveryResult,
} from "./services/nofitication-delivery";

// NotificationService for creating and sending notifications
export {
  NotificationService,
  type RankingTemplateValues,
} from "./services/notification";

export { TokenExtractor } from "./utils/token-extractor";

// =============================================================================
// Mappers (Domain <-> DTO <-> Database) - Drizzle ORM
// =============================================================================
export { UserDrizzleMapper } from "./mappers/user/drizzle/mapper";
export { TripDrizzleMapper } from "./mappers/trip/drizzle/mapper";
export { GroupDrizzleMapper } from "./mappers/group/drizzle/mapper";
export { ChallengeDrizzleMapper } from "./mappers/challenge/drizzle/mapper";
export { LocationDrizzleMapper } from "./mappers/location/drizzle/mapper";
export { NotificationDrizzleMapper } from "./mappers/notification/drizzle/mapper";
export { ActivityFeedDrizzleMapper } from "./mappers/activity-feed/drizzle/mapper";
export { RewardDrizzleMapper } from "./mappers/reward/drizzle/mapper";

// Additional Drizzle mappers for complete migration
export { ChallengeSubmissionDrizzleMapper } from "./mappers/challenge/drizzle/submission-mapper";
export { ChallengeVoteDrizzleMapper } from "./mappers/challenge/drizzle/vote-mapper";
export { CoinTransactionDTODrizzleMapper } from "./mappers/coin-transaction/drizzle/mapper";
export { SponsorDrizzleMapper } from "./mappers/sponsor/drizzle/mapper";
export { SubmissionReportDrizzleMapper } from "./mappers/submission-report/drizzle/mapper";
export { NotificationScheduleDrizzleMapper } from "./mappers/notification/drizzle/schedule-mapper";
export { NotificationDeliveryDrizzleMapper } from "./mappers/notification/drizzle/delivery-mapper";
export { UserAgentDrizzleMapper } from "./mappers/user/drizzle/agent-mapper";
export { EventDrizzleMapper } from "./mappers/event/drizzle/mapper";

// =============================================================================
// Phase 1: Drizzle ORM Migration Gateways
// =============================================================================
export {
  BaseDrizzleGateway,
  type DrizzleEntityMapper,
  type DrizzleGatewayConfig,
} from "./gateways/_shared/drizzle-base";
export { DrizzleUserGateway } from "./gateways/user/drizzle/gateway";
export { DrizzleTripGateway } from "./gateways/trip/drizzle/gateway";
export { DrizzleGroupGateway } from "./gateways/group/drizzle/gateway";
export { DrizzleChallengeGateway } from "./gateways/challenge/drizzle/gateway";
export { DrizzleLocationGateway } from "./gateways/location/drizzle/gateway";
export { DrizzleNotificationGateway } from "./gateways/notification/drizzle/gateway";
export { DrizzleActivityFeedGateway } from "./gateways/activity-feed/drizzle/gateway";
export { DrizzleRewardGateway } from "./gateways/reward/drizzle/gateway";

// Additional Drizzle gateways for complete migration
export { DrizzleChallengeSubmissionGateway } from "./gateways/challenge/drizzle/submission";
export { DrizzleChallengeVoteGateway } from "./gateways/challenge/drizzle/vote";
export { DrizzleCoinTransactionGateway } from "./gateways/coin-transaction/drizzle/gateway";
export { DrizzleNotificationDeliveryGateway } from "./gateways/notification/drizzle/delivery";
export { DrizzleNotificationScheduleGateway } from "./gateways/notification/drizzle/schedule";
export { DrizzleSponsorGateway } from "./gateways/sponsor/drizzle/gateway";
export { DrizzleSubmissionReportGateway } from "./gateways/submission-report/drizzle/gateway";

// Drizzle telemetry adapter
export { DrizzleTelemetryAdapter } from "./gateways/telemetry/drizzle/gateway";

// Event gateway
export { DrizzleEventGateway } from "./gateways/event/drizzle/gateway";

// Re-export inner layers for convenience
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
  SharingUserInfo,
  calculateDistance,
  Reward,
  RewardPurchase,
  RewardPurchaseStatus,
  RewardId,
  CoinAmount,
  ChallengeVote,
  VotePosition,
  VoteWeight,
  SubmissionReport,
  ReportId,
  ReportReason,
  Sponsor,
  SponsorId,
  TripSponsorId,
} from "@mirai-app/domain";

// Repository types from use-cases (port interfaces)
export type {
  UserRepository,
  ChallengeRepository,
  NotificationRepository,
  TripRepository,
  GroupRepository,
  ActivityFeedRepository,
  ChallengeSubmissionRepository,
  LocationRepository,
  ChallengeVoteRepository,
  RewardRepository,
  RewardPurchaseRepository,
  SubmissionReportRepository,
  SponsorRepository,
} from "@mirai-app/domain/ports";
