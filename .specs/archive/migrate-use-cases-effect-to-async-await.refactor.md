---
title: Migrate use-cases from Effect to async/await per AGENTS.md
type: refactor
---

## Initial User Prompt

/implement EFFECT_MIGRATION_AUDIT.md

## Description

// Will be filled in future stages by business analyst

## Migration Summary

Per EFFECT_MIGRATION_AUDIT.md analysis:

- **Total Effect-based interactors:** 155 files
- **Recommended for migration:** ~140 files (Phases 1-3)
- **Keep Effect:** ~15 files (Phase 4 - complex transactional logic)

### Migration Phases

**Phase 1: Simple Getters (Priority 1)** - ~30 files

- GetUser, GetGroup (already migrated), GetLocation, GetSponsor, GetReward, etc.

**Phase 2: Simple Mutations** - ~40 files

- CreateUser, DeleteUser, UpdateUser, CreateGroup, etc.

**Phase 3: Medium Complexity** - ~35 files

- CreateLocation, UpdateLocation, ShareLocation, CreateTrip, etc.

**Phase 4: High Complexity** - ~15 files (RETAIN Effect)

- PurchaseReward, AddCoins, RemoveCoins, SubmitVote, etc.

### Target Pattern (from GetGroup.ts)

```typescript
// Port interface - Promise-based
export interface GroupRepository {
  findById(id: string): Promise<Group | null>;
}

// Use case - class-based with constructor injection
export class GetGroupUseCase {
  constructor(private readonly groupRepo: GroupRepository) {}

  async execute(
    input: GetGroupInput,
  ): Promise<Result<GetGroupOutput, GetGroupNotFoundError>> {
    const group = await this.groupRepo.findById(input.groupId);
    if (!group) {
      return err(new GetGroupNotFoundError());
    }
    return ok(toOutput(group));
  }
}

// Backward-compatible wrapper
export async function getGroupUseCase(
  input: GetGroupInput,
  groupRepo: GroupRepository,
): Promise<Result<GetGroupOutput, GetGroupNotFoundError>> {
  const useCase = new GetGroupUseCase(groupRepo);
  return useCase.execute(input);
}
```

### Current Pattern (GetUser.ts - needs migration)

```typescript
// Port interface - Effect-based
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, never, never>;
}

// Use case - function-based with Context.Tag DI
export function getUserUseCase(
  input: GetUserInput,
): Effect.Effect<GetUserOutput, GetUserNotFoundError, UserRepositoryTag> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag;
    const user = yield* userRepo.findById(input.userId);
    if (!user) {
      return yield* Effect.fail(new GetUserNotFoundError());
    }
    return toOutput(user);
  });
}
```

## Files to Migrate

### Priority 1: Simple Getters (Port + Interactor pairs)

- [ ] packages/use-cases/src/ports/UserRepository.ts
- [ ] packages/use-cases/src/interactors/GetUser.ts
- [ ] packages/use-cases/src/ports/LocationRepository.ts
- [ ] packages/use-cases/src/interactors/GetLocation.ts
- [ ] packages/use-cases/src/ports/SponsorRepository.ts
- [ ] packages/use-cases/src/interactors/GetSponsor.ts
- [ ] packages/use-cases/src/ports/RewardRepository.ts
- [ ] packages/use-cases/src/interactors/GetReward.ts
- [ ] packages/use-cases/src/ports/SubmissionRepository.ts
- [ ] packages/use-cases/src/interactors/GetSubmission.ts
- [ ] packages/use-cases/src/ports/ChallengeRepository.ts
- [ ] packages/use-cases/src/interactors/GetChallenge.ts

### Priority 2: Simple Mutations

- [ ] CreateUser, DeleteUser, UpdateUser + UserRepository methods
- [ ] CreateGroup, UpdateGroup, DeleteGroup + GroupRepository (already migrated)
- [ ] CreateSponsor, UpdateSponsor, DeleteSponsor + SponsorRepository
- [ ] CreateReward, UpdateReward, DeleteReward + RewardRepository
- [ ] CreateActivity, UpdateActivity, DeleteActivity + ActivityRepository
- [ ] DeleteSubmission, DeleteChallenge, DeleteTrip + respective repositories

## Migration Steps per File

1. **Migrate Port Interface:**
   - Change `Effect.Effect<T, never, never>` to `Promise<T>`
   - Remove `Context.Tag` definitions
   - Add repository identifier symbol for DI

2. **Migrate Interactor:**
   - Convert function to class with constructor injection
   - Change `Effect.gen` to `async execute`
   - Replace `yield*` with `await`
   - Replace `Effect.fail` with `err()` return
   - Return `Promise<Result<T,E>>` using `ok()` and `err()`
   - Add backward-compatible function wrapper

3. **Update Tests:**
   - Convert `Effect.runPromise` calls to direct `await`
   - Replace mock repository tags with direct mock objects
   - Use `Result<T,E>` assertions instead of `Either` assertions

4. **Update Controllers:**
   - Resolve use case from container instead of creating Effect program
   - Remove `Effect.provideService` calls
   - Handle `Result<T,E>` directly with `if (result.kind === "err")`

## Success Criteria

- [ ] All P1 interactors migrated to async/await
- [ ] Port interfaces return Promise instead of Effect.Effect
- [ ] Tests pass with new pattern
- [ ] No `Effect.runPromise` calls in use-cases layer (except P4)
- [ ] Backward-compatible wrappers provided for gradual migration
