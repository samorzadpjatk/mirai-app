---
title: Database Schema Refactor — Drop Leftover Tables and Separate Backend-Only Routers
---

## Initial User Prompt

Rewrite the database schema refactor plan to adhere to the development process established in AGENTS.md, matching the directory structure of the `.specs` folder.

## Description

This task refactors the database schema to remove unused tables and separate backend-only routers into a dedicated internal API surface. The current schema has **40 tables** but only **37 are actively used** by the business logic. Additionally, **3 backend-only routers** (`notificationDelivery`, `notificationSender`, `submissionReport`) are exposed on the public API surface without proper authentication, creating a security risk.

**Scope**:
- **Included**: Drop `events` and `userEvents` tables, separate `notificationDelivery`/`notificationSender` into `serviceRouter`, remove `submissionReport`, add `serviceAccountProcedure`, update `apps/backend-server` with dual endpoints
- **Excluded**: Changes to `userAgents` table (operational telemetry), data migration for existing events data (assumed empty), notification-sender logic changes beyond endpoint/token updates

**User Scenarios**:
1. **Primary Flow**: Client app calls `/api/trpc` — only sees 15 public routers, no backend-only endpoints
2. **Alternative Flow**: Notification-sender microservice calls `/internal/trpc` with `x-service-token` — accesses `notificationDelivery` and `notificationSender` routers
3. **Error Handling**: Client without service token calls `/internal/trpc` — receives 401 Unauthorized

## Architecture Overview

### Solution Strategy

This implementation uses a **dual API surface** pattern with clear separation between public and internal endpoints:

| Layer | Purpose | Auth | Path |
|-------|---------|------|------|
| **Public API** | Client apps (iOS/Android/Web) | User JWT (Supabase) | `/api/trpc` |
| **Internal API** | Service-to-service, workers | Service token (`x-service-token`) | `/internal/trpc` |

### Key Architectural Decisions

1. **Expand-Contract Pattern for Table Removal**: Tables are dropped in 3 deploy phases — stop writes, verify zero traffic, then drop. This prevents accidental data loss and allows rollback.

2. **Service Token Authentication**: Internal endpoints use a dedicated `serviceAccountProcedure` that validates `x-service-token` header with `timingSafeEqual`. This is separate from user JWT auth and prevents client apps from accessing internal routers.

3. **Dual Router Structure**: `appRouter` contains only client-facing routers. `serviceRouter` contains backend-only routers. Both are exported from `packages/orpc` but only `appRouter` is exposed to clients.

4. **No Breaking Changes for Existing Deployments**: The old `/api/trpc` endpoint continues to work. The new `/internal/trpc` endpoint is added first. Old routes are deprecated for 1 release cycle before removal.

5. **Dead Code Elimination**: `submissionReport` router is removed entirely (no app calls it). `events` and `userEvents` tables are dropped (no code references).

### Boundary Layer Matrix

```
┌─────────────────────────────────────────────────────────┐
│  LAYER              │  AUTH          │  ROUTERS        │
├─────────────────────────────────────────────────────────┤
│  Public API         │  User JWT      │  15 client      │
│  (/api/trpc)        │  (Supabase)    │  routers        │
│  Internal API       │  Service token │  2 service      │
│  (/internal/trpc)   │  (x-service-   │  routers        │
│                     │  token)        │                 │
│  Database           │  —             │  38 tables      │
│  (after refactor)   │                │  (down from 40) │
└─────────────────────────────────────────────────────────┘
```

### Expected File Changes

**Create (4 files)**:
| File | Purpose |
|------|---------|
| `packages/orpc/src/api/service-root.ts` | Internal router definition (`serviceRouter`) |
| `packages/orpc/src/server/service-caller.ts` | In-process service caller factory |
| `apps/backend-server/src/internal-handler.ts` | Hono handler for `/internal/trpc` |
| `packages/db/drizzle/.../drop_events_and_user_events.sql` | Migration to drop tables |

