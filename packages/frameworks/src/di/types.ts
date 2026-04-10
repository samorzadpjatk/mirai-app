/**
 * Service Identifiers for Dependency Injection
 *
 * This module defines all injection tokens (symbols) used throughout the application
 * for dependency injection. All symbols use Symbol.for() for cross-realm
 * compatibility, ensuring symbols remain identical across different JavaScript realms
 * (main thread, workers, iframes, etc.).
 *
 * ## Usage
 *
 * ### Registering a Service in Awilix
 *
 * ```typescript
 * import { asClass } from "awilix";
 * import { TYPES } from "./types";
 *
 * container.register(TYPES.UserRepository, asClass(PrismaUserRepository));
 * ```
 *
 * ### Resolving a Service
 *
 * ```typescript
 * import { TYPES } from "./types";
 *
 * const repo = container.resolve<UserRepository>(TYPES.UserRepository);
 * ```
 *
 * ## Naming Conventions
 *
 * - **Repositories**: `{EntityName}Repository` (e.g., `UserRepository`)
 * - **Controllers**: `{EntityName}Controller` (e.g., `UserController`)
 * - **Services**: `{Domain}Service` (e.g., `CoinService`, `RankingService`)
 * - **Infrastructure**: Descriptive names (e.g., `DrizzleClient`, `Logger`, `Cache`)
 * - **Request Context**: `{ContextItem}` (e.g., `RequestId`, `UserContext`)
 *
 * ## Organization
 *
 * Symbols are organized by layer/category:
 * 1. Framework Services (database, external clients)
 * 2. Repository Layer (data access)
 * 3. Service Layer (business logic)
 * 4. Controllers (request handlers)
 * 5. Infrastructure (logging, caching, events)
 * 6. Request Context (request-scoped data)
 *
 * @module types
 */

// =============================================================================
// Framework Services
// =============================================================================

/** Symbol for Supabase client */
export type SupabaseClientSymbol = typeof SUPABASE_CLIENT_SYMBOL;
const SUPABASE_CLIENT_SYMBOL: unique symbol = Symbol.for("SupabaseClient");

// =============================================================================
// Repository Layer
// =============================================================================

/** Symbol for UserRepository interface */
export type UserRepositorySymbol = typeof USER_REPOSITORY_SYMBOL;
const USER_REPOSITORY_SYMBOL: unique symbol = Symbol.for("UserRepository");

/** Symbol for TripRepository interface */
export type TripRepositorySymbol = typeof TRIP_REPOSITORY_SYMBOL;
const TRIP_REPOSITORY_SYMBOL: unique symbol = Symbol.for("TripRepository");

/** Symbol for ChallengeRepository interface */
export type ChallengeRepositorySymbol = typeof CHALLENGE_REPOSITORY_SYMBOL;
const CHALLENGE_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "ChallengeRepository",
);

/** Symbol for GroupRepository interface */
export type GroupRepositorySymbol = typeof GROUP_REPOSITORY_SYMBOL;
const GROUP_REPOSITORY_SYMBOL: unique symbol = Symbol.for("GroupRepository");

/** Symbol for RewardRepository interface */
export type RewardRepositorySymbol = typeof REWARD_REPOSITORY_SYMBOL;
const REWARD_REPOSITORY_SYMBOL: unique symbol = Symbol.for("RewardRepository");

/** Symbol for NotificationRepository interface */
export type NotificationRepositorySymbol =
  typeof NOTIFICATION_REPOSITORY_SYMBOL;
const NOTIFICATION_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "NotificationRepository",
);

/** Symbol for ChallengeSubmissionRepository interface */
export type ChallengeSubmissionRepositorySymbol =
  typeof CHALLENGE_SUBMISSION_REPOSITORY_SYMBOL;
const CHALLENGE_SUBMISSION_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "ChallengeSubmissionRepository",
);

/** Symbol for SponsorRepository interface */
export type SponsorRepositorySymbol = typeof SPONSOR_REPOSITORY_SYMBOL;
const SPONSOR_REPOSITORY_SYMBOL: unique symbol =
  Symbol.for("SponsorRepository");

/** Symbol for LocationRepository interface */
export type LocationRepositorySymbol = typeof LOCATION_REPOSITORY_SYMBOL;
const LOCATION_REPOSITORY_SYMBOL: unique symbol =
  Symbol.for("LocationRepository");

/** Symbol for ChallengeVoteRepository interface */
export type ChallengeVoteRepositorySymbol =
  typeof CHALLENGE_VOTE_REPOSITORY_SYMBOL;
const CHALLENGE_VOTE_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "ChallengeVoteRepository",
);

/** Symbol for SubmissionReportRepository interface */
export type SubmissionReportRepositorySymbol =
  typeof SUBMISSION_REPORT_REPOSITORY_SYMBOL;
