# Skill: Event Bus with Redis Streams

Build event-driven architectures using Redis Streams as the transport layer with Clean Architecture and Effect-TS patterns.

## Overview

This skill provides patterns for implementing a pluggable event bus in Clean Architecture:

- **Domain Layer**: `IDomainEvent`, `IEventBusPort`, `IEventHandler` interfaces
- **Use Cases Layer**: Event publishing in workflows, async handler registration
- **Adapters Layer**: Redis Streams gateway implementation
- **Frameworks Layer**: DI wiring with Effect Layers

The event bus enables async notification delivery (50-100ms API responses) while background handlers process push notifications (1-5 seconds).

## Quick Start

### 1. Domain: Create Event Interface

```typescript
// packages/domain/src/shared/events/DomainEvent.ts
export interface IDomainEvent {
  readonly _tag: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}
```

### 2. Domain: Create Event Bus Port

```typescript
// packages/domain/src/shared/events/EventBusPort.ts
import type { Effect } from "effect";
import type { IPortError } from "../errors/ports";
import type { IDomainEvent } from "./DomainEvent";

export interface IEventBusPort {
  publish<T extends IDomainEvent>(event: T): Effect.Effect<void, IPortError, never>;
  
  subscribe<T extends IDomainEvent>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, never>
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never>;
}
```

### 3. Domain: Create Event Handler Interface

```typescript
// packages/domain/src/shared/events/EventHandler.ts
import type { Effect } from "effect";
import type { IDomainEvent } from "./DomainEvent";

export interface IEventHandler<T extends IDomainEvent> {
  readonly eventTag: string;
  handle(event: T): Effect.Effect<void, never, never>;
}
```

### 4. Domain: Create Domain Event

```typescript
// packages/domain/src/notification/events/NotificationCreated.ts
import type { NotificationId } from "../value-objects/NotificationId";
import type { TripId } from "../../trip/value-objects/TripId";
import type { IDomainEvent } from "../../shared/events/DomainEvent";

export class NotificationCreated implements IDomainEvent {
  readonly _tag = "NotificationCreated";
  readonly version = 1;

  constructor(
    readonly aggregateId: NotificationId,
    readonly tripId: TripId | null,
    readonly title: string,
    readonly body: string,
    readonly url: string,
    readonly occurredAt: Date
  ) {}
}
```

### 5. Use-Cases: Create Context.Tag

```typescript
// packages/use-cases/src/shared/ports/EventBusPort.ts
import { Context } from "effect";
import type { IEventBusPort } from "@mirai-app/domain";

export class EventBusPortTag extends Context.Tag("EventBus")<
  EventBusPortTag,
  IEventBusPort
>() {}
```

### 6. Adapters: Implement Gateway