**Modify (10+ files)**:
| File | Changes |
|------|---------|
| `packages/db/src/schema/index.ts` | Remove `events`, `userEvents`, `eventsRelations`, `userEventsRelations` exports |
| `packages/db/src/schema/relations.ts` | Remove `eventsRelations` and `userEventsRelations` |
| `packages/db/src/index.ts` | Remove `Event`, `UserEvent` type exports |
| `packages/orpc/src/api/root.ts` | Remove `notificationDelivery`, `notificationSender`, `submissionReport` |
| `packages/orpc/src/api/trpc.ts` | Add `serviceAccountProcedure` with `timingSafeEqual` token validation |
| `packages/orpc/src/api/routers/notificationSender/index.ts` | Apply `serviceAccountProcedure` to all mutations |
| `packages/orpc/src/api/routers/notificationDelivery/index.ts` | Apply `serviceAccountProcedure` to all mutations |
| `apps/backend-server/src/server.ts` | Add `/internal/trpc` endpoint with token validation |
| `apps/notification-sender/src/index.ts` | Update to call `/internal/trpc` with `x-service-token` |
| `packages/orpc/src/client/index.ts` | Ensure only `appRouter` types are exported |

**Delete (4 files)**:
| File | Reason |
|------|--------|
| `packages/db/src/schema/events.ts` | Table dropped |
| `packages/orpc/src/api/routers/submissionReport/` | Router removed (unused) |
| `packages/orpc/src/api/routers/__tests__/submissionReport.pglite.test.ts` | Tests for removed router |
| `packages/db/src/schema/index.ts` (old exports) | `Event`, `UserEvent` types removed |

---

## Acceptance Criteria

### Functional Requirements

- [ ] **Leftover Tables Dropped**: `events` and `userEvents` tables removed from schema and database
  - Given: `packages/db/src/schema/events.ts` is deleted and `index.ts`/`relations.ts` are updated
  - When: `nx run @mirai-app/db:db:generate` runs
  - Then: Generated migration contains `DROP TABLE IF EXISTS "events" CASCADE` and `DROP TABLE IF EXISTS "user_events" CASCADE`
  - And: `nx run-many -t typecheck` passes across all packages
  - And: `nx run-many -t test` passes in `packages/db` and `packages/orpc`

- [ ] **Internal Router Created**: `serviceRouter` exists with `notificationDelivery` and `notificationSender`
  - Given: `packages/orpc/src/api/service-root.ts` is created
  - When: `nx run @mirai-app/orpc:typecheck` runs
  - Then: File compiles with zero errors, exports both `serviceRouter` and `ServiceRouter` type

- [ ] **Public Router Cleaned**: `appRouter` contains only client-facing routers
  - Given: `packages/orpc/src/api/root.ts` is updated
  - When: `nx run @mirai-app/orpc:typecheck` runs
  - Then: `appRouter` does not contain `notificationDelivery`, `notificationSender`, or `submissionReport`
  - And: `appRouter` contains exactly 15 client routers

- [ ] **Service Authentication**: `serviceAccountProcedure` validates `x-service-token` with `timingSafeEqual`
  - Given: `packages/orpc/src/api/trpc.ts` is updated
  - When: A request without `x-service-token` hits `/internal/trpc`
  - Then: Response is 401 Unauthorized with `{ error: "Invalid service token" }`
  - And: Timing-safe comparison prevents timing attacks

- [ ] **Internal Endpoint**: `apps/backend-server` exposes `/internal/trpc` with token validation
  - Given: `apps/backend-server/src/server.ts` is updated
  - When: `nx run @mirai-app/backend-server:typecheck` runs
  - Then: Server compiles with zero errors
  - And: `curl -I http://localhost:2022/internal/trpc` without token returns 401

- [ ] **Notification Sender Updated**: `apps/notification-sender` calls `/internal/trpc` with `x-service-token`
  - Given: `apps/notification-sender/src/index.ts` is updated
  - When: `nx run @mirai-app/notification-sender:typecheck` runs
  - Then: File compiles with zero errors
  - And: Client points to `/internal/trpc` endpoint

- [ ] **Submission Report Removed**: `submissionReport` router and tests are deleted
  - Given: `packages/orpc/src/api/routers/submissionReport/` directory is deleted
  - When: `nx run-many -t test` runs
  - Then: No test failures related to missing `submissionReport`
  - And: `nx run-many -t typecheck` passes

