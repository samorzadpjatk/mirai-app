---
title: "Refactor 13 Throwing Use Cases to Effect<T,E,R>"
type: task
status: ready
priority: high
created: "2026-04-14"
updated: "2026-04-14"
---

## Initial Request

Refactor 13 throwing use cases to use `Effect<T,E,R>` pattern, aligning with the Effect framework migration. This resolves type errors and standardizes error handling across the use-cases layer.

## Description

### Why This is Needed

Currently 13 use cases throw exceptions while the majority use Effect-based patterns. This creates:

- Type mismatches between controllers and use cases
- Inconsistent error handling (exceptions vs Effect failures)
- Violates Clean Architecture principles (exceptions leak across boundaries)
- Blocks full adoption of Effect framework benefits

### What This Accomplishes

**Target outcome:** All use cases use unified `Effect<T,E,R>` pattern

**Key deliverables:**

1. **13 use cases refactored** from throwing to Effect-based
2. **7 controllers updated** to use Effect error handling
3. **~370 type errors eliminated** in adapters package
4. **Unified pattern** (`Effect.fail()` + `Effect.succeed()`)

### Scope Boundaries

**IN Scope:**

- Refactor 13 throwing use cases in `packages/use-cases/src/interactors/`
- Update 7 controllers in `packages/adapters/src/controllers/`
- Convert exceptions to `Effect.fail()` with `Data.TaggedError`
- Ensure all use cases follow Effect pattern

**OUT of Scope:**

- Changes to domain layer entities (already Effect-based)
- Changes to adapter gateways/repositories
- Database schema changes
- API contract changes (external)

## Acceptance Criteria

### Functional Criteria

- [ ] `AddCoins.ts` returns `Effect.Effect<AddCoinsOutput, DomainError, Dependencies>`
- [ ] `RemoveCoins.ts` returns `Effect.Effect<RemoveCoinsOutput, DomainError, Dependencies>`
- [ ] `CreateChallenge.ts` returns `Effect.Effect<Challenge, DomainError, Dependencies>`
- [ ] `CreateUser.ts` returns `Effect.Effect<User, DomainError, Dependencies>`
- [ ] `UpdateUser.ts` returns `Effect.Effect<User, DomainError, Dependencies>`
- [ ] `GetUser.ts` returns `Effect.Effect<User | null, DomainError, Dependencies>`
- [ ] `CreateGroup.ts` returns `Effect.Effect<Group, DomainError, Dependencies>`
- [ ] `UpdateGroup.ts` returns `Effect.Effect<Group, DomainError, Dependencies>`
- [ ] `GetGroup.ts` returns `Effect.Effect<Group | null, DomainError, Dependencies>`
- [ ] `PurchaseReward.ts` returns `Effect.Effect<RewardPurchase, DomainError, Dependencies>`
- [ ] `GetChallenge.ts` returns `Effect.Effect<Challenge | null, DomainError, Dependencies>`
- [ ] `SubmitVotes.ts` returns `Effect.Effect<VoteSubmission, DomainError, Dependencies>`
- [ ] `ForceEndVoting.ts` returns `Effect.Effect<Challenge, DomainError, Dependencies>`
- [ ] All controllers use `Effect.runPromise` with error handling
- [ ] No use case throws exceptions (all use `Effect.fail()`)

### Quality Criteria

- [ ] All use case tests pass
- [ ] All controller tests pass
- [ ] No regression in type errors (adapters package)
- [ ] Error messages remain user-friendly
- [ ] Proper use of `Data.TaggedError` for error types

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

### Target State

**Effect-based use cases (all files):**

```typescript
export class AddCoinsUseCase {
  execute(
    input: AddCoinsInput,
  ): Effect.Effect<
    AddCoinsOutput,
    DomainError,
    CoinRepository | GroupRepository
  > {
    return Effect.gen(function* () {
      const groupRepo = yield* GroupRepository;
      const coinRepo = yield* CoinRepository;

      const group = yield* groupRepo.findById(input.groupId);
      if (!group) {
        return yield* Effect.fail(
          new NotFoundError({ entity: "Group", id: input.groupId }),
        );
      }

      const transaction = yield* coinRepo.addCoins(input);
      return transaction;
    });
  }
}
```

**Controller pattern:**

```typescript
// In controller:
const program = useCase.execute(input);

const result = await Effect.runPromise(
  program.pipe(
    Effect.catchTag("NotFoundError", (error) => {
      throw new HTTPError(404, error.message);
    }),
    Effect.catchTag("ValidationError", (error) => {
      throw new HTTPError(400, error.message);
    }),
  ),
);
```

### Migration Strategy

1. **Phase 1: Update use cases** (can be parallel per use case)
   - Convert each throwing use case to Effect-based
   - Replace `throw` with `yield* Effect.fail()`
   - Wrap success with `Effect.succeed()` or implicit return
   - Update return type to `Effect.Effect<T, E, R>`

2. **Phase 2: Update controllers** (sequential - depends on Phase 1)
   - Remove try/catch blocks
   - Use `Effect.runPromise` with `Effect.catchTag`
   - Handle errors at system boundaries

3. **Phase 3: Verify** (after both phases)
   - Run full test suite
   - Check TypeScript errors in adapters
   - Verify type consistency

## Implementation Notes

### Key Patterns

**Use Case Transformation:**

```typescript
// BEFORE (throwing):
async execute(input: AddCoinsInput): Promise<AddCoinsOutput> {
  if (!valid) {
    throw AppError.notFound({ entity: "X", message: "Y" });
  }
  const result = await this.repo.save(data);
  return result;
}

// AFTER (Effect-based):
execute(input: AddCoinsInput): Effect.Effect<
  AddCoinsOutput,
  DomainError,
  Repository
> {
  return Effect.gen(function* () {
    if (!valid) {
      return yield* Effect.fail(
        new NotFoundError({ entity: "X", id: input.id })
      );
    }
    const result = yield* repo.save(data);
    return result;
  });
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

// AFTER (Effect error handling):
const program = useCase.execute(input);
const result = await Effect.runPromise(
  program.pipe(
    Effect.catchTag("NotFoundError", (error) => {
      throw new HTTPError(404, error.message);
    }),
    Effect.catchTag("ValidationError", (error) => {
      throw new HTTPError(400, error.message);
    }),
  ),
);
return success(result);
```

### Error Types

Use existing `Data.TaggedError` pattern:

```typescript
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity: string;
  id: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}
```

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

- ✅ Domain layer already using Effect
- ✅ Error types defined with `Data.TaggedError`
- ✅ `Effect.runPromise` pattern established in controllers
- ⬜ Repository ports need to be Effect-based

## Success Metrics

| Metric                    | Before | Target |
| ------------------------- | ------ | ------ |
| Throwing use cases        | 13     | 0      |
| Effect-based use cases    | 75+    | 88+    |
| Controller error patterns | 2+     | 1      |
| Adapters type errors      | ~370   | 0      |
| Test pass rate            | 100%   | 100%   |

---

**Next Step:** Use `/sdd:implement` to execute this task with sub-agent orchestration.

**Note:** This task aligns with the Effect framework migration on `new_tech_stack` branch. Coordinate with that work to avoid conflicts.
