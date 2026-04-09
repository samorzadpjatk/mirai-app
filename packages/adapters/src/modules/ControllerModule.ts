/**
 * ControllerModule - API Layer Module
 *
 * Provides all 17 tRPC controllers as injectable services.
 * This module serves as the API layer in the Clean Architecture,
 * bridging HTTP requests (via tRPC) to the application use cases.
 *
 * ## Controller Catalog (17 controllers)
 *
 * | Token | Class | Repository Dependencies | Use Case Dependencies | Complexity |
 * |-------|-------|------------------------|----------------------|------------|
 * | `userController` | UserController | userRepository | GetUserUseCase, CreateUserUseCase, UpdateUserUseCase | Low |
 * | `tripController` | TripController | tripRepository | (none - uses domain directly) | Low |
 * | `challengeController` | ChallengeController | challengeRepository | GetChallengeUseCase, CreateChallengeUseCase, UpdateChallengeUseCase, UpdateChallengeStatusUseCase | Low |
 * | `groupController` | GroupController | groupRepository | (none - uses domain directly) | Low |
 * | `notificationController` | NotificationController | notificationRepository | GetNotificationUseCase | Low |
 * | `activityFeedController` | ActivityFeedController | activityFeedRepository | GetActivityFeedUseCase, CreateActivityUseCase, AddReactionUseCase | Low |
 * | `challengeSubmissionController` | ChallengeSubmissionController | challengeSubmissionRepository | CreateSubmissionUseCase, GetSubmissionUseCase, GetSubmissionByChallengeAndGroupUseCase, UpdateSubmissionUseCase, DeleteSubmissionUseCase, ListSubmissionsByChallengeUseCase | Medium |
 * | `challengeVoteController` | ChallengeVoteController | challengeVoteRepository | GetMyVotesUseCase, GetVotesByChallengeUseCase, GetChallengeVotingProgressUseCase, GetJudgedStaffVotingProgressUseCase, SubmitVoteUseCase, SubmitVotesUseCase, ForceEndVotingUseCase | High |
 * | `locationController` | LocationController | locationRepository | GetLocationUseCase, CreateLocationUseCase, UpdateLocationUseCase, ListLocationsUseCase, UpdateSharingSettingsUseCase, AddSharingUserUseCase, RemoveSharingUserUseCase, GetSharingSettingsUseCase | Medium |
 * | `rewardController` | RewardController | rewardRepository, purchaseRepository | GetRewardUseCase, CreateRewardUseCase, UpdateRewardUseCase, SetRewardHiddenUseCase, DeleteRewardUseCase, ListRewardsUseCase, PurchaseRewardUseCase, UpdatePurchaseStatusUseCase, UpdateMyPurchaseStatusUseCase, GetPurchaseHistoryUseCase | High |
 * | `sponsorController` | SponsorController | sponsorRepository | CreateSponsorUseCase, GetSponsorUseCase, UpdateSponsorUseCase, DeleteSponsorUseCase, ListSponsorsUseCase, LinkSponsorToTripUseCase, UnlinkSponsorFromTripUseCase | Medium |
 * | `submissionReportController` | SubmissionReportController | submissionReportRepository | CreateReportUseCase, GetReportsUseCase | Low |
 * | `notificationScheduleController` | NotificationScheduleController | notificationScheduleRepository | 11 use cases (CRUD + bulk operations) | High |
 * | `notificationDeliveryController` | NotificationDeliveryController | notificationDeliveryRepository | GetDeliveriesUseCase, GetDeliveryByNotificationIdUseCase, GetDeliveryStatsUseCase, GetFailedDeliveriesUseCase | Medium |
 * | `coinController` | CoinController | coinTransactionRepository | AddCoinsUseCase, RemoveCoinsUseCase | Low |
 * | `coinTransactionController` | CoinTransactionController | coinTransactionRepository | 5 coin statistics use cases | Medium |
 * | `storageController` | StorageController | (none) | (none - uses Supabase directly) | Low |
 *
 * ## Service Catalog (1 service)
 *
 * | Token | Class | Dependencies |
 * |-------|-------|-------------|
 * | `notificationService` | NotificationService | db |
 *
 * ## Complexity Classification
 *
 * ### Simple Controllers (1-2 dependencies)
 * - UserController, TripController, GroupController, NotificationController
 * - SubmissionReportController, StorageController, CoinController
 *
 * ### Medium Controllers (3-5 dependencies)
 * - ChallengeController, ChallengeSubmissionController, LocationController
 * - SponsorController, NotificationDeliveryController, CoinTransactionController
 *
 * ### High Complexity (6+ dependencies)
 * - RewardController (5 repos/services + 10 use cases)
 * - ChallengeVoteController (4 repos + 7 use cases + callbacks)
 * - NotificationScheduleController (11 use cases)
 * - ActivityFeedController (3 use cases + direct repo access)
 *
 * ## Usage
 *
 * ### Resolving Controllers
 *
 * ```typescript
 * import { container } from "@mirai-app/frameworks/di";
 *
 * // Resolve by token name
 * const userController = container.resolve("userController");
 *
 * // In a tRPC router with constructor injection
 * class UserRouter {
 *   constructor(private deps: ControllerModuleDeps) {}
 *
 *   async getUser(ctx: Context) {
 *     return this.deps.userController.getById({ id: ctx.input.id });
 *   }
 * }
 * ```
 *
 * ## Dependencies
 *
 * This module depends on RepositoryModule being available in the container.
 * All repository dependencies are resolved from the parent container.
 *
 * @module ControllerModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

// =============================================================================
// Controller Imports
// =============================================================================

import { UserController } from "../controllers/user-controller";
import { TripController } from "../controllers/trip-controller";
import { ChallengeController } from "../controllers/challenge-controller";
import { GroupController } from "../controllers/group-controller";
import { NotificationController } from "../controllers/notification-controller";
import { ActivityFeedController } from "../controllers/activityFeed-controller";
import { ChallengeSubmissionController } from "../controllers/challengeSubmission-controller";
import { ChallengeVoteController } from "../controllers/challengeVote-controller";
import { LocationController } from "../controllers/location-controller";
import { RewardController } from "../controllers/reward-controller";
import { SponsorController } from "../controllers/sponsor-controller";
import { SubmissionReportController } from "../controllers/submissionReport-controller";
import { NotificationScheduleController } from "../controllers/notification-schedule-controller";
import { NotificationDeliveryController } from "../controllers/notification-delivery-controller";
import { CoinController } from "../controllers/coin-controller";
import { CoinTransactionController } from "../controllers/coin-transaction-controller";
import { StorageController } from "../controllers/storage-controller";
import { NotificationService } from "../services/notificationService";

// =============================================================================
// Type Imports (for type definitions)
// =============================================================================

import type {
  UserRepository,
  TripRepository,
  ChallengeRepository,
  GroupRepository,
  LocationRepository,
  NotificationRepository,
  ChallengeSubmissionRepository,
  ChallengeVoteRepository,
  ActivityFeedRepository,
  SponsorRepository,
  SubmissionReportRepository,
  RewardRepository,
  RewardPurchaseRepository,
  CoinTransactionRepository,
  NotificationDeliveryRepository,
  NotificationScheduleRepository,
  AuthPort,
  TelemetryPort,
} from "@mirai-app/use-cases";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TokenExtractor } from "../utils/TokenExtractor";

// =============================================================================
// Injection Tokens
// =============================================================================

/**
 * Service injection tokens
 *
 * String-based tokens for service resolution. Using consistent
 * camelCase naming convention based on service name.
 */
