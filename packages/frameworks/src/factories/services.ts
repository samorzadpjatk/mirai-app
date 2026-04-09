/**
 * Service Factory
 *
 * Factory functions for creating service instances with dependency injection.
 * Services encapsulate business logic and coordinate between repositories.
 *
 * ## Usage
 *
 * ```typescript
 * import { createCoinService } from "@mirai-app/frameworks/factories";
 *
 * const coinService = await createCoinService(prisma, coinRepo, addCoinsUC, removeCoinsUC);
 * const result = await coinService.addCoinsWithActivity({...});
 * ```
 *
 * ## Architecture
 *
 * All factories use dynamic imports to avoid circular dependencies.
 */

import type { PrismaClient } from "../prisma/client";
import type { Prisma } from "../prisma";

// Type aliases for return types and dependencies (using any to avoid static imports)
type CoinTransactionService = unknown;
type CoinService = unknown;
type NotificationSenderService = unknown;
type RankingActivityService = unknown;
type TripPointsCalculator = unknown;
type TripAccessChecker = unknown;
type GroupCoinsService = unknown;
type CoinTransactionController = unknown;
type AddCoinsUseCase = unknown;
type RemoveCoinsUseCase = unknown;
type CoinTransactionRepository = unknown;

// Cache for service instances
const serviceCache = new Map<string, unknown>();

/**
 * Clear all cached service instances
 */
export function clearServiceCache(): void {
  serviceCache.clear();
}

/**
 * Create a PrismaCoinTransactionService instance
 *
 * @param prisma - Prisma client or transaction client
 * @param controller - Coin transaction controller instance
 */
export async function createCoinTransactionService(
  prisma: Prisma.TransactionClient | PrismaClient,
  controller: CoinTransactionController,
): Promise<CoinTransactionService> {
  const adapters = await import("@mirai-app/adapters");
  return new adapters.PrismaCoinTransactionService(prisma, controller as any);
}

/**
 * Create a PrismaCoinService instance
 *
 * @param prisma - Prisma transaction client
 * @param coinRepo - Coin transaction repository
 * @param addCoinsUseCase - Add coins use case
 * @param removeCoinsUseCase - Remove coins use case
 * @param rankingActivityService - Ranking activity service (optional, created if not provided)
 */
export async function createCoinService(
  prisma: Prisma.TransactionClient | PrismaClient,
  coinRepo: CoinTransactionRepository,
  addCoinsUseCase: AddCoinsUseCase,
  removeCoinsUseCase: RemoveCoinsUseCase,
  rankingActivityService?: RankingActivityService,
): Promise<CoinService> {
  const adapters = await import("@mirai-app/adapters");
  const rankingService =
    rankingActivityService ??
    new adapters.PrismaRankingActivityService(prisma as any);
  return new adapters.PrismaCoinService(
    prisma,
    coinRepo as any,
    addCoinsUseCase as any,
    removeCoinsUseCase as any,
    rankingService as any,
  );
}

/**
 * Create a PrismaRankingActivityService instance
 *
 * @param prisma - Prisma client instance
 */
export async function createRankingActivityService(
  prisma: PrismaClient,
): Promise<RankingActivityService> {
  const adapters = await import("@mirai-app/adapters");
  return new adapters.PrismaRankingActivityService(prisma);
}

/**
 * Create a PrismaNotificationSenderService instance
 *
 * @param prisma - Prisma client instance
 */
export async function createNotificationSenderService(
  prisma: PrismaClient,
): Promise<NotificationSenderService> {
  const adapters = await import("@mirai-app/adapters");
  return new adapters.PrismaNotificationSenderService(prisma);
}

/**
 * Create a PrismaTripPointsCalculator instance
 *
 * @param prisma - Prisma client
 */
export async function createTripPointsCalculator(
  prisma: PrismaClient,
): Promise<TripPointsCalculator> {
  const adapters = await import("@mirai-app/adapters");
  return new adapters.PrismaTripPointsCalculator(prisma);
}

/**
 * Create a PrismaTripAccessChecker instance
 *
 * @param prisma - Prisma client
 */
export async function createTripAccessChecker(
  prisma: PrismaClient,
): Promise<TripAccessChecker> {
  const adapters = await import("@mirai-app/adapters");
  return new adapters.PrismaTripAccessChecker(prisma);
}

/**
 * Create a PrismaGroupCoinsService instance
 *
 * @param prisma - Prisma client
 */
export async function createGroupCoinsService(
  prisma: PrismaClient,
): Promise<GroupCoinsService> {
  const adapters = await import("@mirai-app/adapters");
  return new adapters.PrismaGroupCoinsService(prisma);
}

/**
 * Get the NotificationService class (static service)
 *
 * @example
 * ```typescript
 * const NotificationService = await getNotificationService();
 * const notification = NotificationService.createCoinsAddedNotification(...);
 * ```
 */
export async function getNotificationService(): Promise<
  typeof import("@mirai-app/adapters").NotificationService
> {
  const adapters = await import("@mirai-app/adapters");
  return adapters.NotificationService;
}
