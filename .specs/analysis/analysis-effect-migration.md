# Phase 2b: Codebase Impact Analysis - Effect Migration

**Task:** Reverse Effect migration - Keep Effect everywhere with RunPromise for external libraries
**Analysis Date:** 2026-04-14

---

## Executive Summary

This analysis identifies all files affected by the migration to keep Effect everywhere while using `Effect.runPromise` for external library integration. The migration reverses the previous async/await migration for use cases and ports.

**Key Finding:** Only 3 use case files and 3 port interfaces need modification. Most other files already use Effect or are pure synchronous functions.

---

## 1. Files Currently Using async/await (Need to Convert BACK to Effect)

These files were previously migrated FROM Effect TO async/await and now need to be reverted:

### Use Cases (3 files)

| File                                                | Current Pattern                           | Target Pattern                                          | Notes                       |
| --------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------- | --------------------------- |
| `packages/use-cases/src/interactors/GetUser.ts`     | `async execute() => Promise<Result<T,E>>` | `execute() => Effect.Effect<Result<T,E>, never, never>` | Constructor injection stays |
| `packages/use-cases/src/interactors/GetGroup.ts`    | `async execute() => Promise<Result<T,E>>` | `execute() => Effect.Effect<Result<T,E>, never, never>` | Constructor injection stays |
| `packages/use-cases/src/interactors/GetLocation.ts` | `async execute() => Promise<Result<T,E>>` | `execute() => Effect.Effect<Result<T,E>, never, never>` | Constructor injection stays |

**Changes Required:**

- Remove `async` keyword from `execute()` method
- Change return type from `Promise<Result<T,E>>` to `Effect.Effect<Result<T,E>, never, never>`
- Wrap repository calls with `Effect.tryPromise()` or `Effect.gen()` + `yield*`
- Keep `Result<T,E>` as the success value type
- Legacy function-based API stays for backward compatibility

### Files NOT Affected (Pure Synchronous - No Changes Needed)

| File                                                       | Reason                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/use-cases/src/interactors/AuthorizeAdmin.ts`     | Pure synchronous, returns `Result<T,E>` directly (not Promise) |
| `packages/use-cases/src/interactors/AuthorizeModerator.ts` | Pure synchronous, returns `Result<T,E>` directly (not Promise) |

---

## 2. Port Interfaces Using Promise (Need to Change to Effect.Effect)

These port interfaces were migrated FROM Effect.Effect TO Promise and need to be reverted:

### Port Interfaces (3 files)

| File                                                 | Current Pattern             | Target Pattern                                          |
| ---------------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| `packages/use-cases/src/ports/UserRepository.ts`     | Methods return `Promise<T>` | Methods return `Effect.Effect<T, DatabaseError, never>` |
| `packages/use-cases/src/ports/GroupRepository.ts`    | Methods return `Promise<T>` | Methods return `Effect.Effect<T, DatabaseError, never>` |
| `packages/use-cases/src/ports/LocationRepository.ts` | Methods return `Promise<T>` | Methods return `Effect.Effect<T, DatabaseError, never>` |

**Note:** Comments in these files say "Migrated from Effect.Effect to Promise per AGENTS.md guidelines" - these comments need to be updated or removed.

### Ports ALREADY Using Effect.Effect (No Changes Needed)

Based on grep search, these ports already use Effect.Effect and do NOT need changes:

- `NotificationRepository.ts`
- `SponsorRepository.ts`
- `RewardRepository.ts`
- `ChallengeRepository.ts`
- `ChallengeVoteRepository.ts`
- `ChallengeSubmissionRepository.ts`
- `StoragePort.ts`
- `RealtimePort.ts`
- `AuthPort.ts`
- `SubmissionReportRepository.ts`
- `TripRepository.ts`
- `NotificationDeliveryRepository.ts`
- `NotificationScheduleRepository.ts`
- `EventRepository.ts`
- `CoinTransactionRepository.ts`
- `ActivityFeedRepository.ts`
- `TelemetryPort.ts`
- `PubSubService.ts`

---

## 3. Repository Implementations (Need to Wrap External Calls with Effect.tryPromise)

### In-Memory Repositories (MIXED STATE - Partial Changes Needed)

The in-memory repositories have a MIXED implementation:

- Some already return `Effect.Effect<T>` (GroupRepository, others)
- Some already return `Promise<T>` via `Effect.runPromise()` (UserRepository)

**Files requiring updates to return Effect.Effect:**

| File                                                | Current Pattern                                | Target Pattern                                   |
| --------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| `packages/adapters/src/gateways/in-memory/user.ts`  | Returns `Promise<T>` via `Effect.runPromise()` | Return `Effect.Effect<T, never, never>` directly |
| `packages/adapters/src/gateways/in-memory/group.ts` | Already returns `Effect.Effect<T>`             | ✅ No changes needed                             |

**Note:** `InMemoryGroupRepository` already returns Effect.Effect - it's ahead of the migration!

### Drizzle Repositories

The Drizzle repositories need to be checked. They likely already use Effect or need wrapping:

**Expected pattern:**

```typescript
// From Promise-based
create(user: User): Promise<User> {
  return this.db.insert(users).values(user);
}

