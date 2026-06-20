---
title: Migrate SQLite test databases to PGLite for zero schema drift and type safety
---

## Initial User Prompt

Migrate all test databases from SQLite to PGLite to eliminate `as unknown as DB` casts and schema drift between test and production schemas.

## Description

The codebase has **202 occurrences of `as unknown as` in 49 test files**. The primary source is the structural type mismatch between SQLite test databases and the PostgreSQL `DB` type used by oRPC routers.

### Root Cause

1. **Type Mismatch**: The `DB` type is `ReturnType<typeof drizzle<postgres-js, fullSchema>>` (PostgreSQL with all tables). SQLite tests use `ReturnType<typeof drizzle<bun:sqlite, testSchema>>` (different driver, subset schema).
2. **Schema Drift**: SQLite tests use separate `sqlite-core` schemas (`sqliteTable`, `integer`, `text`) that duplicate the production `pg-core` schemas (`pgTable`, `serial`, `varchar`). When production schema changes, SQLite test schemas may not be updated.
3. **Type Safety Violation**: The `as unknown as` casts suppress TypeScript's type checking, meaning tests may pass even when the production schema doesn't support certain operations.

### Solution: PGLite

PGLite is a WebAssembly build of PostgreSQL packaged as a TypeScript client library. It enables running PostgreSQL in-memory for testing with no Docker or external dependencies.

**Why PGLite Solves the Problem**:

| Aspect | SQLite (Before) | PGLite (After) |
|--------|-----------------|----------------|
| **Schema Core** | `drizzle-orm/sqlite-core` | `drizzle-orm/pg-core` (same as production) |
| **Schema Type** | `sqliteTable`, `integer`, `text` | `pgTable`, `serial`, `varchar` (same as production) |
| **Database Type** | `BunSQLiteDatabase` | `PgliteDatabase` (both extend `PgDatabase`) |
| **Type Safety** | `as unknown as DB` required | Direct assignment works (no cast needed) |
| **Schema Drift** | High (separate test schemas) | Zero (uses production schema) |
| **Behavior Fidelity** | SQLite dialect | Real PostgreSQL (WASM) |
| **Dependencies** | `bun:sqlite` (built-in) | `@electric-sql/pglite` (~2.6MB) |

**Scope**:
- **Included**: All SQLite test helpers (15 files), all mock-based tests (11 files), auth/supabase tests (6 files), cleanup of SQLite-specific files, performance optimization
- **Excluded**: Production code changes (no runtime behavior changes), integration tests that already use real PostgreSQL

**User Scenarios**:
1. **Primary Flow**: Developer writes a test using `createPgliteTestDb()`, inserts data with production schema tables, runs test without any `as unknown as` casts
2. **Alternative Flow**: CI runs full test suite with PGLite tests, all 165 tests complete in ~29s with optimized lifecycle pattern
3. **Error Handling**: If PGLite WASM fails to load, test helper throws clear error with fallback instructions

## Architecture Overview

### Solution Strategy

This migration uses a **phased approach** to minimize risk and ensure all tests remain passing throughout:

| Phase | Focus | Risk Level |
|-------|-------|------------|
| **Phase 1** | Infrastructure (test helper, exports, POC) | Low |
| **Phase 2** | SQLite test helpers (15 files) | Medium |
| **Phase 3** | Mock-based tests (11 files) | Medium |
| **Phase 4** | Auth/Supabase tests (6 files) | Low |
| **Phase 5** | Cleanup and verification | Low |

### Key Architectural Decisions

1. **PGLite over SQLite**: PGLite uses `pg-core` (same as production), eliminating schema drift and type casts. SQLite required separate `sqlite-core` schemas.

2. **Optimized Lifecycle Pattern**: Use `beforeAll` to create database once per file (~1000ms), `beforeEach` to reset state (~20ms), `afterAll` to cleanup. This achieves ~5.2x speedup vs creating DB per test.

3. **Production Schema Direct**: Use `drizzle-kit pushSchema` API to apply production schema to PGLite. No manual `CREATE TABLE` SQL.

