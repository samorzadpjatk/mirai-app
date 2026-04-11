# Fix Adapters Phase 3 - Controllers: Implementation Scratchpad

## Overview

This scratchpad contains detailed, actionable implementation steps for fixing TypeScript type errors in 9 controller files.

## Files and Error Mapping

### File 1: reward.ts (2 errors)

**Location**: `packages/adapters/src/controllers/reward.ts`

**Issues**:

1. Line 20: `UserRole` not exported from `@mirai-app/use-cases`
2. Line 467: `RewardPurchaseStatus` type mismatch

**Fix Pattern**:

- Change import: `import { UserRole } from "@mirai-app/domain";` instead of from use-cases
- Line 256, 428: Ensure `creatorRole` and `newStatus` casting is correct
- Line 152, 186, 219, 259, 327, 356, 395, 435, 472, 526: Error handling - use `result.error.message` instead of `result.error`

**Concrete Steps**:

1. [ ] Line 20: Replace `UserRole` import source from `@mirai-app/use-cases` to `@mirai-app/domain`
2. [ ] Line 152: Change `error: result.error` to `error: result.error.message`
3. [ ] Line 186: Change `error: result.error` to `error: result.error.message`
4. [ ] Line 219: Change `error: result.error` to `error: result.error.message`
5. [ ] Line 259: Change `error: result.error` to `error: result.error.message`
6. [ ] Line 294: Change `error: result.error` to `error: result.error.message`
7. [ ] Line 327: Change `error: result.error` to `error: result.error.message`
8. [ ] Line 356: Change `error: result.error` to `error: result.error.message`
9. [ ] Line 395: Change `error: result.error` to `error: result.error.message`
10. [ ] Line 435: Change `error: result.error` to `error: result.error.message`
11. [ ] Line 472: Change `error: result.error` to `error: result.error.message`
12. [ ] Line 526: Change `error: result.error` to `error: result.error.message`

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for reward.ts
- [ ] Import resolves correctly (no TS2305)
- [ ] All error handlers return string messages

---

### File 2: storage.ts (1 error)

**Location**: `packages/adapters/src/controllers/storage.ts`

**Issues**:

1. Line 2: Cannot find module '@supabase/supabase-js'

**Fix Pattern**:

- The SupabaseClient type needs to be imported from the correct location or defined locally
- Option 1: Import from `@mirai-app/frameworks/supabase` (if it re-exports)
- Option 2: Create a local type definition for the needed SupabaseClient interface

**Concrete Steps**:

1. [ ] Line 2: Check if SupabaseClient can be imported from `@mirai-app/frameworks/supabase`
2. [ ] If not available, create minimal interface:
   ```typescript
   interface SupabaseClient {
     storage: {
       from(bucket: string): {
         createSignedUploadUrl(
           path: string,
           options?: { upsert?: boolean },
         ): Promise<{ data: { token: string } | null; error: Error | null }>;
         createSignedUrl(
           path: string,
           expiresIn: number,
         ): Promise<{
           data: { signedUrl: string } | null;
           error: Error | null;
         }>;
       };
     };
   }
   ```
3. [ ] Or use `import type { SupabaseClient } from "@supabase/supabase-js"` with proper dependency

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for storage.ts
- [ ] No TS2307 module not found errors

---

### File 3: coin.ts (2 errors)

**Location**: `packages/adapters/src/controllers/coin.ts`

**Issues**:

1. Line 79: Type 'string | null | undefined' not assignable to 'string | null'
2. Line 127: Type 'string | null | undefined' not assignable to 'string | null'

**Fix Pattern**:

- Pattern 2: Nullable Field Alignment - use `value ?? null` normalization
- The `reason` field from use-case output is `string | null | undefined` but controller expects `string | null`

**Concrete Steps**:

1. [ ] Line 79: Change `reason: result.value.transaction.reason` to `reason: result.value.transaction.reason ?? null`
2. [ ] Line 127: Change `reason: result.value.transaction.reason` to `reason: result.value.transaction.reason ?? null`
3. [ ] Lines 71, 119: Change `error: result.error` to `error: result.error.message`

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for coin.ts
- [ ] TS2322 errors at lines 79, 127 resolved
- [ ] All nullable fields properly normalized

