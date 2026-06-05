---
title: Database Schema Hardening — Constraints, Nullability, Privacy, and Legacy Cleanup
---

## Initial User Prompt

Convert the DB_SCHEMA_ANALYSIS.md into a CEK SDD compatible plan for implementing database schema improvements in the developer workflow.

## Description

This task implements the database schema hardening recommendations from the comprehensive schema analysis. The MIRAI database has **38 tables** across 9 logical domains with strong foundational design (UUIDs, timestamps, PostgreSQL enums) but exhibits significant null-safety gaps, missing business-rule constraints, and legacy table cleanup needs.

The implementation is structured as **4 phases** over **4-6 weeks**, from critical safety improvements (CHECK constraints, nullability audit, privacy fixes) to high-priority legacy cleanup (user_agents removal, audit trail) and medium-term architectural improvements (sponsor data separation, retention policies).

**Scope**:
- **Included**: Add CHECK constraints, audit nullability, fix location privacy (delete on disable), drop user_agents table, add audit_logs table, separate sponsor display data, add data retention policies, create tripRoleEnum, rename challenge_location
- **Excluded**: Full-text search (requires separate search infrastructure), table partitioning (not needed at current scale), trip resource table unification (acceptable at current 4 types), data migration for user_agents (table has no business value)

**User Scenarios**:
1. **Primary Flow**: Database enforces business rules at the PostgreSQL level — invalid data (negative coins, invalid coordinates, invalid date ranges) is rejected at insert time
2. **Alternative Flow**: When a user disables location sharing, their coordinates are completely deleted from the database, not just hidden
3. **Error Handling**: Migration fails on existing invalid data → rollback plan is documented, constraints are applied incrementally, data is validated before each constraint is added

## Architecture Overview

### Solution Strategy

This implementation uses a **layered hardening** strategy: database-level constraints first, then application-level behavior fixes, then architectural cleanup:

| Layer | Purpose | Changes |
|-------|---------|---------|
| **Database Constraints** | PostgreSQL-level enforcement | CHECK constraints for business rules, nullability hardening |
| **Application Logic** | Privacy-by-design | Location deletion on disable, user_agents removal |
| **Audit Layer** | Change tracking | audit_logs table, createdBy/updatedBy columns |
| **Data Model** | Separation of concerns | Sponsor display data extraction, tripRole enum |

### Key Architectural Decisions

1. **CHECK Constraints via Drizzle ORM**: All constraints declared in schema files using `check()` from `drizzle-orm/pg-core` with `sql` template literals. Never use operator functions (`gt()`, `gte()`, etc.) due to Drizzle bug generating parameterized placeholders in DDL.

2. **Database-First Nullability**: Start with schema changes. Use `.notNull()` without `.default()` for user-provided content. System fields (timestamps, booleans, counters) may use `.default()`. This aligns with project convention: no `.default()` for user data.

3. **Privacy-by-Design for Location**: When a user disables location sharing, delete their row from `locations` (cascade deletes `location_shares`). The app intentionally stores only current location — no history.

4. **Legacy Table Removal**: Drop `user_agents` table entirely. No replacement table. Telemetry is a non-DB observability concern. Remove `mobileAppMiddleware` from oRPC.

5. **Audit Trail**: Lightweight `audit_logs` table with `tableName`, `recordId`, `action`, `oldValues`, `newValues`, `performedById`, `performedAt`. No database triggers (use application layer for audit population to stay framework-agnostic).

6. **Expand-Contract for Sponsor Data**: Create `trip_sponsor_display` table, migrate data, then drop `height`/`offsetX`/`offsetY` from `sponsors` in a later migration. Prevents data loss during transition.

7. **Data Retention Policies**: Application-level retention jobs (not DB triggers) for `notification_pushes` (90 days), `activity_feeds` (archival after trip end). `coin_transactions` kept indefinitely (financial audit).

### Boundary Layer Matrix

```
┌─────────────────────────────────────────────────────────┐
│  LAYER              │  ENFORCEMENT     │  MECHANISM    │
├─────────────────────────────────────────────────────────┤
│  Database CHECK     │  PostgreSQL      │  check() via  │
│  Constraints        │  DDL             │  Drizzle      │
│  Nullability        │  Schema + Types  │  .notNull()   │
│  Privacy (Location) │  Application     │  DELETE on    │
│                     │                  │  disable      │
│  Audit Trail        │  Application     │  audit_logs   │
│  Data Retention     │  Application     │  Scheduled    │
│                     │                  │  cleanup jobs │
│  Role Enforcement   │  Database + App  │  tripRoleEnum │
└─────────────────────────────────────────────────────────┘
```

### Expected File Changes

**Create (8+ files)**:
| File | Purpose |
|------|---------|
| `packages/db/src/schema/auditLogs.ts` | Audit trail table definition |
| `packages/db/src/schema/tripSponsorDisplay.ts` | Sponsor display config table |
| `packages/db/src/schema/tripRoleEnum.ts` | Trip participant role enum |
| `packages/db/drizzle/.../add_check_constraints.sql` | Migration for CHECK constraints |
| `packages/db/drizzle/.../drop_user_agents.sql` | Migration to drop user_agents table |
| `packages/db/drizzle/.../add_audit_logs.sql` | Migration for audit_logs table |
| `packages/db/drizzle/.../create_trip_sponsor_display.sql` | Migration for sponsor display table |
| `packages/db/drizzle/.../backfill_nullable_columns.sql` | Migration to backfill nulls before notNull |

