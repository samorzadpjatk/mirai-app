import { Effect, Data, Schedule, Runtime } from "effect";
import Redis from "ioredis";
import type { IEventBusPort, IDomainEvent, IPortError } from "@mirai-app/domain";
import {
  RedisConnectionError,
  RedisPublishError,
  RedisSubscribeError,
  RedisConsumerGroupError,
  HandlerExecutionError,
} from "../errors/EventBusErrors";
import type { RedisEventBusConfig } from "./RedisEventBusConfig";
import { defaultRedisEventBusConfig } from "./RedisEventBusConfig";

interface StreamMessage {
  id: string;
  fields: Record<string, string>;
}

interface StreamResponse {
  name: string;
  messages: StreamMessage[];
}

interface RedisXReadResponse {
  streamName: string;
  messages: Array<[string, string[]]>;
}

// Type guard for Redis XREAD/XREADGROUP response
function isRedisStreamResponse(
  value: unknown,
): value is Array<[string, Array<[string, string[]]>]> {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      Array.isArray(item) &&
      item.length === 2 &&
      typeof item[0] === "string" &&
      Array.isArray(item[1]),
  );
}

type EventHandler<T extends IDomainEvent, R = never> = (
  event: T,
) => Effect.Effect<void, never, R>;

export class RedisEventBusGateway implements IEventBusPort {
  private readonly redis: Redis;
  private readonly config: RedisEventBusConfig;
  private readonly activeSubscriptions: Map<
    string,
    { unsubscribe: () => void; isRunning: boolean }
  > = new Map();
  private handlerRuntime: Runtime.Runtime<never> | null = null;

  constructor(config: Partial<RedisEventBusConfig> = {}) {
    this.config = { ...defaultRedisEventBusConfig, ...config };

    this.redis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      retryStrategy: (times: number) => {
        if (times > this.config.maxRetries) {
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: this.config.maxRetries,
    });
  }

  setRuntime(runtime: Runtime.Runtime<never>): void {
    this.handlerRuntime = runtime;
  }

  private getStreamKey(eventTag: string): string {
    return `domain-events-${eventTag.toLowerCase()}`;
  }

  private getConsumerGroupName(eventTag: string): string {
    return `${eventTag.toLowerCase()}-consumers`;
  }

  publish<T extends IDomainEvent>(event: T) {
    const streamKey = this.getStreamKey(event._tag);
    const maxLen = this.config.maxStreamLength ?? 10000;

    return Effect.tryPromise({
      try: async () => {
        const eventJson = JSON.stringify(event);
        const timestamp = Date.now();

        await this.redis.xadd(
          streamKey,
          "MAXLEN",
          "~",
          maxLen,
          "*",
          "event",
          eventJson,
          "tag",
          event._tag,
          "timestamp",
          String(timestamp),
          "aggregateId",
          event.aggregateId,
        );
      },
      catch: (error) =>
        new RedisPublishError({
          eventTag: event._tag,
          cause: error,
        }),
    }).pipe(
      Effect.retry({
        schedule: Schedule.exponential("100 millis").pipe(
          Schedule.intersect(Schedule.recurs(this.config.maxRetries)),
        ),
        while: (error: IPortError) => error._tag === "RedisConnectionError",
      }),
    );
  }

