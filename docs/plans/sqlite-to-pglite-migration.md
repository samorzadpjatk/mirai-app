# SQLite to PGLite Migration Plan

## Problem Statement

The codebase has **202 occurrences of `as unknown as` in 49 test files**. The primary source of these casts is the structural type mismatch between SQLite test databases and the PostgreSQL `DB` type used by oRPC routers.

### Root Cause Analysis

1. **Type Mismatch**: The `DB` type is `ReturnType<typeof drizzle<postgres-js, fullSchema>>` (PostgreSQL with all tables). SQLite tests use `ReturnType<typeof drizzle<bun:sqlite, testSchema>>` (different driver, subset schema).

2. **Schema Drift**: SQLite tests use separate `sqlite-core` schemas (`sqliteTable`, `integer`, `text`) that duplicate the production `pg-core` schemas (`pgTable`, `serial`, `varchar`). When production schema changes, SQLite test schemas may not be updated, causing tests to pass with incorrect schema assumptions.

3. **Type Safety Violation**: The `as unknown as` casts suppress TypeScript's type checking, which means:
   - Tests may pass even when the production schema doesn't support certain operations
   - Type errors in test data are not caught at compile time
   - The `TransactionDB` type (used in transaction callbacks) also requires `as unknown as DB` in many tests

## Solution: PGLite

### What is PGLite?

PGLite is a WebAssembly build of PostgreSQL packaged as a TypeScript client library. It enables running PostgreSQL in-memory for testing with no Docker or external dependencies.

### Why PGLite Solves the Problem

| Aspect | SQLite (Current) | PGLite (Proposed) |
|--------|-----------------|-------------------|
| **Schema Core** | `drizzle-orm/sqlite-core` | `drizzle-orm/pg-core` (same as production) |
| **Schema Type** | `sqliteTable`, `integer`, `text` | `pgTable`, `serial`, `varchar` (same as production) |
| **Database Type** | `BunSQLiteDatabase` | `PgliteDatabase` (both extend `PgDatabase`) |
| **Type Safety** | `as unknown as DB` required | Direct assignment works (no cast needed) |
| **Schema Drift** | High (separate test schemas) | Zero (uses production schema) |
| **Behavior Fidelity** | SQLite dialect | Real PostgreSQL (WASM) |
| **Dependencies** | `bun:sqlite` (built-in) | `@electric-sql/pglite` (~2.6MB) |

### Proof of Concept

A proof-of-concept test file was created (`packages/orpc/src/api/routers/__tests__/trip.pglite.test.ts`) with 6 tests using the trip router. All tests pass with **zero** `as unknown as` casts.

**Key finding**: `getAll({ db: testDb.db, ... })` compiles and runs without `as unknown as DB`, because `PgliteDatabase` and `PostgresJsDatabase` both extend `PgDatabase` and share the same type hierarchy.

## Migration Plan

### Phase 1: Infrastructure (COMPLETED)

1. ✅ **Install PGLite**: `bun add -d @electric-sql/pglite` at workspace root
2. ✅ **Create test helper**: `packages/db/src/test-helper.ts` with `createPgliteTestDb()`
3. ✅ **Export from db package**: `packages/db/src/index.ts` exports `createPgliteTestDb` and `TestDB` type
4. ✅ **Create POC test**: `packages/orpc/src/api/routers/__tests__/trip.pglite.test.ts` (6 tests passing)

### Phase 2: Migrate SQLite Test Helpers

The following 15 SQLite test helpers need to be migrated. Each helper should be replaced with a PGLite version using the production schema.

| File | Router | Tables |
|------|--------|--------|
| `activityFeed-sqlite-db.ts` | activityFeed | activityFeeds, activityReactions, challengeActivities, rankChangeActivities, submissionActivities, userPosts |
| `challenge-sqlite-db.ts` | challenge | challenges, challengeSubmissions, challengeVotes |
| `challengeSubmission-sqlite-db.ts` | challengeSubmission | challengeSubmissions, challenges, users |
| `challengeVote-sqlite-db.ts` | challengeVote | challengeVotes, challenges, users |
| `coin-sqlite-db.ts` | coin | coinTransactions, users |
| `coinTransaction-sqlite-db.ts` | coinTransaction | coinTransactions, users, trips |
| `group-sqlite-db.ts` | group | groups, tripParticipants, users |
| `location-sqlite-db.ts` | location | locations, locationSharingRequests, locationShares |
| `notification-sqlite-db.ts` | notificationDelivery | notificationDeliveries, notifications, pushSubscriptions |
| `notifications-router-sqlite-db.ts` | notifications | notifications, notificationPushes, pushSubscriptions, users, tripParticipants, groups |
| `reward-sqlite-db.ts` | reward | rewards, rewardPurchases, coinTransactions, users |
| `submissionReport-sqlite-db.ts` | submissionReport | submissionReports, challengeSubmissions, users |
| `sponsor-sqlite-db.ts` | sponsor | sponsors, tripSponsors |
| `trip-sqlite-db.ts` | trip | trips, tripParticipants, tripResources, tripInsurances, tripInsuranceSteps, groups, tripSponsors, sponsors, users |
| `user-sqlite-db.ts` | user | users, tripParticipants, groups, trips |