export const SERVICE_TOKENS = {
  NotificationService: "notificationService",
} as const;

/**
 * Type for service token keys
 */
export type ServiceToken = (typeof SERVICE_TOKENS)[keyof typeof SERVICE_TOKENS];

/**
 * Controller injection tokens
 *
 * String-based tokens for controller resolution. Using consistent
 * camelCase naming convention based on entity name + "Controller".
 */
export const CONTROLLER_TOKENS = {
  // Core domain controllers
  UserController: "userController",
  TripController: "tripController",
  ChallengeController: "challengeController",
  GroupController: "groupController",
  LocationController: "locationController",

  // Notification & messaging controllers
  NotificationController: "notificationController",
  NotificationScheduleController: "notificationScheduleController",
  NotificationDeliveryController: "notificationDeliveryController",

  // Challenge & submission controllers
  ChallengeSubmissionController: "challengeSubmissionController",
  ChallengeVoteController: "challengeVoteController",
  ActivityFeedController: "activityFeedController",

  // Reward & gamification controllers
  RewardController: "rewardController",
  CoinController: "coinController",
  CoinTransactionController: "coinTransactionController",

  // Support & moderation controllers
  SponsorController: "sponsorController",
  SubmissionReportController: "submissionReportController",

  // Infrastructure controllers
  StorageController: "storageController",
} as const;