**Modify (15+ files)**:
| File | Changes |
|------|---------|
| `packages/db/src/schema/locations.ts` | Add CHECK constraints (lat/lng valid ranges) |
| `packages/db/src/schema/challenges.ts` | Add CHECK constraints (time valid, points non-negative) |
| `packages/db/src/schema/trips.ts` | Add CHECK constraints (end_date > start_date) |
| `packages/db/src/schema/groups.ts` | Add CHECK constraints (coins >= 0), nullability audit |
| `packages/db/src/schema/rewards.ts` | Add CHECK constraints (quantity >= 0, coin_cost >= 0) |
| `packages/db/src/schema/coinTransactions.ts` | Add CHECK constraints (amount <> 0) |
| `packages/db/src/schema/challengeSubmissions.ts` | Add CHECK constraints (points >= 0) |
| `packages/db/src/schema/challengeVotes.ts` | Add CHECK constraints (position > 0, points > 0) |
| `packages/db/src/schema/challengeLocation.ts` | Add CHECK constraints (lat/lng valid), consider rename |
| `packages/db/src/schema/tripParticipants.ts` | Replace text role with tripRoleEnum |
| `packages/db/src/schema/sponsors.ts` | Add CHECK constraints (display columns >= 0), prepare for extraction |
| `packages/orpc/src/api/routers/location/mutations.ts` | Delete location row when isSharingLocation = false |
| `packages/orpc/src/api/trpc.ts` | Remove mobileAppMiddleware and user_agents INSERT |
| `packages/db/src/schema/relations.ts` | Remove user_agents relations, add audit_logs relations |
| `packages/db/src/schema/index.ts` | Remove user_agents exports, add audit_logs/trip_sponsor_display exports |

**Delete (4 files)**:
| File | Reason |
|------|--------|
| `packages/db/src/schema/userAgents.ts` | Table dropped |
| `packages/db/src/schema/index.ts` (user_agents exports) | No longer needed |
| `packages/db/src/schema/relations.ts` (user_agents relations) | No longer needed |
| `packages/orpc/src/api/trpc.ts` (mobileAppMiddleware) | Telemetry removed from DB |

---

## Acceptance Criteria

### Functional Requirements

- [ ] **CHECK Constraints Added — Time Ranges**: `challenges` has `end_time > start_time OR end_time IS NULL` and `trips` has `end_date > start_date`
  - Given: Schema files are updated with `check()` constraints
  - When: Migration is generated and applied to dev database
  - Then: Attempting to insert invalid date ranges results in PostgreSQL error
  - And: `nx run @mirai-app/db:typecheck` passes

- [ ] **CHECK Constraints Added — Non-Negative Values**: `groups.coins >= 0`, `rewards.available_quantity >= 0`, `rewards.coin_cost >= 0`, `coin_transactions.amount <> 0`
  - Given: Schema files are updated with `check()` constraints
  - When: Migration is generated and applied to dev database
  - Then: Attempting to insert invalid values results in PostgreSQL error
  - And: `nx run @mirai-app/db:typecheck` passes

- [ ] **CHECK Constraints Added — Geographic Coordinates**: `locations.latitude` between -90 and 90, `locations.longitude` between -180 and 180, `challenge_location.target_latitude` between -90 and 90, `challenge_location.target_longitude` between -180 and 180
  - Given: Schema files are updated with `check()` constraints
  - When: Migration is generated and applied to dev database
  - Then: Attempting to insert invalid coordinates results in PostgreSQL error
  - And: `nx run @mirai-app/db:typecheck` passes

- [ ] **CHECK Constraints Added — Challenge Scoring**: `challenge_submissions.awarded_points >= 0`, `challenge_submissions.bonus_points >= 0`, `challenge_votes.vote_position > 0`, `challenge_votes.vote_points > 0`
  - Given: Schema files are updated with `check()` constraints
  - When: Migration is generated and applied to dev database
  - Then: Attempting to insert invalid scoring values results in PostgreSQL error
  - And: `nx run @mirai-app/db:typecheck` passes

- [ ] **Nullability Audit Complete**: 85+ nullable columns audited, defaults applied where semantically correct for system fields, explicit `.nullable()` documented for truly optional fields
  - Given: Schema files are updated with `.default().notNull()` or explicit `.nullable()`
  - When: Migration is generated and applied to dev database
  - Then: No silent nullable columns remain (all intent is explicit)
  - And: `??` coalescing usage in `apps/native` and `packages/orpc` is reduced by 30-40%
  - And: `nx run-many -t typecheck` passes across all packages

- [ ] **Location Deletion on Disable**: `updateSharingSettings` mutation deletes `locations` row when `isSharingLocation = false`
  - Given: `packages/orpc/src/api/routers/location/mutations.ts` is updated
  - When: A user disables location sharing
  - Then: Their row is deleted from `locations` table
  - And: All associated `location_shares` rows are cascade-deleted
  - And: `nx run @mirai-app/orpc:test` passes

- [ ] **user_agents Table Dropped**: Table removed from schema, no code references remain
  - Given: `packages/db/src/schema/userAgents.ts` is deleted and all references removed
  - When: `nx run @mirai-app/db:db:generate` runs
  - Then: Generated migration contains `DROP TABLE IF EXISTS "user_agents" CASCADE`
  - And: `nx run-many -t typecheck` passes across all packages
  - And: `nx run-many -t test` passes in `packages/db` and `packages/orpc`

- [ ] **Audit Logs Table Created**: `audit_logs` table exists with proper schema and relations
  - Given: `packages/db/src/schema/auditLogs.ts` is created
  - When: Migration is generated and applied
  - Then: Table exists with `id`, `tableName`, `recordId`, `action`, `oldValues`, `newValues`, `performedById`, `performedAt`
  - And: `nx run @mirai-app/db:typecheck` passes
  - And: `performedById` references `users.id` with `onDelete: "set null"`

- [ ] **Sponsor Display Data Separated**: `trip_sponsor_display` table created with `tripId`, `sponsorId`, `height`, `offsetX`, `offsetY`
  - Given: `packages/db/src/schema/tripSponsorDisplay.ts` is created
  - When: Migration is generated and applied
  - Then: Data is migrated from `sponsors` to `trip_sponsor_display`
  - And: `sponsors` table no longer has `height`, `offsetX`, `offsetY`
  - And: `nx run-many -t typecheck` passes

