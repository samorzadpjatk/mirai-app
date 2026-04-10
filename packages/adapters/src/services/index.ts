/**
 * Services Index
 *
 * Re-exports all service implementations for convenient importing.
 */

// =============================================================================
// Drizzle ORM Services (Current)
// =============================================================================
export { DrizzleTripPointsCalculator } from "./trip-points";
export { DrizzleGroupCoinsService } from "./group-coins";
export {
  DrizzleTripAccessChecker,
  type GroupLeaderCheckResult as DrizzleGroupLeaderCheckResult,
} from "./trip-access";
export {
  DrizzleRankingActivityService,
  type RankSnapshot as DrizzleRankSnapshot,
} from "./ranking-activity";
export { DrizzleCoinTransactionService } from "./coin-transaction";
export { DrizzleCoinService } from "./coin";
export { DrizzleRewardService } from "./reward";
export { DrizzleNotificationSenderService } from "./notification-sender";

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
