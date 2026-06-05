import pino from "pino";

const env = typeof Bun !== "undefined" ? Bun.env : undefined;
const isTestEnv = env?.VITEST === "true";

export const logger = pino(
  {
    name: "@mirai-app/orpc",
    level: env?.LOG_LEVEL ?? "info",
  },
  isTestEnv
    ? {
        write(msg: string) {
          const parsed = JSON.parse(msg);
          const { level, time, pid, hostname, name, msg: message, err, ...rest } = parsed;
          const extras: unknown[] = [];
          if (err) extras.push(err);
          if (Object.keys(rest).length > 0) extras.push(rest);
          if (level >= 50) {
            console.error(message, ...extras);
          } else if (level >= 40) {
            console.warn(message, ...extras);
          } else {
          }
        },
      }
    : undefined,
);