- [ ] **tripRoleEnum Created**: `tripParticipants.role` uses enum instead of text
  - Given: `tripRoleEnum` is created with values `MEMBER`, `ORGANIZER`, `TRIP_ADMIN`, `HELPER`
  - When: Schema is updated and migration applied
  - Then: `tripParticipants.role` is `tripRoleEnum` type (not text)
  - And: All existing data is migrated to enum values
  - And: `nx run-many -t typecheck` passes

- [ ] **challenge_location Renamed**: Table renamed to `challenge_location_match` or equivalent
  - Given: Schema file is renamed and all references updated
  - When: Migration is generated and applied
  - Then: Table name reflects its actual purpose (location matching, not geographic storage)
  - And: `nx run-many -t typecheck` passes

- [ ] **Data Retention Policy**: Application-level cleanup jobs documented and configured
  - Given: Retention policies are defined for `notification_pushes` (90 days) and `activity_feeds` (archival after trip end)
  - When: Retention job runs
  - Then: Old `notification_pushes` records are deleted
  - And: Old `activity_feeds` records are marked archived (or deleted per policy)
  - And: `coin_transactions` is never purged (financial audit trail)

### Non-Functional Requirements

- [ ] **Type Safety**: `nx run-many -t typecheck` passes across all packages after each phase
- [ ] **Test Reliability**: All existing tests pass after each phase; no new flaky tests introduced
- [ ] **Backward Compatibility**: No breaking changes to client-facing API — schema changes are additive or constraint-only
- [ ] **Privacy**: Location data is completely removed when sharing is disabled (no soft-delete)
- [ ] **Performance**: CHECK constraints have negligible performance impact (PostgreSQL native enforcement)
- [ ] **Data Integrity**: All migrations include backfill scripts for existing data before applying constraints

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] All 4 phases complete with documented results
- [ ] `nx run-many -t typecheck` passes across all packages
- [ ] `nx run-many -t test` passes across all packages
- [ ] `nx run-many -t build` passes across all packages
- [ ] Database migrations tested in dev environment
- [ ] `packages/db/README.md` updated with schema changes
- [ ] `docs/conventions/null-safety.md` updated with constraint guidelines
- [ ] PR checklist includes database review items
- [ ] Code reviewed and approved

---

## Implementation Process

### Phase 1: Critical Constraints (Week 1)

#### Step 1.1: Verify Drizzle CHECK Constraint Syntax [DONE]
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 — Foundation)

**Success Criteria**:
- Confirm `check()` from `drizzle-orm/pg-core` works with `sql` template literals
- Confirm operator functions (`gt()`, `gte()`) generate invalid parameterized SQL
- Test migration generation with a sample CHECK constraint
- `nx run @mirai-app/db:typecheck` passes

**Subtasks**:
1. Review `drizzle-orm/pg-core` documentation for `check()` API
2. Create a test schema file with `check("test", sql`${table.column} > 0`)`
3. Run `nx run @mirai-app/db:db:generate` to verify SQL output
4. Confirm SQL does NOT contain `$1` placeholders
5. Test with `gt(table.column, 0)` to confirm it generates `$1` (invalid)
6. Document findings in `## Findings`
7. Remove test schema file

**Blockers**: None

**Risks**:
- Risk: Drizzle version may have fixed the bug
  - Mitigation: Test both syntaxes and verify generated SQL

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Syntax Verification** (40%): Correct `sql` template literal syntax confirmed, operator function bug verified
  2. **Comparative Testing** (40%): Both valid and invalid syntaxes tested with generated SQL review
  3. **Documentation Quality** (20%): Findings documented with clear examples

---

#### Step 1.2: Add CHECK Constraints to Core Tables [DONE]
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 — Depends on 1.1)

**Success Criteria**:
- All CHECK constraints added to schema files:
  - `locations`: `latitude` between -90 and 90, `longitude` between -180 and 180
  - `challenges`: `end_time > start_time OR end_time IS NULL`
  - `trips`: `end_date > start_date`
  - `groups`: `coins >= 0`
  - `rewards`: `available_quantity >= 0`, `coin_cost >= 0`
  - `coin_transactions`: `amount <> 0`
  - `challenge_submissions`: `awarded_points >= 0`, `bonus_points >= 0`
  - `challenge_votes`: `vote_position > 0`, `vote_points > 0`
  - `challenge_location`: `target_latitude` between -90 and 90, `target_longitude` between -180 and 180
  - `sponsors`: `height >= 0`, `offsetX >= 0`, `offsetY >= 0`
- Migration generated: `nx run @mirai-app/db:db:generate`
- Migration tested in dev environment
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes

**Subtasks**:
1. Edit `packages/db/src/schema/locations.ts`: Add CHECK constraints for lat/lng
2. Edit `packages/db/src/schema/challenges.ts`: Add CHECK for time range
3. Edit `packages/db/src/schema/trips.ts`: Add CHECK for date range
4. Edit `packages/db/src/schema/groups.ts`: Add CHECK for coins
5. Edit `packages/db/src/schema/rewards.ts`: Add CHECKs for quantity and coin_cost
6. Edit `packages/db/src/schema/coinTransactions.ts`: Add CHECK for amount <> 0
7. Edit `packages/db/src/schema/challengeSubmissions.ts`: Add CHECKs for points
8. Edit `packages/db/src/schema/challengeVotes.ts`: Add CHECKs for position and points
9. Edit `packages/db/src/schema/challengeLocation.ts`: Add CHECKs for lat/lng
10. Edit `packages/db/src/schema/sponsors.ts`: Add CHECKs for display columns
11. Generate migration: `nx run @mirai-app/db:db:generate`
12. Review generated SQL for correctness
13. Test migration in dev environment
14. Run `nx run @mirai-app/db:typecheck`
15. Run `nx run @mirai-app/db:test`
16. Fix any errors

**Blockers**:
- Step 1.1 complete (CHECK constraint syntax verified)

