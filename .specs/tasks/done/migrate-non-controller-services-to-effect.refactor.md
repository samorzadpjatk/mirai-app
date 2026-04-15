---
title: Migrate remaining non-controller services to Effect DI
depends_on:
  - "/Users/rafalopilowski/Projekty/migration/pjapp/.specs/tasks/done/migrate-awilix-to-effect-di.refactor.md"
---

## Initial User Prompt

Option 2: Full Effect Migration (Complete)
Convert resolvers to use Effect.gen with Context.Tag resolution:
// Instead of: context.container.resolve("pubSubService")
// Use: yield\* PubSubServiceTag

## Description

This task completes the migration from hybrid DI (awilix container + Effect Context) to pure Effect DI across all non-controller services in the codebase.

Currently, several resolver files still use the legacy pattern of `context.container.resolve<Service>("serviceName")` to access dependencies. This creates inconsistency and prevents full adoption of Effect's type-safe dependency injection benefits. The goal is to convert all remaining container-based service access to use Effect's native `Context.Tag` pattern.

**Target Pattern**:

```typescript
// Before (awilix container)
const pubSubService = context.container.resolve<PubSubService>("pubSubService");
await pubSubService.publish("event", data);

// After (Effect Context.Tag)
const program = Effect.gen(function* () {
  const pubSubService = yield* PubSubServiceTag;
  yield* pubSubService.publish("event", data);
}).pipe(Effect.provide(context.appLayer));
```

**Scope**:

- **Included**: 5 categories of services (pubSubService: 11 refs, db: 2 refs, tripRepository: 1 ref, auth services: 4 refs, User.ts: 1 ref)
- **Excluded**: Controllers (already migrated), services not using container.resolve, business logic changes

### Migration Scope

The following non-controller services still use context.container and need to be migrated to pure Effect DI:

- **pubSubService** (11 references in resolvers/types)
  - activityFeed.ts (5 references)
  - challengeVote.ts (2 references)
  - location.ts (1 reference)
  - subscriptions.ts (3 references)

- **db** (2 references in resolvers)
  - coinTransaction.ts (2 references for raw SQL queries)

- **tripRepository** (1 reference in resolvers)
  - trip.ts (1 reference)

- **Auth services** (4 references in utils)
  - auth-helpers.ts (4 references for auth-related services)

- **Supabase/Auth in User.ts** (1 reference)
  - User.ts type definition (1 reference using container)

## Acceptance Criteria

### Functional Requirements

- [ ] **FR1**: Zero `context.container.resolve()` calls remain in target files
  - Given: Resolver files currently using container.resolve
  - When: Migration is complete
  - Then: No container.resolve calls exist in activityFeed.ts, challengeVote.ts, location.ts, subscriptions.ts, coinTransaction.ts, trip.ts, auth-helpers.ts, User.ts

- [ ] **FR2**: All services accessed via `yield* ContextTag` pattern
  - Given: Service dependencies in resolver files
  - When: Code is executed
  - Then: Services are accessed through Context.Tag yielding within Effect.gen

- [ ] **FR3**: All resolvers use `Effect.gen` for composition
  - Given: Resolver functions
  - When: Reviewing resolver implementations
  - Then: All service access occurs within Effect.gen blocks

- [ ] **FR4**: TypeScript type checking passes on all modified files
  - Given: Modified resolver and utility files
  - When: Running TypeScript compiler
  - Then: No type errors in migrated files

- [ ] **FR5**: All existing tests pass
  - Given: Existing test suite
  - When: Running tests
  - Then: All tests pass with no regressions

### Non-Functional Requirements

- [ ] **NFR1**: No significant performance regression
  - Performance should remain equivalent or improved

- [ ] **NFR2**: Code complexity does not increase
  - Maintainability should be preserved or improved

- [ ] **NFR3**: Pattern consistency across all migrated files
  - All migrated files follow the same Effect DI pattern

### Definition of Done

- [ ] All acceptance criteria pass (FR1-FR5, NFR1-NFR3)
- [ ] PR reviewed and approved
- [ ] No `// TODO: migrate` comments remaining in migrated files
- [ ] Scratchpad documentation complete (.specs/scratchpad/business-analysis-migrate-non-controller-services.md)

## Implementation Process

### Phase 1: Setup and Prerequisites

**Goal**: Prepare environment and verify Context.Tags exist  
**Success Criteria**:

- [ ] All 5 service categories have Context.Tags defined
- [ ] Tags are exported from appropriate framework modules
- [ ] appLayer includes all necessary service implementations

**Subtasks**:

