# Platform-Agnostic Notification Architecture Design

## Overview

Eliminate the `notification-sender` microservice and Supabase Realtime dependency by unifying notification creation and delivery within the `backend-server` using an in-process event-driven architecture.

## Architecture Overview

**The Core Change:** The `notification-sender` microservice disappears. Instead, the `backend-server` becomes the single source of notification orchestration using an in-process event bus.

**Why Event-Driven Within Process?**

- **Eliminates Supabase Realtime** - No more external WebSocket dependency for database changes
- **Synchronous boundary, asynchronous execution** - API returns fast, delivery runs async in the same process
- **Simpler deployment** - One less service to run, monitor, and scale
- **Database-agnostic** - Events flow through code, not database triggers

**The New Flow:**

1. Admin calls `CreateNotification` use case
2. Use case persists notification to database
3. Use case emits `NotificationCreated` event via in-process event emitter
4. `SendMobileNotifications` handler listens and executes
5. Handler updates delivery status via use cases
6. WebSocket layer (new) pushes real-time updates to connected clients

**Key Components:**

- **EventBus** - Typed, in-process pub/sub (interface-based for testability)
- **CreateNotification** - Enhanced to emit events after persistence
- **SendMobileNotifications** - Becomes an event handler, not a tRPC endpoint
- **WebSocketGateway** - New adapter for real-time client communication
- **NotificationStream** - Optional: clients subscribe to notification channels

## EventBus Interface & Component Interactions

### The EventBus Interface (Domain Layer)

```typescript
// packages/domain/src/ports/EventBus.ts
export interface EventBus {
  publish<T extends DomainEvent>(event: T): void;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
  ): Unsubscribe;
}

export interface DomainEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly aggregateId: string;
}

export type EventHandler<T> = (event: T) => void | Promise<void>;
export type Unsubscribe = () => void;
```

### Domain Event: NotificationCreated

```typescript
// packages/domain/src/events/NotificationCreated.ts
export class NotificationCreated implements DomainEvent {
  readonly type = "NotificationCreated";
  constructor(
    readonly timestamp: Date,
    readonly aggregateId: string,
    readonly notification: Notification,
    readonly tripId: string | null,
  ) {}
}
```

### Port Interface: PushNotificationPort

```typescript
export interface PushNotificationPort {
  send(tokens: string[], notification: Notification): Promise<PushResult>;
}
```

### Component Interaction Flow

1. **CreateNotification Use Case** (Use Cases layer)
   - Persists notification via repository
   - Calls `eventBus.publish(new NotificationCreated(...))`
   - Returns DTO immediately

2. **EventBus Adapter** (Adapters layer)
   - Implements `EventBus` interface
   - Maintains in-memory Map of handlers
   - Runs handlers asynchronously

3. **NotificationCreated Handler** (Adapters layer - orchestrates use cases)
   - Subscribes to `NotificationCreated` on startup
   - Calls `TrackDeliveryStartUseCase.execute()`
   - Calls `SendPushNotificationsUseCase.execute()` with dependencies injected
   - Calls `TrackDeliveryCompleteUseCase.execute()` or `TrackDeliveryFailureUseCase.execute()`

4. **SendPushNotificationsUseCase** (Use Cases layer)
   - Depends on `PushNotificationPort` (interface, not implementation)
   - Fetches target users via `PushSubscriptionRepository`
   - Calls `pushNotificationPort.send(tokens, notification)`
   - Returns delivery results

5. **ExpoPushNotificationAdapter** (Adapters layer)
   - Implements `PushNotificationPort`
   - Wraps Expo SDK calls with error handling
   - Returns standardized results

6. **WebSocketGateway** (Adapters layer - NEW)
   - Subscribes to `NotificationCreated`
   - Broadcasts to connected clients by `tripId`
   - Clients receive real-time updates without polling

### Eliminated Components

- `notificationSenderRouter` in tRPC - no longer needed
- `PrismaNotificationSenderService` - replaced by use cases
- `notification-sender` microservice - entire app removed

## Error Handling & Data Flow

### Error Handling Strategy

The event-driven architecture requires careful error handling at three levels:

**1. Event Publication (Synchronous)**

- `CreateNotification` publishes event before returning
- Publication never fails - just adds to handler queue
- If use case fails, no event published (transactional consistency)

**2. Handler Execution (Asynchronous)**

- Each handler wraps execution in try/catch
- Handler failures don't affect other handlers
- Failed handlers log errors but don't crash the process

**3. Use Case Failure Recovery**

- `TrackDeliveryStartUseCase`: Logs failure, continues to send
- `SendPushNotificationsUseCase`: Partial failures tracked per-token
- `TrackDeliveryCompleteUseCase`: Best-effort tracking

### Data Flow Diagram

```
                    Client Request
                           |
                           ▼
              CreateNotification Use Case
              1. Validate input
              2. Persist to NotificationRepository
              3. eventBus.publish(NotificationCreated)
              4. Return NotificationDTO
                           |
                           ▼ (async, non-blocking)
              NotificationCreated Handler
              +-------------------------------+
              | TrackDeliveryStartUseCase     |
              | → Update NotificationDelivery |
              +---------------|---------------+
                              |
                              ▼
              +-------------------------------+
              | SendPushNotificationsUseCase  |
              | → PushSubscriptionRepository|
              | → PushNotificationPort.send()|
              | → NotificationPushRepository|
              +---------------|---------------+
                              |
                              ▼
              +-------------------------------+
              | TrackDeliveryCompleteUseCase  |
              | → Update NotificationDelivery|
              +-------------------------------+
```

