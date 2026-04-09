/**
 * Auth Factory
 *
 * Factory functions for creating AuthServer instances with dependency injection.
 * AuthServer encapsulates server-side authentication operations.
 *
 * ## Usage
 *
 * ```typescript
 * import { createAuthServer } from "@repo/frameworks/factories";
 *
 * const authServer = await createAuthServer(prisma);
 * const { user, dbUser } = await authServer.requireAuth(supabase, accessToken);
 * ```
 *
 * ## Architecture
 *
 * Uses dynamic import to avoid circular dependencies between frameworks and adapters.
 */

import type { PrismaClient } from "../prisma/client";

// Type alias for AuthServer to avoid static import
type AuthServer = unknown;

/**
 * Create an AuthServer instance
 *
 * @param prisma - Prisma client instance for database operations
 * @returns AuthServer instance with authentication methods
 *
 * @example
 * ```typescript
 * const authServer = await createAuthServer(prisma);
 *
 * // Get session with user info
 * const session = await authServer.getSession(supabase, accessToken);
 *
 * // Require authentication
 * const { user, dbUser } = await authServer.requireAuth(supabase, accessToken);
 *
 * // Require admin role
 * const adminUser = await authServer.requireAdmin(supabase, accessToken);
 *
 * // Require moderator or admin role
 * const modUser = await authServer.requireModerator(supabase, accessToken);
 * ```
 */
export async function createAuthServer(
  prisma: PrismaClient,
): Promise<AuthServer> {
  const adapters = await import("@repo/adapters");
  return new adapters.AuthServer(prisma);
}
