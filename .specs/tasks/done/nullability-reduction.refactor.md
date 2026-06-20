---

title: Nullability Reduction Refactor — Implement "Nulls at the Boundary" with Strict DB Schema (No Defaults for User Data)
---

## Initial User Prompt

Reduce null/undefined patterns across the MIRAI monorepo by implementing the "nulls at the boundary" rule. Target ~120+ nullable patterns across 40+ files, achieving 30-40% reduction in defensive ??/?. usage. This plan serves as the analysis and execution roadmap.

## Description

This task executes the phased nullability reduction plan for the MIRAI monorepo. The codebase has **1,087+ nullable/undefined patterns** across **188+ files**, creating a defensive-coding sprawl that obscures actual business logic. The analysis identified **19 database columns** that can become non-nullable with defaults, **7 Zod triple-state anti-patterns** to eliminate, and **2 polymorphic table splits** (`tripResources`, `challenges`) that would eliminate 13 nullable columns entirely.

The solution follows a **"nulls at the boundary"** rule: allow null/undefined from external sources (database, API, storage), but normalize to strict defaults before data enters business logic, components, and stores. The implementation is structured as 4 phases over 4 weeks, from quick wins (Zod fixes, `useState` defaults) to architectural changes (table splits).

**Scope**:
- **Included**: Database schema hardening (19 columns), Zod schema normalization, API mapper layer, discriminated unions for activity feed, shared type normalization, native `useState` fixes, tripResources/challenge table splits, documentation and policy
- **Excluded**: Integration/E2E test coverage, changes to external API contracts (Supabase), migration rollback procedures beyond basic testing

