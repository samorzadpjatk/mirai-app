# Design: Redis EventBus Gateway (IPubSubPort)

## Overview

This design migrates from `SupabaseRealtimeEventBusGateway` to `RedisEventBusGateway` using **Redis Streams** for reliable, scalable event-driven architecture. All realtime functionality and background job processing will use the unified `EventBusTag` (IEventBusPort).

## Architecture Goals

1. **Replace Supabase Realtime** with Redis Streams (Valkey-compatible)
2. **Unified Event Bus** for both real-time pub/sub and background jobs
3. **Clean Architecture** - no vendor lock-in, all open-source components
4. **Horizontal Scalability** via consumer groups
5. **Exactly-once processing** for background jobs

## Architecture

### Current State (Supabase)

```
┌──────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
│ Use Case         │────▶│ SupabaseRealtime        │────▶│ NotificationSend │
│ (EventBusTag)    │     │ EventBusGateway         │     │ Handler          │
└──────────────────┘     └─────────────────────────┘     └──────────────────┘
                                  │
                                  ▼
                         Supabase Realtime Service
                         (external dependency)
```

### Target State (Redis Streams)

```
┌──────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
│ Use Case         │────▶│ RedisEventBusGateway    │────▶│ NotificationSend │
│ (EventBusTag)    │     │ (Redis Streams)         │     │ Handler          │
└──────────────────┘     └─────────────────────────┘     └──────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            XADD (publish)              XREADGROUP (subscribe)
            domain-events-{tag}          consumer groups for
                                          reliable processing
```

## Components

### 1. RedisEventBusGateway

**Location:** `packages/adapters/src/shared/gateways/RedisEventBusGateway.ts`

Implements `IEventBusPort` using Redis Streams:

- **XADD** for publishing events to streams
- **XREADGROUP** for reliable background job processing (consumer groups)
- **XREAD** for real-time pub/sub broadcasting
- **XACK** for message acknowledgment

**Key Features:**
- Consumer groups for load-balanced job processing across multiple backend-server instances
- Stream trimming to prevent unbounded growth
- Automatic retry with exponential backoff
- Full DI support via Effect Runtime for handler dependencies

### 2. Service Layer Integration

**Location:** `packages/frameworks/src/di/layer/service.ts`

```typescript
export interface ServiceLayerConfig {
  db: DrizzleDb;
  authConfig?: BetterAuthConfig;
  storageConfig?: StorageConfig;  // SeaweedFS only
  eventBusConfig?: RedisEventBusConfig;
}
```

**Changes:**
- Remove `SupabaseRealtimeEventBusGateway`
- Remove `SupabaseStorageGateway` (already removed in storage simplification task)
- Remove `SupabaseClient` dependency from config
- Add `RedisEventBusGateway` with handler dependency injection

### 3. Handler Dependency Injection

**Pattern:** The gateway captures ports at layer creation time:

```typescript
const createRedisEventBusLayer = (config: ServiceLayerConfig) => {
  return Effect.gen(function* () {
    const gateway = new RedisEventBusGateway(config.eventBusConfig);
    
    // Capture notification ports for handler injection
    const pushSubscriptionPort = yield* PushSubscriptionPortTag;
    const deliveryPort = yield* NotificationDeliveryPortTag;
    const servicePort = yield* NotificationServicePortTag;
    
    // Build handler runtime
    const handlerLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionPort),
      Layer.succeed(NotificationDeliveryPortTag, deliveryPort),
      Layer.succeed(NotificationServicePortTag, servicePort)
    );
    
    const handlerRuntime = yield* Layer.toRuntime(handlerLayer);
    gateway.setRuntime(handlerRuntime);
    
    return Layer.succeed(EventBusTag, gateway);
  });
};
```

### 4. Backend-Server Handler Registration

**Location:** `apps/backend-server/src/handlers/notification-handlers.ts`

No changes required - existing pattern works with Redis:

```typescript
export function initializeNotificationHandlers() {
  return Effect.gen(function* () {
    const eventBus = yield* EventBusTag;
    
    // This works with both Supabase and Redis implementations
    const subscriptionResult = yield* eventBus.subscribe<NotificationCreated>(
      "NotificationCreated",
      (event) => {
        const handler = new NotificationSendHandler();
        return handler.handle(event);  // Dependencies provided by gateway runtime
      },
      {
        consumerGroup: "notification-senders",  // NEW: Enable consumer group mode
        consumerName: "backend-server-1",
      }
    );
    
    return { cleanup: () => subscriptionResult.unsubscribe() };
  });
}
```

## Data Flow

