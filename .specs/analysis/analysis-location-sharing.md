# Analysis: Unified Event-Driven Location Sharing via EventBus

## Executive Summary

This analysis documents the current state and required changes for implementing unified event-driven location sharing via the EventBus pattern. The goal is to migrate from synchronous/polling location sharing to a pub-sub architecture where location updates are published as domain events and consumed by authorized subscribers.

---

## Current Architecture Overview

### Existing Location Domain

**Entities (packages/domain/src/location/entities/)**
- `Location.ts` - Represents user's GPS location with sharing preferences
- `LocationSharingRequest.ts` - Represents location sharing requests between users

**Ports (packages/domain/src/location/ports/)**
- `LocationPort.ts` - ILocationPort interface (146 lines)
- `LocationSharingRequestPort.ts` - ILocationSharingRequestPort interface (35 lines)

**Value Objects (packages/domain/src/location/value-objects/)**
- `LocationId.ts` - CUID-based branded ID for Location and LocationSharingRequest

### Current Use Cases (packages/use-cases/src/location/interactors/)

| Use Case | File | Purpose |
|----------|------|---------|
| UpdateLocation | UpdateLocation.ts | Updates user location, validates active trip |
| RequestLocationSharing | RequestLocationSharing.ts | Sends location sharing request |
| AcceptLocationSharingRequest | AcceptLocationSharingRequest.ts | Accepts pending request, connects sharing |
| RejectLocationSharingRequest | RejectLocationSharingRequest.ts | Rejects pending request |
| AddUserToSharing | AddUserToSharing.ts | Adds user to sharing list |
| RemoveUserFromSharing | RemoveUserFromSharing.ts | Removes user from sharing list |
| UpdateSharingSettings | UpdateSharingSettings.ts | Updates sharing settings |
| GetMyLocation | GetMyLocation.ts | Gets current user's location |
| GetFriendsLocations | GetFriendsLocations.ts | Gets friends' locations |
| GetMySharingSettings | GetMySharingSettings.ts | Gets sharing settings |
| GetAllUsersForSharing | GetAllUsersForSharing.ts | Lists available users |
| GetPendingLocationSharingRequests | GetPendingLocationSharingRequests.ts | Lists pending requests |
| GetMyLocationSharingRequests | GetMyLocationSharingRequests.ts | Lists sent/received requests |

### EventBus Infrastructure (Already Implemented)

**Domain Layer (packages/domain/src/shared/events/)**
- `DomainEvent.ts` - IDomainEvent interface with _tag, aggregateId, occurredAt, version
- `EventBusPort.ts` - IEventBusPort interface with publish() and subscribe() methods
- `EventHandler.ts` - IEventHandler<T, R> interface for type-safe event handlers

**Use Cases Layer (packages/use-cases/src/shared/ports/)**
- `EventBusPort.ts` - EventBusTag Context.Tag for Effect DI

**Adapters Layer (packages/adapters/src/shared/gateways/)**
- `SupabaseRealtimeEventBusGateway.ts` - Production implementation using Supabase Realtime broadcast
- `InProcessEventBusGateway.ts` - Testing implementation with synchronous execution

**Frameworks Layer (packages/frameworks/src/di/)**
- `layer/service.ts` - Wires SupabaseRealtimeEventBusGateway to EventBusTag
- `layer/app.ts` - Composes service layer with repository layer

### Notification Reference Implementation

The notification module provides the blueprint for event-driven architecture:

**Domain Event (packages/domain/src/notification/events/)**
- `NotificationCreated.ts` - Domain event with _tag="NotificationCreated"

**Event Handler (packages/use-cases/src/notification/handlers/)**
- `NotificationSendHandler.ts` - Implements IEventHandler<NotificationCreated, ...>
  - Fetches push subscriptions
  - Sends notifications via Expo API
  - Tracks delivery status
  - Error isolation with catchAll

**Handler Registration (apps/backend-server/src/handlers/)**
- `notification-handlers.ts` - initializeNotificationHandlers() function
  - Subscribes NotificationSendHandler to "NotificationCreated" events
  - Provides dependencies via Layer composition
  - Returns cleanup function for graceful shutdown

**Server Integration (apps/backend-server/src/index.ts)**
- Calls initializeNotificationHandlers() before HTTP server starts
- Stores cleanup function for SIGTERM/SIGINT handling

---

## Files to Modify

### 1. Domain Layer (packages/domain/src/location/)

**Modify:**
- `index.ts` - Add events export

