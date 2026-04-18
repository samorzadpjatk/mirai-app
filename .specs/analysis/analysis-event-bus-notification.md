# Analysis: Event Bus Integration for Notifications

## Executive Summary

This analysis identifies the files, interfaces, and integration points required to implement an event bus architecture for integrating notification-sender functionality into the Clean Architecture backend. The implementation will use Supabase Realtime as the transport layer with a swappable abstraction (IEventBusPort) for future flexibility.

---

## Affected Files

### Files to Create

#### Domain Layer (`packages/domain/src/`)
| File | Purpose |
|------|---------|
| `shared/events/DomainEvent.ts` | IDomainEvent interface - base for all domain events |
| `shared/events/EventBusPort.ts` | IEventBusPort interface - publish/subscribe contract |
| `shared/events/EventHandler.ts` | IEventHandler<T> interface - handler contract |
| `notification/events/NotificationCreated.ts` | NotificationCreated event class |

#### Use Cases Layer (`packages/use-cases/src/`)
| File | Purpose |
|------|---------|
| `shared/ports/EventBusPort.ts` | EventBusTag Context.Tag for Effect DI |
| `notification/handlers/NotificationSendHandler.ts` | Event handler for NotificationCreated events |
| `notification/interactors/CreateNotificationUseCase.ts` | New use case or modification to publish events |

#### Adapters Layer (`packages/adapters/src/`)
| File | Purpose |
|------|---------|
| `shared/gateways/SupabaseRealtimeEventBusGateway.ts` | IEventBusPort implementation using Supabase Realtime |

#### Frameworks Layer (`packages/frameworks/src/`)
| File | Purpose |
|------|---------|
| `di/layer/event-bus.ts` | (Optional) Separate file for EventBus layer composition |

#### Backend Server (`apps/backend-server/src/`)
| File | Purpose |
|------|---------|
| `index.ts` | Server startup with event handler initialization |
| `handlers/notification-handlers.ts` | Handler registration and initialization |

### Files to Modify

#### Domain Layer
| File | Change |
|------|--------|
| `shared/events/index.ts` | Export new event interfaces |
| `domain/src/index.ts` | Export event-related types |

#### Use Cases Layer
| File | Change |
|------|--------|
| `shared/ports/index.ts` | Export EventBusTag |
| `use-cases/src/index.ts` | Export event-related ports |
| `notification/interactors/SendNotificationToGroup.ts` | Add EventBusTag.publish() call after DB write |
| `notification/interactors/SendNotificationToAll.ts` | Add EventBusTag.publish() call after DB write |
| `notification/interactors/SendCustomToGroup.ts` | Add EventBusTag.publish() call after DB write |
| `notification/interactors/index.ts` | Export new handler and any new use cases |

#### Adapters Layer
| File | Change |
|------|--------|
| `adapters/src/index.ts` | Export SupabaseRealtimeEventBusGateway |

#### Frameworks Layer
| File | Change |
|------|--------|
| `frameworks/src/di/layer/service.ts` | Add EventBusTag to makeServiceLayer |
| `frameworks/src/di/layer/app.ts` | Include EventBus layer in makeAppLayer |
| `frameworks/src/di/index.ts` | Export EventBusTag and IEventBusPort |

---

## Key Interfaces

### 1. IDomainEvent (New)

```typescript
// packages/domain/src/shared/events/DomainEvent.ts
export interface IDomainEvent {
  readonly _tag: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}
```

**Rationale:** Base interface for all domain events. Immutable facts about things that happened.

### 2. IEventBusPort (New)

```typescript
// packages/domain/src/shared/events/EventBusPort.ts
import type { Effect } from "effect";
import type { IPortError } from "../errors/ports";
import type { IDomainEvent } from "./DomainEvent";

export interface IEventBusPort {
  publish<T extends IDomainEvent>(
    event: T
  ): Effect.Effect<void, IPortError, never>;

  subscribe<T extends IDomainEvent>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, never>
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never>;
}
```

**Rationale:** Transport-agnostic event bus interface enabling swappable implementations (Supabase Realtime, Redis, PostgreSQL).

### 3. IEventHandler<T> (New)

```typescript
// packages/domain/src/shared/events/EventHandler.ts
import type { Effect } from "effect";
import type { IDomainEvent } from "./DomainEvent";

export interface IEventHandler<T extends IDomainEvent> {
  readonly eventTag: string;
  handle(event: T): Effect.Effect<void, never, never>;
}
```

**Rationale:** Standardized interface for event handlers, enabling consistent handler registration and testing.

### 4. NotificationCreated Event (New)

```typescript
// packages/domain/src/notification/events/NotificationCreated.ts
import type { IDomainEvent } from "../../shared/events/DomainEvent";
import type { NotificationId } from "../value-objects/NotificationId";
import type { TripId } from "../../trip/value-objects/TripId";

export class NotificationCreated implements IDomainEvent {
  readonly _tag = "NotificationCreated";
  readonly version = 1;

  constructor(
    readonly aggregateId: NotificationId,
    readonly tripId: TripId | null,
    readonly title: string,
    readonly body: string,
    readonly url: string,
    readonly userIds: string[],  // Target recipients
    readonly occurredAt: Date
  ) {}
}
```

