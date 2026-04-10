# Unified Migration Roadmap

This document consolidates five migration plans into a single dependency-based roadmap.

## Overview

Four phases replace five plans. Phase 0 establishes provider-agnostic ports. Phase 1 migrates the ORM. Phase 2 consolidates real-time features into a single in-process architecture. Phase 3 adds GraphQL alongside existing tRPC.

**Plan Consolidation:**

- Plan 3 (Supabase-Agnostic Architecture) → **Phase 0**
- Plan 2 (Prisma to Drizzle Migration) → **Phase 1**
- Plans 1 + 4 (Remove Supabase Realtime + Platform-Agnostic Notifications) → **Phase 2**
- Plan 5 (Hono + GraphQL + Pothos) → **Phase 3**
- Plan 6 (Microservices Migration) → Excluded per requirements

## Phase 0: Foundation (Supabase-Agnostic Architecture)

Phase 0 establishes provider-agnostic ports that all subsequent phases depend on.

**Why This Comes First:**

- Phase 1 (Drizzle) uses `StoragePort` for file attachments during entity migration
- Phase 2 (In-Process) uses `RealtimePort` to abstract WebSocket implementation details
- Phase 3 (GraphQL) uses `AuthPort` for resolver authentication

**Port Interfaces (Use Cases Layer):**

Three ports abstract all Supabase dependencies:

```typescript
// AuthPort: User session management
export interface AuthPort {
  getUserByToken(token: string): Promise<Result<AuthUser, AuthError>>;
  getSession(token: string): Promise<Result<AuthSession, AuthError>>;
  signInWithPassword(
    email: string,
    password: string,
  ): Promise<Result<AuthSession, AuthError>>;
  signOut(token: string): Promise<Result<void, AuthError>>;
}

// RealtimePort: WebSocket subscriptions and presence
export interface RealtimePort {
  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Result<RealtimeSubscription, RealtimeError>;
  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Promise<Result<void, RealtimeError>>;
  trackPresence(
    channel: string,
    state: PresenceState,
  ): Promise<Result<void, RealtimeError>>;
  getConnectionState(): ConnectionState;
}

// StoragePort: File operations
export interface StoragePort {
  upload(
    bucket: string,
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions,
  ): Promise<Result<FileMetadata, StorageError>>;
  download(
    bucket: string,
    path: string,
  ): Promise<Result<Buffer | Blob, StorageError>>;
  delete(bucket: string, paths: string[]): Promise<Result<void, StorageError>>;
  createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<Result<string, StorageError>>;
}
```

Each port returns `Promise<Result<T, E>>` with domain-specific errors.

**Adapter Structure (Adapters Layer):**

```
packages/adapters/src/gateways/
├── auth/
│   ├── SupabaseAuthAdapter.ts      # Current provider
│   └── InMemoryAuthAdapter.ts      # Testing
├── realtime/
│   ├── SupabaseRealtimeAdapter.ts  # Current provider
│   └── InMemoryRealtimeAdapter.ts  # Testing
└── storage/
    ├── SupabaseStorageAdapter.ts   # Current provider
    └── InMemoryStorageAdapter.ts   # Testing
```

**DI Configuration:**

Environment variables select providers at runtime:

```typescript
const provider = process.env.AUTH_PROVIDER ?? "supabase";
const realtime = process.env.REALTIME_PROVIDER ?? "supabase";
const storage = process.env.STORAGE_PROVIDER ?? "supabase";
```

**Per-Entity Migration Workflow:**

1. Define port interface in use-cases
2. Implement Supabase adapter
3. Create InMemory adapter for unit tests
4. Add contract tests for both adapters
5. Refactor controller to use port
6. Remove legacy Supabase client access

**Acceptance Criteria:**

- All controllers use ports, not direct Supabase clients
- InMemory adapters enable unit testing without external services
- Contract tests pass for all adapter combinations
- Zero changes to domain layer or use cases

## Phase 1: Database Layer (Prisma to Drizzle Migration)

Phase 1 migrates the ORM while keeping the database schema unchanged. The Repository Adapter Pattern enables zero-downtime transition with dual-ORM coexistence.

**Why This Comes After Phase 0:**

- Storage operations flow through `StoragePort` (from Phase 0)
- Error handling remains consistent via shared domain error types

**Architecture:**

Both ORMs connect to the same PostgreSQL database. Only adapters (repositories) and frameworks (configuration) change. Domain entities and use cases remain untouched.

```
packages/adapters/src/gateways/
├── DrizzleUserRepository.ts       # New
├── PrismaUserRepository.ts       # Existing (removed after migration)
├── BaseDrizzleRepository.ts      # New base class
└── BasePrismaRepository.ts       # Existing base class
```

**Dual-ORM Coexistence Strategy:**

Each entity follows this timeline:

