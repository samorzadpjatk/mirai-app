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
export { UserController } from "./controllers/user";
export { CoinController } from "./controllers/coin";
export { CoinTransactionController } from "./controllers/coin-transaction";
export { NotificationDeliveryController } from "./controllers/notification-delivery";
export { ChallengeController } from "./controllers/challenge";
export { NotificationController } from "./controllers/notification";
export { TripController } from "./controllers/trip";
export { GroupController } from "./controllers/group";
export { ActivityFeedController } from "./controllers/activity-feed";
export { ChallengeSubmissionController } from "./controllers/challenge-submission";
export { LocationController } from "./controllers/location";
export { RewardController } from "./controllers/reward";
export {
  NotificationScheduleController,
  type NotificationScheduleOutput,
} from "./controllers/notification-schedule";
export { ChallengeVoteController } from "./controllers/challenge-vote";
export { StorageController } from "./controllers/storage";
export { SubmissionReportController } from "./controllers/submission-report";
export { SponsorController } from "./controllers/sponsor";

// Gateways (Repository implementations)
// NOTE: Prisma repositories have been fully migrated to Drizzle equivalents

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
export { DrizzleTripPointsCalculator } from "./services/trip-points";
export { DrizzleGroupCoinsService } from "./services/group-coins";
export { DrizzleTripAccessChecker } from "./services/trip-access";
export type { GroupLeaderCheckResult as DrizzleGroupLeaderCheckResult } from "./services/trip-access";
export { DrizzleCoinService } from "./services/coin";
export { DrizzleCoinTransactionService } from "./services/coin-transaction";
export { DrizzleNotificationSenderService } from "./services/notification-sender";
export { DrizzleRewardService } from "./services/reward";
export {
  DrizzleRankingActivityService,
  type RankSnapshot as DrizzleRankSnapshot,
} from "./services/ranking-activity";

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

// NotificationService for creating and sending notifications
export {
  NotificationService,
  type RankingTemplateValues,
} from "./services/notification-service";

// API Error Classes
export {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  createErrorFromMessage,
} from "./api/errors";

// Utilities
export {
  mapErrorToCode,
  type ErrorCode,
  toControllerResult,
  createControllerResult,
  type ControllerResult,
  // Effect-based handlers (Migration Phase 4.1+)
  handleEffect,
  effectToControllerResult,
  handleEffectAsync,
  handleEffectGraphQL,
} from "./utils/controller-helpers";
export {
  createRepository,
  createUseCases,
  createControllerFactory,
  type ControllerFactory,
} from "./utils/repository-factory";
export { TokenExtractor } from "./utils/TokenExtractor";

// Effect Executor Utilities (Step 4.1)
export {
  // Effect execution
  runEffect,
  runEffectWithHandler,
  runEffectGraphQL,
  runEffectGraphQLWithHandler,
  // HTTP error mapping
  mapErrorToHttpStatus,
  mapDomainErrorToHttpError,
  // GraphQL error mapping
  mapErrorToGraphQLCode,
  mapErrorToGraphQL,
  type GraphQLErrorCode,
  // Type guards
  isDomainError,
  getErrorTag,
} from "./utils/effect-executor";

// =============================================================================
// Mappers (Domain <-> DTO <-> Database) - Drizzle ORM
// =============================================================================
export { UserDrizzleMapper } from "./mappers/drizzle/user";
export { TripDrizzleMapper } from "./mappers/drizzle/trip";
export { GroupDrizzleMapper } from "./mappers/drizzle/group";
export { ChallengeDrizzleMapper } from "./mappers/drizzle/challenge";
export { LocationDrizzleMapper } from "./mappers/drizzle/location";
export { NotificationDrizzleMapper } from "./mappers/drizzle/notification";
export { ActivityFeedDrizzleMapper } from "./mappers/drizzle/activity-feed";
export { RewardDrizzleMapper } from "./mappers/drizzle/reward";

// Additional Drizzle mappers for complete migration
export { ChallengeSubmissionDrizzleMapper } from "./mappers/drizzle/challenge-submission";
export { ChallengeVoteDrizzleMapper } from "./mappers/drizzle/challenge-vote";
export { CoinTransactionDrizzleMapper } from "./mappers/drizzle/coin-transaction";
export { SponsorDrizzleMapper } from "./mappers/drizzle/sponsor";
export { SubmissionReportDrizzleMapper } from "./mappers/drizzle/submission-report";
export { NotificationScheduleDrizzleMapper } from "./mappers/drizzle/notification-schedule";
export { NotificationDeliveryDrizzleMapper } from "./mappers/drizzle/notification-delivery";
export { UserAgentDrizzleMapper } from "./mappers/drizzle/user-agent";
export { EventDrizzleMapper } from "./mappers/drizzle/event";

// =============================================================================
// Phase 1: Drizzle ORM Migration Repositories
// =============================================================================
export {
  BaseDrizzleRepository,
  type DrizzleEntityMapper,
  type DrizzleRepositoryConfig,
} from "./gateways/base/repository";
export { DrizzleUserRepository } from "./gateways/drizzle/user";
export { DrizzleTripRepository } from "./gateways/drizzle/trip";
export { DrizzleGroupRepository } from "./gateways/drizzle/group";
export { DrizzleChallengeRepository } from "./gateways/drizzle/challenge";
export { DrizzleLocationRepository } from "./gateways/drizzle/location";
export { DrizzleNotificationRepository } from "./gateways/drizzle/notification";
export { DrizzleActivityFeedRepository } from "./gateways/drizzle/activity-feed";
export { DrizzleRewardRepository } from "./gateways/drizzle/reward";

// Additional Drizzle repositories for complete migration
export { DrizzleChallengeSubmissionRepository } from "./gateways/drizzle/challenge-submission";
export { DrizzleChallengeVoteRepository } from "./gateways/drizzle/challenge-vote";
export { DrizzleCoinTransactionRepository } from "./gateways/drizzle/coin-transaction";
export { DrizzleNotificationDeliveryRepository } from "./gateways/drizzle/notification-delivery";
export { DrizzleNotificationScheduleRepository } from "./gateways/drizzle/notification-schedule";
export { DrizzleSponsorRepository } from "./gateways/drizzle/sponsor";
export { DrizzleSubmissionReportRepository } from "./gateways/drizzle/submission-report";

// Drizzle telemetry adapter
export { DrizzleTelemetryAdapter } from "./gateways/drizzle/telemetry";

// Event repository
export { DrizzleEventRepository } from "./gateways/drizzle/event";

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
  ListLocationsUseCase,
  UpdateSharingSettingsUseCase,
  AddSharingUserUseCase,
  RemoveSharingUserUseCase,
  GetSharingSettingsUseCase,
  // Reward
  RewardRepository,
  RewardPurchaseRepository,
  SetRewardHiddenUseCase,
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
  ListSponsorsUseCase,
  LinkSponsorToTripUseCase,
  UnlinkSponsorFromTripUseCase,
} from "@mirai-app/use-cases";

// NOTE: The following use cases are now function-based (Effect-based) and should be imported directly:
// - getActivityFeedUseCase, createActivityUseCase, addReactionUseCase
// - createReportUseCase, getReportsUseCase
// - purchaseRewardUseCase, getPurchaseHistoryUseCase
// - addCoinsUseCase, removeCoinsUseCase, getCoinTransactionsUseCase, getCoinStatisticsUseCase
// - getCoinQuickStatsUseCase, getCoinAdditionalInsightsUseCase, getMostActiveAdminStatsUseCase
