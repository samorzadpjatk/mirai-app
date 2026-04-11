# Adapters Package Type Error Fix Plan

## Overview

Fix 338 pre-existing TypeScript errors in the adapters package. These errors accumulated during refactoring and fall outside the scope of the throwing use case work. This plan organizes fixes into six phases based on dependencies and complexity.

## Phase Summary

| Phase | Focus | Errors | Effort |
|-------|-------|--------|--------|
| **1** | Missing dependencies and modules | ~38 | 2-3 hours |
| **2** | Error classes and DI modules | ~15 | 1-2 hours |
| **3** | Controller DTO alignment | ~20 | 3-4 hours |
| **4** | Mapper fixes | ~45 | 4-5 hours |
| **5** | Drizzle repository fixes | ~180 | 8-10 hours |
| **6** | Test file fixes | ~40 | 3-4 hours |

**Total estimated effort:** 21-28 hours over 6 phases

---

## Phase 1: Missing Dependencies (~38 errors)

### Files Affected

- `gateways/storage/SupabaseStorageAdapter.ts` (22 errors)
- `services/notification-service.ts` (19 errors)
- `mappers/index.ts` (17 errors)
- `gateways/realtime/SupabaseRealtimeAdapter.ts` (9 errors)
- `controllers/storage.ts` (1 error)

### Fixes Required

1. **Add @supabase/supabase-js dependency**
   - Install package if missing from package.json
   - This resolves TS2307 "Cannot find module" errors

2. **Fix gateway exports**
   - Update `gateways/index.ts` to export all required modules
   - Ensure barrel file includes all adapter implementations

3. **Fix mapper exports**
   - Update `mappers/index.ts` to include all drizzle mappers
   - Add missing exports for new entity mappers

4. **Fix domain/use-cases exports**
   - Ensure `@mirai-app/domain` exports all required types
   - Ensure `@mirai-app/use-cases` exports all ports and DTOs

### Success Criteria

- All TS2307 module resolution errors resolve
- Imports from @mirai-app packages work correctly
- No "Cannot find module" errors remain

---

## Phase 2: Error Classes and DI (~15 errors)

### Files Affected

- `src/errors/adapter-errors.ts` (4 errors)
- `src/modules/ControllerModule.ts` (7 errors)
- `src/modules/RepositoryModule.ts` (2 errors)
- `src/modules/UseCaseModule.ts` (2 errors)

### Fixes Required

1. **Add override modifier to error classes**

   ```typescript
   // Change all error class _tag declarations:
   readonly override _tag = "ValidationError";
   ```

   Applies to: ValidationError, NotFoundError, StateTransitionError, PermissionError, ConcurrencyError

2. **Fix RepositoryModule exports**

   - Remove references to non-existent repositories
   - Update module paths for renamed repositories

3. **Fix ControllerModule wiring**

   - Ensure proper repository-to-controller connections
   - Fix any broken dependency injection registrations

### Success Criteria

- All TS4114 "must have override modifier" errors resolve
- DI modules compile without errors
- All module exports reference existing implementations

---

## Phase 3: Controller DTO Alignment (~20 errors)

### Files Affected

- `controllers/challenge-submission.ts` (3 errors)
- `controllers/notification.ts` (7 errors)
- `controllers/trip.ts` (5 errors)
- `controllers/reward.ts` (2 errors)
- `controllers/coin.ts` (2 errors)
- `controllers/coin-transaction.ts` (1 error)

### Fixes Required

1. **Fix Group type mismatches in challenge-submission.ts**

   The controller expects `{ description: string | null }` but receives `{ coins: number }`.

   ```typescript
   // Option A: Update controller to handle both shapes
   // Option B: Update use-case output to include description
   ```

2. **Fix Result type handling in notification.ts and trip.ts**

   - Stop assigning Error objects directly to string fields (lines 223, 264, 281)
   - Properly unwrap Result types before accessing properties
   - Fix `kind`, `error`, `value` property access on Notification entity

3. **Fix string | null | undefined vs string | null**

   - Use nullish coalescing: `value ?? null`
   - Or update controller DTO types to accept undefined

4. **Fix missing imports**

   - Add `UserRole` import to reward.ts
   - Fix RewardPurchaseStatus enum values

### Success Criteria

- All TS2322 type assignment errors resolve
- Controllers properly handle Result types from use cases
- DTO types align with actual use-case outputs

---

## Phase 4: Mapper Fixes (~45 errors)

### Files Affected

- `mappers/drizzle/challenge-vote.ts` (8 errors)
- `mappers/drizzle/reward.ts` (9 errors)
- `mappers/drizzle/notification-schedule.ts` (6 errors)
- `mappers/drizzle/trip.ts` (4 errors)
- `mappers/drizzle/location.ts` (4 errors)
- `mappers/drizzle/submission-report.ts` (3 errors)
- `mappers/drizzle/notification.ts` (3 errors)
- `mappers/drizzle/activity-feed.ts` (3 errors)
- `mappers/drizzle/challenge-submission.ts` (2 errors)
- `mappers/drizzle/sponsor.ts` (2 errors)
- `mappers/drizzle/notification-delivery.ts` (2 errors)
- `mappers/drizzle/user.ts` (1 error)
- `mappers/drizzle/group.ts` (1 error)
- `mappers/drizzle/coin-transaction.ts` (1 error)
- `mappers/drizzle/challenge.ts` (1 error)

