import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Create a Drizzle database client
 *
 * This function creates a PostgreSQL connection pool and returns
 * a Drizzle ORM instance with all schemas loaded.
 *
 * @param connectionString - PostgreSQL connection string (defaults to DATABASE_URL env var)
 * @returns Drizzle database client
 *
 * @example
 * ```typescript
 * const db = createDrizzleClient(process.env.DATABASE_URL);
 * const users = await db.query.users.findMany();
 * ```
 */
export function createDrizzleClient(connectionString?: string) {
  const databaseUrl = connectionString ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return drizzle(pool, { schema });
}

/**
 * Type definition for the Drizzle database client
 */
export type DrizzleDb = ReturnType<typeof createDrizzleClient>;

// Re-export all schema for convenient access
export * from "./schema";
