/**
 * Infrastructure Layer - Database and Logger Layers
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
 * Configuration for logger Layer
 */
export interface LoggerLayerConfig {
  /** Log level - defaults to "info" in production, "debug" in development */
  level?: "debug" | "info" | "warn" | "error";
  /** Enable pretty printing - defaults to true in development */
  pretty?: boolean;
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

/**
 * Creates a logger configuration.
 *
 * @example
 * ```typescript
 * const loggerConfig = makeLoggerLayer({ level: "debug", pretty: true });
 * ```
 */
export const makeLoggerLayer = (config: LoggerLayerConfig = {}) => {
  return {
    level:
      config.level ??
      (process.env.NODE_ENV === "production" ? "info" : "debug"),
    pretty: config.pretty ?? process.env.NODE_ENV !== "production",
  };
};
