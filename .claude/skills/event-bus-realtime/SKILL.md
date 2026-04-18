# Skill: Event Bus with Supabase Realtime

Build event-driven architectures using Supabase Realtime as the transport layer with Clean Architecture and Effect-TS patterns.

## Overview

This skill provides patterns for implementing a pluggable event bus in Clean Architecture:

- **Domain Layer**: `IDomainEvent`, `IEventBusPort`, `IEventHandler` interfaces
- **Use Cases Layer**: Event publishing in workflows, async handler registration
- **Adapters Layer**: Supabase Realtime gateway implementation
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
// packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts
import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { IEventBusPort, IDomainEvent } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

export class SupabaseRealtimeEventBusGateway implements IEventBusPort {
  constructor(private readonly supabase: SupabaseClient) {}

  publish<T extends IDomainEvent>(event: T) {
    return Effect.tryPromise({
      try: async () => {
        const channel = `domain-events-${event._tag.toLowerCase()}`;
        const response = await this.supabase.channel(channel).send({
          type: "broadcast",
          event: event._tag,
          payload: event,
        });
        if (response === "error" || response === "timed out") {
          throw new Error(`Broadcast failed: ${response}`);
        }
      },
      catch: (error) => new ApplicationError({ operation: "EventBus.publish", cause: error }),
    });
  }

  subscribe<T extends IDomainEvent>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, never>
  ) {
    return Effect.try({
      try: () => {
        const channel = `domain-events-${eventTag.toLowerCase()}`;
        const subscription = this.supabase
          .channel(channel)
          .on("broadcast", { event: eventTag }, (payload) => {
            // Run handler asynchronously without blocking
            Effect.runFork(handler(payload.payload as T));
          })
          .subscribe();

        return {
          unsubscribe: () => {
            subscription.unsubscribe();
          },
        };
      },
      catch: (error) => new ApplicationError({ operation: "EventBus.subscribe", cause: error }),
    });
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
import { Layer } from "effect";
import { EventBusPortTag } from "@mirai-app/use-cases/shared/ports/EventBusPort";
import { SupabaseRealtimeEventBusGateway } from "@mirai-app/adapters/shared/gateways/SupabaseRealtimeEventBusGateway";

export const makeEventBusLayer = (supabase: SupabaseClient) =>
  Layer.succeed(
    EventBusPortTag,
    new SupabaseRealtimeEventBusGateway(supabase)
  );
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

### To Replace Supabase Realtime with Redis:

1. Create new gateway:

```typescript
// packages/adapters/src/shared/gateways/RedisEventBusGateway.ts
export class RedisEventBusGateway implements IEventBusPort {
  constructor(private readonly redis: RedisClient) {}
  
  publish<T extends IDomainEvent>(event: T) {
    return Effect.tryPromise({
      try: () => this.redis.publish(`events:${event._tag}`, JSON.stringify(event)),
      catch: (error) => new ApplicationError({ operation: "Redis.publish", cause: error }),
    });
  }
  
  subscribe<T extends IDomainEvent>(eventTag: string, handler: (event: T) => Effect.Effect<void, never, never>) {
    return Effect.try({
      try: () => {
        const subscriber = this.redis.duplicate();
        subscriber.subscribe(`events:${eventTag}`);
        subscriber.on("message", (_, message) => {
          const event = JSON.parse(message) as T;
          Effect.runFork(handler(event));
        });
        return { unsubscribe: () => subscriber.unsubscribe() };
      },
      catch: (error) => new ApplicationError({ operation: "Redis.subscribe", cause: error }),
    });
  }
}
```

2. Change DI wiring:

```typescript
// packages/frameworks/src/di/layer/service.ts
export const makeEventBusLayer = (redis: RedisClient) =>
  Layer.succeed(EventBusPortTag, new RedisEventBusGateway(redis));
```

No changes needed in use cases or handlers.

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
describe("[INTEGRATION] SupabaseRealtimeEventBus", () => {
  it("publishes and receives events", async () => {
    const events: IDomainEvent[] = [];
    const eventBus = new SupabaseRealtimeEventBusGateway(supabase);
    
    const sub = await Effect.runPromise(
      eventBus.subscribe("TestEvent", (e) => Effect.sync(() => events.push(e)))
    );
    
    const event = new TestEvent({ aggregateId: "123" });
    await Effect.runPromise(eventBus.publish(event));
    
    await new Promise((r) => setTimeout(r, 100));
    expect(events).toHaveLength(1);
    
    sub.unsubscribe();
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

- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Effect Documentation: https://effect.website/docs
- Expo Push Notifications: https://docs.expo.dev/push-notifications/sending-notifications/
- Clean Architecture: Robert C. Martin, Chapter 21 (Event Sourcing)