### 2. Use Cases Layer (packages/use-cases/src/location/)

**Modify:**
- `interactors/UpdateLocation.ts` - Add EventBusTag dependency, publish LocationUpdated event
- `interactors/RequestLocationSharing.ts` - Add EventBusTag dependency, publish LocationSharingRequested event
- `interactors/AcceptLocationSharingRequest.ts` - Add EventBusTag dependency, publish LocationSharingAccepted event
- `interactors/RejectLocationSharingRequest.ts` - Add EventBusTag dependency, publish LocationSharingRejected event
- `interactors/AddUserToSharing.ts` - Add EventBusTag dependency, publish UserAddedToSharing event
- `interactors/RemoveUserFromSharing.ts` - Add EventBusTag dependency, publish UserRemovedFromSharing event
- `interactors/index.ts` - Add handler exports

### 3. Backend Server (apps/backend-server/src/)

**Modify:**
- `handlers/notification-handlers.ts` - Rename to `event-handlers.ts` or create separate `location-handlers.ts`
- `index.ts` - Add initializeLocationHandlers() call alongside notification handlers

---

## Files to Create

### Domain Layer

```
packages/domain/src/location/
├── events/
│   ├── index.ts                           # Barrel export
│   ├── LocationUpdated.ts                 # Event when user updates location
│   ├── LocationSharingRequested.ts        # Event when sharing requested
│   ├── LocationSharingAccepted.ts         # Event when request accepted
│   ├── LocationSharingRejected.ts         # Event when request rejected
│   ├── UserAddedToSharing.ts              # Event when user added to sharing
│   └── UserRemovedFromSharing.ts          # Event when user removed from sharing
```

### Use Cases Layer

```
packages/use-cases/src/location/
├── handlers/
│   ├── index.ts                           # Barrel export
│   ├── LocationBroadcastHandler.ts        # Broadcasts location to authorized users
│   ├── LocationSharingRequestHandler.ts   # Handles LocationSharingRequested event
│   └── LocationSharingStatusHandler.ts    # Handles accept/reject/add/remove events
```

### Backend Server

```
apps/backend-server/src/handlers/
├── location-handlers.ts                   # initializeLocationHandlers() function
```

### GraphQL Layer (Optional)

```
packages/frameworks/src/graphql/types/location/
├── index.ts
├── types.ts
├── queries.ts
├── mutations.ts
└── subscriptions.ts                       # Real-time location subscriptions
```

---

## Key Interfaces and Signatures

### Domain Events

**LocationUpdated Event**
```typescript
export class LocationUpdated implements IDomainEvent {
  readonly _tag = "LocationUpdated";
  readonly version = 1;
  
  constructor(
    readonly aggregateId: LocationId,
    readonly userId: UserId,
    readonly latitude: number,
    readonly longitude: number,
    readonly accuracy: number | null,
    readonly altitude: number | null,
    readonly heading: number | null,
    readonly speed: number | null,
    readonly timestamp: Date,
    readonly occurredAt: Date,
  ) {}
}
```

**LocationSharingRequested Event**
```typescript
export class LocationSharingRequested implements IDomainEvent {
  readonly _tag = "LocationSharingRequested";
  readonly version = 1;
  
  constructor(
    readonly aggregateId: LocationSharingRequestId,
    readonly senderId: UserId,
    readonly receiverId: UserId,
    readonly occurredAt: Date,
  ) {}
}
```

**LocationSharingAccepted Event**
```typescript
export class LocationSharingAccepted implements IDomainEvent {
  readonly _tag = "LocationSharingAccepted";
  readonly version = 1;
  
  constructor(
    readonly aggregateId: LocationSharingRequestId,
    readonly senderId: UserId,
    readonly receiverId: UserId,
    readonly occurredAt: Date,
  ) {}
}
```

**LocationSharingRejected Event**
```typescript
export class LocationSharingRejected implements IDomainEvent {
  readonly _tag = "LocationSharingRejected";
  readonly version = 1;
  
  constructor(
    readonly aggregateId: LocationSharingRequestId,
    readonly senderId: UserId,
    readonly receiverId: UserId,
    readonly occurredAt: Date,
  ) {}
}
```

**UserAddedToSharing Event**
```typescript
export class UserAddedToSharing implements IDomainEvent {
  readonly _tag = "UserAddedToSharing";
  readonly version = 1;
  
  constructor(
    readonly aggregateId: LocationId,
    readonly ownerId: UserId,
    readonly addedUserId: UserId,
    readonly occurredAt: Date,
  ) {}
}
```