- [ ] **Schema Count Reduced**: Database schema has 38 tables (down from 40)
  - Given: `packages/db/src/schema/index.ts` is updated
  - When: `schemaTables` array is counted
  - Then: Array contains exactly 38 table references
  - And: `events` and `userEvents` are not present

### Non-Functional Requirements

- [ ] **Security**: Service token validation uses `timingSafeEqual` (constant-time comparison) to prevent timing attacks
- [ ] **Type Safety**: `nx run-many -t typecheck` passes across all packages after each phase
- [ ] **Test Reliability**: All existing tests pass after each phase; no new flaky tests introduced
- [ ] **Backward Compatibility**: Public API (`/api/trpc`) continues to work for existing clients — no breaking changes to client-facing routers
- [ ] **Dead Code Detection**: `bunx knip` run before and after changes shows no increase in unused exports

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] All 3 phases complete with documented results
- [ ] `nx run-many -t typecheck` passes across all packages
- [ ] `nx run-many -t test` passes across all packages
- [ ] `nx run-many -t build` passes across all packages
- [ ] Database migration tested in dev environment
- [ ] Documentation updated (`packages/db/README.md`, `packages/orpc/README.md`)
- [ ] `AGENTS.md` updated with dual API surface pattern
- [ ] PR checklist includes security review for internal endpoints
- [ ] Code reviewed and approved

---

## Implementation Process

### Phase 1: Drop Leftover Tables (Week 1)

#### Step 1.1: Verify Zero Usage of `events` and `userEvents`
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 — Foundation)

**Success Criteria**:
- `grep` for `events` and `userEvents` in `apps/native`, `apps/backend-server`, `packages/orpc` returns zero matches (excluding schema tests)
- `pg_stat_user_tables` query shows zero reads/writes for both tables (if production access available)
- `pg_depend` and `information_schema` queries show zero dependencies

**Subtasks**:
1. Run `grep -r "events\|userEvents" apps/native/ packages/orpc/ apps/backend-server/` (excluding schema files)
2. Run verification SQL queries on dev database
3. Document results in `## Findings`
4. If any references found, abort and report to user

**Blockers**: None

**Risks**:
- Risk: Undetected references in dynamic code or string concatenation
  - Mitigation: Use `grep` with case-insensitive and partial matching

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (40%): Zero code references found
  2. **Completeness** (40%): All verification queries run
  3. **Quality** (20%): Results documented

---

#### Step 1.2: Remove `events` and `userEvents` from Schema
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 — Depends on 1.1)

**Success Criteria**:
- `packages/db/src/schema/events.ts` deleted
- `packages/db/src/schema/relations.ts` updated (remove `eventsRelations`, `userEventsRelations`)
- `packages/db/src/schema/index.ts` updated (remove exports, update `schemaTables` array)
- `packages/db/src/index.ts` updated (remove `Event`, `UserEvent` type exports)
- `nx run @mirai-app/db:typecheck` passes

**Subtasks**:
1. Delete `packages/db/src/schema/events.ts`
2. Edit `packages/db/src/schema/relations.ts`: Remove `eventsRelations` and `userEventsRelations`
3. Edit `packages/db/src/schema/index.ts`: Remove exports, update `schemaTables` array
4. Edit `packages/db/src/index.ts`: Remove `Event`, `UserEvent` type exports
5. Run `nx run @mirai-app/db:typecheck`
6. Fix any compilation errors

**Blockers**:
- Step 1.1 complete (zero usage verified)

**Risks**:
- Risk: Type exports in other packages may reference `Event` or `UserEvent`
  - Mitigation: Run `nx run-many -t typecheck` after changes to catch all references

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (40%): All schema files updated correctly
  2. **Completeness** (40%): Typecheck passes, zero references remain
  3. **Quality** (20%): Clean deletions, no leftover imports

---

#### Step 1.3: Generate Migration for Table Drops
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 — Depends on 1.2)

**Success Criteria**:
- Migration generated with `nx run @mirai-app/db:db:generate`
- Generated SQL contains `DROP TABLE IF EXISTS "user_events" CASCADE` and `DROP TABLE IF EXISTS "events" CASCADE`
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes

