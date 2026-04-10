/**
 * Mappers Index
 *
 * Re-exports all entity mappers for convenient importing.
 * Organized by ORM library (Prisma and Drizzle).
 */

// =============================================================================
// Prisma ORM Mappers (Legacy)
// =============================================================================
export { UserMapper } from "./prisma/UserMapper";
export { TripMapper } from "./prisma/TripMapper";
export { GroupMapper } from "./prisma/GroupMapper";
export { ChallengeMapper } from "./prisma/ChallengeMapper";
export { LocationMapper } from "./prisma/LocationMapper";
export { NotificationMapper } from "./prisma/NotificationMapper";
export { ActivityFeedMapper } from "./prisma/ActivityFeedMapper";
export { RewardMapper, RewardPurchaseMapper } from "./prisma/RewardMapper";
export { ChallengeSubmissionMapper } from "./prisma/ChallengeSubmissionMapper";
export { ChallengeVoteMapper } from "./prisma/ChallengeVoteMapper";
export { CoinTransactionMapper } from "./prisma/CoinTransactionMapper";
export { SponsorMapper } from "./prisma/SponsorMapper";
export { SubmissionReportMapper } from "./prisma/SubmissionReportMapper";
export { NotificationScheduleMapper } from "./prisma/NotificationScheduleMapper";
export { NotificationDeliveryMapper } from "./prisma/NotificationDeliveryMapper";

// =============================================================================
// Drizzle ORM Mappers (Phase 1 Migration)
// =============================================================================
export { UserDrizzleMapper } from "./drizzle/UserDrizzleMapper";
export { TripDrizzleMapper } from "./drizzle/TripDrizzleMapper";
export { GroupDrizzleMapper } from "./drizzle/GroupDrizzleMapper";
export { ChallengeDrizzleMapper } from "./drizzle/ChallengeDrizzleMapper";
export { LocationDrizzleMapper } from "./drizzle/LocationDrizzleMapper";
export { NotificationDrizzleMapper } from "./drizzle/NotificationDrizzleMapper";
export { ActivityFeedDrizzleMapper } from "./drizzle/ActivityFeedDrizzleMapper";
export { RewardDrizzleMapper } from "./drizzle/RewardDrizzleMapper";
export { ChallengeSubmissionDrizzleMapper } from "./drizzle/ChallengeSubmissionDrizzleMapper";
export { ChallengeVoteDrizzleMapper } from "./drizzle/ChallengeVoteDrizzleMapper";
export { CoinTransactionDrizzleMapper } from "./drizzle/CoinTransactionDrizzleMapper";
export { SponsorDrizzleMapper } from "./drizzle/SponsorDrizzleMapper";
export { SubmissionReportDrizzleMapper } from "./drizzle/SubmissionReportDrizzleMapper";
export { NotificationScheduleDrizzleMapper } from "./drizzle/NotificationScheduleDrizzleMapper";
export { NotificationDeliveryDrizzleMapper } from "./drizzle/NotificationDeliveryDrizzleMapper";