1. Create Drizzle schema file (TypeScript-native, mirrors Prisma)
2. Implement `DrizzleXRepository` extending `BaseDrizzleRepository`
3. Add mapper methods for Drizzle conversion
4. Register in DI container with feature flag
5. Run parallel validation in production (read from both, compare, return Prisma)
6. Enable Drizzle writes after validation period
7. Remove Prisma repository after 48-hour stability

**Entity Priority Order:**

| Priority | Entity              | Complexity | Est. Effort |
| -------- | ------------------- | ---------- | ----------- |
| 1        | User                | Low        | 2 days      |
| 2        | Group               | Low        | 2 days      |
| 3        | Trip                | Medium     | 3 days      |
| 4        | Event               | Medium     | 2 days      |
| 5        | Location            | Low        | 2 days      |
| 6        | Challenge           | High       | 4 days      |
| 7        | ChallengeSubmission | High       | 4 days      |
| 8        | ActivityFeed        | Very High  | 5 days      |
| 9        | Notification        | High       | 3 days      |
| 10+      | Remaining           | Variable   | 5 days      |

**Rollback Capability:**

Instant rollback via DI container reconfiguration:

```typescript
userRepository: {
  // factory: (cradle) => new DrizzleUserRepository(cradle.drizzleDb),
  factory: (cradle) => new PrismaUserRepository(cradle.prismaClient),
  lifetime: Lifetime.SINGLETON,
}
```

No database migration required—both ORMs use identical schema.

**Schema Verification:**

Before each entity migration:

```bash
# Dump Prisma schema as SQL
bun prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --script > prisma.sql

# Generate Drizzle schema SQL
bun drizzle-kit generate --sql

# Must be identical for migrated tables
diff prisma.sql drizzle.sql
```

**Success Criteria:**

- All 30+ entities migrated to Drizzle
- Cold start time reduced
- Bundle size decreased
- Memory usage lowered
- Zero production incidents

## Phase 2: Real-Time Layer (Consolidated In-Process Architecture)

Phase 2 merges "Remove Supabase Realtime" and "Platform-Agnostic Notifications" into a single in-process architecture.

**Consolidation Rationale:**

Both plans share the same goal: move notification delivery and location streaming into the main backend process. The first plan focuses on WebSocket-based location streaming. The second introduces an event bus for notifications. Together they form a unified real-time layer.

**Architecture Overview:**

```
┌──────────────────────────────────────────────────────────────┐
│                  Backend Server (Single Process)             │
│                                                              │
│  ┌─────────────────┐      ┌─────────────────────────────┐    │
│  │   EventBus      │      │   ConnectionManager         │    │
│  │   (in-process)  │      │   Map<userId, WebSocket[]>  │    │
│  │                 │      │   (friends broadcasts)        │    │
│  └────────┬────────┘      └──────────────┬────────────────┘    │
│           │                               │                    │
│           ▼                               ▼                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         NotificationDeliveryService                     │  │
│  │  • Listens to NotificationCreated events                │  │
│  │  • Queries push subscriptions                           │  │
│  │  • Sends via FCM/APNs                                   │  │
│  │  • Updates delivery status                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         LocationStreamingService                        │  │
│  │  • Accepts location updates                               │  │
│  │  • Broadcasts to friends via ConnectionManager          │  │
│  │  • Throttles to 1 update/sec per user                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Key Components:**

1. **EventBus** – Typed in-process pub/sub for domain events. Publishes `NotificationCreated` from use cases. Subscribers execute asynchronously without blocking the request.

2. **ConnectionManager** – Manages WebSocket connections for location streaming. Tracks which friends are online, broadcasts location updates, handles disconnections gracefully.

3. **NotificationDeliveryService** – Event handler that orchestrates push delivery. Receives `NotificationCreated`, fetches recipient tokens, calls FCM/APNs, records results.

4. **LocationController** – New tRPC subscription `getFriendsLocationsStream` using `RealtimePort` (from Phase 0) for transport abstraction.

**Data Flow – Location:**

1. Client calls `location.updateLocation` mutation
2. `UpdateLocationUseCase` saves to database
3. Use case calls `connectionManager.broadcastLocation()`
4. Connected friends receive update via WebSocket within 1 second

**Data Flow – Notification:**

1. Use case creates notification and calls `eventBus.publish(new NotificationCreated(...))`
2. `NotificationDeliveryService` (handler) receives event
3. Service queries `PushSubscriptionRepository` for tokens
4. Service sends via FCM/APNs
5. Service updates delivery status via `TrackDeliveryCompleteUseCase`

**Eliminated Components:**

- `notification-sender` microservice (entire app)
- Supabase Realtime WebSocket connections
- PostgreSQL triggers for change notification
- Separate service deployment and monitoring

**Error Handling:**

- Notification delivery failures log errors without crashing the request
- WebSocket disconnections trigger automatic client reconnection with exponential backoff
- Memory pressure capped via LRU eviction on connection pool

**Success Criteria:**

- `getFriendsLocationsStream` subscription works end-to-end
- Location updates broadcast to friends within 1 second
- Push notifications deliver within 100ms of creation
- No Supabase Realtime connections active
- All tests pass without `notification-sender` running

## Phase 3: API Layer (Hono + GraphQL + Pothos Migration)

Phase 3 runs independently but benefits from stable foundations in Phases 0–2. It enables polyglot client access while preserving existing tRPC endpoints during transition.

**Why This Comes Last:**

- Uses `AuthPort` (Phase 0) for resolver authentication
- Leverages stable database layer (Phase 1) for consistent query performance
- Builds on real-time infrastructure (Phase 2) for GraphQL subscriptions if needed

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │  Web (React) │  │  Native (RN)  │  │  Python/Go/Swift │    │
│  │  (tRPC)      │  │  (tRPC)       │  │  (GraphQL SDL)   │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘    │
│         │                  │                     │            │
│         └──────────────────┼─────────────────────┘            │
│                            │                                 │
│                            ▼                                 │
│              ┌─────────────────────────┐                    │
│              │   Hono + GraphQL Yoga   │ (port 4000)       │
│              │   /graphql endpoint       │                  │
│              └────────────┬────────────┘                    │
└───────────────────────────┼───────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Pothos Schema Builder (code-first)                   │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────────────────┐   │ │
│  │  │  User   │ │  Trip   │ │  Challenge, etc.        │   │ │
│  │  │  Types  │ │  Types  │ │                         │   │ │
│  │  └────┬────┘ └────┬────┘ └─────────────────────────┘   │ │
│  │       └───────────┴───────────────────────────────────┘ │
│  │                        │                               │
│  │                        ▼                               │
│  │         ┌─────────────────────────┐                    │
│  │         │  Resolvers call use     │                    │
│  │         │  cases via DI container │                    │
│  │         └─────────────────────────┘                    │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              LEGACY tRPC (port 3000)                       │
│              Stays running until full migration            │
└─────────────────────────────────────────────────────────────┘
```