```typescript
// packages/adapters/src/shared/gateways/RedisEventBusGateway.ts
import { Effect, Runtime, Layer } from "effect";
import Redis from "ioredis";
import type { IEventBusPort, IDomainEvent } from "@mirai-app/domain";
import {
  RedisConnectionError,
  RedisPublishError,
  RedisSubscribeError,
  HandlerExecutionError,
} from "../errors/EventBusErrors";

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

export class RedisEventBusGateway implements IEventBusPort {
  private handlerRuntime: Runtime.Runtime<never> | null = null;
  private redis: Redis;

  constructor(private readonly config: RedisEventBusConfig) {
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      maxRetriesPerRequest: config.maxRetries,
    });
  }

  setRuntime(runtime: Runtime.Runtime<never>): void {
    this.handlerRuntime = runtime;
  }

  publish<T extends IDomainEvent>(event: T) {
    return Effect.gen(this, function* () {
      const streamKey = `domain-events-${event._tag.toLowerCase()}`;
      const maxlen = this.config.maxStreamLength ?? 10000;

      yield* Effect.tryPromise({
        try: () =>
          this.redis.xadd(streamKey, "*", "payload", JSON.stringify(event), "MAXLEN", "~", maxlen.toString()),
        catch: (error) => new RedisPublishError({ eventTag: event._tag, cause: error }),
      });
    }).pipe(
      Effect.retry({
        schedule: Schedule.exponential("100 millis").pipe(Schedule.intersect(Schedule.recurs(3))),
        while: (error) => error._tag === "RedisConnectionError",
      })
    );
  }

  subscribe<T extends IDomainEvent>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, never>,
    options?: { consumerGroup?: string; consumerName?: string }
  ) {
    return Effect.gen(this, function* () {
      const streamKey = `domain-events-${eventTag.toLowerCase()}`;
      const groupName = options?.consumerGroup ?? this.config.consumerGroup ?? `${eventTag.toLowerCase()}-consumers`;
      const consumerName = options?.consumerName ?? this.config.consumerName ?? `consumer-${Date.now()}`;

      const consumerRedis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
      });

      // Create consumer group if not exists
      yield* Effect.tryPromise({
        try: () =>
          consumerRedis.xgroup("CREATE", streamKey, groupName, "$", "MKSTREAM").catch((err) => {
            if (!err.message.includes("BUSYGROUP")) throw err;
          }),
        catch: (error) => new RedisSubscribeError({ eventTag, cause: error }),
      });

      const blockTimeout = this.config.blockTimeout ?? 5000;
      let running = true;

      const processLoop = Effect.gen(this, function* () {
        while (running) {
          const streams = yield* Effect.tryPromise({
            try: () =>
              consumerRedis.xreadgroup("GROUP", groupName, consumerName, "BLOCK", blockTimeout, "STREAMS", streamKey, ">"),
            catch: (error) => new RedisSubscribeError({ eventTag, cause: error }),
          });

          if (!streams || streams.length === 0) continue;

          for (const [, messages] of streams) {
            for (const [id, fields] of messages) {
              const payloadField = fields.find((f: string, i: number) => i % 2 === 0 && f === "payload");
              const payloadIndex = fields.indexOf(payloadField as string);
              const payload = payloadIndex >= 0 ? fields[payloadIndex + 1] : null;

              if (!payload) continue;

              yield* Effect.try({
                try: () => JSON.parse(payload) as T,
                catch: (error) =>
                  Effect.logError(`Failed to parse event ${id}`, error).pipe(Effect.asVoid),
              }).pipe(
                Effect.flatMap((event) =>
                  Effect.tryPromise({
                    try: async () => {
                      if (this.handlerRuntime) {
                        await Runtime.runPromise(this.handlerRuntime, handler(event));
                      } else {
                        await Effect.runPromise(handler(event));
                      }
                    },
                    catch: (error) =>
                      Effect.logError(`Handler failed for ${eventTag}`, { error, eventId: id }),
                  })
                ),
                Effect.tap(() =>
                  Effect.tryPromise({
                    try: () => consumerRedis.xack(streamKey, groupName, id),
                    catch: () => Effect.void,
                  })
                )
              );
            }
          }
        }
      }).pipe(Effect.catchAll((error) => Effect.logError(`Subscribe loop failed for ${eventTag}`, error)));

      Effect.runFork(processLoop);

      return {
        unsubscribe: () => {
          running = false;
          consumerRedis.disconnect();
        },
      };
    });
  }

  disconnect() {
    this.redis.disconnect();
  }
}
```

### 7. Use-Cases: Publish Event

```typescript
// packages/use-cases/src/notification/interactors/CreateNotificationUseCase.ts
import { Effect } from "effect";
import { EventBusPortTag } from "../../shared/ports/EventBusPort";
import { NotificationPortTag } from "../ports/NotificationPort";
import { NotificationCreated } from "@mirai-app/domain";

export const CreateNotificationUseCase = {
  execute: (input: CreateNotificationInput) =>
    Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;
      const eventBus = yield* EventBusPortTag;
      
      // Create and save notification
      const notification = yield* notificationPort.create(input);
      
      // Publish event (async - doesn't block response)
      yield* eventBus.publish(
        new NotificationCreated({
          aggregateId: notification.id,
          tripId: notification.tripId,
          title: notification.title,
          body: notification.body,
          url: notification.url,
          occurredAt: new Date(),
        })
      );
      
      return notification;
    }),
};
```

### 8. Use-Cases: Create Event Handler

