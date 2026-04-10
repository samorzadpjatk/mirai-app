---
title: Migrate tRPC Subscriptions to GraphQL with urql and Code Generation
depends_on: []
---

## Description

Migrate all data fetching from TanStack Query to urql and implement GraphQL subscriptions for real-time features. This completes the migration from tRPC to GraphQL by adding real-time capabilities.

**Current State:**

- Backend: Hono + GraphQL Yoga + Pothos (queries/mutations working)
- Frontend: TanStack Query + graphql-request (no real-time updates)
- Codegen: typescript-react-query plugin (no subscription support)

**Target State:**

- Backend: Bun native WebSocket server with GraphQL subscriptions
- Frontend: urql with cacheExchange, subscriptionExchange, real-time updates
- Codegen: typescript-urql + typescript-graphql-request plugins

**Real-time features to implement:**

1. **Activity feed updates** - New posts appear instantly in trip feeds without polling
2. **Live location sharing** - Real-time location updates from friends during trips
3. **Live challenges/voting** - Real-time voting progress updates during challenges

## Acceptance Criteria

### Backend (Bun + Hono + Pothos)

- [ ] **Bun native WebSocket server** implemented using `Bun.serve()` with `websocket` handler
  - Remove `@hono/node-server` dependency
  - Support HTTP/GraphQL on same port as WebSocket
  - Graceful shutdown handling for WS connections
- [ ] **GraphQL subscriptions** implemented in Pothos schema:
  - `activityFeedUpdated(tripId: ID!): Activity!` - New activity in trip feed
  - `locationUpdated(userIds: [ID!]!): FriendLocation!` - Friend location update
  - `challengeVotingUpdated(challengeId: ID!): VotingProgress!` - Voting progress
- [ ] **PubSubService port** defined in use-cases layer (`packages/use-cases/src/ports/PubSubService.ts`)
  - Interface: `subscribe(channel)`, `publish(channel, payload)`, `unsubscribe(channel)`
  - In-memory EventEmitter implementation in adapters layer
  - Injectable via DI container
- [ ] **WebSocket authentication** via http-only cookies (same-domain)
  - Extract `auth-token` cookie from WebSocket upgrade request
  - Validate with Supabase auth service
  - Reject unauthorized connections before GraphQL execution
  - Support token refresh during long-lived connections
- [ ] **Subscription resolvers tested** with 100% coverage
  - Unit tests with mock PubSub
  - Integration tests with actual WebSocket client
  - Auth validation tests

### Frontend Web (Next.js + urql)

- [ ] **urql client configured** with required exchanges:
  - `cacheExchange` - Normalized cache for queries/mutations
  - `subscriptionExchange` - WebSocket subscription handling
  - `ssrExchange` - Server-side rendering support
  - `retryExchange` - Automatic retry for failed requests
- [ ] **WebSocket endpoint** uses same-domain cookies for auth
  - `wss://api.mirai.app/graphql/ws` for production
  - `ws://localhost:4000/graphql/ws` for development
  - No manual token management (cookies sent automatically)
- [ ] **All TanStack Query hooks replaced** with generated urql hooks
  - Replace `useQuery` with urql `useQuery`
  - Replace `useMutation` with urql `useMutation`
  - Replace `useInfiniteQuery` with urql pagination pattern
  - Update all 15+ hook files in `apps/web/src/hooks/`
- [ ] **Activity feed subscriptions working**
  - New activities appear instantly without page refresh
  - Optimistic UI updates via graphcache
  - Subscription reconnects on connection loss

### Frontend Native (Expo + urql)

- [ ] **urql client configured** with mobile-specific settings:
  - `cacheExchange` with mobile-appropriate cache policy
  - `subscriptionExchange` with native WebSocket
  - Custom fetch that uses `expo-secure-store` for tokens
  - Reconnection logic for mobile network changes
- [ ] **SecureStore integration** for auth token in HTTP requests
  - Read `sb-access-token` from SecureStore for HTTP GraphQL requests
  - WebSocket uses separate cookie-based auth
  - Handle token refresh on 401 errors
- [ ] **All TanStack Query hooks replaced** with generated urql hooks
  - Replace all 46+ hook files in `apps/native/src/hooks/`
  - Maintain custom hook logic (file uploads, camera, etc.)
- [ ] **Real-time features working** on device:
  - Activity feed live updates
  - Friend location streaming (replace polling)
  - Challenge voting progress

### Code Generation

- [ ] **typescript-urql plugin** added to codegen (`packages/graphql-types/codegen.ts`)
  - Generate hooks for queries, mutations, subscriptions
  - Output: `src/generated/urql.ts`
- [ ] **typescript-graphql-request plugin** added for backend apps
  - Generate typed SDK for seed/notification-sender
  - Output: `src/generated/sdk.ts`
- [ ] **Subscription `.graphql` operation files** created:
  - `subscriptions/activity.subscriptions.graphql`
  - `subscriptions/location.subscriptions.graphql`
  - `subscriptions/challenge.subscriptions.graphql`
- [ ] **Both urql and graphql-request types generated**
  - `bun run codegen` generates all files
  - No TypeScript errors in generated code
  - All operations have proper types

### Backend Apps Migration

- [ ] **apps/seed** uses graphql-request SDK (no direct DB access)
  - Replace all Prisma calls with typed GraphQL mutations
  - Use service account authentication
- [ ] **apps/notification-sender** uses graphql-request SDK
  - Replace custom fetch with typed SDK
  - Migrate from REST/tRPC to GraphQL
- [ ] **Service-to-service authentication** configured
  - API key or JWT for internal services
  - Rate limiting for service accounts
  - Audit logging for service requests