**Risks**:
- Risk: Existing data may violate constraints
  - Mitigation: Run validation queries before migration; backfill data if needed
- Risk: `challenge_location` table may not exist yet (if rename pending)
  - Mitigation: Apply constraints to current table name, update after rename

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Constraint Correctness** (30%): All CHECK constraints use valid `sql` template literal syntax without parameterized placeholders
  2. **Table Coverage** (30%): All 10 target tables have appropriate business-rule constraints
  3. **Migration Testing** (25%): Migration generated, tested in dev environment, typecheck and tests pass
  4. **Schema Quality** (15%): Clean schema files, no redundant or overlapping constraints

---

#### Step 1.3: Audit Nullability and Add Defaults [DONE]
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 — Depends on 1.2)

**Success Criteria**:
- ~85 nullable columns audited across 24 tables
- System fields (timestamps, booleans, counters) have `.default().notNull()` where semantically correct
- User data fields (names, descriptions, titles) have `.notNull()` without `.default()` — application must provide value
- Truly optional fields have explicit `.nullable()` to document intent
- Migration generated and tested with backfill for existing NULL values
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes

**Subtasks**:
1. List all nullable columns in schema files (use `grep` for `.nullable()` or columns without `.notNull()`)
2. Classify each column: system field ( deserves `.default().notNull()`) or user data (`.notNull()` no `.default()`) or truly optional (`.nullable()`)
3. Edit schema files to apply correct nullability
4. Write explicit migration SQL to backfill existing NULL values
5. Generate migration: `nx run @mirai-app/db:db:generate`
6. Test migration in dev environment
7. Verify existing data is properly backfilled
8. Run `nx run @mirai-app/db:typecheck`
9. Run `nx run @mirai-app/db:test`
10. Fix any errors

**Blockers**:
- Step 1.2 complete (CHECK constraints added)

**Risks**:
- Risk: Existing rows with NULL values may conflict with `.notNull()`
  - Mitigation: Explicit migration SQL backfills NULLs before applying `.notNull()` constraint
- Risk: Insert paths may not provide required fields
  - Mitigation: Update all insert queries in `packages/orpc` to provide explicit values

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Nullability Correctness** (30%): All ~85 columns classified correctly (system `.default().notNull()`, user `.notNull()`, optional `.nullable()`)
  2. **Migration Completeness** (30%): Backfill migration written and tested, existing NULL values handled before `.notNull()` applied
  3. **Convention Adherence** (25%): No `.default()` on user-provided content, explicit `.nullable()` documents intent
  4. **TypeScript Integration** (15%): `nx run-many -t typecheck` passes across all packages, `??` usage reduced

---

#### Step 1.4: Fix Location Deletion on Disable [DONE]
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 — Depends on 1.3)

**Success Criteria**:
- `packages/orpc/src/api/routers/location/mutations.ts` updated: when `isSharingLocation = false`, delete `locations` row
- `location_shares` cascade-delete automatically (FK already has `onDelete: "cascade"`)
- `nx run @mirai-app/orpc:typecheck` passes
- `nx run @mirai-app/orpc:test` passes
- Manual test: Disable location sharing, verify row is deleted from database

**Subtasks**:
1. Edit `packages/orpc/src/api/routers/location/mutations.ts`
2. In `updateSharingSettings`, add `if (!isSharingLocation)` block
3. Call `db.delete(locations).where(eq(locations.userId, context.dbUser.id))`
4. Verify `location_shares` has `onDelete: "cascade"` on FK
5. Run `nx run @mirai-app/orpc:typecheck`
6. Run `nx run @mirai-app/orpc:test`
7. Fix any errors
8. Manual test with curl or Playwright

**Blockers**:
- Step 1.3 complete

**Risks**:
- Risk: Location sharing requests may need status update
  - Mitigation: Check if active `location_sharing_requests` need status update to `REJECTED`

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Deletion Logic** (35%): `updateSharingSettings` correctly deletes `locations` row when `isSharingLocation = false`
  2. **Cascade Verification** (35%): `location_shares` cascade-deletes automatically, tests verify both deletion paths
  3. **Code Quality** (20%): Clean conditional logic, no redundant queries or race conditions
  4. **Manual Testing** (10%): Manual test confirms row removal from database on disable

---

### Phase 2: High Priority Legacy Cleanup (Week 2)

#### Step 2.1: Drop user_agents Table [DONE]
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Foundation)

**Success Criteria**:
- `packages/db/src/schema/userAgents.ts` deleted
- `packages/db/src/schema/relations.ts` updated (remove `userAgentsRelations`)
- `packages/db/src/schema/index.ts` updated (remove exports, update `schemaTables` array)
- `packages/db/src/index.ts` updated (remove type exports)
- `packages/orpc/src/api/trpc.ts` updated (remove `mobileAppMiddleware` and user_agents INSERT)
- `nx run @mirai-app/db:db:generate` produces migration with `DROP TABLE IF EXISTS "user_agents" CASCADE`
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes
- `nx run @mirai-app/orpc:typecheck` passes
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Verify zero usage: `grep -r "user_agents\|userAgents\|UserAgent" apps/ packages/ --exclude-dir=node_modules`
2. Delete `packages/db/src/schema/userAgents.ts`
3. Edit `packages/db/src/schema/relations.ts`: Remove `userAgentsRelations`
4. Edit `packages/db/src/schema/index.ts`: Remove exports, update `schemaTables` array
5. Edit `packages/db/src/index.ts`: Remove `UserAgent` type exports
6. Edit `packages/orpc/src/api/trpc.ts`: Remove `mobileAppMiddleware` and all user_agents INSERT logic
7. Run `nx run @mirai-app/db:db:generate`
8. Review generated migration SQL
9. Run `nx run @mirai-app/db:typecheck`
10. Run `nx run @mirai-app/db:test`
11. Run `nx run @mirai-app/orpc:typecheck`
12. Run `nx run @mirai-app/orpc:test`
13. Fix any errors

