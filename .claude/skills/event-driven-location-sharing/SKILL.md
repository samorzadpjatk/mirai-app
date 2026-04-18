---
name: event-driven-location-sharing
description: Event-driven location sharing patterns using EventBus, Effect, and Redis Streams. Reusable for real-time streaming features.
tags: [event-driven, location, realtime, effect, redis, streaming]
---

# Event-Driven Location Sharing

> **Reusable patterns for real-time event streaming using Effect and Redis Streams**

This skill provides patterns for implementing event-driven location sharing and other real-time streaming features. It leverages the existing EventBus architecture (used by notifications) to enable unified, scalable event streaming.

---

## When to Use This Skill

**Use for:**
- Location sharing between users
- Real-time activity feeds
- Live voting/challenge updates
- Any feature requiring high-frequency event streaming with fan-out

**Prerequisites:**
- Understanding of Effect framework (`Effect.gen`, `Context.Tag`, `Layer`)
- Redis Streams configured in project
- Existing EventBus infrastructure (see `RedisEventBusGateway`)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Use Case (UpdateLocation)                                       │
│   1. Validate & write to DB                                     │
│   2. Throttle (time + distance)                                   │
│   3. Query sharing list                                         │
│   4. Publish LocationUpdated event ─────────┐                   │
└───────────────────────────────────────────────┼───────────────────┘
                                                │
┌───────────────────────────────────────────────▼───────────────────┐
│ RedisEventBusGateway                                              │
│   Stream: domain-events-locationupdated                           │
│   XADD: { userId, lat, lng, sharingWithUserIds }                 │
└───────────────────────────────────────────────┬─────────────────────┘
                                                │
┌───────────────────────────────────────────────▼───────────────────┐
│ LocationEventHandler                                              │
│   Subscribes to LocationUpdated (XREADGROUP)                        │
│   For each user in sharingWithUserIds:                           │
│     → Push to GraphQL subscription stream                         │
└───────────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Domain Event Definition

Create immutable event classes implementing `IDomainEvent`:

```typescript
// packages/domain/src/location/events/LocationUpdated.ts
import type { IDomainEvent } from "../../shared/events/DomainEvent";
import type { LocationId, UserId } from "../../shared/value-objects/branded-id";

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
    readonly sharingWithUserIds: UserId[],  // Fan-out targets
    readonly occurredAt: Date,
  ) {}
}
```

**Key rules:**
- All fields `readonly` for immutability
- `_tag` for type discrimination
- `version` for schema evolution
- Include `sharingWithUserIds` for fan-out targets
- `aggregateId` links to originating entity

---

## Pattern 2: Event Publishing in Use Case

Modify use case to publish events after DB write:

```typescript
// packages/use-cases/src/location/interactors/UpdateLocation.ts
import { Effect } from "effect";
import { LocationUpdated } from "@mirai-app/domain";
import { EventBusTag } from "../../shared/ports/EventBusPort";
import { LocationThrottleService } from "../services/LocationThrottleService";

export class UpdateLocationUseCase {
  constructor(private readonly throttleService: LocationThrottleService) {}

  execute(input: UpdateLocationInput) {
    return Effect.gen(this, function* () {
      const locationPort = yield* LocationPortTag;
      const eventBus = yield* EventBusTag;

      // ... validation and DB write ...

      // Throttle check
      if (this.throttleService.shouldPublish(input.userId, input.latitude, input.longitude)) {
        // Query who this user shares with
        const sharingWithUserIds = yield* locationPort.getSharingList(input.userId);

        // Publish event
        yield* eventBus.publish(new LocationUpdated({
          aggregateId: location.id,
          userId: UserId.unsafeCreate(input.userId),
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy ?? null,
          altitude: input.altitude ?? null,
          heading: input.heading ?? null,
          speed: input.speed ?? null,
          timestamp: new Date(),
          sharingWithUserIds,
          occurredAt: new Date(),
        }));

        this.throttleService.recordPublish(input.userId, input.latitude, input.longitude);
      }

      return { success: true, locationId: location.id };
    });
  }
}
```

---

## Pattern 3: Throttling Service

Hybrid distance + time throttling for battery efficiency:

