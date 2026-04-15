/**
 * Controllers Index
 *
 * Re-exports all controller classes organized by domain (DDD).
 */

// =============================================================================
// User Domain
// =============================================================================
export { UserController } from "./user/controller";

// =============================================================================
// Trip Domain
// =============================================================================
export { TripController } from "./trip/controller";

// =============================================================================
// Group Domain
// =============================================================================
export { GroupController } from "./group/controller";

// =============================================================================
// Location Domain
// =============================================================================
export { LocationController } from "./location/controller";

// =============================================================================
// Event Domain
// =============================================================================
export { EventController } from "./event/controller";

// =============================================================================
// Challenge Domain
// =============================================================================
export { ChallengeController } from "./challenge/controller";
export { ChallengeSubmissionController } from "./challenge/submission-controller";
export {
  ChallengeVoteController,
  type ChallengeCompletedEvent,
} from "./challenge/vote-controller";

// =============================================================================
// Reward Domain
// =============================================================================
export { RewardController } from "./reward/controller";

// =============================================================================
// Sponsor Domain
// =============================================================================
export { SponsorController } from "./sponsor/controller";

// =============================================================================
// Notification Domain
// =============================================================================
export { NotificationController } from "./notification/controller";
export { NotificationScheduleController } from "./notification/schedule-controller";
export { NotificationDeliveryController } from "./notification/delivery-controller";

// =============================================================================
// Activity Feed Domain
// =============================================================================
export { ActivityFeedController } from "./activity-feed/controller";

// =============================================================================
// Coin Transaction Domain
// =============================================================================
export { CoinController } from "./coin-transaction/coin-controller";
export { CoinTransactionController } from "./coin-transaction/transaction-controller";

// =============================================================================
// Submission Report Domain
// =============================================================================
export { SubmissionReportController } from "./submission-report/controller";

// =============================================================================
// Storage Domain
// =============================================================================
export { StorageController } from "./storage/controller";

// =============================================================================
// Controller Factory and Types
// =============================================================================
export {
  type Controllers,
  type BaseControllers,
  type ControllerFactory,
  type CreateControllersOptions,
  createControllers,
} from "./factory";
