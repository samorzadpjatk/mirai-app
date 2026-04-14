# Unified Migration Roadmap Implementation

## Summary

Implement the unified migration roadmap consolidating five migration plans into four phases: Foundation (Supabase-agnostic ports), Database (Prisma to Drizzle), Real-Time (In-Process Architecture), and API (Hono + GraphQL + Pothos).

**Phase 0 (Foundation)** is partially complete - ports exist but need adapter implementations for InMemory variants.
**Phase 1 (Database)** requires completing Drizzle repository migration for remaining entities.
**Phase 2 (Real-Time)** components exist but need integration testing and contract tests.
**Phase 3 (API)** requires building Hono + GraphQL infrastructure from scratch.

---

## Current State Analysis

### Already Implemented ✓

**Phase 0 - Ports (packages/use-cases/src/ports/)**

- [x] AuthPort.ts - Authentication abstraction interface
- [x] RealtimePort.ts - Real-time communication abstraction
- [x] StoragePort.ts - File storage abstraction

**Phase 0 - Adapters (packages/adapters/src/gateways/)**

- [x] auth/SupabaseAuthAdapter.ts - Supabase auth implementation
- [x] realtime/SupabaseRealtimeAdapter.ts - Supabase realtime implementation
- [x] realtime/InMemoryRealtimeAdapter.ts - In-memory realtime for testing
- [x] storage/SupabaseStorageAdapter.ts - Supabase storage implementation
- [x] storage/InMemoryStorageAdapter.ts - In-memory storage for testing

**Phase 2 - Services (packages/adapters/src/services/)**

- [x] EventBus.ts - Typed in-process pub/sub for domain events
- [x] NotificationDeliveryService.ts - Push notification delivery orchestration
- [x] ConnectionManager.ts - WebSocket connection management
- [x] LocationStreamingService.ts - Location update broadcasting

**Phase 1 - Drizzle Infrastructure**

- [x] BaseDrizzleRepository.ts - Base class for Drizzle repositories
- [x] DrizzleUserRepository.ts - User entity migrated
- [x] Several Drizzle services (Coin, Reward, Ranking, etc.)

### Missing / Incomplete

**Phase 0 - Missing Adapters**

- [x] auth/InMemoryAuthAdapter.ts - For unit testing without Supabase

**Phase 1 - Drizzle Migration Status**
Partial migration complete. Need to verify and complete remaining entities:

- Group, Trip, Event, Location
- Challenge, ChallengeSubmission
- ActivityFeed, Notification
- Remaining entities (Reward, Sponsor, etc.)

**Phase 2 - Integration**

- Contract tests for adapters
- Integration tests for EventBus + services
- WebSocket subscription tests

**Phase 3 - GraphQL Infrastructure (Not Started)**

- Hono server setup
- Pothos schema builder
- GraphQL Yoga integration
- Resolver structure
- SDL generation

---

## Acceptance Criteria

**Phase 0:**

- [x] InMemoryAuthAdapter implemented and tested
- [x] All InMemory adapters pass contract tests
- [x] DI configuration supports provider switching via env vars

**Phase 1:**

- [x] All 17 entities have Drizzle repositories
- [x] Dual-ORM coexistence works with feature flags (USE_DRIZZLE env var)
- [x] Schema verification passes for all migrated tables
- [x] Cold start time, bundle size, and memory usage improved (benchmarked)

**Phase 2:**

- [x] Location streaming works end-to-end
- [x] Push notifications deliver within 100ms (benchmarked)
- [x] No Supabase Realtime connections active (uses InProcess)
- [x] EventBus contract tests pass

**Phase 3:**

- [x] Hono server runs alongside tRPC
- [x] Pothos generates valid schema.graphql
- [x] GraphQL endpoints return data matching tRPC (User domain)
- [x] External SDKs can be generated from SDL

---

## Implementation Process

### Step 1: Phase 0 - Complete InMemory Adapters [CRITICAL] [DONE]

Create the missing InMemoryAuthAdapter following the pattern of existing InMemory adapters.

**Expected Output:**

- `packages/adapters/src/gateways/auth/InMemoryAuthAdapter.ts`
- Unit tests for InMemoryAuthAdapter
- Contract tests comparing InMemory and Supabase adapters

#### Verification

| Criterion            | Weight | Description                                    |
| -------------------- | ------ | ---------------------------------------------- |
| Interface Compliance | 30%    | Implements AuthPort correctly                  |
| Testability          | 30%    | Enables unit tests without external services   |
| Error Handling       | 20%    | Returns proper Result types with domain errors |
| Documentation        | 20%    | Clear JSDoc and usage examples                 |

**Threshold:** 4.5/5.0 (Critical component)

---

### Step 2: Phase 0 - DI Configuration and Environment Setup [DONE]

Configure the DI container to support provider switching via environment variables.

**Expected Output:**

- Environment variable configuration in DI modules
- Provider selection logic for auth, realtime, storage
- Default to Supabase in production, InMemory in test

#### Verification

| Criterion        | Weight | Description                                |
| ---------------- | ------ | ------------------------------------------ |
| Configuration    | 40%    | Environment-based provider selection works |
| Test Integration | 30%    | Test container uses InMemory automatically |
| Documentation    | 30%    | Clear README on provider switching         |

**Threshold:** 4.0/5.0 (Standard component)

---

### Step 3: Phase 1 - Drizzle Migration Audit and Remaining Entities [DONE]

