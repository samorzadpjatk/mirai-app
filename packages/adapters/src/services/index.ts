/**
 * Services Index
 *
 * Re-exports all service implementations for convenient importing.
 */

// =============================================================================
// Drizzle ORM Services (Current)
// =============================================================================
export { DrizzleTripPointsCalculator } from "./DrizzleTripPointsCalculator";
export { DrizzleGroupCoinsService } from "./DrizzleGroupCoinsService";
export {
  DrizzleTripAccessChecker,
  type GroupLeaderCheckResult as DrizzleGroupLeaderCheckResult,
} from "./DrizzleTripAccessChecker";
export {
  DrizzleRankingActivityService,
  type RankSnapshot as DrizzleRankSnapshot,
} from "./DrizzleRankingActivityService";
export { DrizzleCoinTransactionService } from "./DrizzleCoinTransactionService";
export { DrizzleCoinService } from "./DrizzleCoinService";
export { DrizzleRewardService } from "./DrizzleRewardService";
export { DrizzleNotificationSenderService } from "./DrizzleNotificationSenderService";

// =============================================================================
// Real-Time Architecture Services
// =============================================================================
export {
  EventBus,
  globalEventBus,
  type EventHandler,
  type EventSubscription,
} from "./EventBus";
export {
  ConnectionManager,
  type ConnectionInfo,
  type BroadcastLocation,
} from "./ConnectionManager";
export { LocationStreamingService } from "./LocationStreamingService";
export {
  NotificationDeliveryService,
  type PushSubscription,
  type PushSubscriptionRepository,
  type DeliveryResult,
} from "./NotificationDeliveryService";
