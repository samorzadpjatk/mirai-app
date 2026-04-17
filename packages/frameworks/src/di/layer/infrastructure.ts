/**
 * Infrastructure Layer - Database Layer
 *
 * Provides low-level infrastructure Layer compositions.
 *
 * Note: Database client is typically passed directly to gateways
 * rather than through Context.Tag, as repositories need it at
 * construction time.
 */

import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";

/**
 * Configuration for database Layer
 */
export interface DatabaseLayerConfig {
  db: DrizzleDb;
}

/**
 * Creates a database configuration object.
 *
 * Note: The database client is typically passed directly to gateways
 * rather than through a Layer, as repositories need it at construction time.
 *
 * @example
 * ```typescript
 * const dbConfig = makeDatabaseLayer({ db });
 * const repoLayer = makeRepositoryLayer(dbConfig);
 * ```
 */
export const makeDatabaseLayer = (config: DatabaseLayerConfig) => {
  return { db: config.db };
};
