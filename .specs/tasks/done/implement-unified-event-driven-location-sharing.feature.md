---
title: Implement unified event-driven location sharing via EventBus
status: draft
pillar: sdd
---

## Initial User Prompt

Continue on brainstorm of migrating location sharing to pub-sub

## Description

### What

We are building an event-driven location sharing system using the EventBus pattern. When a user updates their location, a `LocationUpdated` domain event is published. This event is consumed by a handler that fans out location updates to all friends who have sharing enabled, delivering updates in real-time via GraphQL subscriptions.

### Why

Currently, the location sharing system relies on direct database queries with periodic polling. This creates unnecessary database load, delays in receiving updates, and a fragmented architecture where location sharing and notification systems use different patterns.

By migrating to a unified EventBus architecture:

1. **Unified patterns**: Location sharing follows the same event-driven pattern already established for notifications
2. **Real-time fan-out**: Friends receive location updates immediately via push-based subscriptions
3. **Reduced polling**: Eliminate frequent database queries for location data
4. **Scalable architecture**: Event handlers can be distributed, throttled, and retried independently

### Current State

- Direct database queries for location sharing lists
- Polling-based updates from mobile clients
- No event publishing when location updates occur
- Separate notification system with different patterns

### Desired State

- Push-based updates via domain events (`LocationUpdated`)
- 1-second throttle with replace-with-latest strategy
- Fire-and-forget delivery to offline friends
- GraphQL subscriptions receive real-time updates
- Sharing list embedded in event for efficient fan-out

## Acceptance Criteria

### AC1: Location update events are published
**Given** a user has updated their location coordinates
**When** the location update is processed
**Then** a `LocationUpdated` domain event is published to the EventBus with the user ID, coordinates, timestamp, and embedded sharing list

### AC2: 1-second throttle works with replace-with-latest
**Given** a user rapidly updates their location multiple times within 1 second
**When** the EventBus processes these updates
**Then** only the latest location is published, previous pending updates for the same user are replaced

### AC3: Sharing list embedded in event
**Given** a `LocationUpdated` event is created
**When** inspecting the event payload
**Then** the sharing list (friend IDs with whom location is shared) is embedded directly in the event, avoiding additional database queries during fan-out

### AC4: Fan-out to friends via event handler
**Given** a `LocationUpdated` event is published
**When** the event handler processes it
**Then** the location update is fanned out to all friends in the sharing list via their active GraphQL subscriptions

### AC5: GraphQL subscription receives events
**Given** a friend is subscribed to location updates for a user
**When** that user publishes a location update
**Then** the friend receives the location update through their GraphQL subscription within 500ms

### AC6: Offline friends handled with fire-and-forget
**Given** a friend is offline when a location update occurs
**When** the fan-out attempts delivery
**Then** the delivery is fire-and-forget (no blocking retry), and the friend will receive the latest location upon reconnect via standard query

### AC7: Handler failure doesn't block other friends
**Given** a `LocationUpdated` event has multiple friends in the sharing list
**And** delivery to one friend fails
**When** the fan-out continues
**Then** the failure for one friend does not block or prevent delivery to other friends

## User Scenarios

### Primary Flow: Real-time location sharing

**Scenario**: User A updates location and Friend B receives it immediately

1. **Given** User A is sharing their location with Friend B
2. **And** Friend B has an active GraphQL subscription for User A's location
3. **When** User A updates their location coordinates (via mobile app)
4. **Then** a `LocationUpdated` event is published to the EventBus
5. **And** the event handler fans out the update to Friend B's subscription
6. **And** Friend B sees the updated location on their device within 500ms

### Error Flow: Handler failure isolation

**Scenario**: One friend's delivery failure doesn't affect others

1. **Given** User A is sharing location with Friends B, C, and D
2. **And** Friends B and D have active subscriptions
3. **And** Friend C's subscription is in an error state
4. **When** User A updates their location
5. **Then** a `LocationUpdated` event is published
6. **And** the event handler attempts delivery to all three friends
7. **And** delivery to Friend C fails due to a connection error
8. **But** Friends B and D still receive the location update successfully
9. **And** the failure for Friend C is logged but doesn't block others

### Throttle Flow: Rapid updates are throttled

**Scenario**: Rapid location updates are throttled to reduce noise

1. **Given** User A is moving and updating location every 200ms
2. **When** 5 updates occur within 1 second
3. **Then** only the most recent location update is published to the EventBus
4. **And** previous pending updates for User A are discarded/replaced
5. **And** subscribers receive only one update per second per user

## Scope

### In Scope

- `LocationUpdated` domain event definition and publishing
- EventBus integration for location events (using existing notification EventBus pattern)
- 1-second throttle with replace-with-latest strategy
- Event handler for fan-out to friends
- Embedding sharing list in `LocationUpdated` event payload
- GraphQL subscription for real-time location updates
- Fire-and-forget delivery for offline friends
- Error isolation (one friend's failure doesn't block others)