**UserRemovedFromSharing Event**
```typescript
export class UserRemovedFromSharing implements IDomainEvent {
  readonly _tag = "UserRemovedFromSharing";
  readonly version = 1;
  
  constructor(
    readonly aggregateId: LocationId,
    readonly ownerId: UserId,
    readonly removedUserId: UserId,
    readonly occurredAt: Date,
  ) {}
}
```

### Event Handlers

**LocationBroadcastHandler**
```typescript
export class LocationBroadcastHandler
  implements IEventHandler<LocationUpdated, LocationPortTag | EventBusTag>
{
  readonly eventTag = "LocationUpdated";
  
  handle(event: LocationUpdated): Effect.Effect<void, never, LocationPortTag | EventBusTag> {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      
      // Fetch users who should receive this update
      const sharingUsers = yield* locationPort.findByUserInSharingList(event.userId);
      
      // Broadcast to each authorized user
      for (const user of sharingUsers) {
        // Implementation: Push via WebSocket, Realtime, or re-publish targeted event
        yield* Effect.log(`Broadcasting location to user ${user.userId}`);
      }
    }).pipe(
      Effect.catchAll((error) => {
        // Log but don't propagate - error isolation
        return Effect.logError("Failed to broadcast location", error);
      })
    );
  }
}
```

**LocationSharingRequestHandler**
```typescript
export class LocationSharingRequestHandler
  implements IEventHandler<LocationSharingRequested, NotificationServicePortTag>
{
  readonly eventTag = "LocationSharingRequested";
  
  handle(event: LocationSharingRequested): Effect.Effect<void, never, NotificationServicePortTag> {
    return Effect.gen(function* () {
      const notificationService = yield* NotificationServicePortTag;
      
      // Send push notification to receiver
      yield* notificationService.sendNotification({
        userIds: [event.receiverId],
        title: "New Location Sharing Request",
        body: "Someone wants to share their location with you",
        url: "/location/requests",
      });
    }).pipe(
      Effect.catchAll(() => Effect.void)
    );
  }
}
```

---

## Integration Points with EventBus

### 1. UpdateLocation Use Case Integration

```typescript
// In UpdateLocation.ts
import { EventBusTag } from "../../shared/ports/EventBusPort";
import { LocationUpdated } from "@mirai-app/domain";

export class UpdateLocationUseCase {
  execute(input: UpdateLocationInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const eventBus = yield* EventBusTag; // NEW: Add EventBus dependency
      
      // ... existing location update logic ...
      
      // Publish event after successful update
      const event = new LocationUpdated({
        aggregateId: location.id,
        userId: location.userId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        heading: location.heading,
        speed: location.speed,
        timestamp: location.timestamp,
        occurredAt: new Date(),
      });
      
      yield* eventBus.publish(event); // NEW: Publish event
      
      return {
        success: true,
        locationId: location.id,
        timestamp: location.timestamp.getTime(),
      };
    });
  }
}
```

### 2. RequestLocationSharing Use Case Integration

```typescript
// In RequestLocationSharing.ts
export class RequestLocationSharingUseCase {
  execute(input: RequestLocationSharingInput) {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPortTag;
      const eventBus = yield* EventBusTag; // NEW
      
      // ... existing request creation logic ...
      
      // Publish event after successful creation
      const event = new LocationSharingRequested({
        aggregateId: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        occurredAt: new Date(),
      });
      
      yield* eventBus.publish(event); // NEW
      
      return {
        success: true,
        request: { ... },
      };
    });
  }
}
```

### 3. Handler Registration Integration

```typescript
// In apps/backend-server/src/handlers/location-handlers.ts
import { Effect, Layer } from "effect";
import { EventBusTag } from "@mirai-app/frameworks/di";
import {
  LocationBroadcastHandler,
  LocationSharingRequestHandler,
  LocationSharingStatusHandler,
} from "@mirai-app/use-cases/location/handlers";
import { LocationPortTag } from "@mirai-app/use-cases/location/ports/LocationPort";
import { NotificationServicePortTag } from "@mirai-app/use-cases/notification/ports/NotificationPort";

export function initializeLocationHandlers() {
  return Effect.gen(function* () {
    const eventBus = yield* EventBusTag;
    
    // Capture required services
    const locationPort = yield* LocationPortTag;
    const notificationService = yield* NotificationServicePortTag;
    
    // Create handler layer
    const handlerLayer = Layer.mergeAll(
      Layer.succeed(LocationPortTag, locationPort),
      Layer.succeed(NotificationServicePortTag, notificationService)
    );
    
    // Subscribe handlers
    const broadcastSub = yield* eventBus.subscribe<LocationUpdated>(
      "LocationUpdated",
      (event) => {
        const handler = new LocationBroadcastHandler();
        return handler.handle(event).pipe(Effect.provide(handlerLayer));
      }
    );
    
    const requestSub = yield* eventBus.subscribe<LocationSharingRequested>(
      "LocationSharingRequested",
      (event) => {
        const handler = new LocationSharingRequestHandler();
        return handler.handle(event).pipe(Effect.provide(handlerLayer));
      }
    );
    
    // ... additional subscriptions ...
    
    return {
      cleanup: () => {
        broadcastSub.unsubscribe();
        requestSub.unsubscribe();
        // ... unsubscribe others ...
      },
    };
  });
}
```

