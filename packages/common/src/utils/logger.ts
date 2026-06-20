import { createLogger } from "./logger-factory";

/**
 * Shared Pino logger for use across all packages.
 * For packages that need a named logger, use `createLogger({ name: "@mirai-app/your-package" })`.
 */
export const logger = createLogger({ name: "@mirai-app/common" });