## Architecture Overview

### Clean Architecture Compliance

All apps use the same GraphQL API - no backend bypass:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├─────────────────────────────────────────────────────────────┤
│  apps/web         │  apps/native        │  apps/seed        │
│  ─────────────    │  ─────────────────  │  ─────────────    │
│  urql (React)     │  urql (React Native)│  graphql-request  │
│  + SSR support    │  + SecureStore      │  (typed SDK)      │
├─────────────────────────────────────────────────────────────┤
│  apps/notification-sender                                     │
│  ─────────────────────────                                    │
│  graphql-request (typed SDK)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Hono)                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  HTTP /graphql         │        WebSocket /graphql/ws   ││
│  │  ─────────────────     │        ─────────────────────   ││
│  │  Yoga + Pothos         │        Bun WebSocket           ││
│  │  Queries/Mutations     │        Subscriptions           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Entities   │  │ Value Objects│  │ Domain Services   │  │
│  └─────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer         | Technology                | Purpose                  |
| ------------- | ------------------------- | ------------------------ |
| **Backend**   | Bun + Hono                | Native WebSocket support |
| **GraphQL**   | Pothos + Yoga             | Schema + execution       |
| **WebSocket** | Bun native                | High-performance WS      |
| **Web**       | Next.js + urql            | React + GraphQL          |
| **Native**    | Expo + urql               | Mobile + GraphQL         |
| **Cache**     | @urql/exchange-graphcache | Normalized cache         |
| **Codegen**   | typescript-urql           | Type generation          |

### Key Decisions

1. **Bun native server** instead of @hono/node-server for first-class WebSocket support
2. **Same-domain cookies** for WebSocket authentication (secure, no localStorage)
3. **urql over Apollo** for smaller bundle size and cleaner API
4. **graphql-request for backend apps** - no UI/cache needs
5. **PubSub abstraction** allows switching from EventEmitter to Redis later

### Data Flow

```
User creates activity
    ↓
ActivityController.createActivity(input)
    ↓
CreateActivityUseCase.execute(input)
    ↓
ActivityRepository.save(activity)
    ↓
pubSubService.publish(`activity:feed:${tripId}`, activity)
    ↓
GraphQL subscription resolver yields
    ↓
WebSocket broadcasts to connected clients
    ↓
urql cacheExchange updates normalized cache
    ↓
React components re-render with new data
```

### Subscription Channels

| Feature       | Channel Pattern           | Payload        |
| ------------- | ------------------------- | -------------- |
| Activity feed | `activity:feed:${tripId}` | Activity       |
| Location      | `location:${userId}`      | FriendLocation |
| Voting        | `voting:${challengeId}`   | VotingProgress |

### Auth Flow

```
1. User logs in → Server sets httpOnly cookie `auth-token`
2. WebSocket connects → Cookie sent automatically with upgrade request
3. Server validates token with Supabase
4. Connection accepted with user context
5. Subscriptions filter by user's trip access
```

## Out of Scope

- ❌ Native WebSocket binary protocols (use graphql-ws text)
- ❌ Redis PubSub (EventEmitter sufficient for now)
- ❌ Subscription persistence across server restarts
- ❌ Multi-region WebSocket routing
- ❌ Apollo Federation (single schema only)

## Success Metrics

- ⏱️ Time to first activity update: < 100ms from creation to display
- 🔋 Battery impact: Location polling → subscription reduces drain by 50%
- 🧠 Memory: No leaks after 24h load test with 1000 concurrent connections
- 📱 UX: Activity feed updates feel instant (no visible polling delay)

## Risks and Mitigations

| Risk                                   | Likelihood | Impact | Mitigation                                 |
| -------------------------------------- | ---------- | ------ | ------------------------------------------ |
| Bun WebSocket instability              | Medium     | High   | Fallback to polling, extensive testing     |
| Memory leaks in long-lived connections | Medium     | High   | Connection limits, heartbeats, monitoring  |
| Breaking all frontend hooks            | High       | High   | Gradual migration, parallel testing        |
| Mobile battery drain                   | Medium     | Medium | Optimize update frequency, batch updates   |
| Authentication edge cases              | Medium     | Medium | Same-domain cookies, thorough auth testing |

## Implementation Process

### Phase 1: Backend Foundation (Foundation)

**Step 1.1: Create PubSubService Port and Implementation [DONE]**

- **Goal:** Define the PubSub abstraction and in-memory implementation
- **Output:**
  - `packages/use-cases/src/ports/PubSubService.ts`
  - `packages/adapters/src/services/EventEmitterPubSub.ts`
- **Success Criteria:**
  - [ ] Port interface defines `subscribe`, `publish`, `unsubscribe` methods
  - [ ] EventEmitterPubSub passes unit tests with 100% coverage
  - [ ] Service is injectable via awilix-modular DI container
  - [ ] Async iterable yields published events in order
- **Subtasks:**
  - [ ] Define PubSubService interface with TypeScript
  - [ ] Implement EventEmitterPubSub with async generators
  - [ ] Write unit tests for subscribe/publish/unsubscribe
  - [ ] Register in DI container as singleton
- **Risks:**
  - Memory leaks if subscribers not cleaned up (mitigate with weak refs)
  - Event ordering issues with high concurrency
- **Estimated Effort:** 4 hours
- **Agent:** sdd:developer (opus)

---

**Step 1.2: Implement Bun WebSocket Server**

- **Goal:** Replace @hono/node-server with Bun native WebSocket support
- **Output:**
  - `apps/backend-server/src/websocket/bun-server.ts`
  - Updated `apps/backend-server/src/hono-server.ts`