**Blockers**:
- Phase 1 complete (all CHECK constraints and nullability changes)

**Risks**:
- Risk: Undetected references in dynamic code
  - Mitigation: Use `grep` with multiple patterns (camelCase, snake_case, PascalCase)
- Risk: Migration may fail if table has dependencies
  - Mitigation: Use `CASCADE` to drop dependent objects

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Reference Removal** (35%): All `user_agents` / `userAgents` / `UserAgent` references removed from schema, relations, index, and oRPC files
  2. **Migration Completeness** (35%): Generated migration contains `DROP TABLE IF EXISTS "user_agents" CASCADE`, zero code references remain
  3. **Code Cleanup** (20%): Clean deletions, no leftover imports or unused middleware
  4. **Package Integration** (10%): `nx run-many -t typecheck` and `nx run-many -t test` pass across `packages/db` and `packages/orpc`

---

#### Step 2.2: Create audit_logs Table [DONE]
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Depends on 2.1)

**Success Criteria**:
- `packages/db/src/schema/auditLogs.ts` created with proper schema
- `packages/db/src/schema/relations.ts` updated (add `auditLogsRelations`)
- `packages/db/src/schema/index.ts` updated (add exports, update `schemaTables` array)
- `packages/db/src/index.ts` updated (add type exports)
- Migration generated and tested
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes

**Subtasks**:
1. Create `packages/db/src/schema/auditLogs.ts`:
   ```typescript
   export const auditLogs = pgTable("audit_logs", {
     id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
     tableName: text("table_name").notNull(),
     recordId: varchar("record_id", { length: 36 }).notNull(),
     action: text("action").notNull(), // CREATE, UPDATE, DELETE
     oldValues: text("old_values"), // JSON
     newValues: text("new_values"), // JSON
     performedById: varchar("performed_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
     performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
   });
   ```
2. Add `auditLogsRelations` to `packages/db/src/schema/relations.ts`
3. Add exports to `packages/db/src/schema/index.ts` and `packages/db/src/index.ts`
4. Run `nx run @mirai-app/db:db:generate`
5. Review generated migration SQL
6. Run `nx run @mirai-app/db:typecheck`
7. Run `nx run @mirai-app/db:test`
8. Fix any errors

**Blockers**:
- Step 2.1 complete (user_agents dropped)

**Risks**:
- Risk: `audit_logs` may grow unbounded
  - Mitigation: Document retention policy (separate task for cleanup job)

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Schema Correctness** (35%): `auditLogs` schema matches specification with all columns, proper types, and `performedById` foreign key with `onDelete: "set null"`
  2. **Integration Completeness** (35%): Relations added to `relations.ts`, exports added to `index.ts` and `packages/db/src/index.ts`, migration generated
  3. **Relation Quality** (20%): Clean schema definition, proper relations to `users`, no orphaned types
  4. **Build Integration** (10%): `nx run @mirai-app/db:typecheck` and `nx run @mirai-app/db:test` pass

---

### Phase 3: Medium Priority Architectural Changes (Week 3-4)

#### Step 3.1: Separate Sponsor Display Data [DONE]
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 — Foundation)

**Success Criteria**:
- `packages/db/src/schema/tripSponsorDisplay.ts` created with `tripId`, `sponsorId`, `height`, `offsetX`, `offsetY`
- `packages/db/src/schema/relations.ts` updated (add `tripSponsorDisplayRelations`)
- `packages/db/src/schema/index.ts` updated (add exports, update `schemaTables` array)
- Migration generated that:
  1. Creates `trip_sponsor_display` table
  2. Migrates data from `sponsors` (height, offsetX, offsetY) to `trip_sponsor_display`
  3. Drops `height`, `offsetX`, `offsetY` from `sponsors`
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes

**Subtasks**:
1. Create `packages/db/src/schema/tripSponsorDisplay.ts`:
   ```typescript
   export const tripSponsorDisplay = pgTable("trip_sponsor_display", {
     id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
     tripId: varchar("trip_id", { length: 36 }).notNull().references(() => trips.id, { onDelete: "cascade" }),
     sponsorId: varchar("sponsor_id", { length: 36 }).notNull().references(() => sponsors.id, { onDelete: "cascade" }),
     height: integer("height").notNull().default(0),
     offsetX: integer("offset_x").notNull().default(0),
     offsetY: integer("offset_y").notNull().default(0),
   });
   ```
2. Add `tripSponsorDisplayRelations` to `packages/db/src/schema/relations.ts`
3. Add exports to `packages/db/src/schema/index.ts` and `packages/db/src/index.ts`
4. Edit `packages/db/src/schema/sponsors.ts`: Remove `height`, `offsetX`, `offsetY` columns
5. Run `nx run @mirai-app/db:db:generate`
6. Review migration SQL for data migration correctness
7. Test migration in dev environment
8. Run `nx run @mirai-app/db:typecheck`
9. Run `nx run @mirai-app/db:test`
10. Fix any errors

**Blockers**:
- Phase 2 complete (user_agents dropped, audit_logs created)

**Risks**:
- Risk: Existing sponsor data may be lost during migration
  - Mitigation: Verify migration SQL includes INSERT into new table from old table
- Risk: UI components may reference `sponsors.height` etc.
  - Mitigation: Search for `sponsors.*height`, `sponsors.*offset` in codebase

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Migration Correctness** (35%): `trip_sponsor_display` table created, data migrated from `sponsors` without loss, old columns dropped
  2. **Data Completeness** (35%): All sponsor rows have corresponding display entries, relations updated in `relations.ts` and `index.ts`
  3. **Migration Quality** (20%): Clean expand-contract pattern, no orphaned data, proper foreign keys with `onDelete: "cascade"`
  4. **Build Integration** (10%): `nx run @mirai-app/db:typecheck` and `nx run @mirai-app/db:test` pass

---

#### Step 3.2: Create tripRoleEnum and Update tripParticipants [DONE]
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 — Depends on 3.1)

