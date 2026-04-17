# Notification-Sender Migration: Supabase Realtime → GraphQL Subscriptions

## Overview

Migrate the notification-sender background service from Supabase Realtime (postgres_changes) to GraphQL subscriptions via urql, eliminating the Supabase dependency and unifying the real-time architecture.

## Architecture

**Current State:**

- Notification-sender uses Supabase Realtime directly (bypassing Clean Architecture)
- WebSocket connection to Supabase for postgres_changes events
- Frontend uses GraphQL subscriptions (graphql-ws) separately

**Target State:**

- Single real-time mechanism: GraphQL subscriptions for both frontend and notification-sender
- Properly layered domain events (NotificationCreated)
- Notification-sender becomes "just another client" subscribing to domain events

## Changes Required

### 1. Domain Layer (packages/domain)

**New file: `packages/domain/src/notification/events/notification-created.ts`**

```typescript
import { Data } from "effect";

/**
 * NotificationCreated Domain Event
 *
 * Published when a new notification is created.
 * Triggers push notification delivery and other side effects.
 */
export class NotificationCreated extends Data.TaggedClass(
  "NotificationCreated",
)<{
  readonly eventId: string; // Unique event identifier
  readonly notificationId: string; // The created notification
  readonly title: string; // Notification content
  readonly body: string;
  readonly userId?: string | null; // Target user (null = broadcast)
  readonly tripId?: string | null; // Associated trip
  readonly priority: string;
  readonly createdAt: Date;
}>() {}
```

**Update: `packages/domain/src/notification/index.ts`**
Add barrel export:

```typescript
export { NotificationCreated } from "./events/notification-created";
```

**Update: `packages/domain/src/index.ts`**
Uncomment line 143 and add:

```typescript
export { NotificationCreated } from "./notification/events/notification-created";
```

### 2. Use Cases Layer (packages/use-cases)

**New file: `packages/use-cases/src/system/shared/ports/pub-sub-service.ts`**

```typescript
import type { Effect } from "effect";
import type { AnyDomainEvent, DomainEvent } from "@mirai-app/domain";
import { Context } from "effect";

export interface EventSubscription {
  unsubscribe(): Effect.Effect<void, never, never>;
}

export interface PubSubService {
  publish<TEvent extends AnyDomainEvent>(
    event: TEvent,
  ): Effect.Effect<void, never, never>;

  subscribe<TEvent extends DomainEvent>(
    eventType: TEvent["type"],
    handler: (event: TEvent) => Effect.Effect<void, never, never>,
  ): EventSubscription;
}

export class PubSubServiceTag extends Context.Tag("PubSubService")<
  PubSubServiceTag,
  PubSubService
>() {}
```

**Update: `packages/use-cases/src/notification/interactors/create.ts`**

```typescript
import { NotificationCreated } from "@mirai-app/domain";
import { PubSubServiceTag } from "../../system/shared/ports/pub-sub-service";

// Update return type to include PubSubServiceTag
export function createNotificationUseCase(
  input: CreateNotificationInput,
): Effect.Effect<
  CreateNotificationOutput,
  NotificationCreationError | NotificationRepositoryError,
  NotificationGatewayTag | PubSubServiceTag
> {
  return Effect.gen(function* () {
    const notificationRepo = yield* NotificationGatewayTag;
    const pubSub = yield* PubSubServiceTag;

    // ... existing validation and creation ...

    const saved = yield* notificationRepo
      .create(notification)
      .pipe(
        Effect.mapError(
          () => new NotificationRepositoryError({ message: "Failed" }),
        ),
      );

    // Publish domain event (fire-and-forget)
    const event = new NotificationCreated({
      eventId: crypto.randomUUID(),
      notificationId: saved.id,
      title: saved.title,
      body: saved.body,
      userId: saved.userId,
      tripId: saved.tripId,
      priority: saved.priority,
      createdAt: saved.createdAt,
    });

    yield* pubSub.publish(event).pipe(Effect.catchAll(() => Effect.void));

    return toOutput(saved);
  });
}
```

### 3. Adapters Layer (packages/adapters)

**New file: `packages/adapters/src/system/shared/services/pubsub-event-bus-adapter.ts`**

```typescript
import { Effect } from "effect";
import type { PubSubService, EventSubscription } from "@mirai-app/use-cases";
import { EventBus } from "./event-bus";
import type { AnyDomainEvent, DomainEvent } from "@mirai-app/domain";

export class PubSubEventBusAdapter implements PubSubService {
  constructor(private readonly eventBus: EventBus) {}

  publish<TEvent extends AnyDomainEvent>(
    event: TEvent,
  ): Effect.Effect<void, never, never> {
    return this.eventBus.publish(event);
  }

  subscribe<TEvent extends DomainEvent>(
    eventType: TEvent["type"],
    handler: (event: TEvent) => Effect.Effect<void, never, never>,
  ): EventSubscription {
    return this.eventBus.subscribe(eventType, (event) =>
      handler(event as TEvent),
    );
  }
}
```

**Update: `packages/adapters/src/index.ts`**

```typescript
// PubSub Service
export { PubSubEventBusAdapter } from "./system/shared/services/pubsub-event-bus-adapter";
export { type PubSubService, PubSubServiceTag } from "@mirai-app/use-cases";
```

**Update: DI Layer (`packages/frameworks/src/di/layer/service.ts`)**