- **Success Criteria:**
  - [ ] Server starts with `Bun.serve()` instead of @hono/node-server
  - [ ] HTTP GraphQL requests handled on same port
  - [ ] WebSocket upgrade requests accepted at `/graphql/ws`
  - [ ] Graceful shutdown closes all WebSocket connections
  - [ ] Existing tests pass without modification
- **Subtasks:**
  - [ ] Create Bun WebSocket server with HTTP + WS handlers
  - [ ] Implement WebSocket upgrade logic
  - [ ] Integrate with existing Hono app
  - [ ] Add connection management (track active connections)
  - [ ] Update shutdown handler to close WS connections
- **Blockers:** None
- **Risks:**
  - Bun WebSocket API may have edge cases (test thoroughly)
  - Connection handling different from Node.js (document differences)
- **Estimated Effort:** 6 hours
- **Agent:** sdd:developer (opus)

---

**Step 1.3: WebSocket Authentication Handler**

- **Goal:** Implement cookie-based auth for WebSocket connections
- **Output:**
  - `apps/backend-server/src/websocket/auth-handler.ts`
  - Updated GraphQL context to include auth from WebSocket
- **Success Criteria:**
  - [ ] Extract `auth-token` cookie from WebSocket upgrade request
  - [ ] Validate token with Supabase auth service
  - [ ] Reject unauthorized connections with proper error code
  - [ ] Auth context available in subscription resolvers
  - [ ] Unit tests for auth handler
- **Subtasks:**
  - [ ] Create auth cookie extraction function
  - [ ] Integrate with Supabase auth validation
  - [ ] Add error handling for expired/invalid tokens
  - [ ] Pass auth context through to GraphQL resolvers
  - [ ] Write comprehensive auth tests
- **Blockers:** Requires Step 1.2
- **Risks:**
  - Token refresh during WS connection (handle gracefully)
  - Cookie parsing edge cases (test with various clients)
- **Estimated Effort:** 4 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 1.4: Add Subscription Types to GraphQL Schema**

- **Goal:** Define subscription types in Pothos with proper auth
- **Output:**
  - `apps/backend-server/src/graphql/types/subscriptions.ts`
  - Updated `apps/backend-server/src/graphql/schema.ts`
- **Success Criteria:**
  - [ ] `activityFeedUpdated(tripId: ID!): Activity!` subscription defined
  - [ ] `locationUpdated(userIds: [ID!]!): FriendLocation!` subscription defined
  - [ ] `challengeVotingUpdated(challengeId: ID!): VotingProgress!` subscription defined
  - [ ] All subscriptions require authentication
  - [ ] Schema builds without errors
  - [ ] SDL includes subscription types
- **Subtasks:**
  - [ ] Create subscriptions.ts with Pothos subscription type
  - [ ] Define activity feed subscription with auth check
  - [ ] Define location subscription with user filtering
  - [ ] Define voting subscription with challenge access check
  - [ ] Import in schema.ts
  - [ ] Generate and verify updated SDL
- **Blockers:** Requires Step 1.1, Step 1.3
- **Risks:**
  - Pothos subscription syntax may differ from queries/mutations
  - Auth scope integration needs testing
- **Estimated Effort:** 4 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 1.5: Implement Subscription Resolvers with PubSub**

- **Goal:** Connect subscription resolvers to PubSub service
- **Output:**
  - Updated subscription resolvers in `subscriptions.ts`
  - Integration with use cases for publish events
- **Success Criteria:**
  - [ ] Activity creation publishes to `activity:feed:${tripId}` channel
  - [ ] Location update publishes to `location:${userId}` channel
  - [ ] Vote submission publishes to `voting:${challengeId}` channel
  - [ ] Subscriptions yield correct data shape
  - [ ] Integration tests pass
- **Subtasks:**
  - [ ] Modify ActivityFeedController to publish on create
  - [ ] Modify LocationController to publish on update
  - [ ] Modify ChallengeVoteController to publish on vote
  - [ ] Wire up subscription resolvers to PubSub
  - [ ] Write integration tests
- **Blockers:** Requires Step 1.1, Step 1.4
- **Risks:**
  - Race conditions between publish and subscribe
  - Memory pressure with many concurrent subscriptions
- **Estimated Effort:** 6 hours
- **Agent:** sdd:developer (opus)

---

### Phase 2: Code Generation (Foundation)

**Step 2.1: Configure Codegen for urql and graphql-request**

- **Goal:** Update GraphQL Code Generator to produce urql and SDK types
- **Output:**
  - Updated `packages/graphql-types/codegen.ts`
  - `packages/graphql-types/src/generated/urql.ts`
  - `packages/graphql-types/src/generated/sdk.ts`
- **Success Criteria:**
  - [ ] `typescript-urql` plugin configured and generates valid TypeScript
  - [ ] `typescript-graphql-request` plugin configured and generates valid SDK
  - [ ] Subscription operations generate urql hooks
  - [ ] No TypeScript errors in generated files
  - [ ] All existing queries/mutations still generated
- **Subtasks:**
  - [ ] Install `@graphql-codegen/typescript-urql` package
  - [ ] Install `@graphql-codegen/typescript-graphql-request` package
  - [ ] Update codegen.ts with multiple output files
  - [ ] Run codegen and verify output
  - [ ] Fix any type errors in generated code
- **Blockers:** None
- **Risks:**
  - Plugin version compatibility issues
  - Breaking changes in generated API shape
- **Estimated Effort:** 3 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 2.2: Create Subscription GraphQL Operation Files**

