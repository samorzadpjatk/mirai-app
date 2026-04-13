/**
 * Context Tags - Central export of all Effect Context Tags
 *
 * This module re-exports all Context.Tag definitions for repository and service ports,
 * providing a single import point for dependency injection.
 *
 * @module context/tags
 */

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