1. Verify PubSubServiceTag exists and is exported
2. Verify DatabaseServiceTag or equivalent exists
3. Verify TripRepositoryTag exists
4. Verify Auth-related Tags exist
5. Verify User.ts can use Context.Tags
6. Document any missing Tags (blocker if found)

**Estimated Effort**: Small  
**Priority**: Critical (blocks all other steps)  
**Risk**: Low

### Phase 2: Service Migrations (Parallelizable)

After Phase 1 completes, the following can be executed in parallel:

#### Step 2.1: Migrate pubSubService References

**Files**: activityFeed.ts, challengeVote.ts, location.ts, subscriptions.ts  
**Success Criteria**:

- [ ] All 11 references converted to PubSubServiceTag
- [ ] All publish calls wrapped in Effect.gen
- [ ] Type checking passes for all 4 files

**Subtasks**:

- Migrate activityFeed.ts (5 references)
- Migrate challengeVote.ts (2 references)
- Migrate location.ts (1 reference)
- Migrate subscriptions.ts (3 references)

**Estimated Effort**: Medium  
**Priority**: High  
**Risk**: Low

#### Step 2.2: Migrate db References (Raw SQL)

**File**: coinTransaction.ts  
**Success Criteria**:

- [ ] coinTransaction.ts uses DatabaseServiceTag or equivalent
- [ ] Raw SQL queries execute through Effect
- [ ] Query results properly handled

**Subtasks**:

1. Identify raw SQL query patterns
2. Determine appropriate Tag (DatabaseServiceTag or create new)
3. Convert queries to Effect-ful pattern
4. Test query execution

**Estimated Effort**: Medium  
**Priority**: High  
**Risk**: Medium (raw SQL needs careful handling)

#### Step 2.3: Migrate tripRepository Reference

**File**: trip.ts  
**Success Criteria**:

- [ ] trip.ts uses TripRepositoryTag
- [ ] Repository access wrapped in Effect.gen
- [ ] All repository methods called Effect-fully

**Subtasks**:

1. Add TripRepositoryTag import
2. Replace container.resolve with yield\*
3. Wrap repository calls in Effect.gen

**Estimated Effort**: Small  
**Priority**: Medium  
**Risk**: Low

#### Step 2.4: Migrate Auth Services References

**File**: auth-helpers.ts  
**Success Criteria**:

- [ ] auth-helpers.ts uses appropriate Auth Context.Tags
- [ ] All auth utilities work with Effect.gen
- [ ] No container.resolve calls remain

**Subtasks**:

1. Identify all 4 auth service references
2. Map services to existing or new Tags
3. Convert utility functions to Effect pattern
4. Update function signatures if needed

**Estimated Effort**: Medium  
**Priority**: High  
**Risk**: Medium (utility functions may have complex usage)

#### Step 2.5: Migrate User.ts Reference

**File**: User.ts  
**Success Criteria**:

- [ ] User.ts uses Context.Tag pattern
- [ ] Type definitions properly updated
- [ ] Dependent code still compiles

**Subtasks**:

1. Examine current container usage in User.ts
2. Convert type to use Context.Tag
3. Update any dependent type references

**Estimated Effort**: Small  
**Priority**: Low  
**Risk**: Low

### Phase 3: Verification

**Goal**: Ensure all migrations complete and tests pass  
**Success Criteria**:

- [ ] Zero container.resolve calls in all target files
- [ ] TypeScript compilation passes
- [ ] All tests pass
- [ ] No runtime errors

**Subtasks**:

1. Run `grep -r "container.resolve" apps/backend-server/src/` - expect zero matches
2. Run TypeScript compiler check
3. Run test suite
4. Manual verification of critical paths

**Estimated Effort**: Small  
**Priority**: Critical  
**Risk**: Low

### Dependency Graph

```
Phase 1: Setup/Prerequisites
├── Phase 2.1: pubSubService (parallel)
├── Phase 2.2: db Raw SQL (parallel)
├── Phase 2.3: tripRepository (parallel)
├── Phase 2.4: Auth Services (parallel)
└── Phase 2.5: User.ts (parallel)
    └── Phase 3: Verification
```

### Risk Register

| Risk ID | Description                            | Probability | Impact | Mitigation                            | Priority |
| ------- | -------------------------------------- | ----------- | ------ | ------------------------------------- | -------- |
| R1      | Missing Context.Tag for service        | Medium      | High   | Verify in Phase 1, create if missing  | Critical |
| R2      | Raw SQL handling complexity            | Medium      | Medium | Use Effect.tryPromise, test carefully | High     |
| R3      | Auth utility function signatures break | Low         | Medium | Update all call sites                 | Medium   |
| R4      | appLayer doesn't include service       | Low         | High   | Verify Layer composition              | Critical |
| R5      | Tests fail after migration             | Medium      | Medium | Run tests, debug failures             | High     |