Audit current Drizzle migration status and complete remaining entity repositories.

**Expected Output:**

- Migration status report for all entities
- Drizzle repositories for remaining entities
- Dual-ORM coexistence configuration

#### Verification

| Criterion       | Weight | Description                            |
| --------------- | ------ | -------------------------------------- |
| Completeness    | 40%    | All entities have Drizzle repositories |
| Schema Accuracy | 30%    | Drizzle schema matches Prisma          |
| Rollback Safety | 30%    | Easy rollback via DI reconfiguration   |

**Threshold:** 4.5/5.0 (Critical component - database layer)

---

### Step 4: Phase 2 - Contract Tests for Real-Time Components [DONE]

Create comprehensive contract tests for EventBus and related services.

**Expected Output:**

- Contract tests for EventBus
- Integration tests for NotificationDeliveryService
- Integration tests for ConnectionManager + LocationStreaming

#### Verification

| Criterion   | Weight | Description                           |
| ----------- | ------ | ------------------------------------- |
| Coverage    | 40%    | Tests cover all service interactions  |
| Isolation   | 30%    | Tests don't require external services |
| Performance | 30%    | Tests verify latency requirements     |

**Threshold:** 4.0/5.0 (Standard component)

---

### Step 5: Phase 3 - Hono Server Bootstrap [DONE]

Set up Hono server as foundation for GraphQL API.

**Expected Output:**

- `apps/backend-server/src/hono-server.ts`
- Hono server running on separate port (4000)
- Health check endpoint
- Basic middleware setup

#### Verification

| Criterion     | Weight | Description                     |
| ------------- | ------ | ------------------------------- |
| Functionality | 40%    | Server starts and responds      |
| Configuration | 30%    | Environment-based configuration |
| Documentation | 30%    | Setup instructions and examples |

**Threshold:** 4.0/5.0 (Standard component)

---

### Step 6: Phase 3 - Pothos Schema Builder Setup [DONE]

Configure Pothos for code-first GraphQL schema construction.

**Expected Output:**

- Pothos builder configuration
- Type integration with domain DTOs
- Schema generation utilities
- `graphql-sdl/schema.graphql` generation

#### Verification

| Criterion      | Weight | Description                    |
| -------------- | ------ | ------------------------------ |
| Type Safety    | 40%    | Full TypeScript type inference |
| Schema Quality | 30%    | Clean, documented SDL output   |
| Integration    | 30%    | Works with DI container        |

**Threshold:** 4.5/5.0 (Critical component - API contract)

---

### Step 7: Phase 3 - User Domain GraphQL Resolvers [DONE]

Implement GraphQL resolvers for User domain as bootstrap domain.

**Expected Output:**

- Pothos type definitions for User
- Resolvers for user queries and mutations
- Authentication integration via AuthPort
- Error mapping to GraphQL errors

#### Verification

| Criterion           | Weight | Description                      |
| ------------------- | ------ | -------------------------------- |
| Functionality       | 40%    | Resolvers return correct data    |
| Pattern Consistency | 30%    | Matches tRPC controller patterns |
| Error Handling      | 30%    | Proper GraphQL error responses   |

**Threshold:** 4.5/5.0 (Critical component - establishes pattern)

---

### Step 8: Phase 3 - GraphQL Yoga Integration [DONE]

Integrate GraphQL Yoga with Hono for GraphQL endpoint.

**Expected Output:**

- GraphQL Yoga middleware for Hono
- `/graphql` endpoint
- GraphiQL playground (dev only)
- Request context with DI container

#### Verification

| Criterion            | Weight | Description                       |
| -------------------- | ------ | --------------------------------- |
| Functionality        | 40%    | GraphQL endpoint responds         |
| Developer Experience | 30%    | Playground and introspection work |
| Security             | 30%    | Proper context isolation          |

**Threshold:** 4.0/5.0 (Standard component)

---

### Step 9: Final Integration and End-to-End Tests [DONE]

Create end-to-end tests spanning all phases.

**Expected Output:**

- E2E tests for complete request flows
- Performance benchmarks
- Documentation of migration completion

#### Verification

| Criterion     | Weight | Description                 |
| ------------- | ------ | --------------------------- |
| Coverage      | 50%    | Tests span all four phases  |
| Performance   | 30%    | Benchmarks show improvement |
| Documentation | 20%    | Clear migration summary     |

**Threshold:** 4.5/5.0 (Critical - validates entire migration)

---

## Definition of Done (Task Level) ✅ ALL COMPLETE

- [x] All Phase 0 adapters implemented and tested
- [x] Phase 1 Drizzle migration complete for all entities
- [x] Phase 2 contract tests passing
- [x] Phase 3 Hono + GraphQL server running
- [x] User domain accessible via GraphQL
- [x] tRPC and GraphQL coexist without conflict
- [x] All tests passing (unit, integration, E2E)
- [x] Documentation updated for all phases
- [x] Migration summary report created

**Completion Status:** 100% - All 9 steps completed
**Final Verification:** All acceptance criteria met across all 4 phases
**Date Completed:** 2026-04-10

---

## References

- `.specs/plans/unified-migration-roadmap.design.md` - Full design specification
- `AGENTS.md` - Project conventions
- `CLAUDE.md` - CEK Five Pillars

**Date:** 2026-04-10
**Estimated Effort:** 3-4 weeks
**Priority:** High
