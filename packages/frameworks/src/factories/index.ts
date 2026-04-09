/**
 * Frameworks Factories - Barrel Export
 *
 * Centralized exports for all factory functions used in dependency injection.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   createUserRepository,
 *   createCoinService,
 *   getNotificationService,
 * } from "@repo/frameworks/factories";
 *
 * // Create repository (async factory)
 * const userRepo = await createUserRepository();
 *
 * // Create service with dependencies
 * const coinService = await createCoinService(prisma, coinRepo, addCoinsUC, removeCoinsUC);
 *
 * // Get static notification service
 * const NotificationService = await getNotificationService();
 * const notification = NotificationService.createCoinsAddedNotification(...);
 * ```
 *
 * ## Factory Pattern with Dynamic Imports
 *
 * All factories use dynamic imports to avoid circular dependencies:
 * - Adapters depends on Frameworks (for PrismaClient types)
 * - Frameworks uses dynamic imports to access Adapters
 * - This breaks the static dependency cycle
 */

// =============================================================================
// Repository Factories
// =============================================================================

export {
  // Core repositories
  createUserRepository,
  createTripRepository,
  createChallengeRepository,
  createGroupRepository,
  createRewardRepository,
  createNotificationRepository,
  createChallengeSubmissionRepository,
  createSponsorRepository,
  createLocationRepository,
  createChallengeVoteRepository,
  createSubmissionReportRepository,
  createCoinTransactionRepository,
  createNotificationDeliveryRepository,
  createNotificationScheduleRepository,
  createActivityFeedRepository,
  // Cache management
  clearRepositoryCache,
} from "./repositories";

// =============================================================================
// Service Factories
// =============================================================================

export {
  // Core services
  createCoinTransactionService,
  createCoinService,
  createRankingActivityService,
  createNotificationSenderService,
  createTripPointsCalculator,
  createTripAccessChecker,
  createGroupCoinsService,
  // Static service accessor
  getNotificationService,
} from "./services";

// =============================================================================
// Auth Factories
// =============================================================================

export {
  // Auth server factory
  createAuthServer,
} from "./auth";