  subscribe<T extends IDomainEvent>(
    eventTag: string,
    handler: EventHandler<T>,
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never> {
    const streamKey = this.getStreamKey(eventTag);
    const subscriptionId = `${eventTag}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (this.config.consumerGroup) {
      return this.subscribeWithConsumerGroup(
        subscriptionId,
        streamKey,
        eventTag,
        handler,
      );
    }
    return this.subscribeBroadcast(subscriptionId, streamKey, eventTag, handler);
  }

  private subscribeWithConsumerGroup<T extends IDomainEvent>(
    subscriptionId: string,
    streamKey: string,
    eventTag: string,
    handler: EventHandler<T>,
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never> {
    const gateway = this;
    const consumerGroup = gateway.config.consumerGroup ?? `${eventTag.toLowerCase()}-group`;
    const consumerName = gateway.config.consumerName ?? `${consumerGroup}-${Date.now()}`;

    return Effect.gen(function* () {
      yield* gateway.ensureConsumerGroup(streamKey, consumerGroup);

      let isRunning = true;
      const blockTimeout = gateway.config.blockTimeout ?? 5000;

      const consumerLoop = Effect.gen(function* () {
        const consumerRedis = new Redis({
          host: gateway.config.host,
          port: gateway.config.port,
          password: gateway.config.password,
          db: gateway.config.db,
          retryStrategy: (times: number) => {
            if (times > gateway.config.maxRetries) return null;
            return Math.min(times * 100, 3000);
          },
        });

        try {
          while (isRunning) {
            const result = yield* Effect.tryPromise({
              try: async () => {
                const streams = await consumerRedis.xreadgroup(
                  "GROUP",
                  consumerGroup,
                  consumerName,
                  "BLOCK",
                  blockTimeout,
                  "STREAMS",
                  streamKey,
                  ">",
                );
                return streams;
              },
              catch: (error) =>
                new RedisConnectionError({
                  operation: "XREADGROUP",
                  cause: error,
                }),
            });

            if (result !== null && !isRedisStreamResponse(result)) {
              return yield* Effect.fail(
                new RedisSubscribeError({
                  eventTag,
                  cause: new Error("Invalid Redis stream response format"),
                }),
              );
            }

            if (result && result.length > 0) {
              for (const streamResponse of result) {
                const messages = streamResponse[1];

                for (const message of messages) {
                  const messageId = message[0];
                  const fields = message[1];
                  const eventJson = fields[fields.indexOf("event") + 1];

                  if (eventJson) {
                    try {
                      const event = JSON.parse(eventJson) as T;

                      yield* Effect.tryPromise({
                        try: async () => {
                          if (gateway.handlerRuntime) {
                            await Runtime.runPromise(gateway.handlerRuntime, handler(event));
                          } else {
                            await Effect.runPromise(handler(event));
                          }
                        },
                        catch: (handlerError) =>
                          new HandlerExecutionError({
                            eventTag,
                            cause: handlerError,
                          }),
                      }).pipe(
                        Effect.tapError((error) =>
                          Effect.logError(`Handler failed for ${eventTag}`, error),
                        ),
                        Effect.catchAll(() => Effect.void),
                      );

                      yield* Effect.tryPromise({
                        try: async () => {
                          await consumerRedis.xack(
                            streamKey,
                            consumerGroup,
                            messageId,
                          );
                        },
                        catch: (error) =>
                          new RedisConnectionError({
                            operation: "XACK",
                            cause: error,
                          }),
                      }).pipe(
                        Effect.tapError((error) =>
                          Effect.logError(`Failed to acknowledge message ${messageId}`, error),
                        ),
                        Effect.catchAll(() => Effect.void),
                      );
                    } catch (parseError) {
                      yield* Effect.logError(
                        `Failed to parse event from message ${messageId}`,
                        parseError,
                      );
                      yield* Effect.tryPromise({
                        try: async () => {
                          await consumerRedis.xack(
                            streamKey,
                            consumerGroup,
                            messageId,
                          );
                        },
                        catch: () => {
                          // Ignore ack failure
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        } finally {
          consumerRedis.disconnect();
        }
      });

      Effect.runFork(consumerLoop);

      const subscription = {
        unsubscribe: () => {
          isRunning = false;
          gateway.activeSubscriptions.delete(subscriptionId);
        },
        isRunning: true,
      };
      gateway.activeSubscriptions.set(subscriptionId, subscription);

      return { unsubscribe: subscription.unsubscribe };
    });
  }

  private subscribeBroadcast<T extends IDomainEvent>(
    subscriptionId: string,
    streamKey: string,
    eventTag: string,
    handler: EventHandler<T>,
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never> {
    const gateway = this;

    return Effect.gen(function* () {
      let isRunning = true;
      let lastId = "$";
      const blockTimeout = gateway.config.blockTimeout ?? 5000;

      const broadcastLoop = Effect.gen(function* () {
        const subscriberRedis = new Redis({
          host: gateway.config.host,
          port: gateway.config.port,
          password: gateway.config.password,
          db: gateway.config.db,
          retryStrategy: (times: number) => {
            if (times > gateway.config.maxRetries) return null;
            return Math.min(times * 100, 3000);
          },
        });

        try {
          while (isRunning) {
          const result = yield* Effect.tryPromise({
            try: async () => {
              const streams = await subscriberRedis.xread(
                "BLOCK",
                blockTimeout,
                "STREAMS",
                streamKey,
                lastId,
              );
              return streams;
            },
            catch: (error) =>
              new RedisConnectionError({
                operation: "XREAD",
                cause: error,
              }),
          });

          if (result !== null && !isRedisStreamResponse(result)) {
            return yield* Effect.fail(
              new RedisSubscribeError({
                eventTag,
                cause: new Error("Invalid Redis stream response format"),
              }),
            );
          }

            if (result && result.length > 0) {
              for (const streamResponse of result) {
                const messages = streamResponse[1];

                for (const message of messages) {
                  const messageId = message[0];
                  lastId = messageId;

                  const fields = message[1];
                  const eventJson = fields[fields.indexOf("event") + 1];

                  if (eventJson) {
                    try {
                      const event = JSON.parse(eventJson) as T;

                      Effect.runFork(
                        Effect.gen(function* () {
                          yield* Effect.try({
                            try: () => {
                              if (gateway.handlerRuntime) {
                                return Runtime.runPromise(gateway.handlerRuntime, handler(event));
                              }
                              return Effect.runPromise(handler(event));
                            },
                            catch: (error) =>
                              new HandlerExecutionError({
                                eventTag,
                                cause: error,
                              }),
                          }).pipe(
                            Effect.tapError((error) =>
                              Effect.logError(`Handler error for ${eventTag}`, error),
                            ),
                            Effect.catchAll(() => Effect.void),
                          );
                        }),
                      );
                    } catch (parseError) {
                      yield* Effect.logError(
                        `Failed to parse event from message ${messageId}`,
                        parseError,
                      );
                    }
                  }
                }
              }
            }
          }
        } finally {
          subscriberRedis.disconnect();
        }
      });

      Effect.runFork(broadcastLoop);

      const subscription = {
        unsubscribe: () => {
          isRunning = false;
          gateway.activeSubscriptions.delete(subscriptionId);
        },
        isRunning: true,
      };
      gateway.activeSubscriptions.set(subscriptionId, subscription);

      return { unsubscribe: subscription.unsubscribe };
    });
  }

  private ensureConsumerGroup(
    streamKey: string,
    consumerGroup: string,
  ): Effect.Effect<
    void,
    RedisConsumerGroupError,
    never
  > {
    const gateway = this;

    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: async () => {
          try {
            await gateway.redis.xgroup(
              "CREATE",
              streamKey,
              consumerGroup,
              "$",
              "MKSTREAM",
            );
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes("BUSYGROUP")
            ) {
              return;
            }
            throw error;
          }
        },
        catch: (error) =>
          new RedisConsumerGroupError({
            operation: "XGROUP CREATE",
            eventTag: streamKey,
            cause: error,
          }),
      });

      return result;
    });
  }

  disconnect(): void {
    for (const subscription of this.activeSubscriptions.values()) {
      subscription.isRunning = false;
    }
    this.activeSubscriptions.clear();

    this.redis.disconnect();
  }
}
