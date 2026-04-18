---
title: Integrate notification-sender into backend via event bus
status: draft
issue_type: feature
complexity: L
---

## Architecture Overview

### Solution Strategy

Implement a Clean Architecture-compliant event bus using Supabase Realtime as the transport layer. The architecture follows the established four-layer pattern (Domain → Use Cases → Adapters → Frameworks) with Effect-TS for type-safe, composable effects.

**Dual Implementation Strategy**:
- **Production**: SupabaseRealtimeEventBusGateway - uses Supabase Realtime for horizontal scaling and reliability
- **Testing**: InProcessEventBusGateway - synchronous, in-memory implementation for fast, deterministic tests without external dependencies

**Core Approach**:
1. **Domain Layer**: Define pure interfaces for events, event bus, and handlers
2. **Use Cases Layer**: Publish domain events after DB writes; implement handlers for async processing
3. **Adapters Layer**: Implement event bus using Supabase Realtime broadcast/ON (production) or in-memory Map (testing)
4. **Frameworks Layer**: Wire dependencies via Effect Layers; initialize handlers at startup

**Key Flow**: Client creates notification → Use case saves to DB and publishes event → Returns response immediately (<100ms) → Handler receives event asynchronously and sends push notifications (1-5s).

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Supabase Realtime as Transport** | Already used in project; zero additional infrastructure; supports broadcast with auto-reconnection. Abstraction layer (IEventBusPort) enables future swap to Redis/PostgreSQL NOTIFY without business logic changes. |
| **Effect-Based Event Bus** | Consistent with existing Effect-TS patterns; provides type safety for publish/subscribe; composable error handling with Effect.catchAll. |
| **Handler Error Isolation** | Handlers return `Effect<void, never, never>` - they catch all errors internally to prevent event bus disruption. Failed push notifications are logged and tracked but don't crash the handler. |
| **Immediate Response Pattern** | API returns after DB write + event publish; push delivery happens asynchronously. Achieves target p95 response time <100ms while maintaining reliable delivery. |
| **Startup-Time Handler Registration** | Handlers subscribe at server startup before accepting HTTP requests; prevents event loss during initialization window. |
| **Exponential Backoff Retry** | Failed Expo API calls retry 3 times with delays: 1s, 2s, 4s. Non-retryable errors (DeviceNotRegistered, InvalidCredentials) fail immediately. |
| **Dual Gateway Strategy (Production + Testing)** | SupabaseRealtimeEventBusGateway for production (horizontal scaling, reliability). InProcessEventBusGateway for testing (speed, determinism, isolation). Interface abstraction allows swappable implementations without test changes. |

### Trade-offs Considered

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Redis Pub/Sub | Industry standard, language-agnostic | New infrastructure, operational overhead | Future option via IEventBusPort |
| PostgreSQL NOTIFY | Native to DB, transactional | Complex implementation, blocking concerns | Future option via IEventBusPort |
| In-process EventEmitter (Production) | Simple, zero latency | Single instance only, no horizontal scaling | Rejected for production - need multi-instance |
| In-process EventEmitter (Testing) | Fast, deterministic, no external deps | Only for single-instance tests | **ACCEPTED for testing** via InProcessEventBusGateway |
| Separate Worker Process | Isolation, independent scaling | More infrastructure, deployment complexity | Rejected - consolidate into backend |
| Synchronous Push Delivery | Simpler error handling | API response time unacceptable (>1s) | Rejected - violates <100ms requirement |

## Components

### Event Bus Abstraction

**Domain Layer Interfaces**:

```typescript
// IDomainEvent - base for all domain events
interface IDomainEvent {
  readonly _tag: string;           // Event type discriminator
  readonly aggregateId: string;    // Entity identifier
  readonly occurredAt: Date;       // Timestamp
  readonly version: number;        // Schema version
}

// IEventBusPort - transport-agnostic event bus contract
interface IEventBusPort {
  publish<T extends IDomainEvent>(
    event: T
  ): Effect.Effect<void, IPortError, never>;
  
  subscribe<T extends IDomainEvent>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, never>
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never>;
}

// IEventHandler<T> - standardized handler interface
interface IEventHandler<T extends IDomainEvent> {
  readonly eventTag: string;
  handle(event: T): Effect.Effect<void, never, never>;
}
```

**Effect DI Tag** (Use Cases Layer):
```typescript
class EventBusTag extends Context.Tag("EventBus")<
  EventBusTag,
  IEventBusPort
>() {}
```

### Domain Events

**NotificationCreated Event**:
```typescript
class NotificationCreated implements IDomainEvent {
  readonly _tag = "NotificationCreated";
  readonly version = 1;
  
  constructor(
    readonly aggregateId: NotificationId,
    readonly tripId: TripId | null,
    readonly title: string,
    readonly body: string,
    readonly url: string,
    readonly userIds: string[],     // Target recipients
    readonly occurredAt: Date
  ) {}
}
```

Represents the immutable fact that a notification was created. Contains all data needed for async push delivery without additional DB queries.

### Event Handlers

**NotificationSendHandler**:
- Subscribes to "NotificationCreated" events
- Fetches push subscriptions for target users
- Sends push notifications via Expo API with retry logic
- Tracks delivery status in notification_delivery table
- Error isolation: catches all errors internally, logs failures

### Transport Implementation

**SupabaseRealtimeEventBusGateway**:
- Implements IEventBusPort using Supabase Realtime
- `publish()`: Broadcasts event to channel `domain-events-{eventTag}`
- `subscribe()`: Listens on broadcast channel, runs handlers via Effect.runFork (non-blocking)
- Auto-reconnection: Supabase client handles reconnection within 5 seconds
- Cleanup: Returns unsubscribe function for graceful shutdown

**InProcessEventBusGateway**:
- **Purpose**: Testing-only synchronous implementation of IEventBusPort
- **Implementation**: In-memory Map<string, Array<handler>> storing handlers by event tag
- **Characteristics**:
  - Synchronous handler invocation for deterministic test behavior
  - No external dependencies (no Supabase, no network)
  - Fresh instance per test (complete isolation)
  - Returns `Effect.void` (always succeeds, no error channel)
- **When to use**: Unit tests and integration tests via `Layer.succeed(EventBusTag, new InProcessEventBusGateway())`
- **Code Example**:
  ```typescript
  // Test setup with in-process event bus
  const testLayer = Layer.succeed(
    EventBusTag,
    new InProcessEventBusGateway()
  );

  // Handler runs synchronously during publish
  const result = await Effect.runPromise(
    program.pipe(Effect.provide(testLayer))
  );
  ```

## Data Flow

### Create Notification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                                        │
│  POST /graphql (createNotification mutation)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      USE CASE LAYER (Effect.gen)                              │
│                                                                               │
│  1. Validate input                                                            │
│  2. notificationPort.create(notification) ─────────► DB Write                 │
│  3. eventBus.publish(new NotificationCreated(...)) ─► Supabase Realtime       │
│  4. Return { id, success, recipientCount } ◄──────── Immediate Response       │
│                                                                               │
│  Total time: DB write (~20ms) + publish (~10ms) = ~30ms (target <100ms)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Async broadcast
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EVENT HANDLER (Background)                              │
│                                                                               │
│  NotificationSendHandler.handle(event):                                       │
│                                                                               │
│  1. pushSubscriptionPort.findByUserIds(event.userIds) ─► Fetch tokens         │
│  2. deliveryPort.startDelivery(event.aggregateId) ────► Track start           │
│  3. expoApi.sendPushNotifications(subscriptions, event) ─► Send push          │
│     └── Retry with exponential backoff (1s, 2s, 4s) on failure              │
│  4. deliveryPort.completeDelivery(id, results) ───────► Track completion      │
│                                                                               │
│  Total time: 1-5 seconds (acceptable for background processing)               │
│  Error handling: catchAll logs errors, marks delivery failed                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Timing Characteristics

| Phase | Timing | Responsibility |
|-------|--------|--------------|
| API Request → DB Write | ~20-50ms | Use Case (blocking) |
| Event Publish | ~5-15ms | Use Case (blocking) |
| HTTP Response | <100ms p95 | API layer |
| Event Delivery → Handler | ~10-100ms | Supabase Realtime (async) |
| Push Notification Send | 1-5 seconds | Handler (async, parallel) |