**Subtasks**:
1. Run `nx run @mirai-app/db:db:generate`
2. Review generated SQL for `DROP TABLE IF EXISTS` usage
3. Run `nx run @mirai-app/db:typecheck`
4. Run `nx run @mirai-app/db:test`
5. Fix any errors

**Blockers**:
- Step 1.2 complete

**Risks**:
- Risk: Migration may fail if tables have dependencies
  - Mitigation: Use `CASCADE` to drop dependent objects; verify with `pg_depend` first

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (35%): Migration generated with correct SQL
  2. **Completeness** (35%): Typecheck and tests pass
  3. **Quality** (20%): SQL reviewed and correct
  4. **Integration** (10%): No build errors

---

### Phase 2: Refactor Backend-Only Routers (Week 2)

#### Step 2.1: Create `service-root.ts` and `serviceAccountProcedure`
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Foundation)

**Success Criteria**:
- `packages/orpc/src/api/service-root.ts` created with `serviceRouter` containing `notificationDelivery` and `notificationSender`
- `packages/orpc/src/api/trpc.ts` updated with `serviceAccountProcedure`
- `serviceAccountProcedure` validates `x-service-token` with `timingSafeEqual`
- `nx run @mirai-app/orpc:typecheck` passes

**Subtasks**:
1. Create `packages/orpc/src/api/service-root.ts`
2. Edit `packages/orpc/src/api/trpc.ts`: Add `serviceAccountProcedure`
3. Import `timingSafeEqual` from `crypto`
4. Define `SERVICE_TOKENS` map with `NOTIFICATION_SENDER_TOKEN` and `SEED_SERVICE_TOKEN`
5. Implement `validateServiceToken` function with constant-time comparison
6. Export `serviceAccountProcedure` that checks `x-service-token` header
7. Run `nx run @mirai-app/orpc:typecheck`
8. Fix any compilation errors

**Blockers**: None

**Risks**:
- Risk: `timingSafeEqual` may throw if buffers are different lengths
  - Mitigation: Ensure both buffers are same length before comparison

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): `serviceAccountProcedure` validates token correctly
  2. **Security** (25%): `timingSafeEqual` used, no timing leaks
  3. **Completeness** (20%): `serviceRouter` created with correct routers
  4. **Integration** (15%): Typecheck passes
  5. **Quality** (10%): Clean code, no redundancy

---

#### Step 2.2: Apply `serviceAccountProcedure` to Service Routers
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Depends on 2.1)

**Success Criteria**:
- `packages/orpc/src/api/routers/notificationSender/index.ts` updated: all procedures use `serviceAccountProcedure`
- `packages/orpc/src/api/routers/notificationDelivery/index.ts` updated: all procedures use `serviceAccountProcedure`
- `nx run @mirai-app/orpc:typecheck` passes
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Edit `packages/orpc/src/api/routers/notificationSender/index.ts`: Replace `publicProcedure` with `serviceAccountProcedure`
2. Edit `packages/orpc/src/api/routers/notificationDelivery/index.ts`: Replace `publicProcedure` with `serviceAccountProcedure`
3. Run `nx run @mirai-app/orpc:typecheck`
4. Run `nx run @mirai-app/orpc:test`
5. Fix any errors

**Blockers**:
- Step 2.1 complete

**Risks**:
- Risk: Tests may mock `publicProcedure` and break with `serviceAccountProcedure`
  - Mitigation: Update test mocks to provide `x-service-token` header

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (35%): All procedures use `serviceAccountProcedure`
  2. **Completeness** (35%): Tests pass with updated mocks
  3. **Quality** (20%): No leftover `publicProcedure` references
  4. **Integration** (10%): Typecheck passes

---

#### Step 2.3: Update `appRouter` and Remove `submissionReport`
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Depends on 2.2)