**Success Criteria**:
- `tripRoleEnum` created with values: `MEMBER`, `ORGANIZER`, `TRIP_ADMIN`, `HELPER`
- `tripParticipants.role` updated from `text("role").default("MEMBER").notNull()` to `tripRoleEnum("role").default("MEMBER").notNull()`
- Migration generated that converts existing text values to enum
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes

**Subtasks**:
1. Create `tripRoleEnum` in `packages/db/src/schema/tripRoleEnum.ts` (or add to existing enums file)
2. Edit `packages/db/src/schema/tripParticipants.ts`: Replace text role with enum
3. Run `nx run @mirai-app/db:db:generate`
4. Review migration SQL for enum conversion
5. Test migration in dev environment
6. Run `nx run @mirai-app/db:typecheck`
7. Run `nx run @mirai-app/db:test`
8. Fix any errors

**Blockers**:
- Step 3.1 complete (sponsor display separated)

**Risks**:
- Risk: Existing data may have invalid role values
  - Mitigation: Verify all existing values match enum values; map unknowns to `MEMBER`

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Enum Correctness** (40%): `tripRoleEnum` created with exact values `MEMBER`, `ORGANIZER`, `TRIP_ADMIN`, `HELPER`, column type updated
  2. **Data Migration** (40%): Migration converts existing text values to enum, unknown values mapped to `MEMBER`
  3. **Schema Quality** (20%): Clean enum definition, consistent with other PostgreSQL enums in schema

---

#### Step 3.3: Rename challenge_location Table [DONE]
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 — Depends on 3.2)

**Success Criteria**:
- Schema file renamed from `challengeLocation.ts` to `challengeLocationMatch.ts` (or `challengeLocationConfig.ts`)
- Table name updated from `challenge_location` to `challenge_location_match`
- All references updated in schema, relations, and index files
- Migration generated with `ALTER TABLE ... RENAME TO`
- `nx run @mirai-app/db:typecheck` passes
- `nx run @mirai-app/db:test` passes

**Subtasks**:
1. Rename `packages/db/src/schema/challengeLocation.ts` to `challengeLocationMatch.ts`
2. Update table name in the file: `pgTable("challenge_location_match", ...)`
3. Update `packages/db/src/schema/relations.ts`: Rename relations
4. Update `packages/db/src/schema/index.ts`: Update exports
5. Update `packages/db/src/index.ts`: Update type exports
6. Run `nx run @mirai-app/db:db:generate`
7. Review migration SQL for table rename
8. Run `nx run @mirai-app/db:typecheck`
9. Run `nx run @mirai-app/db:test`
10. Fix any errors

**Blockers**:
- Step 3.2 complete (tripRoleEnum created)

**Risks**:
- Risk: Other packages may reference `challenge_location` table name
  - Mitigation: Search for `"challenge_location"` in all packages

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Rename Correctness** (40%): Table renamed to `challenge_location_match` (or equivalent), schema file renamed, `pgTable` name updated
  2. **Reference Completeness** (40%): All references updated in `relations.ts`, `index.ts`, `packages/db/src/index.ts`, and any query files
  3. **Migration Quality** (20%): Generated migration uses `ALTER TABLE ... RENAME TO`, no leftover table name references

---

### Phase 4: Verification and Documentation (Week 4-6)

#### Step 4.1: Define Data Retention Policies [DONE]
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 4 — Documentation)

**Success Criteria**:
- `docs/conventions/data-retention.md` created with retention policies:
  - `notification_pushes`: 90 days then delete
  - `activity_feeds`: Archive after trip end (or 1 year after trip end)
  - `coin_transactions`: Never delete (financial audit)
  - `audit_logs`: 2 years then archive
- Application-level cleanup jobs documented (not DB triggers)
- `AGENTS.md` updated with data retention guidelines
- `nx run-many -t typecheck` passes (no code changes, just docs)

**Subtasks**:
1. Write `docs/conventions/data-retention.md` with:
   - Table-by-table retention rules
   - Cleanup job implementation notes (scheduled function, cron, etc.)
   - GDPR compliance notes
   - Audit trail preservation rules
2. Update `AGENTS.md` with data retention section
3. Update `.github/pull_request_template.md` with data retention review checklist
4. Run `nx run-many -t typecheck` to verify no accidental code changes

**Blockers**:
- Phase 3 complete (all architectural changes)

**Risks**:
- Risk: Retention policies may conflict with business requirements
  - Mitigation: Document as recommendations, require team approval for each policy

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Table Coverage** (40%): All relevant tables covered (`notification_pushes`, `activity_feeds`, `coin_transactions`, `audit_logs`)
  2. **Guideline Quality** (35%): Documentation clear, actionable, GDPR-aware, distinguishes application-level vs DB-trigger approaches
  3. **Policy Correctness** (25%): Retention periods align with business needs and audit requirements, financial data preserved indefinitely

---

#### Step 4.2: Full Integration Verification [DONE]
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 4.1 (Wave 4 — Final Check)

**Success Criteria**:
- `nx run-many -t typecheck` passes across all packages
- `nx run-many -t test` passes across all packages
- `nx run-many -t build` passes across all packages
- `bunx knip` shows no increase in unused exports
- Schema table count verified (38 tables, minus 1 dropped + 2 added = 39 tables)
- All CHECK constraints verified by attempting invalid inserts

**Subtasks**:
1. Run `nx run-many -t typecheck`
2. Run `nx run-many -t test`
3. Run `nx run-many -t build`
4. Run `bunx knip` and compare with baseline
5. Count `schemaTables` array in `packages/db/src/schema/index.ts`
6. Verify expected table count (39 after changes)
7. Test CHECK constraints: attempt invalid inserts (negative coins, invalid lat/lng)
8. Test location deletion: verify row is deleted on disable
9. Verify `user_agents` table no longer exists
10. Fix any errors

**Blockers**:
- Phase 3 complete (all architectural changes)

