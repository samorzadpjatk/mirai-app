---
title: Fix adapters package drizzle repository types (Phase 5)
depends_on: ["fix-adapters-phase4-mappers.chore.md"]
---

## Initial User Prompt

Fix Phase 5 of adapters package type errors - resolve complex Drizzle ORM type issues in repositories (~180 errors)

## Description

This task resolves approximately 138 TypeScript type errors across 15 Drizzle ORM repository implementations in the adapters package. These repositories serve as the data access layer between the use cases and the PostgreSQL database via Drizzle ORM.

**Business Context**: Type-safe repositories are critical for maintaining data integrity and preventing runtime errors. The current type errors prevent the adapters package from building successfully, blocking integration between the use case layer and the database. Resolving these errors enables full type safety across the data access layer.

**What is being fixed**: Complex Drizzle ORM type mismatches in repository implementations, including generic type parameter issues, query builder type mismatches, missing override modifiers, and method signature inconsistencies.

**Scope**: This phase focuses specifically on the repository implementations in `packages/adapters/src/gateways/drizzle/`. It depends on Phase 4 (mappers) being completed first, as repositories rely on mapper functions for domain-drizzle conversions.

### Scope

**In Scope**:
- All 17 Drizzle repository files in `packages/adapters/src/gateways/drizzle/`
- BaseDrizzleRepository base class if needed
- Type-only fixes (no runtime behavior changes)
- Repository interface implementations
- Query builder type corrections
- Generic type parameter fixes

**Out of Scope**:
- Runtime behavior changes
- Test file fixes (covered separately)
- Mapper implementations (Phase 4)
- Schema changes (database layer)
- Use case or domain layer changes

**User Scenarios**:
1. **Primary Flow**: A developer runs `bun tsc --noEmit` and sees zero type errors in the drizzle repository directory
2. **Error Flow**: If type errors remain, they should be documented with clear next steps
3. **Verification Flow**: CI pipeline passes TypeScript compilation for the adapters package

### References

- **Skill**: `.claude/skills/drizzle-repository-types/SKILL.md` - Patterns for fixing Drizzle ORM type issues
- **Analysis**: `.specs/analysis/analysis-phase5-repositories.md` - Detailed codebase impact analysis
- **Scratchpads**:
  - `.specs/scratchpad/research-phase5.md` - Research notes
  - `.specs/scratchpad/codebase-phase5.md` - Codebase analysis notes
  - `.specs/scratchpad/business-phase5.md` - Business analysis notes

## Acceptance Criteria

### Functional Requirements

- [ ] **AC1**: All repositories in `packages/adapters/src/gateways/drizzle/` compile without type errors
  - Given: The adapters package source code
  - When: Running `bun tsc --noEmit` in the adapters package
  - Then: Zero type errors reported in the drizzle directory

- [ ] **AC2**: Each repository correctly implements its corresponding use case port interface
  - Given: A repository implementation
  - When: Comparing method signatures to the interface
  - Then: All required methods are present with matching signatures

- [ ] **AC3**: BaseDrizzleRepository generic type parameters are correctly specified
  - Given: Repository class extending BaseDrizzleRepository
  - When: Inspecting type parameters
  - Then: Parameters use proper Select, Insert, and Table types from schema

- [ ] **AC4**: Method overrides use the `override` keyword where required
  - Given: Methods overriding base class implementations
  - When: Running TypeScript compiler
  - Then: No TS4114 errors (missing override modifier)

- [ ] **AC5**: Query builder patterns follow Drizzle ORM type-safe conventions
  - Given: Custom query methods using Drizzle query builder
  - When: Building and executing queries
  - Then: No query builder type mismatch errors (TS2740, TS2741)

### Non-Functional Requirements

- [ ] **NF1**: No runtime behavior changes
  - Given: Repository implementations before and after fixes
  - When: Comparing runtime behavior
  - Then: Only type annotations change, no logic modifications

