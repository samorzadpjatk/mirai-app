# Codebase Analysis: Fix Adapters Phase 3 - Controllers

Task: Fix adapters package controller DTO alignment (Phase 3)
Analysis Date: 2026-04-11

---

## Files Affected

### High Priority (Direct Type Errors)

1. **challenge-submission.ts** (3 errors)
   - Line 137: GetSubmissionOutput mismatch
   - Line 202: GetSubmissionByChallengeAndGroupOutput mismatch  
   - Line 273: ListSubmissionsByChallengeOutput mismatch
   - **Fix**: Use use-case output types directly or create proper mappers

2. **challenge-vote.ts** (1 error)
   - Line 360: ChallengeSubmissionRepository interface mismatch
   - **Fix**: Align repository interface with implementation

3. **coin-transaction.ts** (1 error)
   - Line 236: GetCoinAdditionalInsightsOutput mismatch
   - **Fix**: Align output type with use-case return type

4. **coin.ts** (2 errors)
   - Line 79, 127: Type 'string | null | undefined' not assignable to 'string | null'
   - **Fix**: Normalize nullable fields at boundary

5. **notification-schedule.ts** (2 errors)
   - Line 196: NotificationScheduleFilter mismatch
   - Line 197: PaginationOptions mismatch
   - **Fix**: Import filter types from use-cases

6. **notification.ts** (6 errors)
   - Line 223, 300: ValidationError/StateTransitionError not assignable to string
   - Line 311-319: Property access on Notification type (kind, error, value, updateSchedule)
   - Line 400: Result<Notification, StateTransitionError> not assignable to Notification
   - **Fix**: Properly unwrap Result types before accessing properties

7. **reward.ts** (2 errors)
   - Line 20: UserRole not exported from use-cases
   - Line 467: RewardPurchaseStatus type mismatch
   - **Fix**: Update imports and status enum alignment

8. **storage.ts** (1 error)
   - Line 2: Cannot find module '@supabase/supabase-js'
   - **Fix**: Check dependency or install types

9. **trip.ts** (5 errors)
   - Line 185, 264, 281: Error type to string conversion
   - Line 338, 347: Property access (canTransitionTo, updateStatus) on Trip entity
   - **Fix**: Similar to notification.ts - unwrap Result types

### Integration Points

1. **Use Case Dependencies**
   - All controllers depend on use-cases package
   - Key imports needed from @mirai-app/use-cases:
     - Output DTO types
     - Filter interfaces
     - Repository interfaces

2. **Repository Pattern**
   - Controllers use repositories via DI
   - Interface mismatches in ChallengeSubmissionRepository

3. **Error Handling**
   - Controllers need to convert Error objects to strings for tRPC
   - Result<T,E> pattern needs proper unwrapping

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking changes to controller signatures | Medium | Update all callers |
| Missing error handling paths | Low | Add comprehensive error cases |
| Type dependencies | Low | Import types from use-cases |
| Test coverage gaps | Medium | Run tests after each fix |

## Key Integration Patterns

1. **DTO Alignment Pattern**
   ```typescript
   // Import from use-cases
   import type { GetSubmissionOutput } from "@mirai-app/use-cases";
   
   // Use directly in controller
   async getSubmission(): Promise<GetSubmissionOutput> { }
   ```

2. **Result Unwrapping Pattern**
   ```typescript
   const result = await useCase.execute(input);
   if (result.kind === "ok") {
     return result.value;
   } else {
     throw new TRPCError({ message: result.error.message });
   }
   ```

3. **Nullable Normalization Pattern**
   ```typescript
   field: value ?? null  // Convert undefined to null
   ```

## Files to Modify

| File | Changes Needed |
|------|----------------|
| challenge-submission.ts | 3 type alignments |
| challenge-vote.ts | 1 interface fix |
| coin-transaction.ts | 1 type alignment |
| coin.ts | 2 nullable fixes |
| notification-schedule.ts | 2 filter type fixes |
| notification.ts | 6 error/result fixes |
| reward.ts | 2 import/type fixes |
| storage.ts | 1 dependency fix |
| trip.ts | 5 error/result fixes |

Total: ~20 errors across 9 files
