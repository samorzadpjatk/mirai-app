---
title: "Refactor 13 Throwing Use Cases to Result<T,E>"
type: task
status: ready
priority: high
created: "2026-04-14"
source_plan: ".specs/plans/use-case-result-refactor.design.md"
---

## Initial Request

Convert the "Use Case Result<T,E> Refactoring" design into an implementation task. Refactor 13 throwing use cases to return `Result<T,E>` types, resolving type errors in the adapters package.

## Description

### Why This is Needed

Currently 13 use cases throw exceptions while 75+ use cases return `Result<T,E>`. This creates:

- Type mismatches between controllers expecting `Result<T,E>` and use cases throwing
- Inconsistent error handling patterns across the codebase
- Controllers must handle both exception catching AND result checking
- Violates Clean Architecture principles (exceptions leak across boundaries)

### What This Accomplishes

**Target outcome:** Uniform error handling across all 88+ use cases

**Key deliverables:**

1. **13 use cases refactored** from throwing to Result-based
2. **7 controllers updated** to use consistent result handling pattern
3. **~370 type errors eliminated** in adapters package
4. **Single error handling pattern** (`result.kind === "err"`)

### Scope Boundaries

**IN Scope:**

- Refactor 13 throwing use cases in `packages/use-cases/src/interactors/`
- Update 7 controllers in `packages/adapters/src/controllers/`
- Convert exceptions to DomainError returns
- Ensure all use cases follow same Result pattern

**OUT of Scope:**

- Changes to domain layer entities
- Changes to adapter gateways/repositories
- Database schema changes
- API contract changes (external)

## Acceptance Criteria

### Functional Criteria

- [ ] `AddCoins.ts` returns `Result<AddCoinsOutput, DomainError>`
- [ ] `RemoveCoins.ts` returns `Result<RemoveCoinsOutput, DomainError>`
- [ ] `CreateChallenge.ts` returns `Result<Challenge, DomainError>`
- [ ] `CreateUser.ts` returns `Result<User, DomainError>`
- [ ] `UpdateUser.ts` returns `Result<User, DomainError>`
- [ ] `GetUser.ts` returns `Result<User | null, DomainError>`
- [ ] `CreateGroup.ts` returns `Result<Group, DomainError>`
- [ ] `UpdateGroup.ts` returns `Result<Group, DomainError>`
- [ ] `GetGroup.ts` returns `Result<Group | null, DomainError>`
- [ ] `PurchaseReward.ts` returns `Result<RewardPurchase, DomainError>`
- [ ] `GetChallenge.ts` returns `Result<Challenge | null, DomainError>`
- [ ] `SubmitVotes.ts` returns `Result<VoteSubmission, DomainError>`
- [ ] `ForceEndVoting.ts` returns `Result<Challenge, DomainError>`
- [ ] All 7 controllers use `result.kind === "err"` pattern uniformly
- [ ] All controllers import `{ Result, ok, err }` from domain
- [ ] No use case throws exceptions (all return Results)

### Quality Criteria

- [ ] All use case tests pass
- [ ] All controller tests pass
- [ ] No regression in type errors (adapters package)
- [ ] Error messages remain user-friendly
- [ ] No breaking changes to use case interfaces (except return type)

## Architecture Overview

### Current State

**Throwing use cases (13 files):**

```typescript
export class AddCoinsUseCase {
  async execute(input: AddCoinsInput): Promise<AddCoinsOutput> {
    if (!groupCheck.exists) {
      throw AppError.notFound({ entity: "Group", message: "Group not found" });
    }
    return { transaction };
  }
}
```

**Controllers handle exceptions:**

```typescript
// Some controllers catch exceptions
// Others expect Result and do result.kind check
// Inconsistent patterns create type errors
```

### Target State

**Result-based use cases (all 88+ files):**

```typescript
export class AddCoinsUseCase {
  async execute(
    input: AddCoinsInput,
  ): Promise<Result<AddCoinsOutput, DomainError>> {
    if (!groupCheck.exists) {
      return err(DomainError.notFound("Group", "Group not found"));
    }
    return ok({ transaction });
  }
}
```

**Controllers use single pattern:**

```typescript
const result = await useCase.execute(input);
if (result.kind === "err") {
  // Handle error
  return errorResponse(result.error);
}
// Use result.value
return successResponse(result.value);
```

### Migration Strategy

1. **Phase 1: Update use cases** (can be parallel per use case)
   - Convert each throwing use case to Result-based
   - Replace `throw` with `return err()`
   - Wrap success with `ok()`
   - Update return type annotations

