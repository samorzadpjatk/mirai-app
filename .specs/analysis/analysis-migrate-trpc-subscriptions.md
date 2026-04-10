# Codebase Impact Analysis: tRPC to GraphQL Subscriptions Migration

**Task:** Migrate tRPC subscriptions to GraphQL with urql and code generation  
**Analysis Date:** 2026-04-10  
**Analyst:** SDD Code Explorer

---

## Executive Summary

The codebase has already partially migrated from tRPC to GraphQL. The current state:

- **Backend:** Hono + GraphQL Yoga + Pothos (no tRPC found)
- **Frontend:** TanStack Query + graphql-request for queries/mutations
- **Missing:** GraphQL subscriptions, urql client, WebSocket support

This analysis identifies all files affected by adding subscription support and migrating to urql.

---

## Current Architecture

### Backend (apps/backend-server)

| Component | Current State                         | Subscription Ready?             |
| --------- | ------------------------------------- | ------------------------------- |
| Server    | Hono + @hono/node-server on port 4000 | No - needs Bun native WS        |
| GraphQL   | Yoga + Pothos                         | Yes - supports subscriptions    |
| Schema    | 6961 lines SDL, 59 types imported     | No - needs Subscription type    |
| Auth      | Bearer token via headers              | No - needs cookie-based WS auth |

**Key Files:**

- `src/hono-server.ts` (428 lines) - Main server, uses @hono/node-server
- `src/graphql/schema.ts` (292 lines) - Schema builder, imports all types
- `src/graphql/builder.ts` - Pothos builder instance
- `src/graphql/yoga-handler.ts` - Yoga configuration

### Frontend Web (apps/web)

| Component      | Current State                    | Migration Required              |
| -------------- | -------------------------------- | ------------------------------- |
| Framework      | Astro + React                    | No change                       |
| GraphQL Client | graphql-request + TanStack Query | Yes - replace with urql         |
| Codegen        | typescript-react-query           | Yes - change to typescript-urql |
| Cache          | TanStack Query cache             | Yes - replace with graphcache   |

**Hooks Requiring Migration:**

- `src/hooks/admin/useChallengeSubmissions.ts` - TanStack Query
- `src/hooks/admin/useJudgement.ts` - TanStack Query
- `src/hooks/admin/useStaffVoting.ts` - TanStack Query
- `src/hooks/admin/useChallengeForm.ts` - TanStack Query
- `src/hooks/useWebFileUpload.ts` - TanStack Query

### Frontend Native (apps/native)

| Component      | Current State                    | Migration Required      |
| -------------- | -------------------------------- | ----------------------- |
| Framework      | Expo + React Native              | No change               |
| GraphQL Client | graphql-request + TanStack Query | Yes - replace with urql |
| Auth Storage   | expo-secure-store                | Works with urql         |
| Location       | Custom hooks with polling        | Yes - use subscriptions |

**Hooks Requiring Migration (46 files):**

- `src/hooks/community/useCommunityFeed.ts` - TanStack Query infinite scroll
- `src/hooks/map/useMapLocationStream.ts` - Polling → subscription
- `src/hooks/challenges/useChallenges.ts` - Query hooks
- `src/hooks/trips/useTrips.ts` - Query hooks
- And 42 more hook files...

### Code Generation (packages/graphql-types)

| Current                  | Target                                           |
| ------------------------ | ------------------------------------------------ |
| `typescript-react-query` | `typescript-urql` + `typescript-graphql-request` |
| Single output file       | Multiple output files (urql.ts, sdk.ts)          |
| No subscription support  | Full subscription support                        |

**Current Config:**

```typescript
// codegen.ts - CURRENT
generates: {
  "src/generated/graphql.ts": {
    plugins: ["typescript", "typescript-operations", "typescript-react-query"],
    config: { fetcher: "graphql-request", reactQueryVersion: 5 }
  }
}
```

### Backend Apps

**apps/seed:**

- Direct Prisma DB access
- Needs migration to typed graphql-request SDK
- **Files to modify:** `index.ts`, all seed modules

**apps/notification-sender:**

- Uses custom fetch
- Needs migration to typed graphql-request SDK
- **Files to modify:** `src/index.ts`, notification services

---

## Files to Modify

### High Priority (Core Infrastructure)

#### Backend Server

| File                          | Lines | Changes                                             | Risk   |
| ----------------------------- | ----- | --------------------------------------------------- | ------ |
| `src/hono-server.ts`          | 428   | Replace @hono/node-server with Bun native WebSocket | High   |
| `src/index-hono.ts`           | 164   | Update server startup for Bun WS                    | Medium |
| `src/graphql/schema.ts`       | 292   | Add Subscription type import                        | Low    |
| `src/graphql/builder.ts`      | ~50   | Configure subscription auth scopes                  | Low    |
| `src/graphql/yoga-handler.ts` | ~100  | Add WebSocket handler                               | High   |

#### New Backend Files

| File                                 | Purpose                             |
| ------------------------------------ | ----------------------------------- |
| `src/graphql/types/subscriptions.ts` | Pothos subscription definitions     |
| `src/websocket/bun-websocket.ts`     | Bun WebSocket server implementation |
| `src/websocket/auth-handler.ts`      | Cookie-based WebSocket auth         |

#### Use Cases Layer