```typescript
// packages/use-cases/src/location/services/LocationThrottleService.ts
import { Effect, Data } from "effect";

export class ThrottleConfig extends Data.Class<{
  minTimeIntervalMs: number;
  minDistanceMeters: number;
  maxSilenceMs: number;
}> {}

export class LocationThrottleService {
  private lastLocation = new Map<string, { lat: number; lng: number; time: number }>();

  constructor(private readonly config: ThrottleConfig) {}

  shouldPublish(userId: string, lat: number, lng: number): boolean {
    const last = this.lastLocation.get(userId);
    const now = Date.now();

    if (!last) return true;

    const timeDelta = now - last.time;
    const distanceDelta = this.calculateDistance(last.lat, last.lng, lat, lng);

    return (
      (distanceDelta >= this.config.minDistanceMeters && 
       timeDelta >= this.config.minTimeIntervalMs) ||
      timeDelta >= this.config.maxSilenceMs
    );
  }

  recordPublish(userId: string, lat: number, lng: number) {
    this.lastLocation.set(userId, { lat, lng, time: Date.now() });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}
```

**Recommended defaults:**
- `minTimeIntervalMs`: 3000 (3 seconds)
- `minDistanceMeters`: 20 (20 meters)
- `maxSilenceMs`: 30000 (30 seconds - keep-alive)

---

## Pattern 4: Event Handler (Fan-out)

Implement `IEventHandler` to process events:

```typescript
// packages/use-cases/src/location/handlers/LocationEventHandler.ts
import { Effect } from "effect";
import type { IEventHandler, LocationUpdated } from "@mirai-app/domain";
import { SubscriptionManagerTag } from "../ports/SubscriptionManagerPort";

export class LocationEventHandler
  implements IEventHandler<LocationUpdated, SubscriptionManagerTag>
{
  readonly eventTag = "LocationUpdated";

  handle(event: LocationUpdated) {
    return Effect.gen(this, function* () {
      const subscriptionManager = yield* SubscriptionManagerTag;

      // Fan-out to all authorized friends
      for (const friendUserId of event.sharingWithUserIds) {
        yield* subscriptionManager.pushToUser(friendUserId, {
          type: "location_updated",
          userId: event.userId,
          latitude: event.latitude,
          longitude: event.longitude,
          accuracy: event.accuracy,
          timestamp: event.timestamp,
        });
      }
    }).pipe(
      Effect.catchAll((error) => {
        // Error isolation - never let handler errors crash the event bus
        return Effect.sync(() => {
          // eslint-disable-next-line no-console
          console.error("[LocationEventHandler] Fan-out failed:", error);
        });
      })
    );
  }
}
```

**Error isolation rule:** Always wrap handler body with `Effect.catchAll` to prevent event bus disruption.

---

## Pattern 5: Subscription Manager (GraphQL)

Manage active GraphQL subscriptions with AsyncIterableIterator:

```typescript
// packages/adapters/src/location/services/LocationSubscriptionManager.ts
export interface LocationEvent {
  type: "location_updated" | "sharing_started" | "sharing_stopped";
  userId: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  timestamp?: Date;
}

interface AsyncIteratorSink<T> {
  next: (value: T) => void;
  complete: () => void;
}

export class LocationSubscriptionManager {
  private subscriptions = new Map<string, Set<AsyncIteratorSink<LocationEvent>>>();

  createLocationSubscription(userId: string): AsyncIterableIterator<LocationEvent> {
    const queue: LocationEvent[] = [];
    let resolveNext: ((value: IteratorResult<LocationEvent>) => void) | null = null;
    let done = false;

    const sink: AsyncIteratorSink<LocationEvent> = {
      next: (value) => {
        if (done) return;
        if (resolveNext) {
          resolveNext({ value, done: false });
          resolveNext = null;
        } else {
          queue.push(value);
        }
      },
      complete: () => {
        done = true;
        if (resolveNext) {
          resolveNext({ value: undefined, done: true });
        }
      },
    };

    // Register
    let userSubs = this.subscriptions.get(userId);
    if (!userSubs) {
      userSubs = new Set();
      this.subscriptions.set(userId, userSubs);
    }
    userSubs.add(sink);

    return {
      next: () => {
        if (queue.length > 0) {
          return Promise.resolve({ value: queue.shift()!, done: false });
        }
        if (done) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise((resolve) => { resolveNext = resolve; });
      },
      [Symbol.asyncIterator]() { return this; },
      return: () => {
        done = true;
        userSubs?.delete(sink);
        if (userSubs?.size === 0) {
          this.subscriptions.delete(userId);
        }
        return Promise.resolve({ value: undefined, done: true });
      },
    };
  }

  pushToUser(userId: string, event: LocationEvent) {
    const sinks = this.subscriptions.get(userId);
    if (sinks) {
      for (const sink of sinks) {
        sink.next(event);
      }
    }
  }
}
```