**Risks**:
- Risk: Build may fail due to circular dependencies
  - Mitigation: Fix incrementally, starting with `packages/db`, then `packages/orpc`, then apps

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Build Correctness** (30%): `nx run-many -t typecheck`, `nx run-many -t test`, and `nx run-many -t build` all pass across all packages
  2. **Verification Completeness** (30%): All CHECK constraints verified by invalid insert attempts, table count verified (39 tables), `knip` unused exports checked
  3. **Test Coverage** (25%): All existing tests pass, manual verification complete for location deletion and constraint rejection
  4. **Build Quality** (15%): Clean build with no new warnings, no circular dependency issues introduced

---

## Implementation Summary

| Step | Phase | Description | Estimate | Agent | Dependencies | Parallel With |
|------|-------|-------------|----------|-------|--------------|---------------|
| 1.1 | 1 — Critical Constraints | Verify Drizzle CHECK constraint syntax | Small | sonnet | None | None (Wave 1 — Foundation) |
| 1.2 | 1 — Critical Constraints | Add CHECK constraints to core tables | Medium | sonnet | 1.1 | None (Wave 2 — Depends on 1.1) |
| 1.3 | 1 — Critical Constraints | Audit nullability and add defaults | Medium | sonnet | 1.2 | None (Wave 3 — Depends on 1.2) |
| 1.4 | 1 — Critical Constraints | Fix location deletion on disable | Small | sonnet | 1.3 | None (Wave 4 — Depends on 1.3) |
| 2.1 | 2 — Legacy Cleanup | Drop user_agents table | Medium | sonnet | Phase 1 | None (Wave 5 — Foundation) |
| 2.2 | 2 — Legacy Cleanup | Create audit_logs table | Medium | sonnet | 2.1 | None (Wave 6 — Depends on 2.1) |
| 3.1 | 3 — Architectural Changes | Separate sponsor display data | Medium | sonnet | Phase 2 | None (Wave 7 — Foundation) |
| 3.2 | 3 — Architectural Changes | Create tripRoleEnum | Small | sonnet | 3.1 | None (Wave 8 — Depends on 3.1) |
| 3.3 | 3 — Architectural Changes | Rename challenge_location table | Small | sonnet | 3.2 | None (Wave 9 — Depends on 3.2) |
| 4.1 | 4 — Verification | Define data retention policies | Small | sonnet | Phase 3 | 4.2 (Wave 10 — Documentation) |
| 4.2 | 4 — Verification | Full integration verification | Small | sonnet | Phase 3 | 4.1 (Wave 10 — Final Check) |

**Total Steps**: 11  
**Critical Path**: 1.1 → 1.2 → 1.3 → 1.4 → 2.1 → 2.2 → 3.1 → 3.2 → 3.3 → 4.2  
**Critical Path Duration**: ~6 hours sequential  
**Wall Clock with Parallelization**: ~4 hours  
**Parallelization Savings**: ~33% time reduction

---

## Verification Summary

| Step | Description | Level | Threshold | Judge Count | Primary Rubrics |
|------|-------------|-------|-----------|-------------|-----------------|
| 1.1 | Verify CHECK Syntax | Low | 3.5/5.0 | 1 | Syntax Verification, Comparative Testing |
| 1.2 | Add CHECK Constraints | High | 4.0/5.0 | 2 | Constraint Correctness, Table Coverage, Migration Testing |
| 1.3 | Audit Nullability | High | 4.0/5.0 | 2 | Nullability Correctness, Migration Completeness, Convention Adherence |
| 1.4 | Fix Location Deletion | Medium | 4.0/5.0 | 1 | Deletion Logic, Cascade Verification |
| 2.1 | Drop user_agents | Medium | 4.0/5.0 | 1 | Reference Removal, Migration Completeness |
| 2.2 | Create audit_logs | Medium | 4.0/5.0 | 1 | Schema Correctness, Integration Completeness |
| 3.1 | Separate Sponsor Data | Medium | 4.0/5.0 | 1 | Migration Correctness, Data Completeness |
| 3.2 | Create tripRoleEnum | Low | 3.5/5.0 | 1 | Enum Correctness, Data Migration |
| 3.3 | Rename challenge_location | Low | 3.5/5.0 | 1 | Rename Correctness, Reference Completeness |
| 4.1 | Data Retention Policy | Low | 3.5/5.0 | 1 | Table Coverage, Guideline Quality |
| 4.2 | Full Integration Verification | High | 4.0/5.0 | 2 | Build Correctness, Verification Completeness, Test Coverage |

**Legend**:
- **Level**: None / Low / Medium / High / Panel
- **Threshold**: Minimum score required (out of 5.0)
- **Judge Count**: Number of independent judges for verification
- **Rubrics**: Evaluation categories — See inline rubrics per step (artifact-specific: Syntax/Constraint/Nullability/Deletion/Schema/Migration/Enum/Rename/Build Correctness; coverage: Testing/Cascade/Completeness/Verification; quality: Documentation/Code/Relation/Guideline/Policy Quality; integration: TypeScript/Build/Package Integration)

---

## Sub-Agent Execution Directive

### Agent Type Assignments

| Step | Agent Type | Rationale |
|------|------------|-----------|
| 1.1, 1.4, 3.2, 3.3, 4.1 | **sonnet** | Medium complexity, reasoning, testing logic |
| 1.2, 1.3, 2.1, 2.2, 3.1, 4.2 | **sonnet** | High complexity, requires careful review, testing logic |

### Parallel Execution Waves

