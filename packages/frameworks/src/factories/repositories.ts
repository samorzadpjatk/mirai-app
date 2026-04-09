/**
 * Repository Factory
 *
 * Factory functions for creating repository instances with dependency injection.
 * Uses dynamic imports to avoid circular dependencies between frameworks and adapters.
 *
 * ## Usage
 *
 * ```typescript
 * import { createUserRepository } from "@repo/frameworks/factories";
 *
 * const userRepo = await createUserRepository();
 * const users = await userRepo.findAll();
 * ```
 *
 * ## Architecture
 *
 * All factories use dynamic imports to avoid circular dependencies:
 * - Adapters depends on Frameworks (for PrismaClient types)
 * - Frameworks uses dynamic imports to access Adapters at runtime
 * - This breaks the static dependency cycle
 */

import type { PrismaClient } from "../prisma/client";

// Cache for repository instances
const repositoryCache = new Map<string, unknown>();

/**
 * Get or create a cached repository instance
 */
function getOrCreate<T>(key: string, factory: () => Promise<T>): Promise<T> {
  if (!repositoryCache.has(key)) {
    const promise = factory().then((instance) => {
      repositoryCache.set(key, instance);
      return instance;
    });
    return promise;
  }
  return Promise.resolve(repositoryCache.get(key) as T);
}

/**
 * Clear all cached repository instances
 * Useful for testing or when recreating the Prisma client
 */
export function clearRepositoryCache(): void {
  repositoryCache.clear();
}

// =============================================================================
// Repository Factory Functions
// =============================================================================

// Type aliases for repository return types (using any to avoid static imports)
// These are resolved at runtime through dynamic imports
type UserRepository = unknown;
type TripRepository = unknown;
type ChallengeRepository = unknown;
type GroupRepository = unknown;
type RewardRepository = unknown;
type NotificationRepository = unknown;
type ChallengeSubmissionRepository = unknown;
type SponsorRepository = unknown;
type LocationRepository = unknown;
type ChallengeVoteRepository = unknown;
type SubmissionReportRepository = unknown;
type CoinTransactionRepository = unknown;
type NotificationDeliveryRepository = unknown;
type NotificationScheduleRepository = unknown;
type ActivityFeedRepository = unknown;

/**
 * Create a PrismaUserRepository instance
 */
export async function createUserRepository(
  prisma?: PrismaClient,
): Promise<UserRepository> {
  return getOrCreate("user", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaUserRepository(db);
  });
}

/**
 * Create a PrismaTripRepository instance
 */
export async function createTripRepository(
  prisma?: PrismaClient,
): Promise<TripRepository> {
  return getOrCreate("trip", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaTripRepository(db);
  });
}

/**
 * Create a PrismaChallengeRepository instance
 */
export async function createChallengeRepository(
  prisma?: PrismaClient,
): Promise<ChallengeRepository> {
  return getOrCreate("challenge", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaChallengeRepository(db);
  });
}

/**
 * Create a PrismaGroupRepository instance
 */
export async function createGroupRepository(
  prisma?: PrismaClient,
): Promise<GroupRepository> {
  return getOrCreate("group", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaGroupRepository(db);
  });
}

/**
 * Create a PrismaRewardRepository instance
 */
export async function createRewardRepository(
  prisma?: PrismaClient,
): Promise<RewardRepository> {
  return getOrCreate("reward", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaRewardRepository(db);
  });
}

/**
 * Create a PrismaNotificationRepository instance
 */
export async function createNotificationRepository(
  prisma?: PrismaClient,
): Promise<NotificationRepository> {
  return getOrCreate("notification", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaNotificationRepository(db);
  });
}

/**
 * Create a PrismaChallengeSubmissionRepository instance
 */
export async function createChallengeSubmissionRepository(
  prisma?: PrismaClient,
): Promise<ChallengeSubmissionRepository> {
  return getOrCreate("challengeSubmission", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaChallengeSubmissionRepository(db);
  });
}

/**
 * Create a PrismaSponsorRepository instance
 */
export async function createSponsorRepository(
  prisma?: PrismaClient,
): Promise<SponsorRepository> {
  return getOrCreate("sponsor", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaSponsorRepository(db);
  });
}

/**
 * Create a PrismaLocationRepository instance
 */
export async function createLocationRepository(
  prisma?: PrismaClient,
): Promise<LocationRepository> {
  return getOrCreate("location", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaLocationRepository(db);
  });
}

/**
 * Create a PrismaChallengeVoteRepository instance
 */
export async function createChallengeVoteRepository(
  prisma?: PrismaClient,
): Promise<ChallengeVoteRepository> {
  return getOrCreate("challengeVote", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaChallengeVoteRepository(db);
  });
}

/**
 * Create a PrismaSubmissionReportRepository instance
 */
export async function createSubmissionReportRepository(
  prisma?: PrismaClient,
): Promise<SubmissionReportRepository> {
  return getOrCreate("submissionReport", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaSubmissionReportRepository(db);
  });
}

/**
 * Create a PrismaCoinTransactionRepository instance
 */
export async function createCoinTransactionRepository(
  prisma?: PrismaClient,
): Promise<CoinTransactionRepository> {
  return getOrCreate("coinTransaction", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaCoinTransactionRepository(db);
  });
}

/**
 * Create a PrismaNotificationDeliveryRepository instance
 */
export async function createNotificationDeliveryRepository(
  prisma?: PrismaClient,
): Promise<NotificationDeliveryRepository> {
  return getOrCreate("notificationDelivery", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaNotificationDeliveryRepository(db);
  });
}

/**
 * Create a PrismaNotificationScheduleRepository instance
 */
export async function createNotificationScheduleRepository(
  prisma?: PrismaClient,
): Promise<NotificationScheduleRepository> {
  return getOrCreate("notificationSchedule", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaNotificationScheduleRepository(db);
  });
}

/**
 * Create a PrismaActivityFeedRepository instance
 */
export async function createActivityFeedRepository(
  prisma?: PrismaClient,
): Promise<ActivityFeedRepository> {
  return getOrCreate("activityFeed", async () => {
    const adapters = await import("@repo/adapters");
    const { createPrismaClient } = await import("../prisma/client");
    const db =
      prisma ?? (await createPrismaClient(process.env.DATABASE_URL ?? ""));
    return new adapters.PrismaActivityFeedRepository(db);
  });
}