```typescript
import { PubSubEventBusAdapter } from "@mirai-app/adapters";
import { PubSubServiceTag } from "@mirai-app/use-cases";
import { globalEventBus } from "@mirai-app/adapters";

// Add to makeServiceLayer
const pubSubLayer = Layer.succeed(
  PubSubServiceTag,
  new PubSubEventBusAdapter(globalEventBus),
);

// Merge with other layers
return authLayer.pipe(
  Layer.merge(storageLayer),
  Layer.merge(realtimeLayer),
  Layer.merge(pubSubLayer), // NEW
  Layer.merge(pubSubLayerForGraphQL),
);
```

### 4. Frameworks Layer - GraphQL Subscription

**Update: `packages/frameworks/src/graphql/types/notification/subscriptions.ts`**

```typescript
import { builder } from "../../builder.js";
import { NotificationType } from "./types.js";
import { globalEventBus } from "@mirai-app/adapters";
import type { NotificationCreated } from "@mirai-app/domain";
import { Effect } from "effect";

builder.subscriptionField("notificationCreated", (t) => ({
  type: NotificationType,
  subscribe: () => {
    return {
      [Symbol.asyncIterator]: () => {
        const events: NotificationCreated[] = [];
        let resolveNext:
          | ((value: IteratorResult<NotificationCreated>) => void)
          | null = null;

        const subscription = globalEventBus.subscribe(
          "NotificationCreated",
          (event) => {
            return Effect.sync(() => {
              if (resolveNext) {
                resolveNext({ value: event, done: false });
                resolveNext = null;
              } else {
                events.push(event);
              }
            });
          },
        );

        return {
          next: () => {
            if (events.length > 0) {
              return Promise.resolve({ value: events.shift()!, done: false });
            }
            return new Promise((resolve) => {
              resolveNext = resolve;
            });
          },
          return: () => {
            Effect.runSync(subscription.unsubscribe());
            return Promise.resolve({ value: undefined, done: true });
          },
        };
      },
    };
  },
  resolve: (payload: NotificationCreated) => {
    return {
      id: payload.notificationId,
      title: payload.title,
      body: payload.body,
      priority: payload.priority,
      userId: payload.userId,
      tripId: payload.tripId,
      createdAt: payload.createdAt,
      // Additional fields as needed
    };
  },
}));
```

**Update: `packages/frameworks/src/graphql/types/notification/index.ts`**

```typescript
// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./subscriptions.js"; // NEW
```

### 5. Notification-Sender Migration

**Update: `apps/notification-sender/src/index.ts`**

**Remove Supabase imports:**

```typescript
// REMOVE:
// import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
// import type { RealtimePostgresInsertPayload } from "@mirai-app/frameworks/supabase";
```

**Add GraphQL subscription:**

```typescript
import {
  NotificationCreatedDocument,
  type NotificationCreatedSubscription,
} from "@mirai-app/frameworks/graphql/urql";
```

**Update handler signature:**

```typescript
const handleNotificationCreated = (
  notificationService: NotificationService,
  notification: { id: string },
) => {
  const id = notification.id;

  if (!id) {
    return Effect.gen(function* () {
      yield* Console.error("Missing notification ID");
      return yield* Effect.fail(
        new NotificationServiceError("handleInsert", "Missing ID"),
      );
    });
  }

  // ... rest of existing logic ...
};
```

**Replace Supabase Realtime with urql subscription:**

```typescript
const notificationSenderProgram = Effect.gen(function* () {
  const env = yield* validateEnvironment;

  const urqlClient = yield* createUrqlClientEffect(
    env.GRAPHQL_ENDPOINT,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const notificationService = new NotificationService(urqlClient);

  // NEW: GraphQL subscription instead of Supabase Realtime
  const subscription = urqlClient.subscription(NotificationCreatedDocument, {});

  subscription.subscribe((result) => {
    if (result.error) {
      console.error("Subscription error:", result.error);
      return;
    }

    if (result.data?.notificationCreated) {
      const notification = result.data.notificationCreated;
      void Effect.runPromise(
        handleNotificationCreated(notificationService, {
          id: notification.id,
        }),
      );
    }
  });

  yield* Console.log(
    "Notification sender service started with GraphQL subscription",
  );

  return {
    cleanup: () =>
      Effect.gen(function* () {
        yield* Console.log("Shutting down...");
        yield* Console.log("Shutdown complete");
      }),
  };
});
```

## Workflow

1. **Implement domain event** (NotificationCreated)
2. **Create PubSubService port** in use-cases
3. **Implement PubSubEventBusAdapter** in adapters
4. **Update createNotificationUseCase** to publish event
5. **Add Pothos subscription** in frameworks
6. **Sync schema:** `bun sync-schema`
7. **Generate client:** `bun codegen`
8. **Migrate notification-sender** to use GraphQL subscription
9. **Remove Supabase dependencies** from notification-sender
10. **Test** the full flow

## Benefits

- **Single real-time mechanism** for frontend and backend services
- **Clean Architecture compliance** - proper domain events flow
- **Removes Supabase Realtime dependency** from notification-sender
- **Testable** - can mock PubSubService in tests
- **Reusable** - other services can subscribe to NotificationCreated

## Rollback Plan

If issues arise:

1. Revert notification-sender to Supabase Realtime
2. Keep GraphQL subscription available for frontend
3. Both mechanisms can coexist during transition

## Testing Checklist

- [ ] Unit tests for NotificationCreated event
- [ ] Unit tests for PubSubEventBusAdapter
- [ ] Integration test for createNotificationUseCase publishing event
- [ ] GraphQL subscription test via Playground
- [ ] Notification-sender receives events via GraphQL
- [ ] End-to-end: Create notification → sender processes → push delivered
