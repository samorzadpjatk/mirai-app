# PDCA Cycle 3b: Fix Failing Tests - COMPLETE

## Cycle Goal

Fix all failing tests in `packages/use-cases` by correcting entity method binding issues and updating tests to use proper Effect patterns.

## Check Phase Results

### Final Status

- **Before:** 594 pass / 30 fail
- **After:** 624 pass / 0 fail in use-cases
- **Improvement:** +30 tests passing (all use-cases tests now green)

## Changes Made

### 1. Root Cause Analysis

**Primary Issue:** Tests were awaiting Effect objects directly instead of executing them with `Effect.runPromise()`.

Example of the bug:

```typescript
// WRONG - awaits the Effect object itself
await rewardRepo.create(mockReward);

// CORRECT - executes the Effect
await Effect.runPromise(rewardRepo.create(mockReward));
```

**Secondary Issue:** Repository `decrementQuantity` and `incrementQuantity` methods weren't persisting the updated entities back to storage.

### 2. Files Modified

#### PurchaseReward.test.ts

- Fixed 6 occurrences of `await rewardRepo.create()` → `await Effect.runPromise(rewardRepo.create())`
- Tests affected:
  - "should successfully purchase reward"
  - "should reject purchase when user is not group leader"
  - "should reject purchase when insufficient quantity"
  - "should reject purchase when insufficient coins"
  - "should reject purchase when trip has ended"
  - "should reject purchase when reward is hidden"

#### InMemoryRewardRepository (reward.ts)

- Fixed `decrementQuantity()` to store updated reward: `this.rewards.set(id, result)`
- Fixed `incrementQuantity()` to store updated reward: `this.rewards.set(id, result)`
- Added `this` binding to Effect.gen for proper context

## PDCA Cycle Summary

### Plan

- Identify remaining test failures in use-cases
- Root cause: Entity reconstruction or test pattern issues

### Do

- Added debug logging to trace failure points
- Discovered Effect execution pattern was incorrect in tests
- Fixed repository methods to properly persist updates

### Check

- All 7 PurchaseReward tests now pass
- All 624 use-cases tests pass
- No regressions in previously fixed tests

### Act

- Document the pattern: Always use `Effect.runPromise()` to execute Effects in tests
- Mark cycle as complete
- Remaining test failures (201 in other packages) are outside this cycle's scope

## Key Pattern to Remember

When working with Effect-based repositories in tests:

```typescript
// Repository methods return Effect.Effect<T, Error, never>
// Must be executed with Effect.runPromise()

// ❌ Wrong
await repo.create(entity);

// ✅ Correct
await Effect.runPromise(repo.create(entity));

// For methods that return Effects that need to be yielded
const result = await Effect.runPromise(
  Effect.gen(function* () {
    const entity = yield* repo.findById(id);
    return entity;
  }),
);
```

## Next Steps

PDCA Cycle 3b is **COMPLETE**. All use-cases tests are passing.

Future cycles could address:

- Remaining 201 failing tests in other packages (frameworks/auth, adapters, etc.)
- Similar Effect pattern issues in other test files
- Repository persistence patterns in other in-memory repositories

---

**Completed:** 2026-04-14
**Status:** ✅ SUCCESS
