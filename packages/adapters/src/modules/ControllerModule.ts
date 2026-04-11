/**
 * ControllerModule - API Layer DI Module
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";
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
  exports: string[];
}

type Cradle = Record<string, unknown>;
const scoped = (factory: (cradle: Cradle) => unknown) => ({
  factory,
  lifetime: Lifetime.SCOPED,
});

export const ControllerModule: StaticModule<ControllerModuleDef> =
  createStaticModule<ControllerModuleDef>({
    name: "ControllerModule",
    providers: {
      [CONTROLLER_TOKENS.UserController]: scoped(
        (c) => new UserController(c.userRepository as UserRepository),
      ),
      [CONTROLLER_TOKENS.TripController]: scoped(
        (c) => new TripController(c.tripRepository as TripRepository),
      ),
      [CONTROLLER_TOKENS.ChallengeController]: scoped(
        (c) =>
          new ChallengeController(c.challengeRepository as ChallengeRepository),
      ),
      [CONTROLLER_TOKENS.GroupController]: scoped(
        (c) => new GroupController(c.groupRepository as GroupRepository),
      ),
      [CONTROLLER_TOKENS.LocationController]: scoped(
        (c) =>
          new LocationController(c.locationRepository as LocationRepository),
      ),
      [CONTROLLER_TOKENS.NotificationController]: scoped(
        (c) =>
          new NotificationController(
            c.notificationRepository as NotificationRepository,
          ),
      ),
      [CONTROLLER_TOKENS.NotificationScheduleController]: scoped(
        (c) =>
          new NotificationScheduleController(
            c.notificationScheduleRepository as NotificationScheduleRepository,
          ),
      ),
      [CONTROLLER_TOKENS.NotificationDeliveryController]: scoped(
        (c) =>
          new NotificationDeliveryController(
            c.getDeliveriesUseCase,
            c.getDeliveryByNotificationIdUseCase,
            c.getDeliveryStatsUseCase,
            c.getFailedDeliveriesUseCase,
          ),
      ),
      [CONTROLLER_TOKENS.ChallengeSubmissionController]: scoped(
        (c) =>
          new ChallengeSubmissionController(
            c.challengeSubmissionRepository as ChallengeSubmissionRepository,
          ),
      ),
      [CONTROLLER_TOKENS.ChallengeVoteController]: scoped(
        (c) =>
          new ChallengeVoteController(
            c.challengeVoteRepository as ChallengeVoteRepository,
            c.challengeRepository as ChallengeRepository,
            c.challengeSubmissionRepository as ChallengeSubmissionRepository,
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
            c.activityFeedRepository as ActivityFeedRepository,
          ),
      ),
      [CONTROLLER_TOKENS.RewardController]: scoped(
        (c) =>
          new RewardController(
            c.rewardRepository as RewardRepository,
            c.rewardPurchaseRepository as RewardPurchaseRepository,
            c.tripPointsCalculator,
            c.groupCoinsService,
            c.tripAccessChecker,
          ),
      ),
      [CONTROLLER_TOKENS.CoinController]: scoped(
        (c) => new CoinController(c.addCoinsUseCase, c.removeCoinsUseCase),
      ),
      [CONTROLLER_TOKENS.CoinTransactionController]: scoped(
        (c) =>
          new CoinTransactionController(
            c.getCoinStatisticsUseCase,
            c.getMostActiveAdminStatsUseCase,
            c.getCoinTransactionsUseCase,
            c.getCoinQuickStatsUseCase,
            c.getCoinAdditionalInsightsUseCase,
          ),
      ),
      [CONTROLLER_TOKENS.SponsorController]: scoped(
        (c) => new SponsorController(c.sponsorRepository as SponsorRepository),
      ),
      [CONTROLLER_TOKENS.SubmissionReportController]: scoped(
        (c) =>
          new SubmissionReportController(
            c.submissionReportRepository as SubmissionReportRepository,
          ),
      ),
      [CONTROLLER_TOKENS.StorageController]: scoped(
        (c) => new StorageController(c.supabase as SupabaseClient),
      ),
      [SERVICE_TOKENS.NotificationService]: scoped(
        (c) => new NotificationService(c.db),
      ),
    },
    exports: [
      ...Object.values(CONTROLLER_TOKENS),
      ...Object.values(SERVICE_TOKENS),
    ],
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