/**
 * Type for controller token keys
 */
export type ControllerToken =
  (typeof CONTROLLER_TOKENS)[keyof typeof CONTROLLER_TOKENS];

// =============================================================================
// Module Dependencies Type
// =============================================================================

/**
 * Controller module dependencies type
 *
 * Use this type for constructor injection when you need controllers.
 * All controllers are available as scoped services.
 *
 * @example
 * ```typescript
 * class MyRouter {
 *   constructor(private deps: ControllerModuleDeps) {}
 *
 *   async handleRequest(ctx: Context) {
 *     return this.deps.userController.getById(ctx.input);
 *   }
 * }
 * ```
 */
export interface ControllerModuleDeps {
  /** User management API */
  [CONTROLLER_TOKENS.UserController]: UserController;

  /** Trip management API */
  [CONTROLLER_TOKENS.TripController]: TripController;

  /** Challenge management API */
  [CONTROLLER_TOKENS.ChallengeController]: ChallengeController;

  /** Group management API */
  [CONTROLLER_TOKENS.GroupController]: GroupController;

  /** Location tracking API */
  [CONTROLLER_TOKENS.LocationController]: LocationController;

  /** Notification management API */
  [CONTROLLER_TOKENS.NotificationController]: NotificationController;

  /** Challenge submission API */
  [CONTROLLER_TOKENS.ChallengeSubmissionController]: ChallengeSubmissionController;

  /** Challenge voting API */
  [CONTROLLER_TOKENS.ChallengeVoteController]: ChallengeVoteController;

  /** Activity feed API */
  [CONTROLLER_TOKENS.ActivityFeedController]: ActivityFeedController;

  /** Reward and purchase API */
  [CONTROLLER_TOKENS.RewardController]: RewardController;

  /** Sponsor management API */
  [CONTROLLER_TOKENS.SponsorController]: SponsorController;

  /** Submission reporting API */
  [CONTROLLER_TOKENS.SubmissionReportController]: SubmissionReportController;

  /** Notification scheduling API */
  [CONTROLLER_TOKENS.NotificationScheduleController]: NotificationScheduleController;

  /** Notification delivery API */
  [CONTROLLER_TOKENS.NotificationDeliveryController]: NotificationDeliveryController;

  /** Coin operations API */
  [CONTROLLER_TOKENS.CoinController]: CoinController;

  /** Coin transaction queries API */
  [CONTROLLER_TOKENS.CoinTransactionController]: CoinTransactionController;

  /** Storage operations API */
  [CONTROLLER_TOKENS.StorageController]: StorageController;

  /** Notification service */
  [SERVICE_TOKENS.NotificationService]: NotificationService;