### Out of Scope

- Historical location tracking (trajectory/path storage)
- Push notifications (SMS/email) for offline users
- Location sharing permission management (assume already configured)
- Geofencing or location-based triggers
- Location accuracy or battery optimization features
- Location sharing request/accept/reject events (separate workflow)

## Technical Notes

### Event Structure

```typescript
interface LocationUpdatedEvent {
  eventId: string;           // UUID for deduplication
  userId: UserId;            // User who updated location
  coordinates: Coordinates;  // Lat/long
  accuracy?: number;         // GPS accuracy in meters
  timestamp: Date;           // When update occurred
  sharingList: UserId[];     // Friend IDs to fan out to
}
```

### Throttle Strategy

- Use a keyed throttle by `userId`
- 1000ms window
- Replace pending update with latest coordinates
- Prevents event queue buildup during rapid movement

### Fan-out Pattern

- Parallel delivery to all friends in `sharingList`
- Each delivery independent (no sequential blocking)
- Failed deliveries logged and dropped (fire-and-forget)
- Active subscriptions receive via GraphQL
- Offline friends will query latest on reconnect

## Architecture Overview

### Solution Strategy

The architecture leverages the existing EventBus infrastructure (currently used by notifications) to implement a pub-sub pattern for location sharing. The flow follows a clean event-driven pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. UPDATE LOCATION USE CASE                                                  │
│    UpdateLocation.ts                                                        │
│    ├── Validate and write location to DB                                    │
│    ├── Query sharing list (friends who should receive updates)              │
│    └── Publish LocationUpdated event ──────────────────────────────┐         │
└────────────────────────────────────────────────────────────────────┼─────────┘
                                                                     │
┌────────────────────────────────────────────────────────────────────▼─────────┐
│ 2. EVENTBUS INFRASTRUCTURE (Existing)                                           │
│    packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts   │
│    └── implements IEventBusPort (channel: domain-events-locationupdated)      │
│    ├── Throttle: 1-second window with replace-latest per userId               │
│    └── Broadcast to subscribers ────────────────────────────────────────────┐    │
└─────────────────────────────────────────────────────────────────────────────┼────┘
                                                                              │
┌─────────────────────────────────────────────────────────────────────────────▼────┐
│ 3. EVENT HANDLER                                                                  │
│    LocationBroadcastHandler implements IEventHandler<LocationUpdated>             │
│    ├── Subscribe to LocationUpdated events                                        │
│    ├── Extract sharingWithUserIds from event payload                              │
│    ├── Parallel fan-out to each friend (error isolation per recipient)            │
│    └── Push to GraphQL subscription streams ────────────────────────────────┐     │
└───────────────────────────────────────────────────────────────────────────────┼─────┘
                                                                                │
┌───────────────────────────────────────────────────────────────────────────────▼─────┐
│ 4. GRAPHQL SUBSCRIPTIONS                                                             │
│    FriendLocationEvent subscription                                                  │
│    ├── Active subscribers receive real-time updates                                  │
│    ├── Offline friends: fire-and-forget (no retry blocking)                          │
│    └── Client receives: { userId, latitude, longitude, accuracy, timestamp }        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow Summary:**
1. Mobile app sends location update → UpdateLocation use case
2. Use case validates, saves to DB, queries sharing list, publishes `LocationUpdated` event
3. EventBus receives event, applies throttle (deduplicates rapid updates)
4. `LocationBroadcastHandler` receives event, fans out to all friends in parallel
5. Each friend's GraphQL subscription receives the update (if online)
6. Offline friends will fetch latest location on reconnect via standard query

---

### Key Architectural Decisions

#### Decision 1: 1-Second Throttle with Replace-Latest Strategy

**Decision:** Throttle location updates to maximum 1 per second per user, replacing pending updates with the latest coordinates.

**Rationale:**
- GPS updates can arrive rapidly (every 200-500ms during movement)
- Without throttling: event queue buildup, excessive network traffic, battery drain
- Replace-latest ensures subscribers always see the most current location
- 1-second balance: real-time enough for user experience, efficient enough for resources

**Implementation:**
- Keyed throttle by `userId` using in-memory Map
- Pending update replaced if new update arrives within window
- Configurable via `ThrottleConfig` (minTimeIntervalMs, minDistanceMeters, maxSilenceMs)

---

#### Decision 2: Sharing List Embedded in Event Payload

**Decision:** Include `sharingWithUserIds: UserId[]` directly in the `LocationUpdated` event, queried at publish time.

