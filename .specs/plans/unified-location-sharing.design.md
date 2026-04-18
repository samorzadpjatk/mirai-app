# Unified Event-Driven Architecture: Location Sharing via EventBus

## Overview

This design unifies location sharing with the existing notification architecture by adopting the same EventBus pattern. Location updates become domain events that flow through the IEventBusPort abstraction, enabling real-time distribution to authorized friends.

## Current State Analysis

### Notifications Architecture (Reference)

Notifications use a clean event-driven architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│ SendNotificationToAll Use Case                                 │
│   1. Write notification to DB                                   │
│   2. Publish NotificationCreated event via EventBusTag       │
└────────────────┬────────────────────────────────────────────────┘
                 │ publish
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ SupabaseRealtimeEventBusGateway                                 │
│   - Broadcasts via Supabase Realtime                            │
└────────────────┬────────────────────────────────────────────────┘
                 │ broadcast
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ NotificationSendHandler                                         │
│   - Subscribes to NotificationCreated                           │
│   - Sends push notifications via Expo                           │
└─────────────────────────────────────────────────────────────────┘
```

### Location Sharing Current State

Location sharing uses direct database operations without domain events:

```
┌─────────────────────────────────────────────────────────────────┐
│ UpdateLocationStream Use Case                                   │
│   1. Check trip participation                                   │
│   2. Write location to DB via LocationPort                      │
│   3. Return static result                                       │
└─────────────────────────────────────────────────────────────────┘
```

### The Redundancy Question

**IRealtimePort** and the concept of **PubSubPort** serve different purposes:

| Port | Purpose | Abstraction Level |
|------|---------|-------------------|
| **IRealtimePort** | Low-level Supabase Realtime (subscribe/broadcast to channels) | Infrastructure |
| **IEventBusPort** | High-level domain event bus (publish/subscribe to domain events) | Domain |

**Recommendation**: Consolidate on **IEventBusPort** for all event-driven features including location sharing.

## Design Principles

1. **Unified Architecture**: Location sharing uses the same EventBus pattern as notifications
2. **Domain Events First**: Location updates are domain events, not just database writes
3. **Fan-out Pattern**: Single location update event broadcasts to N authorized friends
4. **Minimal Redundancy**: Reuse existing infrastructure (SupabaseRealtimeEventBusGateway)
5. **Clean Separation**: Domain events travel via EventBus, client subscriptions via GraphQL

## Architecture

### Domain Events

Create two new domain events in `packages/domain/src/location/events/`:

#### LocationUpdated

```typescript
// packages/domain/src/location/events/LocationUpdated.ts
export class LocationUpdated implements IDomainEvent {
  readonly _tag = "LocationUpdated";
  readonly version = 1;

  constructor(
    readonly aggregateId: LocationId,
    readonly userId: UserId,
    readonly latitude: number,
    readonly longitude: number,
    readonly accuracy: number | null,
    readonly timestamp: Date,
    readonly sharingWithUserIds: UserId[],  // Who can see this update
    readonly occurredAt: Date,
  ) {}
}
```

#### LocationSharingStarted / LocationSharingStopped

```typescript
// packages/domain/src/location/events/LocationSharingStatusChanged.ts
export class LocationSharingStatusChanged implements IDomainEvent {
  readonly _tag = "LocationSharingStatusChanged";
  readonly version = 1;

  constructor(
    readonly aggregateId: LocationId,
    readonly userId: UserId,
    readonly isSharing: boolean,
    readonly sharingWithUserIds: UserId[],
    readonly occurredAt: Date,
  ) {}
}
```

### Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ UpdateLocation Use Case                                         │
│   1. Validate coordinates                                       │
│   2. Write location to DB via LocationPort                      │
│   3. Query sharing list (users who can see this location)      │
│   4. Publish LocationUpdated event via EventBusTag             │
└────────────────┬────────────────────────────────────────────────┘
                 │ publish(LocationUpdated)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ SupabaseRealtimeEventBusGateway                                 │
│   Channel: domain-events-locationupdated                        │
│   Payload: { userId, lat, lng, timestamp, sharingWithUserIds } │
└────────────────┬────────────────────────────────────────────────┘
                 │ broadcast to Supabase Realtime
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ LocationEventHandler (Backend)                                  │
│   - Subscribes to LocationUpdated                               │
│   - Fan-out: For each user in sharingWithUserIds:               │
│     - Query user's active subscriptions                         │
│     - Push to GraphQL subscription stream                       │
└─────────────────────────────────────────────────────────────────┘
```