- **Goal:** Define subscription operations for code generation
- **Output:**
  - `packages/graphql-types/src/graphql/subscriptions/activity.subscriptions.graphql`
  - `packages/graphql-types/src/graphql/subscriptions/location.subscriptions.graphql`
  - `packages/graphql-types/src/graphql/subscriptions/challenge.subscriptions.graphql`
- **Success Criteria:**
  - [ ] `ActivityFeedUpdated` subscription with all required fields
  - [ ] `LocationUpdated` subscription with location fields
  - [ ] `ChallengeVotingUpdated` subscription with voting progress fields
  - [ ] Operations compile in codegen
  - [ ] Generated hooks have correct types
- **Subtasks:**
  - [ ] Create subscription .graphql files
  - [ ] Define ActivityFeedUpdated with Activity fields
  - [ ] Define LocationUpdated with FriendLocation fields
  - [ ] Define ChallengeVotingUpdated with VotingProgress fields
  - [ ] Run codegen and verify hooks
- **Blockers:** Requires Step 1.4 (schema must exist)
- **Risks:**
  - Field selection may differ between clients
  - Fragment reuse across subscription files
- **Estimated Effort:** 2 hours
- **Agent:** sdd:developer (haiku)

---

### Phase 3: Frontend Web Migration (User Story)

**Step 3.1: Create urql Client with Exchanges**

- **Goal:** Configure urql client for web with all required exchanges
- **Output:**
  - `apps/web/src/lib/urql-client.ts`
  - Updated `apps/web/src/components/Providers.tsx`
- **Success Criteria:**
  - [ ] Client configured with `cacheExchange`, `fetchExchange`
  - [ ] `subscriptionExchange` configured for WebSocket
  - [ ] `ssrExchange` for server-side rendering
  - [ ] Cookie-based auth (credentials: 'include')
  - [ ] GraphQL queries work through urql
- **Subtasks:**
  - [ ] Install urql packages (@urql/core, @urql/exchange-graphcache)
  - [ ] Create urql client configuration
  - [ ] Configure WebSocket endpoint
  - [ ] Add SSR exchange for Astro
  - [ ] Replace QueryClientProvider with urql Provider
  - [ ] Test simple query works
- **Blockers:** Requires Step 2.1
- **Risks:**
  - SSR hydration mismatches
  - WebSocket connection in server environment
- **Estimated Effort:** 4 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 3.2: Migrate Web Hooks to urql (Batch 1)**

- **Goal:** Replace TanStack Query with urql in admin hooks
- **Output:**
  - Updated `apps/web/src/hooks/admin/useChallengeSubmissions.ts`
  - Updated `apps/web/src/hooks/admin/useJudgement.ts`
  - Updated `apps/web/src/hooks/admin/useStaffVoting.ts`
- **Success Criteria:**
  - [ ] All TanStack Query imports removed
  - [ ] urql `useQuery` used for data fetching
  - [ ] urql `useMutation` used for mutations
  - [ ] Cache updates work correctly
  - [ ] Existing tests pass
- **Subtasks:**
  - [ ] Migrate useChallengeSubmissions to urql
  - [ ] Migrate useJudgement to urql
  - [ ] Migrate useStaffVoting to urql
  - [ ] Update tests to work with urql
  - [ ] Verify functionality in browser
- **Blockers:** Requires Step 3.1
- **Risks:**
  - Different cache behavior between TanStack and urql
  - Mutation cache updates need graphcache configuration
- **Estimated Effort:** 6 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 3.3: Migrate Remaining Web Hooks (Batch 2)**

- **Goal:** Complete migration of all web hooks
- **Output:**
  - Updated remaining hooks in `apps/web/src/hooks/`
- **Success Criteria:**
  - [ ] All 15+ hook files use urql
  - [ ] No TanStack Query dependencies in web app
  - [ ] TanStack Query package removed from package.json
  - [ ] All tests pass
  - [ ] Manual testing confirms functionality
- **Subtasks:**
  - [ ] Migrate useChallengeForm.ts
  - [ ] Migrate useWebFileUpload.ts
  - [ ] Migrate useActiveTripId.ts
  - [ ] Update all test files
  - [ ] Remove @tanstack/react-query from dependencies
- **Blockers:** Requires Step 3.2
- **Risks:**
  - Breaking changes in hook APIs
  - Test mocks need significant updates
- **Estimated Effort:** 6 hours
- **Agent:** sdd:developer (sonnet)

---

### Phase 4: Frontend Native Migration (User Story)

**Step 4.1: Create Native urql Client**

- **Goal:** Configure urql client for React Native with SecureStore
- **Output:**
  - `apps/native/src/lib/urql-client.ts`
  - Updated `apps/native/src/app/_layout.tsx` with Provider
- **Success Criteria:**
  - [ ] Client configured with `cacheExchange`
  - [ ] `subscriptionExchange` with native WebSocket
  - [ ] Custom fetch using SecureStore for auth token
  - [ ] Reconnection logic for mobile networks
  - [ ] GraphQL queries work
- **Subtasks:**
  - [ ] Install urql packages in native app
  - [ ] Create urql client with SecureStore integration
  - [ ] Configure native WebSocket for subscriptions
  - [ ] Add network change reconnection
  - [ ] Integrate with app layout
  - [ ] Test query works on device
- **Blockers:** Requires Step 2.1
- **Risks:**
  - SecureStore async access complicates client creation
  - WebSocket differences between iOS/Android
- **Estimated Effort:** 4 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 4.2: Migrate Native Hooks (Batch 1 - Core)**

- **Goal:** Replace TanStack Query in core hooks
- **Output:**
  - Updated `apps/native/src/hooks/community/useCommunityFeed.ts`
  - Updated `apps/native/src/hooks/trips/useTrips.ts`
  - Updated `apps/native/src/hooks/challenges/useChallenges.ts`