| File                                                   | Purpose                       |
| ------------------------------------------------------ | ----------------------------- |
| `packages/use-cases/src/ports/PubSubService.ts`        | Port interface for PubSub     |
| `packages/adapters/src/services/EventEmitterPubSub.ts` | In-memory implementation      |
| `packages/adapters/src/services/RedisPubSub.ts`        | Redis implementation (future) |

### Medium Priority (Frontend Migration)

#### Web App

| File                           | Lines | Changes                                        |
| ------------------------------ | ----- | ---------------------------------------------- |
| `src/lib/graphql-client.ts`    | New   | Create urql client                             |
| `src/components/Providers.tsx` | ~30   | Replace QueryClientProvider with urql Provider |
| All `src/hooks/**/*.ts`        | ~2000 | Replace TanStack Query with urql               |

#### Native App

| File                                      | Lines | Changes                         |
| ----------------------------------------- | ----- | ------------------------------- |
| `src/lib/urql-client.ts`                  | New   | Create native urql client       |
| `src/hooks/community/useCommunityFeed.ts` | 278   | Migrate infinite query to urql  |
| `src/hooks/map/useMapLocationStream.ts`   | ~100  | Convert polling to subscription |

### Low Priority (Backend Apps)

| File                                    | Changes                                       |
| --------------------------------------- | --------------------------------------------- |
| `apps/seed/index.ts`                    | Replace Prisma calls with graphql-request SDK |
| `apps/notification-sender/src/index.ts` | Replace custom fetch with typed SDK           |

---

## Integration Points

### 1. WebSocket Authentication Flow

```
1. Client connects to ws://api.mirai.app/graphql/ws
2. Server extracts http-only cookie "auth-token"
3. Server validates token with Supabase
4. Connection established with user context
5. Subscriptions filter by user permissions
```

### 2. PubSub Event Flow

```
Activity Created
    ↓
ActivityFeedController.createActivity()
    ↓
pubSubService.publish(`activity:feed:${tripId}`, activity)
    ↓
GraphQL subscription resolver yields activity
    ↓
Connected clients receive update
```

### 3. Frontend Data Flow (urql)

```
Component mounts
    ↓
useSubscription() connects to WebSocket
    ↓
urql cacheExchange updates normalized cache
    ↓
UI re-renders with new data
    ↓
Optimistic updates handled by graphcache
```

---

## Risk Assessment

### High Risk

| Risk                           | Impact          | Mitigation                                  |
| ------------------------------ | --------------- | ------------------------------------------- |
| Bun WebSocket server stability | Server crashes  | Extensive testing, fallback to polling      |
| Memory leaks in subscriptions  | Server OOM      | Implement max connection limits, heartbeats |
| Breaking changes to all hooks  | Frontend broken | Gradual migration, feature flags            |

### Medium Risk

| Risk                      | Impact             | Mitigation                            |
| ------------------------- | ------------------ | ------------------------------------- |
| WebSocket auth complexity | Security issues    | Same-domain cookies, thorough testing |
| Cache behavior changes    | UI inconsistencies | Comprehensive cache configuration     |
| Mobile battery drain      | Poor UX            | Optimize subscription frequency       |

### Low Risk

| Risk                   | Impact        | Mitigation                        |
| ---------------------- | ------------- | --------------------------------- |
| Codegen plugin changes | Build errors  | Validate output before committing |
| Backend app migration  | Seed failures | Test in staging first             |

---

## Dependencies to Add

### Backend

```json
{
  "graphql-ws": "^5.16.0",
  "ws": "^8.18.0",
  "@graphql-tools/ws": "^0.0.1"
}
```

### Frontend (Web & Native)

```json
{
  "@urql/core": "^5.0.0",
  "@urql/exchange-graphcache": "^7.0.0",
  "@urql/exchange-retry": "^1.3.0",
  "wonka": "^6.3.0"
}
```

### Codegen

```json
{
  "@graphql-codegen/typescript-urql": "^4.0.0",
  "@graphql-codegen/typescript-graphql-request": "^6.0.0"
}
```

---

## Testing Strategy

### Unit Tests

- Subscription resolvers with mock PubSub
- WebSocket auth handler
- urql cache behavior

### Integration Tests

- End-to-end subscription flow
- WebSocket connection lifecycle
- Auth token refresh during connection

### Load Tests

- 1000 concurrent WebSocket connections
- 100 events/second per channel
- Memory usage monitoring

---

## Migration Phases

### Phase 1: Backend Infrastructure

1. Create PubSubService port
2. Implement Bun WebSocket server
3. Add subscription types to schema
4. Test with GraphiQL

### Phase 2: Frontend (Parallel)

1. Configure codegen for urql
2. Create urql clients (web + native)
3. Migrate hooks incrementally
4. Add subscription support

### Phase 3: Backend Apps

1. Migrate seed to graphql-request
2. Migrate notification-sender
3. Service-to-service auth

### Phase 4: Cleanup

1. Remove TanStack Query
2. Remove old codegen config
3. Update documentation

---

## Verification Checklist

- [ ] Bun WebSocket server starts successfully
- [ ] GraphQL subscriptions work in GraphiQL
- [ ] WebSocket auth validates cookies correctly
- [ ] urql client connects and receives updates
- [ ] Native app subscriptions work on device
- [ ] Cache updates propagate correctly
- [ ] No memory leaks after 24h load test
- [ ] Seed app works with new SDK
- [ ] All existing tests pass
