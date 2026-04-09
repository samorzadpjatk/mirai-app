import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma Client Configuration
 *
 * This module provides the Prisma client factory for database access.
 * It uses the PostgreSQL adapter for optimal performance with Bun.
 *
 * This file is part of the Frameworks layer in Clean Architecture.
 */

// Type-only import for PrismaClient
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { PrismaClient as _PrismaClient } from "./lib/client";

export type PrismaClient = _PrismaClient;

// Module-level singleton cache
const clientCache = new Map<string, PrismaClient>();

/**
 * Lazy-load PrismaClient constructor to avoid circular dependencies
 */
async function getPrismaConstructor(): Promise<
  new (options: { adapter: unknown }) => PrismaClient
> {
  const { PrismaClient: ctor } = await import("./lib/client");
  return ctor as unknown as new (options: { adapter: unknown }) => PrismaClient;
}

/**
 * Creates or retrieves a cached Prisma client instance
 *
 * The client is cached per database URL to support multiple database
 * connections if needed (e.g., for multi-tenant scenarios).
 *
 * @param databaseUrl - PostgreSQL connection string
 * @returns PrismaClient instance
 *
 * @example
 * ```typescript
 * import { createPrismaClient } from "@repo/frameworks/prisma/client";
 *
 * const prisma = await createPrismaClient(process.env.DATABASE_URL);
 *
 * // Use in tRPC context
 * const user = await prisma.user.findUnique({
 *   where: { id: "user-123" }
 * });
 * ```
 */
export async function createPrismaClient(
  databaseUrl: string,
): Promise<PrismaClient> {
  // Return cached client if exists
  if (clientCache.has(databaseUrl)) {
    return clientCache.get(databaseUrl)!;
  }

  const PrismaClientCtor = await getPrismaConstructor();

  // Create new client with PostgreSQL adapter
  const client = new PrismaClientCtor({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  });

  // Cache the client
  clientCache.set(databaseUrl, client);

  return client;
}

/**
 * Gets an existing Prisma client or null if not initialized
 *
 * Use this when you want to check if a client exists without throwing.
 *
 * @param databaseUrl - PostgreSQL connection string
 * @returns PrismaClient instance or null
 */
export function getPrismaClient(databaseUrl: string): PrismaClient | null {
  return clientCache.get(databaseUrl) ?? null;
}

/**
 * Clears the Prisma client cache
 *
 * Useful for testing or when you need to recreate clients
 * (e.g., after database migrations).
 *
 * @param databaseUrl - Optional specific database URL to clear.
 *                     If not provided, clears all cached clients.
 */
export async function clearPrismaCache(databaseUrl?: string): Promise<void> {
  if (databaseUrl) {
    const client = clientCache.get(databaseUrl);
    if (client) {
      await client.$disconnect();
      clientCache.delete(databaseUrl);
    }
  } else {
    // Clear all clients
    for (const [url, client] of clientCache) {
      await client.$disconnect();
      clientCache.delete(url);
    }
  }
}

// Additional types are available via ./lib/*