- **Success Criteria:**
  - [ ] useCommunityFeed uses urql (including infinite scroll pattern)
  - [ ] useTrips uses urql
  - [ ] useChallenges uses urql
  - [ ] Cache behavior equivalent to TanStack Query
  - [ ] Tests updated and passing
- **Subtasks:**
  - [ ] Migrate useCommunityFeed with pagination
  - [ ] Migrate useTrips
  - [ ] Migrate useChallenges
  - [ ] Update test mocks
  - [ ] Test on device
- **Blockers:** Requires Step 4.1
- **Risks:**
  - Infinite scroll pattern differs in urql
  - Native gesture/scroll behavior changes
- **Estimated Effort:** 6 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 4.3: Migrate Native Hooks (Batch 2 - Location)**

- **Goal:** Convert location polling to subscriptions
- **Output:**
  - Updated `apps/native/src/hooks/map/useMapLocationStream.ts`
  - Subscription-based location tracking
- **Success Criteria:**
  - [ ] useMapLocationStream uses `useSubscription` instead of polling
  - [ ] Real-time location updates received via WebSocket
  - [ ] Battery usage reduced compared to polling
  - [ ] Connection handles background/foreground transitions
  - [ ] Tests updated
- **Subtasks:**
  - [ ] Replace polling with useSubscription
  - [ ] Configure subscription for friend locations
  - [ ] Handle app backgrounding (pause/resume subscription)
  - [ ] Optimize for battery life
  - [ ] Test location streaming
- **Blockers:** Requires Step 4.2, Step 1.5 (backend publishing)
- **Risks:**
  - WebSocket connection drops in background
  - Battery still drained if updates too frequent
- **Estimated Effort:** 6 hours
- **Agent:** sdd:developer (opus)

---

**Step 4.4: Migrate Remaining Native Hooks**

- **Goal:** Complete native hook migration
- **Output:**
  - All remaining hooks in `apps/native/src/hooks/` updated
- **Success Criteria:**
  - [ ] All 46+ hook files use urql
  - [ ] No TanStack Query dependencies in native app
  - [ ] @tanstack/react-query removed from package.json
  - [ ] All tests pass
  - [ ] App runs without errors
- **Subtasks:**
  - [ ] Migrate remaining trip hooks
  - [ ] Migrate notification hooks
  - [ ] Migrate reward hooks
  - [ ] Update all test files
  - [ ] Remove TanStack Query dependencies
  - [ ] Full app testing
- **Blockers:** Requires Step 4.3
- **Risks:**
  - Large surface area for bugs
  - Test coverage gaps
- **Estimated Effort:** 8 hours
- **Agent:** sdd:developer (sonnet)

---

### Phase 5: Backend Apps Migration (Polish)

**Step 5.1: Migrate Seed App to graphql-request**

- **Goal:** Replace direct DB access with typed GraphQL SDK
- **Output:**
  - Updated `apps/seed/index.ts`
  - All seed modules using graphql-request
- **Success Criteria:**
  - [ ] No Prisma imports in seed app
  - [ ] Uses `@mirai-app/graphql-types` SDK
  - [ ] Service account authentication
  - [ ] All seed operations work
  - [ ] Tests pass
- **Subtasks:**
  - [ ] Import generated SDK
  - [ ] Replace Prisma queries with GraphQL mutations
  - [ ] Configure service account auth
  - [ ] Test seed script
  - [ ] Update documentation
- **Blockers:** Requires Step 2.1
- **Risks:**
  - Performance impact of HTTP vs direct DB
  - Service account auth complexity
- **Estimated Effort:** 4 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 5.2: Migrate Notification Sender**

- **Goal:** Replace custom fetch with typed graphql-request
- **Output:**
  - Updated `apps/notification-sender/src/index.ts`
  - Notification services using SDK
- **Success Criteria:**
  - [ ] Uses `@mirai-app/graphql-types` SDK
  - [ ] No custom fetch code
  - [ ] Service-to-service auth configured
  - [ ] Notification delivery works
  - [ ] Tests pass
- **Subtasks:**
  - [ ] Import generated SDK
  - [ ] Replace custom fetch with SDK calls
  - [ ] Configure internal service auth
  - [ ] Test notification flow
  - [ ] Update tests
- **Blockers:** Requires Step 2.1, Step 5.1
- **Risks:**
  - API compatibility with existing notification logic
- **Estimated Effort:** 3 hours
- **Agent:** sdd:developer (sonnet)

---

**Step 5.3: Configure Service-to-Service Auth**

- **Goal:** Secure backend app authentication
- **Output:**
  - Service account configuration
  - API key or JWT validation in backend
- **Success Criteria:**
  - [ ] Seed app authenticates with service account
  - [ ] Notification sender authenticates
  - [ ] API validates service tokens
  - [ ] Audit logging for service requests
  - [ ] Tests for auth flow
- **Subtasks:**
  - [ ] Create service account type in auth system
  - [ ] Generate API keys for internal services
  - [ ] Add service token validation middleware
  - [ ] Add audit logging
  - [ ] Write tests
- **Blockers:** Requires Step 5.1, Step 5.2
- **Risks:**
  - Token rotation complexity
  - Secret management
- **Estimated Effort:** 3 hours
- **Agent:** sdd:developer (sonnet)

---

### Phase 6: Testing & Verification (Polish)

**Step 6.1: Backend Load Testing**

- **Goal:** Verify WebSocket server handles load
- **Output:**
  - Load test scripts
  - Performance report
