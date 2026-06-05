import pino from "pino";

export interface LoggerOptions {
  name: string;
  level?: string;
}

/**
 * Create a Pino logger instance with consistent configuration.
 * In test environments, logs are written to console with human-readable formatting.
 */
export function createLogger(options: LoggerOptions) {
  const level = options.level ?? process.env.LOG_LEVEL ?? "info";
  const isTestEnv = process.env.VITEST === "true";

  return pino(
    {
      name: options.name,
      level,
    },
    isTestEnv
      ? {
          write(msg: string) {
            const parsed = JSON.parse(msg);
            const { level: _, time, pid, hostname, name, msg: message, err, ...rest } = parsed;
            const extras: unknown[] = [];
            if (err) extras.push(err);
            if (Object.keys(rest).length > 0) extras.push(rest);

            if (parsed.level >= 50) {
              console.error(message, ...extras);
            } else if (parsed.level >= 40) {
              console.warn(message, ...extras);
            } else {
              console.info(message, ...extras);
            }
          },
        }
      : undefined,
  );
}
