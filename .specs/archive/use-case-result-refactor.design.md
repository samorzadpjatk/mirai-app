# Use Case Result<T,E> Refactoring Design

**Status:** Converted to Task ✅  
**Task:** `.specs/tasks/todo/refactor-use-cases-to-result.task.md`

## Overview

Refactor 13 throwing use cases to return `Result<T,E>` types, resolving ~370 type errors in the adapters package. This aligns the minority pattern (13 throwing use cases) with the established majority pattern (75+ Result-based use cases).

## Goals

- Eliminate type mismatches between controllers expecting `Result<T,E>` and use cases throwing exceptions
- Establish uniform error handling across all use cases
- Ensure controllers use a single consistent pattern (`result.kind === "err"`)
- Follow Clean Architecture principles (domain errors in domain layer)

## Files to Refactor

### Use Cases (13 files)

| File                 | Errors | Controller          |
| -------------------- | ------ | ------------------- |
| `AddCoins.ts`        | Throws | `coin.ts`           |
| `RemoveCoins.ts`     | Throws | `coin.ts`           |
| `CreateChallenge.ts` | Throws | `challenge.ts`      |
| `CreateUser.ts`      | Throws | `user.ts`           |
| `UpdateUser.ts`      | Throws | `user.ts`           |
| `GetUser.ts`         | Throws | `user.ts`           |
| `CreateGroup.ts`     | Throws | `group.ts`          |
| `UpdateGroup.ts`     | Throws | `group.ts`          |
| `GetGroup.ts`        | Throws | `group.ts`          |
| `PurchaseReward.ts`  | Throws | `reward.ts`         |
| `GetChallenge.ts`    | Throws | `challenge.ts`      |
| `SubmitVotes.ts`     | Throws | `challenge-vote.ts` |
| `ForceEndVoting.ts`  | Throws | `challenge-vote.ts` |

### Controllers (7 files)

- `/packages/adapters/src/controllers/coin.ts` (AddCoins, RemoveCoins)
- `/packages/adapters/src/controllers/user.ts` (CreateUser, UpdateUser, GetUser)
- `/packages/adapters/src/controllers/group.ts` (CreateGroup, UpdateGroup, GetGroup)
- `/packages/adapters/src/controllers/challenge.ts` (CreateChallenge, GetChallenge)
- `/packages/adapters/src/controllers/reward.ts` (PurchaseReward)
- `/packages/adapters/src/controllers/challenge-vote.ts` (SubmitVotes, ForceEndVoting)

## Refactoring Pattern

### Use Case Transformation

**Before (throwing):**

```typescript
import { AppError } from "../errors/UseCaseErrors";

export class AddCoinsUseCase {
  async execute(input: AddCoinsInput): Promise<AddCoinsOutput> {
    if (!groupCheck.exists) {
      throw AppError.notFound({ entity: "Group", message: "Group not found" });
    }
    // ... logic ...
    return { transaction };
  }
}
```

**After (Result-based):**

```typescript
import { Result, ok, err } from "@pjapp/domain";
import { DomainError } from "@pjapp/domain";

export class AddCoinsUseCase {
  async execute(
    input: AddCoinsInput,
  ): Promise<Result<AddCoinsOutput, DomainError>> {
    if (!groupCheck.exists) {
      return err(DomainError.notFound("Group", "Group not found"));
    }
    // ... logic ...
    return ok({ transaction });
  }
}
```

### Changes per Use Case

1. **Update import statements:**
   - Add: `import { Result, ok, err } from "@pjapp/domain"`
   - Add: `import { DomainError } from "@pjapp/domain"`
   - Remove: `import { AppError } from "../errors/UseCaseErrors"`

2. **Update return type:**
   - From: `Promise<Output>`
   - To: `Promise<Result<Output, DomainError>>`

3. **Replace error handling:**
   - From: `throw AppError.xxx({ ... })`
   - To: `return err(DomainError.xxx(...))`

4. **Wrap success returns:**
   - From: `return output`
   - To: `return ok(output)`

## Controller Transformation

**Before (try/catch):**

```typescript
async addCoins(input) {
  const useCase = new AddCoinsUseCase(this.coinRepo);
  try {
    const data = await useCase.execute(input);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getUseCaseErrorMessage(error) };
  }
}
```

**After (Result pattern):**

```typescript
async addCoins(input) {
  const useCase = new AddCoinsUseCase(this.coinRepo);
  const result = await useCase.execute(input);

  if (result.kind === "err") {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.value };
}
```

### Controller Changes

1. **Remove try/catch blocks** - Eliminate exception handling
2. **Add result.kind check** - Use standard `result.kind === "err"` pattern
3. **Simplify error extraction** - Direct access via `result.error` instead of `getUseCaseErrorMessage()`
4. **Remove import** - No longer need `getUseCaseErrorMessage` from error utilities

## Error Type Mapping