  /** Repository dependencies (from RepositoryModule) */
  userRepository: UserRepository;
  tripRepository: TripRepository;
  challengeRepository: ChallengeRepository;
  groupRepository: GroupRepository;
  locationRepository: LocationRepository;
  notificationRepository: NotificationRepository;
  challengeSubmissionRepository: ChallengeSubmissionRepository;
  challengeVoteRepository: ChallengeVoteRepository;
  activityFeedRepository: ActivityFeedRepository;
  sponsorRepository: SponsorRepository;
  submissionReportRepository: SubmissionReportRepository;
  rewardRepository: RewardRepository;
  rewardPurchaseRepository: RewardPurchaseRepository;
  coinTransactionRepository: CoinTransactionRepository;
  notificationDeliveryRepository: NotificationDeliveryRepository;
  notificationScheduleRepository: NotificationScheduleRepository;

  /** Supabase client (from FrameworkModule) */
  supabase: SupabaseClient;

  // =================================================================
  // Auth & Telemetry Dependencies (injected for controller auth)
  // =================================================================

  /** Authentication port for token validation */
  authPort: AuthPort;

  /** Telemetry port for logging */
  telemetryPort: TelemetryPort;

  /** Token extractor utility for Bearer token parsing */
  tokenExtractor: typeof TokenExtractor;

  /** Authenticate user use case (for auth flow in controllers) */
  authenticateUserUseCase: unknown;

  /** Authorize admin use case (for role checks in controllers) */
  authorizeAdminUseCase: unknown;

  /** Authorize moderator use case (for role checks in controllers) */
  authorizeModeratorUseCase: unknown;

  /** Log telemetry use case (for telemetry in controllers) */
  logTelemetryUseCase: unknown;
}

// =============================================================================
// Module Definition Type
// =============================================================================

/**
 * Controller module definition type
 *
 * Used for type checking and module composition.
 * Providers use object type to satisfy awilix-modular's DefProviderMap constraint.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ControllerModuleDef {
  name: "ControllerModule";
  // DefProviderMap constraint: values must be object | string | boolean | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: Record<string, object | string | boolean | number>;
  exports: string[];
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * Cradle type for awilix dependency resolution.
 * This represents the DI container's resolved dependencies.
 * Using Record<string, unknown> for type safety while allowing any dependency.
 */
type Cradle = Record<string, unknown>;

/**
 * Create user controller instance
 */
function createUserController(cradle: Cradle): UserController {
  return new UserController(cradle.userRepository);
}

/**
 * Create trip controller instance
 */
function createTripController(cradle: Cradle): TripController {
  return new TripController(cradle.tripRepository);
}

/**
 * Create challenge controller instance
 */
function createChallengeController(cradle: Cradle): ChallengeController {
  return new ChallengeController(cradle.challengeRepository);
}

/**
 * Create group controller instance
 */
function createGroupController(cradle: Cradle): GroupController {
  return new GroupController(cradle.groupRepository);
}

/**
 * Create notification controller instance
 */
function createNotificationController(cradle: Cradle): NotificationController {
  return new NotificationController(cradle.notificationRepository);
}

/**
 * Create activity feed controller instance
 */
function createActivityFeedController(cradle: Cradle): ActivityFeedController {
  return new ActivityFeedController(cradle.activityFeedRepository);
}

/**
 * Create challenge submission controller instance
 */
function createChallengeSubmissionController(
  cradle: Cradle,
): ChallengeSubmissionController {
  return new ChallengeSubmissionController(
    cradle.challengeSubmissionRepository,
  );
}

/**
 * Create challenge vote controller instance
 *
 * Note: This controller has optional dependencies for ForceEndVotingUseCase
 * that are resolved at method call time. The basic controller only needs
 * the voteRepository injected.
 */
function createChallengeVoteController(
  cradle: Cradle,
): ChallengeVoteController {
  return new ChallengeVoteController(cradle.challengeVoteRepository);
}

/**
 * Create location controller instance
 */
function createLocationController(cradle: Cradle): LocationController {
  return new LocationController(cradle.locationRepository);
}