- [ ] **NF2**: All existing tests continue to pass
  - Given: The adapters package test suite
  - When: Running `bun test` in packages/adapters
  - Then: All tests pass (type fixes should not break tests)

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] `bun tsc --noEmit` shows zero errors in drizzle repositories
- [ ] No new test failures introduced
- [ ] Code reviewed (self-review acceptable for type-only changes)
- [ ] Changes documented in commit message

## Architecture Overview

### Solution Strategy

This is a **mechanical refactoring** task focused on type corrections. The approach is:

1. **Pattern Learning**: Start with simple files (1-3 errors) to establish fixing patterns
2. **Categorization**: Fix errors by category (override modifiers, generic types, query builders)
3. **Progressive Complexity**: Move from simple files to heavy files (7+ errors)
4. **Category-Based Fixes**: Address all instances of each error type systematically

### Key Decisions

1. **Type-Only Changes**: No runtime behavior modifications - focus purely on TypeScript annotations
2. **Preserve Patterns**: Maintain existing code patterns, only fix type issues
3. **Base Class First**: If BaseDrizzleRepository needs changes, fix it before individual repositories
4. **Verify After Each File**: Run `bun tsc --noEmit` after each file to catch regressions early

### Expected Changes

**Files to Modify** (15 files with errors):
- `activity-feed.ts` - 3 errors
- `challenge-submission.ts` - 8 errors (heavy)
- `challenge-vote.ts` - 6 errors
- `challenge.ts` - 1 error
- `coin-transaction.ts` - 6 errors
- `event.ts` - 3 errors
- `group.ts` - 3 errors
- `location.ts` - 1 error
- `notification-delivery.ts` - 6 errors
- `notification-schedule.ts` - 6 errors
- `notification.ts` - 1 error
- `reward.ts` - 4 errors
- `sponsor.ts` - 2 errors
- `submission-report.ts` - 7 errors (heavy)
- `trip.ts` - 1 error

**Files Clean** (no changes needed):
- `telemetry.ts` - 0 errors
- `user.ts` - 0 errors

**Supporting Files** (may need updates):
- `base/repository.ts` - BaseDrizzleRepository if generic type issues
- `index.ts` - Barrel exports if type re-exports needed

### Integration Points

**Upstream** (implements interfaces from):
- `@mirai-app/use-cases` - Repository port interfaces

**Downstream** (uses):
- `@mirai-app/frameworks/drizzle/schema` - Table definitions and types
- `@mirai-app/frameworks/drizzle/client` - DrizzleDb type
- `@mirai-app/adapters/mappers/drizzle/*` - Entity mappers (Phase 4)

### Error Categories to Address

1. **TS4114** - Missing `override` modifier (8 files)
2. **TS2344** - Type constraint issues (8 files)
3. **TS2554** - Constructor argument count (10 files)
4. **TS2740/TS2741** - Query builder type mismatches (5 files)
5. **TS2416** - Method signature mismatches (5 files)
6. **TS2305/TS2724** - Missing exports (2 files)

## Implementation Process

### Overview

| Phase | Description | Estimated Effort |
|-------|-------------|------------------|
| 1 | Fix simple files (1 error each) | 30 min |
| 2 | Fix easy files (2-3 errors) | 1 hour |
| 3 | Fix medium files (4-6 errors) | 2 hours |
| 4 | Fix heavy files (7+ errors) | 2 hours |
| 5 | Final verification | 30 min |

**Total**: ~6 hours estimated
**Risk Level**: Low - type-only changes with clear error messages
**Critical Path**: challenge-submission.ts and submission-report.ts (most complex)

### Phase 1: Fix Simple Files (1 error each)

**Goal**: Establish fixing patterns with low-complexity files.

**Blockers**: None (these can be done in parallel)

**Subtasks**:
- [ ] **Step 1.1**: Fix challenge.ts
  - Add `override` modifier to `findAll` method
  - Success criteria: File compiles with 0 errors