- **Success Criteria:**
  - [ ] 1000 concurrent WebSocket connections stable
  - [ ] Memory usage stable over 24 hours
  - [ ] No connection leaks
  - [ ] Subscription latency < 100ms p99
  - [ ] Report documented
- **Subtasks:**
  - [ ] Create load test script with ws client
  - [ ] Run 1000 connection test
  - [ ] Monitor memory over 24h
  - [ ] Measure latency distribution
  - [ ] Document results
- **Blockers:** Requires all Phase 1 steps
- **Risks:**
  - Bun performance different from Node.js
  - Memory leaks only visible under load
- **Estimated Effort:** 4 hours
- **Agent:** sdd:qa-engineer (sonnet)

---

**Step 6.2: End-to-End Testing**

- **Goal:** Verify complete subscription flow
- **Output:**
  - E2E test suite
  - Test results
- **Success Criteria:**
  - [ ] Activity feed subscription E2E test passes
  - [ ] Location subscription E2E test passes
  - [ ] Voting subscription E2E test passes
  - [ ] Auth flow E2E test passes
  - [ ] Mobile app E2E tests pass
- **Subtasks:**
  - [ ] Write WebSocket subscription tests
  - [ ] Write activity feed flow test
  - [ ] Write location sharing flow test
  - [ ] Write voting flow test
  - [ ] Run tests on CI
- **Blockers:** Requires all previous phases
- **Risks:**
  - Flaky WebSocket tests
  - Test environment differences
- **Estimated Effort:** 6 hours
- **Agent:** sdd:qa-engineer (sonnet)

---

## Implementation Summary

| Phase                       | Steps  | Effort  | Parallelizable        |
| --------------------------- | ------ | ------- | --------------------- |
| Phase 1: Backend Foundation | 5      | 24h     | Sequential            |
| Phase 2: Code Generation    | 2      | 5h      | With Phase 1          |
| Phase 3: Frontend Web       | 3      | 16h     | After Phase 2         |
| Phase 4: Frontend Native    | 4      | 24h     | Parallel with Phase 3 |
| Phase 5: Backend Apps       | 3      | 10h     | After Phase 2         |
| Phase 6: Testing            | 2      | 10h     | After all             |
| **Total**                   | **19** | **89h** | ~50h parallel         |

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (unit, integration, E2E)
- [ ] Load testing passed (1000 connections, 24h stability)
- [ ] Documentation updated (README, API docs)
- [ ] No TanStack Query dependencies anywhere
- [ ] WebSocket subscriptions working in production
- [ ] Mobile battery usage improved (measured)
- [ ] Code review approved by 2 reviewers

## Verification Rubrics

Each implementation step includes verification criteria. Use LLM-as-Judge for the following critical steps.

### High Criticality (Panel Review)

**Step 1.2: Bun WebSocket Server [DONE]**

- **Verification Level:** Panel (2 judges)
- **Threshold:** 4.5/5.0 per judge
- **Rubric:**
  1. **Bun API Correctness** (0.30): Uses `Bun.serve()` with proper websocket handlers
  2. **HTTP/WS Coexistence** (0.25): Both protocols work on same port
  3. **Graceful Shutdown** (0.25): Closes connections cleanly, no memory leaks
  4. **Error Handling** (0.20): Handles upgrade failures, connection errors

**Step 1.5: Subscription Resolvers**

- **Verification Level:** Panel (2 judges)
- **Threshold:** 4.5/5.0 per judge
- **Rubric:**
  1. **PubSub Integration** (0.30): Correctly publishes and subscribes to channels
  2. **Auth Filtering** (0.25): Respects user permissions in subscriptions
  3. **Async Generator** (0.25): Properly yields async iterable
  4. **Error Handling** (0.20): Handles disconnects, errors gracefully

**Step 4.3: Native Location Subscription**

- **Verification Level:** Panel (2 judges)
- **Threshold:** 4.5/5.0 per judge
- **Rubric:**
  1. **Subscription Works** (0.30): Real-time updates received via WebSocket
  2. **Mobile Lifecycle** (0.25): Handles background/foreground correctly
  3. **Battery Optimization** (0.25): Significant improvement over polling
  4. **Reconnection Logic** (0.20): Recovers from connection drops

### Medium Criticality (Single Judge)

**Step 1.1: PubSubService**

- **Verification Level:** Single
- **Threshold:** 4.0/5.0
- **Rubric:**
  1. **Interface Design** (0.30): Clean abstraction, async iterable pattern
  2. **Implementation** (0.30): EventEmitterPubSub works correctly
  3. **DI Integration** (0.20): Properly injectable via awilix-modular
  4. **Test Coverage** (0.20): 100% unit test coverage

**Step 1.3: WebSocket Auth**

- **Verification Level:** Single
- **Threshold:** 4.0/5.0
- **Rubric:**
  1. **Cookie Extraction** (0.30): Correctly extracts auth from WebSocket
  2. **Token Validation** (0.30): Validates with Supabase properly
  3. **Rejection Handling** (0.20): Unauthorized connections rejected
  4. **Context Passing** (0.20): Auth context available in resolvers

**Step 2.1: Codegen Configuration**

- **Verification Level:** Single
- **Threshold:** 4.0/5.0
- **Rubric:**
  1. **Plugin Setup** (0.35): Both typescript-urql and typescript-graphql-request configured
  2. **Output Quality** (0.35): Generated TypeScript compiles without errors
  3. **Subscription Support** (0.30): Subscription operations generate proper hooks

**Step 3.1: Web urql Client**

- **Verification Level:** Single
- **Threshold:** 4.0/5.0
- **Rubric:**
  1. **Exchanges Config** (0.30): All required exchanges present and configured
  2. **WebSocket Setup** (0.30): WebSocket endpoint and auth configured
  3. **SSR Support** (0.20): ssrExchange properly integrated with Astro
  4. **Query Works** (0.20): Basic GraphQL query succeeds