**User Scenarios**:
1. **Primary Flow**: Developer writes a new feature and uses `useState<string>("")` instead of `useState<string | null>(null)` — no null checks needed, types are strict
2. **Alternative Flow**: Backend API returns a challenge with `description: ""` instead of `null` — frontend component renders without `?? ""
3. **Error Handling**: Database migration fails on existing data → rollback plan is documented, data is backed up, migration is tested in dev environment

## Architecture Overview

### Solution Strategy

This implementation uses a **layered boundary normalization** strategy: each layer (database, API input, API output, client hooks, components) has strict rules about nullability:

| Layer | Null Allowed | Normalization Strategy |
|-------|-------------|----------------------|
| **Database (Drizzle)** | Limited | `.notNull()` without `.default()` for user data; `.default()` only for system fields |
| **API Input (Zod)** | Limited | `.default(...)` for optional fields, `.refine()` for conditional validation |
| **API Output (oRPC)** | **No** | Mapper functions normalize all nulls to defaults before returning |
| **Client Hooks** | **No** | Domain-specific hooks return non-nullable defaults (`[]`, `""`, `0`) |
| **Components/Stores** | **No** | Strict types, discriminated unions for variant state |

### Key Architectural Decisions

1. **Nulls at the Boundary**: External data (database, storage, third-party APIs) may have nulls. All internal layers (routers, hooks, components) receive non-nullable data. This is enforced by type system, not runtime checks.

2. **Database First — No Defaults for User Data**: Start with schema changes, but use `.notNull()` **without** `.default()` for user-data columns. System fields (booleans, timestamps, counters) keep `.default()`. A non-nullable `description` in the DB means the router can return a `string` instead of `string | null`, but the application must provide the value at insert time — the DB must not silently mask missing data.

3. **Mapper Layer**: Every oRPC router that returns Drizzle query results gets a `mappers.ts` file that normalizes nulls to defaults. This is the critical boundary layer.

4. **Discriminated Unions for Polymorphic Data**: `ActivityWithRelations` currently has 15 `| null` fields. Replace with a union by `activityType` so each variant has only its relevant fields.

5. **Split Polymorphic Tables**: `tripResources` (7 nullable columns) and `challenges` (6 sparse columns) are split into type-specific tables. This eliminates nullability at the source.

6. **No `.default()` for User Data**: Database defaults must never mask missing user-provided data. `.default()` is acceptable only for system fields: timestamps (`createdAt`), boolean flags (`isActive`), status enums (`status`), counters (`coins`, `voteCount`), and array fields (`image_ids`). All user-content fields (`description`, `name`, `title`, `reason`) become `.notNull()` without `.default()` — the application layer must provide the value.

7. **No Runtime Breaking Changes**: All changes are additive or type-safe. Existing `?? ""` fallbacks in components will still work (they just become unnecessary).

### Boundary Layer Matrix

```
┌─────────────────────────────────────────────────────────┐
│  LAYER              │  NULL ALLOWED  │  NORMALIZATION   │
├─────────────────────────────────────────────────────────┤
│  Database (Drizzle) │  Limited       │  .notNull() for  │
│                     │                │  user data;      │
│                     │                │  .default() only │
│                     │                │  for system      │
│                     │                │  fields          │
│  API Input (Zod)    │  Limited       │  .default() for   │
│                     │                │  optional;       │
│                     │                │  .refine() for   │
│                     │                │  conditional     │
│  API Output (oRPC)    │  No            │  Mapper functions│
│                     │                │  normalize nulls │
│                     │                │  to defaults     │
│  Client Hooks       │  No            │  Hook wrappers   │
│                     │                │  return strict   │
│                     │                │  defaults        │
│  Components/Stores  │  No            │  Strict types,   │
│                     │                │  discriminated   │
│                     │                │  unions          │
└─────────────────────────────────────────────────────────┘
```

### Expected File Changes

**Create (20+ files)**:
| File | Purpose |
|------|---------|
| `packages/orpc/src/api/routers/challenge/utils.ts` | Extend with mapper functions to normalize challenge nulls to defaults |
| `packages/orpc/src/api/routers/group/utils.ts` | Extend with mapper functions to normalize group nulls to defaults |
| `packages/orpc/src/api/routers/activityFeed/utils.ts` | Extend with mapper functions to normalize activity nulls to defaults |
| `packages/orpc/src/api/routers/trip/utils.ts` | Extend with mapper functions to normalize trip nulls to defaults |
| `packages/orpc/src/api/routers/activityFeed/types.ts` | Discriminated union for ActivityWithRelations |
| `packages/db/src/schema/tripResourceLinks.ts` | New table for LINK resources |
| `packages/db/src/schema/tripResourceFiles.ts` | New table for FILE resources |
| `packages/db/src/schema/tripResourceTexts.ts` | New table for TEXT resources |
| `packages/db/src/schema/tripResourceIcons.ts` | New table for ICON resources |
| `packages/db/src/schema/challengeRecurrence.ts` | New table for recurring challenge fields |
| `packages/db/src/schema/challengeLocation.ts` | New table for location-based challenge fields |
| `docs/conventions/null-safety.md` | Null-safety conventions and policy |
| `packages/db/src/migrations/...` | Generated migrations for schema changes |

**Modify (40+ files)**:
| File | Changes |
|------|---------|
| `packages/db/src/schema/challenges.ts` | `description` → `.notNull()` (no `.default()`); point fields → `.notNull().default(0)` |
| `packages/db/src/schema/trips.ts` | `description` → `.notNull()` (no `.default()`) |
| `packages/db/src/schema/groups.ts` | `description` → `.notNull()` (no `.default()`) |
| `packages/db/src/schema/activities.ts` | `description`, `imageUrl` → `.notNull()` (no `.default()`) |
| `packages/db/src/schema/rewards.ts` (coinTransactions table) | `reason` → `.notNull()` (no `.default()`) |
| `packages/db/src/schema/challenges.ts` (submissionReports table) | `details` → `.notNull()` (no `.default()`) |
| `packages/db/src/schema/locations.ts` | `accuracy` → `.notNull().default(0)`, `latitude`/`longitude` → `.notNull()` |
| `packages/db/src/schema/notifications.ts` | `notificationTitle`, `notificationBody` → `.notNull()` (no `.default()`) |
| `packages/db/src/schema/sponsors.ts` | `height`, `offsetX`, `offsetY` → `.notNull().default(0)` |
| `packages/orpc/src/utils/location-validation.ts` | Remove `.nullable()` from 7 `.optional().nullable()` chains |
| `packages/orpc/src/api/routers/activityFeed/index.ts` | Remove `.nullable()` from `description`, use discriminated union |
| `packages/orpc/src/api/routers/reward/index.ts` | Remove `.nullable()` from `image` |
| `packages/common/src/users/participantResult.ts` | `PublicUser` fields from `\| null` to `string` with defaults |
| `packages/common/src/stores/authStore.ts` | `AuthUser` fields from `\| null` to `string` with defaults |
| `apps/native/src/hooks/trips/useTrips.ts` | `useState<TripListItem[]>([])` instead of `null` |
| `apps/native/src/hooks/trips/useTripDetails.ts` | `useState<string>("")` instead of `string \| null` |
| `apps/native/src/app/auth/login.tsx` | `useState<string>("")` for error states |
| `apps/native/src/stores/map/mapStore.ts` | `selectedUserId: ""`, `followMode: "none"` |
| `apps/native/src/hooks/groups/useGroupDetails.ts` | Return `tripId: string` ("" if not available) |
| `apps/native/src/hooks/trips/useTripResources.ts` | Return `resources: TripResource[]` ([] if not available) |
| `apps/native/src/components/...` | Remove `?? []` / `?? ""` fallbacks |
| `AGENTS.md` | Add null-safety guidelines |
| `.github/pull_request_template.md` | Add nullability review checklist |

---

## Acceptance Criteria

### Functional Requirements

- [ ] **Database Schema Hardening — Text Fields (User Data)**: 8 text columns become `.notNull()` **without** `.default()` (challenges.description, trips.description, groups.description, activityFeeds.description, activityFeeds.imageUrl, coinTransactions.reason, submissionReports.details, notificationSchedules.notificationTitle, notificationSchedules.notificationBody)
  - Given: Schema files are updated with `.notNull()` (no `.default()`)
  - When: Migration is generated and applied to dev database
  - Then: All existing rows have valid data (backfilled via migration script or verified), no nullable text columns remain, no DB defaults mask missing user data

- [ ] **Database Schema Hardening — Numeric Fields (System/Score)**: 7 numeric columns become `.notNull().default(0)` (challenges.firstPlacePoints, challenges.secondPlacePoints, challenges.thirdPlacePoints, locations.accuracy, sponsors.height, sponsors.offsetX, sponsors.offsetY)
  - Given: Schema files are updated with `.notNull().default(0)`
  - When: Migration is generated and applied to dev database
  - Then: All existing rows have defaults applied, no nullable numeric columns remain
  - **Note**: These are system/computed fields where `0` is semantically correct; user-data fields never get `.default()`

- [ ] **Database Schema Hardening — Coordinates**: locations.latitude and locations.longitude become `.notNull()`
  - Given: Schema file is updated with `.notNull()`
  - When: Migration is generated and applied to dev database
  - Then: All existing rows have valid coordinates, no null lat/lng values

- [ ] **Zod Triple-State Elimination**: No `.optional().nullable()` or `.nullable().optional()` chains exist in codebase (location-validation.ts, activityFeed, reward)
  - Given: Search for `.optional().nullable()` and `.nullable().optional()` across codebase
  - When: All occurrences are removed
  - Then: Zero matches found in `packages/orpc`

- [ ] **Shared Type Normalization**: `PublicUser` and `AuthUser` interfaces have no `| null` string fields, all consumers updated
  - Given: `packages/common/src/users/participantResult.ts` and `authStore.ts` are updated
  - When: `nx run-many -t typecheck` runs
  - Then: No TypeScript errors in `packages/common`, `packages/orpc`, or `apps/native`

- [ ] **Native useState Defaults**: All identified `useState<X | null>(null)` patterns use proper defaults (`[]`, `""`, `0`, discriminated unions)
  - Given: `apps/native` hooks and components are updated
  - When: `nx run @mirai-app/native:typecheck` runs
  - Then: No TypeScript errors, no new `useState<X | null>(null)` without justification

- [ ] **API Mapper Layer**: Router-level mappers exist for challenge, group, activityFeed, trip — all return non-nullable data
  - Given: `packages/orpc/src/api/routers/*/mappers.ts` files exist
  - When: Queries use mappers before returning
  - Then: Router outputs have no `| null` on string/number fields

- [ ] **Activity Feed Discriminated Union**: `ActivityWithRelations` replaced with union by `activityType`, all consumers updated
  - Given: `packages/orpc/src/api/routers/activityFeed/types.ts` is updated
  - When: `nx run-many -t typecheck` runs
  - Then: No TypeScript errors in activity feed router or consuming components

- [ ] **Hook Boundary Normalization**: Domain hooks return non-nullable defaults (`tripId: ""`, `resources: []`)
  - Given: `apps/native/src/hooks/groups/useGroupDetails.ts` and `useTripResources.ts` are updated
  - When: Consuming components remove `??` fallbacks
  - Then: Components compile without `??` on hook-returned data

- [ ] **tripResources Table Split**: 4 type-specific tables created (links, files, texts, icons), migration converts data, queries updated
  - Given: New tables exist in `packages/db/src/schema/`
  - When: Migration is applied and API queries are updated
  - Then: No nullable columns in resource tables, all existing data migrated

- [ ] **challengeRecurrence/challengeLocation Tables**: Extracted from `challenges`, migration converts data, queries updated
  - Given: New tables exist in `packages/db/src/schema/`
  - When: Migration is applied and API queries are updated
  - Then: No `dailyStartTime`, `dailyEndTime`, `targetLatitude`, `targetLongitude` in `challenges` table

- [ ] **Documentation and Policy**: `docs/conventions/null-safety.md` exists, `AGENTS.md` updated, PR checklist includes nullability review
  - Given: Documentation files are created
  - When: Team reviews PR template
  - Then: Null-safety guidelines are clear and actionable

### Non-Functional Requirements

- [ ] **Performance**: No measurable degradation in API response times (mappers add <1ms overhead)
- [ ] **Type Safety**: `nx run-many -t typecheck` passes across all packages after each phase
- [ ] **Test Reliability**: All existing tests pass after each phase; no new flaky tests introduced
- [ ] **Developer Experience**: Clear error messages when null-safety rules are violated (type errors, not runtime)
- [ ] **Backward Compatibility**: No breaking changes to runtime behavior — `?? ""` fallbacks still work even if redundant

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] All 4 phases complete with documented results
- [ ] `nx run-many -t typecheck` passes across all packages
- [ ] `nx run-many -t test` passes across all packages
- [ ] Migrations tested in dev environment
- [ ] Documentation updated with null-safety guidelines
- [ ] PR checklist includes nullability review
- [ ] Code reviewed and approved

---

## Implementation Process

### Phase 1: Quick Wins (Week 1)

#### Step 1.1: Fix Zod Double-Nullable Anti-Patterns
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 1.2, 1.3 (Wave 1 — Quick Wins)

**Success Criteria**:
- `packages/orpc/src/utils/location-validation.ts`: Remove `.nullable()` from all 7 `.optional().nullable()` chains
- `packages/orpc/src/api/routers/activityFeed/index.ts`: Remove `.nullable()` from `description` field
- `packages/orpc/src/api/routers/reward/index.ts`: Remove `.nullable()` from `image` field
- `bun run typecheck` in `packages/orpc` passes
- `bun run test` in `packages/orpc` passes

**Subtasks**:
1. Edit `location-validation.ts`: Change all `.optional().nullable()` to `.optional()`
2. Edit `activityFeed/index.ts`: Change `description: z.string().trim().nullable().optional()` to `.optional()`
3. Edit `reward/index.ts`: Remove `.nullable()` from relevant field
4. Run typecheck and tests
5. Fix any compilation errors

**Blockers**: None

**Risks**:
- Risk: Consumers may depend on `null` being passed through
  - Mitigation: Check consuming components before merging

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (40%): All `.optional().nullable()` chains removed
  2. **Completeness** (40%): All 3 files updated, typecheck passes
  3. **Quality** (20%): No new triple-state patterns introduced

---

#### Step 1.2: Normalize Shared Type Definitions
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: 1.1, 1.3 (Wave 1 — Quick Wins)

**Success Criteria**:
- `packages/common/src/users/participantResult.ts`: `PublicUser` fields from `| null` to `string` with defaults
- `packages/common/src/stores/authStore.ts`: `AuthUser` string fields from `| null` to `string` with defaults
- Add `hasName`, `hasEmail`, `isEmailVerified` derived booleans
- All consumers in `apps/native` and `packages/orpc` updated
- `nx run-many -t typecheck` passes across affected packages

**Subtasks**:
1. Update `PublicUser` interface: remove `| null`, add derived booleans
2. Update `AuthUser` interface: remove `| null`, add derived booleans
3. Create `toPublicUser` mapper function in `packages/common`
4. Update all consumers in `packages/orpc` (queries, routers)
5. Update all consumers in `apps/native` (components, hooks)
6. Run typecheck across affected packages
7. Fix any compilation errors

**Blockers**: None

**Risks**:
- Risk: Many consumers may reference `| null` fields
  - Mitigation: Use `grep` to find all consumers, update systematically
- Risk: `null` checks may have been used for conditional rendering
  - Mitigation: Replace with derived booleans (`hasName`, `hasEmail`)

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Interfaces have no `| null` on string fields
  2. **Completeness** (30%): All consumers updated, derived booleans added
  3. **Quality** (25%): Clean mapper functions, no redundant logic
  4. **Integration** (15%): No TypeScript errors across packages

---

#### Step 1.3: Fix Native useState Defaults
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 1.1, 1.2 (Wave 1 — Quick Wins)

**Success Criteria**:
- `apps/native/src/hooks/trips/useTrips.ts`: `useState<TripListItem[]>([])` instead of `null`
- `apps/native/src/hooks/trips/useTripDetails.ts`: `useState<string>("")` instead of `string | null`
- `apps/native/src/app/auth/login.tsx`: `useState<string>("")` for error states
- `apps/native/src/stores/map/mapStore.ts`: `selectedUserId: ""`, `followMode: "none"`
- `bun run typecheck` in `apps/native` passes
- `bun run test` in `apps/native` passes

**Subtasks**:
1. Edit `useTrips.ts`: Change state type and default
2. Edit `useTripDetails.ts`: Change state type and default
3. Edit `login.tsx`: Change all error state types and defaults
4. Edit `mapStore.ts`: Change default values
5. Update any dependent components that checked for `null`
6. Run typecheck and tests
7. Fix any compilation errors

**Blockers**: None

**Risks**:
- Risk: Components may have `if (data === null)` checks that break
  - Mitigation: Replace with `if (data.length === 0)` or similar

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (40%): All `useState<X | null>(null)` replaced with proper defaults
  2. **Completeness** (40%): All identified files updated, typecheck passes
  3. **Quality** (20%): No unnecessary null checks remain

---

### Phase 2: Database Schema Hardening (Week 2)

#### Step 2.1: Make Text Fields Non-Nullable (No Defaults for User Data)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Schema Changes, Foundation)

**Success Criteria**:
- 8 text columns updated with `.notNull()` **without** `.default()` — user data must be provided by the application:
  - `challenges.description`
  - `trips.description`
  - `groups.description`
  - `activityFeeds.description`
  - `activityFeeds.imageUrl`
  - `coinTransactions.reason`
  - `submissionReports.details`
  - `notificationSchedules.notificationTitle`
  - `notificationSchedules.notificationBody`
- Migration generated: `cd packages/db && bun run db:generate`
- Migration tested in dev environment: `cd packages/db && bun run db:push`
- `bun run typecheck` in `packages/db` passes
- **Data backfill**: Existing `NULL` values are updated via explicit migration SQL (not DB defaults) to `''` or appropriate values

**Subtasks**:
1. Edit `packages/db/src/schema/challenges.ts`: Add `.notNull()` to `description` (no `.default()`)
2. Edit `packages/db/src/schema/trips.ts`: Add `.notNull()` to `description` (no `.default()`)
3. Edit `packages/db/src/schema/groups.ts`: Add `.notNull()` to `description` (no `.default()`)
4. Edit `packages/db/src/schema/activities.ts`: Add `.notNull()` to `description` and `imageUrl` (no `.default()`)
5. Edit `packages/db/src/schema/rewards.ts` (coinTransactions table): Add `.notNull()` to `reason` (no `.default()`)
6. Edit `packages/db/src/schema/challenges.ts` (submissionReports table): Add `.notNull()` to `details` (no `.default()`)
7. Edit `packages/db/src/schema/notifications.ts`: Add `.notNull()` to `notificationTitle` and `notificationBody` (no `.default()`)
8. Write explicit migration SQL to backfill existing `NULL` values with `''` (or investigate and fill real data)
9. Generate migration
10. Test migration in dev environment
11. Verify existing data is properly backfilled

**Blockers**: None

**Risks**:
- Risk: Existing rows with `NULL` values may conflict with `.notNull()`
  - Mitigation: Explicit migration SQL backfills `NULL` to `''` before applying `.notNull()` constraint
- Risk: Insert paths may not provide these fields, causing DB errors
  - Mitigation: Update all insert queries in `packages/orpc` to provide explicit values; API mapper layer handles normalization
- Risk: Consumers may not expect empty strings
  - Mitigation: Document in migration notes; API mapper layer ensures consistent output

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (35%): All 8 columns have `.notNull()` without `.default()`, migration succeeds
  2. **Completeness** (35%): Migration tested, existing data explicitly backfilled
  3. **Quality** (20%): Schema files clean, no unnecessary changes, no `.default()` on user data
  4. **Integration** (10%): TypeScript compilation passes

---

#### Step 2.2: Add .notNull().default(0) to System/Score Numeric Fields
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Depends on 2.1)

**Success Criteria**:
- 7 numeric columns updated with `.notNull().default(0)` — these are system/computed fields where `0` is semantically correct:
  - `challenges.firstPlacePoints`
  - `challenges.secondPlacePoints`
  - `challenges.thirdPlacePoints`
  - `locations.accuracy`
  - `sponsors.height`
  - `sponsors.offsetX`
  - `sponsors.offsetY`
- Migration generated and tested
- `bun run typecheck` in `packages/db` passes

**Subtasks**:
1. Edit `packages/db/src/schema/challenges.ts`: Add `.notNull().default(0)` to 3 point fields
2. Edit `packages/db/src/schema/locations.ts`: Add `.notNull().default(0)` to `accuracy`
3. Edit `packages/db/src/schema/sponsors.ts`: Add `.notNull().default(0)` to `height`, `offsetX`, `offsetY`
4. Generate migration
5. Test migration in dev environment
6. Verify existing data gets defaults

**Blockers**:
- Step 2.1 complete

**Risks**:
- Risk: Existing rows with `NULL` may have business meaning different from `0`
  - Mitigation: Review data before migration; `0` is the correct default for all listed fields

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (35%): All 7 columns have `.notNull().default(0)`, migration succeeds
  2. **Completeness** (35%): Migration tested, existing data updated
  3. **Quality** (20%): Schema files clean, no unnecessary changes
  4. **Integration** (10%): TypeScript compilation passes

---

#### Step 2.3: Make locations Coordinates Non-Nullable
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 — Depends on 2.2)

**Success Criteria**:
- `locations.latitude` → `.notNull()`
- `locations.longitude` → `.notNull()`
- Migration generated and tested
- `location-validation.ts` updated to require lat/lng
- `bun run test` in `packages/orpc` passes

**Subtasks**:
1. Edit `packages/db/src/schema/locations.ts`: Add `.notNull()` to `latitude` and `longitude`
2. Generate migration
3. Test migration in dev environment
4. Verify no null coordinates in existing data
5. Update `packages/orpc/src/utils/location-validation.ts`: Make lat/lng required
6. Update `packages/orpc/src/api/routers/location/` queries to ensure lat/lng always provided
7. Run tests in `packages/orpc`
8. Fix any test failures

**Blockers**:
- Step 2.2 complete

**Risks**:
- Risk: Existing data may have null coordinates
  - Mitigation: Check data before migration; if nulls exist, investigate insert paths
- Risk: Insert paths may not always provide coordinates
  - Mitigation: Verify all insert paths (background location, manual location, etc.)

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Both columns are `.notNull()`, validation requires lat/lng
  2. **Completeness** (30%): Migration tested, all insert paths verified
  3. **Testing** (25%): Location router tests pass
  4. **Quality** (15%): Clean validation, no redundant checks

---

### Phase 3: API Normalization (Week 3)

#### Step 3.1: Create Router-Level DTO Mappers in utils.ts
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 — Depends on 2.3)

**Success Criteria**:
- `packages/orpc/src/api/routers/challenge/utils.ts`: Add mapper functions to normalize all nullable challenge fields
- `packages/orpc/src/api/routers/group/utils.ts`: Add mapper functions to normalize group description/image
- `packages/orpc/src/api/routers/activityFeed/utils.ts`: Add mapper functions to normalize activity fields
- `packages/orpc/src/api/routers/trip/utils.ts`: Add mapper functions to normalize trip description
- All mappers exported from router `index.ts` files
- All queries in `queries.ts` use mappers before returning
- `bun run test` in `packages/orpc` passes

**Subtasks**:
1. Add mapper functions to `packages/orpc/src/api/routers/challenge/utils.ts` (following existing `toClientChallenge` pattern)
2. Add mapper functions to `packages/orpc/src/api/routers/group/utils.ts`
3. Add mapper functions to `packages/orpc/src/api/routers/activityFeed/utils.ts`
4. Add mapper functions to `packages/orpc/src/api/routers/trip/utils.ts`
5. Update `queries.ts` in each router to use mappers before returning
6. Export mappers from router `index.ts` files
7. Run tests in `packages/orpc`
8. Fix any test failures

**Blockers**:
- Step 2.3 complete

**Risks**:
- Risk: Mappers may be missed in some query paths
  - Mitigation: Systematically review all `findFirst`, `findMany`, `select` in each router's `queries.ts`
- Risk: Mapper overhead may affect performance
  - Mitigation: Mappers are simple object spreads — negligible overhead

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): All nullable fields normalized to defaults
  2. **Completeness** (25%): All queries in each router use mappers
  3. **Testing** (25%): Router tests pass
  4. **Quality** (15%): Clean mapper functions, DRY
  5. **Integration** (10%): Exported correctly from index files

---

#### Step 3.2: Create Discriminated Unions for Activity Feed
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 — Depends on 3.1)

**Success Criteria**:
- `packages/orpc/src/api/routers/activityFeed/types.ts`: Replace `ActivityWithRelations` with discriminated union
- All activity feed queries return union type
- `apps/native` components updated to handle union types
- `bun run test` in both `packages/orpc` and `apps/native` passes

**Subtasks**:
1. Define `BaseActivity` interface with common fields
2. Define activity-specific interfaces (SubmissionActivity, ChallengeActivity, etc.)
3. Create discriminated union type
4. Update `packages/orpc/src/api/routers/activityFeed/queries.ts` to return union type
5. Update `apps/native` components that consume activity data
6. Update `apps/native` activity feed rendering logic
7. Run typecheck in both packages
8. Run tests in both packages
9. Fix any errors

**Blockers**:
- Step 3.1 complete

**Risks**:
- Risk: Many UI components depend on `ActivityWithRelations` shape
  - Mitigation: Use `grep` to find all consumers, update systematically
- Risk: Union type may be complex to maintain
  - Mitigation: Document the union pattern, add type helpers

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): Union type is correct TypeScript discriminated union
  2. **Completeness** (25%): All queries and consumers updated
  3. **Testing** (25%): Tests pass in both packages
  4. **Quality** (15%): Clean type definitions, no redundancy
  5. **Integration** (10%): No TypeScript errors across packages

---

#### Step 3.3: Wrap Query Hooks with Non-Nullable Defaults
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 — Depends on 3.2)

**Success Criteria**:
- `apps/native/src/hooks/groups/useGroupDetails.ts`: Return `tripId: string` ("" if not available)
- `apps/native/src/hooks/trips/useTripDetails.ts`: Return `tripId: string` ("" if not available)
- `apps/native/src/hooks/trips/useTripResources.ts`: Return `resources: TripResource[]` ([] if not available)
- Consuming components remove `?? []` / `?? ""` fallbacks
- `bun run test` in `apps/native` passes

**Subtasks**:
1. Update `useGroupDetails.ts` to return normalized `tripId`
2. Update `useTripDetails.ts` to return normalized `tripId`
3. Update `useTripResources.ts` to return normalized `resources`
4. Use `grep` to find all `?? []` / `?? ""` in consuming components
5. Remove redundant fallbacks from components
6. Run typecheck in `apps/native`
7. Run tests in `apps/native`
8. Fix any errors

**Blockers**:
- Step 3.2 complete

**Risks**:
- Risk: Removing `??` fallbacks may break if hook doesn't return default
  - Mitigation: Ensure hooks always return non-nullable defaults
- Risk: Some `??` may be needed for other data sources
  - Mitigation: Only remove `??` that are redundant with hook normalization

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Hooks return non-nullable defaults
  2. **Completeness** (30%): All redundant `??` removed from components
  3. **Testing** (25%): Native tests pass
  4. **Quality** (15%): Clean hook interfaces, no unnecessary complexity

---

### Phase 4: Architectural Changes (Week 4)

#### Step 4.1: Split tripResources Table
**Estimate**: Large (60-120 min)  
**Agent**: opus  
**Parallel with**: None (Wave 4 — Critical Path)

**Success Criteria**:
- 4 new tables created: `tripResourceLinks`, `tripResourceFiles`, `tripResourceTexts`, `tripResourceIcons`
- Migration converts existing `tripResources` data to new tables
- `packages/orpc/src/api/routers/trip/queries.ts` updated to query from new tables
- `apps/native` components updated to handle new data shape
- `bun run test` in all affected packages passes

**Subtasks**:
1. Create `tripResourceLinks` table in `packages/db/src/schema/`
2. Create `tripResourceFiles` table
3. Create `tripResourceTexts` table
4. Create `tripResourceIcons` table
5. Write migration to convert existing data (based on `type` field)
6. Update `packages/orpc/src/api/routers/trip/queries.ts` to query from new tables
7. Update `packages/orpc/src/api/routers/trip/mutations.ts` to insert into correct table
8. Update `apps/native` components (trip resource list, resource detail, etc.)
9. Run typecheck in all affected packages
10. Run tests in all affected packages
11. Fix any errors

**Blockers**:
- Step 3.3 complete

**Risks**:
- Risk: Migration of existing data may be complex
  - Mitigation: Write migration carefully, test with sample data
- Risk: Many UI components depend on `tripResources` shape
  - Mitigation: Use `grep` to find all consumers, update systematically
- Risk: New tables may require index updates
  - Mitigation: Add appropriate indexes on `tripId` columns

**Verification**:
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubrics**:
  1. **Correctness** (20%): All 4 tables have correct schema, 0 nullable columns
  2. **Completeness** (20%): Migration converts all data correctly
  3. **Testing** (20%): All affected tests pass
  4. **Quality** (20%): Clean query/mutation separation, DRY
  5. **Integration** (20%): No TypeScript errors, UI components updated

---

#### Step 4.2: Extract challengeRecurrence and challengeLocation Tables
**Estimate**: Large (60-120 min)  
**Agent**: opus  
**Parallel with**: None (Wave 4 — Depends on 4.1)

**Success Criteria**:
- `challengeRecurrence` table created (`challengeId`, `dailyStartTime`, `dailyEndTime`, `isRecurring`)
- `challengeLocation` table created (`challengeId`, `targetLatitude`, `targetLongitude`, `expectedValue`)
- Migration converts existing `challenges` data to new tables
- `packages/orpc/src/api/routers/challenge/` queries and mutations updated
- `apps/native` challenge forms updated
- `bun run test` in all affected packages passes

**Subtasks**:
1. Create `challengeRecurrence` table in `packages/db/src/schema/`
2. Create `challengeLocation` table
3. Write migration to extract data from `challenges` table
4. Remove `dailyStartTime`, `dailyEndTime` from `challenges`
5. Remove `targetLatitude`, `targetLongitude`, `expectedValue` from `challenges`
6. Update `packages/orpc/src/api/routers/challenge/queries.ts` to join with new tables
7. Update `packages/orpc/src/api/routers/challenge/mutations.ts` to insert into new tables
8. Update `apps/native` challenge creation/editing forms
9. Run typecheck in all affected packages
10. Run tests in all affected packages
11. Fix any errors

**Blockers**:
- Step 4.1 complete

**Risks**:
- Risk: Challenge logic is core to the app — breaking changes are high-impact
  - Mitigation: Extensive testing of all challenge flows
- Risk: Migration of recurring challenge data may be complex
  - Mitigation: Verify data integrity before and after migration

**Verification**:
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubrics**:
  1. **Correctness** (20%): Both tables have correct schema, 0 nullable columns
  2. **Completeness** (20%): Migration converts all data correctly, queries updated
  3. **Testing** (20%): All affected tests pass, challenge flows verified
  4. **Quality** (20%): Clean query/mutation separation, DRY
  5. **Integration** (20%): No TypeScript errors, UI forms updated

---

#### Step 4.3: Documentation and Policy Setup
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 4.4 (Wave 4 — Documentation)

**Success Criteria**:
- `docs/conventions/null-safety.md` written with "nulls at the boundary" rule
- `AGENTS.md` updated with null-safety guidelines
- PR checklist includes nullability review items
- Full test suite passes: `bun run test`
- Full typecheck passes: `nx run-many -t typecheck`

**Subtasks**:
1. Write `docs/conventions/null-safety.md` with boundary matrix, AVOID/PREFER patterns, PR checklist
2. Update `AGENTS.md` with null-safety guidelines
3. Update `.github/pull_request_template.md` with nullability review checklist
4. Run full test suite
5. Run full typecheck
6. Fix any errors

**Blockers**:
- Step 4.2 complete

**Risks**:
- Risk: Documentation may become outdated
  - Mitigation: Keep documentation concise and reference analysis doc

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Completeness** (40%): All 3 documentation files updated
  2. **Quality** (35%): Guidelines are clear, actionable, and specific
  3. **Correctness** (25%): Full test suite and typecheck pass

---

#### Step 4.4: Final Integration Verification
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 4.3 (Wave 4 — Final Check)

**Success Criteria**:
- `nx run-many -t typecheck` passes across all packages
- `nx run-many -t test` passes across all packages
- `nx run-many -t build` passes across all packages
- No new `useState<X | null>(null)` patterns introduced
- No new `.optional().nullable()` chains introduced

**Subtasks**:
1. Run `nx run-many -t typecheck`
2. Run `nx run-many -t test`
3. Run `nx run-many -t build`
4. Search for new `useState<X | null>(null)` patterns
5. Search for new `.optional().nullable()` chains
6. Verify no new nullable patterns introduced
7. Fix any errors

**Blockers**:
- Step 4.2 complete

**Risks**:
- Risk: Build may fail due to circular dependencies or type errors
  - Mitigation: Fix incrementally, starting with `packages/db`

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Typecheck, test, build all pass
  2. **Completeness** (30%): No new nullable patterns introduced
  3. **Testing** (25%): All tests pass
  4. **Quality** (15%): Clean build, no warnings

---

## Verification Summary

| Step | Description | Level | Threshold | Judge Count | Primary Rubrics |
|------|-------------|-------|-----------|-------------|-----------------|
| 1.1 | Fix Zod Double-Nullable | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 1.2 | Normalize Shared Types | Medium | 4.0/5.0 | 1 | Correctness, Completeness, Integration |
| 1.3 | Fix Native useState Defaults | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 2.1 | DB Text Fields Non-Nullable | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| 2.2 | DB Numeric Fields Non-Nullable | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| 2.3 | DB Coordinates Non-Nullable | High | 4.0/5.0 | 2 | Correctness, Testing, Completeness |
| 3.1 | API Mapper Layer | High | 4.0/5.0 | 2 | Correctness, Testing, Completeness |
| 3.2 | Activity Feed Discriminated Union | High | 4.0/5.0 | 2 | Correctness, Testing, Integration |
| 3.3 | Hook Boundary Normalization | Medium | 4.0/5.0 | 1 | Correctness, Completeness, Testing |
| 4.1 | Split tripResources Table | Panel | 4.5/5.0 | 3 | All categories |
| 4.2 | Extract challengeRecurrence/Location | Panel | 4.5/5.0 | 3 | All categories |
| 4.3 | Documentation and Policy | Low | 3.5/5.0 | 1 | Completeness, Quality |
| 4.4 | Final Integration Verification | High | 4.0/5.0 | 2 | Correctness, Testing, Completeness |

**Legend**:
- **Level**: None / Low / Medium / High / Panel
- **Threshold**: Minimum score required (out of 5.0)
- **Judge Count**: Number of independent judges for verification
- **Rubrics**: Evaluation categories — Correctness, Completeness, Quality, Testing, Integration

---

## Sub-Agent Execution Directive

### Agent Type Assignments

| Step | Agent Type | Rationale |
|------|------------|-----------|
| 1.1, 1.3, 2.1, 2.2, 4.3 | **sonnet** | Medium complexity, reasoning, testing logic |
| 1.2, 3.1, 3.2, 3.3, 4.4 | **sonnet** | Medium complexity, requires reasoning, testing logic |
| 2.3 | **sonnet** | Medium complexity, requires reasoning, testing logic |
| 4.1, 4.2 | **opus** | High complexity, table splits, data migrations, critical path |

### Parallel Execution Waves

**Wave 1**: Steps 1.1, 1.2, 1.3 (ALL parallel — Quick Wins)  
**Wave 2**: Step 2.1 (Depends on Wave 1)  
**Wave 3**: Step 2.2 (Depends on 2.1)  
**Wave 4**: Step 2.3 (Depends on 2.2)  
**Wave 5**: Step 3.1 (Depends on 2.3)  
**Wave 6**: Step 3.2 (Depends on 3.1)  
**Wave 7**: Step 3.3 (Depends on 3.2)  
**Wave 8**: Step 4.1 (Depends on 3.3)  
**Wave 9**: Step 4.2 (Depends on 4.1)  
**Wave 10**: Steps 4.3, 4.4 (ALL parallel — depends on 4.2)

### Execution Rules

1. **Pre-execution Check**: Verify all "Parallel with" steps from previous waves are complete
2. **Dependency Gate**: Never start a step until ALL its blockers are satisfied
3. **Wave Synchronization**: Wait for entire wave to complete before starting dependent waves
4. **Quality Gate**: Each step must pass success criteria before marking complete
5. **Agent Selection**: Use assigned agent type — no substitutions without approval
6. **Type Safety Gate**: After each wave, run `nx run-many -t typecheck` to catch type errors early

### Critical Path

```
1.1 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 3.3 → 4.1 → 4.2 → 4.4
```

**Critical Path Duration**: ~8.5 hours sequential  
**Wall Clock with Parallelization**: ~5 hours  
**Parallelization Savings**: ~40% time reduction

### Synchronization Points

1. **Wave 1 → 2**: Wait for ALL 1.1, 1.2, 1.3 completion
2. **Wave 2 → 3**: Wait for 2.1 completion
3. **Wave 3 → 4**: Wait for 2.2 completion
4. **Wave 4 → 5**: Wait for 2.3 completion
5. **Wave 5 → 6**: Wait for 3.1 completion
6. **Wave 6 → 7**: Wait for 3.2 completion
7. **Wave 7 → 8**: Wait for 3.3 completion
8. **Wave 8 → 9**: Wait for 4.1 completion
9. **Wave 9 → 10**: Wait for 4.2 completion

---

## Implementation Summary Table

| Phase | Step | Area | Focus | Agent | Estimate | Dependencies | Parallel With |
|-------|------|------|-------|-------|----------|--------------|---------------|
| 1 | 1.1 | Zod | Remove double-nullable | sonnet | Small | None | 1.2, 1.3 |
| 1 | 1.2 | Shared | Normalize types | sonnet | Medium | None | 1.1, 1.3 |
| 1 | 1.3 | Native | Fix useState defaults | sonnet | Small | None | 1.1, 1.2 |
| 2 | 2.1 | DB | Text fields non-nullable | sonnet | Medium | 1.1, 1.2, 1.3 | None |
| 2 | 2.2 | DB | Numeric fields non-nullable | sonnet | Small | 2.1 | None |
| 2 | 2.3 | DB | Coordinates non-nullable | sonnet | Small | 2.2 | None |
| 3 | 3.1 | API | Router mappers | sonnet | Medium | 2.3 | None |
| 3 | 3.2 | API | Discriminated unions | sonnet | Medium | 3.1 | None |
| 3 | 3.3 | Native | Hook normalization | sonnet | Medium | 3.2 | None |
| 4 | 4.1 | DB | Split tripResources | opus | Large | 3.3 | None |
| 4 | 4.2 | DB | Extract challenge tables | opus | Large | 4.1 | None |
| 4 | 4.3 | Docs | Policy and conventions | sonnet | Small | 4.2 | 4.4 |
| 4 | 4.4 | All | Integration verification | sonnet | Small | 4.2 | 4.3 |

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Existing DB rows have NULL values that conflict with `.notNull()` | High | High | Explicit migration SQL backfills NULLs before applying `.notNull()`; no DB defaults used |
| Many consumers of `PublicUser`/`AuthUser` break after type changes | Medium | High | Systematic grep-and-update; use derived booleans for conditional rendering |
| Table split migrations fail or corrupt data | Medium | High | Test migrations with sample data; backup before applying; validate data integrity |
| `location-validation.ts` changes break GPS tracking | Medium | High | Verify all insert paths provide lat/lng; test with background location service |
| Activity feed discriminated union breaks UI components | Medium | Medium | Update all consumers systematically; add type guards where needed |
| New `useState` defaults break conditional rendering | Low | Medium | Replace `if (x === null)` with `if (x.length === 0)` or similar |
| Mapper layer introduces performance overhead | Low | Low | Mappers are simple object spreads — negligible overhead |
| Challenge recurrence/location extraction breaks core logic | Medium | High | Extensive testing of all challenge flows; verify data integrity |
| Build fails due to circular dependencies after schema changes | Low | Medium | Fix incrementally; start with `packages/db`, then `packages/orpc`, then `apps/native` |
| Tests fail due to mocking assumptions about nullability | Medium | Medium | Update mocks to return non-nullable defaults; run tests after each phase |

---

## Definition of Done Checklist

- [ ] All 13 acceptance criteria pass
- [ ] All 4 phases complete with documented results
- [ ] `nx run-many -t typecheck` passes across all packages
- [ ] `nx run-many -t test` passes across all packages
- [ ] `nx run-many -t build` passes across all packages
- [ ] Database migrations tested in dev environment
- [ ] No new `useState<X | null>(null)` patterns introduced
- [ ] No new `.optional().nullable()` chains introduced
- [ ] No `.default()` used on user-data columns (descriptions, titles, names, reasons); `.default()` only on system fields (timestamps, booleans, counters, status enums)
- [ ] `docs/conventions/null-safety.md` written and reviewed
- [ ] `AGENTS.md` updated with null-safety guidelines
- [ ] PR checklist includes nullability review
- [ ] Code reviewed and approved
- [ ] Estimated impact achieved: ~120+ nullable patterns eliminated, 30-40% reduction in `??`/`?.` usage

(End of file)
