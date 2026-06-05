import { env } from "bun";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const DEFAULT_MIGRATIONS_FOLDER = "/drizzle";

interface Logger {
  info: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
}

const defaultLogger: Logger = {
  info: () => {
    /* empty */
  },
  error: (obj, msg) => console.error(msg, obj),
};

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
 * @param logger  Logger instance for structured logging. Defaults to console.
 */
export async function runMigrations(
  databaseUrl: string,
  migrationsFolder?: string,
  logger?: Logger,
): Promise<void> {
  const log = logger ?? defaultLogger;
  const folder = migrationsFolder ?? env.MIGRATIONS_FOLDER ?? DEFAULT_MIGRATIONS_FOLDER;

  log.info({ folder }, "Starting database migrations");
  const start = Date.now();

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: folder });
    const elapsed = Date.now() - start;
    log.info({ elapsed }, "Database migrations completed");
  } catch (error) {
    log.error(error, "Database migrations failed");
    throw error;
  } finally {
    await client.end();
  }
}