**Rationale:**
- Handler needs zero database queries to determine fan-out targets
- Eliminates race conditions (sharing list might change between publish and handle)
- Event is self-contained, enabling replay and debugging
- Consistent with notification pattern (recipients embedded in NotificationCreated)

**Trade-offs:**
- Slightly larger event payload (array of user IDs)
- If sharing list changes mid-flight, update applies to next event

---

#### Decision 3: Fire-and-Forget for Offline Friends

**Decision:** Attempt delivery to all friends in parallel, log failures, continue without retry for offline recipients.

**Rationale:**
- Friends come online/offline frequently in mobile apps
- Blocking retries would delay delivery to online friends
- Offline friends will fetch latest location via `GetFriendsLocations` query on reconnect
- No need for persistent queue or complex retry logic

**Implementation:**
- `Effect.all([...deliveries], { concurrency: "unbounded" })`
- Each delivery wrapped with `Effect.catchAll` for error isolation
- Failed deliveries logged but not propagated

---

#### Decision 4: Error Isolation in Event Handlers

**Decision:** All handlers wrap their body with `Effect.catchAll` to prevent event bus disruption.

**Rationale:**
- One handler failure must not crash the entire EventBus
- Notification system already follows this pattern (proven in production)
- Error logging sufficient for observability without breaking real-time flow
- Matches Effect best practices for long-running subscribers

---

#### Decision 5: Reuse Existing EventBus Infrastructure

**Decision:** Use `SupabaseRealtimeEventBusGateway` (already implemented for notifications) rather than building new transport.

**Rationale:**
- Unified architecture: location sharing follows same pattern as notifications
- Supabase Realtime provides WebSocket broadcast with channel isolation
- `IEventBusPort` abstraction allows testing with `InProcessEventBusGateway`
- No new infrastructure to deploy or maintain

---

### Expected Changes

| File | Action | Purpose |
|------|--------|---------|
| **Domain Layer** |||
| `packages/domain/src/location/events/LocationUpdated.ts` | Create | Domain event for location updates with embedded sharing list |
| `packages/domain/src/location/events/index.ts` | Create | Barrel export for location events |
| `packages/domain/src/location/index.ts` | Modify | Add events to domain exports |
| **Use Cases Layer** |||
| `packages/use-cases/src/location/interactors/UpdateLocation.ts` | Modify | Add EventBusTag dependency, publish LocationUpdated event |
| `packages/use-cases/src/location/handlers/LocationBroadcastHandler.ts` | Create | Subscribes to LocationUpdated, fans out to friends via subscriptions |
| **Backend Server** |||
| `apps/backend-server/src/handlers/location-handlers.ts` | Create | Initialize handlers, subscribe to events, provide dependencies |
| `apps/backend-server/src/index.ts` | Modify | Call initializeLocationHandlers() on startup |
| **GraphQL Layer** |||
| `packages/frameworks/src/graphql/types/location/subscriptions.ts` | Create | GraphQL subscription for friend location updates |

**Total Files:** 8 (4 new, 4 modified)

---

## Implementation Process

### Overview

The implementation is organized into 4 phases with maximum parallelization. **Parallel with: X** markers indicate steps that can execute concurrently. **Critical Path:** 5 sequential steps (1.1 → 2.1 → 2.2 → 4.1 → 4.2 for final validation).

**Total Estimated Effort:** Medium (6 implementation steps, 8 files total: 5 new, 3 modified)

**Execution Groups:**
| Group | Steps | Agent | Can Parallelize |
|-------|-------|-------|-----------------|
| **Group 1** | 1.1, 1.2 | haiku | Yes (no dependencies) |
| **Group 2** | 2.1, 2.2 | sonnet | Yes (after Group 1) |
| **Group 3** | 3.1, 3.2 | sonnet | Yes (after Group 2) |
| **Group 4** | 4.1 | haiku | After Group 3 |
| **Group 5** | 4.2 | opus | Final validation (after all) |

---

### Phase 1: Setup

Setup phase establishes the foundational domain infrastructure. **Both steps have no external dependencies and can run in parallel.**

#### Step 1.1: Create LocationUpdated Domain Event
**Parallel with: 1.2** | **Agent: haiku** | **Group 1A**

**Goal:** Define the domain event structure for location updates with embedded sharing list.

**Output:**
- `packages/domain/src/location/events/LocationUpdated.ts` - Event class with payload
- `packages/domain/src/location/events/index.ts` - Barrel export
- Modified `packages/domain/src/location/index.ts` - Add events to exports

**Estimated Complexity:** Small (1-2 hours)

**Success Criteria:**
- [ ] `LocationUpdated` class extends `Data.TaggedEvent` with correct payload type
- [ ] Event includes: eventId (UUID), userId, coordinates (lat/long), accuracy, timestamp, sharingList (UserId[])
- [ ] Barrel export file created and re-exports the event
- [ ] Domain index.ts updated to export `* from "./events"`
- [ ] No compilation errors in `packages/domain`

