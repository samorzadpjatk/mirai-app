import pino from "pino";

const env = typeof Bun !== "undefined" ? Bun.env : undefined;
const isTestEnv = env?.VITEST === "true";

/**
 * Shared Pino logger for use across all packages that don't depend on @mirai-app/orpc.
 *
 * For packages that DO depend on @mirai-app/orpc (orpc, backend-server, notification-sender),
 * use the logger exported from @mirai-app/orpc instead to avoid circular dependencies.
 *
 * Native app: This logger is suitable for server-side code. For React Native runtime errors,
 * use Sentry or a React Native compatible logging solution.
 */
export const logger = pino(
  {
    name: "@mirai-app/shared",
    level: env?.LOG_LEVEL ?? "info",
  },
  isTestEnv
    ? {
        write(msg: string) {
          const parsed = JSON.parse(msg);
          if (parsed.level >= 50) {
            console.error(parsed.msg);
          } else if (parsed.level >= 40) {
            console.warn(parsed.msg);
          } else {
            console.info(parsed.msg);
          }
        },
      }
    : undefined,
);