---

## Pattern 6: GraphQL Subscription Resolver

```typescript
// packages/frameworks/src/graphql/types/location/subscriptions.ts
import { builder } from "../../builder";
import { LocationSubscriptionManager } from "@mirai-app/adapters";

const FriendLocationEvent = builder.objectType("FriendLocationEvent", {
  fields: (t) => ({
    userId: t.exposeID("userId"),
    latitude: t.exposeFloat("latitude"),
    longitude: t.exposeFloat("longitude"),
    accuracy: t.exposeFloat("accuracy", { nullable: true }),
    timestamp: t.field({
      type: "DateTime",
      resolve: (event) => event.timestamp,
    }),
  }),
});

builder.subscriptionFields((t) => ({
  friendLocations: t.field({
    type: FriendLocationEvent,
    authScopes: { authenticated: true },
    subscribe: async function* (_parent, _args, ctx) {
      const userId = ctx.authContext.userId;
      const subscriptionManager = ctx.controllers.locationSubscriptionManager;

      const subscription = subscriptionManager.createLocationSubscription(userId);

      try {
        while (true) {
          const event = await subscription.next();
          if (event.done) break;
          yield event.value;
        }
      } finally {
        subscription.return?.();
      }
    },
  }),
}));
```

---

## Pattern 7: Handler Initialization

Initialize handlers on server startup:

```typescript
// apps/backend-server/src/handlers/location-handlers.ts
import { Effect, Layer } from "effect";
import { EventBusTag } from "@mirai-app/use-cases";
import { LocationEventHandler } from "@mirai-app/use-cases/location/handlers/LocationEventHandler";
import { SubscriptionManagerTag } from "@mirai-app/use-cases/location/ports/SubscriptionManagerPort";

export function initializeLocationHandlers() {
  return Effect.gen(function* () {
    const eventBus = yield* EventBusTag;
    const handler = new LocationEventHandler();

    const { unsubscribe } = yield* eventBus.subscribe(
      "LocationUpdated",
      (event) => handler.handle(event)
    );

    return { 
      cleanup: () => {
        unsubscribe();
      }
    };
  });
}
```

---

## Pattern 8: Testing with In-Memory EventBus

```typescript
// Test helper
class InMemoryEventBus implements IEventBusPort {
  private handlers = new Map<string, Array<(event: IDomainEvent) => Effect.Effect<void, never, never>>>();

  publish<T extends IDomainEvent>(event: T) {
    const handlers = this.handlers.get(event._tag) ?? [];
    return Effect.all(
      handlers.map(h => h(event)),
      { concurrency: "unbounded" }
    ).pipe(Effect.asVoid);
  }

  subscribe<T extends IDomainEvent>(
    eventTag: string,
    handler: (event: T) => Effect.Effect<void, never, never>
  ) {
    const existing = this.handlers.get(eventTag) ?? [];
    this.handlers.set(eventTag, [...existing, handler]);
    
    return Effect.succeed({
      unsubscribe: () => {
        const current = this.handlers.get(eventTag) ?? [];
        this.handlers.set(eventTag, current.filter(h => h !== handler));
      }
    });
  }
}

// Unit test
describe("[UNIT] LocationEventHandler", () => {
  it("fans out to all sharing users", async () => {
    const eventBus = new InMemoryEventBus();
    const pushedEvents: LocationEvent[] = [];
    
    const mockManager = Layer.succeed(
      SubscriptionManagerTag,
      {
        pushToUser: (userId: string, event: LocationEvent) => 
          Effect.sync(() => { pushedEvents.push({ ...event, targetUserId: userId }); }),
      }
    );

    const handler = new LocationEventHandler();
    
    await Effect.runPromise(
      eventBus.subscribe("LocationUpdated", (e) => 
        handler.handle(e).pipe(Effect.provide(mockManager))
      )
    );

    const event = new LocationUpdated({
      aggregateId: LocationId.generate(),
      userId: UserId.generate(),
      latitude: 52.5200,
      longitude: 13.4050,
      accuracy: 10,
      timestamp: new Date(),
      sharingWithUserIds: [UserId.generate(), UserId.generate()],
      occurredAt: new Date(),
    });

    await Effect.runPromise(eventBus.publish(event));

    expect(pushedEvents).toHaveLength(2);
  });
});
```

