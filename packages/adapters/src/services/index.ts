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
export {
  DrizzleNotificationSenderService,
  NotificationSenderError,
} from "./notification-sender";

// =============================================================================
// Pub/Sub Services (GraphQL Subscriptions Migration)
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
export {
  NotificationDeliveryService,
  NotificationDeliveryError,
  type PushSubscription,
  type PushSubscriptionRepository,
  type DeliveryResult,
} from "./NotificationDeliveryService";
export {
  LocationStreamingService,
  LocationStreamingError,
} from "./LocationStreamingService";
export {
  EventEmitterPubSub,
  EventEmitterPubSubError,
} from "./EventEmitterPubSub";
