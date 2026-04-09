---
title: Fix use-cases TypeScript strict-mode errors
type: chore
---

## Initial User Prompt

Fix TypeScript strict-mode errors in packages/use-cases caused by exactOptionalPropertyTypes and verbatimModuleSyntax settings

## Description

### Problem Statement

The use-cases package has **35+ TypeScript compilation errors** related to strict mode settings:

1. **TS1484 (verbatimModuleSyntax)**: Types are imported using regular imports instead of type-only imports
   - Example: `import { Result } from "../utils/result"` should be `import type { Result } from "../utils/result"`
2. **TS2379 (exactOptionalPropertyTypes)**: Optional properties can't accept undefined values directly
   - When a property is defined as `prop?: string`, passing `undefined` explicitly causes an error
   - The type needs to be `prop?: string | undefined` OR the property should be omitted when undefined

### Error Patterns

**Pattern 1 - verbatimModuleSyntax:**

```typescript
// Before (ERROR):
import { Result } from "../utils/result";
import { CreateChallengeInput } from "../dto/input/CreateChallengeInput";

// After (FIXED):
import type { Result } from "../utils/result";
import type { CreateChallengeInput } from "../dto/input/CreateChallengeInput";
```

**Pattern 2 - exactOptionalPropertyTypes:**

```typescript
// Before (ERROR):
const data = {
  description: input.description, // string | null | undefined
  image: input.image, // string | null | undefined
};
// Type '{ description: string | null | undefined; }' not assignable...

// After (FIXED) - Option 1: Use conditional spread:
const data = {
  ...(input.description !== undefined && { description: input.description }),
  ...(input.image !== undefined && { image: input.image }),
};

// After (FIXED) - Option 2: Create clean object:
const data: CreateChallengeInput = {
  tripId: input.tripId,
  name: input.name,
  description: input.description ?? null, // Convert undefined to null
  image: input.image ?? null,
  // ... only include defined values
};
```

## Scope

### Included

- Fix all TS1484 errors (type-only imports)
- Fix all TS2379 errors (optional property handling)
- Files in `packages/use-cases/src/interactors/`
- Test files in `packages/use-cases/src/interactors/*.test.ts`

### Excluded

- No changes to runtime logic
- No changes to business logic
- No changes to test assertions
- No changes to other packages

## Acceptance Criteria

### Functional Requirements

- [ ] **Zero TS1484 errors**: All type imports use `import type` syntax
- [ ] **Zero TS2379 errors**: All optional property assignments are type-compatible
- [ ] **Build passes**: `bun run build` in use-cases package completes without errors
- [ ] **Tests pass**: All existing tests continue to work

### Definition of Done

- [ ] All TypeScript strict-mode errors resolved
- [ ] Build succeeds in use-cases package
- [ ] No functional changes introduced
- [ ] All existing tests pass

## Implementation Process

### Phase 1: Fix verbatimModuleSyntax Errors (Type Imports)

#### Step 1.1: Fix Result Type Imports

**Files to modify:**

- src/interactors/CreateChallenge.ts
- src/interactors/CreateNotificationSchedule.ts
- src/interactors/CreateSubmission.ts
- src/interactors/GetChallengeVotingProgress.ts
- src/interactors/GetNotificationSchedules.ts
- src/interactors/PurchaseReward.ts

**Change:** Convert `import { Result }` to `import type { Result }`

**Success Criteria:**

- All Result imports use type-only syntax
- No TS1484 errors for Result type

---

#### Step 1.2: Fix DTO Type Imports

**Files to modify:**

- src/interactors/CreateChallenge.test.ts - CreateChallengeInput
- src/interactors/CreateUser.test.ts - CreateUserInput, Result
- src/interactors/GetChallenge.test.ts - GetChallengeInput
- src/interactors/GetNotification.test.ts - GetNotificationInput
- src/interactors/GetNotificationSchedules.ts - NotificationScheduleFilter, PaginationOptions
- src/interactors/GetUser.test.ts - GetUserInput

**Change:** Convert DTO imports to type-only imports

**Success Criteria:**

- All DTO type imports use `import type`
- No TS1484 errors for any type imports

---

### Phase 2: Fix exactOptionalPropertyTypes Errors

#### Step 2.1: Fix CreateChallenge.ts

**Issue:** Line 66 - object literal with undefined values for optional properties

**Fix Strategy:** Use conditional spread or null coalescing to handle undefined values

**Success Criteria:**

- TS2379 error resolved
- No runtime behavior change

---

#### Step 2.2: Fix CreateLocation.ts

**Issues:** Lines 57 and 75 - location data with optional coordinates

**Fix Strategy:** Filter out undefined values or use type assertions where safe

**Success Criteria:**