### Background Job Flow (Notification Example)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. USE CASE EXECUTION                                                    │
│                                                                          │
│ SendNotificationToGroup.execute()                                        │
│   ├── Save notification to DB (sync)                                    │
│   └── yield* eventBus.publish(new NotificationCreated(...))            │
│        └── RedisEventBusGateway.publish()                                │
│             └── XADD domain-events-NotificationCreated * {...}          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼ Redis Stream
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. CONSUMER GROUP PROCESSING                                             │
│                                                                          │
│ Backend-server instance 1:                                               │
│   XREADGROUP GROUP notification-senders consumer-1                     │
│   └── Receives message ID 12345                                          │
│        └── NotificationSendHandler.handle(event)                        │
│             ├── Fetch push subscriptions                               │
│             ├── Send push notifications via Expo                        │
│             └── XACK domain-events-NotificationCreated 12345            │
│                                                                          │
│ Backend-server instance 2 (if scaled):                                 │
│   XREADGROUP GROUP notification-senders consumer-2                     │
│   └── Receives different messages (load balanced)                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### Real-time Pub/Sub Flow (GraphQL Subscriptions)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. EVENT PUBLICATION                                                     │
│                                                                          │
│ LocationUpdate.execute()                                                 │
│   └── yield* eventBus.publish(new LocationUpdated(...))                  │
│        └── XADD domain-events-LocationUpdated * {...}                    │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼ Redis Stream
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. REAL-TIME SUBSCRIPTION (No Consumer Group)                          │
│                                                                          │
│ GraphQL subscription resolver:                                            │
│   eventBus.subscribe("LocationUpdated", handler)                       │
│        └── XREAD (no group) - broadcast to ALL subscribers             │
│             └── Each connected client receives the event               │
└──────────────────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Redis Event Bus (can be separate Redis instance or shared)
REDIS_EVENTBUS_HOST=localhost
REDIS_EVENTBUS_PORT=6380
REDIS_EVENTBUS_PASSWORD=secret
REDIS_EVENTBUS_DB=1                    # Separate DB from storage tickets
REDIS_EVENTBUS_MAX_RETRIES=3
REDIS_EVENTBUS_MAX_STREAM_LEN=10000  # Stream trimming limit
```

### Code Configuration

```typescript
// packages/adapters/src/shared/gateways/RedisEventBusConfig.ts
export interface RedisEventBusConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetries: number;
  maxStreamLength?: number;  // Auto-trim streams to this length
}
```

## Error Handling

### Retry Strategy

```typescript
// Connection errors: Exponential backoff, 3 retries
Effect.retry({
  schedule: Schedule.exponential("1 seconds").pipe(
    Schedule.intersect(Schedule.recurs(3))
  ),
  while: (error) => error._tag === "RedisConnectionError",
})

// Handler errors: Log and continue (don't crash consumer)
Effect.catchAll((error) => {
  return Effect.logError("Handler failed for event", { error });
})
```

### Error Types

```typescript
export class RedisConnectionError extends Data.TaggedError("RedisConnectionError")<{
  operation: string;
  cause: unknown;
}> {}

export class RedisPublishError extends Data.TaggedError("RedisPublishError")<{
  eventTag: string;
  cause: unknown;
}> implements IPortError {}

export class RedisSubscribeError extends Data.TaggedError("RedisSubscribeError")<{
  eventTag: string;
  cause: unknown;
}> implements IPortError {}
```

## Testing

### In-Memory Test Gateway

The existing `InProcessEventBusGateway` remains for testing:

```typescript
const testLayer = createTestLayer();
// Uses InProcessEventBusGateway for fast, deterministic tests
```

### Integration Test with Redis

```typescript
const redisConfig: RedisEventBusConfig = {
  host: "localhost",
  port: 6380,
  db: 15,  // Use separate test DB
};

const gateway = new RedisEventBusGateway(redisConfig);
```

## Migration Checklist

### Phase 1: Create RedisEventBusGateway
- [ ] Implement `RedisEventBusGateway.ts` with XADD/XREADGROUP
- [ ] Add `RedisEventBusConfig.ts` with types and validation
- [ ] Add error types to `packages/adapters/src/shared/errors/EventBusErrors.ts`
- [ ] Unit tests for gateway

### Phase 2: Update DI Layer
- [ ] Remove `SupabaseRealtimeEventBusGateway` from imports
- [ ] Update `ServiceLayerConfig` interface (remove supabase client)
- [ ] Implement `createRedisEventBusLayer` with handler DI
- [ ] Update `loadRedisEventBusConfigFromEnv`

### Phase 3: Update Backend Server
- [ ] Remove Supabase client initialization
- [ ] Update `program.ts` to not depend on Supabase
- [ ] Update handler initialization to use consumer groups
- [ ] Test notification flow end-to-end

### Phase 4: Clean Up
- [ ] Remove `SupabaseRealtimeEventBusGateway.ts`
- [ ] Remove Supabase-related env vars from docs
- [ ] Update AGENTS.md with new architecture

## Dependencies

- **ioredis** - Redis client with Stream support
- **Valkey-compatible** - All Redis Streams operations work with Valkey

## Files to Modify

| File | Action |
|------|--------|
| `packages/adapters/src/shared/gateways/RedisEventBusGateway.ts` | Create new |
| `packages/adapters/src/shared/gateways/RedisEventBusConfig.ts` | Create new |
| `packages/adapters/src/shared/errors/EventBusErrors.ts` | Add Redis errors |
| `packages/adapters/src/shared/gateways/index.ts` | Export new gateway |
| `packages/frameworks/src/di/layer/service.ts` | Replace Supabase with Redis |
| `apps/backend-server/src/handlers/notification-handlers.ts` | Add consumer group options |
| `apps/backend-server/src/program.ts` | Remove Supabase dependency |
| `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts` | Delete |

## Success Criteria

1. [ ] `SupabaseRealtimeEventBusGateway` completely removed
2. [ ] `RedisEventBusGateway` passes all existing event bus tests
3. [ ] Notification flow works: create notification → event published → handler processes → push sent
4. [ ] Multiple backend-server instances can process jobs (consumer groups)
5. [ ] No Supabase dependencies in service layer
6. [ ] All tests pass with InProcessEventBusGateway and RedisEventBusGateway

## Notes

- **Valkey Compatibility**: All Redis Streams commands (XADD, XREAD, XREADGROUP, XACK, XGROUP) are supported by Valkey
- **Horizontal Scaling**: Consumer groups enable multiple backend-server instances to share job processing load
- **Backwards Compatibility**: The `IEventBusPort` interface remains unchanged - only the implementation changes
