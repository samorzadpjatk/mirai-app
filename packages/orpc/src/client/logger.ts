import { createClientLogger } from "@mirai-app/common/utils";

/**
 * Lightweight client-side logger for React Native.
 * Uses console methods instead of pino to avoid bundling server-side dependencies.
 * In production, this can be replaced with Sentry or another native logging solution.
 */
export const clientLogger = createClientLogger({ prefix: "orpc" });
