/**
 * ControllerModule - API Layer DI Module
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";
import { Layer } from "effect";
import { UserController } from "../controllers/user";
import { TripController } from "../controllers/trip";
import { ChallengeController } from "../controllers/challenge";
import { GroupController } from "../controllers/group";
import { NotificationController } from "../controllers/notification";
import { ActivityFeedController } from "../controllers/activity-feed";
import { ChallengeSubmissionController } from "../controllers/challenge-submission";
import { ChallengeVoteController } from "../controllers/challenge-vote";
import { LocationController } from "../controllers/location";
import { RewardController } from "../controllers/reward";
import { SponsorController } from "../controllers/sponsor";
import { SubmissionReportController } from "../controllers/submission-report";
import { NotificationScheduleController } from "../controllers/notification-schedule";
import { NotificationDeliveryController } from "../controllers/notification-delivery";
import { CoinController } from "../controllers/coin";
import { CoinTransactionController } from "../controllers/coin-transaction";
import { StorageController } from "../controllers/storage";
import { NotificationService } from "../services/notification-service";
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
import {
  UserRepositoryTag,
  TripRepositoryTag,
  ChallengeRepositoryTag,
  GroupRepositoryTag,
  LocationRepositoryTag,
  NotificationRepositoryTag,
  ChallengeSubmissionRepositoryTag,
  ChallengeVoteRepositoryTag,
  ActivityFeedRepositoryTag,
  SponsorRepositoryTag,
  SubmissionReportRepositoryTag,
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  CoinTransactionRepositoryTag,
  NotificationDeliveryRepositoryTag,
  NotificationScheduleRepositoryTag,
} from "@mirai-app/use-cases";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { TokenExtractor } from "../utils/TokenExtractor";

export const SERVICE_TOKENS = {
  NotificationService: "notificationService",
} as const;
export type ServiceToken = (typeof SERVICE_TOKENS)[keyof typeof SERVICE_TOKENS];

export const CONTROLLER_TOKENS = {
  UserController: "userController",
  TripController: "tripController",
  ChallengeController: "challengeController",
  GroupController: "groupController",
  LocationController: "locationController",
  NotificationController: "notificationController",
  NotificationScheduleController: "notificationScheduleController",
  NotificationDeliveryController: "notificationDeliveryController",
  ChallengeSubmissionController: "challengeSubmissionController",
  ChallengeVoteController: "challengeVoteController",
  ActivityFeedController: "activityFeedController",
  RewardController: "rewardController",
  CoinController: "coinController",
  CoinTransactionController: "coinTransactionController",
  SponsorController: "sponsorController",
  SubmissionReportController: "submissionReportController",
  StorageController: "storageController",
} as const;
export type ControllerToken =
  (typeof CONTROLLER_TOKENS)[keyof typeof CONTROLLER_TOKENS];

export interface ControllerModuleDeps {
  [CONTROLLER_TOKENS.UserController]: UserController;
  [CONTROLLER_TOKENS.TripController]: TripController;
  [CONTROLLER_TOKENS.ChallengeController]: ChallengeController;
  [CONTROLLER_TOKENS.GroupController]: GroupController;
  [CONTROLLER_TOKENS.LocationController]: LocationController;
  [CONTROLLER_TOKENS.NotificationController]: NotificationController;
  [CONTROLLER_TOKENS.NotificationScheduleController]: NotificationScheduleController;
  [CONTROLLER_TOKENS.NotificationDeliveryController]: NotificationDeliveryController;
  [CONTROLLER_TOKENS.ChallengeSubmissionController]: ChallengeSubmissionController;
  [CONTROLLER_TOKENS.ChallengeVoteController]: ChallengeVoteController;
  [CONTROLLER_TOKENS.ActivityFeedController]: ActivityFeedController;
  [CONTROLLER_TOKENS.RewardController]: RewardController;
  [CONTROLLER_TOKENS.CoinController]: CoinController;
  [CONTROLLER_TOKENS.CoinTransactionController]: CoinTransactionController;
  [CONTROLLER_TOKENS.SponsorController]: SponsorController;
  [CONTROLLER_TOKENS.SubmissionReportController]: SubmissionReportController;
  [CONTROLLER_TOKENS.StorageController]: StorageController;
  [SERVICE_TOKENS.NotificationService]: NotificationService;
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
  supabase: SupabaseClient;
  authPort: AuthPort;
  telemetryPort: TelemetryPort;
  tokenExtractor: typeof TokenExtractor;
  authenticateUserUseCase: unknown;
  authorizeAdminUseCase: unknown;
  authorizeModeratorUseCase: unknown;
  logTelemetryUseCase: unknown;
  [key: string]: unknown;
}

export interface ControllerModuleDef {
  name: "ControllerModule";
  providers: Record<string, object | string | boolean | number>;
  exports: Record<string, object | string | boolean | number>;
}

type Cradle = Record<string, unknown>;
const scoped = (factory: (cradle: Cradle) => unknown) => ({
  factory,
  lifetime: Lifetime.SCOPED,
});

// Helper to create a repository layer with proper typing
function createRepoLayer<T, E>(
  tag: { of: (service: T) => Layer.Layer<E> },
  repo: T,
): Layer.Layer<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tag as any).of(repo) as Layer.Layer<unknown>;
}

// Helper to merge two layers
function mergeLayers(
  layer1: Layer.Layer<unknown>,
  layer2: Layer.Layer<unknown>,
): Layer.Layer<unknown> {
  return layer1.pipe(Layer.merge(layer2)) as Layer.Layer<unknown>;
}

export const ControllerModule: StaticModule<ControllerModuleDef> =
  createStaticModule<ControllerModuleDef>({
    name: "ControllerModule",
    providers: {
      [CONTROLLER_TOKENS.UserController]: scoped(
        (c) =>
          new UserController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              UserRepositoryTag as any,
              c.userRepository as UserRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.TripController]: scoped(
        (c) =>
          new TripController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              TripRepositoryTag as any,
              c.tripRepository as TripRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.ChallengeController]: scoped(
        (c) =>
          new ChallengeController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ChallengeRepositoryTag as any,
              c.challengeRepository as ChallengeRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.GroupController]: scoped(
        (c) =>
          new GroupController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              GroupRepositoryTag as any,
              c.groupRepository as GroupRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.LocationController]: scoped(
        (c) =>
          new LocationController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              LocationRepositoryTag as any,
              c.locationRepository as LocationRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.NotificationController]: scoped(
        (c) =>
          new NotificationController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              NotificationRepositoryTag as any,
              c.notificationRepository as NotificationRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.NotificationScheduleController]: scoped(
        (c) =>
          new NotificationScheduleController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              NotificationScheduleRepositoryTag as any,
              c.notificationScheduleRepository as NotificationScheduleRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.NotificationDeliveryController]: scoped(
        (c) =>
          new NotificationDeliveryController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              NotificationDeliveryRepositoryTag as any,
              c.notificationDeliveryRepository as NotificationDeliveryRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.ChallengeSubmissionController]: scoped(
        (c) =>
          new ChallengeSubmissionController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ChallengeSubmissionRepositoryTag as any,
              c.challengeSubmissionRepository as ChallengeSubmissionRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.ChallengeVoteController]: scoped(
        (c) =>
          new ChallengeVoteController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ChallengeVoteRepositoryTag as any,
              c.challengeVoteRepository as ChallengeVoteRepository,
            ) as unknown as Layer.Layer<unknown>,
            c.onChallengeCompleted as (params: {
              challengeId: string;
              tripId: string;
              adminId: string;
            }) => Promise<void>,
          ),
      ),
      [CONTROLLER_TOKENS.ActivityFeedController]: scoped(
        (c) =>
          new ActivityFeedController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ActivityFeedRepositoryTag as any,
              c.activityFeedRepository as ActivityFeedRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.RewardController]: scoped(
        (c) =>
          new RewardController(
            mergeLayers(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Layer.succeed(
                RewardRepositoryTag as any,
                c.rewardRepository as RewardRepository,
              ) as unknown as Layer.Layer<unknown>,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Layer.succeed(
                RewardPurchaseRepositoryTag as any,
                c.rewardPurchaseRepository as RewardPurchaseRepository,
              ) as unknown as Layer.Layer<unknown>,
            ),
          ),
      ),
      [CONTROLLER_TOKENS.CoinController]: scoped(
        (c) =>
          new CoinController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              CoinTransactionRepositoryTag as any,
              c.coinTransactionRepository as CoinTransactionRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.CoinTransactionController]: scoped(
        (c) =>
          new CoinTransactionController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              CoinTransactionRepositoryTag as any,
              c.coinTransactionRepository as CoinTransactionRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.SponsorController]: scoped(
        (c) =>
          new SponsorController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              SponsorRepositoryTag as any,
              c.sponsorRepository as SponsorRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.SubmissionReportController]: scoped(
        (c) =>
          new SubmissionReportController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              SubmissionReportRepositoryTag as any,
              c.submissionReportRepository as SubmissionReportRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
      ),
      [CONTROLLER_TOKENS.StorageController]: scoped(
        (c) => new StorageController(c.supabase as SupabaseClient),
      ),
      [SERVICE_TOKENS.NotificationService]: scoped(
        (c) => new NotificationService(c.db),
      ),
    },
    exports: {
      [CONTROLLER_TOKENS.UserController]: {
        factory: (cradle: Cradle) =>
          new UserController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              UserRepositoryTag as any,
              cradle.userRepository as UserRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.TripController]: {
        factory: (cradle: Cradle) =>
          new TripController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              TripRepositoryTag as any,
              cradle.tripRepository as TripRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.ChallengeController]: {
        factory: (cradle: Cradle) =>
          new ChallengeController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ChallengeRepositoryTag as any,
              cradle.challengeRepository as ChallengeRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.GroupController]: {
        factory: (cradle: Cradle) =>
          new GroupController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              GroupRepositoryTag as any,
              cradle.groupRepository as GroupRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.LocationController]: {
        factory: (cradle: Cradle) =>
          new LocationController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              LocationRepositoryTag as any,
              cradle.locationRepository as LocationRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.NotificationController]: {
        factory: (cradle: Cradle) =>
          new NotificationController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              NotificationRepositoryTag as any,
              cradle.notificationRepository as NotificationRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.NotificationScheduleController]: {
        factory: (cradle: Cradle) =>
          new NotificationScheduleController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              NotificationScheduleRepositoryTag as any,
              cradle.notificationScheduleRepository as NotificationScheduleRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.NotificationDeliveryController]: {
        factory: (cradle: Cradle) =>
          new NotificationDeliveryController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              NotificationDeliveryRepositoryTag as any,
              cradle.notificationDeliveryRepository as NotificationDeliveryRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.ChallengeSubmissionController]: {
        factory: (cradle: Cradle) =>
          new ChallengeSubmissionController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ChallengeSubmissionRepositoryTag as any,
              cradle.challengeSubmissionRepository as ChallengeSubmissionRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.ChallengeVoteController]: {
        factory: (cradle: Cradle) =>
          new ChallengeVoteController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ChallengeVoteRepositoryTag as any,
              cradle.challengeVoteRepository as ChallengeVoteRepository,
            ) as unknown as Layer.Layer<unknown>,
            cradle.onChallengeCompleted as (params: {
              challengeId: string;
              tripId: string;
              adminId: string;
            }) => Promise<void>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.ActivityFeedController]: {
        factory: (cradle: Cradle) =>
          new ActivityFeedController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              ActivityFeedRepositoryTag as any,
              cradle.activityFeedRepository as ActivityFeedRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.RewardController]: {
        factory: (cradle: Cradle) =>
          new RewardController(
            mergeLayers(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Layer.succeed(
                RewardRepositoryTag as any,
                cradle.rewardRepository as RewardRepository,
              ) as unknown as Layer.Layer<unknown>,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Layer.succeed(
                RewardPurchaseRepositoryTag as any,
                cradle.rewardPurchaseRepository as RewardPurchaseRepository,
              ) as unknown as Layer.Layer<unknown>,
            ),
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.CoinController]: {
        factory: (cradle: Cradle) =>
          new CoinController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              CoinTransactionRepositoryTag as any,
              cradle.coinTransactionRepository as CoinTransactionRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.CoinTransactionController]: {
        factory: (cradle: Cradle) =>
          new CoinTransactionController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              CoinTransactionRepositoryTag as any,
              cradle.coinTransactionRepository as CoinTransactionRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.SponsorController]: {
        factory: (cradle: Cradle) =>
          new SponsorController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              SponsorRepositoryTag as any,
              cradle.sponsorRepository as SponsorRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.SubmissionReportController]: {
        factory: (cradle: Cradle) =>
          new SubmissionReportController(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Layer.succeed(
              SubmissionReportRepositoryTag as any,
              cradle.submissionReportRepository as SubmissionReportRepository,
            ) as unknown as Layer.Layer<unknown>,
          ),
        lifetime: Lifetime.SCOPED,
      },
      [CONTROLLER_TOKENS.StorageController]: {
        factory: (cradle: Cradle) =>
          new StorageController(cradle.supabase as SupabaseClient),
        lifetime: Lifetime.SCOPED,
      },
      [SERVICE_TOKENS.NotificationService]: {
        factory: (cradle: Cradle) => new NotificationService(cradle.db),
        lifetime: Lifetime.SCOPED,
      },
    },
  });

export { UserController } from "../controllers/user";
export { TripController } from "../controllers/trip";
export { ChallengeController } from "../controllers/challenge";
export { GroupController } from "../controllers/group";
export { NotificationController } from "../controllers/notification";
export { ActivityFeedController } from "../controllers/activity-feed";
export { ChallengeSubmissionController } from "../controllers/challenge-submission";
export { ChallengeVoteController } from "../controllers/challenge-vote";
export { LocationController } from "../controllers/location";
export { RewardController } from "../controllers/reward";
export { SponsorController } from "../controllers/sponsor";
export { SubmissionReportController } from "../controllers/submission-report";
export { NotificationScheduleController } from "../controllers/notification-schedule";
export { NotificationDeliveryController } from "../controllers/notification-delivery";
export { CoinController } from "../controllers/coin";
export { CoinTransactionController } from "../controllers/coin-transaction";
export { StorageController } from "../controllers/storage";
export { NotificationService } from "../services/notification-service";
