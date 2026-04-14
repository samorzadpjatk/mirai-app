---
title: "Fix Adapters Package Type Errors - 63 Remaining"
type: task
status: ready
priority: medium
created: "2026-04-14"
source_plan: ".specs/plans/adapters-type-errors.design.md"
---

## Initial Request

Convert the "Adapters Package Type Error Fix" design into an implementation task. Fix the remaining TypeScript errors in the adapters package (currently 63 errors, down from 338).

## Description

### Why This is Needed

The adapters package accumulated TypeScript errors during refactoring:

- Missing dependency declarations
- Incorrect error class modifiers
- Controller DTO misalignments
- Mapper type mismatches
- Repository type issues

These errors indicate type safety gaps that could lead to runtime bugs. While the count has decreased from 338 to 63, remaining errors need systematic cleanup.

### What This Accomplishes

**Target outcome:** Zero TypeScript errors in adapters package

**Key deliverables:**

1. **All TS2307 module errors resolved** (missing imports/exports)
2. **Error class modifiers fixed** (override keywords)
3. **Controller DTOs aligned** with use case outputs
4. **Mapper types corrected** (entity ↔ persistence)
5. **Repository types fixed** (Drizzle integration)

### Scope Boundaries

**IN Scope:**

- Fix remaining 63 TypeScript errors in `packages/adapters/`
- Resolve missing dependency issues
- Fix error class declarations
- Align controller DTOs with use cases
- Fix mapper type signatures
- Update repository type annotations

**OUT of Scope:**

- Refactoring use cases (separate task)
- Changes to domain layer
- Database schema changes
- New feature implementation

## Acceptance Criteria

### Functional Criteria

- [ ] `bunx tsc --noEmit` in adapters package shows 0 errors
- [ ] All `TS2307` module resolution errors resolved
- [ ] All error class `override` modifiers added
- [ ] Controller DTOs match use case output types
- [ ] Mapper functions have correct type signatures
- [ ] Repository methods align with port interfaces
- [ ] All imports from `@mirai-app/*` packages resolve correctly

### Quality Criteria

- [ ] All adapter tests pass
- [ ] No new TypeScript errors introduced
- [ ] Type safety maintained (no `any` types added)
- [ ] No runtime behavior changes
- [ ] Dependency cruiser validation passes

## Architecture Overview

### Current State

**63 TypeScript errors in adapters package:**

- Missing dependency errors (TS2307)
- Error class modifier issues
- Controller DTO misalignments
- Mapper type mismatches
- Repository type issues

### Target State

**Zero TypeScript errors:**

- All modules resolve correctly
- All error classes properly declared
- All DTOs aligned with use cases
- All mappers type-safe
- All repositories match ports

### Migration Strategy

1. **Phase 1: Missing Dependencies** (~15 errors remaining)
   - Fix `@supabase/supabase-js` imports
   - Update gateway exports
   - Fix mapper exports
   - Ensure domain/use-cases exports

2. **Phase 2: Error Classes** (~5 errors)
   - Add `override` modifier to all error class `_tag` declarations
   - Fix base class compatibility

3. **Phase 3: Controller DTOs** (~10 errors)
   - Align controller input/output types with use cases
   - Fix type imports

4. **Phase 4: Mapper Fixes** (~20 errors)
   - Fix entity-to-persistence mapping types
   - Fix persistence-to-entity mapping types
   - Update mapper function signatures

5. **Phase 5: Repository Fixes** (~13 errors)
   - Fix Drizzle repository method signatures
   - Align with port interfaces

## Implementation Notes

### From Source Plan

See `.specs/plans/adapters-type-errors.design.md` for:

- Per-phase error breakdown
- Specific file error counts
- Detailed fix instructions for each error type
- Success criteria per phase

### Current Error Count (as of 2026-04-14)

Running `bunx tsc --noEmit` in adapters package:

```
63 errors total
```

**Breakdown estimate:**

- Phase 1 (Dependencies): ~15 errors
- Phase 2 (Error classes): ~5 errors
- Phase 3 (Controller DTOs): ~10 errors
- Phase 4 (Mappers): ~20 errors
- Phase 5 (Repositories): ~13 errors

### Key Patterns

**Fixing Module Errors:**

```typescript
// BEFORE (TS2307):
import { Something } from "@mirai-app/domain";
// Error: Module not found

// AFTER:
// Ensure Something is exported from packages/domain/src/index.ts
export { Something } from "./entities/Something";
```

**Fixing Error Class Modifiers:**

```typescript
// BEFORE:
class ValidationError extends DomainError {
  readonly _tag = "ValidationError"; // Error: missing override
}

// AFTER:
class ValidationError extends DomainError {
  override readonly _tag = "ValidationError";
}
```

**Fixing Controller DTOs:**

```typescript
// BEFORE:
async create(input: CreateUserInput): Promise<User> {
  const result = await useCase.execute(input);
  // Type mismatch: result is Result<User, Error>, not User
}

// AFTER:
async create(input: CreateUserInput): Promise<User> {
  const result = await useCase.execute(input);
  if (result.kind === "err") {
    throw new HTTPError(result.error);
  }
  return result.value; // Now correctly returns User
}
```

## Files Likely Affected

### Gateways

- `gateways/storage/SupabaseStorageAdapter.ts`
- `gateways/realtime/SupabaseRealtimeAdapter.ts`
- `gateways/index.ts` (exports)

### Services

- `services/notification-service.ts`

### Controllers

- `controllers/coin.ts`
- `controllers/user.ts`
- `controllers/group.ts`
- `controllers/challenge.ts`
- `controllers/reward.ts`
- `controllers/challenge-vote.ts`

### Mappers

- `mappers/index.ts` (exports)
- Individual mapper files

### Errors

- `errors/adapter-errors.ts`

### Modules

- `modules/ControllerModule.ts`
- `modules/RepositoryModule.ts`
- `modules/UseCaseModule.ts`

## Estimated Effort

| Phase           | Errors | Duration       | Complexity |
| --------------- | ------ | -------------- | ---------- |
| Dependencies    | ~15    | 1-2 hours      | Low        |
| Error classes   | ~5     | 30 min         | Low        |
| Controller DTOs | ~10    | 1-2 hours      | Medium     |
| Mappers         | ~20    | 2-3 hours      | Medium     |
| Repositories    | ~13    | 1-2 hours      | Medium     |
| Verification    | -      | 1 hour         | Low        |
| **Total**       | **63** | **7-11 hours** |            |

## Dependencies

- ✅ Domain layer exports (verify all needed types exported)
- ✅ Use-cases layer exports (verify ports and DTOs)
- ⬜ Use case Result refactor (may eliminate some errors)

## Success Metrics

| Metric                   | Before | Target |
| ------------------------ | ------ | ------ |
| TypeScript errors        | 63     | 0      |
| Module resolution errors | ~15    | 0      |
| Error class errors       | ~5     | 0      |
| Controller DTO errors    | ~10    | 0      |
| Mapper errors            | ~20    | 0      |
| Repository errors        | ~13    | 0      |
| Test pass rate           | TBD    | 100%   |

## Verification Steps

1. Run type check:

   ```bash
   cd packages/adapters && bunx tsc --noEmit
   ```

2. Verify no errors:

   ```bash
   echo $?
   # Should return 0
   ```

3. Run tests:

   ```bash
   bun test
   ```

4. Verify dependency cruiser:
   ```bash
   bun run depcruise:check
   ```

---

**Next Step:** Use `/sdd:implement` or execute phases sequentially.

**Note:** This task may become easier after completing the "Refactor 13 Throwing Use Cases" task, as that will align controller expectations with actual use case return types.