**Strangler Fig Pattern:**

tRPC and GraphQL run concurrently. Existing clients continue using tRPC. New polyglot clients generate SDKs from GraphQL SDL. Migration proceeds domain by domain without breaking existing functionality.

**Pothos Schema Builder:**

Code-first TypeScript schema construction. Types derive from domain DTOs. Resolvers inject use cases via awilix container, identical to tRPC controllers.

**SDL Generation:**

```typescript
// Generate schema.graphql for external clients
import { printSchema } from "graphql";
const sdl = printSchema(schema);
fs.writeFileSync("graphql-sdl/schema.graphql", sdl);
```

**Resolver Pattern:**

Resolvers wrap use case results into GraphQL errors:

```typescript
resolve: async (_parent, args, ctx) => {
  const authContext = await requireAuth(ctx.headers, ctx.container);
  const useCase =
    ctx.container.resolve<GetUserByIdUseCase>("getUserByIdUseCase");
  const result = await useCase.execute({ userId: args.id, authContext });

  if (result.kind === "ok") return result.value;
  throw mapResultToGraphQLError(result.error);
};
```

**Migration Timeline:**

| Phase     | Duration  | Tasks                                             |
| --------- | --------- | ------------------------------------------------- |
| Bootstrap | Week 1    | Hono setup, User domain GraphQL                   |
| Parallel  | Weeks 2–3 | Migrate remaining domains; tRPC + GraphQL coexist |
| External  | Week 4    | Generate SDL; Python/Go/Swift SDK creation        |
| Deprecate | Future    | Migrate remaining clients; remove tRPC            |

**Success Criteria:**

- Pothos generates valid `schema.graphql`
- GraphQL endpoints return data matching tRPC
- All existing tests pass
- External teams generate working clients from SDL

## Dependency Summary

```
Phase 0 (Foundation)
    │
    ├── enables ──► Phase 1 (Database)
    │                  │
    │                  └── enables ──► Phase 2 (Real-Time)
    │                                        │
    └── enables ─────────────────────────────┘
                          │
                          └── enables ──► Phase 3 (API)
```

## Files Consolidated

| Original File                             | Status   | Location in Unified Plan |
| ----------------------------------------- | -------- | ------------------------ |
| remove-supabase-realtime.design.md        | Merged   | Phase 2 (consolidated)   |
| prisma-to-drizzle-migration.design.md     | Included | Phase 1                  |
| supabase-agnostic-architecture.design.md  | Included | Phase 0                  |
| platform-agnostic-notifications.design.md | Merged   | Phase 2 (consolidated)   |
| hono-graphql-pothos-migration.design.md   | Included | Phase 3                  |
| microservices-migration.design.md         | Excluded | Not applicable           |

## References

- AGENTS.md: Project conventions
- CLAUDE.md: CEK Five Pillars
- Original plans in `.specs/plans/`

**Date:** 2026-04-10
**Version:** 1.0.0