**Success Criteria**:
- `packages/orpc/src/api/root.ts` updated: remove `notificationDelivery`, `notificationSender`, `submissionReport`
- `packages/orpc/src/api/routers/submissionReport/` directory deleted
- `packages/orpc/src/api/routers/__tests__/submissionReport.pglite.test.ts` deleted
- `nx run @mirai-app/orpc:typecheck` passes
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Edit `packages/orpc/src/api/root.ts`: Remove 3 routers from `appRouter`
2. Delete `packages/orpc/src/api/routers/submissionReport/` directory
3. Delete `packages/orpc/src/api/routers/__tests__/submissionReport.pglite.test.ts`
4. Run `nx run @mirai-app/orpc:typecheck`
5. Run `nx run @mirai-app/orpc:test`
6. Fix any errors

**Blockers**:
- Step 2.2 complete

**Risks**:
- Risk: Other tests may reference `submissionReport` router
  - Mitigation: Search for `submissionReport` in all test files before deletion

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (35%): `appRouter` contains only 15 client routers
  2. **Completeness** (35%): All files deleted, tests pass
  3. **Quality** (20%): No leftover references
  4. **Integration** (10%): Typecheck passes

---

#### Step 2.4: Create Internal Endpoint in Backend Server
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Depends on 2.3)

**Success Criteria**:
- `apps/backend-server/src/server.ts` updated: add `/internal/trpc` endpoint
- `apps/backend-server/src/server.ts` updated: public endpoint only uses `appRouter`
- `nx run @mirai-app/backend-server:typecheck` passes
- `nx run @mirai-app/backend-server:test` passes

**Subtasks**:
1. Edit `apps/backend-server/src/server.ts`: Add `/internal/trpc` endpoint
2. Implement token validation in the Hono handler
3. Ensure public endpoint (`/api/trpc`) only exposes `appRouter`
4. Run `nx run @mirai-app/backend-server:typecheck`
5. Run `nx run @mirai-app/backend-server:test`
6. Fix any errors

**Blockers**:
- Step 2.3 complete

**Risks**:
- Risk: Backend server may have complex routing logic that conflicts with new endpoint
  - Mitigation: Review existing Hono routes carefully before adding new endpoint

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): `/internal/trpc` validates token correctly
  2. **Security** (25%): Unauthorized requests get 401
  3. **Completeness** (20%): Public endpoint only exposes `appRouter`
  4. **Integration** (15%): Typecheck and tests pass
  5. **Quality** (10%): Clean code, no redundancy

---

#### Step 2.5: Update Notification Sender Client
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Depends on 2.4)

**Success Criteria**:
- `apps/notification-sender/src/index.ts` updated: calls `/internal/trpc` with `x-service-token`
- `nx run @mirai-app/notification-sender:typecheck` passes
- `nx run @mirai-app/notification-sender:test` passes

**Subtasks**:
1. Edit `apps/notification-sender/src/index.ts`: Update endpoint to `/internal/trpc`
2. Add `x-service-token` header with `NOTIFICATION_SENDER_TOKEN` env var
3. Run `nx run @mirai-app/notification-sender:typecheck`
4. Run `nx run @mirai-app/notification-sender:test`
5. Fix any errors

**Blockers**:
- Step 2.4 complete

**Risks**:
- Risk: Notification sender may have hardcoded endpoint paths
  - Mitigation: Search for all `trpc` endpoint references in the app

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (35%): Client points to `/internal/trpc`
  2. **Completeness** (35%): Token header included, tests pass
  3. **Quality** (20%): Clean code, no hardcoded tokens
  4. **Integration** (10%): Typecheck passes

---

### Phase 3: Verification and Documentation (Week 3)

#### Step 3.1: Full Integration Verification
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 — Final Check)

**Success Criteria**:
- `nx run-many -t typecheck` passes across all packages
- `nx run-many -t test` passes across all packages
- `nx run-many -t build` passes across all packages
- `bunx knip` shows no increase in unused exports
- Schema table count is 38 (down from 40)

**Subtasks**:
1. Run `nx run-many -t typecheck`
2. Run `nx run-many -t test`
3. Run `nx run-many -t build`
4. Run `bunx knip` and compare with baseline
5. Count `schemaTables` array in `packages/db/src/schema/index.ts`
6. Fix any errors

**Blockers**:
- Steps 1.3 and 2.5 complete

