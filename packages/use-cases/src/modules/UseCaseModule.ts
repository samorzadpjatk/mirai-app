/**
 * UseCaseModule - Application Business Logic Module
 *
 * Provides use case implementations as injectable services using awilix-modular.
 * All use cases are registered with SCOPED lifetime for request isolation.
 *
 * @example
 * ```typescript
 * const updateChallengeStatusUseCase = container.resolve("updateChallengeStatusUseCase");
 * ```
 *
 * @module UseCaseModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

// Note: All use cases are now function-based (Effect)
// No class-based use case imports needed
// Use function versions directly with Effect.provideService

// Port imports for dependency types
import type {
  UserRepository,
  ChallengeRepository,
  ChallengeSubmissionRepository,
  ChallengeVoteRepository,
  LocationRepository,
  NotificationRepository,
  ActivityFeedRepository,
  SubmissionReportRepository,
  SponsorRepository,
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
  CoinTransactionRepository,
  NotificationDeliveryRepository,
  NotificationScheduleRepository,
} from "../ports";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cradle = {
  userRepository: UserRepository;
  challengeRepository: ChallengeRepository;
  challengeSubmissionRepository: ChallengeSubmissionRepository;
  challengeVoteRepository: ChallengeVoteRepository;
  locationRepository: LocationRepository;
  notificationRepository: NotificationRepository;
  activityFeedRepository: ActivityFeedRepository;
  submissionReportRepository: SubmissionReportRepository;
  sponsorRepository: SponsorRepository;
  rewardRepository: RewardRepository;
  rewardPurchaseRepository: RewardPurchaseRepository;
  coinTransactionRepository: CoinTransactionRepository;
  notificationDeliveryRepository: NotificationDeliveryRepository;
  notificationScheduleRepository: NotificationScheduleRepository;
  tripPointsCalculator: TripPointsCalculator;
  groupCoinsService: GroupCoinsService;
  tripAccessChecker: TripAccessChecker;
} & Record<string, any>;

// Injection tokens
export const USE_CASE_TOKENS = {
  GetChallengeUseCase: "getChallengeUseCase",
  CreateChallengeUseCase: "createChallengeUseCase",
  UpdateChallengeUseCase: "updateChallengeUseCase",
  // Note: All use cases are now function-based (Effect)
  // Use function versions directly with Effect.provideService
  // No DI registration needed - import and use functions directly:
  // - updateChallengeStatusUseCase
  // - getJudgedStaffVotingProgressUseCase
  // - forceEndVotingUseCase
  // - listLocationsUseCase
  // - updateSharingSettingsUseCase
  // - addSharingUserUseCase
  // - removeSharingUserUseCase
  // - getSharingSettingsUseCase
  // - listSponsorsUseCase
  // - linkSponsorToTripUseCase
  // - unlinkSponsorFromTripUseCase
  // Note: GetNotificationUseCase removed - use getNotificationUseCase function directly
  // Note: Activity Feed use cases are now function-based (Effect)
  // Use getActivityFeedUseCase, createActivityUseCase, addReactionUseCase directly with Effect.provideService
  // Note: Report use cases are now function-based (Effect)
  // Use createReportUseCase, getReportsUseCase directly with Effect.provideService
  // Note: All use cases are now function-based (Effect)
  // Use function versions directly with Effect.provideService
} as const;

export type UseCaseToken =
  (typeof USE_CASE_TOKENS)[keyof typeof USE_CASE_TOKENS];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseCaseModuleDeps {
  // Note: All use cases are now function-based (Effect)
  // No DI registration needed - import and use functions directly with Effect.provideService
  // See individual use case files for function exports
}

// Module export
// Note: All use cases are now function-based (Effect)
// No DI registration needed - import and use functions directly with Effect.provideService
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UseCaseModule: StaticModule<any> = createStaticModule({
  name: "UseCaseModule",
  providers: {
    // All use cases are now function-based (Effect)
    // Import functions directly from use case files and use with Effect.provideService
    // Example: Effect.runPromise(getChallengeUseCase(input).pipe(Effect.provideService(ChallengeRepositoryTag, repo)))
  },
  exports: [],
});
