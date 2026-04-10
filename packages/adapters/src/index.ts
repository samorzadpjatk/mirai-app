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
export { PrismaUserRepository } from "./gateways/prisma/PrismaUserRepository";
export { PrismaCoinTransactionRepository } from "./gateways/prisma/PrismaCoinTransactionRepository";
export { PrismaNotificationDeliveryRepository } from "./gateways/prisma/PrismaNotificationDeliveryRepository";
export { PrismaChallengeRepository } from "./gateways/prisma/PrismaChallengeRepository";
export { PrismaTripRepository } from "./gateways/prisma/PrismaTripRepository";
export { PrismaGroupRepository } from "./gateways/prisma/PrismaGroupRepository";
export { PrismaNotificationRepository } from "./gateways/prisma/PrismaNotificationRepository";
export { PrismaActivityFeedRepository } from "./gateways/prisma/PrismaActivityFeedRepository";
export { PrismaChallengeSubmissionRepository } from "./gateways/prisma/PrismaChallengeSubmissionRepository";
export { PrismaLocationRepository } from "./gateways/prisma/PrismaLocationRepository";
export {
  PrismaRewardRepository,
  PrismaRewardPurchaseRepository,
} from "./gateways/prisma/PrismaRewardRepository";
export { PrismaNotificationScheduleRepository } from "./gateways/prisma/PrismaNotificationScheduleRepository";
export { PrismaChallengeVoteRepository } from "./gateways/prisma/PrismaChallengeVoteRepository";
export { PrismaSubmissionReportRepository } from "./gateways/prisma/PrismaSubmissionReportRepository";
export { PrismaSponsorRepository } from "./gateways/prisma/PrismaSponsorRepository";

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
export { TokenExtractor } from "./utils/TokenExtractor";

// Mappers (Domain <-> DTO <-> Database) - Prisma (Legacy)
export { UserMapper } from "./mappers/prisma/UserMapper";
export { ChallengeMapper } from "./mappers/prisma/ChallengeMapper";
export { NotificationMapper } from "./mappers/prisma/NotificationMapper";
export { TripMapper } from "./mappers/prisma/TripMapper";
export { GroupMapper } from "./mappers/prisma/GroupMapper";
export { ActivityFeedMapper } from "./mappers/prisma/ActivityFeedMapper";
export { ChallengeSubmissionMapper } from "./mappers/prisma/ChallengeSubmissionMapper";
export { LocationMapper } from "./mappers/prisma/LocationMapper";
export {
  RewardMapper,
  RewardPurchaseMapper,
} from "./mappers/prisma/RewardMapper";
export { NotificationScheduleMapper } from "./mappers/prisma/NotificationScheduleMapper";
export { ChallengeVoteMapper } from "./mappers/prisma/ChallengeVoteMapper";
export { SubmissionReportMapper } from "./mappers/prisma/SubmissionReportMapper";
export { SponsorMapper } from "./mappers/prisma/SponsorMapper";
export { UserAgentMapper } from "./mappers/prisma/UserAgentMapper";

// =============================================================================
// Phase 1: Drizzle ORM Migration Mappers
// =============================================================================
export { UserDrizzleMapper } from "./mappers/drizzle/UserDrizzleMapper";
export { TripDrizzleMapper } from "./mappers/drizzle/TripDrizzleMapper";
export { GroupDrizzleMapper } from "./mappers/drizzle/GroupDrizzleMapper";
export { ChallengeDrizzleMapper } from "./mappers/drizzle/ChallengeDrizzleMapper";
export { LocationDrizzleMapper } from "./mappers/drizzle/LocationDrizzleMapper";
export { NotificationDrizzleMapper } from "./mappers/drizzle/NotificationDrizzleMapper";
export { ActivityFeedDrizzleMapper } from "./mappers/drizzle/ActivityFeedDrizzleMapper";
export { RewardDrizzleMapper } from "./mappers/drizzle/RewardDrizzleMapper";

// Additional Drizzle mappers for complete migration
export { ChallengeSubmissionDrizzleMapper } from "./mappers/drizzle/ChallengeSubmissionDrizzleMapper";
export { ChallengeVoteDrizzleMapper } from "./mappers/drizzle/ChallengeVoteDrizzleMapper";
export { CoinTransactionDrizzleMapper } from "./mappers/drizzle/CoinTransactionDrizzleMapper";
export { SponsorDrizzleMapper } from "./mappers/drizzle/SponsorDrizzleMapper";
export { SubmissionReportDrizzleMapper } from "./mappers/drizzle/SubmissionReportDrizzleMapper";
export { NotificationScheduleDrizzleMapper } from "./mappers/drizzle/NotificationScheduleDrizzleMapper";
export { NotificationDeliveryDrizzleMapper } from "./mappers/drizzle/NotificationDeliveryDrizzleMapper";
export { UserAgentDrizzleMapper } from "./mappers/drizzle/UserAgentDrizzleMapper";

// =============================================================================
// Phase 1: Drizzle ORM Migration Repositories
// =============================================================================
export {
  BaseDrizzleRepository,
  type DrizzleEntityMapper,
  type DrizzleRepositoryConfig,
} from "./gateways/BaseDrizzleRepository";
export { DrizzleUserRepository } from "./gateways/drizzle/DrizzleUserRepository";
export { DrizzleTripRepository } from "./gateways/drizzle/DrizzleTripRepository";
export { DrizzleGroupRepository } from "./gateways/drizzle/DrizzleGroupRepository";
export { DrizzleChallengeRepository } from "./gateways/drizzle/DrizzleChallengeRepository";
export { DrizzleLocationRepository } from "./gateways/drizzle/DrizzleLocationRepository";
export { DrizzleNotificationRepository } from "./gateways/drizzle/DrizzleNotificationRepository";
export { DrizzleActivityFeedRepository } from "./gateways/drizzle/DrizzleActivityFeedRepository";
export { DrizzleRewardRepository } from "./gateways/drizzle/DrizzleRewardRepository";

// Additional Drizzle repositories for complete migration
export { DrizzleChallengeSubmissionRepository } from "./gateways/drizzle/DrizzleChallengeSubmissionRepository";
export { DrizzleChallengeVoteRepository } from "./gateways/drizzle/DrizzleChallengeVoteRepository";
export { DrizzleCoinTransactionRepository } from "./gateways/drizzle/DrizzleCoinTransactionRepository";
export { DrizzleNotificationDeliveryRepository } from "./gateways/drizzle/DrizzleNotificationDeliveryRepository";
export { DrizzleNotificationScheduleRepository } from "./gateways/drizzle/DrizzleNotificationScheduleRepository";
export { DrizzleSponsorRepository } from "./gateways/drizzle/DrizzleSponsorRepository";
export { DrizzleSubmissionReportRepository } from "./gateways/drizzle/DrizzleSubmissionReportRepository";

// Drizzle telemetry adapter
export { DrizzleTelemetryAdapter } from "./gateways/drizzle/DrizzleTelemetryAdapter";

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