**Risks**:
- Risk: Build may fail due to circular dependencies
  - Mitigation: Fix incrementally, starting with `packages/db`, then `packages/orpc`, then apps

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Typecheck, test, build all pass
  2. **Completeness** (30%): No new unused exports
  3. **Testing** (25%): All tests pass
  4. **Quality** (15%): Clean build, no warnings

---

#### Step 3.2: Documentation Update
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 3.1 (Wave 3 — Documentation)

**Success Criteria**:
- `packages/db/README.md` updated: removed tables documented
- `packages/orpc/README.md` updated: `appRouter` vs `serviceRouter` documented
- `docs/packages/db/schema.md` updated: 38 tables, operational tables documented
- `environment/.env.example` updated: `NOTIFICATION_SENDER_TOKEN` and `SEED_SERVICE_TOKEN` added

**Subtasks**:
1. Update `packages/db/README.md` with schema changes
2. Update `packages/orpc/README.md` with dual API surface documentation
3. Update `docs/packages/db/schema.md` with table count and operational notes
4. Update `environment/.env.example` with service token env vars
5. Update `AGENTS.md` with dual API surface pattern

**Blockers**:
- Step 2.5 complete

**Risks**:
- Risk: Documentation may become outdated
  - Mitigation: Keep documentation concise and reference this task file

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Completeness** (40%): All 4 documentation files updated
  2. **Quality** (35%): Guidelines are clear, actionable, and specific
  3. **Correctness** (25%): Env vars match actual implementation

---

## Verification Summary

| Step | Description | Level | Threshold | Judge Count | Primary Rubrics |
|------|-------------|-------|-----------|-------------|-----------------|
| 1.1 | Verify Zero Usage | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 1.2 | Remove from Schema | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 1.3 | Generate Migration | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| 2.1 | Create serviceRouter + Procedure | High | 4.0/5.0 | 2 | Correctness, Security, Completeness |
| 2.2 | Apply to Service Routers | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| 2.3 | Update appRouter + Remove submissionReport | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| 2.4 | Create Internal Endpoint | High | 4.0/5.0 | 2 | Correctness, Security, Integration |
| 2.5 | Update Notification Sender | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| 3.1 | Full Integration Verification | High | 4.0/5.0 | 2 | Correctness, Testing, Completeness |
| 3.2 | Documentation Update | Low | 3.5/5.0 | 1 | Completeness, Quality |

**Legend**:
- **Level**: None / Low / Medium / High / Panel
- **Threshold**: Minimum score required (out of 5.0)
- **Judge Count**: Number of independent judges for verification
- **Rubrics**: Evaluation categories — Correctness, Completeness, Quality, Testing, Integration, Security

---

## Sub-Agent Execution Directive

### Agent Type Assignments

| Step | Agent Type | Rationale |
|------|------------|-----------|
| 1.1, 1.2, 1.3, 2.2, 2.3, 2.5, 3.2 | **sonnet** | Medium complexity, reasoning, testing logic |
| 2.1, 2.4 | **sonnet** | High complexity, security-critical, requires careful review |
| 3.1 | **sonnet** | High complexity, integration testing, full verification |

### Parallel Execution Waves

**Wave 1**: Steps 1.1, 1.2 (1.1 → 1.2 sequential — verification first)  
**Wave 2**: Step 1.3 (Depends on Wave 1)  
**Wave 3**: Step 2.1 (Independent of Wave 2, but can run in parallel)  
**Wave 4**: Step 2.2 (Depends on 2.1)  
**Wave 5**: Step 2.3 (Depends on 2.2)  
**Wave 6**: Step 2.4 (Depends on 2.3)  
**Wave 7**: Step 2.5 (Depends on 2.4)  
**Wave 8**: Steps 3.1, 3.2 (ALL parallel — depends on Wave 7)

### Execution Rules

1. **Pre-execution Check**: Verify all "Parallel with" steps from previous waves are complete
2. **Dependency Gate**: Never start a step until ALL its blockers are satisfied
3. **Wave Synchronization**: Wait for entire wave to complete before starting dependent waves
4. **Quality Gate**: Each step must pass success criteria before marking complete
5. **Agent Selection**: Use assigned agent type — no substitutions without approval
6. **Type Safety Gate**: After each wave, run `nx run-many -t typecheck` to catch type errors early