### Implementation Summary Table

| Phase         | Files   | Steps            | Effort | Risk   | Priority |
| ------------- | ------- | ---------------- | ------ | ------ | -------- |
| 1: Setup      | N/A     | Tag verification | Small  | Low    | Critical |
| 2.1: pubSub   | 4 files | 11 references    | Medium | Low    | High     |
| 2.2: db       | 1 file  | 2 raw SQL        | Medium | Medium | High     |
| 2.3: tripRepo | 1 file  | 1 reference      | Small  | Low    | Medium   |
| 2.4: Auth     | 1 file  | 4 references     | Medium | Medium | High     |
| 2.5: User     | 1 file  | 1 reference      | Small  | Low    | Low      |
| 3: Verify     | 8 files | Full test suite  | Small  | Low    | Critical |

**Total**: 8 files, 20 references, Medium effort

### Parallelization Analysis

**Maximum Parallelization Depth**: 5 (Phases 2.1-2.5 can run simultaneously after Phase 1)

**Execution Groups**:

| Group | Steps     | Files                                                            | Can Parallelize                   |
| ----- | --------- | ---------------------------------------------------------------- | --------------------------------- |
| 1     | Phase 1   | Setup                                                            | Sequential - must complete first  |
| 2     | Phase 2.1 | activityFeed.ts, challengeVote.ts, location.ts, subscriptions.ts | ✅ Parallel with 2.2-2.5          |
| 3     | Phase 2.2 | coinTransaction.ts                                               | ✅ Parallel with 2.1, 2.3-2.5     |
| 4     | Phase 2.3 | trip.ts                                                          | ✅ Parallel with 2.1-2.2, 2.4-2.5 |
| 5     | Phase 2.4 | auth-helpers.ts                                                  | ✅ Parallel with 2.1-2.3, 2.5     |
| 6     | Phase 2.5 | User.ts                                                          | ✅ Parallel with 2.1-2.4          |
| 7     | Phase 3   | All files                                                        | Sequential - must complete last   |

**Sub-Agent Execution Directive**:

When implementing this task, follow these rules:

1. **MUST** complete Phase 1 (Setup) before any Phase 2 work
2. **MAY** execute Phase 2.1-2.5 in parallel using 5 sub-agents simultaneously
3. **MUST** complete all Phase 2 steps before Phase 3 (Verification)
4. **MUST** use the following agent distribution:
   - Phase 1: opus (verification work)
   - Phase 2.1: sonnet (straightforward pattern)
   - Phase 2.2: opus (raw SQL complexity)
   - Phase 2.3: sonnet (simple migration)
   - Phase 2.4: opus (auth utilities may have edge cases)
   - Phase 2.5: haiku (simple type change)
   - Phase 3: sonnet (verification grunt work)

## Verification

### Verification Summary Table

| Step                      | Level    | Criticality | Threshold | Type         |
| ------------------------- | -------- | ----------- | --------- | ------------ |
| Phase 1: Setup            | Required | Critical    | 4.0/5.0   | Single-check |
| Phase 2.1: pubSubService  | Required | High        | 4.0/5.0   | Per-file     |
| Phase 2.2: db Raw SQL     | Required | High        | 4.0/5.0   | Single-check |
| Phase 2.3: tripRepository | Required | Medium      | 3.5/5.0   | Single-check |
| Phase 2.4: Auth Services  | Required | High        | 4.0/5.0   | Single-check |
| Phase 2.5: User.ts        | Required | Low         | 3.5/5.0   | Single-check |
| Phase 3: Verification     | Required | Critical    | 4.0/5.0   | Full-panel   |

### Phase 1: Setup Verification

**Level**: Required  
**Threshold**: 4.0/5.0

**Verification Rubric**:

| Criteria            | Weight | Description                                        | Scoring                                    |
| ------------------- | ------ | -------------------------------------------------- | ------------------------------------------ |
| Tag Completeness    | 0.40   | All 5 service categories have defined Context.Tags | 1=Missing >1, 3=Missing 1, 5=All present   |
| Tag Export          | 0.30   | All Tags exported from appropriate modules         | 1=None exported, 3=Some, 5=All exported    |
| Layer Configuration | 0.30   | appLayer includes all service implementations      | 1=Missing services, 3=Some, 5=All included |

**Verification Method**: Code review + compilation check

### Phase 2.1: pubSubService Verification

**Level**: Required  
**Threshold**: 4.0/5.0

**Verification Rubric**:

| Criteria                | Weight | Description                                 | Scoring                                   |
| ----------------------- | ------ | ------------------------------------------- | ----------------------------------------- |
| Container Calls Removed | 0.40   | All 11 container.resolve calls removed      | 1=Many remain, 3=Some, 5=All removed      |
| Effect Pattern Applied  | 0.35   | All services use yield\* ContextTag pattern | 1=Wrong pattern, 3=Partial, 5=All correct |
| Type Safety             | 0.25   | TypeScript compiles without errors          | 1=Errors, 3=Warnings, 5=Clean             |

**Verification Method**: grep + tsc + code review per file

### Phase 2.2: db Raw SQL Verification

**Level**: Required  
**Threshold**: 4.0/5.0

**Verification Rubric**:

| Criteria                | Weight | Description                            | Scoring                                      |
| ----------------------- | ------ | -------------------------------------- | -------------------------------------------- |
| Container Calls Removed | 0.35   | All db container.resolve calls removed | 1=Both remain, 3=One remains, 5=Both removed |
| Effect Pattern Applied  | 0.35   | Raw SQL queries use Effect-ful pattern | 1=Imperative, 3=Partial, 5=Full Effect       |
| Query Execution         | 0.30   | SQL queries execute correctly          | 1=Broken, 3=Some work, 5=All work            |

**Verification Method**: tsc + runtime test + code review

### Phase 2.3: tripRepository Verification

**Level**: Required  
**Threshold**: 3.5/5.0

**Verification Rubric**:

| Criteria               | Weight | Description                              | Scoring                    |
| ---------------------- | ------ | ---------------------------------------- | -------------------------- |
| Container Call Removed | 0.40   | tripRepository container.resolve removed | 1=Still present, 5=Removed |
| Effect Pattern Applied | 0.35   | Uses yield\* TripRepositoryTag           | 1=Wrong pattern, 5=Correct |
| Type Safety            | 0.25   | TypeScript compiles                      | 1=Errors, 5=Clean          |

**Verification Method**: grep + tsc + code review

### Phase 2.4: Auth Services Verification

**Level**: Required  
**Threshold**: 4.0/5.0

**Verification Rubric**:

| Criteria                | Weight | Description                                | Scoring                               |
| ----------------------- | ------ | ------------------------------------------ | ------------------------------------- |
| Container Calls Removed | 0.35   | All 4 auth container.resolve calls removed | 1=Many remain, 3=Some, 5=All removed  |
| Effect Pattern Applied  | 0.35   | Auth utilities use Effect.gen pattern      | 1=Imperative, 3=Partial, 5=All Effect |
| Signature Compatibility | 0.30   | Call sites still work                      | 1=Broken, 3=Some broken, 5=All work   |

**Verification Method**: grep + tsc + test execution

### Phase 2.5: User.ts Verification

**Level**: Required  
**Threshold**: 3.5/5.0

**Verification Rubric**:

| Criteria                | Weight | Description                       | Scoring                    |
| ----------------------- | ------ | --------------------------------- | -------------------------- |
| Container Call Removed  | 0.40   | User.ts container.resolve removed | 1=Still present, 5=Removed |
| Type Definition Updated | 0.35   | Type uses Context.Tag pattern     | 1=Wrong, 5=Correct         |
| Dependent Code Compiles | 0.25   | All files using User.ts compile   | 1=Errors, 5=Clean          |

**Verification Method**: grep + tsc + code review

### Phase 3: Final Verification (Full Panel)

**Level**: Required  
**Threshold**: 4.0/5.0

**Verification Rubric**:

| Criteria             | Weight | Description                             | Scoring                             |
| -------------------- | ------ | --------------------------------------- | ----------------------------------- |
| Zero Container Calls | 0.30   | `grep container.resolve` returns zero   | 1=Matches found, 5=Zero matches     |
| TypeScript Clean     | 0.25   | `tsc --noEmit` passes                   | 1=Errors, 3=Warnings, 5=Clean       |
| All Tests Pass       | 0.25   | Full test suite passes                  | 1=Failures, 3=Some pass, 5=All pass |
| Pattern Consistency  | 0.20   | All files follow same Effect DI pattern | 1=Inconsistent, 5=Consistent        |

**Verification Method**: Automated checks (grep + tsc + test) + panel review

### Definition of Done Verification

**Final Checklist**:

- [ ] Phase 1 verified (≥4.0/5.0)
- [ ] All Phase 2 steps verified (≥threshold each)
- [ ] Phase 3 verified (≥4.0/5.0)
- [ ] No container.resolve calls remain
- [ ] All type checks pass
- [ ] All tests pass
- [ ] PR approved

### Overall Threshold

**Target Quality**: 4.0/5.0 per phase  
**Minimum Acceptable**: 3.5/5.0 for low-criticality steps  
**No phases below**: 3.0/5.0