| AppError (old)                                | DomainError (new)                            |
| --------------------------------------------- | -------------------------------------------- |
| `AppError.notFound({ entity, message })`      | `DomainError.notFound(entity, message)`      |
| `AppError.conflict({ entity, message })`      | `DomainError.conflict(entity, message)`      |
| `AppError.validation({ field, message })`     | `DomainError.validation(field, message)`     |
| `AppError.repository({ operation, message })` | `DomainError.repository(operation, message)` |
| `AppError.authorization({ message })`         | `DomainError.authorization(message)`         |
| `AppError.businessRule({ message })`          | `DomainError.businessRule(message)`          |

## Type Definitions

### Result<T,E> (exists in domain package)

```typescript
export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { kind: "ok", value };
}

export function err<E>(error: E): Result<never, E> {
  return { kind: "err", error };
}
```

### DomainError (exists in domain package)

```typescript
export type DomainError =
  | { _tag: "NotFoundError"; entity: string; message: string }
  | { _tag: "ConflictError"; entity: string; message: string }
  | { _tag: "ValidationError"; field: string; message: string }
  | {
      _tag: "RepositoryError";
      operation: string;
      message: string;
      cause?: unknown;
    }
  | { _tag: "AuthorizationError"; message: string }
  | { _tag: "BusinessRuleError"; message: string };

export const DomainError = {
  notFound: (entity: string, message: string): DomainError => ({
    _tag: "NotFoundError",
    entity,
    message,
  }),
  conflict: (entity: string, message: string): DomainError => ({
    _tag: "ConflictError",
    entity,
    message,
  }),
  validation: (field: string, message: string): DomainError => ({
    _tag: "ValidationError",
    field,
    message,
  }),
  repository: (
    operation: string,
    message: string,
    cause?: unknown,
  ): DomainError => ({
    _tag: "RepositoryError",
    operation,
    message,
    cause,
  }),
  authorization: (message: string): DomainError => ({
    _tag: "AuthorizationError",
    message,
  }),
  businessRule: (message: string): DomainError => ({
    _tag: "BusinessRuleError",
    message,
  }),
};
```

## Testing Strategy

### TypeScript Compiler Verification

```bash
# Run in packages/adapters directory
cd packages/adapters
pnpm tsc --noEmit

# Target: Reduce type errors from ~370 to near zero
```

### Unit Test Updates

**Before:**

```typescript
// Error case
await expect(useCase.execute(input)).rejects.toThrow("Group not found");

// Success case
const output = await useCase.execute(input);
expect(output.transaction).toBeDefined();
```

**After:**

```typescript
// Error case
const result = await useCase.execute(input);
expect(result.kind).toBe("err");
expect(result.error._tag).toBe("NotFoundError");

// Success case
const result = await useCase.execute(input);
expect(result.kind).toBe("ok");
expect(result.value.transaction).toBeDefined();
```

### Controller Test Updates

Verify controllers return consistent response shapes:

```typescript
// Error case
const response = await controller.addCoins(invalidInput);
expect(response.success).toBe(false);
expect(response.error).toBeDefined();

// Success case
const response = await controller.addCoins(validInput);
expect(response.success).toBe(true);
expect(response.data).toBeDefined();
```

## Implementation Order

**Incremental approach (recommended):**

1. **Phase 1:** Refactor 2-3 simple use cases (e.g., GetUser, GetGroup, GetChallenge)
   - These are "read-only" and straightforward
   - Update their controllers
   - Verify types compile

2. **Phase 2:** Refactor remaining use cases in logical groups
   - User management (CreateUser, UpdateUser)
   - Group management (CreateGroup, UpdateGroup)
   - Challenge management (CreateChallenge, SubmitVotes, ForceEndVoting)
   - Coin operations (AddCoins, RemoveCoins)
   - Rewards (PurchaseReward)

3. **Phase 3:** Final verification
   - Run full type check
   - Run all tests
   - Verify ~370 type errors eliminated

## Success Criteria

- [ ] All 13 use cases return `Result<T, DomainError>` instead of throwing
- [ ] All affected controllers use `result.kind === "err"` pattern
- [ ] TypeScript compilation in adapters package shows near-zero errors
- [ ] All existing unit tests pass with updated assertions
- [ ] No `AppError` imports remain in the 13 refactored use cases
- [ ] Controllers have consistent error handling (no try/catch for use case errors)

## Rollback Plan

Each use case refactor is isolated:

- No cross-dependencies between use cases
- Git history provides per-file rollback capability
- Can refactor incrementally (1-2 files at a time)
- Original `AppError` utilities remain available if needed

## Benefits

1. **Type safety:** Compile-time guarantees instead of runtime exceptions
2. **Consistency:** Single error handling pattern across 88 use cases
3. **Composability:** `Result` enables functional composition (flatMap, map)
4. **Testability:** Easier to assert error cases without exception handling
5. **Maintainability:** Follows established patterns documented in AGENTS.md