**Step 4.1: Native urql Client**

- **Verification Level:** Single
- **Threshold:** 4.0/5.0
- **Rubric:**
  1. **SecureStore Integration** (0.30): Auth token correctly retrieved
  2. **Native WebSocket** (0.30): WebSocket works on iOS/Android
  3. **Reconnection** (0.20): Handles network changes
  4. **Query Works** (0.20): Basic query succeeds on device

**Step 6.1: Load Testing**

- **Verification Level:** Single
- **Threshold:** 4.0/5.0
- **Rubric:**
  1. **Connection Count** (0.25): 1000 concurrent connections achieved
  2. **Memory Stability** (0.25): No leaks over 24h
  3. **Latency** (0.25): p99 < 100ms
  4. **Documentation** (0.25): Results clearly documented

### Low Criticality (Per-Item)

**Steps 3.2, 3.3, 4.2, 4.4: Hook Migrations**

- **Verification Level:** Per-Item
- **Threshold:** 3.5/5.0 per hook file
- **Rubric:**
  1. **Imports Replaced** (0.40): No TanStack Query imports remain
  2. **Functionality** (0.40): Hook works equivalently
  3. **Tests Pass** (0.20): Unit tests updated and passing

**Steps 5.1, 5.2: Backend App Migration**

- **Verification Level:** Per-Item
- **Threshold:** 3.5/5.0
- **Rubric:**
  1. **SDK Usage** (0.40): Uses generated graphql-request SDK
  2. **No Direct DB** (0.40): No Prisma/raw SQL calls remain
  3. **Auth Works** (0.20): Service account auth functions

### Verification Summary Table

| Step | Level    | Threshold | Judges | Auto/Manual                    |
| ---- | -------- | --------- | ------ | ------------------------------ |
| 1.1  | Single   | 4.0       | 1      | Auto                           |
| 1.2  | Panel    | 4.5       | 2      | Manual review required         |
| 1.3  | Single   | 4.0       | 1      | Auto                           |
| 1.4  | Per-Item | 3.5       | 1      | Auto                           |
| 1.5  | Panel    | 4.5       | 2      | Manual review required         |
| 2.1  | Single   | 4.0       | 1      | Auto                           |
| 2.2  | Per-Item | 3.5       | 1      | Auto                           |
| 3.1  | Single   | 4.0       | 1      | Auto                           |
| 3.2  | Per-Item | 3.5       | 1      | Auto                           |
| 3.3  | Per-Item | 3.5       | 1      | Auto                           |
| 4.1  | Single   | 4.0       | 1      | Auto                           |
| 4.2  | Per-Item | 3.5       | 1      | Auto                           |
| 4.3  | Panel    | 4.5       | 2      | Manual review + device testing |
| 4.4  | Per-Item | 3.5       | 1      | Auto                           |
| 5.1  | Per-Item | 3.5       | 1      | Auto                           |
| 5.2  | Per-Item | 3.5       | 1      | Auto                           |
| 5.3  | Per-Item | 3.5       | 1      | Auto                           |
| 6.1  | Single   | 4.0       | 1      | Manual + automated             |
| 6.2  | Single   | 4.0       | 1      | Manual + automated             |

### Sub-Agent Execution with Verification

For critical steps (1.2, 1.5, 4.3), use the following pattern:

```
Implement (opus) → Judge 1 (opus) → Judge 2 (opus) →
Both >= 4.5? → Yes: Proceed | No: Revise → Re-judge
```

For standard steps:

```
Implement (sonnet) → Judge (sonnet) →
Score >= threshold? → Yes: Proceed | No: Revise → Re-judge
```

Maximum 3 iterations per step before escalation to human review.

## Parallel Execution Plan

This section maps dependencies and identifies parallelizable work streams.

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOUNDATION PHASE                                   │
│  ┌─────────────────┐                                                        │
│  │ Step 1.1        │                                                        │
│  │ PubSubService   │──────────────────┐                                     │
│  └─────────────────┘                  │                                     │
│           │                           │                                     │
│           ▼                           ▼                                     │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │ Step 1.2        │         │ Step 2.1        │                           │
│  │ Bun WS Server   │         │ Codegen Config  │                           │
│  └─────────────────┘         └─────────────────┘                           │
│           │                           │                                     │
│           ▼                           ▼                                     │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │ Step 1.3        │         │ Step 2.2        │                           │
│  │ WS Auth         │         │ Subscriptions   │                           │
│  └─────────────────┘         │ GraphQL Files   │                           │
│           │                   └─────────────────┘                           │
│           │                           │                                     │
│           ▼                           ▼                                     │
│  ┌─────────────────┐                                                  │
│  │ Step 1.4        │                                                  │
│  │ Schema Types    │                                                  │
│  └─────────────────┘                                                  │
│           │                                                            │
│           ▼                                                            │
│  ┌─────────────────┐                                                  │
│  │ Step 1.5        │                                                  │
│  │ Resolvers       │                                                  │
│  └─────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PARALLEL USER STORIES                                │
│                                                                              │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   WEB FRONTEND (Phase 3)   │  │   NATIVE FRONTEND (Phase 4)        │  │
│  │                            │  │                                    │  │
│  │  Step 3.1 ──► Step 3.2    │  │  Step 4.1 ──► Step 4.2 ──► Step 4.3 │  │
│  │     │           │         │  │     │         │            │        │  │
│  │     │           ▼         │  │     │         ▼            ▼        │  │
│  │     │       Step 3.3      │  │     │       Step 4.4               │  │
│  │     │                     │  │     │                            │  │
│  │     └─────────────────────│──│─────┘                            │  │
│  │                           │  │                                    │  │
│  └───────────────────────────┘  └────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────┐                                            │
│  │  BACKEND APPS (Phase 5)      │                                            │
│  │                              │                                            │
│  │  Step 5.1 ──► Step 5.2 ──► Step 5.3                                       │
│  │                              │                                            │
│  └─────────────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TESTING PHASE (Phase 6)                           │
│                                                                              │
│  Step 6.1 (Load Testing) ──┐                                               │
│                             ├──► Final Verification                         │
│  Step 6.2 (E2E Testing) ───┘                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parallelization Groups