---

## Configuration Quick Reference

### Throttling Config

```typescript
// Default configuration
const DEFAULT_THROTTLE_CONFIG = {
  minTimeIntervalMs: 3000,      // Max 1 update per 3 seconds
  minDistanceMeters: 20,        // Only if moved 20+ meters
  maxSilenceMs: 30000,          // Force update every 30 seconds
};

// Aggressive (for active navigation)
const AGGRESSIVE_THROTTLE_CONFIG = {
  minTimeIntervalMs: 1000,      // Max 1 update per second
  minDistanceMeters: 10,        // Only if moved 10+ meters
  maxSilenceMs: 10000,          // Force update every 10 seconds
};

// Conservative (for battery saving)
const CONSERVATIVE_THROTTLE_CONFIG = {
  minTimeIntervalMs: 10000,     // Max 1 update per 10 seconds
  minDistanceMeters: 50,        // Only if moved 50+ meters
  maxSilenceMs: 60000,          // Force update every 60 seconds
};
```

---

## Error Handling Patterns

### 1. Use Case Errors (Propagated)

```typescript
Effect.fail(new NotTripParticipantError({ userId }))
Effect.fail(new TripHasEndedError({ tripId }))
Effect.fail(new ValidationError({ field: "latitude", message: "Invalid" }))
```

### 2. EventBus Errors (Propagated to use case)

```typescript
// In use case - event publish failure should be logged but not fail the request
yield* eventBus.publish(event).pipe(
  Effect.catchAll((error) => {
    // Log but don't fail - location is already saved
    return EffectLogger.error("Event publish failed", error);
  })
);
```

### 3. Handler Errors (Caught internally)

```typescript
handle(event) {
  return Effect.gen(this, function* () {
    // ... process event ...
  }).pipe(
    Effect.catchAll((error) => {
      // Log and swallow - never crash event bus
      return EffectLogger.error("Handler failed", error);
    })
  );
}
```

---

## Common Pitfalls

### 1. Missing Error Isolation in Handlers

**Wrong:**
```typescript
handle(event) {
  return Effect.gen(function* () {
    // If this fails, event bus crashes
    yield* riskyOperation();
  });
}
```

**Right:**
```typescript
handle(event) {
  return Effect.gen(function* () {
    yield* riskyOperation();
  }).pipe(
    Effect.catchAll((error) => EffectLogger.error("...", error))
  );
}
```

### 2. Race Conditions in Throttling

**Wrong:**
```typescript
// Shared state not guarded
if (shouldPublish) {
  publish();
  recordPublish(); // Another request might sneak in between
}
```

**Right:**
```typescript
// Atomic check-and-record
shouldPublish(userId, lat, lng) {
  // In-memory Map operations are effectively atomic for single-threaded JS
  const last = this.lastLocation.get(userId);
  // ... check logic ...
}
```

### 3. Memory Leaks in Subscriptions

**Wrong:**
```typescript
subscribe: async function* () {
  const subscription = createSubscription();
  while (true) {
    yield await subscription.next(); // Never cleans up on client disconnect
  }
}
```

**Right:**
```typescript
subscribe: async function* () {
  const subscription = createSubscription();
  try {
    while (true) {
      const event = await subscription.next();
      if (event.done) break;
      yield event.value;
    }
  } finally {
    subscription.return?.(); // Cleanup!
  }
}
```

---

## Related Skills

- `graphql-subscriptions-urql` - GraphQL subscription patterns with urql
- `sdd:implement` - Implementation with automated verification
- `sadd:do-and-judge` - Execute with quality gates

---

## References

- Effect Scheduling: https://effect.website/docs/scheduling/introduction
- Redis Streams: https://redis.io/docs/data-types/streams/
- Pothos Subscriptions: https://pothos-graphql.dev/docs/guide/subscriptions
- graphql-ws Protocol: https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md

---

**Last Updated:** 2026-04-20
**Version:** 1.1.0 (Updated for Redis Streams)
