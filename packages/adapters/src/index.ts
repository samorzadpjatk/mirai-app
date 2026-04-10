/**
 * @mirai-app/adapters - Adapters Layer Exports
 *
 * This package contains interface adapters that bridge use cases to external frameworks.
 * Depends on @mirai-app/domain and @mirai-app/use-cases.
 */

// =============================================================================
// Modules (Dependency Injection)
// =============================================================================

export {
  RepositoryModule,
  REPOSITORY_TOKENS,
  type RepositoryModuleDeps,
  type RepositoryModuleDef,
  type RepositoryToken,
} from "./modules/RepositoryModule";

export {
  ControllerModule,
  CONTROLLER_TOKENS,
  type ControllerModuleDeps,
  type ControllerModuleDef,
  type ControllerToken,
} from "./modules/ControllerModule";

// Controllers (tRPC routers, API endpoints)
export { UserController } from "./controllers/user-controller";
export { CoinController } from "./controllers/coin-controller";
export { CoinTransactionController } from "./controllers/coin-transaction-controller";
export { NotificationDeliveryController } from "./controllers/notification-delivery-controller";
export { ChallengeController } from "./controllers/challenge-controller";
export { NotificationController } from "./controllers/notification-controller";
export { TripController } from "./controllers/trip-controller";
export { GroupController } from "./controllers/group-controller";
export { ActivityFeedController } from "./controllers/activityFeed-controller";
export { ChallengeSubmissionController } from "./controllers/challengeSubmission-controller";
export { LocationController } from "./controllers/location-controller";
export { RewardController } from "./controllers/reward-controller";
export { NotificationScheduleController } from "./controllers/notification-schedule-controller";
export { ChallengeVoteController } from "./controllers/challengeVote-controller";
export { StorageController } from "./controllers/storage-controller";
export { SubmissionReportController } from "./controllers/submissionReport-controller";
export { SponsorController } from "./controllers/sponsor-controller";

// Gateways (Repository implementations)
export {
  BasePrismaRepository,
  type EntityMapper,
  type PrismaModelDelegate,
} from "./gateways/BasePrismaRepository";
export { PrismaUserRepository } from "./gateways/PrismaUserRepository";
export { PrismaCoinTransactionRepository } from "./gateways/PrismaCoinTransactionRepository";
export { PrismaNotificationDeliveryRepository } from "./gateways/PrismaNotificationDeliveryRepository";
export { PrismaChallengeRepository } from "./gateways/PrismaChallengeRepository";
export { PrismaTripRepository } from "./gateways/PrismaTripRepository";
export { PrismaGroupRepository } from "./gateways/PrismaGroupRepository";
export { PrismaNotificationRepository } from "./gateways/PrismaNotificationRepository";
export { PrismaActivityFeedRepository } from "./gateways/PrismaActivityFeedRepository";
export { PrismaChallengeSubmissionRepository } from "./gateways/PrismaChallengeSubmissionRepository";
export { PrismaLocationRepository } from "./gateways/PrismaLocationRepository";
export {
  PrismaRewardRepository,
  PrismaRewardPurchaseRepository,
} from "./gateways/PrismaRewardRepository";
export { PrismaNotificationScheduleRepository } from "./gateways/PrismaNotificationScheduleRepository";
export { PrismaChallengeVoteRepository } from "./gateways/PrismaChallengeVoteRepository";
export { PrismaSubmissionReportRepository } from "./gateways/PrismaSubmissionReportRepository";
export { PrismaSponsorRepository } from "./gateways/PrismaSponsorRepository";

// =============================================================================
// Phase 0: Supabase-Agnostic Architecture Adapters
// =============================================================================

// Auth Adapters
export { SupabaseAuthAdapter } from "./gateways/auth/SupabaseAuthAdapter";

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

// Services (Domain logic utilities)
export { PrismaTripPointsCalculator } from "./services/PrismaTripPointsCalculator";
export { PrismaGroupCoinsService } from "./services/PrismaGroupCoinsService";
export { PrismaTripAccessChecker } from "./services/PrismaTripAccessChecker";
export type { GroupLeaderCheckResult } from "./services/PrismaTripAccessChecker";
export { PrismaCoinService } from "./services/PrismaCoinService";
export { PrismaCoinTransactionService } from "./services/PrismaCoinTransactionService";
export { PrismaNotificationSenderService } from "./services/PrismaNotificationSenderService";
export { PrismaRewardService } from "./services/PrismaRewardService";
export {
  PrismaRankingActivityService,
  type RankSnapshot,
} from "./services/PrismaRankingActivityService";

