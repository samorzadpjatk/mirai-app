/**
 * Prisma Schema Helpers
 *
 * Utility functions and types for working with Prisma schema definitions.
 * These helpers provide type-safe ways to construct Prisma queries and
 * understand schema relationships.
 *
 * NOTE: These are helper types. The actual Prisma types should be imported
 * from ./lib/client where the Prisma client is generated.
 */

/**
 * Type for Prisma model names
 *
 * This is a string literal type that should match your Prisma schema models.
 * Extend this as needed for your schema.
 */
export type PrismaModelName =
  | "User"
  | "Group"
  | "Challenge"
  | "Trip"
  | "Location"
  | "Notification"
  | "Reward"
  | "CoinTransaction"
  | "ActivityFeed"
  | "Sponsor";

/**
 * Helper type to get the where input type for a model
 *
 * NOTE: This is a generic type placeholder. Import actual Prisma types
 * from ./lib/client for production use:
 * ```typescript
 * import type { Prisma } from "./lib/client";
 * type UserWhereInput = Prisma.UserWhereInput;
 * ```
 */
export type PrismaWhereInput<T extends PrismaModelName> = Record<
  string,
  unknown
> & { _model?: T };

/**
 * Helper type to get the create input type for a model
 *
 * NOTE: Import actual Prisma types from ./lib/client:
 * ```typescript
 * import type { Prisma } from "./lib/client";
 * type UserCreateInput = Prisma.UserCreateInput;
 * ```
 */
export type PrismaCreateInput<T extends PrismaModelName> = Record<
  string,
  unknown
> & { _model?: T };

/**
 * Helper type to get the update input type for a model
 *
 * NOTE: Import actual Prisma types from ./lib/client:
 * ```typescript
 * import type { Prisma } from "./lib/client";
 * type UserUpdateInput = Prisma.UserUpdateInput;
 * ```
 */
export type PrismaUpdateInput<T extends PrismaModelName> = Record<
  string,
  unknown
> & { _model?: T };

/**
 * Helper type to get the include/select options for a model
 *
 * NOTE: Import actual Prisma types from ./lib/client:
 * ```typescript
 * import type { Prisma } from "./lib/client";
 * type UserInclude = Prisma.UserInclude;
 * ```
 */
export type PrismaInclude<T extends PrismaModelName> = Record<
  string,
  boolean | Record<string, unknown>
> & { _model?: T };

/**
 * Common Prisma query helpers for pagination
 */
export interface PaginationParams {
  /** Number of items to skip */
  skip?: number;
  /** Number of items to take */
  take?: number;
}

/**
 * Creates pagination args for Prisma queries
 *
 * @param params - Pagination parameters
 * @returns Prisma pagination arguments
 *
 * @example
 * ```typescript
 * const users = await prisma.user.findMany({
 *   ...createPaginationArgs({ skip: 0, take: 10 }),
 *   where: { active: true },
 * });
 * ```
 */
export function createPaginationArgs(params: PaginationParams): {
  skip: number;
  take: number;
} {
  return {
    skip: params.skip ?? 0,
    take: params.take ?? 20, // Default page size
  };
}

/**
 * Creates cursor-based pagination args for Prisma queries
 *
 * @param cursor - The cursor value (typically an ID)
 * @param take - Number of items to take
 * @returns Prisma cursor pagination arguments
 *
 * @example
 * ```typescript
 * const users = await prisma.user.findMany({
 *   ...createCursorPaginationArgs("user-123", 10),
 *   where: { active: true },
 * });
 * ```
 */
export function createCursorPaginationArgs(
  cursor: string,
  take: number,
): { cursor: { id: string }; take: number; skip: number } {
  return {
    cursor: { id: cursor },
    take,
    skip: 1, // Skip the cursor item itself
  };
}

/**
 * Common order by configurations
 */
export const ORDER_BY = {
  /** Order by createdAt descending (newest first) */
  newest: { createdAt: "desc" as const },
  /** Order by createdAt ascending (oldest first) */
  oldest: { createdAt: "asc" as const },
  /** Order by updatedAt descending (most recently updated first) */
  recentlyUpdated: { updatedAt: "desc" as const },
  /** Order by name ascending */
  nameAsc: { name: "asc" as const },
  /** Order by name descending */
  nameDesc: { name: "desc" as const },
};

/**
 * Helper to create a where clause for active records only
 *
 * @returns Prisma where clause filtering for non-deleted records
 */
export function whereActive(): { deletedAt: null } {
  return { deletedAt: null };
}

/**
 * Helper to create a where clause for records within a date range
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param field - Date field to filter on (default: "createdAt")
 * @returns Prisma where clause for date range
 */
export function whereDateRange(
  startDate: Date,
  endDate: Date,
  field: string = "createdAt",
): Record<string, { gte: Date; lte: Date }> {
  return {
    [field]: {
      gte: startDate,
      lte: endDate,
    },
  };
}

/**
 * Database transaction helper
 *
 * Wraps operations in a transaction for atomicity.
 *
 * @param prisma - Prisma client instance
 * @param operations - Array of operations to run in transaction
 * @returns Transaction result
 *
 * @example
 * ```typescript
 * const result = await runInTransaction(prisma, [
 *   prisma.user.create({ data: { name: "John" } }),
 *   prisma.profile.create({ data: { userId: "..." } }),
 * ]);
 * ```
 */
export async function runInTransaction<T>(
  prisma: { $transaction: (ops: Promise<unknown>[]) => Promise<T> },
  operations: Promise<unknown>[],
): Promise<T> {
  return prisma.$transaction(operations);
}

/**
 * Model relationship helpers
 *
 * These provide type-safe ways to include related data in queries.
 */
export const INCLUDE = {
  /** Include user profile data */
  userWithProfile: {
    profile: true,
  },
  /** Include challenge with submissions */
  challengeWithSubmissions: {
    submissions: true,
  },
  /** Include group with members */
  groupWithMembers: {
    members: true,
  },
  /** Include trip with locations */
  tripWithLocations: {
    locations: true,
  },
};

/**
 * Soft delete helper
 *
 * Creates update data for soft deletion (sets deletedAt timestamp).
 *
 * @returns Update data for soft delete
 */
export function softDeleteData(): { deletedAt: Date } {
  return { deletedAt: new Date() };
}

/**
 * Soft restore helper
 *
 * Creates update data for restoring a soft-deleted record.
 *
 * @returns Update data for restore
 */
export function softRestoreData(): { deletedAt: null } {
  return { deletedAt: null };
}
