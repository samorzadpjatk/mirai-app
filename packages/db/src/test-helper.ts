import { PGlite } from "@electric-sql/pglite";
import type { PGlite as PGliteType } from "@electric-sql/pglite";
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

  // Apply schema using drizzle-kit push approach
  // We use raw SQL to create all tables since we don't have migration files
  // This is a test database so we don't need to be as precise
  await pushSchema(client);

  return {
    db,
    client,
    cleanup: async () => {
      await client.close();
    },
    reset: async (extraTables?: (typeof schemaTables)[number][]) => {
      // Reset all tables for clean state between tests
      const tablesToReset = extraTables ? [...schemaTables, ...extraTables] : schemaTables;
      for (const table of tablesToReset) {
        await db.execute(
          sql`TRUNCATE TABLE ${sql.raw(getTableName(table))} RESTART IDENTITY CASCADE`,
        );
      }
    },
  };
}

/**
 * Pushes the production schema to a PGLite client.
 * Uses drizzle-kit's API to generate and apply the schema.
 */
async function pushSchema(client: PGliteType) {
  const { pushSchema: pushSchemaApi } = await import("drizzle-kit/api");
  const db = drizzle(client, { schema });

  const { apply } = await pushSchemaApi(schema, db as any, undefined, undefined, undefined);
  await apply();
}