// To Effect-based
create(user: User): Effect.Effect<User, DatabaseError, never> {
  return Effect.tryPromise({
    try: () => this.db.insert(users).values(user),
    catch: (error) => new DatabaseError({ operation: 'create', cause: error })
  });
}
```

Files to check/update:

- `packages/adapters/src/gateways/drizzle/user.ts`
- `packages/adapters/src/gateways/drizzle/group.ts`
- `packages/adapters/src/gateways/drizzle/location.ts`
- And other drizzle repository files

---

## 4. Files Still Using Effect (Can Be Kept As-Is)

### Domain Layer (No Changes)

All domain entities already use Effect internally for validation. They should stay as-is.

### In-Memory Repositories Already Using Effect

- `packages/adapters/src/gateways/in-memory/group.ts` - Already returns `Effect.Effect<T>`

### Test Repositories Using Effect

Many test mocks already use Effect.Effect in their type signatures - these should stay.

---

## 5. Test Files That Need Updating

### Test Files for Affected Use Cases (3 files)

| File                                                     | Current Pattern                                        | Target Pattern                                      |
| -------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| `packages/use-cases/src/interactors/GetUser.test.ts`     | Uses `Effect.runPromise()` + `Effect.provideService()` | Use `Effect.gen()` + direct repository injection    |
| `packages/use-cases/src/interactors/GetGroup.test.ts`    | Uses async/await with Promise-based mock               | Use `Effect.gen()` + yield\* for use case execution |
| `packages/use-cases/src/interactors/GetLocation.test.ts` | Uses async/await with Promise-based mock               | Use `Effect.gen()` + yield\* for use case execution |

**GetUser.test.ts Specifics:**

- Currently uses legacy `Effect.provideService()` pattern
- Uses `UserRepositoryTag` (deprecated)
- Needs to switch to direct constructor injection like GetGroup.test.ts
- But use Effect.gen() instead of async/await

**GetGroup.test.ts Specifics:**

- Already uses constructor injection pattern ✅
- Mock repository returns Promises - needs to return Effect.Effect
- Tests use async/await - need to use `Effect.runPromise()`

**GetLocation.test.ts Specifics:**

- Already uses constructor injection pattern ✅
- Mock repository returns Promises - needs to return Effect.Effect
- Tests use async/await - need to use `Effect.runPromise()`

### Example Test Pattern Change

**From (Current GetGroup.test.ts pattern):**

```typescript
const result = await useCase.execute(input);
expect(isOk(result)).toBe(true);
```

**To (Target pattern):**

```typescript
const result = await Effect.runPromise(useCase.execute(input));
expect(isOk(result)).toBe(true);
// OR if use case returns Effect.Effect<Output, Error, never>
const result = await Effect.runPromise(useCase.execute(input));
// result is directly the output (Effect handles errors via error channel)
```

---

## Summary of Changes Required

| Category            | Files                | Change Type                                                       |
| ------------------- | -------------------- | ----------------------------------------------------------------- |
| **Use Cases**       | 3 files              | Remove async/await, return Effect.Effect                          |
| **Ports**           | 3 files              | Change method signatures from Promise to Effect.Effect            |
| **In-Memory Repos** | 1 file (user.ts)     | Remove Effect.runPromise() wrapper, return Effect.Effect directly |
| **Drizzle Repos**   | TBD after inspection | Add Effect.tryPromise wrapping                                    |
| **Tests**           | 3 files              | Use Effect.runPromise() for execution, update mocks               |

**Total Files Affected:** ~10 files

**Files Already Compliant:**

- Most ports (15+ files already use Effect.Effect)
- InMemoryGroupRepository (already returns Effect.Effect)
- All pure synchronous use cases (AuthorizeAdmin, AuthorizeModerator)

---

## Migration Order Recommendation

1. **Phase 1:** Update Port interfaces (UserRepository, GroupRepository, LocationRepository)
2. **Phase 2:** Update In-Memory repositories to match new port signatures
3. **Phase 3:** Update Use Cases (GetUser, GetGroup, GetLocation)
4. **Phase 4:** Update Tests
5. **Phase 5:** Update Drizzle repositories (if needed)
