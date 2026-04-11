# Codebase Impact Analysis: Fix adapters package missing dependencies and module exports (Phase 1)

**Task:** Fix adapters package missing dependencies and module exports (Phase 1)
**Analysis Date:** 2026-04-11
**Agent:** sdd:code-explorer

---

## Summary

This analysis identifies the affected files, interfaces, and integration points for fixing ~38 TypeScript errors in the adapters package related to missing dependencies and module exports.

**Risk Level:** LOW
**Files Affected:** 8-12 files (primarily index.ts exports and type definitions)
**Primary Focus:** Package export declarations and type alignment

---

## Error Breakdown

Based on preliminary TypeScript error analysis:

### Error Categories

1. **Missing Exports from use-cases (~15 errors)**
   - `UserRole` not exported from `@mirai-app/use-cases`
   - Other domain types not re-exported

2. **Type Mismatches in Controllers (~20 errors)**
   - DTO property mismatches (e.g., `description` missing in Group type)
   - Return type incompatibilities
   - Optional vs required field conflicts

3. **Missing Type Declarations (~3 errors)**
   - NotificationScheduleFilter type issues
   - PaginationOptions compatibility

---

## Affected Files

### Must Modify (High Priority)

1. **packages/use-cases/src/index.ts**
   - Add export for `UserRole` from @mirai-app/domain
   - May need other missing domain type exports

2. **packages/adapters/src/controllers/challenge-submission.ts**
   - Fix Group DTO type mismatch (missing `description` field)

3. **packages/adapters/src/controllers/challenge-vote.ts**
   - Fix ChallengeSubmissionRepository type assignment

4. **packages/adapters/src/controllers/coin-transaction.ts**
   - Fix CoinTransaction type mismatch (reason field)

5. **packages/adapters/src/controllers/coin.ts**
   - Fix string | null | undefined assignment issues

6. **packages/adapters/src/controllers/notification-schedule.ts**
   - Fix NotificationScheduleFilter compatibility
   - Fix PaginationOptions type issue

7. **packages/adapters/src/controllers/notification.ts**
   - Fix ValidationError type assignments
   - Fix Notification property access (kind, error, value)

### May Need Review (Medium Priority)

8. **packages/domain/src/index.ts**
   - Verify all necessary types are exported

9. **packages/adapters/package.json**
   - Verify all workspace dependencies declared

---

## Integration Points

### Package Dependencies

```
@mirai-app/domain (exports types)
    ↓
@mirai-app/use-cases (should re-export domain types used by adapters)
    ↓
@mirai-app/adapters (imports from use-cases)
```

### Key Interfaces Affected

1. **UserRole** - Used in multiple controllers for authorization
2. **Group DTO** - Shape mismatch between use-cases output and adapters expectation
3. **CoinTransaction** - Property type mismatch (reason field)
4. **NotificationScheduleFilter** - Type compatibility issue
5. **ChallengeSubmissionRepository** - Partial implementation assignment

---

## Risk Assessment

### High Risk Areas
- None identified for this Phase 1 scope (type-only changes)

### Medium Risk Areas
- Type mismatches could mask deeper architectural issues
- Export changes might affect other packages if not carefully scoped

### Low Risk Areas
- Adding exports is generally safe (no runtime changes)
- Type alignment fixes are mechanical

---

## Implementation Strategy

### Phase 1A: Fix Exports (Priority 1)
1. Add `UserRole` export to packages/use-cases/src/index.ts
2. Verify other required domain exports

### Phase 1B: Fix Type Mismatches (Priority 2)
1. Update controller DTOs to match use-case outputs
2. Fix property type mismatches (optional vs required)

### Phase 1C: Verify (Priority 3)
1. Run type check to confirm all errors resolved
2. Run dependency-cruiser to verify no circular deps

---

## Similar Patterns in Codebase

The monorepo uses these patterns for exports:
- `export type { X } from "package"` for type-only exports
- `export { X }` for value exports
- Re-exporting domain types through use-cases to adapters layer

This fix aligns with the existing pattern but fills gaps where exports were missed.
