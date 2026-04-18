# Event Bus Architecture for Async Notifications

## Overview

Integrate notification-sender functionality into the backend-server using a pluggable event bus architecture. Eliminates the separate notification-sender microservice while maintaining asynchronous notification delivery.

**Key Decision:** Start with Supabase Realtime, make transport swappable (Redis/PostgreSQL possible future replacements).

## Goals

1. **Fast API responses**: Return HTTP response immediately after DB write (no waiting for notification delivery)
2. **Async notification delivery**: Send push notifications in background
3. **Clean Architecture compliance**: Event bus abstraction in domain, transport-agnostic
4. **Swappable transport**: Can replace Supabase Realtime with Redis/PostgreSQL later
5. **Eliminate microservice**: Merge notification-sender into backend-server

## Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Frameworks Layer                                            │
│  - DI wiring (EventBusTag → SupabaseRealtimeEventBus)      │
│  - Server startup (initialize handlers)                      │
├─────────────────────────────────────────────────────────────┤
│  Adapters Layer                                              │
│  - SupabaseRealtimeEventBusGateway (implements IEventBusPort)│
│  - NotificationServiceGateway (Expo push notifications)      │
│  - Future: RedisEventBusGateway, PostgresNotifyGateway       │
├─────────────────────────────────────────────────────────────┤
│  Use Cases Layer                                             │
│  - EventBusTag (Context.Tag for DI)                          │
│  - CreateNotificationUseCase (publishes event, returns fast) │
│  - NotificationSendHandler (subscribes, sends notifications) │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer                                                │
│  - IDomainEvent interface                                    │
│  - IEventBusPort interface (publish/subscribe)                 │
│  - IEventHandler<T> interface                                │
│  - NotificationCreated event                                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Create Notification Flow:**

1. **Client** → GraphQL Mutation: `createNotification`
2. **Resolver** → `CreateNotificationUseCase.execute()`
3. **Use Case**:
   - Validate input via domain entity
   - Call `NotificationPort.create()` (save to DB)
   - Publish `NotificationCreated` event via `EventBusTag.publish()`
   - **Return DTO immediately** (~50ms response time)
4. **Event Handler** (background, async):
   - `NotificationSendHandler` receives `NotificationCreated`
   - Fetch `PushSubscription`s via `PushSubscriptionPort`
   - Send push notifications via `NotificationServicePort`
   - Track delivery via `NotificationDeliveryPort`
   - Handle retries with exponential backoff

**Timing:**
- HTTP response: 50-100ms (DB write only)
- Notification delivery: 1-5 seconds (background, non-blocking)

## Domain Interfaces

### IDomainEvent

Base interface for all domain events. Immutable facts about things that happened.

```typescript
export interface IDomainEvent {
  readonly _tag: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}
```

### IEventBusPort

Transport-agnostic event bus interface.

```typescript
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

### IEventHandler<T>

Interface for event handlers.

```typescript
export interface IEventHandler<T extends IDomainEvent> {
  readonly eventTag: string;
  handle(event: T): Effect.Effect<void, never, never>;
}
```

### NotificationCreated Event

```typescript
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

## Implementation Phases

### Phase 1: Core Domain Infrastructure (Day 1)

**Files to create:**
- `packages/domain/src/shared/events/DomainEvent.ts` - IDomainEvent interface
- `packages/domain/src/shared/events/EventBusPort.ts` - IEventBusPort interface
- `packages/domain/src/shared/events/EventHandler.ts` - IEventHandler interface
- `packages/domain/src/notification/events/NotificationCreated.ts` - Event class

**Key decisions:**
- Events are immutable value objects (no methods, just data)
- Use branded IDs for type safety
- Include `version` for future event versioning

### Phase 2: Supabase Realtime Gateway (Day 1-2)

**Files to create:**
- `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts`
- `packages/use-cases/src/shared/ports/EventBusPort.ts` - Context.Tag