```typescript
// packages/use-cases/src/notification/handlers/NotificationSendHandler.ts
import { Effect } from "effect";
import type { IEventHandler } from "@mirai-app/domain";
import type { NotificationCreated } from "@mirai-app/domain";
import { NotificationServicePortTag } from "../ports/NotificationServicePort";

export class NotificationSendHandler 
  implements IEventHandler<NotificationCreated> {
  readonly eventTag = "NotificationCreated";

  handle(event: NotificationCreated): Effect.Effect<void, never, never> {
    return Effect.gen(function* () {
      const notificationService = yield* NotificationServicePortTag;
      
      try {
        // Send push notifications via Expo
        yield* notificationService.sendMobileNotifications(event.aggregateId);
        
        yield* Effect.logInfo("Push notifications sent", {
          notificationId: event.aggregateId,
          title: event.title,
        });
      } catch (error) {
        // Log error but don't fail - prevent event bus disruption
        yield* Effect.logError("Failed to send push notifications", {
          notificationId: event.aggregateId,
          error,
        });
      }
    });
  }
}
```

### 9. Frameworks: Wire DI

```typescript
// packages/frameworks/src/di/layer/service.ts
import { Layer, Effect, Runtime } from "effect";
import { EventBusPortTag } from "@mirai-app/use-cases/shared/ports/EventBusPort";
import { RedisEventBusGateway, loadRedisEventBusConfigFromEnv } from "@mirai-app/adapters";
import { PushSubscriptionPortTag, NotificationDeliveryPortTag, NotificationServicePortTag } from "@mirai-app/use-cases";

export const makeEventBusLayer = (config?: RedisEventBusConfig) =>
  Effect.gen(function* () {
    const resolvedConfig = config
      ? Effect.succeed(config)
      : loadRedisEventBusConfigFromEnv();

    const cfg = yield* resolvedConfig;
    const gateway = new RedisEventBusGateway(cfg);

    // Capture notification ports for handler injection
    const pushSubscriptionPort = yield* PushSubscriptionPortTag;
    const deliveryPort = yield* NotificationDeliveryPortTag;
    const servicePort = yield* NotificationServicePortTag;

    // Build handler runtime with these ports
    const handlerLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionPort),
      Layer.succeed(NotificationDeliveryPortTag, deliveryPort),
      Layer.succeed(NotificationServicePortTag, servicePort),
    );

    const handlerRuntime = yield* Layer.toRuntime(handlerLayer);
    gateway.setRuntime(handlerRuntime);

    return Layer.succeed(EventBusPortTag, gateway);
  }).pipe(Effect.runSync);
```

### 10. Server: Initialize Handlers

```typescript
// apps/backend-server/src/index.ts
import { Effect } from "effect";
import { EventBusPortTag } from "@mirai-app/use-cases/shared/ports/EventBusPort";
import { NotificationSendHandler } from "@mirai-app/use-cases/notification/handlers/NotificationSendHandler";

const initializeEventHandlers = Effect.gen(function* () {
  const eventBus = yield* EventBusPortTag;
  const handler = new NotificationSendHandler();
  
  // Subscribe to events
  const subscription = yield* eventBus.subscribe(
    handler.eventTag,
    (event) => handler.handle(event)
  );
  
  yield* Effect.logInfo("Event handlers initialized");
  
  // Return cleanup function
  return subscription.unsubscribe;
});

// Run at startup
const cleanup = await Effect.runPromise(
  initializeEventHandlers.pipe(Effect.provide(appLayer))
);

// Cleanup on shutdown
process.on("SIGTERM", () => cleanup());
```

## Retry and Backoff Patterns

### Exponential Backoff for Push Notifications

```typescript
import { Effect, Schedule } from "effect";

const retryPolicy = Schedule.exponential("1 second").pipe(
  Schedule.intersect(Schedule.recurs(3)),
  Schedule.jittered // Add randomization
);

const sendWithRetry = (notification: Notification) =>
  sendPushNotification(notification).pipe(
    Effect.retry(retryPolicy),
    Effect.catchAll((error) => 
      Effect.logError("Push notification failed permanently", error)
    )
  );
```

### Conditional Retry (Non-retryable Errors)

```typescript
const shouldRetry = (error: PushNotificationError) =>
  !["DeviceNotRegistered", "InvalidCredentials", "MessageTooBig"].includes(error.code);

const sendWithConditionalRetry = sendPushNotification.pipe(
  Effect.retry({
    schedule: Schedule.exponential("1 second"),
    while: shouldRetry,
  })
);
```

## Error Handling Best Practices

### Handler Error Isolation

Event handlers must never throw - they should catch all errors internally:

```typescript
handle(event: T): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    try {
      yield* processEvent(event);
    } catch (error) {
      yield* Effect.logError("Handler failed", { event, error });
      // Optionally: send to dead letter queue, update metrics
    }
  });
}
```

### Push Notification Error Handling