**Migration steps for each helper:**

1. Replace `bun:sqlite` with `pglite` driver
2. Remove manual `CREATE TABLE` SQL and use `drizzle-kit`'s `pushSchema` API to apply the production schema
3. Update seed functions to use production schema tables instead of `sqlite*` tables
4. Update test files to use `testDb.db` instead of `testDb.drizzleDb`
5. Remove `as unknown as DB` casts
6. Delete the SQLite-specific schema file (`*-sqlite-schema.ts`)

### Phase 3: Migrate Mock-Based Tests

Some router tests use mock databases instead of SQLite. These also need to be updated.

**Files to migrate:**
- `packages/orpc/src/api/routers/__tests__/trip.test.ts` - Uses `mockDb as unknown as DB` (45 occurrences)
- `packages/orpc/src/api/routers/__tests__/notifications.test.ts` - Uses `mockDb as unknown as DB`
- `packages/orpc/src/api/routers/__tests__/notificationSchedule.test.ts` - Uses `mockDb as unknown as DB`
- `packages/orpc/src/api/routers/__tests__/notificationDelivery.test.ts` - Uses `mockDb as unknown as DB`
- `packages/orpc/src/api/routers/__tests__/notificationSender.test.ts` - Uses `mockDb as unknown as DB`
- `packages/orpc/src/api/routers/__tests__/location.test.ts` - Uses `mockDb as unknown as DB`
- `packages/orpc/src/api/routers/__tests__/group.test.ts` - Uses mockDb
- `packages/orpc/src/api/routers/__tests__/reward.test.ts` - Uses mockDb
- `packages/orpc/src/api/routers/__tests__/coin.test.ts` - Uses mockDb
- `packages/orpc/src/api/routers/__tests__/coinTransaction.test.ts` - Uses mockDb
- `packages/orpc/src/api/routers/__tests__/storage.test.ts` - Uses mockDb

**Migration strategy:**
- Option A: Convert to PGLite tests (full integration)
- Option B: Use `drizzle-orm/pglite` with a mock driver if the test is purely unit testing logic
- Option C: Keep mock tests but remove `as unknown as DB` by using `DB` type-compatible mocks

### Phase 4: Migrate Auth/Supabase Tests

**Files to migrate:**
- `packages/auth/src/__tests__/server.test.ts` - `mockSupabaseClient as unknown as SupabaseClient` (3 occurrences)
- `packages/auth/src/__tests__/auth.test.ts` - `mockSupabaseClient as unknown as SupabaseClient` (3 occurrences)
- `packages/auth/src/__tests__/store.test.ts` - `mockSupabaseClient as unknown as SupabaseClient` (1 occurrence)
- `packages/supabase/src/__tests__/client.test.ts` - `as unknown as` (24 occurrences)
- `packages/supabase/src/__tests__/react.test.tsx` - `as unknown as SupabaseClient` (1 occurrence)
- `packages/supabase/src/__tests__/base.test.ts` - `as unknown as` (1 occurrence)

**Migration strategy:**
- `packages/shared/src/test-utils/mock-factories.ts` already exports `MockSupabaseClient` type - use this for auth tests
- For supabase client tests, update the `SupabaseClient` type to use the interface from `@mirai-app/shared` instead of the class from `@supabase/supabase-js`

### Phase 5: Cleanup and Verification

1. **Remove all `as unknown as` casts** from the codebase
2. **Delete SQLite-specific schema files** (`*-sqlite-schema.ts`) - 15 files
3. **Delete SQLite-specific test helper files** (`*-sqlite-db.ts`) - 15 files
4. **Update imports** in test files to use `@mirai-app/db` instead of test helpers
5. **Verify typecheck** passes for all packages
6. **Verify all tests** pass
7. **Update testing documentation** in `TESTING.md` and `docs/conventions/testing.md`

## Implementation Details

### PGLite Test Helper API

```typescript
import { createPgliteTestDb } from "@mirai-app/db";

// Create test database
const { db, cleanup } = await createPgliteTestDb();

// Use db for tests (no as unknown as DB needed!)
await db.insert(users).values({ id: "user-1", ... });

// Clean up
await cleanup();
```