**Subtasks:**
1. Define `LocationUpdatedEventPayload` interface with all required fields
2. Create `LocationUpdated` class using `Data.TaggedEvent("LocationUpdated")<LocationUpdatedEventPayload>`
3. Add type exports for the event payload
4. Create barrel export in `events/index.ts`
5. Update domain location index to include events

#### Verification

**Verification Level:** Panel

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| Type Safety | 0.25 | Proper Effect types, branded IDs (UserId), no `any` types, correct generic constraints |
| Domain Correctness | 0.25 | Follows DDD patterns, proper event structure with embedded sharing list, Data.TaggedEvent usage |
| Testability | 0.20 | Event easily testable, mockable, deterministic UUID generation for tests |
| Documentation | 0.15 | Clear JSDoc comments, exported types, barrel exports follow conventions |
| Error Handling | 0.15 | Event payload validation, defensive programming for edge cases |

**Threshold:** 4.0/5.0

**Judge Type:** Panel (3 independent judges with median consensus)

---

#### Step 1.2: Create Throttling Service
**Parallel with: 1.1** | **Agent: haiku** | **Group 1B**

**Goal:** Implement 1-second throttling service with replace-latest strategy keyed by userId.

**Output:**
- `packages/domain/src/shared/services/ThrottleService.ts` - Service with `shouldPublish` method
- Export added to `packages/domain/src/shared/index.ts`

**Estimated Complexity:** Small-Medium (2-3 hours)

