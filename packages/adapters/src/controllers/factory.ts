import type { Layer } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

// Import all 17 controllers
import { UserController } from "./user";
import { TripController } from "./trip";
import { ChallengeController } from "./challenge";
import { GroupController } from "./group";
import { LocationController } from "./location";
import { NotificationController } from "./notification";
import { NotificationScheduleController } from "./notification-schedule";
import { NotificationDeliveryController } from "./notification-delivery";
import { ChallengeSubmissionController } from "./challenge-submission";
import {
  ChallengeVoteController,
  type ChallengeCompletedEvent,
} from "./challenge-vote";
import { ActivityFeedController } from "./activity-feed";
import { RewardController } from "./reward";
import { CoinController } from "./coin";
import { CoinTransactionController } from "./coin-transaction";
import { SponsorController } from "./sponsor";
import { SubmissionReportController } from "./submission-report";
import { StorageController } from "./storage";

/**
 * Base Controllers interface containing 16 controller instances that use Effect Layer DI.
 * This provides type-safe access to Layer-based controllers via a typed object.
 *
 * Used in GraphQL context to provide direct controller access:
 * ```typescript
 * const user = await context.controllers.userController.getById({ id });
 * ```
 */
export interface BaseControllers {
  /** User management controller */
  userController: UserController;
  /** Trip management controller */
  tripController: TripController;
  /** Challenge management controller */
  challengeController: ChallengeController;
  /** Group management controller */
  groupController: GroupController;
  /** Location management controller */
  locationController: LocationController;
  /** Notification management controller */
  notificationController: NotificationController;
  /** Notification schedule management controller */
  notificationScheduleController: NotificationScheduleController;
  /** Notification delivery management controller */
  notificationDeliveryController: NotificationDeliveryController;
  /** Challenge submission management controller */
  challengeSubmissionController: ChallengeSubmissionController;
  /** Challenge vote management controller */
  challengeVoteController: ChallengeVoteController;
  /** Activity feed controller */
  activityFeedController: ActivityFeedController;
  /** Reward management controller */
  rewardController: RewardController;
  /** Coin management controller */
  coinController: CoinController;
  /** Coin transaction management controller */
  coinTransactionController: CoinTransactionController;
  /** Sponsor management controller */
  sponsorController: SponsorController;
  /** Submission report management controller */
  submissionReportController: SubmissionReportController;
}

/**
 * Full Controllers interface containing all 17 controller instances.
 * Includes StorageController which requires SupabaseClient (not yet migrated to Layer pattern).
 *
 * TODO: Migrate StorageController to use Effect Layer DI (Step 1.X)
 */
export interface Controllers extends BaseControllers {
  /** Storage management controller - requires SupabaseClient, not yet using Layer pattern */
  storageController: StorageController;
}

/**
 * ControllerFactory type for selective controller access.
 * Allows extracting a subset of controllers by specifying their keys.
 *
 * @example
 * ```typescript
 * type UserOnly = ControllerFactory<"userController">;
 * // Result: { userController: UserController }
 *
 * type UserAndTrip = ControllerFactory<"userController" | "tripController">;
 * // Result: { userController: UserController; tripController: TripController }
 * ```
 */
export type ControllerFactory<K extends keyof Controllers = keyof Controllers> =
  Pick<Controllers, K>;

/**
 * Options for creating controllers via the factory.
 */
export interface CreateControllersOptions {
  /** The composed Effect Layer containing dependencies for Layer-based controllers */
  appLayer: Layer.Layer<unknown>;
  /** SupabaseClient for StorageController (TODO: migrate to Layer pattern in future step) */
  supabase: SupabaseClient;
  /** Callback invoked when a challenge is completed via voting */
  onChallengeCompleted: (params: ChallengeCompletedEvent) => Promise<void>;
}

/**
 * Creates all 17 controllers with the provided Effect Layer and dependencies.
 *
 * This factory function instantiates every controller with the composed
 * application Layer, which provides all necessary dependencies (repositories,
 * services, ports) via Effect's compile-time dependency injection.
 *
 * @param options - Configuration options including appLayer and supabase client
 * @returns A Controllers object with all 17 controller instances
 *
 * @example
 * ```typescript
 * const appLayer = Layer.mergeAll(
 *   makeRepositoryLayer(db),
 *   makeServiceLayer(config),
 *   makePortsLayer(env)
 * );
 *
 * const controllers = createControllers({ appLayer, supabase });
 *
 * // Use in resolvers
 * const user = await controllers.userController.getById({ id: "123" });
 * ```
 */
export function createControllers(
  options: CreateControllersOptions,
): Controllers {
  const { appLayer, supabase, onChallengeCompleted } = options;

  return {
    userController: new UserController(appLayer),
    tripController: new TripController(appLayer),
    challengeController: new ChallengeController(appLayer),
    groupController: new GroupController(appLayer),
    locationController: new LocationController(appLayer),
    notificationController: new NotificationController(appLayer),
    notificationScheduleController: new NotificationScheduleController(
      appLayer,
    ),
    notificationDeliveryController: new NotificationDeliveryController(
      appLayer,
    ),
    challengeSubmissionController: new ChallengeSubmissionController(appLayer),
    challengeVoteController: new ChallengeVoteController(
      appLayer,
      onChallengeCompleted,
    ),
    activityFeedController: new ActivityFeedController(appLayer),
    rewardController: new RewardController(appLayer),
    coinController: new CoinController(appLayer),
    coinTransactionController: new CoinTransactionController(appLayer),
    sponsorController: new SponsorController(appLayer),
    submissionReportController: new SubmissionReportController(appLayer),
    storageController: new StorageController(supabase),
  };
}