**Rationale:** Immutable event representing notification creation. Contains all data needed for async push delivery.

### 5. EventBusTag Context.Tag (New)

```typescript
// packages/use-cases/src/shared/ports/EventBusPort.ts
import { Context } from "effect";
import type { IEventBusPort } from "@mirai-app/domain";

export class EventBusTag extends Context.Tag("EventBus")<
  EventBusTag,
  IEventBusPort
>() {}
```

**Rationale:** Effect Context.Tag for dependency injection, following established pattern (AuthPortTag, StoragePortTag, RealtimePortTag).

---

## Integration Points

### 1. Use Case Integration

**Current Pattern (SendNotificationToGroup):**
```typescript
export class SendNotificationToGroupUseCase {
  execute(input: SendNotificationToGroupInput) {
    return Effect.gen(function* () {
      const notificationService = yield* NotificationServicePortTag;
      const result = yield* notificationService.sendNotification({...});
      return result;
    });
  }
}
```

**New Pattern (with Event Bus):**
```typescript
export class SendNotificationToGroupUseCase {
  execute(input: SendNotificationToGroupInput) {
    return Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;
      const eventBus = yield* EventBusTag;
      
      // 1. Save to database
      const notification = yield* notificationPort.create({...});
      
      // 2. Publish event (async notification sending)
      yield* eventBus.publish(new NotificationCreated(
        notification.id,
        input.tripId,
        input.title,
        input.body,
        input.url,
        userIds,
        new Date()
      ));
      
      // 3. Return immediately (fast response)
      return { id: notification.id, success: true, recipientCount: userIds.length };
    });
  }
}
```

**Integration Point:** Use cases will need to:
1. Yield `EventBusTag` to get the event bus
2. Publish `NotificationCreated` event after DB write
3. Return DTO immediately (no waiting for push delivery)

### 2. Event Handler Integration

**NotificationSendHandler:**
```typescript
// packages/use-cases/src/notification/handlers/NotificationSendHandler.ts
export class NotificationSendHandler implements IEventHandler<NotificationCreated> {
  readonly eventTag = "NotificationCreated";
  
  handle(event: NotificationCreated) {
    return Effect.gen(function* () {
      const pushSubscriptionPort = yield* PushSubscriptionPortTag;
      const notificationServicePort = yield* NotificationServicePortTag;
      const deliveryPort = yield* NotificationDeliveryPortTag;
      
      // 1. Fetch push subscriptions for target users
      const subscriptions = yield* pushSubscriptionPort.findByUserIds(event.userIds);
      
      // 2. Track delivery start
      yield* deliveryPort.startDelivery(event.aggregateId);
      
      // 3. Send push notifications via Expo
      const results = yield* Effect.all(
        subscriptions.map(sub => 
          notificationServicePort.sendPushToSubscription(sub, event)
        ),
        { mode: "either" }  // Continue on individual failures
      );
      
      // 4. Track delivery completion
      yield* deliveryPort.completeDelivery(event.aggregateId, results);
      
    }).pipe(
      Effect.catchAll((error) => 
        Effect.gen(function* () {
          // Log error, mark delivery as failed
          yield* deliveryPort.failDelivery(event.aggregateId, error);
        })
      )
    );
  }
}
```

**Integration Point:** Handler must be:
1. Registered at server startup
2. Subscribed to `NotificationCreated` events via EventBus
3. Run in background (non-blocking to HTTP response)

### 3. DI Wiring Integration

**Current (packages/frameworks/src/di/layer/service.ts):**
```typescript
export const makeServiceLayer = (config: ServiceLayerConfig) => {
  const authLayer = Layer.succeed(AuthPortTag, new SupabaseAuthGateway(config.supabase));
  const storageLayer = Layer.succeed(StoragePortTag, new SupabaseStorageGateway(config.supabase));
  const realtimeLayer = Layer.succeed(RealtimePortTag, new SupabaseRealtimeGateway(config.supabase));
  
  return Layer.mergeAll(authLayer, storageLayer, realtimeLayer);
};
```

**New (add EventBus layer):**
```typescript
export const makeServiceLayer = (config: ServiceLayerConfig) => {
  const authLayer = Layer.succeed(AuthPortTag, new SupabaseAuthGateway(config.supabase));
  const storageLayer = Layer.succeed(StoragePortTag, new SupabaseStorageGateway(config.supabase));
  const realtimeLayer = Layer.succeed(RealtimePortTag, new SupabaseRealtimeGateway(config.supabase));
  const eventBusLayer = Layer.succeed(EventBusTag, new SupabaseRealtimeEventBusGateway(config.supabase));
  
  return Layer.mergeAll(authLayer, storageLayer, realtimeLayer, eventBusLayer);
};
```

**Integration Point:**
- `EventBusTag` must be added to `makeServiceLayer`
- `SupabaseRealtimeEventBusGateway` needs SupabaseClient