### Error Handling at Each Stage

| Stage | Error Scenario | Handling Strategy |
|-------|----------------|-------------------|
| **DB Write** | DatabaseError | Fail use case, return error to client, no event published |
| **Event Publish** | ApplicationError | Fail use case, return error to client, DB transaction semantics maintained |
| **Realtime Transport** | Connection lost | Auto-reconnect within 5s; events queued during reconnection |
| **Handler - Fetch Subscriptions** | DatabaseError | Log error, mark delivery failed, continue (don't crash bus) |
| **Handler - Expo API Call** | PushNotificationError | Retry 3x with exponential backoff; if all fail, log and mark failed |
| **Handler - Unexpected Error** | Any | catchAll at handler level, log error, server continues operating |

## Expected Changes

### New Files to Create

#### Domain Layer (`packages/domain/src/`)
| File | Lines | Purpose |
|------|-------|---------|
| `shared/events/DomainEvent.ts` | ~10 | IDomainEvent interface |
| `shared/events/EventBusPort.ts` | ~15 | IEventBusPort interface |
| `shared/events/EventHandler.ts` | ~8 | IEventHandler<T> interface |
| `notification/events/NotificationCreated.ts` | ~20 | NotificationCreated event class |
| `shared/events/index.ts` | ~5 | Barrel exports for events |

#### Use Cases Layer (`packages/use-cases/src/`)
| File | Lines | Purpose |
|------|-------|---------|
| `shared/ports/EventBusPort.ts` | ~6 | EventBusTag Context.Tag |
| `notification/handlers/NotificationSendHandler.ts` | ~60 | Event handler implementation |

#### Adapters Layer (`packages/adapters/src/`)
| File | Lines | Purpose |
|------|-------|---------|
| `shared/gateways/SupabaseRealtimeEventBusGateway.ts` | ~80 | Supabase Realtime implementation |
| `shared/gateways/InProcessEventBusGateway.ts` | ~40 | In-memory synchronous implementation for testing |

#### Testing Strategy

**Dual Gateway Strategy:**
- **Production**: `SupabaseRealtimeEventBusGateway` - uses Supabase Realtime for horizontal scaling
- **Testing**: `InProcessEventBusGateway` - synchronous, in-memory for fast, deterministic tests

Both implement `IEventBusPort` interface, enabling swappable implementations without changing business logic or tests.

#### Backend Server (`apps/backend-server/src/`)
| File | Lines | Purpose |
|------|-------|---------|
| `handlers/notification-handlers.ts` | ~25 | Handler registration |

**Total New Files**: 10 files, ~409 lines estimated (includes InProcessEventBusGateway for testing)

### Existing Files to Modify

#### Domain Layer
| File | Changes |
|------|---------|
| `packages/domain/src/index.ts` | Export event interfaces |

#### Use Cases Layer
| File | Changes |
|------|---------|
| `packages/use-cases/src/shared/ports/index.ts` | Export EventBusTag |
| `packages/use-cases/src/notification/interactors/SendNotificationToGroup.ts` | Add EventBusTag, publish event after DB write |
| `packages/use-cases/src/notification/interactors/SendNotificationToAll.ts` | Add EventBusTag, publish event after DB write |
| `packages/use-cases/src/notification/interactors/SendCustomToGroup.ts` | Add EventBusTag, publish event after DB write |
| `packages/use-cases/src/notification/interactors/index.ts` | Export NotificationSendHandler |

#### Adapters Layer
| File | Changes |
|------|---------|
| `packages/adapters/src/index.ts` | Export both SupabaseRealtimeEventBusGateway and InProcessEventBusGateway |

#### Frameworks Layer
| File | Changes |
|------|---------|
| `packages/frameworks/src/di/layer/service.ts` | Add EventBusTag to makeServiceLayer |
| `packages/frameworks/src/di/layer/app.ts` | Include EventBus layer in makeAppLayer |
| `packages/frameworks/src/di/index.ts` | Export EventBusTag |

#### Backend Server
| File | Changes |
|------|---------|
| `apps/backend-server/src/index.ts` | Initialize handlers at startup before HTTP server |

**Total Modified Files**: 10 files, ~80 lines of changes estimated

---

## Initial User Prompt

Look into notfication-sender app in pjapp-main git worktree to see, how it works, I want the current architecture to not require seperate app to send notifications, when they are being inserted into the DB - maybe implement PubSub (right now with Supabase Realtime) into Clean Architecture, so then notificatioon creation is called, sending the notification can happen independently of sending the response from the backend server

## Design Reference

See: `.specs/plans/event-bus-notification-architecture.design.md`

## Description

Integrate the notification-sender functionality directly into the backend-server using an event-driven architecture. Currently, notifications are created via the backend API, but a separate notification-sender microservice polls and delivers them. This creates unnecessary infrastructure complexity and deployment overhead.

The solution implements a Clean Architecture-compliant event bus using Supabase Realtime as the transport mechanism. When a notification is created via GraphQL mutation, the CreateNotificationUseCase will publish a NotificationCreated domain event and immediately return a response to the client—without waiting for actual notification delivery. A NotificationSendHandler subscribed to these events will asynchronously fetch push subscriptions, call the Expo push notification API, and track delivery status.

This approach eliminates the separate notification-sender service while maintaining fast API responses (< 100ms) and reliable notification delivery with retry logic. The event bus abstraction ensures the transport can be swapped (Redis, PostgreSQL NOTIFY) in the future without changing business logic.

**Scope**:
- **Included**: Event bus interfaces (IDomainEvent, IEventBusPort), Supabase Realtime gateway, NotificationCreated event, NotificationSendHandler, use case integration, DI wiring, retry logic with exponential backoff
- **Excluded**: Removing the notification-sender app (separate cleanup task), other transport implementations, separate worker processes, event persistence, metrics dashboard

**User Scenarios**:
1. **Primary Flow**: Client creates notification via API → Backend saves to DB and publishes event → Response returns immediately → Handler sends push notifications asynchronously within 1-5 seconds
2. **Error Handling**: If push notification API fails, handler retries up to 3 times with exponential backoff (1s, 2s, 4s) before marking delivery as failed

---

## Acceptance Criteria

### Functional Requirements

- [ ] **Event Bus Interfaces**: Domain layer defines IDomainEvent interface with _tag, aggregateId, occurredAt, version fields and IEventBusPort interface with publish() and subscribe() methods
  - Given: Developer views domain package shared/events directory
  - When: Inspecting interface definitions
  - Then: IDomainEvent and IEventBusPort exist with correct signatures

- [ ] **Supabase Realtime Gateway**: Adapters layer implements IEventBusPort using Supabase Realtime broadcast/ON features with auto-reconnection
  - Given: SupabaseRealtimeEventBusGateway instantiated
  - When: Calling publish() and subscribe() methods
  - Then: Events transport correctly and reconnection happens within 5 seconds of disconnection

- [ ] **NotificationCreated Event**: Domain event class containing notificationId, tripId, title, body, url, occurredAt, and version
  - Given: NotificationCreated instantiated with valid data
  - When: Inspecting event properties
  - Then: All required fields present and immutable

- [ ] **Notification Send Handler**: Subscribes to "NotificationCreated" events, fetches push subscriptions, sends via Expo API, tracks delivery in notification_delivery table
  - Given: Handler initialized and subscribed
  - When: NotificationCreated event received
  - Then: Push notifications sent to all subscribed users and delivery recorded

- [ ] **Use Case Integration**: CreateNotificationUseCase publishes NotificationCreated event after successful DB write and returns response immediately (before delivery completes)
  - Given: Client calls createNotification mutation
  - When: Use case executes
  - Then: Event published and response returned in < 100ms before delivery completes

- [ ] **DI Wiring**: EventBusTag resolves to SupabaseRealtimeEventBusGateway in DI layer, handlers initialized on server startup
  - Given: Server starts up
  - When: DI layers built
  - Then: EventBusTag resolves correctly and handlers subscribed

- [ ] **Retry Logic**: Failed Expo API calls retry with exponential backoff: 1s delay (attempt 2), 2s delay (attempt 3), 4s delay (attempt 4), max 3 retries
  - Given: Expo API call fails
  - When: Retry logic triggered
  - Then: Retries happen at correct intervals up to max 3 attempts

- [ ] **Error Isolation**: Handler failures are caught and logged, server continues operating normally
  - Given: Handler throws unexpected error
  - When: Error occurs during event processing
  - Then: Error logged, server continues, other requests unaffected

### Non-Functional Requirements

- [ ] **Performance**: Notification creation API p95 response time < 100ms (excluding DB write time)
  - Given: Load test with 100 concurrent requests
  - When: Measuring response times
  - Then: 95th percentile < 100ms

- [ ] **Reliability**: Supabase Realtime auto-reconnects within 5 seconds of disconnection
  - Given: Realtime connection drops
  - When: Monitoring connection status
  - Then: Reconnection completes within 5 seconds

### Definition of Done

- [ ] All acceptance criteria pass with unit and integration tests
- [ ] Event bus abstraction has no external dependencies (pure domain)
- [ ] Supabase Realtime gateway implements IEventBusPort contract
- [ ] NotificationSendHandler correctly processes NotificationCreated events
- [ ] CreateNotificationUseCase publishes events and returns fast
- [ ] Retry logic tested with mocked failures
- [ ] Reconnection logic verified
- [ ] Code follows existing Clean Architecture patterns
- [ ] No breaking changes to existing GraphQL schema

## Implementation Process

### Phase 1: Foundational Domain Layer

#### Step 1.1: Create Domain Event Interfaces
- **Goal**: Implement IDomainEvent, IEventBusPort, and IEventHandler interfaces in domain layer
- **Output Files**:
  - `packages/domain/src/shared/events/DomainEvent.ts` (IDomainEvent interface)
  - `packages/domain/src/shared/events/EventBusPort.ts` (IEventBusPort interface)
  - `packages/domain/src/shared/events/EventHandler.ts` (IEventHandler<T> interface)
  - `packages/domain/src/shared/events/index.ts` (barrel exports)
- **Success Criteria**:
  - [ ] Interfaces compile with `bun tsc --noEmit`
  - [ ] No external dependencies in domain files (only `effect` types, `@mirai-app/domain`)
  - [ ] Unit tests verify interface structure: `packages/domain/src/shared/events/DomainEvent.test.ts`
- **Estimated Complexity**: Small (1-2 hours)
- **Blockers**: None
- **Risks**: None
- **Parallel with**: None
- **Agent**: sdd:developer

#### Verification
- **Level**: HIGH
- **Type**: Panel (3 judges)
- **Rubric**:
  1. Design Completeness (weight: 0.30)
     - All required fields present (_tag, aggregateId, occurredAt, version for IDomainEvent; publish/subscribe for IEventBusPort)
     - 1=pmissing critical fields, 3=basic structure present, 5=comprehensive with proper types
  2. Type Safety (weight: 0.30)
     - Proper use of Effect.Effect types with correct error and requirement channels
     - 1=unsafe types or any usage, 3=basic types, 5=fully typed with Effect patterns
  3. Domain Purity (weight: 0.25)
     - No external dependencies, only `effect` types and domain imports
     - 1=external imports present, 3=minimal deps, 5=pure domain with proper abstraction
  4. Extensibility (weight: 0.15)
     - Interface supports future event types via generics or discriminated unions
     - 1=rigid design, 3=basic extension support, 5=elegant generic support

#### Step 1.2: Create NotificationCreated Event
- **Goal**: Implement NotificationCreated domain event class
- **Output Files**:
  - `packages/domain/src/notification/events/NotificationCreated.ts` (event class)
- **Success Criteria**:
  - [ ] NotificationCreated implements IDomainEvent with correct fields
  - [ ] Unit test verifies immutability and field presence: `packages/domain/src/notification/events/NotificationCreated.test.ts`
  - [ ] Barrel export added to `packages/domain/src/notification/index.ts`
- **Estimated Complexity**: Small (1 hour)
- **Blockers**: Step 1.1 (needs IDomainEvent)
- **Risks**: None
- **Parallel with**: 2.1, 3.1
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Interface Implementation (weight: 0.35)
     - Correctly implements IDomainEvent with all required fields
     - 1=missing fields, 3=basic implementation, 5=complete with proper types
  2. Data Completeness (weight: 0.30)
     - All notification data present (aggregateId, tripId, title, body, url, userIds, occurredAt)
     - 1=missing data, 3=basic fields, 5=comprehensive immutable data
  3. Immutability (weight: 0.20)
     - readonly fields, no mutation methods
     - 1=mutable, 3=partially immutable, 5=fully immutable
  4. Test Coverage (weight: 0.15)
     - Unit tests verify construction and field access
     - 1=no tests, 3=basic tests, 5=comprehensive coverage

#### Step 1.3: Export from Domain Index
- **Goal**: Export event-related types from domain package index
- **Output**: Modify `packages/domain/src/index.ts`
- **Success Criteria**:
  - [ ] `export * from "./shared/events"` added to index.ts
  - [ ] Import test passes: `import { IDomainEvent, IEventBusPort } from "@mirai-app/domain"`
- **Estimated Complexity**: Tiny (15 minutes)
- **Blockers**: Step 1.1, Step 1.2
- **Risks**: None
- **Parallel with**: 5.1, 7.2
- **Agent**: haiku

#### Verification
- **Level**: LOW
- **Type**: Per-Item
- **Rubric**:
  1. Export Presence (weight: 0.50)
     - Export statement present and syntactically correct
     - 1=missing export, 3=export present with issues, 5=clean export
  2. Import Test (weight: 0.50)
     - Can import types from @mirai-app/domain without errors
     - 1=import fails, 3=import works with issues, 5=clean import

---

### Phase 2: Transport Implementation

#### Step 2.1: Implement SupabaseRealtimeEventBusGateway
- **Goal**: Create Supabase Realtime gateway implementing IEventBusPort
- **Output Files**:
  - `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts`
  - `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.test.ts`
- **Success Criteria**:
  - [ ] Implements IEventBusPort interface correctly
  - [ ] `publish()` broadcasts events via Supabase Realtime channel
  - [ ] `subscribe()` listens on broadcast events and invokes handlers
  - [ ] Returns unsubscribe function for cleanup
  - [ ] Unit tests with mocked Supabase client verify publish/subscribe/unsubscribe
- **Subtasks**:
  1. Create gateway class with SupabaseClient dependency
  2. Implement publish() using channel.broadcast()
  3. Implement subscribe() using channel.on('broadcast')
  4. Add error handling with Effect.tryPromise
  5. Write unit tests with mocked Supabase
- **Estimated Complexity**: Medium (3-4 hours)
- **Blockers**: Step 1.1 (needs IEventBusPort)
- **Risks**:
  - **Risk**: Supabase Realtime channel API complexity
  - **Mitigation**: Reference existing SupabaseRealtimeGateway implementation for patterns
  - **Risk**: Event serialization type safety
  - **Mitigation**: Use Zod or runtime validation for event payloads
- **Parallel with**: 1.2, 3.1
- **Agent**: opus

#### Verification
- **Level**: HIGH
- **Type**: Panel (3 judges)
- **Rubric**:
  1. Contract Compliance (weight: 0.25)
     - Correctly implements IEventBusPort with publish and subscribe methods
     - 1=missing methods, 3=basic implementation, 5=full compliance with types
  2. Supabase Integration (weight: 0.30)
     - Proper use of broadcast/ON APIs with channel management
     - 1=incorrect API usage, 3=basic working, 5=optimal with error handling
  3. Cleanup Support (weight: 0.20)
     - Unsubscribe function returned and functional, channel cleanup
     - 1=no cleanup, 3=basic unsubscribe, 5=graceful cleanup with resource release
  4. Error Handling (weight: 0.25)
     - Effect.tryPromise with proper error mapping to domain errors
     - 1=unhandled errors, 3=basic catch, 5=comprehensive error types

#### Step 2.2: Export Gateway from Adapters
- **Goal**: Export SupabaseRealtimeEventBusGateway from adapters package index
- **Output**: Modify `packages/adapters/src/index.ts`
- **Success Criteria**:
  - [ ] `export { SupabaseRealtimeEventBusGateway }` added to index.ts
  - [ ] `export { InProcessEventBusGateway }` added to index.ts (when 2.3 complete)
- **Estimated Complexity**: Tiny (15 minutes)
- **Blockers**: Step 2.1
- **Risks**: None
- **Parallel with**: 5.1, 7.2, 1.3, 2.3
- **Agent**: haiku

#### Verification
- **Level**: LOW
- **Type**: Per-Item
- **Rubric**:
  1. Export Presence (weight: 0.50)
     - Export statement present and syntactically correct
     - 1=missing export, 3=export present with issues, 5=clean export
  2. Import Test (weight: 0.50)
     - Can import from @mirai-app/adapters without errors
     - 1=import fails, 3=import works with issues, 5=clean import

#### Step 2.3: Create InProcessEventBusGateway
- **Goal**: Implement synchronous event bus for testing
- **Output**: `packages/adapters/src/shared/gateways/InProcessEventBusGateway.ts`
- **Success Criteria**:
  - [ ] Implements IEventBusPort interface
  - [ ] Uses Map<string, Array<handler>> for in-memory handler storage
  - [ ] Synchronous handler invocation for deterministic test behavior
  - [ ] Returns Effect<void, never, never> (always succeeds, test-only)
  - [ ] Works with Layer.succeed(EventBusTag, new InProcessEventBusGateway())
- **Subtasks**:
  1. Create gateway class implementing IEventBusPort
  2. Implement publish() with Map-based handler lookup and sync invocation
  3. Implement subscribe() with handler registration
  4. Return unsubscribe function for cleanup
- **Estimated Complexity**: Small (45 minutes, ~40 lines)
- **Blockers**: Step 1.1 (needs IEventBusPort interface)
- **Risks**: None
- **Parallel with**: 2.2 (both can run after dependencies met; 2.3 needs 1.1, 2.2 needs 2.1)
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Interface compliance (weight: 0.30)
     - Correctly implements IEventBusPort with publish() and subscribe() methods
     - Type signatures match domain interface exactly
     - 1=missing methods or type mismatches, 3=basic implementation, 5=full compliance with correct types
  2. Synchronous invocation (weight: 0.25)
     - Handlers invoked synchronously during publish for deterministic test behavior
     - No async/await or Promise usage in invocation path
     - 1=async execution, 3=partially synchronous, 5=fully synchronous with immediate execution
  3. Test integration (weight: 0.25)
     - Works seamlessly with Layer.succeed(EventBusTag, new InProcessEventBusGateway()) pattern
     - Enables fast, deterministic unit tests without external dependencies
     - 1=integration issues, 3=basic working, 5=seamless integration with clear test examples
  4. Error handling (weight: 0.20)
     - Returns Effect<void, never, never> for predictable test behavior
     - Never throws or produces unexpected errors in test scenarios
     - 1=unhandled errors, 3=basic error handling, 5=comprehensive error handling with clear semantics

---

### Phase 3: Handler Implementation

#### Step 3.1: Create EventBusTag Context.Tag
- **Goal**: Add EventBusTag to use-cases layer for Effect DI
- **Output Files**:
  - `packages/use-cases/src/shared/ports/EventBusPort.ts`
- **Success Criteria**:
  - [ ] EventBusTag extends Context.Tag("EventBus")<EventBusTag, IEventBusPort>
  - [ ] Exported from `packages/use-cases/src/shared/ports/index.ts`
- **Estimated Complexity**: Tiny (30 minutes)
- **Blockers**: Step 1.1 (needs IEventBusPort)
- **Risks**: None
- **Parallel with**: 1.2, 2.1
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Tag Definition (weight: 0.40)
     - Correctly extends Context.Tag with proper name and type
     - 1=incorrect definition, 3=basic working, 5=proper Effect pattern
  2. Port Naming (weight: 0.30)
     - Follows IEventBusPort/EventBusTag convention, no declaration merging
     - 1=naming violation, 3=mostly correct, 5=perfect convention compliance
  3. Export Completeness (weight: 0.30)
     - Exported from shared/ports index and accessible
     - 1=not exported, 3=partial export, 5=full export chain

#### Step 3.2: Implement NotificationSendHandler
- **Goal**: Create event handler for NotificationCreated events
- **Output Files**:
  - `packages/use-cases/src/notification/handlers/NotificationSendHandler.ts`
  - `packages/use-cases/src/notification/handlers/NotificationSendHandler.test.ts`
- **Success Criteria**:
  - [ ] Implements IEventHandler<NotificationCreated>
  - [ ] Fetches push subscriptions via PushSubscriptionPortTag
  - [ ] Sends push notifications with retry logic (1s, 2s, 4s backoff)
  - [ ] Tracks delivery start/complete/failure via delivery port
  - [ ] Catches ALL errors internally (Effect<void, never, never>)
  - [ ] Unit tests verify retry logic and error isolation
- **Subtasks**:
  1. Define handler class with dependencies (PushSubscriptionPortTag, delivery ports)
  2. Implement handle() with Effect.gen
  3. Add exponential backoff retry with Effect.retry
  4. Add error isolation with Effect.catchAll
  5. Write unit tests with mocked dependencies
- **Estimated Complexity**: Medium (3-4 hours)
- **Blockers**: Step 1.2 (needs NotificationCreated), Step 3.1 (needs EventBusTag)
- **Risks**:
  - **Risk**: Complex retry logic with Effect
  - **Mitigation**: Use Effect.schedule with exponential backoff
  - **Risk**: Handler error isolation critical
  - **Mitigation**: Test with intentional throw in handler to verify catchAll
- **Parallel with**: 4.1, 7.1, 5.3
- **Agent**: opus

#### Verification
- **Level**: HIGH
- **Type**: Panel (3 judges)
- **Rubric**:
  1. Event Processing Logic (weight: 0.30)
     - Fetches subscriptions, sends notifications, tracks delivery correctly
     - 1=broken flow, 3=basic working, 5=optimal with batching/parallelism
  2. Retry Implementation (weight: 0.25)
     - Exponential backoff 1s, 2s, 4s using Effect.schedule or retryN
     - 1=no retry, 3=fixed delay, 5=proper exponential backoff with Effect
  3. Error Isolation (weight: 0.30)
     - Effect<void, never, never> - all errors caught internally
     - 1=leaking errors, 3=basic catch, 5=complete isolation with logging
  4. Delivery Tracking (weight: 0.15)
     - Correctly updates notification_delivery table start/complete/failure
     - 1=no tracking, 3=basic update, 5=comprehensive status tracking

#### Step 3.3: Export Handler from Use Cases Index
- **Goal**: Export handler from notification interactors index
- **Output**: Modify `packages/use-cases/src/notification/interactors/index.ts`
- **Success Criteria**:
  - [ ] `export { NotificationSendHandler }` added to index.ts
- **Estimated Complexity**: Tiny (15 minutes)
- **Blockers**: Step 3.2
- **Risks**: None
- **Parallel with**: 4.2, 4.3, 7.3, 7.5
- **Agent**: haiku

#### Verification
- **Level**: LOW
- **Type**: Per-Item
- **Rubric**:
  1. Export Presence (weight: 0.50)
     - Export statement present and syntactically correct
     - 1=missing export, 3=export present with issues, 5=clean export
  2. Import Test (weight: 0.50)
     - Can import from @mirai-app/use-cases without errors
     - 1=import fails, 3=import works with issues, 5=clean import

---

### Phase 4: Use Case Integration

#### Step 4.1: Modify SendNotificationToGroup
- **Goal**: Add event publishing to SendNotificationToGroup use case
- **Output**: Modify `packages/use-cases/src/notification/interactors/SendNotificationToGroup.ts`
- **Success Criteria**:
  - [ ] EventBusTag yielded in Effect.gen
  - [ ] NotificationCreated event published after DB write
  - [ ] Use case returns immediately after publish (before delivery)
  - [ ] Existing tests updated to mock EventBusTag
  - [ ] Integration test verifies event publication
- **Subtasks**:
  1. Add EventBusTag to Effect.gen dependencies
  2. Add eventBus.publish() call after notification creation
  3. Update existing tests with mock EventBusTag layer
  4. Add integration test verifying publish called
- **Estimated Complexity**: Small (2 hours)
- **Blockers**: Step 1.2, Step 3.1 (needs EventBusTag and NotificationCreated)
- **Risks**:
  - **Risk**: Breaking existing functionality
  - **Mitigation**: Comprehensive test coverage before changes
- **Parallel with**: 3.2, 7.1, 5.3
- **Agent**: sdd:developer

#### Verification
- **Level**: HIGH
- **Type**: Panel (3 judges)
- **Rubric**:
  1. Event Publishing Integration (weight: 0.35)
     - Publishes NotificationCreated after successful DB write
     - 1=no publishing, 3=basic publish, 5=proper sequencing with error handling
  2. Response Timing (weight: 0.25)
     - Returns before delivery completes, maintains <100ms response
     - 1=synchronous wait, 3=basic async, 5=verified async with timing
  3. Test Compatibility (weight: 0.25)
     - Existing tests updated with EventBusTag mock layer
     - 1=broken tests, 3=tests pass, 5=comprehensive mock setup
  4. Error Handling (weight: 0.15)
     - Handles publish failures gracefully, maintains consistency
     - 1=unhandled, 3=basic error, 5=proper error propagation

#### Step 4.2: Modify SendNotificationToAll
- **Goal**: Add event publishing to SendNotificationToAll use case
- **Output**: Modify `packages/use-cases/src/notification/interactors/SendNotificationToAll.ts`
- **Success Criteria**:
  - [ ] Same as Step 4.1
- **Estimated Complexity**: Small (1.5 hours)
- **Blockers**: Step 4.1 (follow same pattern)
- **Risks**: None
- **Parallel with**: 4.3, 7.3, 7.5, 3.3
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Pattern Consistency (weight: 0.40)
     - Follows same pattern as Step 4.1 implementation
     - 1=different approach, 3=mostly consistent, 5=identical pattern
  2. Event Publishing (weight: 0.35)
     - Publishes NotificationCreated after DB write
     - 1=no publishing, 3=basic publish, 5=proper with error handling
  3. Test Updates (weight: 0.25)
     - Tests updated with EventBusTag mock
     - 1=broken tests, 3=tests pass, 5=comprehensive coverage

#### Step 4.3: Modify SendCustomToGroup
- **Goal**: Add event publishing to SendCustomToGroup use case
- **Output**: Modify `packages/use-cases/src/notification/interactors/SendCustomToGroup.ts`
- **Success Criteria**:
  - [ ] Same as Step 4.1
- **Estimated Complexity**: Small (1.5 hours)
- **Blockers**: Step 4.1 (follow same pattern)
- **Risks**: None
- **Parallel with**: 4.2, 7.3, 7.5, 3.3
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Pattern Consistency (weight: 0.40)
     - Follows same pattern as Step 4.1 implementation
     - 1=different approach, 3=mostly consistent, 5=identical pattern
  2. Event Publishing (weight: 0.35)
     - Publishes NotificationCreated after DB write
     - 1=no publishing, 3=basic publish, 5=proper with error handling
  3. Test Updates (weight: 0.25)
     - Tests updated with EventBusTag mock
     - 1=broken tests, 3=tests pass, 5=comprehensive coverage

---

### Phase 5: DI Wiring

#### Step 5.1: Add EventBusTag to Service Layer
- **Goal**: Wire EventBusTag to SupabaseRealtimeEventBusGateway in DI (production); InProcessEventBusGateway for tests
- **Output**: Modify `packages/frameworks/src/di/layer/service.ts`
- **Success Criteria**:
  - [ ] EventBusTag added to makeServiceLayer function
  - [ ] Production: Layer.succeed(EventBusTag, new SupabaseRealtimeEventBusGateway(supabase))
  - [ ] Testing: InProcessEventBusGateway used via Layer.succeed in test utilities
  - [ ] Included in Layer.mergeAll return
- **Estimated Complexity**: Small (1 hour)
- **Blockers**: Step 2.1 (needs SupabaseRealtimeEventBusGateway), Step 2.3 (needs InProcessEventBusGateway for test utilities), Step 3.1 (needs EventBusTag)
- **Risks**: None
- **Parallel with**: 7.2, 1.3, 2.2, 2.3
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Layer Wiring (weight: 0.35)
     - EventBusTag correctly wired to SupabaseRealtimeEventBusGateway
     - 1=not wired, 3=basic wiring, 5=proper Layer.succeed with types
  2. Layer Composition (weight: 0.30)
     - Included in Layer.mergeAll with other service layers
     - 1=missing from merge, 3=included, 5=optimal composition
  3. Dependency Injection (weight: 0.20)
     - Supabase client properly passed to gateway
     - 1=missing deps, 3=basic injection, 5=complete DI
  4. Type Safety (weight: 0.15)
     - Layer types correctly inferred, no explicit type annotations needed
     - 1=type errors, 3=basic types, 5=full type inference

#### Step 5.2: Update App Layer Composition
- **Goal**: Ensure EventBus layer included in makeAppLayer
- **Output**: Modify `packages/frameworks/src/di/layer/app.ts`
- **Success Criteria**:
  - [ ] makeAppLayer includes service layer (which now has EventBus)
  - [ ] Verify Layer.mergeAll includes all required tags
- **Estimated Complexity**: Tiny (30 minutes)
- **Blockers**: Step 5.1
- **Risks**: None
- **Parallel with**: 6.1
- **Agent**: haiku

#### Verification
- **Level**: LOW
- **Type**: Per-Item
- **Rubric**:
  1. Layer Inclusion (weight: 0.50)
     - Service layer (with EventBus) included in makeAppLayer
     - 1=not included, 3=included with issues, 5=clean inclusion
  2. Composition Test (weight: 0.50)
     - App layer builds successfully with all tags
     - 1=build fails, 3=builds with warnings, 5=clean build

#### Step 5.3: Export from Frameworks DI Index
- **Goal**: Export EventBusTag from frameworks DI index
- **Output**: Modify `packages/frameworks/src/di/index.ts`
- **Success Criteria**:
  - [ ] `export { EventBusTag }` added to index.ts
- **Estimated Complexity**: Tiny (15 minutes)
- **Blockers**: Step 3.1 (EventBusTag exists)
- **Risks**: None
- **Parallel with**: 3.2, 4.1, 7.1
- **Agent**: haiku

#### Verification
- **Level**: LOW
- **Type**: Per-Item
- **Rubric**:
  1. Export Presence (weight: 0.50)
     - EventBusTag exported from DI index
     - 1=missing export, 3=export present with issues, 5=clean export
  2. Import Test (weight: 0.50)
     - Can import from @mirai-app/frameworks/di without errors
     - 1=import fails, 3=import works with issues, 5=clean import

---

### Phase 6: Server Startup Integration

#### Step 6.1: Create Handler Registration Module
- **Goal**: Create module for initializing notification handlers at startup
- **Output Files**:
  - `apps/backend-server/src/handlers/notification-handlers.ts`
- **Success Criteria**:
  - [ ] initializeNotificationHandlers() function exported
  - [ ] Subscribes NotificationSendHandler to "NotificationCreated" events
  - [ ] Returns cleanup function for graceful shutdown
  - [ ] Handler subscription happens BEFORE returning
- **Subtasks**:
  1. Create handler initialization function
  2. Use EventBusTag to subscribe handler
  3. Store unsubscribe functions for cleanup
  4. Add logging for initialization status
- **Estimated Complexity**: Small (2 hours)
- **Blockers**: Step 3.2 (needs NotificationSendHandler), Step 5.1 (needs DI wiring)
- **Risks**:
  - **Risk**: Race condition if event published before subscribed
  - **Mitigation**: Ensure subscription completes before server starts accepting requests
- **Parallel with**: 5.2
- **Agent**: sdd:developer

#### Verification
- **Level**: HIGH
- **Type**: Panel (3 judges)
- **Rubric**:
  1. Initialization Order (weight: 0.35)
     - Subscribes handlers before returning, before HTTP server starts
     - 1=async gap, 3=basic await, 5=guaranteed ordering with await
  2. Cleanup Support (weight: 0.25)
     - Returns cleanup function for graceful shutdown
     - 1=no cleanup, 3=basic function, 5=complete resource release
  3. Subscription Management (weight: 0.25)
     - Uses EventBusTag correctly, stores unsubscribe functions
     - 1=broken DI, 3=basic working, 5=optimal with error handling
  4. Observability (weight: 0.15)
     - Logs initialization status and errors
     - 1=no logging, 3=basic logs, 5=structured logging

#### Step 6.2: Integrate Handler Initialization in Server Startup
- **Goal**: Initialize handlers before HTTP server starts
- **Output**: Modify `apps/backend-server/src/index.ts`
- **Success Criteria**:
  - [ ] initializeNotificationHandlers() called before startGraphQLServer()
  - [ ] Cleanup function stored for SIGTERM/SIGINT handlers
  - [ ] Health check includes handler status
  - [ ] Server logs confirm handler initialization
- **Subtasks**:
  1. Import initializeNotificationHandlers
  2. Call with appLayer before starting HTTP server
  3. Store cleanup function for graceful shutdown
  4. Add handler status to health endpoint
- **Estimated Complexity**: Small (1.5 hours)
- **Blockers**: Step 6.1
- **Risks**:
  - **Risk**: Startup ordering critical
  - **Mitigation**: Explicit await of handler initialization before HTTP server start
- **Parallel with**: None
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Startup Ordering (weight: 0.35)
     - Handlers initialized before startGraphQLServer() call
     - 1=wrong order, 3=basic ordering, 5=explicit await with verification
  2. Cleanup Integration (weight: 0.25)
     - Cleanup stored and called on SIGTERM/SIGINT
     - 1=no cleanup, 3=basic handler, 5=graceful shutdown
  3. Health Check (weight: 0.20)
     - Handler status included in health endpoint
     - 1=not included, 3=basic status, 5=comprehensive health
  4. Logging (weight: 0.20)
     - Server logs confirm handler initialization success/failure
     - 1=no logs, 3=basic logs, 5=structured logging

---

### Phase 7: Verification

#### Step 7.1: Domain Layer Unit Tests
- **Goal**: Verify domain event contracts
- **Output**: Test files for domain events
- **Success Criteria**:
  - [ ] IDomainEvent interface test verifies required fields
  - [ ] NotificationCreated test verifies immutability
  - [ ] All domain tests pass: `bun test packages/domain`
- **Estimated Complexity**: Small (1.5 hours)
- **Blockers**: Steps 1.1, 1.2
- **Risks**: None
- **Parallel with**: 3.2, 4.1, 5.3
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Test Coverage (weight: 0.35)
     - Tests cover success paths, field verification, immutability
     - 1=minimal tests, 3=basic coverage, 5=comprehensive
  2. Effect Testing Patterns (weight: 0.30)
     - Uses Effect.either with Either.isLeft/isRight for type-safe testing
     - 1=wrong patterns, 3=basic usage, 5=idiomatic Effect testing
  3. Interface Verification (weight: 0.20)
     - Verifies all IDomainEvent fields present with correct types
     - 1=missing checks, 3=basic verification, 5=thorough validation
  4. Test Quality (weight: 0.15)
     - Clear test names, meaningful assertions, good structure
     - 1=poor quality, 3=acceptable, 5=exemplary

#### Step 7.2: Gateway Unit Tests
- **Goal**: Verify SupabaseRealtimeEventBusGateway behavior
- **Output**: `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.test.ts`
- **Success Criteria**:
  - [ ] Mock Supabase client for isolated testing
  - [ ] Test publish() calls broadcast with correct payload
  - [ ] Test subscribe() invokes handler on broadcast events
  - [ ] Test unsubscribe() removes channel listener
  - [ ] Test error handling with failed operations
- **Estimated Complexity**: Small (2 hours)
- **Blockers**: Step 2.1
- **Risks**: None
- **Parallel with**: 5.1, 1.3, 2.2
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Test Coverage (weight: 0.35)
     - Tests cover publish, subscribe, unsubscribe, error handling
     - 1=minimal tests, 3=basic coverage, 5=comprehensive
  2. Mock Quality (weight: 0.30)
     - Supabase client properly mocked with realistic behavior
     - 1=fragile mocks, 3=working mocks, 5=realistic simulation
  3. Effect Testing Patterns (weight: 0.20)
     - Uses Effect.provide with mock layers, proper error testing
     - 1=wrong patterns, 3=basic usage, 5=idiomatic Effect
  4. Assertion Quality (weight: 0.15)
     - Verifies broadcast payload, handler invocation, cleanup
     - 1=weak assertions, 3=basic checks, 5=thorough validation

#### Step 7.3: Handler Unit Tests
- **Goal**: Verify NotificationSendHandler logic
- **Output**: `packages/use-cases/src/notification/handlers/NotificationSendHandler.test.ts`
- **Success Criteria**:
  - [ ] Mock all dependencies (PushSubscriptionPort, delivery ports)
  - [ ] Test successful push sending flow
  - [ ] Test retry logic with mocked failures
  - [ ] Test error isolation (handler catches all errors)
  - [ ] Test delivery tracking updates
- **Estimated Complexity**: Medium (3 hours)
- **Blockers**: Step 3.2
- **Risks**:
  - **Risk**: Complex async testing with Effect
  - **Mitigation**: Use Effect.provide with mock layers
- **Parallel with**: 4.2, 4.3, 7.5, 3.3
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Test Coverage (weight: 0.35)
     - Tests cover success flow, retry logic, error isolation, tracking
     - 1=minimal tests, 3=basic coverage, 5=comprehensive
  2. Mock Quality (weight: 0.25)
     - Dependencies properly mocked (PushSubscriptionPort, delivery ports)
     - 1=fragile mocks, 3=working mocks, 5=realistic simulation
  3. Retry Testing (weight: 0.25)
     - Verifies exponential backoff with mocked failures
     - 1=no retry tests, 3=basic testing, 5=comprehensive retry validation
  4. Error Isolation Testing (weight: 0.15)
     - Verifies handler catches all errors (Effect<void, never, never>)
     - 1=not tested, 3=basic test, 5=thorough isolation validation

#### Step 7.4: Integration Tests
- **Goal**: End-to-end flow verification
- **Output**: Integration test file (location TBD, possibly `apps/backend-server/tests/`)
- **Success Criteria**:
  - [ ] Full flow: use case publishes event, handler receives and processes
  - [ ] In-memory event bus for test isolation
  - [ ] Verify <100ms response time (mocked)
  - [ ] Verify delivery tracking in database
- **Estimated Complexity**: Medium (3 hours)
- **Blockers**: Steps 4.1, 6.2 (needs full implementation)
- **Risks**:
  - **Risk**: Complex setup for integration tests
  - **Mitigation**: Create in-memory IEventBusPort implementation for tests
- **Parallel with**: None
- **Agent**: opus

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Flow Coverage (weight: 0.35)
     - Tests full flow: use case → event bus → handler → delivery
     - 1=partial flow, 3=basic flow, 5=comprehensive end-to-end
  2. Test Isolation (weight: 0.25)
     - Uses in-memory event bus, isolated from external services
     - 1=external deps, 3=partial isolation, 5=full isolation
  3. Timing Verification (weight: 0.20)
     - Verifies <100ms response time from use case
     - 1=not verified, 3=basic timing, 5=precise measurement
  4. Data Consistency (weight: 0.20)
     - Verifies delivery tracking in database
     - 1=not checked, 3=basic check, 5=thorough validation

#### Step 7.5: Performance Validation
- **Goal**: Verify p95 response time < 100ms
- **Output**: Performance test script
- **Success Criteria**:
  - [x] Load test with 100 concurrent requests
  - [x] Measure response times
  - [x] Verify 95th percentile < 100ms
- **Completed**: 2026-04-18
- **Test Results**:
  - Test file: `packages/use-cases/src/notification/performance/perf.test.ts`
  - 100 concurrent requests completed with 0 errors
  - P95 latency: 45.20ms (target: < 100ms) ✓
  - P99 latency: 45.44ms
  - Avg latency: 42.87ms
  - Min latency: 40.85ms
  - Max latency: 45.44ms
  - StdDev: 1.37ms
  - All 100 requests in 20-50ms bucket
- **Estimated Complexity**: Small (1.5 hours)
- **Blockers**: Step 4.1 (needs use case integration) - RESOLVED
- **Risks**: None
- **Parallel with**: 4.2, 4.3, 7.3, 3.3
- **Agent**: sdd:developer

#### Verification
- **Level**: MEDIUM
- **Type**: Single
- **Rubric**:
  1. Test Design (weight: 0.30)
     - Simulates realistic load with 100 concurrent requests
     - 1=simple test, 3=basic load, 5=realistic simulation
  2. Measurement Accuracy (weight: 0.30)
     - Correctly measures p95 response time
     - 1=inaccurate, 3=basic measurement, 5=precise with stats
  3. Target Achievement (weight: 0.25)
     - Verifies p95 < 100ms requirement met
     - 1=target missed, 3=borderline, 5=comfortably under
  4. Reporting (weight: 0.15)
     - Clear results with latency distribution
     - 1=unclear, 3=basic report, 5=comprehensive analysis

---

## Implementation Summary

| Step | Phase | Goal | Complexity | Est. Time | Dependencies | Success Criteria Summary |
|------|-------|------|------------|-----------|--------------|-------------------------|
| 1.1 | Foundational | Domain event interfaces | Small | 1-2h | None | IDomainEvent, IEventBusPort, IEventHandler interfaces with tests |
| 1.2 | Foundational | NotificationCreated event | Small | 1h | 1.1 | Event class implements IDomainEvent, immutable, tested |
| 1.3 | Foundational | Export from domain index | Tiny | 15m | 1.1, 1.2 | Exports added, imports work |
| 2.1 | Transport | SupabaseRealtimeEventBusGateway | Medium | 3-4h | 1.1 | Implements IEventBusPort with publish/subscribe/unsubscribe, tested |
| 2.2 | Transport | Export gateway from adapters | Tiny | 15m | 2.1 | Exported from adapters index (both gateways) |
| 2.3 | Transport | InProcessEventBusGateway | Small | 45m | 1.1 | Synchronous IEventBusPort implementation for testing |
| 3.1 | Handler | EventBusTag Context.Tag | Tiny | 30m | 1.1 | Tag defined and exported |
| 3.2 | Handler | NotificationSendHandler | Medium | 3-4h | 1.2, 3.1 | Handler with retry logic, error isolation, delivery tracking |
| 3.3 | Handler | Export handler | Tiny | 15m | 3.2 | Exported from use-cases index |
| 4.1 | Integration | Modify SendNotificationToGroup | Small | 2h | 1.2, 3.1 | Event publishing added, tests updated |
| 4.2 | Integration | Modify SendNotificationToAll | Small | 1.5h | 4.1 | Event publishing added |
| 4.3 | Integration | Modify SendCustomToGroup | Small | 1.5h | 4.1 | Event publishing added |
| 5.1 | DI Wiring | Add EventBusTag to service layer | Small | 1h | 2.1, 3.1 | Layer.wiring complete |
| 5.2 | DI Wiring | Update app layer composition | Tiny | 30m | 5.1 | makeAppLayer includes EventBus |
| 5.3 | DI Wiring | Export from DI index | Tiny | 15m | 3.1 | EventBusTag exported |
| 6.1 | Startup | Create handler registration | Small | 2h | 3.2, 5.1 | initializeNotificationHandlers() with cleanup |
| 6.2 | Startup | Integrate in server startup | Small | 1.5h | 6.1 | Handlers initialized before HTTP server |
| 7.1 | Verification | Domain layer unit tests | Small | 1.5h | 1.1, 1.2 | All domain tests pass |
| 7.2 | Verification | Gateway unit tests | Small | 2h | 2.1 | Gateway tested with mocks |
| 7.3 | Verification | Handler unit tests | Medium | 3h | 3.2 | Handler logic fully tested |
| 7.4 | Verification | Integration tests | Medium | 3h | 4.1, 6.2 | End-to-end flow verified |
| 7.5 | Verification | Performance validation | Small | 1.5h | 4.1 | p95 < 100ms verified |

**Total Estimated Time**: ~29.5-34.5 hours (3.5-4.5 development days)

**Critical Path**: 1.1 → 1.2 → 2.1 → 3.1 → 3.2 → 4.1 → 5.1 → 6.1 → 6.2 → 7.4
(Note: Step 2.3 is parallel work, not on critical path)

**Phases with Parallel Work**:
- Phase 1 and Phase 3 (steps 3.1) can start after 1.1
- Phase 2 (steps 2.2, 2.3) can proceed in parallel after dependencies met (1.1, 2.1 for 2.2; 1.1 for 2.3)
- Phase 2 and Phase 3 (steps 3.2) can proceed in parallel after dependencies met
- Phase 5 can start after Phase 2 (2.1) and 3.1 complete
- Phase 6 can start after Phase 3 and 5 complete
- Phase 7 tests can be written during implementation (TDD approach)

**Risk Summary**:
| Risk | Severity | Mitigation |
|------|----------|------------|
| Handler not initialized before first event | High | Explicit startup sequencing in Step 6 |
| Realtime connection instability | Medium | Supabase auto-reconnection + tests in Step 7 |
| Complex Effect retry logic | Medium | Use Effect.schedule, comprehensive tests in Step 7.3 |
| Breaking existing use cases | Medium | Comprehensive test updates in Steps 4.x |
| Async testing complexity | Low | Mock layers and in-memory event bus in tests |

**Decomposition Reference**: `.specs/scratchpad/decomposition-event-bus.md`

---

## Verification Summary

| Step | Level | Type | Pass Threshold | Rubric Focus |
|------|-------|------|---------------|--------------|
| 1.1 | HIGH | Panel (3) | >=4.0/5.0 | Interface Design, Type Safety, Domain Purity, Extensibility |
| 1.2 | MEDIUM | Single | >=4.0/5.0 | Interface Implementation, Data Completeness, Immutability, Tests |
| 1.3 | LOW | Per-Item | >=4.0/5.0 | Export Presence, Import Test |
| 2.1 | HIGH | Panel (3) | >=4.0/5.0 | Contract Compliance, Supabase Integration, Cleanup, Error Handling |
| 2.2 | LOW | Per-Item | >=4.0/5.0 | Export Presence, Import Test |
| 2.3 | MEDIUM | Single | >=4.0/5.0 | Interface Compliance, Synchronous Invocation, Test Integration, Error Handling |
| 3.1 | MEDIUM | Single | >=4.0/5.0 | Tag Definition, Port Naming, Export Completeness |
| 3.2 | HIGH | Panel (3) | >=4.0/5.0 | Event Processing, Retry Implementation, Error Isolation, Tracking |
| 3.3 | LOW | Per-Item | >=4.0/5.0 | Export Presence, Import Test |
| 4.1 | HIGH | Panel (3) | >=4.0/5.0 | Event Publishing Integration, Response Timing, Test Compatibility, Error Handling |
| 4.2 | MEDIUM | Single | >=4.0/5.0 | Pattern Consistency, Event Publishing, Test Updates |
| 4.3 | MEDIUM | Single | >=4.0/5.0 | Pattern Consistency, Event Publishing, Test Updates |
| 5.1 | MEDIUM | Single | >=4.0/5.0 | Layer Wiring, Layer Composition, DI, Type Safety |
| 5.2 | LOW | Per-Item | >=4.0/5.0 | Layer Inclusion, Composition Test |
| 5.3 | LOW | Per-Item | >=4.0/5.0 | Export Presence, Import Test |
| 6.1 | HIGH | Panel (3) | >=4.0/5.0 | Initialization Order, Cleanup, Subscription Management, Observability |
| 6.2 | MEDIUM | Single | >=4.0/5.0 | Startup Ordering, Cleanup Integration, Health Check, Logging |
| 7.1 | MEDIUM | Single | >=4.0/5.0 | Test Coverage, Effect Testing Patterns, Interface Verification, Test Quality |
| 7.2 | MEDIUM | Single | >=4.0/5.0 | Test Coverage, Mock Quality, Effect Testing Patterns, Assertion Quality |
| 7.3 | MEDIUM | Single | >=4.0/5.0 | Test Coverage, Mock Quality, Retry Testing, Error Isolation Testing |
| 7.4 | MEDIUM | Single | >=4.0/5.0 | Flow Coverage, Test Isolation, Timing Verification, Data Consistency |
| 7.5 | MEDIUM | Single | >=4.0/5.0 | Test Design, Measurement Accuracy, Target Achievement, Reporting |

**Total Steps**: 22
- **HIGH (Panel)**: 5 steps - Critical components requiring 3-judge panel review
- **MEDIUM (Single)**: 12 steps - Standard implementation with single judge
- **LOW (Per-Item)**: 5 steps - Simple tasks with per-item verification
- **NONE**: 0 steps

**Overall Quality Gate**: All HIGH and MEDIUM steps must achieve >=4.0/5.0 average score
**Verification Planning Reference**: `.specs/scratchpad/verification-79ac1e15.md`

---

## Parallelization

### Execution Flow Diagram

```
WAVE 1: Foundation (Blockers: None)
=====================================
[1.1] Domain Event Interfaces (sdd:developer, 1-2h)
    │
    ├──┬──→ [1.2] NotificationCreated Event (sdd:developer, 1h)
    │  │
    ├──┼──→ [2.1] SupabaseRealtimeEventBusGateway (opus, 3-4h) ========= CRITICAL PATH
    │  │
    ├──┼──→ [2.3] InProcessEventBusGateway (sdd:developer, 45m)
    │  │
    └──┴──→ [3.1] EventBusTag Context.Tag (sdd:developer, 30m)

WAVE 2: Core Implementation (Blockers: 1.2 AND 3.1)
==================================================
[3.2] NotificationSendHandler (opus, 3-4h) ============================== CRITICAL PATH
    │
    ├──┬──→ [4.1] Modify SendNotificationToGroup (sdd:developer, 2h) ==== CRITICAL PATH
    │  │
    ├──┼──→ [7.1] Domain Layer Unit Tests (sdd:developer, 1.5h)
    │  │
    └──┴──→ [5.3] Export from DI Index (haiku, 15m)

WAVE 3: Gateway & DI (Blockers: 2.1 AND 3.1)
=============================================
[5.1] Add EventBusTag to Service Layer (sdd:developer, 1h) ============ CRITICAL PATH
    │
    ├──┬──→ [7.2] Gateway Unit Tests (sdd:developer, 2h)
    │  │
    ├──┼──→ [1.3] Export from Domain Index (haiku, 15m)
    │  │
    └──┴──→ [2.2] Export Gateway (haiku, 15m)

WAVE 4: Handler Completion & Use Case Expansion (Blockers: 3.2)
===============================================================
[3.3] Export Handler (haiku, 15m)
    │
    ├──┬──→ [4.2] Modify SendNotificationToAll (sdd:developer, 1.5h)
    │  │
    ├──┼──→ [4.3] Modify SendCustomToGroup (sdd:developer, 1.5h)
    │  │
    ├──┼──→ [7.3] Handler Unit Tests (sdd:developer, 3h)
    │  │
    └──┴──→ [7.5] Performance Validation (sdd:developer, 1.5h)

WAVE 5: Startup Wiring (Blockers: 3.2 AND 5.1)
===============================================
[6.1] Create Handler Registration (sdd:developer, 2h) ================ CRITICAL PATH
    │
    └──→ [5.2] Update App Layer Composition (haiku, 30m)

WAVE 6: Final Integration (Blockers: 6.1 AND 4.1)
==================================================
[6.2] Integrate Handler Initialization (sdd:developer, 1.5h) ========== CRITICAL PATH
    │
    └──→ [7.4] Integration Tests (opus, 3h) ============================= CRITICAL PATH
```

### Critical Path

The critical path determines the minimum total duration:

```
1.1 (1-2h) → 1.2 (1h) → 2.1 (3-4h) → 3.1 (30m) → 3.2 (3-4h) → 4.1 (2h) → 5.1 (1h) → 6.1 (2h) → 6.2 (1.5h) → 7.4 (3h)
```

**Critical Path Duration: ~19-21 hours**  
**Sequential Estimate: ~29-34 hours**  
**Time Saved via Parallelization: ~10-13 hours (30-40%)**

### Maximum Parallelization Depth

| Wave | Max Parallel Steps | Steps |
|------|-------------------|-------|
| Wave 1 | 4 | 1.2, 2.1, 2.3, 3.1 |
| Wave 2 | 4 | 3.2, 4.1, 7.1, 5.3 |
| Wave 3 | 4 | 5.1, 7.2, 1.3, 2.2 |
| Wave 4 | 5 | 3.3, 4.2, 4.3, 7.3, 7.5 |
| Wave 5 | 2 | 6.1, 5.2 |
| Wave 6 | 2 | 6.2, 7.4 |

**Maximum Parallelization Depth: 5 steps (Wave 4)**

### Agent Allocation Summary

| Agent | Steps Assigned | Total Est. Hours |
|-------|---------------|------------------|
| sdd:developer | 1.1, 1.2, 2.3, 3.1, 4.1, 4.2, 4.3, 5.1, 6.1, 6.2, 7.1, 7.2, 7.3, 7.5 | ~21.5h |
| opus | 2.1, 3.2, 7.4 | ~10h |
| haiku | 1.3, 2.2, 3.3, 5.2, 5.3 | ~2h |

---

## Sub-Agent Execution Directive

### How to Execute Steps in Parallel

1. **Wave-Based Execution**: All steps within a wave can be dispatched simultaneously once their shared blockers are complete.

2. **Dependency Satisfaction Check**: Before starting any step, verify ALL of its blockers are marked complete in the tracking system.

3. **Agent Concurrency Rules**:
   - Each agent can execute one step at a time
   - Steps assigned to the same agent within a wave will execute sequentially
   - Cross-agent steps within a wave execute in parallel

4. **Critical Path Priority**: When agents are available, prioritize steps on the critical path to minimize total project duration.

5. **Export Task Batching**: The tiny export steps (1.3, 2.2, 3.3, 5.2, 5.3) can be batched and assigned to a single haiku run if they have no inter-dependencies.

### Dependency Ordering Rules

1. **Hard Blockers Must Complete First**: A step cannot start until all its `Blockers` are complete.

2. **Soft Parallel Hints**: The `Parallel with` field indicates which steps can run concurrently but doesn't enforce ordering.

3. **Cross-Wave Dependencies**:
   - Wave 2 steps need BOTH 1.2 AND 3.1 from Wave 1
   - Wave 3 steps need BOTH 2.1 AND 3.1 from Wave 1
   - Wave 1 step 2.3 needs 1.1 from Wave 1 (parallel with 1.2, 2.1, 3.1)
   - Wave 4 steps need 3.2 from Wave 2
   - Wave 5 steps need BOTH 3.2 AND 5.1
   - Wave 6 steps need BOTH 6.1 AND 4.1

4. **Test Execution**: Test steps (7.x) can run in parallel with implementation of their dependencies, but must pass before marking dependent implementation steps complete.

### Agent Selection Guidelines

**Use `sdd:developer` for:**
- Interface and type definitions
- Simple class implementations
- Use case modifications
- DI wiring and Layer composition
- Unit tests (domain, gateway, handler)
- Server startup integration
- Performance validation scripts

**Use `opus` for:**
- Complex Effect-based implementations
- Retry logic with Effect.schedule
- Integration tests requiring complex setup
- Gateway implementations with external APIs
- Handler logic with sophisticated error handling

**Use `haiku` for:**
- Barrel exports (index.ts updates)
- Simple configuration updates
- README or documentation updates
- Any task < 30 minutes with clear requirements

### Quality Gates Before Marking Complete

Each step must pass these gates:
1. **Code Review**: code-review:reviewer verifies implementation
2. **Tests Pass**: All tests for the step pass (`bun test`)
3. **Type Check**: TypeScript compiles without errors (`bun tsc --noEmit`)
4. **Lint Clean**: No ESLint errors
5. **Success Criteria Met**: All checkboxes in step's Success Criteria are verified

### Rollback Strategy

If a step fails quality gates:
1. **Halt Downstream**: Immediately pause all steps in downstream waves that depend on the failed step
2. **Retry Logic**: Retry the step with the same agent type (max 2 retries)
3. **Escalation Path**: After 2 failures, escalate to opus for complex implementation issues
4. **Dependency Re-evaluation**: If the step implementation changes significantly, re-evaluate the parallelization plan

### Execution Command Format

When dispatching parallel steps, use this format:

```
/sadd:do-in-parallel
Wave: {wave-number}
Steps: {comma-separated step IDs}
Prerequisites Complete: {blocker step IDs}
```
