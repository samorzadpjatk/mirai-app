/**
 * Services Index
 *
 * Re-exports all service implementations for convenient importing.
 */

// =============================================================================
// Prisma Services (Legacy - being replaced by Drizzle)
// =============================================================================
export { PrismaTripPointsCalculator } from "./PrismaTripPointsCalculator";
export { PrismaGroupCoinsService } from "./PrismaGroupCoinsService";
export {
  PrismaTripAccessChecker,
  type GroupLeaderCheckResult,
} from "./PrismaTripAccessChecker";
export {
  PrismaRankingActivityService,
  type RankSnapshot,
} from "./PrismaRankingActivityService";
export { PrismaCoinTransactionService } from "./PrismaCoinTransactionService";
export { PrismaCoinService } from "./PrismaCoinService";
export { PrismaRewardService } from "./PrismaRewardService";
export { PrismaNotificationSenderService } from "./PrismaNotificationSenderService";

// =============================================================================
// Phase 1: Drizzle ORM Migration Services (New)
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
// Phase 2: Real-Time Architecture Services
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
