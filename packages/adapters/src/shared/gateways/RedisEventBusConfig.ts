import { Effect } from "effect";
import { ConfigurationError } from "../errors/EventBusErrors";

export interface RedisEventBusConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetries: number;
  maxStreamLength?: number;
  blockTimeout?: number;
  consumerGroup?: string;
  consumerName?: string;
}

export const defaultRedisEventBusConfig: RedisEventBusConfig = {
  host: "localhost",
  port: 6380,
  db: 1,
  maxRetries: 3,
  maxStreamLength: 10000,
  blockTimeout: 5000,
};

export function validateRedisEventBusConfig(
  config: Partial<RedisEventBusConfig> = {},
): Effect.Effect<RedisEventBusConfig, ConfigurationError, never> {
  return Effect.gen(function* () {
    const merged = { ...defaultRedisEventBusConfig, ...config };

    if (!merged.host || merged.host.trim() === "") {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "redis.host",
          message: "Host is required",
        }),
      );
    }

    if (merged.port < 1 || merged.port > 65535) {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "redis.port",
          message: `Invalid port number: ${merged.port}. Must be between 1 and 65535`,
        }),
      );
    }

    if (merged.db < 0 || merged.db > 15) {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "redis.db",
          message: `Invalid database number: ${merged.db}. Must be between 0 and 15`,
        }),
      );
    }

    if (merged.maxRetries < 0) {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "redis.maxRetries",
          message: `Invalid retry count: ${merged.maxRetries}. Must be non-negative`,
        }),
      );
    }

    if (merged.maxStreamLength !== undefined && merged.maxStreamLength < 1) {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "redis.maxStreamLength",
          message: `Invalid stream length: ${merged.maxStreamLength}. Must be at least 1`,
        }),
      );
    }

    if (merged.blockTimeout !== undefined && merged.blockTimeout < 0) {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "redis.blockTimeout",
          message: `Invalid block timeout: ${merged.blockTimeout}. Must be non-negative`,
        }),
      );
    }

    return merged;
  });
}

export function loadRedisEventBusConfigFromEnv(): Effect.Effect<
  RedisEventBusConfig,
  ConfigurationError,
  never
> {
  return Effect.gen(function* () {
    const config: RedisEventBusConfig = {
      host: process.env.REDIS_EVENTBUS_HOST ?? defaultRedisEventBusConfig.host,
      port: Number(
        process.env.REDIS_EVENTBUS_PORT ?? defaultRedisEventBusConfig.port,
      ),
      password: process.env.REDIS_EVENTBUS_PASSWORD,
      db: Number(
        process.env.REDIS_EVENTBUS_DB ?? defaultRedisEventBusConfig.db,
      ),
      maxRetries: Number(
        process.env.REDIS_EVENTBUS_MAX_RETRIES ??
          defaultRedisEventBusConfig.maxRetries,
      ),
      maxStreamLength: process.env.REDIS_EVENTBUS_MAX_STREAM_LEN
        ? Number(process.env.REDIS_EVENTBUS_MAX_STREAM_LEN)
        : defaultRedisEventBusConfig.maxStreamLength,
      blockTimeout: process.env.REDIS_EVENTBUS_BLOCK_TIMEOUT
        ? Number(process.env.REDIS_EVENTBUS_BLOCK_TIMEOUT)
        : defaultRedisEventBusConfig.blockTimeout,
      consumerGroup: process.env.REDIS_EVENTBUS_CONSUMER_GROUP,
      consumerName: process.env.REDIS_EVENTBUS_CONSUMER_NAME,
    };

    return yield* validateRedisEventBusConfig(config);
  });
}
