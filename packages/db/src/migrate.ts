import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "@mirai-app/shared";

const DEFAULT_MIGRATIONS_FOLDER = "/drizzle";

/**
 * Runs Drizzle migrations against the given database URL.
 *
 * Creates a dedicated connection, applies all pending migrations, then closes
 * the connection. Designed to be called once during application startup —
 * it is idempotent (only new journal entries are applied).
 *
 * @param databaseUrl  PostgreSQL connection string
 * @param migrationsFolder  Path to the folder containing migration SQL files
 *                          and the `meta/` subdirectory (defaults to `/drizzle`).
 *                          Falls back to the `MIGRATIONS_FOLDER` env var if set.
 */
export async function runMigrations(databaseUrl: string, migrationsFolder?: string): Promise<void> {
  const folder = migrationsFolder ?? process.env.MIGRATIONS_FOLDER ?? DEFAULT_MIGRATIONS_FOLDER;

  logger.info({ folder }, "Starting database migrations");
  const start = Date.now();

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: folder });
    const elapsed = Date.now() - start;
    logger.info({ elapsed }, "Database migrations completed");
  } catch (error) {
    logger.error(error, "Database migrations failed");
    throw error;
  } finally {
    await client.end();
  }
}