/**
 * Create reward controller instance
 *
 * Complex controller with 5 dependencies:
 * - rewardRepository, purchaseRepository
 * - pointsCalculator, coinsService, accessChecker (domain services)
 */
function createRewardController(cradle: Cradle): RewardController {
  return new RewardController(
    cradle.rewardRepository,
    cradle.rewardPurchaseRepository,
    cradle.tripPointsCalculator,
    cradle.groupCoinsService,
    cradle.tripAccessChecker,
  );
}

/**
 * Create sponsor controller instance
 */
function createSponsorController(cradle: Cradle): SponsorController {
  return new SponsorController(cradle.sponsorRepository);
}

/**
 * Create submission report controller instance
 */
function createSubmissionReportController(
  cradle: Cradle,
): SubmissionReportController {
  return new SubmissionReportController(cradle.submissionReportRepository);
}

/**
 * Create notification schedule controller instance
 */
function createNotificationScheduleController(
  cradle: Cradle,
): NotificationScheduleController {
  return new NotificationScheduleController(
    cradle.notificationScheduleRepository,
  );
}

/**
 * Create notification delivery controller instance
 *
 * Note: This controller receives use case instances directly rather than
 * creating them internally. This follows the newer pattern for controllers.
 */
function createNotificationDeliveryController(
  cradle: Cradle,
): NotificationDeliveryController {
  return new NotificationDeliveryController(
    cradle.getDeliveriesUseCase,
    cradle.getDeliveryByNotificationIdUseCase,
    cradle.getDeliveryStatsUseCase,
    cradle.getFailedDeliveriesUseCase,
  );
}

/**
 * Create coin controller instance
 *
 * Note: This controller receives use case instances directly rather than
 * creating them internally. This follows the newer pattern for controllers.
 */
function createCoinController(cradle: Cradle): CoinController {
  return new CoinController(cradle.addCoinsUseCase, cradle.removeCoinsUseCase);
}

/**
 * Create coin transaction controller instance
 *
 * Note: This controller receives use case instances directly rather than
 * creating them internally. This follows the newer pattern for controllers.
 */
function createCoinTransactionController(
  cradle: Cradle,
): CoinTransactionController {
  return new CoinTransactionController(
    cradle.getCoinStatisticsUseCase,
    cradle.getMostActiveAdminStatsUseCase,
    cradle.getCoinTransactionsUseCase,
    cradle.getCoinQuickStatsUseCase,
    cradle.getCoinAdditionalInsightsUseCase,
  );
}

/**
 * Create storage controller instance
 */
function createStorageController(cradle: Cradle): StorageController {
  return new StorageController(cradle.supabase);
}

/**
 * Create notification service instance
 */