**Wave 1: Foundation (Sequential within wave)**

- **Stream A:** Backend Infrastructure
  - Agent: opus (complex Bun WebSocket, architecture decisions)
  - Steps: 1.1 → 1.2 → 1.3 → 1.4 → 1.5
  - Cannot be parallelized - each step depends on previous
- **Stream B:** Code Generation (can run parallel to Stream A after 1.1)
  - Agent: sonnet
  - Steps: 2.1 → 2.2
  - Depends on: Step 1.1 (PubSubService defined) for 2.2

**Wave 2: Frontend Migration (Parallel streams)**

- **Stream C:** Web Frontend
  - Agent: sonnet
  - Steps: 3.1 → 3.2 → 3.3
  - Depends on: Wave 1 complete
  - Can run parallel with: Stream D

- **Stream D:** Native Frontend
  - Agent: sonnet (opus for 4.3 - location subscription complexity)
  - Steps: 4.1 → 4.2 → 4.3 → 4.4
  - Depends on: Wave 1 complete
  - Can run parallel with: Stream C

- **Stream E:** Backend Apps
  - Agent: sonnet
  - Steps: 5.1 → 5.2 → 5.3
  - Depends on: Wave 1 complete (Step 2.1 specifically)
  - Can run parallel with: Streams C, D

**Wave 3: Testing (Sequential)**

- **Stream F:** Quality Assurance
  - Agent: sonnet
  - Steps: 6.1, 6.2
  - Depends on: All other streams complete
  - Cannot be parallelized - both testing steps depend on full implementation

### Sub-Agent Execution Directives

When implementing, use the following agent configuration:

**Foundation Phase (Wave 1):**

```yaml
- Step 1.1 (PubSubService):
    agent: sdd:developer
    model: opus
    reason: "Complex async generator patterns, requires careful design"

- Step 1.2 (Bun WS Server):
    agent: sdd:developer
    model: opus
    reason: "Bun WebSocket API nuances, server architecture"

- Step 1.3 (WS Auth):
    agent: sdd:developer
    model: sonnet
    reason: "Standard auth patterns, well-defined requirements"

- Step 1.4 (Schema Types):
    agent: sdd:developer
    model: sonnet
    reason: "Pothos pattern following, no novel complexity"

- Step 1.5 (Resolvers):
    agent: sdd:developer
    model: opus
    reason: "Integration of multiple systems, PubSub wiring"
```

**Frontend Phase (Wave 2):**

```yaml
- Steps 3.x (Web hooks):
    agent: sdd:developer
    model: sonnet
    reason: "Pattern-based migration, high volume but low complexity"
    parallel: true # Can run multiple hooks in parallel

- Step 4.3 (Location Subscription):
    agent: sdd:developer
    model: opus
    reason: "Complex mobile lifecycle, battery optimization"

- Other 4.x steps:
    agent: sdd:developer
    model: sonnet
```

**Testing Phase (Wave 3):**

```yaml
- Steps 6.x:
    agent: sdd:qa-engineer
    model: sonnet
    reason: "Testing expertise required, not critical path"
```

### Quality Gates

Each wave has exit criteria before next wave starts:

**Wave 1 Exit Criteria:**

- [ ] Bun WebSocket server starts and accepts connections
- [ ] GraphiQL shows subscription types in schema
- [ ] Codegen produces valid TypeScript
- [ ] Unit tests for PubSub pass

**Wave 2 Exit Criteria:**

- [ ] Web app builds without errors
- [ ] Native app builds without errors
- [ ] Basic query works in both apps
- [ ] No TanStack Query imports remain (verified by grep)

**Wave 3 Exit Criteria:**

- [ ] Load test passes (1000 connections)
- [ ] E2E tests pass
- [ ] Memory profile acceptable
- [ ] Battery test on mobile shows improvement

### Critical Path

The critical path (minimum time to completion) is:

```
Wave 1 Stream A: 24 hours (cannot be shortened - sequential dependencies)
Wave 2 Stream D: 24 hours (longer than Web or Backend Apps)
Wave 3: 10 hours
─────────────────────────────────────
Total Critical Path: ~58 hours (7.25 days @ 8h/day)
```

With full parallelization (multiple agents working simultaneously):

- Wave 1: 24 hours
- Wave 2 (parallel streams C, D, E): 24 hours (determined by longest stream D)
- Wave 3: 10 hours
  ─────────────────────────────────────
  Total with Parallelization: ~58 hours (but utilizing 3-4 agents in Wave 2)

### Risk Mitigation for Parallel Execution

**Integration Conflicts:**

- Backend schema changes must be coordinated
- Codegen output changes affect all frontend streams
- Mitigation: Lock schema during Wave 2, use strict version pinning

**Agent Coordination:**

- Multiple agents modifying same files (e.g., package.json)
- Mitigation: Clear file ownership, centralized dependency management

**Testing Bottleneck:**

- All streams converge on Wave 3
- Mitigation: Continuous integration testing after each step