- Both TS2379 errors resolved
- Location creation works correctly

---

#### Step 2.3: Fix CreateNotificationSchedule.ts

**Issue:** Line 59 - schedule data with optional fields

**Fix Strategy:** Clean data object with only defined values

**Success Criteria:**

- TS2379 error resolved
- Schedule creation works correctly

---

#### Step 2.4: Fix CreateReport.ts

**Issue:** Line 52 - report data with optional details

**Fix Strategy:** Handle optional details field

**Success Criteria:**

- TS2379 error resolved
- Report creation works correctly

---

#### Step 2.5: Fix CreateReward.ts

**Issue:** Line 73 - reward data with optional images and isHidden

**Fix Strategy:** Clean data object with only defined values

**Success Criteria:**

- TS2379 error resolved
- Reward creation works correctly

---

#### Step 2.6: Fix CreateSponsor.ts

**Issue:** Line 46 - sponsor data with optional numeric fields

**Fix Strategy:** Handle optional numeric fields

**Success Criteria:**

- TS2379 error resolved
- Sponsor creation works correctly

---

#### Step 2.7: Fix CreateSubmission.ts

**Issue:** Line 66 - submission data with optional fields

**Fix Strategy:** Clean data object with only defined values

**Success Criteria:**

- TS2379 error resolved
- Submission creation works correctly

---

#### Step 2.8: Fix Remaining Files

**Files:**

- AddCoins.ts (line 59)
- RemoveCoins.ts (line 68)
- DuplicateNotificationSchedule.ts (line 43)
- GetActivityFeed.ts (line 71)
- GetNotificationSchedules.ts (line 69)
- GetPurchaseHistory.ts (line 83)
- ListSubmissionsByChallenge.ts (line 67)
- BulkDeleteNotificationSchedules.ts (line 56)
- CreateActivity.ts (lines 95, 96)
- GetDeliveryByNotificationId.ts
- GetCoinAdditionalInsights.ts (lines 60, 61)
- GetCoinQuickStats.ts (lines 68, 76)
- GetMostActiveAdminStats.ts (lines 45, 46, 47)

**Fix Strategy:** Apply same patterns - conditional spreads or clean data objects

**Success Criteria:**

- All TS2379 errors resolved
- No functional changes

---

### Phase 3: Final Verification

#### Step 3.1: Verify Build Success

**Goal:** Ensure all errors are resolved

**Verification:**

- Run `bun run build` in packages/use-cases
- Confirm zero TypeScript errors
- Confirm build completes successfully

**Success Criteria:**

- Build passes with 0 errors
- No new warnings introduced

---

#### Step 3.2: Verify Tests Pass

**Goal:** Ensure no test regressions

**Verification:**

- Run `bun test` in packages/use-cases
- Confirm all tests pass
- Verify no test logic was accidentally changed

**Success Criteria:**

- All tests pass
- No functional regressions

---

## Verification

### Phase 1 Verification: Type Import Fixes

**Level**: Per-File Judge
**Threshold**: 4.0/5.0

**Rubric:**

- Import correctness: All type imports use correct syntax
- No value imports: No runtime imports accidentally converted
- File compilation: Each file compiles without TS1484

### Phase 2 Verification: Optional Property Fixes

**Level**: Per-File Judge  
**Threshold**: 4.0/5.0

**Rubric:**

- Type safety: No `any` types introduced
- Function preservation: All business logic unchanged
- Error resolution: TS2379 errors eliminated

### Phase 3 Verification: Final Validation

**Level**: Single Judge + Build/Test Verification
**Threshold**: 4.5/5.0

**Rubric:**

- Build success: 0 TypeScript errors
- Test pass: All tests succeed
- No regressions: No functional changes

## Parallelization

### Execution Strategy

**Track A: Type Imports (Phase 1)**

- Can be done in parallel across files
- Independent changes
- Estimated: 10-15 files

**Track B: Optional Properties (Phase 2)**

- Can be done in parallel across files
- Independent changes
- Estimated: 15-20 files

**Phase 3: Verification**

- Sequential, depends on both tracks
- Build and test verification

### Agent Assignments

| Track | Files          | Pattern            | Model  |
| ----- | -------------- | ------------------ | ------ |
| A     | Type imports   | Simple replacement | sonnet |
| B     | Optional props | Conditional logic  | sonnet |
| 3     | Verification   | Build/test         | sonnet |

## Definition of Done (Task Level)

- [ ] All TS1484 errors fixed (verbatimModuleSyntax)
- [ ] All TS2379 errors fixed (exactOptionalPropertyTypes)
- [ ] `bun run build` passes in use-cases
- [ ] All tests pass
- [ ] No functional changes introduced
- [ ] Task moved to done folder
