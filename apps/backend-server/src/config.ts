/**
 * Legacy Server Configuration - DEPRECATED
 *
 * This file is kept for backward compatibility but the configuration
 * is no longer used. Server configuration is now handled by
 * config/hono-config.ts for the Hono GraphQL server.
 *
 * @deprecated Use config/hono-config.ts instead
 */

import type { ServerOptions } from "./server";
import { honoConfig } from "./config/hono-config";

/**
 * Legacy server configuration mapped to Hono config values.
 * @deprecated Use honoConfig from config/hono-config.ts
 */
export const serverConfig: ServerOptions = {
  dev: !honoConfig.isProduction,
  port: honoConfig.port,
  prefix: "/graphql",
  host: honoConfig.host,
};