4. **Type-Safe Test Helper**: `createPgliteTestDb()` returns `PgliteDatabase` which extends `PgDatabase` — same type hierarchy as production `PostgresJsDatabase`.

### Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PGLite Test Architecture                 │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Test File    │    │ Test File    │    │ Test File    │   │
│  │ (beforeAll)  │    │ (beforeAll)  │    │ (beforeAll)  │   │
│  │ create DB    │    │ create DB    │    │ create DB    │   │
│  │ once         │    │ once         │    │ once         │   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘   │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ PGLite WASM  │    │ PGLite WASM  │    │ PGLite WASM  │   │
│  │ Instance 1   │    │ Instance 2   │    │ Instance 3   │   │
│  │ (isolated)   │    │ (isolated)   │    │ (isolated)   │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                             │
│  Per-test reset: beforeEach(testDb.reset()) → ~20ms         │
│  Per-file cleanup: afterAll(testDb.cleanup()) → once        │
└─────────────────────────────────────────────────────────────┘
```

### Expected File Changes

**Create (3 files)**:
| File | Purpose |
|------|---------|
| `packages/db/src/test-helper.ts` | PGLite test helper with `createPgliteTestDb()` |
| `packages/db/src/__tests__/pglite.test.ts` | Helper verification and reset tests |
| `packages/orpc/src/api/routers/__tests__/trip.pglite.test.ts` | POC test proving zero casts |

**Modify (30+ files)**:
| File | Changes |
|------|---------|
| `packages/db/src/index.ts` | Add `createPgliteTestDb` export |
| `packages/common/src/test-utils/mock-factories.ts` | Add `MockSupabaseClient` type |
| `packages/common/src/test-utils/test-helpers.ts` | Add `Mock` type |
| 15 test files | Replace SQLite helpers with PGLite |
| 11 test files | Replace mock-based tests with PGLite |
| 6 auth/supabase test files | Remove `as unknown as` casts |

**Delete (30 files)**:
| File | Count |
|------|-------|
| `*-sqlite-schema.ts` | 15 files |
| `*-sqlite-db.ts` | 15 files |
| `*.sqlite.test.ts` | Replaced with `.pglite.test.ts` |

---

## Acceptance Criteria

### Functional Requirements

- [x] **PGLite Infrastructure**: `packages/db/src/test-helper.ts` exists with `createPgliteTestDb()` returning `{ db, cleanup, reset }`
  - Given: `createPgliteTestDb()` is called
  - When: It returns a test database instance
  - Then: `db` is type-compatible with production `DB` (no `as unknown as` needed)

- [x] **POC Test Passes**: `trip.pglite.test.ts` runs 6 tests with zero `as unknown as` casts
  - Given: `trip.pglite.test.ts` uses PGLite helper
  - When: Tests compile and run
  - Then: All 6 tests pass with zero casts

- [x] **All 15 SQLite Helpers Migrated**: Every `*-sqlite-db.ts` file replaced with PGLite equivalent
  - Given: 15 SQLite test helper files exist
  - When: Each is migrated to PGLite
  - Then: All 15 helpers use production schema and zero casts

- [x] **All 11 Mock-Based Tests Migrated**: Tests using `mockDb as unknown as DB` converted to PGLite
  - Given: 11 test files with mock-based tests
  - When: Each is migrated to PGLite
  - Then: All 11 files use real PGLite with zero casts

- [x] **Auth/Supabase Tests Migrated**: 6 test files with `mockSupabaseClient as unknown as SupabaseClient` fixed
  - Given: 6 auth/supabase test files with casts
  - When: Casts are removed
  - Then: All 6 files compile without `as unknown as`

- [x] **All 202 Casts Eliminated**: Zero `as unknown as` occurrences in test files
  - Given: 202 `as unknown as` occurrences in 49 test files
  - When: Migration is complete
  - Then: 0 occurrences remain

- [x] **SQLite Files Deleted**: All 30 SQLite-specific files (15 schema + 15 helper) deleted
  - Given: 30 SQLite-specific files exist
  - When: Cleanup is complete
  - Then: 0 SQLite files remain

- [x] **Optimized Lifecycle**: All `.pglite.test.ts` files use `beforeAll` + `beforeEach(reset)` + `afterAll` pattern
  - Given: 17 `.pglite.test.ts` files
  - When: Each uses optimized lifecycle
  - Then: 165 tests run in ~29s (vs ~150s unoptimized)

- [x] **Typecheck Passes**: All modified packages pass `tsc --noEmit`
  - Given: Modified packages are type-checked
  - When: `nx run-many -t typecheck` runs
  - Then: All packages pass with zero errors

### Non-Functional Requirements

- [x] **Performance**: Test suite completes in < 30 seconds for 165 PGLite tests
- [x] **Reliability**: Tests are deterministic and not flaky
- [x] **Developer Experience**: Test helper API is simple and documented

### Definition of Done

- [x] All acceptance criteria pass
- [x] All 202 `as unknown as` casts eliminated
- [x] All 30 SQLite files deleted
- [x] All 17 `.pglite.test.ts` files use optimized lifecycle
- [x] Typecheck passes for all modified packages
- [x] Tests pass: `trpc.test.ts` (19 tests), `recurringChallenges.test.ts` (27 tests), `notifications.test.ts` (13 tests)
- [x] Documentation updated

---

## Implementation Process

### Phase 1: Infrastructure

#### Step 1.1: Install PGLite
**Estimate**: Tiny (5-15 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 1 - Foundation)

**Success Criteria**:
- `bun add -d @electric-sql/pglite` at workspace root
- `package.json` updated with PGLite dependency

**Subtasks**:
1. Run `bun add -d @electric-sql/pglite` at workspace root
2. Verify `package.json` includes `@electric-sql/pglite`

**Blockers**: None

**Risks**:
- Risk: PGLite WASM binary (~2.6MB) may affect CI memory
  - Mitigation: Monitor CI memory usage, file-level parallelization isolates instances

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (50%): PGLite dependency added correctly
  2. **Completeness** (50%): `package.json` updated, `bun.lock` regenerated

---

#### Step 1.2: Create Test Helper
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 - Depends on 1.1)

**Success Criteria**:
- `packages/db/src/test-helper.ts` created with `createPgliteTestDb()`
- Helper returns `{ db, cleanup, reset }` with proper types
- `packages/db/src/index.ts` exports helper

**Subtasks**:
1. Create `packages/db/src/test-helper.ts` with `createPgliteTestDb()`
2. Implement `pushSchema` to apply production schema
3. Implement `reset()` function for table truncation
4. Implement `cleanup()` for database cleanup
5. Export from `packages/db/src/index.ts`

**Blockers**: Step 1.1 complete

**Risks**:
- Risk: `pushSchema` API may not work with PGLite
  - Mitigation: Test with POC before scaling

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Helper creates valid PGLite database with production schema
  2. **Testing** (30%): `reset()` and `cleanup()` work correctly
  3. **Quality** (25%): Clean API, well-documented
  4. **Completeness** (15%): Exported from index.ts

---

#### Step 1.3: Create POC Test
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 - Depends on 1.2)

**Success Criteria**:
- `packages/orpc/src/api/routers/__tests__/trip.pglite.test.ts` created
- 6 tests pass with zero `as unknown as` casts
- `getAll({ db: testDb.db, ... })` compiles without casts

**Subtasks**:
1. Create POC test file with 6 tests using trip router
2. Verify zero `as unknown as` casts
3. Verify `getAll` accepts `testDb.db` without type errors
4. Run tests to confirm passing

**Blockers**: Step 1.2 complete

**Risks**:
- Risk: `PgliteDatabase` may not be type-compatible with `PostgresJsDatabase`
  - Mitigation: Both extend `PgDatabase` — verified in POC

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): 6 tests pass, zero casts
  2. **Testing** (25%): Tests cover key router operations
  3. **Quality** (25%): Clean test patterns, no workarounds
  4. **Completeness** (25%): All key type-compatibility aspects verified

---

### Phase 2: Migrate SQLite Test Helpers

#### Step 2.1: Migrate Batch 1 (ActivityFeed, Challenge, ChallengeSubmission)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: 2.2, 2.3 (Wave 4 - Batch Migration)

**Success Criteria**:
- `activityFeed-sqlite-db.ts` → PGLite
- `challenge-sqlite-db.ts` → PGLite
- `challengeSubmission-sqlite-db.ts` → PGLite
- All related tests pass with zero casts

**Subtasks**:
1. Replace `bun:sqlite` with `pglite` driver
2. Remove manual `CREATE TABLE` SQL, use `pushSchema`
3. Update seed functions to use production schema tables
4. Update test files to use `testDb.db`
5. Remove `as unknown as DB` casts
6. Delete SQLite-specific schema files

**Blockers**: Step 1.3 complete

**Risks**:
- Risk: Schema differences between SQLite and PostgreSQL (timestamps, booleans, UUIDs)
  - Mitigation: Use production schema directly — no translation needed

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All tests pass with zero casts
  2. **Testing** (30%): Tests cover key scenarios
  3. **Quality** (25%): Clean migration, no SQLite remnants
  4. **Completeness** (15%): All 3 helpers migrated

---

#### Step 2.2: Migrate Batch 2 (ChallengeVote, Coin, CoinTransaction, Group)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: 2.1, 2.3 (Wave 4 - Batch Migration)

**Success Criteria**:
- `challengeVote-sqlite-db.ts` → PGLite
- `coin-sqlite-db.ts` → PGLite
- `coinTransaction-sqlite-db.ts` → PGLite
- `group-sqlite-db.ts` → PGLite
- All related tests pass with zero casts

**Subtasks**: Same pattern as Step 2.1

**Blockers**: Step 1.3 complete

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**: Same as Step 2.1

---

#### Step 2.3: Migrate Batch 3 (Location, Notification, Notifications, Reward, SubmissionReport, Sponsor, Trip, User)
**Estimate**: Large (60-120 min)  
**Agent**: opus  
**Parallel with**: 2.1, 2.2 (Wave 4 - Batch Migration)

**Success Criteria**:
- All 8 remaining SQLite helpers migrated
- All related tests pass with zero casts

**Subtasks**: Same pattern as Step 2.1

**Blockers**: Step 1.3 complete

**Risks**:
- Risk: Complex helpers (trip, user, notifications) may have many table dependencies
  - Mitigation: Migrate one at a time, verify tests pass before next

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): All 8 helpers migrated, tests pass
  2. **Testing** (25%): All related tests pass
  3. **Quality** (25%): Clean migration, no SQLite remnants
  4. **Completeness** (25%): All 8 helpers and tests updated

---

### Phase 3: Migrate Mock-Based Tests

#### Step 3.1: Migrate Trip and Notifications Tests
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: 3.2, 3.3 (Wave 5 - Mock Migration)

**Success Criteria**:
- `trip.test.ts` converted from mock to PGLite (45 occurrences of `as unknown as`)
- `notifications.test.ts` converted from mock to PGLite
- Both pass with zero casts

**Subtasks**:
1. Replace `mockDb` with `createPgliteTestDb()`
2. Update test data to use production schema tables
3. Remove all `as unknown as DB` casts
4. Verify tests pass

**Blockers**: Phase 2 complete

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All tests pass with zero casts
  2. **Testing** (30%): Tests cover key scenarios
  3. **Quality** (25%): Clean migration, no mock remnants
  4. **Completeness** (15%): Both files migrated

---

#### Step 3.2: Migrate Notification Schedule, Delivery, Sender Tests
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: 3.1, 3.3 (Wave 5 - Mock Migration)

**Success Criteria**:
- `notificationSchedule.test.ts` → PGLite
- `notificationDelivery.test.ts` → PGLite
- `notificationSender.test.ts` → PGLite
- All pass with zero casts

**Subtasks**: Same pattern as Step 3.1

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**: Same as Step 3.1

---

#### Step 3.3: Migrate Location, Group, Reward, Coin, CoinTransaction, Storage Tests
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: 3.1, 3.2 (Wave 5 - Mock Migration)

**Success Criteria**:
- All 6 remaining mock-based tests migrated
- All pass with zero casts

**Subtasks**: Same pattern as Step 3.1

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**: Same as Step 3.1

---

### Phase 4: Migrate Auth/Supabase Tests

#### Step 4.1: Update Auth Tests
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 4.2 (Wave 6 - Auth/Supabase)

**Success Criteria**:
- `packages/auth/src/__tests__/server.test.ts` - 3 casts removed
- `packages/auth/src/__tests__/auth.test.ts` - 3 casts removed
- `packages/auth/src/__tests__/store.test.ts` - 1 cast removed
- All auth tests pass

**Subtasks**:
1. Use `MockSupabaseClient` type from `@mirai-app/common`
2. Remove `mockSupabaseClient as unknown as SupabaseClient` casts
3. Verify tests pass

**Blockers**: Phase 3 complete

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All 7 casts removed, tests pass
  2. **Testing** (30%): All auth tests pass
  3. **Quality** (25%): Clean type usage, no workarounds
  4. **Completeness** (15%): All 3 files updated

---

#### Step 4.2: Update Supabase Tests
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 4.1 (Wave 6 - Auth/Supabase)

**Success Criteria**:
- `packages/supabase/src/__tests__/client.test.ts` - 24 casts removed
- `packages/supabase/src/__tests__/react.test.tsx` - 1 cast removed
- `packages/supabase/src/__tests__/base.test.ts` - 1 cast removed
- All supabase tests pass

**Subtasks**:
1. Update `SupabaseClient` type to use interface from `@mirai-app/common`
2. Remove all `as unknown as` casts
3. Verify tests pass

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**: Same as Step 4.1

---

### Phase 5: Cleanup and Verification

#### Step 5.1: Remove SQLite Files
**Estimate**: Small (15-30 min)  
**Agent**: haiku  
**Parallel with**: 5.2 (Wave 7 - Cleanup)

**Success Criteria**:
- All 15 `*-sqlite-schema.ts` files deleted
- All 15 `*-sqlite-db.ts` files deleted
- All `*.sqlite.test.ts` files replaced with `.pglite.test.ts`
- `vitest.sqlite.config.ts` deleted

**Subtasks**:
1. Delete all `*-sqlite-schema.ts` files
2. Delete all `*-sqlite-db.ts` files
3. Delete `vitest.sqlite.config.ts`
4. Update `vitest.config.ts` to remove `**/*.sqlite.test.ts` exclusion

**Blockers**: Phases 2-4 complete

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Completeness** (50%): All 30+ SQLite files deleted
  2. **Correctness** (50%): No references to SQLite files remain

---

#### Step 5.2: Optimize Lifecycle
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 5.1 (Wave 7 - Cleanup)

**Success Criteria**:
- All 17 `.pglite.test.ts` files use `beforeAll` + `beforeEach(reset)` + `afterAll`
- 165 tests run in ~29s

**Subtasks**:
1. Audit all `.pglite.test.ts` files for lifecycle pattern
2. Update files using `beforeEach(createDb)` to `beforeAll` + `beforeEach(reset)`
3. Run full suite and verify timing

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All files use optimized pattern
  2. **Performance** (30%): 165 tests run in < 30s
  3. **Quality** (25%): Consistent pattern across all files
  4. **Completeness** (15%): All 17 files updated

---

#### Step 5.3: Final Verification
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 8 - Depends on 5.1 AND 5.2)

**Success Criteria**:
- `nx run-many -t typecheck` passes
- All modified tests pass
- Zero `as unknown as` occurrences in test files

**Subtasks**:
1. Run `nx run-many -t typecheck`
2. Run `nx run @mirai-app/orpc:test`
3. Run `nx run @mirai-app/auth:test`
4. Run `nx run @mirai-app/supabase:test`
5. Search for remaining `as unknown as` in test files
6. Update documentation

**Blockers**: Steps 5.1 and 5.2 complete

**Verification**:
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubrics**:
  1. **Correctness** (20%): Typecheck passes, zero casts
  2. **Testing** (20%): All tests pass
  3. **Completeness** (20%): All acceptance criteria met
  4. **Quality** (20%): No SQLite remnants, clean codebase
  5. **Performance** (20%): Tests run in < 30s

---

## Verification Summary

| Step | Description | Level | Threshold | Judge Count | Primary Rubrics |
|------|-------------|-------|-----------|-------------|-----------------|
| 1.1 | Install PGLite | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 1.2 | Create Test Helper | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 1.3 | Create POC Test | High | 4.0/5.0 | 2 | Correctness, Testing, Quality |
| 2.1 | Migrate Batch 1 | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 2.2 | Migrate Batch 2 | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 2.3 | Migrate Batch 3 | High | 4.0/5.0 | 2 | Correctness, Testing, Quality, Completeness |
| 3.1 | Migrate Trip/Notifications | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 3.2 | Migrate Notification Tests | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 3.3 | Migrate Remaining Tests | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 4.1 | Update Auth Tests | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 4.2 | Update Supabase Tests | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| 5.1 | Remove SQLite Files | Low | 3.5/5.0 | 1 | Completeness, Correctness |
| 5.2 | Optimize Lifecycle | Medium | 4.0/5.0 | 1 | Correctness, Performance, Quality |
| 5.3 | Final Verification | Panel | 4.5/5.0 | 3 | All categories |

---

## Sub-Agent Execution Directive

### Agent Type Assignments

| Step | Agent Type | Rationale |
|------|------------|-----------|
| 1.1, 5.1 | **haiku** | Simple dependency/installation tasks |
| 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 5.2, 5.3 | **sonnet** | Medium complexity, requires reasoning, testing logic |
| 2.3 | **opus** | High complexity, many table dependencies |

### Parallel Execution Waves

**Wave 1**: Step 1.1 (Install PGLite)  
**Wave 2**: Step 1.2 (Create Helper)  
**Wave 3**: Step 1.3 (Create POC)  
**Wave 4**: Steps 2.1, 2.2, 2.3 (Migrate SQLite Helpers)  
**Wave 5**: Steps 3.1, 3.2, 3.3 (Migrate Mock Tests)  
**Wave 6**: Steps 4.1, 4.2 (Auth/Supabase Tests)  
**Wave 7**: Steps 5.1, 5.2 (Cleanup)  
**Wave 8**: Step 5.3 (Final Verification)

### Execution Rules

1. **Pre-execution Check**: Verify all "Parallel with" steps from previous waves are complete
2. **Dependency Gate**: Never start a step until ALL its blockers are satisfied
3. **Wave Synchronization**: Wait for entire wave to complete before starting dependent waves
4. **Quality Gate**: Each step must pass success criteria before marking complete
5. **Agent Selection**: Use assigned agent type - no substitutions without approval

### Critical Path

```
1.1 → 1.2 → 1.3 → 2.3 → 3.3 → 4.2 → 5.2 → 5.3
```

**Critical Path Duration**: ~6 hours sequential  
**Wall Clock with Parallelization**: ~3 hours  
**Parallelization Savings**: ~50% time reduction

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PGLite WASM size (~2.6MB) | Medium | Low | Monitor CI memory, file-level parallelization |
| PGLite slower than SQLite | High | Low | Optimized lifecycle pattern (5.2x speedup) |
| Schema push time (1-2s per file) | Medium | Low | `beforeAll` pattern (once per file) |
| Parallel test execution within file | Low | Medium | Isolated per-file instances |
| Complex helper migration (trip/user) | Medium | Medium | Migrate one at a time, verify before next |

---

## Results

| Metric | Before | After |
|--------|--------|-------|
| Test files | 30+ (SQLite + mock) | 17 (PGLite only) |
| `as unknown as` casts | 202 | 0 |
| Test execution time | ~150s+ | ~29s |
| Schema files | 15 (SQLite-specific) | 0 (production only) |
| Database creations | 1 per test | 1 per file |

---

## Definition of Done Checklist

- [x] All acceptance criteria pass
- [x] All 202 `as unknown as` casts eliminated
- [x] All 30 SQLite files deleted
- [x] All 17 `.pglite.test.ts` files use optimized lifecycle
- [x] Typecheck passes for all modified packages
- [x] All modified tests pass
- [x] Documentation updated
- [x] No new `console.log` in production code
- [x] No `as any` or `@ts-ignore` added
