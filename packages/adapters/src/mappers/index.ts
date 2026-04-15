/**
 * Mappers Index
 *
 * Re-exports all entity mappers for convenient importing.
 * Organized by domain (DDD) with framework subfolders.
 */

// =============================================================================
// User Domain
// =============================================================================
export { UserDrizzleMapper } from "./user/drizzle/mapper";
export { UserAgentDrizzleMapper } from "./user/drizzle/agent-mapper";

// =============================================================================
// Trip Domain
// =============================================================================
export { TripDrizzleMapper } from "./trip/drizzle/mapper";

// =============================================================================
// Group Domain
// =============================================================================
export { GroupDrizzleMapper } from "./group/drizzle/mapper";

// =============================================================================
// Location Domain
// =============================================================================
export { LocationDrizzleMapper } from "./location/drizzle/mapper";

// =============================================================================
// Event Domain
// =============================================================================
export { EventDrizzleMapper } from "./event/drizzle/mapper";

// =============================================================================
// Challenge Domain
// =============================================================================
export { ChallengeDrizzleMapper } from "./challenge/drizzle/mapper";
export { ChallengeSubmissionDrizzleMapper } from "./challenge/drizzle/submission-mapper";
export { ChallengeVoteDrizzleMapper } from "./challenge/drizzle/vote-mapper";

// =============================================================================
// Reward Domain
// =============================================================================
export { RewardDrizzleMapper } from "./reward/drizzle/mapper";

// =============================================================================
// Sponsor Domain
// =============================================================================
export { SponsorDrizzleMapper } from "./sponsor/drizzle/mapper";

// =============================================================================
// Notification Domain
// =============================================================================
export { NotificationDrizzleMapper } from "./notification/drizzle/mapper";
export { NotificationScheduleDrizzleMapper } from "./notification/drizzle/schedule-mapper";
export { NotificationDeliveryDrizzleMapper } from "./notification/drizzle/delivery-mapper";

// =============================================================================
// Activity Feed Domain
// =============================================================================
export { ActivityFeedDrizzleMapper } from "./activity-feed/drizzle/mapper";

// =============================================================================
// Coin Transaction Domain
// =============================================================================
export { CoinTransactionDTODrizzleMapper } from "./coin-transaction/drizzle/mapper";

// =============================================================================
// Submission Report Domain
// =============================================================================
export { SubmissionReportDrizzleMapper } from "./submission-report/drizzle/mapper";
