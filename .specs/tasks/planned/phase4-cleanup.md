# Phase 4: Cleanup and Validation

**Task:** Remove dead code, update exports, validate the entire refactor  
**Estimated Time:** 1-2 hours  
**Depends On:** Phases 1, 2, 3 (infrastructure, nesting, entity refactoring)  
**Design Reference:** `.specs/plans/simplify-domain-entities.design.md` Section 6 & Appendix A

---

## Goal

Finalize the domain entity simplification by removing all dead code, updating barrel exports, ensuring documentation consistency, and validating the entire refactor passes all quality gates.

---

## Pre-Implementation Checklist

- [ ] Phases 1, 2, 3 are complete and merged
- [ ] All entity files have been refactored using new utilities
- [ ] All tests pass from Phase 3
- [ ] Branch is clean with no uncommitted changes

---

## Step-by-Step Implementation

### Step 1: Remove Obsolete Test Files

Delete the following test files that correspond to entities converted to nested interfaces or removed:

| Test File                               | Reason                                  |
| --------------------------------------- | --------------------------------------- |
| `ChallengeActivity.test.ts`             | Entity nested into ActivityFeed         |
| `RankChangeActivity.test.ts`            | Entity nested into ActivityFeed         |
| `SubmissionActivity.test.ts`            | Entity nested into ActivityFeed         |
| `UserPost.test.ts`                      | Entity nested into ActivityFeed         |
| `TripInsuranceStep.test.ts`             | Entity nested into TripInsurance        |
| `NotificationPush.test.ts`              | Entity nested into NotificationDelivery |
| `NotificationScheduleExecution.test.ts` | Entity removed entirely                 |

**Command:**

```bash
rm packages/domain/src/entities/ChallengeActivity.test.ts \
   packages/domain/src/entities/RankChangeActivity.test.ts \
   packages/domain/src/entities/SubmissionActivity.test.ts \
   packages/domain/src/entities/UserPost.test.ts \
   packages/domain/src/entities/TripInsuranceStep.test.ts \
   packages/domain/src/entities/NotificationPush.test.ts \
   packages/domain/src/entities/NotificationScheduleExecution.test.ts
```

---

### Step 2: Clean Up Unused Imports in Entity Files

Scan all entity files and remove unused imports:

**Common imports to check for removal:**

- Imports of deleted child entities (e.g., `ChallengeActivity`, `RankChangeActivity`)
- Old validation constants that have been replaced by `validate.*` utilities
- Unused `VALIDATION_RULES` constants within files
- Unused helper imports if any remain

**Files requiring import cleanup (after Phases 1-3):**

| File                      | Cleanup Actions                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `ActivityFeed.ts`         | Remove imports of `ChallengeActivity`, `RankChangeActivity`, `SubmissionActivity`, `UserPost` |
| `TripInsurance.ts`        | Remove imports of `TripInsuranceStep`                                                         |
| `NotificationDelivery.ts` | Remove imports of `NotificationPush`, `NotificationScheduleExecution`                         |
| `Challenge.ts`            | Remove old `VALIDATION_RULES` if still present                                                |
| `Notification.ts`         | Remove old validation constants if still present                                              |
| `Trip.ts`                 | Remove old validation constants if still present                                              |
| `Group.ts`                | Remove old validation constants if still present                                              |
| `RewardPurchase.ts`       | Remove old validation constants if still present                                              |

**Pattern to remove from files:**

```typescript
// Remove these constants if they still exist:
const VALIDATION_RULES = { ... };
const VALID_STATUS_TRANSITIONS = { ... };
```

---

### Step 3: Update Barrel Exports (`packages/domain/src/index.ts`)

#### 3.1 Remove Exports of Deleted/Nested Entities

Remove the following export lines from `packages/domain/src/index.ts`:

```typescript
// REMOVE these lines (entities now nested or deleted):
export * from "./entities/TripInsuranceStep";
export * from "./entities/SubmissionActivity";
export * from "./entities/ChallengeActivity";
export * from "./entities/RankChangeActivity";
export * from "./entities/UserPost";
export * from "./entities/NotificationScheduleExecution";
export * from "./entities/NotificationPush";
```

#### 3.2 Add Exports for New Utilities

Add the following new exports to `packages/domain/src/index.ts`:

```typescript
// NEW: Domain error types (created in Phase 1)
export {
  DomainError,
  ValidationError,
  StateTransitionError,
  NotFoundError,
} from "./errors/domain-errors";

// NEW: Entity validation framework (created in Phase 1)
export {
  validate,
  type StringRule,
  type NumberRule,
} from "./utils/entity-validation";

// NEW: State machine factory (created in Phase 1)
export {
  createStateMachine,
  type StateMachineConfig,
} from "./utils/state-machine";

// NEW: Immutable update helpers (created in Phase 1)
export {
  timestamps,
  withUpdatedAt,
  updateEntity,
  type Timestamps,
} from "./utils/immutable";

// NEW: Entity helper functions (created in Phase 1)
export { entityHelpers } from "./utils/entity-helpers";
```

**Note:** Add the new utility exports after the existing `utils/validation` section.

---

### Step 4: Update Documentation (`CLAUDE.md`)

Review and update `CLAUDE.md` for references to old patterns:

#### 4.1 Check for References to Old Entity Patterns

Search for and update the following if present:

- [ ] References to `VALIDATION_RULES` constants → Update to `validate.*` utilities
- [ ] References to status machine implementations in entities → Update to `createStateMachine`
- [ ] References to `new Date()` timestamp updates → Update to `updateEntity()` helper
- [ ] References to deleted entities (`ChallengeActivity`, etc.) → Update to parent entities