- [ ] **Step 1.2**: Fix location.ts
  - Add `override` modifier to `create` method
  - Success criteria: File compiles with 0 errors

- [ ] **Step 1.3**: Fix notification.ts
  - Fix interface implementation (NotificationRepository)
  - Success criteria: File compiles with 0 errors

- [ ] **Step 1.4**: Fix trip.ts
  - Fix status property access on table type
  - Success criteria: File compiles with 0 errors

### Phase 2: Fix Easy Files (2-3 errors)

**Goal**: Apply patterns from Phase 1 to slightly more complex files.

**Depends on**: Phase 1 (patterns established)

**Blockers**: None (can be done in parallel after Phase 1)

**Subtasks**:
- [ ] **Step 2.1**: Fix group.ts
  - Fix GroupStatus import type vs value usage
  - Add `override` modifier
  - Success criteria: File compiles with 0 errors

- [ ] **Step 2.2**: Fix event.ts
  - Add `override` modifier to `create`
  - Fix query builder type issues
  - Success criteria: File compiles with 0 errors

- [ ] **Step 2.3**: Fix activity-feed.ts
  - Fix method signature mismatches (findByTripId, addReaction)
  - Fix Result type property access
  - Success criteria: File compiles with 0 errors

- [ ] **Step 2.4**: Fix sponsor.ts
  - Fix type constraint issues
  - Fix constructor argument count
  - Success criteria: File compiles with 0 errors

### Phase 3: Fix Medium Files (4-6 errors)

**Goal**: Handle files with multiple error types and dependencies.

**Depends on**: Phase 1 and 2 (patterns established)

**Blockers**: None (can be done in parallel after Phase 2)

**Subtasks**:
- [ ] **Step 3.1**: Fix reward.ts
  - Fix 4 method signature mismatches
  - Ensure return types match interface exactly
  - Success criteria: File compiles with 0 errors

- [ ] **Step 3.2**: Fix challenge-vote.ts
  - Fix type constraint issues with Partial
  - Fix constructor argument count
  - Fix VotePosition conversion error
  - Fix query overload issues
  - Success criteria: File compiles with 0 errors

- [ ] **Step 3.3**: Fix coin-transaction.ts
  - Fix type constraint issues
  - Fix constructor argument count
  - Fix number | undefined parameter issues
  - Fix method signature mismatch and add override
  - Success criteria: File compiles with 0 errors

- [ ] **Step 3.4**: Fix notification-delivery.ts
  - Fix type constraint issues
  - Fix constructor argument count
  - Fix number | undefined parameter issues (4 locations)
  - Success criteria: File compiles with 0 errors

- [ ] **Step 3.5**: Fix notification-schedule.ts
  - Fix missing export (NotificationScheduleRepository)
  - Fix type constraint issues
  - Fix constructor argument count
  - Fix findAll signature mismatch and add override
  - Fix query overload issues
  - Success criteria: File compiles with 0 errors

### Phase 4: Fix Heavy Files (7+ errors)

**Goal**: Resolve the most complex files with multiple interdependent issues.

**Depends on**: Phases 1-3 (all patterns learned)

**Blockers**: None (but these should be done after simpler files)

**Subtasks**:
- [ ] **Step 4.1**: Fix challenge-submission.ts
  - Add missing exports to use-cases package
  - Fix type constraint issues (Partial<Shape>)
  - Fix constructor argument count
  - Fix query builder type issues (5 locations)
  - Success criteria: File compiles with 0 errors
  - **Risk**: HIGH - May require changes to other packages

- [ ] **Step 4.2**: Fix submission-report.ts
  - Fix type constraint issues
  - Fix constructor argument count
  - Add missing override modifiers (2 methods)
  - Fix query builder limit/offset types
  - Success criteria: File compiles with 0 errors
  - **Risk**: MEDIUM - Complex query patterns

### Phase 5: Final Verification