---

### File 4: notification-schedule.ts (2 errors)

**Location**: `packages/adapters/src/controllers/notification-schedule.ts`

**Issues**:

1. Line 196: NotificationScheduleFilter type mismatch
2. Line 197: PaginationOptions type mismatch

**Fix Pattern**:

- Pattern 4: Import filter types from use-cases
- Need to import proper types for filter and pagination

**Concrete Steps**:

1. [ ] Add import: `import type { NotificationScheduleFilters, PaginationOptions } from "@mirai-app/use-cases";`
2. [ ] Line 196: Ensure filter type matches by casting or using proper type
3. [ ] Line 197: Ensure pagination type matches by casting or using proper type
4. [ ] Review all error handlers (lines 201, 225, 239, 265, 303, 338, 366, 394, 421, 450, 480, 509) to use `result.error.message`

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for notification-schedule.ts
- [ ] Filter and pagination types align with use-case expectations
- [ ] All error handlers return string messages

---

### File 5: notification.ts (6 errors)

**Location**: `packages/adapters/src/controllers/notification.ts`

**Issues**:

1. Line 223: ValidationError not assignable to string
2. Line 300: StateTransitionError not assignable to string
3. Line 311-319: Property access on Result type
4. Line 400: Result<Notification, StateTransitionError> not assignable to Notification

**Fix Pattern**:

- Pattern 3: Result Type Handling - check `result.kind === "ok"` before accessing value
- Pattern 4: Error to String Conversion - use `error.message` for TRPCError

**Concrete Steps**:

1. [ ] Line 126: Change `error: result.error` to `error: result.error.message`
2. [ ] Line 223: Change `error: notificationResult.error` to `error: notificationResult.error.message`
3. [ ] Lines 293-304: Fix updateContent result handling
   - Line 300: Change `error: contentResult.error` to `error: contentResult.error.message`
4. [ ] Lines 307-316: Fix updatePriority result handling
   - Line 312: Change `error: priorityResult.error` to `error: priorityResult.error.message`
5. [ ] Lines 318-328: Fix updateSchedule result handling
   - Line 324: Change `error: scheduleResult.error` to `error: scheduleResult.error.message`
6. [ ] Line 394: `updateStatus` returns `Notification`, not `Result`, so wrap in try-catch OR check if it returns Result

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for notification.ts
- [ ] All Result types properly unwrapped with kind checks
- [ ] All error messages converted to strings

---

### File 6: trip.ts (5 errors)

**Location**: `packages/adapters/src/controllers/trip.ts`

**Issues**:

1. Line 185: Error type to string conversion
2. Line 264: Error type to string conversion
3. Line 281: Error type to string conversion
4. Line 338: Property access (canTransitionTo) on Trip entity
5. Line 347: Property access (updateStatus) on Trip entity

**Fix Pattern**:

- Pattern 3: Result Type Handling
- Pattern 4: Error to String Conversion

**Concrete Steps**:

1. [ ] Line 185: Change `error: tripResult.error` to `error: tripResult.error.message`
2. [ ] Line 264: Change `error: detailsResult.error` to `error: detailsResult.error.message`
3. [ ] Line 281: Change `error: datesResult.error` to `error: datesResult.error.message`
4. [ ] Line 338: `canTransitionTo` is a method on Trip entity, verify it exists and returns correct type
5. [ ] Line 347: `updateStatus` returns `Trip`, not `Result`, so wrap in try-catch OR check if it returns Result

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for trip.ts
- [ ] All Result types properly unwrapped
- [ ] All error messages converted to strings

---

### File 7: challenge-submission.ts (3 errors)

**Location**: `packages/adapters/src/controllers/challenge-submission.ts`

**Issues**:

1. Line 137: GetSubmissionOutput mismatch
2. Line 202: GetSubmissionByChallengeAndGroupOutput mismatch
3. Line 273: ListSubmissionsByChallengeOutput mismatch

**Fix Pattern**:

- Pattern 1: Output Type Mismatch - import and use use-case output types directly

**Concrete Steps**:

1. [ ] Add imports:
   ```typescript
   import type {
     GetSubmissionOutput,
     GetSubmissionByChallengeAndGroupOutput,
     ListSubmissionsByChallengeOutput,
   } from "@mirai-app/use-cases";
   ```
2. [ ] Line 137: Update return type to use `GetSubmissionOutput` directly
3. [ ] Line 202: Update return type to use `GetSubmissionByChallengeAndGroupOutput` directly
4. [ ] Line 273: Update return type to use `ListSubmissionsByChallengeOutput` directly
5. [ ] Fix all error handlers (lines 134, 199, 271, 325, 388, 417) to use `result.error.message`

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for challenge-submission.ts
- [ ] Output types imported from use-cases
- [ ] Return types align with use-case outputs

---

### File 8: challenge-vote.ts (1 error)

**Location**: `packages/adapters/src/controllers/challenge-vote.ts`

**Issues**:

1. Line 360: ChallengeSubmissionRepository interface mismatch

**Fix Pattern**:

- Repository interface needs to align with use-case expectations

**Concrete Steps**:

1. [ ] Add import: `import type { ChallengeSubmissionRepository } from "@mirai-app/use-cases";`
2. [ ] Line 88-100: Replace inline interface with imported type
3. [ ] Fix all error handlers to use `result.error.message` (lines 136, 171, 204, 248, 285, 320, 371)

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for challenge-vote.ts
- [ ] Repository interface imported from use-cases
- [ ] No inline interface definitions that duplicate use-case types

---

### File 9: coin-transaction.ts (1 error)

**Location**: `packages/adapters/src/controllers/coin-transaction.ts`

**Issues**:

1. Line 236: GetCoinAdditionalInsightsOutput mismatch

**Fix Pattern**:

- Pattern 1: Output Type Mismatch

**Concrete Steps**:

1. [ ] Add import: `import type { GetCoinAdditionalInsightsOutput } from "@mirai-app/use-cases";`
2. [ ] Line 212-225: Update return type to use `GetCoinAdditionalInsightsOutput | null` directly
3. [ ] Or map the fields properly if structure differs
4. [ ] Fix all error handlers (lines 87, 112, 156, 203, 233, 279) to use `result.error.message`

**Success Criteria**:

- [ ] `bun tsc --noEmit` shows 0 errors for coin-transaction.ts
- [ ] Output type imported from use-cases
- [ ] Return type aligns with use-case output

---

## Implementation Order

### Wave 1: Import/Nullable Fixes (4 files - Can run in parallel)

1. **reward.ts** - Fix UserRole import + error.message
2. **storage.ts** - Fix SupabaseClient import
3. **coin.ts** - Fix nullable normalization + error.message
4. **notification-schedule.ts** - Fix filter types + error.message

### Wave 2: Result Pattern Fixes (2 files - Can run in parallel)

1. **notification.ts** - Fix Result unwrapping + error.message
2. **trip.ts** - Fix Result unwrapping + error.message

### Wave 3: Output Type Fixes (3 files - Can run in parallel)

1. **challenge-submission.ts** - Import and use output types
2. **challenge-vote.ts** - Import repository interface
3. **coin-transaction.ts** - Import and use output type

## Verification Steps

After each file fix:

1. Run `cd packages/adapters && bun tsc --noEmit --noEmitOnError 2>&1 | grep <filename>`
2. Verify no errors for that file
3. Run `bun test` in packages/adapters to ensure no runtime regressions

Final verification:

```bash
cd packages/adapters
bun tsc --noEmit  # Should show 0 errors
bun test          # Should pass all tests
```

## Critical Notes

1. **Error Message Pattern**: Everywhere `result.error` is returned directly, change to `result.error.message`
2. **Result Unwrapping**: Always check `result.kind === "ok"` before accessing `result.value`
3. **Nullable Fields**: Use `?? null` to normalize `undefined` to `null`
4. **Type Imports**: Use `import type` for type-only imports to avoid circular dependencies
