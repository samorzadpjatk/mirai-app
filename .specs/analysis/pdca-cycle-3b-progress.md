# PDCA Cycle 3b: Fix Failing Tests - Progress Report

**Date:** 2026-04-14  
**Status:** IN PROGRESS - Root cause identified, systematic fix required

---

## Completed So Far

### ✅ Fixed ChallengeSubmission Entity

**File:** `packages/domain/src/entities/ChallengeSubmission.ts`

**Problem:** Mixed Result pattern with Effect validators

```typescript
// BEFORE (broken)
const challengeIdResult = validate.id(props.challengeId, "challengeId");
if (challengeIdResult.kind === "err")  // .kind doesn't exist on Effect!
  return Effect.fail(challengeIdResult.error);
return Effect.succeed(
  new ChallengeSubmission(..., challengeIdResult.value.trim(), ...)
);

// AFTER (fixed)
return Effect.gen(function* () {
  const challengeId = yield* validate.id(props.challengeId, "challengeId");
  return new ChallengeSubmission(..., challengeId.trim(), ...);
});
```

**Result:** CreateSubmission.test.ts now passes (5/5 tests)

### ✅ Identified Root Cause for Remaining Failures

**Pattern:** 28 tests failing with same root cause:

```
TypeError: undefined is not an object (evaluating 'Object.keys(entity)')
at updateEntity (immutable.ts:154:23)
```

**Root Cause:** In-memory repository stores entities as plain objects, losing class prototype. When methods like `updateCoordinates()` are called, `this` is undefined.

**Affected Test Files:**

1. UpdateLocation.test.ts (3 failures) - Location entity
2. ListRewards.test.ts (8 failures) - Reward entity
3. GetLocation.test.ts (2 failures) - Location entity
4. CreateReward.test.ts (5 failures) - Reward entity
5. CreateLocation.test.ts (1 failure) - Location entity
6. CreateTrip.test.ts (1 failure) - Trip entity
7. GetGroup.test.ts (1 failure) - Group entity
8. PurchaseReward.test.ts (6 failures) - Multiple entities
9. UpdateGroup.test.ts (1 failure) - Group entity

---

## Current Test Status

| Metric      | Before | After | Change |
| ----------- | ------ | ----- | ------ |
| Total tests | 624    | 624   | -      |
| Passing     | 594    | 595   | +1     |
| Failing     | 30     | 29    | -1     |
| Pass rate   | 95.2%  | 95.4% | +0.2%  |

---

## Root Cause Analysis

### The Problem

When entities are stored in `InMemoryRepository`:

```typescript
// Stored as plain object
this.storage.set(item.id, item);

// Retrieved loses class methods
const location = this.storage.get(id); // Plain object, not Location instance
location.updateCoordinates({...}); // Fails - `this` is undefined
```

### Solution Options

**Option 1: Reconstruct Entities on Retrieval (Recommended)**

```typescript
// In repository findById
findById(id: string): Effect.Effect<Location | null, never, never> {
  const plain = this.storage.get(id);
  if (!plain) return Effect.succeed(null);

  // Reconstruct as proper Location instance
  return Location.create({...plain}).pipe(
    Effect.map(location => location),
    Effect.orDie
  );
}
```

**Option 2: Static Update Methods**

```typescript
// Change from instance method to static
static updateCoordinates(location: Location, updates: {...}): Effect.Effect<Location, ...> {
  // Use location param instead of this
}
```

---

## Next Steps

### Phase 1: Fix In-Memory Repository Pattern (Recommended)

Update base repository to reconstruct entities:

**Files to modify:**

1. `packages/adapters/src/gateways/in-memory/base.ts`
   - Add abstract `reconstruct(entity: T): Effect.Effect<T, never, never>`
   - Update `findByIdGeneric` to use reconstruction

2. Update each repository to implement reconstruction:
   - `location.ts` - Location.create()
   - `reward.ts` - Reward.create()
   - `trip.ts` - Trip.create()
   - `group.ts` - Group.create()
   - etc.

### Phase 2: Alternative - Fix Individual Entities

If repository fix is too invasive, fix each entity's update method to handle plain objects:

**Pattern:**

```typescript
updateCoordinates(props: {...}) {
  return Effect.gen(function* () {
    // Instead of: updateEntity(this, updates, Location)
    // Use: Location.create({...this, ...updates})
  });
}
```

---

## Estimated Effort

**Option 1 (Repository Fix):**

- Time: 2-3 hours
- Files: ~15 repositories
- Risk: Medium (changes base pattern)
- Benefit: Fixes all 28 tests at once

**Option 2 (Entity-by-Entity):**

- Time: 4-6 hours
- Files: ~10 entities with update methods
- Risk: Low (localized changes)
- Benefit: More controlled, incremental

---

## Recommendation

**Go with Option 1** - Fix the in-memory repository pattern.

Rationale:

1. One fix solves 28 test failures
2. Improves test infrastructure for future tests
3. More maintainable pattern
4. Aligns with DDD principles (entities should always be valid instances)

---

## PDCA Status

**Phase 1 (Plan):** ✅ Complete - Problem analyzed  
**Phase 2 (Do):** 🔄 In Progress - 1/29 fixes applied  
**Phase 3 (Check):** ⏳ Pending - Need to apply systematic fix  
**Phase 4 (Act):** ⏳ Pending - Standardize pattern

---

**Status: IN PROGRESS**

Next action: Implement Option 1 (Repository reconstruction pattern) or Option 2 (Entity fixes). Recommend Option 1 for efficiency.