## Testing Strategy

### Test Pyramid by Component

| Component                    | Test Type          | Approach                                      |
| ---------------------------- | ------------------ | --------------------------------------------- |
| EventBus                     | Unit               | Mock implementation, verify publish/subscribe |
| NotificationCreated          | Unit               | Assert event structure                        |
| CreateNotification           | Unit + Integration | Mock EventBus, verify publish called          |
| NotificationCreated Handler  | Integration        | Real EventBus, mocked use cases               |
| SendPushNotificationsUseCase | Unit               | Mock PushNotificationPort                     |
| ExpoPushNotificationAdapter  | Integration        | Wrap actual Expo SDK with test tokens         |
| WebSocketGateway             | Unit               | Mock EventBus, verify broadcast               |

### Key Test Patterns

**EventBus Mock:**

```typescript
class MockEventBus implements EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private published: DomainEvent[] = [];

  publish<T>(event: T): void {
    this.published.push(event as DomainEvent);
    const handlers = this.handlers.get(event.type) || [];
    handlers.forEach((h) => h(event as T));
  }

  subscribe<T>(type: string, handler: EventHandler<T>): Unsubscribe {
    // ...
  }

  getPublished(): DomainEvent[] {
    return this.published;
  }
}
```

**Handler Test:**

```typescript
it("handles NotificationCreated and sends push notifications", async () => {
  const handler = new NotificationCreatedHandler({
    trackStart: mockTrackStartUseCase,
    sendPush: mockSendPushUseCase,
    trackComplete: mockTrackCompleteUseCase,
  });

  eventBus.subscribe("NotificationCreated", handler.handle.bind(handler));

  await createNotificationUseCase.execute(input);

  expect(mockSendPushUseCase.execute).toHaveBeenCalledWith(
    expect.objectContaining({ notificationId: expect.any(String) }),
  );
});
```

### Coverage Requirements

- Domain events: 100%
- Use cases: 90%+
- Adapters: 80%+ (integration tests for external SDKs)

## Implementation Phases

### Phase 1: Foundation

- Create `EventBus` port interface in domain
- Create `NotificationCreated` domain event
- Implement `InMemoryEventBus` adapter
- Add EventBus to DI container

### Phase 2: Use Cases

- Extract `TrackDeliveryStartUseCase` from existing service
- Create `SendPushNotificationsUseCase` with `PushNotificationPort`
- Create `TrackDeliveryCompleteUseCase` and `TrackDeliveryFailureUseCase`
- Update `CreateNotification` to publish event

### Phase 3: Handler & Adapter

- Create `NotificationCreatedHandler` that orchestrates use cases
- Create `ExpoPushNotificationAdapter` implementing `PushNotificationPort`
- Wire handler to EventBus on application startup
- Remove `notificationSenderRouter` from tRPC

### Phase 4: Migration & Cleanup

- Deprecate `notification-sender` app
- Update deployment configs
- Remove `notification-sender` from monorepo

### Phase 5: WebSocket (Optional)

- Add WebSocket gateway for real-time client updates
- Subscribe gateway to `NotificationCreated` events

## Benefits

1. **Platform-agnostic** - No Supabase Realtime dependency
2. **Simpler deployment** - One less microservice
3. **Faster delivery** - No network hop between create and send
4. **Better testability** - Interface-based dependencies
5. **Extensible** - Easy to add new event types and handlers

## Risks & Mitigations

| Risk                          | Mitigation                                                         |
| ----------------------------- | ------------------------------------------------------------------ |
| Single point of failure       | Handler errors don't crash app; add external queue later if needed |
| Memory pressure from EventBus | Cap handler queue; add backpressure                                |
| Lost events on crash          | Add outbox pattern later if durability required                    |
| Harder to scale horizontally  | Extract to Redis/RabbitMQ when scale requires                      |

## Files to Create/Modify

### New Files

- `packages/domain/src/ports/EventBus.ts`
- `packages/domain/src/events/NotificationCreated.ts`
- `packages/adapters/src/event-bus/InMemoryEventBus.ts`
- `packages/use-cases/src/interactors/SendPushNotifications.ts`
- `packages/use-cases/src/interactors/TrackDeliveryStart.ts`
- `packages/use-cases/src/interactors/TrackDeliveryComplete.ts`
- `packages/use-cases/src/interactors/TrackDeliveryFailure.ts`
- `packages/adapters/src/handlers/NotificationCreatedHandler.ts`
- `packages/adapters/src/gateways/ExpoPushNotificationAdapter.ts`

### Modified Files

- `packages/domain/src/index.ts` (export EventBus, events)
- `packages/use-cases/src/interactors/CreateNotification.ts` (add event publishing)
- `packages/adapters/src/api/routers/notificationSender.ts` (remove)
- `apps/backend-server/src/container.ts` (register EventBus, handlers)
- `apps/backend-server/src/index.ts` (start handlers)

### Deleted Files

- `apps/notification-sender/` (entire app)

---

**Decision validated through collaborative design process.**
**Date:** 2026-04-10
