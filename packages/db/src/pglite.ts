import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { getTableName, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { schemaTables } from "./schema";

export type TestDB = ReturnType<typeof createPgliteTestDb>;

/**
 * Creates an in-memory PostgreSQL database using PGLite for testing.
 * Uses the production schema to avoid schema drift.
 *
 * Benefits over SQLite:
 * - Same pg-core schema as production (no separate sqlite schemas)
 * - Same type hierarchy as PostgresJsDatabase (no need for as unknown as DB)
 * - Real PostgreSQL behavior in-memory
 * - No Docker required
 *
 * @example
 * ```ts
 * const { db, cleanup } = createPgliteTestDb();
 * // Use db for tests
 * await cleanup();
 * ```
 */
export async function createPgliteTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const { apply } = await pushSchema(schema, drizzle(client));
  await apply();

  return {
    db,
    client,
    cleanup: async () => {
      await client.close();
    },
    reset: async () => {
      // Reset all tables for clean state between tests
      for (const table of schemaTables) {
        await db.execute(
          sql`TRUNCATE TABLE ${sql.raw(getTableName(table))} RESTART IDENTITY CASCADE`,
        );
      }
    },
  };
}