#### 4.2 Add Section on New Utilities (Optional)

Consider adding a brief section documenting the new utilities:

```markdown
### Domain Entity Utilities

The domain layer provides shared utilities for common patterns:

- **Validation:** `validate.string()`, `validate.number()`, etc.
- **State Machines:** `createStateMachine()` for status workflows
- **Immutable Updates:** `updateEntity()`, `timestamps()` helpers
- **Error Types:** `ValidationError`, `StateTransitionError`, etc.
```

#### 4.3 Update Architecture Diagram if Necessary

If the architecture diagram mentions specific entities, ensure:

- Deleted entities are not listed as standalone
- Nested structures are correctly represented

---

### Step 5: Verify No Stray References in Other Files

Search the codebase for any remaining references to deleted entities:

```bash
# Search for deleted entity names (should return nothing after cleanup)
grep -r "ChallengeActivity" packages/ --include="*.ts" | grep -v ".test.ts" | grep -v "node_modules"
grep -r "RankChangeActivity" packages/ --include="*.ts" | grep -v ".test.ts" | grep -v "node_modules"
grep -r "SubmissionActivity" packages/ --include="*.ts" | grep -v ".test.ts" | grep -v "node_modules"
grep -r "TripInsuranceStep" packages/ --include="*.ts" | grep -v ".test.ts" | grep -v "node_modules"
grep -r "NotificationPush" packages/ --include="*.ts" | grep -v ".test.ts" | grep -v "node_modules"
grep -r "NotificationScheduleExecution" packages/ --include="*.ts" | grep -v ".test.ts" | grep -v "node_modules"
grep -r "UserPost" packages/ --include="*.ts" | grep -v ".test.ts" | grep -v "node_modules"
```

**Action:** Remove or update any found references.

---

## Validation Commands

Run the following validation commands in order:

### 1. Run Full Test Suite

```bash
bun test
```

**Expected:** All tests pass (no failures, no errors)

---

### 2. Run Coverage Check

```bash
bun test --coverage
```

**Expected:**

- Coverage maintained at or above pre-refactor levels
- No significant drops in any file
- All new utilities have coverage

---

### 3. Run Dependency Cruiser

```bash
bunx dependency-cruiser --validate .dependency-cruiser.mjs .
```

**Expected:** No violations (no domain layer imports from outer layers)

---

### 4. Run TypeScript Build

```bash
bun run build
```

**Expected:** TypeScript compiles successfully with no errors

---

### 5. Run Linter

```bash
bun run lint
```

**Expected:** No lint errors in modified files

---

## Summary of Changes

### Files to Delete

| File                                  | Path                            |
| ------------------------------------- | ------------------------------- |
| ChallengeActivity.test.ts             | `packages/domain/src/entities/` |
| RankChangeActivity.test.ts            | `packages/domain/src/entities/` |
| SubmissionActivity.test.ts            | `packages/domain/src/entities/` |
| UserPost.test.ts                      | `packages/domain/src/entities/` |
| TripInsuranceStep.test.ts             | `packages/domain/src/entities/` |
| NotificationPush.test.ts              | `packages/domain/src/entities/` |
| NotificationScheduleExecution.test.ts | `packages/domain/src/entities/` |

### Files to Modify

| File                           | Changes                                            |
| ------------------------------ | -------------------------------------------------- |
| `packages/domain/src/index.ts` | Remove 7 entity exports, add 4 new utility exports |
| `CLAUDE.md`                    | Update any references to old patterns              |
| Entity files                   | Remove unused imports, validation constants        |

### New Utilities to Export (Phase 1 Artifacts)

- `packages/domain/src/errors/domain-errors.ts` - Error types
- `packages/domain/src/utils/entity-validation.ts` - Validation framework
- `packages/domain/src/utils/state-machine.ts` - State machine factory
- `packages/domain/src/utils/immutable.ts` - Update helpers
- `packages/domain/src/utils/entity-helpers.ts` - Common query methods

---

## Definition of Done

All of the following must be true:

- [ ] **Test Suite:** `bun test` passes with 0 failures
- [ ] **Coverage:** `bun test --coverage` shows maintained or improved coverage
- [ ] **Dependencies:** `bunx dependency-cruiser` reports 0 violations
- [ ] **Build:** `bun run build` succeeds with no TypeScript errors
- [ ] **Lint:** `bun run lint` passes
- [ ] **No Dead Code:** All 7 obsolete test files deleted
- [ ] **Clean Exports:** Barrel file updated (7 removals, 4+ additions)
- [ ] **Clean Imports:** No unused imports remain in entity files
- [ ] **Documentation:** CLAUDE.md updated if needed
- [ ] **No Stray References:** grep searches return no references to deleted entities

---

## Post-Implementation

After Phase 4 is complete:

1. **Create PR** summarizing all 4 phases
2. **Final review** by team
3. **Merge** to main
4. **Delete feature branch**

---

## Risk Assessment

| Risk                          | Likelihood | Mitigation                                      |
| ----------------------------- | ---------- | ----------------------------------------------- |
| Missed import cleanup         | Medium     | Run `grep` searches, compiler will catch errors |
| Coverage drop                 | Low        | Run coverage check, add tests if needed         |
| Documentation inconsistency   | Low        | Search CLAUDE.md for old patterns               |
| Dependency cruiser violations | Low        | Run cruiser validation, fix any issues          |

---

**Ready for Implementation:** This plan can be executed once Phases 1-3 are complete.