**Goal**: Ensure all fixes work together and no regressions exist.

**Depends on**: All previous phases complete

**Blockers**: Phases 1-4 must be complete

**Subtasks**:
- [ ] **Step 5.1**: Run full type check
  - Run `bun tsc --noEmit` in adapters package
  - Verify zero errors in drizzle directory
  - Success criteria: Zero type errors

- [ ] **Step 5.2**: Run test suite
  - Run `bun test` in packages/adapters
  - Verify no test failures
  - Success criteria: All tests pass

- [ ] **Step 5.3**: Check for regressions
  - Review any new errors introduced
  - Verify in-memory repositories still work
  - Success criteria: No new issues

## Parallel Execution

### Parallel Groups

This task can be parallelized by file complexity, with each group depending on the previous:

```
Phase 1 (Simple) ───────┐
                        ├──> Phase 3 (Medium) ───> Phase 4 (Heavy)
Phase 2 (Easy) ─────────┘
```

**Group 1 - Phase 1 (Parallel)**:
- Step 1.1: Fix challenge.ts [Agent: sonnet]
- Step 1.2: Fix location.ts [Agent: sonnet]
- Step 1.3: Fix notification.ts [Agent: sonnet]
- Step 1.4: Fix trip.ts [Agent: sonnet]

**Group 2 - Phase 2 (Parallel)**:
- Step 2.1: Fix group.ts [Agent: sonnet]
- Step 2.2: Fix event.ts [Agent: sonnet]
- Step 2.3: Fix activity-feed.ts [Agent: sonnet]
- Step 2.4: Fix sponsor.ts [Agent: sonnet]

**Group 3 - Phase 3 (Parallel)**:
- Step 3.1: Fix reward.ts [Agent: sonnet]
- Step 3.2: Fix challenge-vote.ts [Agent: sonnet]
- Step 3.3: Fix coin-transaction.ts [Agent: sonnet]
- Step 3.4: Fix notification-delivery.ts [Agent: sonnet]
- Step 3.5: Fix notification-schedule.ts [Agent: opus]

**Group 4 - Phase 4 (Sequential recommended)**:
- Step 4.1: Fix challenge-submission.ts [Agent: opus] - HIGH PRIORITY
- Step 4.2: Fix submission-report.ts [Agent: opus]

**Group 5 - Phase 5 (Sequential)**:
- Step 5.1: Run full type check [Agent: sonnet]
- Step 5.2: Run test suite [Agent: sonnet]
- Step 5.3: Check for regressions [Agent: sonnet]

### Agent Assignment Guide

| Complexity | Error Count | Recommended Agent |
|------------|-------------|-------------------|
| Simple | 1 | sonnet |
| Easy | 2-3 | sonnet |
| Medium | 4-6 | sonnet |
| Heavy | 7+ | opus |
| Verification | - | sonnet |

### Critical Path

The critical path is:
1. Phase 1 (Simple files) - 30 min
2. Phase 3 (Medium files) - 2 hours
3. Phase 4 (Heavy files) - 2 hours
4. Phase 5 (Verification) - 30 min

**Total critical path**: ~5 hours

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing type exports from other packages | Medium | High | Add exports to domain/use-cases as needed |
| Query builder pattern changes require refactoring | Low | Medium | Consult Drizzle documentation, use type assertions |
| Circular dependencies introduced | Low | High | Review imports carefully, run dependency-cruiser |
| Test failures from type changes | Low | Medium | Run tests after each file, revert if needed |

## Verification

### Verification Summary

| Step | Level | Type | Threshold |
|------|-------|------|-----------|
| All phases | Per-Step | Type Check | Zero errors per file |
| Phase 5.1 | Panel | Full Type Check | 4.5/5.0 |
| Phase 5.2 | Panel | Test Suite | 4.5/5.0 |
| Phase 5.3 | Single | Regression Check | 4.0/5.0 |

### Phase 1-4: Per-File Verification

Each implementation step should be verified with:

