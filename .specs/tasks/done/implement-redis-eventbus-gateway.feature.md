---
title: Implement Redis EventBus Gateway for realtime and background jobs
---

## Initial User Prompt

Replace SupabaseRealtimeEventBusGateway with RedisEventBusGateway using Redis Streams. Migrate IRealtimePort to unified IPubSubPort/EventBus. All realtime functionality and background jobs (like sending notifications after use-case execution) should be handled by EventBus with consumer groups for reliable processing.

Key requirements:
- Use Redis Streams (Valkey-compatible) instead of Supabase Realtime
- Support both real-time pub/sub (XREAD) and background job processing (XREADGROUP with consumer groups)
- Full DI support for handlers via Effect Runtime
- Horizontal scalability via consumer groups
- Exactly-once processing for background jobs

## Description

This task implements a Redis EventBus Gateway to replace the existing SupabaseRealtimeEventBusGateway. The new gateway uses Redis Streams (Valkey-compatible) to provide reliable, scalable event-driven architecture for both real-time pub/sub messaging and background job processing.

### Business Value

1. **Vendor Independence**: Eliminates dependency on Supabase Realtime, using open-source Redis/Valkey
2. **Horizontal Scalability**: Consumer groups enable multiple backend-server instances to share job processing load
3. **Exactly-Once Processing**: Redis Streams with consumer groups and acknowledgments ensure reliable job processing
4. **Unified Architecture**: Single EventBus interface handles both real-time notifications and background jobs
5. **Operational Simplicity**: Redis/Valkey is widely supported and can be self-hosted or managed

### Scope

**Included:**
- RedisEventBusGateway implementation using Redis Streams (XADD, XREAD, XREADGROUP, XACK)
- Consumer group support for load-balanced job processing
- Full DI support for handler dependencies via Effect Runtime
- Error handling with retry strategies
- Configuration management for Redis connection
- Migration from SupabaseRealtimeEventBusGateway to RedisEventBusGateway

**Excluded:**
- Changes to the IEventBusPort interface (remains unchanged for backwards compatibility)
- WebSocket-based real-time features (GraphQL subscriptions use existing patterns)
- Changes to notification handlers (they work with both implementations)
- Test infrastructure changes (InProcessEventBusGateway remains for testing)

### User Scenarios

1. **Primary Flow (Background Job Processing)**: When a use case publishes a notification event, the RedisEventBusGateway adds it to a stream, and a consumer group member processes it to send push notifications.

2. **Real-time Pub/Sub**: When location updates are published, all connected clients receive them via XREAD without consumer groups (broadcast mode).

3. **Horizontal Scaling**: When multiple backend-server instances are running, consumer groups distribute job processing across instances for load balancing.

4. **Error Handling**: When a handler fails, the error is logged and processing continues; failed messages can be retried via XPENDING and XCLAIM.

## Design Reference

See detailed design document: `.specs/plans/redis-eventbus-gateway.design.md`

## Acceptance Criteria

### Functional Requirements

- [ ] **Redis Streams Implementation**: RedisEventBusGateway implements IEventBusPort using Redis Streams
  - Given: Redis server is running and accessible
  - When: Gateway publishes an event with `eventBus.publish(event)`
  - Then: Event is added to stream using XADD with proper stream naming

- [ ] **Consumer Group Support**: Gateway supports consumer groups for reliable job processing
  - Given: A consumer group is configured for event type
  - When: Multiple backend instances subscribe with consumer group options
  - Then: Events are distributed across instances using XREADGROUP

- [ ] **Exactly-Once Processing**: Messages are acknowledged after successful processing
  - Given: A handler processes an event from consumer group
  - When: Handler completes successfully
  - Then: Message is acknowledged with XACK

- [ ] **DI Support for Handlers**: Gateway provides Effect Runtime for handler dependencies
  - Given: Handler requires notification ports (PushSubscriptionPortTag, etc.)
  - When: Handler is invoked by consumer group
  - Then: Dependencies are resolved via Effect Runtime provided by gateway

- [ ] **Pub/Sub Broadcasting**: Real-time subscriptions work without consumer groups
  - Given: Multiple clients subscribe to location updates
  - When: Location event is published
  - Then: All subscribers receive the event via XREAD (no group)

- [ ] **Error Handling and Retry**: Failed operations are handled gracefully
  - Given: Redis connection fails temporarily
  - When: Gateway retries with exponential backoff
  - Then: Operation succeeds after recovery or fails with proper error

- [ ] **Stream Management**: Streams are automatically trimmed to prevent unbounded growth
  - Given: Stream exceeds max length threshold
  - When: New events are published
  - Then: Old events are removed automatically

- [ ] **Supabase Migration**: SupabaseRealtimeEventBusGateway is completely removed
  - Given: Application starts with RedisEventBusGateway
  - When: Existing event flows execute
  - Then: All functionality works without Supabase Realtime dependency

### Non-Functional Requirements

- [ ] **Performance**: Event publishing latency < 50ms (p95) under normal load
- [ ] **Scalability**: Support at least 3 concurrent backend-server instances with consumer groups
- [ ] **Reliability**: Exactly-once processing guarantee for background jobs via consumer groups
- [ ] **Compatibility**: Valkey-compatible (all Redis Streams commands work with Valkey)
- [ ] **Testability**: All existing tests pass with both InProcessEventBusGateway and RedisEventBusGateway

### Definition of Done

- [X] RedisEventBusGateway fully implements IEventBusPort
- [X] SupabaseRealtimeEventBusGateway removed from codebase
- [X] All existing event bus tests pass
- [X] Notification flow works end-to-end (create → publish → handle → push)
- [X] Consumer groups distribute load across multiple instances
- [X] No Supabase dependencies in service layer
- [X] Documentation updated (AGENTS.md, design docs)
- [X] Environment variables documented for Redis configuration

## Implementation Summary

Based on the design document, the implementation involves:

1. **New Files to Create:**
   - `packages/adapters/src/shared/gateways/RedisEventBusGateway.ts` - Main gateway implementation
   - `packages/adapters/src/shared/gateways/RedisEventBusConfig.ts` - Configuration types
   - `packages/adapters/src/shared/errors/EventBusErrors.ts` - Redis-specific errors (add to existing)

2. **Files to Modify:**
   - `packages/frameworks/src/di/layer/service.ts` - Replace Supabase with Redis
   - `packages/adapters/src/shared/gateways/index.ts` - Export new gateway
   - `apps/backend-server/src/program.ts` - Remove Supabase dependency

3. **Files to Delete:**
   - `packages/adapters/src/shared/gateways/SupabaseRealtimeEventBusGateway.ts`

4. **Dependencies:**
   - `ioredis` - Redis client with Stream support

## Notes

- The IEventBusPort interface remains unchanged - only the implementation changes
- Handler registration in backend-server requires consumer group options for background jobs
- For real-time pub/sub (like GraphQL subscriptions), use XREAD without consumer groups
- All Redis Streams commands (XADD, XREAD, XREADGROUP, XACK, XGROUP) are Valkey-compatible