### Handler Implementation

```typescript
// apps/backend-server/src/handlers/location-handlers.ts
export function initializeLocationHandlers() {
  return Effect.gen(function* () {
    const eventBus = yield* EventBusTag;
    const subscriptionManager = yield* SubscriptionManagerTag;

    const subscriptionResult = yield* eventBus.subscribe<LocationUpdated>(
      "LocationUpdated",
      (event) => Effect.gen(function* () {
        // Fan-out to all authorized friends
        for (const friendUserId of event.sharingWithUserIds) {
          const friendSubscriptions = subscriptionManager
            .getLocationSubscriptions(friendUserId);

          for (const subscription of friendSubscriptions) {
            subscription.push({
              type: "upsert",
              location: {
                id: event.aggregateId,
                userId: event.userId,
                latitude: event.latitude,
                longitude: event.longitude,
                // ... other fields
              },
            });
          }
        }
      })
    );

    return { cleanup: subscriptionResult.unsubscribe };
  });
}
```

### GraphQL Subscription

```typescript
// packages/frameworks/src/graphql/types/location/subscriptions.ts
export const locationSubscriptions = builder.subscriptionFields((t) => ({
  friendLocations: t.field({
    type: FriendLocationEvent,
    authScopes: { authenticated: true },
    subscribe: async function* (_parent, _args, ctx) {
      const userId = ctx.authContext.userId;
      const subscriptionManager = ctx.subscriptionManager;

      // Register this connection for the user
      const subscription = subscriptionManager.createLocationSubscription(userId);

      try {
        while (true) {
          const event = await subscription.next();
          yield event;
        }
      } finally {
        subscriptionManager.removeLocationSubscription(userId, subscription.id);
      }
    },
  }),
}));
```

## Data Flow

### Sequence Diagram

```
Client A (Updater)              Backend                    Supabase RT              Client B (Viewer)
     │                            │                           │                          │
     │  1. updateLocation()       │                           │                          │
     │ ────────────────────────>  │                           │                          │
     │                            │  2. DB write              │                          │
     │                            │ ────────────────────────> │                          │
     │                            │                           │                          │
     │                            │  3. query sharing list    │                          │
     │                            │ (who can see this loc?)   │                          │
     │                            │                           │                          │
     │                            │  4. publish EventBus      │                          │
     │                            │ ──────────────────────────┼───────────────────────>  │
     │                            │                           │                          │
     │                            │                           │  5. broadcast            │
     │                            │ <─────────────────────────│                          │
     │                            │                           │                          │
     │                            │  6. fan-out to friends    │                          │
     │                            │    (in-memory dispatch)   │                          │
     │                            │                           │                          │
     │                            │                           │       7. push via GraphQL│
     │                            │ ──────────────────────────────────────────────────>  │
     │                            │                           │                          │
     │       8. success response  │                           │                          │
     │ <───────────────────────   │                           │                          │
     │                            │                           │                          │
```

## Component Design

### Domain Layer

```
packages/domain/src/location/
├── entities/
│   ├── Location.ts
│   └── LocationSharingRequest.ts
├── value-objects/
│   └── LocationId.ts
├── events/
│   ├── LocationUpdated.ts           [NEW]
│   └── LocationSharingStatusChanged.ts  [NEW]
└── ports/
    └── LocationPort.ts
```

### Use Cases Layer