**Verification Level**: Per-Item (each file)

**Rubric**:
1. File compiles without errors (weight: 0.50)
   - `bun tsc --noEmit` shows 0 errors for this file
   - 1=Errors remain, 5=Clean compile

2. No new warnings introduced (weight: 0.25)
   - No additional TypeScript warnings
   - 1=New warnings, 5=No new issues

3. Existing patterns preserved (weight: 0.25)
   - Code structure matches original
   - 1=Major changes, 5=Minimal changes

**Threshold**: 4.0/5.0 per file

### Phase 5.1: Full Type Check (Panel)

**Verification Level**: Panel (3 judges)

**Rubric**:
1. Zero type errors (weight: 0.40)
   - `bun tsc --noEmit` shows 0 errors in drizzle directory
   - 1=Errors remain, 3=Some errors, 5=Zero errors

2. Error reduction verified (weight: 0.30)
   - Error count reduced from ~138 to 0
   - 1=No reduction, 5=All errors resolved

3. No regressions in other areas (weight: 0.30)
   - No new errors introduced in other packages
   - 1=New errors elsewhere, 5=Clean across codebase

**Threshold**: 4.5/5.0 (requires 2 of 3 judges to pass)

### Phase 5.2: Test Suite (Panel)

**Verification Level**: Panel (3 judges)

**Rubric**:
1. All tests pass (weight: 0.50)
   - `bun test` in adapters package passes
   - 1=Tests fail, 3=Some pass, 5=All pass

2. No test modifications needed (weight: 0.25)
   - Type fixes don't break tests
   - 1=Tests need changes, 5=Tests work unchanged

3. Coverage maintained (weight: 0.25)
   - Code coverage not reduced
   - 1=Coverage dropped, 5=Coverage maintained

**Threshold**: 4.5/5.0 (requires 2 of 3 judges to pass)

### Phase 5.3: Regression Check (Single)

**Verification Level**: Single

**Rubric**:
1. In-memory repositories unaffected (weight: 0.40)
   - In-memory gateway implementations still work
   - 1=Broken, 3=Partial, 5=Fully functional

2. No runtime behavior changes (weight: 0.35)
   - Only type annotations changed
   - 1=Logic changed, 5=Types only

3. Build artifacts unchanged (weight: 0.25)
   - No changes to generated JavaScript
   - 1=Changes detected, 5=No changes

**Threshold**: 4.0/5.0

## Implementation Notes

### Sub-Agent Execution Directive

When implementing this task:

1. **CRITICAL**: Each repository file should be fixed independently
2. **CRITICAL**: Run `bun tsc --noEmit` after EACH file to verify
3. **CRITICAL**: Do not modify runtime logic - type annotations only
4. **CRITICAL**: Preserve all existing method implementations
5. **CRITICAL**: If a fix requires changes outside adapters package, document it

### Common Fix Patterns

1. **Add `override` modifier**:
   ```typescript
   // Before
   async findAll(options?: { limit?: number }): Promise<Entity[]> { }
   
   // After
   override async findAll(options?: { limit?: number }): Promise<Entity[]> { }
   ```

2. **Fix generic type parameters**:
   ```typescript
   // Before (wrong)
   class Repo extends BaseDrizzleRepository<Entity, Select, Partial<Shape>, ...>
   
   // After (correct)
   class Repo extends BaseDrizzleRepository<Entity, EntitySelect, EntityInsert, typeof table>
   ```

3. **Fix query builder patterns**:
   ```typescript
   // Before
   let query = this.db.select().from(this.table);
   if (limit) query = query.limit(limit) as typeof query;
   
   // After
   const records = await this.db
     .select()
     .from(this.table)
     .limit(limit ?? 100);
   ```

### Quality Gates

- **Phase 1-4 Gate**: Each file must pass individual type check
- **Phase 5 Gate**: Full type check + test suite must pass
- **Final Gate**: No regressions in other packages