**Success Criteria:**
- [ ] Service uses `Ref` for in-memory state management (Map<userId, {timestamp, pending}>`)
- [ ] `shouldPublish(userId, coordinates)` returns `Effect<boolean, never, never>`
- [ ] Logic: If last publish < 1000ms ago, replace pending update; return false for skipped
- [ ] If > 1000ms ago or no pending, accept update; return true
- [ ] Handles concurrent updates safely via Effect.Ref
- [ ] Unit tests demonstrate throttle behavior

**Subtasks:**
1. Define `ThrottleState` type as Map<UserId, PendingUpdate>`
2. Create `makeThrottleService` function returning `Ref<ThrottleState>`
3. Implement `shouldPublish` function with time window check
4. Add logic to replace pending update for same user
5. Export service from shared index

#### Verification

**Verification Level:** Panel

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| Concurrency Safety | 0.25 | Effect.Ref used correctly for atomic updates, no race conditions on concurrent location updates |
| Performance | 0.25 | Efficient Map operations, bounded memory usage, O(1) lookup/update complexity |
| Replace-Latest Logic | 0.20 | Correct 1000ms window check, pending updates replaced not queued, edge cases handled |
| Test Coverage | 0.15 | Unit tests demonstrate throttle behavior, rapid updates, concurrent access scenarios |
| Effect Integration | 0.15 | Proper Effect type signatures, no `any` types, idiomatic Effect patterns |

**Threshold:** 4.0/5.0

**Judge Type:** Panel (3 independent judges with median consensus)

---

### Phase 2: Foundational

Foundational phase builds the event pipeline and delivery mechanisms. **Both steps depend only on Group 1 and can run in parallel once Group 1 completes.**

#### Step 2.1: Modify UpdateLocation Use Case
**Parallel with: 2.2** | **Agent: sonnet** | **Group 2A**
**Dependencies: 1.1 (LocationUpdated), 1.2 (ThrottleService)**

**Goal:** Integrate EventBus publishing into the existing UpdateLocation use case with throttling.

**Output:**
- Modified `packages/use-cases/src/location/interactors/UpdateLocation.ts` - Add EventBus and Throttle integration

**Estimated Complexity:** Small-Medium (2-3 hours)

**Success Criteria:**
- [ ] Use case accepts `EventBusTag` and `ThrottleService` via Context
- [ ] After saving location to DB, queries sharing list (friend IDs)
- [ ] Calls `throttleService.shouldPublish(userId, coordinates)`
- [ ] If throttle returns true, publishes `LocationUpdated` event via `EventBusTag`
- [ ] Event payload includes embedded sharing list queried from repository
- [ ] Uses `Effect.gen` with proper yield* pattern
- [ ] Error handling: throttle failure does not block save operation

**Subtasks:**
1. Import `LocationUpdated` from domain
2. Add `EventBusTag` to Context dependencies
3. Inject `ThrottleService` (either as Context.Tag or direct import)
4. After location save, query `FriendshipPort` for friends with location sharing enabled
5. Call throttle service to determine if event should be published
6. If publishable, create event with sharing list and publish via EventBus
7. Ensure publish happens in background (does not block response)

#### Verification

**Verification Level:** Single

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| Effect Integration | 0.25 | Proper `Effect.gen` with `yield*`, Context.Tag injection for EventBus, no blocking operations |
| Event Publishing | 0.25 | LocationUpdated event created correctly, sharing list embedded at publish time, fire-and-forget pattern |
| Throttle Integration | 0.20 | ThrottleService called before publish, publish only when `shouldPublish` returns true |
| Error Handling | 0.15 | Throttle failure does not block save, publish errors logged not thrown, graceful degradation |
| Non-Blocking | 0.15 | Event publish does not block response to client, proper Effect forking or async handling |

**Threshold:** 4.0/5.0

**Judge Type:** Single (fresh context verification)

---

#### Step 2.2: Create LocationBroadcastHandler
**Parallel with: 2.1** | **Agent: sonnet** | **Group 2B**
**Dependencies: 1.1 (LocationUpdated event structure), Interface definition only**

**Goal:** Implement event handler that subscribes to LocationUpdated and fans out to friends.

**Output:**
- `packages/use-cases/src/location/handlers/LocationBroadcastHandler.ts` - Handler class
- Interface `LocationBroadcastService` defined for dependency injection

**Estimated Complexity:** Medium (3-4 hours)

**Success Criteria:**
- [ ] Handler implements `IEventHandler<LocationUpdated>` pattern
- [ ] `handle(event)` method extracts `sharingList` from event payload
- [ ] Creates parallel delivery using `Effect.all(deliveries, { concurrency: "unbounded" })`
- [ ] Each delivery wrapped with `Effect.catchAll` for error isolation
- [ ] Delivery pushes to GraphQL subscription streams (via injected service interface)
- [ ] Handler wrapped with outer `Effect.catchAll` to prevent EventBus disruption
- [ ] Logs successful and failed deliveries

**Subtasks:**
1. Define `LocationBroadcastService` interface (minimal: `broadcast(userId, update): Effect<void, never>`)
2. Define handler class with constructor accepting `LocationBroadcastService`
3. Implement `handle` method that destructures event payload
4. Map `sharingList` to array of delivery Effects
5. Each delivery: push to friend's subscription stream with timeout
6. Wrap each delivery with `Effect.catchAll(error => Effect.logWarning)`
7. Use `Effect.all` with unbounded concurrency for parallel fan-out
8. Wrap entire handler body with catchAll to prevent EventBus crash

#### Verification

**Verification Level:** Panel

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| Error Isolation | 0.25 | Each delivery wrapped with `Effect.catchAll`, one failure does not block others, outer handler catchAll prevents EventBus crash |
| Parallel Fan-out | 0.25 | `Effect.all` with `concurrency: "unbounded"`, all friends processed in parallel, no sequential blocking |
| Event Bus Integration | 0.20 | Implements `IEventHandler<LocationUpdated>`, subscribes to correct channel, proper error wrapping at handler level |
| Logging/Observability | 0.15 | Failed deliveries logged with Effect.logWarning, successful deliveries logged, metrics where appropriate |
| Type Safety | 0.15 | No `any` types, branded IDs used correctly, proper Effect type signatures throughout |

**Threshold:** 4.0/5.0

**Judge Type:** Panel (3 independent judges with median consensus)

---

### Phase 3: User Stories

User Stories phase implements the delivery mechanism and GraphQL integration. **Both steps depend on Group 2 and can run in parallel once Group 2 completes.**

#### Step 3.1: Create GraphQL Subscription
**Parallel with: 3.2** | **Agent: sonnet** | **Group 3A**
**Dependencies: 2.2 (Handler interface defines subscription requirements)**

**Goal:** Implement GraphQL subscription for real-time friend location updates.

**Output:**
- `packages/frameworks/src/graphql/types/location/subscriptions.ts` - Pothos subscription
- Export added to `packages/frameworks/src/graphql/types/location/index.ts`

**Estimated Complexity:** Small-Medium (2-3 hours)

**Success Criteria:**
- [ ] Subscription `friendLocationEvent` defined with Pothos builder
- [ ] Input: `friendId` (UserId) to subscribe to specific friend's updates
- [ ] Output type: `{ userId, latitude, longitude, accuracy, timestamp }`
- [ ] Uses async iterator or Effect.Stream for real-time updates
- [ ] Subscription resolver integrates with LocationBroadcastService
- [ ] Proper authorization: only friends with sharing enabled receive updates
- [ ] Schema generates without errors

**Subtasks:**
1. Define subscription type in Pothos builder
2. Define input args (friendId: UserId)
3. Define output type with location fields
4. Implement resolver that returns AsyncIterable or Stream
5. Integrate with LocationBroadcastService to receive events
6. Add authorization check (viewer must be in friend's sharing list)
7. Export subscription from location types index

#### Verification

**Verification Level:** Single

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| GraphQL Compliance | 0.25 | Pothos builder patterns followed, proper type definitions, schema generates without errors |
| Authorization | 0.25 | Subscription validates viewer is in friend's sharing list, proper access control enforced |
| Real-time Delivery | 0.20 | AsyncIterable or Effect.Stream implementation, updates delivered within 500ms target |
| Type Safety | 0.15 | Branded UserId types, proper GraphQL scalars, no `any` types in resolver |
| Error Handling | 0.15 | Subscription errors handled gracefully, no crashes on disconnect, proper cleanup |

**Threshold:** 4.0/5.0

**Judge Type:** Single (fresh context verification)

---

#### Step 3.2: Implement LocationBroadcastService
**Parallel with: 3.1** | **Agent: sonnet** | **Group 3B**
**Dependencies: 2.2 (Handler interface), 3.1 (Subscription interface)**

**Goal:** Create the service that bridges handler and GraphQL subscriptions.

**Output:**
- `packages/frameworks/src/location/LocationBroadcastService.ts` - Service implementation
- Export added to `packages/frameworks/src/location/index.ts`

**Estimated Complexity:** Small-Medium (2-3 hours)

**Success Criteria:**
- [ ] Service implements `LocationBroadcastService` interface from 2.2
- [ ] Service maintains Map<userId, Set<Subscriber>> for active subscriptions
- [ ] `subscribe(userId, subscriber)` adds subscriber to set
- [ ] `unsubscribe(userId, subscriber)` removes subscriber
- [ ] `broadcast(userId, locationUpdate)` pushes to all subscribers for user
- [ ] Uses Effect for all operations (async-safe)
- [ ] Handles subscriber cleanup on disconnect
- [ ] Integrates with handler from Step 2.2

**Subtasks:**
1. Define `Subscriber` type (callback or stream sink)
2. Create service class with private subscriber Map
3. Implement subscribe/unsubscribe methods
4. Implement broadcast method that iterates subscribers
5. Add error isolation per subscriber
6. Export service and interface

#### Verification

**Verification Level:** Single

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| Memory Management | 0.25 | Map<userId, Set<Subscriber>> correctly maintained, subscribers cleaned up on disconnect, no memory leaks |
| Effect Integration | 0.25 | All operations return Effect, proper async-safety, no blocking calls in broadcast |
| Error Isolation | 0.20 | Per-subscriber error handling with `Effect.catchAll`, one subscriber failure does not affect others |
| Interface Compliance | 0.15 | Implements `LocationBroadcastService` interface from Step 2.2, method signatures match |
| Cleanup | 0.15 | Unsubscribe properly removes from Set, handles edge cases (double unsubscribe, etc.) |

**Threshold:** 4.0/5.0

**Judge Type:** Single (fresh context verification)

---

### Phase 4: Polish

Polish phase integrates everything and validates the complete system. **Step 4.2 must wait for all previous steps to complete.**

#### Step 4.1: Register Handler and Wire Dependencies
**Agent: haiku** | **Group 4**
**Dependencies: 2.2 (Handler), 3.1 (GraphQL), 3.2 (BroadcastService)**

**Goal:** Bootstrap the location event handler in the backend server.

**Output:**
- `apps/backend-server/src/handlers/location-handlers.ts` - Handler initialization
- Modified `apps/backend-server/src/index.ts` - Call handler initialization on startup

**Estimated Complexity:** Small (1-2 hours)

**Success Criteria:**
- [ ] `initializeLocationHandlers()` function created
- [ ] Function subscribes `LocationBroadcastHandler` to EventBus
- [ ] Provides all required dependencies (EventBus, LocationBroadcastService)
- [ ] Handler subscribed to `LocationUpdated` event channel
- [ ] Backend server calls initializer on startup
- [ ] No startup errors, handler registered successfully
- [ ] Logs confirm handler subscription

**Subtasks:**
1. Create handler initialization file
2. Import LocationBroadcastHandler from use-cases
3. Import EventBus from adapters
4. Create and provide LocationBroadcastService instance
5. Subscribe handler to EventBus for LocationUpdated events
6. Export initialization function
7. Import and call in backend-server index.ts
8. Add logging for successful registration

#### Verification

**Verification Level:** Single

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| Wiring Correctness | 0.30 | All dependencies (EventBus, LocationBroadcastService) properly provided, handler subscribed to correct channel |
| Bootstrap Safety | 0.25 | No startup failures, proper initialization order, handler registration logged |
| Observability | 0.25 | Clear logging for successful registration, error logging for failures, health check indicators |
| Cleanup | 0.20 | Shutdown handling where applicable, graceful unsubscribe on application stop |

**Threshold:** 3.5/5.0

**Judge Type:** Single (fresh context verification)

---

#### Step 4.2: Integration Testing and Validation
**Agent: opus** | **Group 5 (Final Validation)**
**Dependencies: All previous steps (1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1)**

**Goal:** Validate the complete event-driven location sharing flow.

**Output:**
- Integration test demonstrating end-to-end flow
- Throttling behavior validation
- Handler isolation verification

**Estimated Complexity:** Medium (2-3 hours)

**Success Criteria:**
- [ ] Integration test: location update → event published → handler receives → subscription delivers
- [ ] Throttle test: 5 rapid updates result in 1 published event (latest only)
- [ ] Fan-out test: single event delivers to multiple subscribers
- [ ] Error isolation test: one subscriber failure does not affect others
- [ ] Fire-and-forget test: offline subscriber does not block delivery
- [ ] All tests pass in CI

**Subtasks:**
1. Write integration test for happy path
2. Write test for throttle behavior (rapid updates)
3. Write test for fan-out to multiple friends
4. Write test for error isolation (simulated subscriber failure)
5. Verify subscription receives updates within 500ms target

#### Verification

**Verification Level:** Single

**Custom Rubric:**

| Criteria | Weight | Description |
|----------|--------|-------------|
| Test Coverage | 0.30 | Happy path, throttle behavior, fan-out, error isolation, fire-and-forget all covered |
| Test Accuracy | 0.25 | Tests actually verify the claimed behavior, assertions are correct and meaningful |
| Maintainability | 0.20 | Clear test structure, readable test names, proper setup/teardown, DRY where appropriate |
| Effect Testing | 0.15 | Proper use of `Effect.either`, `Either.isLeft`/`Either.isRight`, `Either.match` patterns |
| Performance | 0.10 | Throttle timing validated, 500ms delivery target verified |

**Threshold:** 3.5/5.0

**Judge Type:** Single (fresh context verification)

---

### Verification Summary

| Step | Artifact | Level | Threshold | Judge Type |
|------|----------|-------|-----------|------------|
| 1.1 | LocationUpdated Domain Event | HIGH | 4.0/5.0 | Panel |
| 1.2 | ThrottleService | HIGH | 4.0/5.0 | Panel |
| 2.1 | UpdateLocation Modification | MEDIUM | 4.0/5.0 | Single |
| 2.2 | LocationBroadcastHandler | HIGH | 4.0/5.0 | Panel |
| 3.1 | GraphQL Subscription | MEDIUM | 4.0/5.0 | Single |
| 3.2 | LocationBroadcastService | MEDIUM | 4.0/5.0 | Single |
| 4.1 | Handler Registration | LOW | 3.5/5.0 | Single |
| 4.2 | Integration Tests | LOW | 3.5/5.0 | Single |

---

### Blockers and Resolutions Summary

| Blocker | Resolution | Status |
|---------|------------|--------|
| EventBus naming convention | Check EventBusPort.ts | Pending |
| Ref usage pattern | Search codebase for Effect.Ref examples | Pending |
| EventBus publishing pattern | Reference notification interactor | Pending |
| FriendshipPort for sharing list | Check domain friendship ports | Pending |
| Pothos subscription pattern | Check existing subscription implementations | Pending |
| Notification handler pattern | Reference notification-handlers.ts | Pending |

---

### Risk Table with Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Throttle state grows unbounded (memory leak) | Low | High | Add periodic cleanup; limit max entries in Map | Step 1.2 |
| GraphQL subscription backpressure | Medium | Medium | Fire-and-forget delivery; document capacity limits (100 concurrent friends) | Step 3.1 |
| EventBus channel collision | Low | High | Use namespace prefix: `domain-events-locationupdated` | Step 2.1 |
| Sharing list stale at fan-out | Medium | Low | Accept eventual consistency; sharing list embedded at publish time | Step 2.1 |
| Handler crash stops EventBus | Low | High | Wrap all handlers with Effect.catchAll (existing pattern) | Step 2.2 |
| Subscription memory leak (orphaned subscribers) | Medium | Medium | Implement cleanup on disconnect; use WeakRef if appropriate | Step 3.2 |
| Concurrent update race in throttle | Medium | High | Use Effect.Ref for atomic state updates | Step 1.2 |

---

### Implementation Summary Table

| Phase | Step | Goal | Output | Complexity | Agent | Dependencies | Parallel Group |
|-------|------|------|--------|------------|-------|--------------|----------------|
| **Setup** | 1.1 | Domain Event | `LocationUpdated.ts`, barrel exports | Small | haiku | None | 1A |
| **Setup** | 1.2 | Throttle Service | `ThrottleService.ts` | Small-Medium | haiku | None | 1B |
| **Foundational** | 2.1 | UpdateLocation UC | Modified `UpdateLocation.ts` | Small-Medium | sonnet | 1.1, 1.2 | 2A |
| **Foundational** | 2.2 | Event Handler | `LocationBroadcastHandler.ts` | Medium | sonnet | 1.1 | 2B |
| **User Stories** | 3.1 | GraphQL Subscription | `subscriptions.ts` | Small-Medium | sonnet | 2.2 | 3A |
| **User Stories** | 3.2 | Broadcast Service | `LocationBroadcastService.ts` | Small-Medium | sonnet | 2.2, 3.1 | 3B |
| **Polish** | 4.1 | Handler Registration | `location-handlers.ts`, bootstrapping | Small | haiku | 2.2, 3.1, 3.2 | 4 |
| **Polish** | 4.2 | Integration Tests | End-to-end validation | Medium | opus | All | 5 |

**Total Steps:** 8
**Critical Path:** 1.1 → 2.1 → 2.2 → 4.1 → 4.2 (can complete in ~9-11 hours with parallelization vs ~18 hours sequential)
**Parallelizable Groups:**
- **Group 1 (A/B):** Steps 1.1, 1.2 (no dependencies, run in parallel, ~2-3 hours)
- **Group 2 (A/B):** Steps 2.1, 2.2 (after Group 1, run in parallel, ~3-4 hours)
- **Group 3 (A/B):** Steps 3.1, 3.2 (after Group 2, run in parallel, ~2-3 hours)
- **Group 4:** Step 4.1 (after Group 3, ~1-2 hours)
- **Group 5:** Step 4.2 (final validation, after all, ~2-3 hours)

---

## Execution

Execute with sub-agent delegation following the parallel group structure above.

**Directive:** Launch sub-agents per parallel group using `/sadd:do-in-parallel`:

1. **Group 1 Launch:** Steps 1.1 (haiku) + 1.2 (haiku) in parallel - no dependencies
2. **Group 2 Launch:** Steps 2.1 (sonnet) + 2.2 (sonnet) in parallel - after Group 1
3. **Group 3 Launch:** Steps 3.1 (sonnet) + 3.2 (sonnet) in parallel - after Group 2
4. **Group 4 Launch:** Step 4.1 (haiku) - after Group 3
5. **Group 5 Launch:** Step 4.2 (opus) - final validation after all

**Quality Gates:**
- Each group requires `/sadd:judge` verification before next group launches
- Final group (4.2) requires comprehensive integration testing
- Block on any compilation or test failures

**Command:**
```
/sadd:do-in-parallel --group "1.1,1.2" --after-complete "1.*" then /sadd:do-in-parallel --group "2.1,2.2" --after-complete "2.*" then /sadd:do-in-parallel --group "3.1,3.2" --after-complete "3.*" then /sadd:do-and-judge --step "4.1" --agent haiku then /sadd:do-and-judge --step "4.2" --agent opus
```

---

### Definition of Done

**Functional Criteria:**
- [ ] Location update publishes `LocationUpdated` event to EventBus
- [ ] Throttle service limits to 1 event per second per user (replace-latest)
- [ ] Event includes embedded sharing list (friend IDs)
- [ ] Handler fans out to all friends in parallel with error isolation
- [ ] GraphQL subscription receives real-time updates
- [ ] Offline friends handled with fire-and-forget (no blocking)

**Technical Criteria:**
- [ ] All 8 implementation steps completed
- [ ] 5 new files created, 3 files modified as specified
- [ ] No type errors (`bun typecheck` passes)
- [ ] All unit and integration tests pass (`bun test`)
- [ ] GraphQL schema generates without errors
- [ ] Effect patterns followed (Effect.gen, Context.Tag, error handling)
- [ ] Branded ID types used consistently
- [ ] No `any` types or unsafe casts

**Quality Criteria:**
- [ ] Code follows existing codebase patterns
- [ ] Error handling includes proper logging
- [ ] Handler failure does not crash EventBus
- [ ] Throttle service handles concurrent updates safely
- [ ] Subscription cleanup prevents memory leaks

**Acceptance Criteria Verification:**
- [ ] AC1: Event published with sharing list
- [ ] AC2: Throttle works (1-second replace-latest)
- [ ] AC3: Sharing list embedded in event
- [ ] AC4: Fan-out to friends works
- [ ] AC5: GraphQL subscription receives events
- [ ] AC6: Offline friends fire-and-forget
- [ ] AC7: Handler failure isolation verified

---

## Related

- Brainstorm document: `.specs/scratchpad/business-analysis-location-sharing.md`
- Existing EventBus implementation: `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts`
- EventBus port interface: `packages/domain/src/shared/events/EventBusPort.ts`
- Handler pattern reference: `apps/backend-server/src/handlers/notification-handlers.ts`