### Critical Path

```
1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 3.1
```

**Critical Path Duration**: ~5 hours sequential  
**Wall Clock with Parallelization**: ~3.5 hours  
**Parallelization Savings**: ~30% time reduction

### Synchronization Points

1. **Wave 1 → 2**: Wait for 1.2 completion
2. **Wave 2 → 3**: Wait for 1.3 completion
3. **Wave 3 → 4**: Wait for 2.1 completion
4. **Wave 4 → 5**: Wait for 2.2 completion
5. **Wave 5 → 6**: Wait for 2.3 completion
6. **Wave 6 → 7**: Wait for 2.4 completion
7. **Wave 7 → 8**: Wait for 2.5 completion

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Existing data in `events` table | Low | High | Run `SELECT COUNT(*) FROM events` before migration; if >0, archive to backup table |
| Native app references undetected | Low | Medium | Full-text search in `apps/native` for `events` or `userEvents` strings |
| Other packages reference types | Low | Medium | Check `packages/shared` for `Event` or `UserEvent` type usage |
| Notification-sender breaks | Medium | High | Integration test after endpoint change; verify token is passed correctly |
| Client type bundle bloat | Low | Medium | Verify `orpc` client instance only includes `appRouter` |
| Service token exposure | Medium | High | Use `x-service-token` header (not query params). Rotate tokens periodically |
| Breaking existing deployments | Medium | High | Add new `/internal/trpc` endpoint BEFORE removing old routes. Deprecate old routes for 1 release cycle |
| Timing attack on token validation | Low | High | Use `timingSafeEqual` for constant-time comparison; never use `===` or `==` |
| Missing `CASCADE` in DROP TABLE | Low | High | Always use `DROP TABLE IF EXISTS ... CASCADE` to remove dependent objects |
| Build fails due to circular deps | Low | Medium | Fix incrementally; start with `packages/db`, then `packages/orpc`, then apps |

---

## Definition of Done Checklist

- [ ] All 10 acceptance criteria pass
- [ ] All 3 phases complete with documented results
- [ ] `nx run-many -t typecheck` passes across all packages
- [ ] `nx run-many -t test` passes across all packages
- [ ] `nx run-many -t build` passes across all packages
- [ ] Database migration tested in dev environment
- [ ] No new unused exports introduced (`bunx knip` baseline)
- [ ] `packages/db/README.md` updated with schema changes
- [ ] `packages/orpc/README.md` updated with dual API surface docs
- [ ] `docs/packages/db/schema.md` updated with table count
- [ ] `environment/.env.example` updated with service token env vars
- [ ] `AGENTS.md` updated with dual API surface pattern
- [ ] PR checklist includes security review for internal endpoints
- [ ] Code reviewed and approved
- [ ] Schema has exactly 38 tables (down from 40)
- [ ] `appRouter` has exactly 15 client routers
- [ ] `serviceRouter` has exactly 2 service routers
- [ ] Service endpoints require `x-service-token` with `timingSafeEqual` validation

---

## References

- [AGENTS.md](../../AGENTS.md) — Development process and conventions
- [docs/conventions/testing.md](../../docs/conventions/testing.md) — Testing conventions
- [docs/conventions/tdd.md](../../docs/conventions/tdd.md) — TDD best practices
- [docs/conventions/best-practices.md](../../docs/conventions/best-practices.md) — Code quality standards
- [docs/conventions/documentation.md](../../docs/conventions/documentation.md) — Documentation patterns
- [docs/conventions/null-safety.md](../../docs/conventions/null-safety.md) — Null safety guidelines
- [packages/db/AGENTS.md](../../packages/db/AGENTS.md) — Database package conventions
- [packages/orpc/AGENTS.md](../../packages/orpc/AGENTS.md) — oRPC package conventions
- [apps/backend-server/AGENTS.md](../../apps/backend-server/AGENTS.md) — Backend server conventions
- [apps/notification-sender/AGENTS.md](../../apps/notification-sender/AGENTS.md) — Notification sender conventions