---

## Dependencies Between Components

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Domain Layer                                  │
├─────────────────────────────────────────────────────────────────────┤
│ LocationUpdated, LocationSharingRequested, LocationSharingAccepted   │
│ LocationSharingRejected, UserAddedToSharing, UserRemovedFromSharing  │
│ ↑ (implements)                                                       │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ imports types
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Use Cases Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Interactors:                                                         │
│   UpdateLocation ───────→ publishes LocationUpdated                  │
│   RequestLocationSharing → publishes LocationSharingRequested        │
│   AcceptLocationSharing  → publishes LocationSharingAccepted         │
│   RejectLocationSharing  → publishes LocationSharingRejected         │
│   AddUserToSharing ──────→ publishes UserAddedToSharing              │
│   RemoveUserFromSharing ─→ publishes UserRemovedFromSharing        │
│                                                                      │
│ Handlers:                                                            │
│   LocationBroadcastHandler ←── subscribes to LocationUpdated         │
│   LocationSharingRequestHandler ← subscribes to LocationSharingReq   │
│   LocationSharingStatusHandler ← subscribes to accept/reject/add   │
│ ↑ (uses Context.Tag)                                                 │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ Effect.provide()
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Adapters Layer                                  │
├─────────────────────────────────────────────────────────────────────┤
│ SupabaseRealtimeEventBusGateway (IEventBusPort implementation)      │
│ LocationDrizzleGateway (ILocationPort implementation)              │
│ NotificationServiceGateway (INotificationServicePort impl)          │
│ ↑ (Layer.succeed)                                                    │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ Layer.mergeAll()
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Frameworks Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│ makeAppLayer() → Layer.merge(repoLayer, serviceLayer)               │
│   serviceLayer includes EventBusTag → SupabaseRealtimeEventBusGw    │
│   repoLayer includes LocationPortTag → LocationDrizzleGateway         │
│ ↑ (Effect.provide in server)                                         │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ initializeLocationHandlers().pipe(Effect.provide(appLayer))
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend Server                                    │
├─────────────────────────────────────────────────────────────────────┤
│ main():                                                              │
│   1. Create appLayer                                                 │
│   2. Initialize location handlers → subscribe to events              │
│   3. Start HTTP server                                               │
│   4. On shutdown: cleanup() → unsubscribe handlers                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Context.Tag Dependencies

| Handler | Required Context.Tags |
|---------|----------------------|
| LocationBroadcastHandler | LocationPortTag, EventBusTag |
| LocationSharingRequestHandler | NotificationServicePortTag |
| LocationSharingStatusHandler | LocationPortTag, NotificationServicePortTag |

### Effect Dependency Types

```typescript
// UpdateLocationUseCase dependencies
type UpdateLocationDeps = LocationPortTag | TripPortTag | TripParticipantPort | EventBusTag;

// LocationBroadcastHandler dependencies
type BroadcastHandlerDeps = LocationPortTag | EventBusTag;

// LocationSharingRequestHandler dependencies
type RequestHandlerDeps = NotificationServicePortTag;
```

---

## Implementation Sequence

### Phase 1: Domain Events (Foundation)
1. Create `packages/domain/src/location/events/` directory
2. Implement all 6 domain event classes
3. Add barrel export to `packages/domain/src/location/index.ts`
4. Write unit tests for event construction

### Phase 2: Use Case Modifications (Publishing)
1. Modify UpdateLocation.ts to publish LocationUpdated
2. Modify RequestLocationSharing.ts to publish LocationSharingRequested
3. Modify AcceptLocationSharingRequest.ts to publish LocationSharingAccepted
4. Modify RejectLocationSharingRequest.ts to publish LocationSharingRejected
5. Modify AddUserToSharing.ts to publish UserAddedToSharing
6. Modify RemoveUserFromSharing.ts to publish UserRemovedFromSharing