const SUBMISSION_REPORT_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "SubmissionReportRepository",
);

/** Symbol for CoinTransactionRepository interface */
export type CoinTransactionRepositorySymbol =
  typeof COIN_TRANSACTION_REPOSITORY_SYMBOL;
const COIN_TRANSACTION_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "CoinTransactionRepository",
);

/** Symbol for NotificationDeliveryRepository interface */
export type NotificationDeliveryRepositorySymbol =
  typeof NOTIFICATION_DELIVERY_REPOSITORY_SYMBOL;
const NOTIFICATION_DELIVERY_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "NotificationDeliveryRepository",
);

/** Symbol for NotificationScheduleRepository interface */
export type NotificationScheduleRepositorySymbol =
  typeof NOTIFICATION_SCHEDULE_REPOSITORY_SYMBOL;
const NOTIFICATION_SCHEDULE_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "NotificationScheduleRepository",
);

/** Symbol for ActivityFeedRepository interface */
export type ActivityFeedRepositorySymbol =
  typeof ACTIVITY_FEED_REPOSITORY_SYMBOL;
const ACTIVITY_FEED_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "ActivityFeedRepository",
);

/** Symbol for RewardPurchaseRepository interface */
export type RewardPurchaseRepositorySymbol =
  typeof REWARD_PURCHASE_REPOSITORY_SYMBOL;
const REWARD_PURCHASE_REPOSITORY_SYMBOL: unique symbol = Symbol.for(
  "RewardPurchaseRepository",
);

// =============================================================================
// Service Layer
// =============================================================================

/** Symbol for CoinService business logic */
export type CoinServiceSymbol = typeof COIN_SERVICE_SYMBOL;
const COIN_SERVICE_SYMBOL: unique symbol = Symbol.for("CoinService");

/** Symbol for RankingService business logic */
export type RankingServiceSymbol = typeof RANKING_SERVICE_SYMBOL;
const RANKING_SERVICE_SYMBOL: unique symbol = Symbol.for("RankingService");

/** Symbol for NotificationService business logic */
export type NotificationServiceSymbol = typeof NOTIFICATION_SERVICE_SYMBOL;
const NOTIFICATION_SERVICE_SYMBOL: unique symbol = Symbol.for(
  "NotificationService",
);

/** Symbol for TripAccessService business logic */
export type TripAccessServiceSymbol = typeof TRIP_ACCESS_SERVICE_SYMBOL;
const TRIP_ACCESS_SERVICE_SYMBOL: unique symbol =
  Symbol.for("TripAccessService");

/** Symbol for TripPointsService business logic */
export type TripPointsServiceSymbol = typeof TRIP_POINTS_SERVICE_SYMBOL;
const TRIP_POINTS_SERVICE_SYMBOL: unique symbol =
  Symbol.for("TripPointsService");

/** Symbol for GroupCoinsService business logic */
export type GroupCoinsServiceSymbol = typeof GROUP_COINS_SERVICE_SYMBOL;
const GROUP_COINS_SERVICE_SYMBOL: unique symbol =
  Symbol.for("GroupCoinsService");

// =============================================================================
// Controllers
// =============================================================================

/** Symbol for UserController */
export type UserControllerSymbol = typeof USER_CONTROLLER_SYMBOL;
const USER_CONTROLLER_SYMBOL: unique symbol = Symbol.for("UserController");

/** Symbol for TripController */
export type TripControllerSymbol = typeof TRIP_CONTROLLER_SYMBOL;
const TRIP_CONTROLLER_SYMBOL: unique symbol = Symbol.for("TripController");

/** Symbol for ChallengeController */
export type ChallengeControllerSymbol = typeof CHALLENGE_CONTROLLER_SYMBOL;
const CHALLENGE_CONTROLLER_SYMBOL: unique symbol = Symbol.for(
  "ChallengeController",
);

/** Symbol for GroupController */
export type GroupControllerSymbol = typeof GROUP_CONTROLLER_SYMBOL;
const GROUP_CONTROLLER_SYMBOL: unique symbol = Symbol.for("GroupController");

/** Symbol for RewardController */
export type RewardControllerSymbol = typeof REWARD_CONTROLLER_SYMBOL;
const REWARD_CONTROLLER_SYMBOL: unique symbol = Symbol.for("RewardController");

/** Symbol for NotificationController */
export type NotificationControllerSymbol =
  typeof NOTIFICATION_CONTROLLER_SYMBOL;
const NOTIFICATION_CONTROLLER_SYMBOL: unique symbol = Symbol.for(
  "NotificationController",
);

// =============================================================================
// Infrastructure
// =============================================================================

/** Symbol for Logger service */
export type LoggerSymbol = typeof LOGGER_SYMBOL;
const LOGGER_SYMBOL: unique symbol = Symbol.for("Logger");