function createNotificationService(cradle: Cradle): NotificationService {
  return new NotificationService(cradle.db);
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * ControllerModule - Static module containing all 17 controller providers
 *
 * All controllers are registered with SCOPED lifetime because:
 * - Controllers are typically request-scoped in web applications
 * - SCOPED allows controllers to have request-specific state if needed
 * - Controllers can be safely shared within a single request context
 * - Each request gets its own controller instance
 *
 * The factory pattern is used to inject dependencies into each controller.
 *
 * @example
 * ```typescript
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { ControllerModule } from "@mirai-app/adapters/modules/ControllerModule";
 * import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
 *
 * const container = initializeContainer([
 *   RepositoryModule,  // Provides repositories
 *   ControllerModule,  // Provides all 17 controllers
 * ]);
 *
 * // Resolve a controller
 * const userController = container.resolve("userController");
 * ```
 */
export const ControllerModule: StaticModule<ControllerModuleDef> =
  createStaticModule<ControllerModuleDef>({
    name: "ControllerModule",

    providers: {
      // Core domain controllers
      [CONTROLLER_TOKENS.UserController]: {
        factory: createUserController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.TripController]: {
        factory: createTripController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.ChallengeController]: {
        factory: createChallengeController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.GroupController]: {
        factory: createGroupController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.LocationController]: {
        factory: createLocationController,
        lifetime: Lifetime.SCOPED,
      },

      // Notification & messaging controllers
      [CONTROLLER_TOKENS.NotificationController]: {
        factory: createNotificationController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.NotificationScheduleController]: {
        factory: createNotificationScheduleController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.NotificationDeliveryController]: {
        factory: createNotificationDeliveryController,
        lifetime: Lifetime.SCOPED,
      },

      // Challenge & submission controllers
      [CONTROLLER_TOKENS.ChallengeSubmissionController]: {
        factory: createChallengeSubmissionController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.ChallengeVoteController]: {
        factory: createChallengeVoteController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.ActivityFeedController]: {
        factory: createActivityFeedController,
        lifetime: Lifetime.SCOPED,
      },

      // Reward & gamification controllers
      [CONTROLLER_TOKENS.RewardController]: {
        factory: createRewardController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.CoinController]: {
        factory: createCoinController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.CoinTransactionController]: {
        factory: createCoinTransactionController,
        lifetime: Lifetime.SCOPED,
      },

      // Support & moderation controllers
      [CONTROLLER_TOKENS.SponsorController]: {
        factory: createSponsorController,
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.SubmissionReportController]: {
        factory: createSubmissionReportController,
        lifetime: Lifetime.SCOPED,
      },

      // Infrastructure controllers
      [CONTROLLER_TOKENS.StorageController]: {
        factory: createStorageController,
        lifetime: Lifetime.SCOPED,
      },

      // Services
      [SERVICE_TOKENS.NotificationService]: {
        factory: createNotificationService,
        lifetime: Lifetime.SCOPED,
      },
    },

    exports: [
      // Core domain
      CONTROLLER_TOKENS.UserController,
      CONTROLLER_TOKENS.TripController,
      CONTROLLER_TOKENS.ChallengeController,
      CONTROLLER_TOKENS.GroupController,
      CONTROLLER_TOKENS.LocationController,

      // Notification & messaging
      CONTROLLER_TOKENS.NotificationController,
      CONTROLLER_TOKENS.NotificationScheduleController,
      CONTROLLER_TOKENS.NotificationDeliveryController,

      // Challenge & submission
      CONTROLLER_TOKENS.ChallengeSubmissionController,
      CONTROLLER_TOKENS.ChallengeVoteController,
      CONTROLLER_TOKENS.ActivityFeedController,

      // Reward & gamification
      CONTROLLER_TOKENS.RewardController,
      CONTROLLER_TOKENS.CoinController,
      CONTROLLER_TOKENS.CoinTransactionController,

      // Support & moderation
      CONTROLLER_TOKENS.SponsorController,
      CONTROLLER_TOKENS.SubmissionReportController,

      // Infrastructure
      CONTROLLER_TOKENS.StorageController,

      // Services
      SERVICE_TOKENS.NotificationService,
    ],
  });

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { UserController } from "../controllers/user-controller";
export { TripController } from "../controllers/trip-controller";
export { ChallengeController } from "../controllers/challenge-controller";
export { GroupController } from "../controllers/group-controller";
export { NotificationController } from "../controllers/notification-controller";
export { ActivityFeedController } from "../controllers/activityFeed-controller";
export { ChallengeSubmissionController } from "../controllers/challengeSubmission-controller";
export { ChallengeVoteController } from "../controllers/challengeVote-controller";
export { LocationController } from "../controllers/location-controller";
export { RewardController } from "../controllers/reward-controller";
export { SponsorController } from "../controllers/sponsor-controller";
export { SubmissionReportController } from "../controllers/submissionReport-controller";
export { NotificationScheduleController } from "../controllers/notification-schedule-controller";
export { NotificationDeliveryController } from "../controllers/notification-delivery-controller";
export { CoinController } from "../controllers/coin-controller";
export { CoinTransactionController } from "../controllers/coin-transaction-controller";
export { StorageController } from "../controllers/storage-controller";
export { NotificationService } from "../services/notificationService";