// =============================================================================
// Phase 1: Drizzle ORM Migration Services (New)
// =============================================================================
export { DrizzleTripPointsCalculator } from "./services/DrizzleTripPointsCalculator";
export { DrizzleGroupCoinsService } from "./services/DrizzleGroupCoinsService";
export { DrizzleTripAccessChecker } from "./services/DrizzleTripAccessChecker";
export type { GroupLeaderCheckResult as DrizzleGroupLeaderCheckResult } from "./services/DrizzleTripAccessChecker";
export { DrizzleCoinService } from "./services/DrizzleCoinService";
export { DrizzleCoinTransactionService } from "./services/DrizzleCoinTransactionService";
export { DrizzleNotificationSenderService } from "./services/DrizzleNotificationSenderService";
export { DrizzleRewardService } from "./services/DrizzleRewardService";
export {
  DrizzleRankingActivityService,
  type RankSnapshot as DrizzleRankSnapshot,
} from "./services/DrizzleRankingActivityService";

// =============================================================================
// Phase 2: Real-Time Architecture (In-Process Services)
// =============================================================================

// EventBus for domain event pub/sub
export {
  EventBus,
  globalEventBus,
  type EventHandler,
  type EventSubscription,
} from "./services/EventBus";

// ConnectionManager for WebSocket connection tracking
export {
  ConnectionManager,
  type ConnectionInfo,
  type BroadcastLocation,
} from "./services/ConnectionManager";

// LocationStreamingService for real-time location broadcasts
export { LocationStreamingService } from "./services/LocationStreamingService";

// NotificationDeliveryService for push notifications
export {
  NotificationDeliveryService,
  type PushSubscription,
  type PushSubscriptionRepository,
  type DeliveryResult,
} from "./services/NotificationDeliveryService";

// tRPC API (Server-side)
export {
  createTRPCContext,
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
  type TRPCContext,
  type DIContext,
} from "./api/trpc";
export { appRouter, createCaller, type AppRouter } from "./api/root";

// Services (tRPC-specific services)
export { NotificationService } from "./services/notificationService";

// tRPC Utils
export * from "./utils/trpc-utils/activityFeed";
export * from "./utils/trpc-utils/notifications";
export * from "./utils/trpc-utils/tripGuards";
export * from "./utils/trpc-utils/recurringChallenges";
export * from "./utils/trpc-utils/resilience";
export * from "./utils/trpc-utils/notificationTemplates";

// Utilities
export {
  mapErrorToCode,
  type ErrorCode,
  toControllerResult,
  createControllerResult,
  type ControllerResult,
} from "./utils/controller-helpers";
export {
  createRepository,
  createUseCases,
  createControllerFactory,
  type ControllerFactory,
} from "./utils/repository-factory";

// Mappers (Domain <-> DTO <-> Database)
export { UserMapper } from "./mappers/UserMapper";
export { ChallengeMapper } from "./mappers/ChallengeMapper";
export { NotificationMapper } from "./mappers/NotificationMapper";
export { TripMapper } from "./mappers/TripMapper";
export { GroupMapper } from "./mappers/GroupMapper";
export { ActivityFeedMapper } from "./mappers/ActivityFeedMapper";
export { ChallengeSubmissionMapper } from "./mappers/ChallengeSubmissionMapper";
export { LocationMapper } from "./mappers/LocationMapper";
export { RewardMapper, RewardPurchaseMapper } from "./mappers/RewardMapper";
export { NotificationScheduleMapper } from "./mappers/NotificationScheduleMapper";
export { ChallengeVoteMapper } from "./mappers/ChallengeVoteMapper";
export { SubmissionReportMapper } from "./mappers/SubmissionReportMapper";
export { SponsorMapper } from "./mappers/SponsorMapper";

// =============================================================================
// Phase 1: Drizzle ORM Migration Mappers
// =============================================================================
export { UserDrizzleMapper } from "./mappers/UserDrizzleMapper";
export { TripDrizzleMapper } from "./mappers/TripDrizzleMapper";
export { GroupDrizzleMapper } from "./mappers/GroupDrizzleMapper";
export { ChallengeDrizzleMapper } from "./mappers/ChallengeDrizzleMapper";
export { LocationDrizzleMapper } from "./mappers/LocationDrizzleMapper";
export { NotificationDrizzleMapper } from "./mappers/NotificationDrizzleMapper";
export { ActivityFeedDrizzleMapper } from "./mappers/ActivityFeedDrizzleMapper";
export { RewardDrizzleMapper } from "./mappers/RewardDrizzleMapper";

// Additional Drizzle mappers for complete migration
export { ChallengeSubmissionDrizzleMapper } from "./mappers/ChallengeSubmissionDrizzleMapper";
export { ChallengeVoteDrizzleMapper } from "./mappers/ChallengeVoteDrizzleMapper";
export { CoinTransactionDrizzleMapper } from "./mappers/CoinTransactionDrizzleMapper";
export { SponsorDrizzleMapper } from "./mappers/SponsorDrizzleMapper";
export { SubmissionReportDrizzleMapper } from "./mappers/SubmissionReportDrizzleMapper";
export { NotificationScheduleDrizzleMapper } from "./mappers/NotificationScheduleDrizzleMapper";
export { NotificationDeliveryDrizzleMapper } from "./mappers/NotificationDeliveryDrizzleMapper";