/** Symbol for Cache service */
export type CacheSymbol = typeof CACHE_SYMBOL;
const CACHE_SYMBOL: unique symbol = Symbol.for("Cache");

/** Symbol for EventBus service */
export type EventBusSymbol = typeof EVENT_BUS_SYMBOL;
const EVENT_BUS_SYMBOL: unique symbol = Symbol.for("EventBus");

// =============================================================================
// Request Context
// =============================================================================

/** Symbol for RequestId (request-scoped identifier) */
export type RequestIdSymbol = typeof REQUEST_ID_SYMBOL;
const REQUEST_ID_SYMBOL: unique symbol = Symbol.for("RequestId");

/** Symbol for UserContext (request-scoped user data) */
export type UserContextSymbol = typeof USER_CONTEXT_SYMBOL;
const USER_CONTEXT_SYMBOL: unique symbol = Symbol.for("UserContext");

// =============================================================================
// TYPES Export
// =============================================================================

/**
 * Service identifiers for dependency injection
 *
 * Use these symbols to identify services when binding and injecting.
 * All identifiers use Symbol.for() for cross-realm compatibility.
 *
 * @example
 * ```typescript
 * import { TYPES } from "./types";
 *
 * container.register(TYPES.UserRepository, asClass(DrizzleUserRepository));
 * ```
 */
export const TYPES = {
  // Framework Services
  SupabaseClient: SUPABASE_CLIENT_SYMBOL,

  // Repository Layer
  UserRepository: USER_REPOSITORY_SYMBOL,
  TripRepository: TRIP_REPOSITORY_SYMBOL,
  ChallengeRepository: CHALLENGE_REPOSITORY_SYMBOL,
  GroupRepository: GROUP_REPOSITORY_SYMBOL,
  RewardRepository: REWARD_REPOSITORY_SYMBOL,
  NotificationRepository: NOTIFICATION_REPOSITORY_SYMBOL,
  ChallengeSubmissionRepository: CHALLENGE_SUBMISSION_REPOSITORY_SYMBOL,
  SponsorRepository: SPONSOR_REPOSITORY_SYMBOL,
  LocationRepository: LOCATION_REPOSITORY_SYMBOL,
  ChallengeVoteRepository: CHALLENGE_VOTE_REPOSITORY_SYMBOL,
  SubmissionReportRepository: SUBMISSION_REPORT_REPOSITORY_SYMBOL,
  CoinTransactionRepository: COIN_TRANSACTION_REPOSITORY_SYMBOL,
  NotificationDeliveryRepository: NOTIFICATION_DELIVERY_REPOSITORY_SYMBOL,
  NotificationScheduleRepository: NOTIFICATION_SCHEDULE_REPOSITORY_SYMBOL,
  ActivityFeedRepository: ACTIVITY_FEED_REPOSITORY_SYMBOL,
  RewardPurchaseRepository: REWARD_PURCHASE_REPOSITORY_SYMBOL,

  // Service Layer
  CoinService: COIN_SERVICE_SYMBOL,
  RankingService: RANKING_SERVICE_SYMBOL,
  NotificationService: NOTIFICATION_SERVICE_SYMBOL,
  TripAccessService: TRIP_ACCESS_SERVICE_SYMBOL,
  TripPointsService: TRIP_POINTS_SERVICE_SYMBOL,
  GroupCoinsService: GROUP_COINS_SERVICE_SYMBOL,

  // Controllers
  UserController: USER_CONTROLLER_SYMBOL,
  TripController: TRIP_CONTROLLER_SYMBOL,
  ChallengeController: CHALLENGE_CONTROLLER_SYMBOL,
  GroupController: GROUP_CONTROLLER_SYMBOL,
  RewardController: REWARD_CONTROLLER_SYMBOL,
  NotificationController: NOTIFICATION_CONTROLLER_SYMBOL,

  // Infrastructure
  Logger: LOGGER_SYMBOL,
  Cache: CACHE_SYMBOL,
  EventBus: EVENT_BUS_SYMBOL,

  // Request Context
  RequestId: REQUEST_ID_SYMBOL,
  UserContext: USER_CONTEXT_SYMBOL,
} as const;

/**
 * Type helper for TYPES keys
 *
 * Use this type for functions that accept a service identifier key.
 *
 * @example
 * ```typescript
 * function getService<T>(key: ServiceIdentifier): T {
 *   return container.get<T>(TYPES[key]);
 * }
 * ```
 */
export type ServiceIdentifier = keyof typeof TYPES;

/**
 * Type helper for service identifier values
 *
 * Represents the union type of all service identifier symbols.
 */
export type ServiceIdentifierValue = (typeof TYPES)[ServiceIdentifier];
