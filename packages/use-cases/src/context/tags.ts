/**
 * Context Tags - Central export of all Effect Context Tags
 *
 * This module re-exports all Context.Tag definitions for repository, service ports,
 * and use cases, providing a single import point for dependency injection.
 *
 * @module context/tags
 */

// =============================================================================
// Use Case Tags (Effect DI for use cases)
// =============================================================================
export {
  // User use cases
  GetUserUseCaseTag,
  CreateUserUseCaseTag,
  UpdateUserUseCaseTag,
  type GetUserUseCase,
  type CreateUserUseCase,
  type UpdateUserUseCase,
  // Trip use cases
  GetTripUseCaseTag,
  CreateTripUseCaseTag,
  UpdateTripUseCaseTag,
  type GetTripUseCase,
  type CreateTripUseCase,
  type UpdateTripUseCase,
  // Challenge use cases
  GetChallengeUseCaseTag,
  CreateChallengeUseCaseTag,
  type GetChallengeUseCase,
  type CreateChallengeUseCase,
} from "./use-case-tags";

// =============================================================================
// Use Case Implementation Layers (for AppLayer composition)
// =============================================================================
export {
  // Individual use case layers
  GetUserUseCaseLayer,
  CreateUserUseCaseLayer,
  UpdateUserUseCaseLayer,
  GetTripUseCaseLayer,
  CreateTripUseCaseLayer,
  UpdateTripUseCaseLayer,
  GetChallengeUseCaseLayer,
  CreateChallengeUseCaseLayer,
  // Combined layer
  AllUseCasesLayer,
} from "./use-case-implementations";

// =============================================================================
// Repository Tags (Effect DI for repositories)
// =============================================================================
export { ActivityFeedRepositoryTag } from "../ports/ActivityFeedRepository";

export { AuthPortTag } from "../ports/AuthPort";

export { ChallengeRepositoryTag } from "../ports/ChallengeRepository";

export { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

export { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

export { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";

export { EventRepositoryTag } from "../ports/EventRepository";

export { GroupRepositoryTag } from "../ports/GroupRepository";

export { LocationRepositoryTag } from "../ports/LocationRepository";

export { NotificationDeliveryRepositoryTag } from "../ports/NotificationDeliveryRepository";

export { NotificationRepositoryTag } from "../ports/NotificationRepository";

export { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";

export { PubSubServiceTag } from "../ports/PubSubService";

export { RealtimePortTag } from "../ports/RealtimePort";

export {
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  TripPointsCalculatorTag,
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
} from "../ports/RewardRepository";

export { SponsorRepositoryTag } from "../ports/SponsorRepository";

export { StoragePortTag } from "../ports/StoragePort";

export { SubmissionReportRepositoryTag } from "../ports/SubmissionReportRepository";

export { TelemetryPortTag } from "../ports/TelemetryPort";

export { TripRepositoryTag } from "../ports/TripRepository";

export { UserRepositoryTag } from "../ports/UserRepository";