### Key Differences from SQLite

1. **Schema**: Uses `pg-core` tables (e.g., `users`, `trips`) instead of `sqliteUsers`, `sqliteTrips`
2. **Timestamps**: Uses `timestamp` with `Date` objects instead of `integer` with Unix timestamps
3. **UUIDs**: Uses `varchar` with string IDs instead of SQLite `text` with string IDs
4. **Booleans**: Uses `boolean` instead of `integer` with `mode: "boolean"`
5. **Relations**: Uses production relations from `@mirai-app/db` instead of `sqlite*` relations

### Performance Considerations

- **PGLite**: ~1000ms per test for schema push (first test), ~800ms for subsequent tests
- **SQLite**: ~200ms per test
- **Mitigation**: Use `beforeAll` with schema push + `beforeEach` with table truncation for test isolation

## Risk Assessment

### Risks

1. **PGLite WASM size**: ~2.6MB per worker. May affect CI memory usage.
2. **Test speed**: PGLite is slower than SQLite. Could increase test suite time by 2-3x.
3. **Schema push time**: `drizzle-kit pushSchema` takes 1-2s per test file. May need optimization.
4. **Parallel tests**: PGLite in-memory databases are isolated per test file, but parallel test execution within a file may need persistence.

### Mitigations

1. **Test parallelism**: Use file-level parallelization (Vitest default) - each file gets its own PGLite instance
2. **Schema caching**: Cache schema push results and reuse between test runs
3. **Selective migration**: Migrate high-value tests first (trip, user, notifications), keep mock tests for simple logic tests
4. **CI optimization**: Use file-level parallelization and caching for PGLite instances

## Benefits

1. **Type safety**: Eliminates all `as unknown as DB` casts in test files
2. **Schema drift prevention**: Tests use the same schema as production
3. **Behavior fidelity**: Tests run against real PostgreSQL behavior, not SQLite dialect
4. **Maintenance**: No need to maintain separate SQLite schemas when production schema changes
5. **Test confidence**: Tests more accurately reflect production behavior

## Decision Log

**Decision**: Migrate all SQLite tests to PGLite

**Rationale**: 
- PGLite eliminates the root cause of `as unknown as DB` casts
- Same schema as production prevents drift
- Real PostgreSQL behavior improves test confidence
- Acceptable performance trade-off for improved type safety

**Alternatives considered**:
- **Keep SQLite**: Accept `as unknown as DB` casts as a structural necessity. Rejected because it causes schema drift and type safety issues.
- **Type union (DB | TestDB)**: Update all router signatures to accept `DB | TestDB`. Rejected because it requires touching every router and may affect type safety.
- **Mock only**: Convert all tests to mock-based. Rejected because integration tests provide better confidence.
- **Testcontainers**: Use Docker PostgreSQL. Rejected because it requires Docker and is slower than PGLite.

**Status**: POC successful. Ready for full migration.

## Next Steps

1. Start with `trip-sqlite-db.ts` migration (already completed in POC)
2. Migrate `user-sqlite-db.ts` and `group-sqlite-db.ts` (core routers)
3. Migrate `notifications-router-sqlite-db.ts` (complex router with many tables)
4. Migrate remaining SQLite helpers in parallel
5. Migrate mock-based tests to PGLite or `MockSupabaseClient` type
6. Run full test suite and verify all tests pass
7. Update documentation

## Files Created

- `packages/db/src/test-helper.ts` - PGLite test helper
- `packages/db/src/__tests__/pglite.test.ts` - PGLite helper verification
- `packages/orpc/src/api/routers/__tests__/trip.pglite.test.ts` - POC test

## Files to Delete

- All `*-sqlite-schema.ts` files (15 files)
- All `*-sqlite-db.ts` files (15 files)
- All `*.sqlite.test.ts` files (to be replaced with `*.pglite.test.ts`)

## Files to Modify

- `packages/db/src/index.ts` - Add `createPgliteTestDb` export
- `packages/shared/src/test-utils/mock-factories.ts` - Already updated with `MockSupabaseClient` type
- `packages/shared/src/test-utils/test-helpers.ts` - Already updated with `Mock` type
- 15 test files using SQLite helpers
- 11 test files using mock-based tests
- 3 auth test files
- 2 supabase test files

## Total Impact

- **202** `as unknown as` occurrences to remove
- **30** files to delete (15 schema + 15 helper)
- **30+** test files to modify
- **1** new package added (`@electric-sql/pglite`)
- **1** new file created (`packages/db/src/test-helper.ts`)
