// Main adapters package exports

// Email service
export {
  SmtpEmailGateway,
  type SmtpEmailConfig,
  defaultSmtpEmailConfig,
  validateSmtpEmailConfig,
  loadSmtpConfigFromEnv,
  EmailConfigurationError,
  EmailSendError,
} from "./email";

// Service gateways (Authentication)
export { BetterAuthGateway } from "./auth/gateways/better-auth/BetterAuthGateway";
export { InProcessEventBusGateway } from "./shared/gateways/InProcessEventBusGateway";
export { RedisEventBusGateway } from "./shared/gateways/RedisEventBusGateway";
export {
  type RedisEventBusConfig,
  defaultRedisEventBusConfig,
  validateRedisEventBusConfig,
  loadRedisEventBusConfigFromEnv,
} from "./shared/gateways/RedisEventBusConfig";
export {
  RedisConnectionError,
  RedisPublishError,
  RedisSubscribeError,
  RedisConsumerGroupError,
  HandlerExecutionError,
  RedisParseError,
  // Note: ConfigurationError for EventBus is exported above;
  // SeaweedFS ConfigurationError is exported separately from storage/gateways/seaweedfs
} from "./shared/errors/EventBusErrors";

// In-memory storage gateway
export { InMemoryStorageGateway } from "./storage/gateways/in-memory/InMemoryStorageGateway";
export { DefaultStoragePathResolver } from "./storage/gateways/default/DefaultStoragePathResolver";

// SeaweedFS Storage Gateway (S3-compatible storage with native TUS)
export {
  // Core gateway
  SeaweedFSStorageGateway,

  // Configuration types
  type SeaweedFSConfig,

  // Default configuration values
  defaultSeaweedFSConfig,

  // Validation functions
  validateSeaweedFSConfig,
  loadConfigFromEnv,

  // Configuration errors
  ConfigurationError,

  // Storage error types
  StorageError,
  FileNotFoundError,
} from "./storage/gateways/seaweedfs";

// Storage utilities
export {
  STANDARD_BUCKETS,
  normalizeStoragePath,
  normalizeBucketName,
  createStoragePath,
  parseStoragePath,
  type StandardBucket,
} from "./storage/utils";

// User domain
export {
  UserDrizzleGateway,
  TripParticipantDrizzleGateway,
} from "./user/gateways/drizzle";
export {
  InMemoryUserGateway,
  InMemoryTripParticipantGateway,
} from "./user/gateways/in-memory";
export { UserMapper, TripParticipantMapper } from "./user/mappers";

// Group domain
export {
  GroupDrizzleGateway,
  GroupJoinRequestDrizzleGateway,
} from "./group/gateways/drizzle";
export {
  InMemoryGroupGateway,
  InMemoryGroupJoinRequestGateway,
} from "./group/gateways/in-memory";
export { GroupMapper, GroupJoinRequestMapper } from "./group/mappers";

// Trip domain
export { TripDrizzleGateway } from "./trip/gateways/drizzle";
export { InMemoryTripGateway } from "./trip/gateways/in-memory";
export {
  TripMapper,
  TripResourceMapper,
  TripInsuranceMapper,
} from "./trip/mappers";

// Location domain
export {
  LocationDrizzleGateway,
  LocationSharingRequestDrizzleGateway,
} from "./location/gateways/drizzle";
export {
  InMemoryLocationGateway,
  InMemoryLocationSharingRequestGateway,
} from "./location/gateways/in-memory";
export {
  LocationMapper,
  LocationSharingRequestMapper,
} from "./location/mappers";

// Notification domain
export {
  NotificationDrizzleGateway,
  PushSubscriptionDrizzleGateway,
  NotificationDeliveryDrizzleGateway,
  NotificationScheduleDrizzleGateway,
} from "./notification/gateways/drizzle";
export {
  InMemoryNotificationGateway,
  InMemoryPushSubscriptionGateway,
  InMemoryNotificationDeliveryGateway,
  InMemoryNotificationScheduleGateway,
} from "./notification/gateways/in-memory";
export {
  NotificationMapper,
  PushSubscriptionMapper,
  NotificationDeliveryMapper,
  NotificationScheduleMapper,
} from "./notification/mappers";

// Notification service
export { ExpoNotificationServiceGateway as NotificationServiceGateway } from "./notification/gateways/expo/ExpoNotificationServiceGateway";
export { InMemoryNotificationServiceGateway } from "./notification/gateways/in-memory/InMemoryNotificationServiceGateway";

// Challenge domain
export { ChallengeDrizzleGateway } from "./challenge/gateways/drizzle";
export { InMemoryChallengeGateway } from "./challenge/gateways/in-memory";
export { ChallengeMapper } from "./challenge/mappers";

// Challenge Submission domain
export { ChallengeSubmissionDrizzleGateway } from "./challenge-submission/gateways/drizzle/ChallengeSubmissionDrizzleGateway";
export { InMemoryChallengeSubmissionGateway } from "./challenge-submission/gateways/in-memory/InMemoryChallengeSubmissionGateway";

// Challenge Vote domain
export { ChallengeVoteDrizzleGateway } from "./challenge-vote/gateways/drizzle/ChallengeVoteDrizzleGateway";
export { InMemoryChallengeVoteGateway } from "./challenge-vote/gateways/in-memory/InMemoryChallengeVoteGateway";

// Coin domain
export { CoinTransactionDrizzleGateway } from "./coin/gateways/drizzle";
export { InMemoryCoinTransactionGateway } from "./coin/gateways/in-memory";
export { CoinTransactionMapper } from "./coin/mappers";

// Activity Feed domain
export {
  ActivityFeedDrizzleGateway,
  ActivityReactionDrizzleGateway,
} from "./activity-feed/gateways/drizzle";
export {
  InMemoryActivityFeedGateway,
  InMemoryActivityReactionGateway,
} from "./activity-feed/gateways/in-memory";
export { ActivityFeedMapper } from "./activity-feed/mappers";

// Reward domain
export { RewardDrizzleGateway } from "./reward/gateways/drizzle";
export { RewardPurchaseDrizzleGateway } from "./reward/gateways/drizzle/RewardPurchaseDrizzleGateway";
export { InMemoryRewardGateway } from "./reward/gateways/in-memory";
export { InMemoryRewardPurchaseGateway } from "./reward/gateways/in-memory/InMemoryRewardPurchaseGateway";
export { RewardMapper } from "./reward/mappers";

// Sponsor domain
export {
  SponsorDrizzleGateway,
  TripSponsorDrizzleGateway,
} from "./sponsor/gateways/drizzle";
export {
  InMemorySponsorGateway,
  InMemoryTripSponsorGateway,
} from "./sponsor/gateways/in-memory";
export { SponsorMapper } from "./sponsor/mappers";

// Submission Report domain
export { SubmissionReportDrizzleGateway } from "./submission-report/gateways/drizzle/SubmissionReportDrizzleGateway";
export { InMemorySubmissionReportGateway } from "./submission-report/gateways/in-memory/InMemorySubmissionReportGateway";