```typescript
const handlePushError = (error: PushNotificationError) => {
  switch (error.code) {
    case "DeviceNotRegistered":
      // Remove token from database
      return removeToken(error.token);
    case "MessageRateExceeded":
      // Will be handled by retry with backoff
      return Effect.fail(error);
    case "InvalidCredentials":
      // Alert admin immediately
      return alertAdmin("Push credentials invalid");
    default:
      return Effect.fail(error);
  }
};
```

## Transport Swapping

### To Replace Redis with an Alternative (e.g., PostgreSQL NOTIFY):

1. Create new gateway implementing IEventBusPort:

```typescript
// packages/adapters/src/shared/gateways/PostgresNotifyEventBusGateway.ts
export class PostgresNotifyEventBusGateway implements IEventBusPort {
  constructor(private readonly db: DrizzleDb) {}
  
  publish<T extends IDomainEvent>(event: T) {
    return Effect.tryPromise({
      try: () => this.db.execute(`SELECT pg_notify('events:${event._tag}', '${JSON.stringify(event)}')`),
      catch: (error) => new EventBusError({ operation: "PostgresNotify.publish", cause: error }),
    });
  }
  
  subscribe<T extends IDomainEvent>(eventTag: string, handler: (event: T) => Effect.Effect<void, never, never>) {
    return Effect.tryPromise({
      try: async () => {
        const listener = (payload: string) => {
          const event = JSON.parse(payload) as T;
          Effect.runFork(handler(event));
        };
        await this.db.listen(`events:${eventTag}`, listener);
        return { unsubscribe: () => this.db.unlisten(`events:${eventTag}`, listener) };
      },
      catch: (error) => new EventBusError({ operation: "PostgresNotify.subscribe", cause: error }),
    });
  }
}
```

2. Change DI wiring:

```typescript
// packages/frameworks/src/di/layer/service.ts
export const makeEventBusLayer = (db: DrizzleDb) =>
  Layer.succeed(EventBusPortTag, new PostgresNotifyEventBusGateway(db));
```

No changes needed in use cases or handlers - the IEventBusPort abstraction enables seamless transport swapping.

## Testing

### Unit Test Handler

```typescript
import { describe, it, expect } from "bun:test";
import { Effect } from "effect";

describe("[UNIT] NotificationSendHandler", () => {
  it("sends notifications when event received", async () => {
    const sentNotifications: string[] = [];
    const mockService = {
      sendMobileNotifications: (id: string) => 
        Effect.sync(() => { sentNotifications.push(id); })
    };
    
    const handler = new NotificationSendHandler(mockService, mockPushSubPort);
    const event = new NotificationCreated({ /* ... */ });
    
    await Effect.runPromise(handler.handle(event));
    expect(sentNotifications).toContain(event.aggregateId);
  });
});
```

### Integration Test Event Bus

```typescript
describe("[INTEGRATION] RedisEventBus", () => {
  it("publishes and receives events", async () => {
    const events: IDomainEvent[] = [];
    const config: RedisEventBusConfig = {
      host: "localhost",
      port: 6380,
      db: 15, // Use separate test DB
      maxRetries: 3,
    };
    const eventBus = new RedisEventBusGateway(config);
    
    const sub = await Effect.runPromise(
      eventBus.subscribe("TestEvent", (e) => Effect.sync(() => events.push(e)))
    );
    
    const event = new TestEvent({ aggregateId: "123" });
    await Effect.runPromise(eventBus.publish(event));
    
    await new Promise((r) => setTimeout(r, 100));
    expect(events).toHaveLength(1);
    
    sub.unsubscribe();
    eventBus.disconnect();
  });
});
```

## Performance Guidelines

- **API Response**: 50-100ms (DB write + event publish)
- **Notification Delivery**: 1-5 seconds (background processing)
- **Batch Size**: Up to 100 push notifications per Expo API call
- **Concurrency**: Max 6 concurrent connections to Expo API
- **Rate Limit**: 600 notifications/second per project

## References

- Redis Streams Documentation: https://redis.io/docs/data-types/streams/
- Effect Documentation: https://effect.website/docs
- ioredis Client: https://github.com/redis/ioredis
- Clean Architecture: Robert C. Martin, Chapter 21 (Event Sourcing)

---

**Last Updated:** 2026-04-20
**Version:** 2.0.0 (Migrated from Supabase Realtime to Redis Streams)