### 4. Server Startup Integration

**Required (apps/backend-server/src/index.ts):**
```typescript
import { Effect } from "effect";
import { makeAppLayer } from "@mirai-app/frameworks/di";
import { NotificationSendHandler } from "@mirai-app/use-cases/notification/handlers/NotificationSendHandler";
import { EventBusTag } from "@mirai-app/use-cases/shared/ports/EventBusPort";

async function main() {
  // 1. Create database connection
  const db = createDrizzleClient();
  
  // 2. Create Supabase client
  const supabase = createSupabaseClient();
  
  // 3. Build Effect layers
  const appLayer = makeAppLayer({ db, supabase });
  
  // 4. Initialize event handlers
  const handler = new NotificationSendHandler();
  
  const subscribeProgram = Effect.gen(function* () {
    const eventBus = yield* EventBusTag;
    return yield* eventBus.subscribe("NotificationCreated", (event) => 
      handler.handle(event as NotificationCreated)
    );
  });
  
  const { unsubscribe } = await Effect.runPromise(
    subscribeProgram.pipe(Effect.provide(appLayer))
  );
  
  // 5. Start HTTP server
  startGraphQLServer(appLayer);
  
  // 6. Cleanup on shutdown
  process.on("SIGTERM", () => {
    unsubscribe();
    // ... other cleanup
  });
}

main();
```

**Integration Point:**
- Backend server needs startup file
- Event handler subscription must happen before accepting requests
- Cleanup (unsubscribe) on server shutdown

---

## Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Event handler not initialized before first event** | Events lost, notifications not sent | Initialize handlers before starting HTTP server; add health check |
| **Event publish fails during use case** | Notification created but no push sent | Fail use case if publish fails (transaction semantics); retry logic |
| **Realtime connection instability** | Events lost, delayed notifications | Implement reconnection with backoff; buffer events during reconnection |
| **Backend server crash during async send** | Push notifications incomplete | Track delivery state in DB; retry failed deliveries on restart |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Event ordering** | Notifications sent out of order | Supabase Realtime guarantees ordering; document this assumption |
| **Concurrent event handling** | Race conditions in delivery tracking | Use database transactions; idempotent delivery tracking |
| **Testing complexity** | Async flow hard to test | Provide in-memory EventBus for tests; use Effect.provide for mocking |
| **Memory leaks** | Unsubscribe not called on shutdown | Always call unsubscribe in cleanup; use Effect's resource management |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Type safety** | Runtime type errors | Effect provides compile-time type safety; IDomainEvent interface |
| **Clean Architecture violations** | Tight coupling | Follow established patterns; interfaces in domain, implementation in adapters |
| **Performance degradation** | Slow event processing | Handler runs async; monitor metrics |

---

## Implementation Strategy

### Phase 1: Core Domain Infrastructure (Day 1)
1. Create `packages/domain/src/shared/events/` directory
2. Implement IDomainEvent, IEventBusPort, IEventHandler interfaces
3. Create NotificationCreated event class
4. Add barrel exports

### Phase 2: Supabase Realtime Gateway (Day 1-2)
1. Create `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts`
2. Implement IEventBusPort using Supabase Realtime
3. Handle reconnection logic
4. Add to adapters index exports

### Phase 3: Use Cases Layer (Day 2)
1. Create EventBusTag Context.Tag
2. Create NotificationSendHandler
3. Modify SendNotificationToGroup to publish events
4. Add barrel exports

### Phase 4: DI Wiring (Day 2-3)
1. Add EventBusTag to makeServiceLayer
2. Update makeAppLayer to include EventBus
3. Export EventBusTag from frameworks/di

### Phase 5: Backend Server (Day 3)
1. Create apps/backend-server/src/index.ts
2. Implement handler initialization
3. Add graceful shutdown with unsubscribe
4. Add health check endpoint

### Phase 6: Testing (Day 3-4)
1. Unit tests for domain events
2. Unit tests for handler with mocked dependencies
3. Integration test for full flow
4. Load test for concurrent notifications

---

## Follow-up Tasks

1. **Create specification files** for each phase using `/sdd:add-task`
2. **Define test cases** for notification event bus integration
3. **Document metrics** (events processed, latency, failure rate)
4. **Plan rollout** (parallel with notification-sender, then disable)
5. **Create runbook** for monitoring and alerting

---

## References

- Design Document: `.specs/plans/event-bus-notification-architecture.design.md`
- Task File: `.specs/tasks/draft/integrate-notification-sender-event-bus.feature.md`
- Domain Layer Guide: `packages/domain/AGENTS.md`
- Use Cases Layer Guide: `packages/use-cases/AGENTS.md`
- Adapters Layer Guide: `packages/adapters/AGENTS.md`
- Frameworks Layer Guide: `packages/frameworks/AGENTS.md`
- Root AGENTS.md: `AGENTS.md` (Effect patterns, testing, DI)

---

**Analysis Completed:** 2026-04-18
**Analyst:** Codebase Analysis Agent
**Version:** 1.0.0