// =============================================================================
// Phase 1: Drizzle ORM Migration Repositories
// =============================================================================
export {
  BaseDrizzleRepository,
  type DrizzleEntityMapper,
  type DrizzleRepositoryConfig,
} from "./gateways/BaseDrizzleRepository";
export { DrizzleUserRepository } from "./gateways/DrizzleUserRepository";
export { DrizzleTripRepository } from "./gateways/DrizzleTripRepository";
export { DrizzleGroupRepository } from "./gateways/DrizzleGroupRepository";
export { DrizzleChallengeRepository } from "./gateways/DrizzleChallengeRepository";
export { DrizzleLocationRepository } from "./gateways/DrizzleLocationRepository";
export { DrizzleNotificationRepository } from "./gateways/DrizzleNotificationRepository";
export { DrizzleActivityFeedRepository } from "./gateways/DrizzleActivityFeedRepository";
export { DrizzleRewardRepository } from "./gateways/DrizzleRewardRepository";

// Additional Drizzle repositories for complete migration
export { DrizzleChallengeSubmissionRepository } from "./gateways/DrizzleChallengeSubmissionRepository";
export { DrizzleChallengeVoteRepository } from "./gateways/DrizzleChallengeVoteRepository";
export { DrizzleCoinTransactionRepository } from "./gateways/DrizzleCoinTransactionRepository";
export { DrizzleNotificationDeliveryRepository } from "./gateways/DrizzleNotificationDeliveryRepository";
export { DrizzleNotificationScheduleRepository } from "./gateways/DrizzleNotificationScheduleRepository";
export { DrizzleSponsorRepository } from "./gateways/DrizzleSponsorRepository";
export { DrizzleSubmissionReportRepository } from "./gateways/DrizzleSubmissionReportRepository";

// Drizzle telemetry adapter
export { DrizzleTelemetryAdapter } from "./gateways/DrizzleTelemetryAdapter";

// Re-export inner layers for convenience
export type {
  Result,
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
export type {
  UserRepository,
  GetUserUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  ChallengeRepository,
  GetChallengeUseCase,
  CreateChallengeUseCase,
  UpdateChallengeUseCase,
  UpdateChallengeStatusUseCase,
  NotificationRepository,
  GetNotificationUseCase,
  TripRepository,
  GroupRepository,
  ActivityFeedRepository,
  GetActivityFeedUseCase,
  CreateActivityUseCase,
  AddReactionUseCase,
  // Challenge Submission
  ChallengeSubmissionRepository,
  CreateSubmissionUseCase,
  GetSubmissionUseCase,
  GetSubmissionByChallengeAndGroupUseCase,
  UpdateSubmissionUseCase,
  DeleteSubmissionUseCase,
  ListSubmissionsByChallengeUseCase,
  // Location
  LocationRepository,
  GetLocationUseCase,
  CreateLocationUseCase,
  UpdateLocationUseCase,
  ListLocationsUseCase,
  UpdateSharingSettingsUseCase,
  AddSharingUserUseCase,
  RemoveSharingUserUseCase,
  GetSharingSettingsUseCase,
  // Reward
  RewardRepository,
  RewardPurchaseRepository,
  GetRewardUseCase,
  CreateRewardUseCase,
  UpdateRewardUseCase,
  SetRewardHiddenUseCase,
  DeleteRewardUseCase,
  ListRewardsUseCase,
  PurchaseRewardUseCase,
  UpdatePurchaseStatusUseCase,
  UpdateMyPurchaseStatusUseCase,
  GetPurchaseHistoryUseCase,
  // Challenge Vote
  ChallengeVoteRepository,
  GetMyVotesUseCase,
  GetVotesByChallengeUseCase,
  GetChallengeVotingProgressUseCase,
  GetJudgedStaffVotingProgressUseCase,
  SubmitVoteUseCase,
  SubmitVotesUseCase,
  ForceEndVotingUseCase,
  // Submission Report
  SubmissionReportRepository,
  CreateReportUseCase,
  GetReportsUseCase,
  // Sponsor
  SponsorRepository,
  CreateSponsorUseCase,
  GetSponsorUseCase,
  UpdateSponsorUseCase,
  DeleteSponsorUseCase,
  ListSponsorsUseCase,
  LinkSponsorToTripUseCase,
  UnlinkSponsorFromTripUseCase,
} from "@mirai-app/use-cases";