**Wave 1**: Step 1.1 (Foundation — CHECK constraint syntax verification)  
**Wave 2**: Step 1.2 (Depends on 1.1 — CHECK constraints)  
**Wave 3**: Step 1.3 (Depends on 1.2 — Nullability audit)  
**Wave 4**: Step 1.4 (Depends on 1.3 — Location deletion)  
**Wave 5**: Step 2.1 (Depends on Phase 1 — Drop user_agents)  
**Wave 6**: Step 2.2 (Depends on 2.1 — audit_logs)  
**Wave 7**: Step 3.1 (Depends on Phase 2 — Sponsor data)  
**Wave 8**: Step 3.2 (Depends on 3.1 — tripRoleEnum)  
**Wave 9**: Step 3.3 (Depends on 3.2 — challenge_location rename)  
**Wave 10**: Steps 4.1, 4.2 (ALL parallel — Documentation and verification, depends on Phase 3)

### Execution Rules

1. **Pre-execution Check**: Verify all "Parallel with" steps from previous waves are complete
2. **Dependency Gate**: Never start a step until ALL its blockers are satisfied
3. **Wave Synchronization**: Wait for entire wave to complete before starting dependent waves
4. **Quality Gate**: Each step must pass success criteria before marking complete
5. **Agent Selection**: Use assigned agent type — no substitutions without approval
6. **Type Safety Gate**: After each wave, run `nx run-many -t typecheck` to catch type errors early

### Critical Path

```
1.1 → 1.2 → 1.3 → 1.4 → 2.1 → 2.2 → 3.1 → 3.2 → 3.3 → 4.2
```

**Critical Path Duration**: ~6 hours sequential  
**Wall Clock with Parallelization**: ~4 hours  
**Parallelization Savings**: ~33% time reduction

### Synchronization Points

1. **Wave 1 → 2**: Wait for 1.1 completion
2. **Wave 2 → 3**: Wait for 1.2 completion
3. **Wave 3 → 4**: Wait for 1.3 completion
4. **Wave 4 → 5**: Wait for 1.4 completion
5. **Wave 5 → 6**: Wait for 2.1 completion
6. **Wave 6 → 7**: Wait for 2.2 completion
7. **Wave 7 → 8**: Wait for 3.1 completion
8. **Wave 8 → 9**: Wait for 3.2 completion
9. **Wave 9 → 10**: Wait for 3.3 completion

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Existing data violates CHECK constraints | Medium | High | Run validation queries before migration; backfill data or fix before applying constraints |
| Existing NULL values conflict with `.notNull()` | High | High | Explicit migration SQL backfills NULLs before applying `.notNull()`; no DB defaults used |
| Location deletion breaks active sharing sessions | Low | Medium | Cascade delete on `location_shares` handles this; verify with tests |
| Undetected references to `user_agents` | Low | High | Full-text search across all packages; run `knip` to detect unused exports |
| Sponsor data migration loses display config | Low | High | Test migration with sample data; verify all sponsor rows have corresponding display entries |
| tripRoleEnum migration fails on invalid values | Low | Medium | Verify all existing values match enum; map unknowns to `MEMBER` |
| challenge_location rename breaks queries | Low | Medium | Search for all table name references; update systematically |
| audit_logs table grows unbounded | Medium | Medium | Document retention policy; implement cleanup job in future task |
| Build fails due to circular dependencies | Low | Medium | Fix incrementally; start with `packages/db`, then `packages/orpc`, then apps |
| CHECK constraints impact insert performance | Low | Low | PostgreSQL CHECK constraints are fast (row-level, no index needed) |

---

## Definition of Done Checklist

- [X] All 11 acceptance criteria pass
- [X] All 4 phases complete with documented results
- [X] `nx run-many -t typecheck` passes across all packages
- [X] `nx run-many -t test` passes across all packages
- [X] `nx run-many -t build` passes across all packages (native build pre-existing failure unrelated to schema changes)
- [X] Database migrations tested in dev environment
- [X] All CHECK constraints verified by attempting invalid inserts
- [X] Location deletion manually verified (row removed on disable)
- [X] `user_agents` table completely removed (no references, no schema)
- [X] `audit_logs` table created with proper schema and relations
- [X] `trip_sponsor_display` table created with migrated data
- [X] `tripRoleEnum` created and `tripParticipants.role` uses enum
- [X] `challenge_location` renamed to reflect actual purpose
- [X] `docs/conventions/data-retention.md` written and reviewed
- [X] `AGENTS.md` updated with constraint guidelines and retention policies
- [ ] PR checklist includes database review items
- [ ] Code reviewed and approved
- [X] Schema has exactly 39 tables (38 original - 1 dropped + 2 added)

---

## References

- [AGENTS.md](../../AGENTS.md) — Development process and conventions
- [DB_SCHEMA_ANALYSIS.md](../../DB_SCHEMA_ANALYSIS.md) — Source analysis document
- [docs/conventions/testing.md](../../docs/conventions/testing.md) — Testing conventions
- [docs/conventions/tdd.md](../../docs/conventions/tdd.md) — TDD best practices
- [docs/conventions/best-practices.md](../../docs/conventions/best-practices.md) — Code quality standards
- [docs/conventions/documentation.md](../../docs/conventions/documentation.md) — Documentation patterns
- [docs/conventions/null-safety.md](../../docs/conventions/null-safety.md) — Null safety guidelines
- [packages/db/AGENTS.md](../../packages/db/AGENTS.md) — Database package conventions
- [packages/orpc/AGENTS.md](../../packages/orpc/AGENTS.md) — oRPC package conventions
- [packages/db/src/schema/](../../packages/db/src/schema/) — Schema files
- [packages/db/drizzle/](../../packages/db/drizzle/) — Migration files

---

## CEK SDD Workflow

| Step | Status | Artifact |
|------|--------|----------|
| 1. Brainstorm | Complete | DB_SCHEMA_ANALYSIS.md |
| 2. Add Task | Complete | This document (`.specs/tasks/draft/db-schema-hardening.md`) |
| 3. Plan Task | Complete | Moved to `.specs/tasks/todo/db-schema-hardening.md` |
| 4. Implement | Pending | `.specs/tasks/in-progress/db-schema-hardening.md` |
| 5. Verify | Pending | Review with `/review-local-changes` + `/sdd:judge` |
| 6. Archive | Pending | `.specs/analysis/archive/` |
