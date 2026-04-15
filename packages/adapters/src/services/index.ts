/**
 * Services Index
 *
 * Re-exports all service implementations for convenient importing.
 * Organized by domain (DDD) with framework subfolders.
 */

// =============================================================================
// Coin Domain
// =============================================================================
export { DrizzleCoinService } from "./coin/drizzle/service";
export { DrizzleCoinTransactionService } from "./coin/drizzle/transaction-service";

// =============================================================================
// Trip Domain
// =============================================================================
export { DrizzleTripPointsCalculator } from "./trip/drizzle/points-calculator";
export {
  DrizzleTripAccessChecker,
  type GroupLeaderCheckResult as DrizzleGroupLeaderCheckResult,
} from "./trip/drizzle/access-checker";

// =============================================================================
// Group Domain
// =============================================================================
export { DrizzleGroupCoinsService } from "./group/drizzle/coins-service";

// =============================================================================
// Reward Domain
// =============================================================================
export { DrizzleRewardService } from "./reward/drizzle/service";

// =============================================================================
// Ranking Domain
// =============================================================================
export {
  DrizzleRankingActivityService,
  type RankSnapshot as DrizzleRankSnapshot,
} from "./ranking/drizzle/activity-service";

// =============================================================================
// Notification Domain
// =============================================================================
export {
  DrizzleNotificationSenderService,
  NotificationSenderError,
} from "./notification/drizzle/sender-service";
export {
  NotificationDeliveryService,
  NotificationDeliveryError,
  type PushSubscription,
  type PushSubscriptionRepository,
  type DeliveryResult,
} from "./notification/drizzle/delivery-service";
export {
  NotificationService,
  type RankingTemplateValues,
} from "./notification/drizzle/service";

// =============================================================================
// Shared Infrastructure Services
// =============================================================================
export {
  EventBus,
  globalEventBus,
  type EventHandler,
  type EventSubscription,
} from "./_shared/event-bus";
export {
  ConnectionManager,
  type ConnectionInfo,
  type BroadcastLocation,
} from "./_shared/connection-manager";
export {
  LocationStreamingService,
  LocationStreamingError,
} from "./_shared/location-streaming";
export {
  EventEmitterPubSub,
  EventEmitterPubSubError,
} from "./_shared/event-emitter-pub-sub";