```
packages/use-cases/src/location/
├── interactors/
│   ├── UpdateLocation.ts            [MODIFY]
│   ├── UpdateLocationStream.ts      [DEPRECATE - merge into UpdateLocation]
│   └── ...
├── handlers/
│   └── LocationEventHandler.ts      [NEW]
└── ports/
    └── LocationPort.ts
```

### Adapter Layer

```
packages/adapters/src/location/
├── gateways/
│   └── drizzle/
│       └── LocationDrizzleGateway.ts  [ADD: query sharing list]
└── controllers/
    └── LocationController.ts        [ADD: GraphQL subscription support]
```

### Framework Layer

```
packages/frameworks/src/graphql/types/location/
├── types.ts
├── queries.ts
├── mutations.ts
└── subscriptions.ts                  [NEW]
```

## Error Handling

| Error | Handling |
|-------|----------|
| DB write fails | Return error to client A, no event published |
| EventBus publish fails | Log error, location still persisted |
| Fan-out fails for specific friend | Log error, other friends still notified |
| GraphQL subscription disconnect | Remove from subscription manager |

## Testing Strategy

### Unit Tests

```typescript
// LocationUpdated event
it("creates valid LocationUpdated event", async () => {
  const event = new LocationUpdated({
    aggregateId: LocationId.generate(),
    userId: UserId.generate(),
    latitude: 52.5200,
    longitude: 13.4050,
    accuracy: 10,
    timestamp: new Date(),
    sharingWithUserIds: [friendId1, friendId2],
    occurredAt: new Date(),
  });

  expect(event._tag).toBe("LocationUpdated");
  expect(event.sharingWithUserIds).toHaveLength(2);
});
```

### Integration Tests

```typescript
// Event flow
it("publishes LocationUpdated event on location update", async () => {
  const eventBus = new InProcessEventBusGateway();
  const handler = new LocationEventHandler();
  
  // Subscribe to events
  await Effect.runPromise(
    eventBus.subscribe("LocationUpdated", handler.handle)
  );

  // Execute use case
  const useCase = new UpdateLocationUseCase();
  await Effect.runPromise(
    useCase.execute(input).pipe(
      Effect.provide(createTestLayer({ eventBus }))
    )
  );

  // Verify handler received event
  expect(handler.receivedEvents).toHaveLength(1);
  expect(handler.receivedEvents[0]._tag).toBe("LocationUpdated");
});
```

## Migration Path

### Phase 1: Add Domain Events (Week 1)

1. Create `LocationUpdated` and `LocationSharingStatusChanged` events
2. Modify `UpdateLocation` use case to publish events
3. Add handler initialization to backend-server

### Phase 2: GraphQL Subscriptions (Week 2)

1. Create subscription manager for in-memory stream tracking
2. Add GraphQL subscription resolvers
3. Connect handler to subscription manager

### Phase 3: Deprecation (Week 3)

1. Deprecate `UpdateLocationStream` use case
2. Migrate native app to GraphQL subscriptions
3. Remove redundant RealtimePort if no other consumers

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Architecture | Direct DB queries | Event-driven with EventBus |
| Consistency | Different pattern from notifications | Same pattern as notifications |
| Fan-out | Client polls | Server pushes via event subscription |
| Testability | Hard to test streaming | Easy to test with InProcessEventBus |
| Scalability | DB pressure from polling | Event-driven fan-out |

## Open Questions

1. **Frequency**: How often should location updates be published? (throttle in use case?)
2. **Batching**: Should we batch rapid updates before publishing events?
3. **Offline Friends**: Should events queue for offline friends or use push notifications?
4. **Privacy**: Should sharing list be embedded in event or queried by handler?

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
 | 2026-04-18 | Use EventBus pattern for location sharing | Unifies architecture with notifications; enables proper fan-out |
| 2026-04-18 | Embed sharing list in event | Handler can immediately fan-out without extra DB query |
| 2026-04-18 | Keep Supabase Realtime for EventBus transport | Reuse existing infrastructure; no new dependencies |