### Phase 3: Event Handlers (Subscribing)
1. Create `packages/use-cases/src/location/handlers/` directory
2. Implement LocationBroadcastHandler
3. Implement LocationSharingRequestHandler
4. Implement LocationSharingStatusHandler
5. Add barrel export to `packages/use-cases/src/location/handlers/index.ts`
6. Export handlers from `packages/use-cases/src/location/interactors/index.ts`

### Phase 4: Handler Registration (Wiring)
1. Create `apps/backend-server/src/handlers/location-handlers.ts`
2. Implement initializeLocationHandlers() function
3. Modify `apps/backend-server/src/index.ts` to call initializeLocationHandlers()
4. Add cleanup logic to graceful shutdown

### Phase 5: Integration Testing
1. Create integration tests for event flow
2. Test publish/subscribe with InProcessEventBusGateway
3. Verify handler error isolation
4. Test concurrent event handling

### Phase 6: GraphQL Subscriptions (Optional)
1. Create location GraphQL types
2. Implement locationUpdated subscription
3. Integrate with EventBus for real-time updates

---

## Key Design Decisions

### 1. Event Naming Convention
- Use past tense for event names: `LocationUpdated`, not `UpdateLocation`
- Use camelCase for _tag values: `"LocationUpdated"`
- Match _tag exactly to class name for clarity

### 2. Error Isolation
All handlers must catch errors internally using `Effect.catchAll`:
```typescript
return Effect.gen(function* () {
  // ... handler logic ...
}).pipe(
  Effect.catchAll((error) => {
    // Log error but don't propagate
    return Effect.logError("Handler failed", error);
  })
);
```

### 3. Dependency Injection Pattern
- Handlers declare dependencies via Effect Context.Tags
- Handler registration provides dependencies via `Effect.provide()`
- Same pattern as NotificationSendHandler for consistency

### 4. Event Payload Design
- Include aggregateId for event sourcing/correlation
- Include userId for authorization filtering
- Include full location data for immediate consumption
- Use occurredAt (not timestamp) for the event timestamp

### 5. Backward Compatibility
- Existing use cases continue to work synchronously
- Events are published as side-effects (don't block main flow)
- Handlers operate asynchronously via EventBus

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Event loss during deployment | Initialize handlers before HTTP server starts |
| Handler failures crash system | Error isolation with catchAll in all handlers |
| Memory leaks from subscriptions | Cleanup functions in graceful shutdown |
| Duplicate event processing | Event idempotency via aggregateId + occurredAt |
| Supabase Realtime limits | Monitor channel count, implement fallback |
| Testing complexity | Use InProcessEventBusGateway for deterministic tests |

---

## Appendix: File Structure Summary

### Modified Files (8)
1. `packages/domain/src/location/index.ts`
2. `packages/use-cases/src/location/interactors/UpdateLocation.ts`
3. `packages/use-cases/src/location/interactors/RequestLocationSharing.ts`
4. `packages/use-cases/src/location/interactors/AcceptLocationSharingRequest.ts`
5. `packages/use-cases/src/location/interactors/RejectLocationSharingRequest.ts`
6. `packages/use-cases/src/location/interactors/AddUserToSharing.ts`
7. `packages/use-cases/src/location/interactors/RemoveUserFromSharing.ts`
8. `apps/backend-server/src/index.ts`

### New Files (12)
1. `packages/domain/src/location/events/index.ts`
2. `packages/domain/src/location/events/LocationUpdated.ts`
3. `packages/domain/src/location/events/LocationSharingRequested.ts`
4. `packages/domain/src/location/events/LocationSharingAccepted.ts`
5. `packages/domain/src/location/events/LocationSharingRejected.ts`
6. `packages/domain/src/location/events/UserAddedToSharing.ts`
7. `packages/domain/src/location/events/UserRemovedFromSharing.ts`
8. `packages/use-cases/src/location/handlers/index.ts`
9. `packages/use-cases/src/location/handlers/LocationBroadcastHandler.ts`
10. `packages/use-cases/src/location/handlers/LocationSharingRequestHandler.ts`
11. `packages/use-cases/src/location/handlers/LocationSharingStatusHandler.ts`
12. `apps/backend-server/src/handlers/location-handlers.ts`

### Total: 20 files affected