### Fixes Required

1. **Align mapper outputs with controller DTOs**

   Mappers must produce output that matches controller DTO expectations:

   - Add missing fields (like `description` in Group)
   - Remove extra fields (like `coins` where not expected)
   - Fix type mismatches (nullable vs required)

2. **Fix enum conversions**

   ```typescript
   // Challenge vote position conversion
   position: entity.position as "UPVOTE" | "DOWNVOTE" | "NEUTRAL"
   ```

3. **Fix undefined vs null handling**

   Ensure mappers consistently return null for optional fields, not undefined.

### Success Criteria

- Mapper outputs match controller DTO types
- All TS2322 and TS2345 errors in mappers resolve
- No field mismatches between mappers and controllers

---

## Phase 5: Drizzle Repository Fixes (~180 errors)

### Files Affected

- `gateways/base/repository.ts` (9 errors)
- `gateways/drizzle/challenge-submission.ts` (10 errors)
- `gateways/drizzle/notification-schedule.ts` (8 errors)
- `gateways/drizzle/coin-transaction.ts` (7 errors)
- `gateways/drizzle/challenge-vote.ts` (6 errors)
- `gateways/drizzle/notification-delivery.ts` (6 errors)
- `gateways/drizzle/submission-report.ts` (6 errors)
- `gateways/drizzle/activity-feed.ts` (4 errors)
- `gateways/drizzle/trip.ts` (5 errors)
- `gateways/drizzle/reward.ts` (4 errors)
- `gateways/drizzle/user.ts` (3 errors)
- `gateways/drizzle/group.ts` (3 errors)
- `gateways/drizzle/event.ts` (2 errors)
- `gateways/drizzle/sponsor.ts` (2 errors)
- `gateways/drizzle/challenge.ts` (1 error)
- `gateways/drizzle/notification.ts` (1 error)
- `gateways/drizzle/location.ts` (1 error)

### Fixes Required

1. **Fix BaseDrizzleRepository generic constraints**

   - Resolve TS2344: Type constraints not satisfied
   - Fix TS2769: No overload matches for insert operations
   - Fix TS2740: Missing properties on query builders

2. **Fix insert/update type issues**

   ```typescript
   // Problem: VoteWeight type not assignable to number
   // Fix: Ensure weight is converted to number before insert
   ```

3. **Fix argument count mismatches**

   - Some repository methods pass wrong number of arguments
   - Update calls to match Drizzle API signatures

4. **Add missing override modifiers**

   - Repository methods overriding base class need `override` keyword

5. **Fix method signature mismatches**

   - ActivityFeedRepository methods don't match port interface
   - Fix return types (Promise<ActivityFeed[]> vs Promise<{ activities, nextCursor, hasMore }>)

### Success Criteria

- All drizzle repositories compile without errors
- Base repository generic types work correctly
- Repository method signatures match their ports

---

## Phase 6: Test File Fixes (~40 errors)

### Files Affected

- `gateways/__tests__/SupabaseAuthAdapter.test.ts` (42 errors)
- `gateways/__tests__/InMemoryAdapters.contract.test.ts` (11 errors)
- `gateways/__tests__/InMemoryAuthAdapter.test.ts` (5 errors)
- `services/__tests__/EventEmitterPubSub.test.ts` (5 errors)
- `services/__tests__/EventBus.contract.test.ts` (4 errors)
- `gateways/__tests__/PortImplementations.contract.test.ts` (1 error)
- `services/__tests__/NotificationDeliveryService.integration.test.ts` (3 errors)

### Fixes Required

1. **Fix unknown type narrowing in SupabaseAuthAdapter.test.ts**

   ```typescript
   // Before: result.value (unknown)
   // After: Add proper type guards or use Result type helpers
   ```

2. **Fix error property access in contract tests**

   - Tests access `sessionId`, `expiredAt`, `bucket`, `path` on union error types
   - Need type narrowing to specific error subtypes

3. **Fix Result type handling**

   - Tests incorrectly access `.value` on potentially error results
   - Use proper Result unwrapping with error checking

4. **Fix StoragePort interface mismatch**

   - InMemoryStorageAdapter returns wrong type for download()
   - Should return `DownloadResult` not `Buffer | Blob`

### Success Criteria

- All test files compile without errors
- Tests use proper Result type handling
- Error type narrowing works correctly

---

## Execution Order

Execute phases sequentially. Each phase builds on previous work:

1. Phase 1 (dependencies) must complete first
2. Phase 2 (error classes) enables cleaner fixes in later phases
3. Phases 3-4 (controllers/mappers) form a unit—fix together
4. Phase 5 (repositories) requires controller/mapper types to stabilize
5. Phase 6 (tests) runs last after implementation fixes

## Testing Strategy

Run after each phase:

```bash
cd packages/adapters
bun run typecheck
```

Track progress by error count. Target: 0 errors after Phase 6.

## Risk Mitigation

- **Low risk:** Phases 1-2 (mechanical fixes)
- **Medium risk:** Phases 3-4 (type alignment may reveal runtime issues)
- **High risk:** Phase 5 (complex generic types, may need iteration)

For high-risk changes, run integration tests after each file group.

## Notes

- These errors are pre-existing and unrelated to throwing use case refactoring
- Fixes are type-only; no runtime behavior changes expected
- Document any unexpected runtime issues discovered during fixes
- Consider adding stricter type checks after all errors resolve