2. **Phase 2: Update controllers** (sequential - depends on Phase 1)
   - Remove try/catch blocks where only use case errors caught
   - Use `result.kind === "err"` pattern uniformly
   - Import `Result` types from domain

3. **Phase 3: Verify** (after both phases)
   - Run full test suite
   - Check TypeScript errors in adapters
   - Verify type consistency

## Implementation Notes

### From Source Plan

See `.specs/plans/use-case-result-refactor.design.md` for:

- Per-use-case transformation examples
- Controller update patterns
- Error mapping specifications
- Test update guidance

### Key Patterns

**Use Case Transformation:**

```typescript
// BEFORE (throwing):
async execute(input: AddCoinsInput): Promise<AddCoinsOutput> {
  if (!valid) {
    throw AppError.notFound({ entity: "X", message: "Y" });
  }
  return output;
}

// AFTER (Result-based):
async execute(input: AddCoinsInput): Promise<Result<AddCoinsOutput, DomainError>> {
  if (!valid) {
    return err(DomainError.notFound("X", "Y"));
  }
  return ok(output);
}
```

**Controller Update:**

```typescript
// BEFORE (try/catch):
try {
  const result = await useCase.execute(input);
  return success(result);
} catch (error) {
  return errorResponse(error);
}

// AFTER (Result pattern):
const result = await useCase.execute(input);
if (result.kind === "err") {
  return errorResponse(result.error);
}
return success(result.value);
```

### Error Mapping

| Old Exception             | New DomainError                          |
| ------------------------- | ---------------------------------------- |
| `AppError.notFound()`     | `DomainError.notFound(entity, message)`  |
| `AppError.validation()`   | `DomainError.validation(field, message)` |
| `AppError.conflict()`     | `DomainError.conflict(message)`          |
| `AppError.unauthorized()` | `DomainError.unauthorized(message)`      |

## Files to Modify

### Use Cases (13 files)

```
packages/use-cases/src/interactors/
├── AddCoins.ts                    # coin.ts controller
├── RemoveCoins.ts                 # coin.ts controller
├── CreateChallenge.ts             # challenge.ts controller
├── CreateUser.ts                  # user.ts controller
├── UpdateUser.ts                  # user.ts controller
├── GetUser.ts                     # user.ts controller
├── CreateGroup.ts                 # group.ts controller
├── UpdateGroup.ts                 # group.ts controller
├── GetGroup.ts                    # group.ts controller
├── PurchaseReward.ts              # reward.ts controller
├── GetChallenge.ts                # challenge.ts controller
├── SubmitVotes.ts                 # challenge-vote.ts controller
└── ForceEndVoting.ts              # challenge-vote.ts controller
```

### Controllers (7 files)

```
packages/adapters/src/controllers/
├── coin.ts                        # AddCoins, RemoveCoins
├── user.ts                        # CreateUser, UpdateUser, GetUser
├── group.ts                       # CreateGroup, UpdateGroup, GetGroup
├── challenge.ts                   # CreateChallenge, GetChallenge
├── reward.ts                      # PurchaseReward
└── challenge-vote.ts              # SubmitVotes, ForceEndVoting
```

## Estimated Effort

| Phase                     | Duration       | Complexity |
| ------------------------- | -------------- | ---------- |
| Use case refactoring (13) | 3-4 hours      | Medium     |
| Controller updates (7)    | 2-3 hours      | Medium     |
| Test updates              | 1-2 hours      | Low        |
| Verification              | 1 hour         | Low        |
| **Total**                 | **7-10 hours** |            |

## Dependencies

- ✅ Unified error hierarchy (already created)
- ✅ Domain errors exported from `@mirai-app/domain`
- ⬜ Should complete after domain simplification (optional)

## Success Metrics

| Metric                    | Before | Target |
| ------------------------- | ------ | ------ |
| Throwing use cases        | 13     | 0      |
| Result-based use cases    | 75+    | 88+    |
| Controller error patterns | 2+     | 1      |
| Adapters type errors      | ~370   | 0      |
| Test pass rate            | 100%   | 100%   |

## Risk Assessment

| Risk                        | Likelihood | Impact | Mitigation                          |
| --------------------------- | ---------- | ------ | ----------------------------------- |
| Breaking controller changes | Medium     | High   | Update all 7 controllers in same PR |
| Test failures               | Low        | Medium | Tests should remain compatible      |
| Error message changes       | Low        | Low    | Keep same error messages            |

---

**Next Step:** Use `/sdd:implement` to execute this task.