**Implementation notes:**
- `publish()` uses Supabase Realtime `broadcast()`
- `subscribe()` uses Supabase Realtime `on()` with channel subscription
- Run subscription setup in server startup
- Handle reconnection logic

### Phase 3: Notification Send Handler (Day 2)

**Files to create/modify:**
- `packages/use-cases/src/notification/handlers/NotificationSendHandler.ts`
- `packages/use-cases/src/notification/interactors/CreateNotificationUseCase.ts` (add event publish)

**Handler logic:**
1. Receive `NotificationCreated` event
2. Fetch push subscriptions for target users
3. Create notification content (apply templates if needed)
4. Send via Expo Push Notification API
5. Track delivery status (success/failure per recipient)
6. Retry failed sends with exponential backoff (max 3 attempts)

### Phase 4: DI Wiring and Startup (Day 3)

**Files to modify:**
- `packages/frameworks/src/di/layer/app.ts` - Add EventBus layer
- `packages/frameworks/src/di/layer/service.ts` - Add EventBus gateway
- `apps/backend-server/src/index.ts` or appropriate startup file - Initialize handlers

**Startup sequence:**
1. Create database connection
2. Create Supabase client
3. Build Effect layers (include EventBus)
4. Start event handlers (subscribe to channels)
5. Start HTTP server

### Phase 5: Testing and Validation (Day 3-4)

**Test strategy:**
- Unit tests for domain events and EventBus port
- Integration test: Create notification, verify event published
- Integration test: Event received, verify notification sent
- Load test: Many notifications created, verify async handling

**Cleanup (optional, Phase 6):**
- Remove `apps/notification-sender/` directory
- Remove `packages/trpc/src/api/routers/notificationSender.ts`
- Update deployment configs

## Error Handling

**Event Publish Failure:**
- If `publish()` fails during use case execution → Return error to client
- Notification is NOT created (transaction semantics)

**Notification Send Failure:**
- Expo API failure → Retry with exponential backoff (1s, 2s, 4s)
- Max 3 attempts → Mark as failed in `notification_delivery` table
- Failed deliveries visible in admin dashboard for retry

**Realtime Connection Failure:**
- Auto-reconnect with backoff
- Buffer events during reconnection (optional, Phase 2+ enhancement)
- Log connection status changes

## Transport Swapping Strategy

The `IEventBusPort` abstraction enables future transport changes without touching business logic:

**Current:** `SupabaseRealtimeEventBusGateway`
**Future options:**
- `RedisPubSubEventBusGateway` - Use Redis Pub/Sub
- `PostgresNotifyEventBusGateway` - Use Postgres LISTEN/NOTIFY
- `BullEventBusGateway` - Use Bull/BullMQ job queue with Redis

**To swap:**
1. Implement new gateway class
2. Change DI wiring: `EventBusTag` → `NewGateway`
3. No changes to use cases or handlers

## Benefits

1. **Eliminates microservice**: Simpler deployment, one less process to manage
2. **Fast API responses**: Users aren't waiting for push notification delivery
3. **Clean separation**: Event bus abstraction keeps domain pure
4. **Future-proof**: Can swap transport without touching business logic
5. **Observability**: Centralized logging of all notification events

## Migration Path

**Phase A (immediate):**
- Deploy new backend-server with integrated notification sender
- Run notification-sender in parallel (for safety)
- Monitor for issues

**Phase B (after confidence):**
- Disable notification-sender
- Remove notification-sender code
- Update deployment scripts

**Rollback:** Simply restart notification-sender microservice if issues arise.

## Open Questions

1. Should we buffer events if Realtime is disconnected? (probably yes for production)
2. Should handlers run in separate process/thread? (not initially, can add later)
3. Metrics: How many events processed, latency, failure rate?

## References

- Current notification-sender: `pjapp-main/apps/notification-sender/src/index.ts`
- Notification service: `pjapp-main/packages/trpc/src/services/notificationService.ts`
- Domain events pattern: See Effect documentation on scheduling and fibers
- Supabase Realtime: https://supabase.com/docs/guides/realtime
