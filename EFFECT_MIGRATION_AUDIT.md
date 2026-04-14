# Effect Migration Audit Report

## Executive Summary

This audit analyzes Effect framework usage across the Mirai App monorepo and identifies opportunities to simplify `Effect.runPromise` calls by migrating to direct async/await patterns, per AGENTS.md guidelines.

## Current State Statistics

### Overall Effect Usage

| Metric                             | Count  |
| ---------------------------------- | ------ |
| Total `Effect.runPromise` calls    | ~1,452 |
| Interactor files with `Effect.gen` | 155    |
| Total interactor files             | 209    |
| Port files with Effect types       | 20+    |
| Test files using Effect            | 80+    |

### Distribution by Layer

```
packages/use-cases/src/interactors/     155 files with Effect.gen
packages/use-cases/src/ports/           20+ files with Effect types
packages/adapters/src/gateways/         Heavy Effect usage (expected)
apps/backend-server/src/__tests__/     E2E tests with Effect
packages/domain/src/                    Effect exports available
```

## Architecture Analysis

### Current Pattern (Effect-Based)

**Use Case Layer (Current - Non-compliant with AGENTS.md):**

```typescript
// Interactor returns Effect.Effect
export function getUserUseCase(
  input: GetUserInput,
): Effect.Effect<GetUserOutput, GetUserNotFoundError, UserRepositoryTag> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag; // Context.Tag DI
    const user = yield* userRepo.findById(input.userId);
    if (!user) {
      return yield* Effect.fail(new GetUserNotFoundError());
    }
    return toOutput(user);
  });
}

// Usage in controller
const program = getUserUseCase(input).pipe(
  Effect.provideService(UserRepositoryTag, repository),
);
const result = await Effect.runPromise(program);
```

**Port Layer (Current):**

```typescript
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, never, never>;
  create(user: User): Effect.Effect<User, never, never>;
  // ... all methods return Effect.Effect
}

// Context.Tag for DI
export class UserRepositoryTag extends Context.Tag("UserRepository")<...>() {}
```

### Target Pattern (Per AGENTS.md)

**Use Case Layer (Target):**

```typescript
// Class-based with constructor injection
export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(
    input: GetUserInput,
  ): Promise<Result<GetUserOutput, GetUserNotFoundError>> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return err(new GetUserNotFoundError());
    }
    return ok(toOutput(user));
  }
}
```

**Port Layer (Target):**

```typescript
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  // ... all methods return Promise
}
```

**DI Configuration (awilix-modular):**

```typescript
export const UseCaseModule = createStaticModule({
  name: "UseCaseModule",
  imports: [RepositoryModule],
  providers: {
    getUserUseCase: {
      factory: (cradle) => new GetUserUseCase(cradle.userRepository),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["getUserUseCase"],
});
```

## Migration Priority Matrix

### Phase 1: High-Impact, Low-Risk (Recommended First)

**Criteria:** Simple CRUD operations, no complex Effect composition

| Use Case       | Complexity | Test Coverage | Migration Priority |
| -------------- | ---------- | ------------- | ------------------ |
| GetUser        | Low        | High          | **P1**             |
| CreateUser     | Low        | High          | **P1**             |
| GetGroup       | Low        | High          | **P1**             |
| GetLocation    | Low        | High          | **P1**             |
| GetSponsor     | Low        | Medium        | **P1**             |
| GetReward      | Low        | High          | **P1**             |
| GetSubmission  | Low        | High          | **P1**             |
| GetChallenge   | Low        | High          | **P1**             |
| ListSponsors   | Low        | Medium        | **P1**             |
| DeleteLocation | Low        | Medium        | **P1**             |

### Phase 2: Medium Complexity

**Criteria:** Multiple repository calls, simple business logic

| Use Case          | Complexity | Notes                      |
| ----------------- | ---------- | -------------------------- |
| UpdateUser        | Medium     | Validation + update        |
| UpdateLocation    | Medium     | Validation + update        |
| CreateLocation    | Medium     | Validation + creation      |
| UpdateSponsor     | Medium     | Validation + update        |
| ShareLocation     | Medium     | Multiple entity operations |
| AddSharingUser    | Medium     | Permission checks          |
| RemoveSharingUser | Medium     | Permission checks          |

### Phase 3: High Complexity (Effect-Heavy)

**Criteria:** Complex Effect composition, parallel operations, sophisticated error handling

| Use Case                   | Complexity | Why Complex                                 |
| -------------------------- | ---------- | ------------------------------------------- |
| PurchaseReward             | High       | Transactional operations, coin calculations |
| AddCoins                   | High       | Race condition handling                     |
| RemoveCoins                | High       | Race condition handling                     |
| SubmitVote                 | High       | Multiple vote operations                    |
| SubmitVotes                | High       | Batch operations                            |
| ListRewards                | High       | Complex calculations                        |
| ForceEndVoting             | High       | Complex state transitions                   |
| CreateNotificationSchedule | High       | Scheduling logic                            |

### Phase 4: Keep Effect (Adapter Boundaries)

**Criteria:** External service integration, complex async orchestration

These should **retain Effect usage** per AGENTS.md guidelines:

- Storage adapter operations (file upload/download)
- Realtime adapter operations (subscriptions)
- External API calls with retry logic
- Complex transaction coordination

## File-by-File Migration Candidates

### Priority 1: Simple Getters (Ready for Migration)

```
packages/use-cases/src/interactors/GetUser.ts
packages/use-cases/src/interactors/GetGroup.ts
packages/use-cases/src/interactors/GetLocation.ts
packages/use-cases/src/interactors/GetSponsor.ts
packages/use-cases/src/interactors/GetReward.ts
packages/use-cases/src/interactors/GetSubmission.ts
packages/use-cases/src/interactors/GetChallenge.ts
packages/use-cases/src/interactors/GetActivityById.ts
packages/use-cases/src/interactors/GetNotification.ts
packages/use-cases/src/interactors/GetTripById.ts
packages/use-cases/src/interactors/GetCoinQuickStats.ts
packages/use-cases/src/interactors/GetCoinAdditionalInsights.ts
packages/use-cases/src/interactors/GetDeliveryStats.ts
packages/use-cases/src/interactors/GetFailedDeliveries.ts
packages/use-cases/src/interactors/GetDeliveries.ts
packages/use-cases/src/interactors/GetNotificationScheduleById.ts
packages/use-cases/src/interactors/GetNotificationSchedules.ts
packages/use-cases/src/interactors/GetUpcomingNotificationSchedules.ts
packages/use-cases/src/interactors/GetNotificationScheduleExecutionHistory.ts
packages/use-cases/src/interactors/GetMostActiveAdminStats.ts
packages/use-cases/src/interactors/GetJudgedStaffVotingProgress.ts
packages/use-cases/src/interactors/GetChallengeVotingProgress.ts
packages/use-cases/src/interactors/GetVotesByChallenge.ts
packages/use-cases/src/interactors/GetMyVotes.ts
packages/use-cases/src/interactors/GetPurchaseHistory.ts
packages/use-cases/src/interactors/GetReports.ts
packages/use-cases/src/interactors/GetSharingSettings.ts
packages/use-cases/src/interactors/GetCoinTransactions.ts
packages/use-cases/src/interactors/GetCoinStatistics.ts
packages/use-cases/src/interactors/GetDeliveryByNotificationId.ts
packages/use-cases/src/interactors/GetSubmissionByChallengeAndGroup.ts
packages/use-cases/src/interactors/ListLocations.ts
packages/use-cases/src/interactors/ListSponsors.ts
packages/use-cases/src/interactors/ListSubmissionsByChallenge.ts
```

### Priority 2: Simple Mutations

```
packages/use-cases/src/interactors/CreateUser.ts
packages/use-cases/src/interactors/DeleteUser.ts
packages/use-cases/src/interactors/UpdateUser.ts
packages/use-cases/src/interactors/CreateGroup.ts
packages/use-cases/src/interactors/UpdateGroup.ts
packages/use-cases/src/interactors/DeleteGroup.ts
packages/use-cases/src/interactors/DeleteLocation.ts
packages/use-cases/src/interactors/CreateSponsor.ts
packages/use-cases/src/interactors/UpdateSponsor.ts
packages/use-cases/src/interactors/DeleteSponsor.ts
packages/use-cases/src/interactors/LinkSponsorToTrip.ts
packages/use-cases/src/interactors/UnlinkSponsorFromTrip.ts
packages/use-cases/src/interactors/DeleteReward.ts
packages/use-cases/src/interactors/SetRewardHidden.ts
packages/use-cases/src/interactors/CreateActivity.ts
packages/use-cases/src/interactors/UpdateActivity.ts
packages/use-cases/src/interactors/DeleteActivity.ts
packages/use-cases/src/interactors/HideActivity.ts
packages/use-cases/src/interactors/UnhideActivity.ts
packages/use-cases/src/interactors/DeleteSubmission.ts
packages/use-cases/src/interactors/DeleteChallenge.ts
packages/use-cases/src/interactors/DeleteNotification.ts
packages/use-cases/src/interactors/DeleteNotificationSchedule.ts
packages/use-cases/src/interactors/DeleteTrip.ts
packages/use-cases/src/interactors/UpdateChallengeStatus.ts
packages/use-cases/src/interactors/ToggleNotificationScheduleActive.ts
packages/use-cases/src/interactors/BulkDeleteNotificationSchedules.ts
packages/use-cases/src/interactors/BulkToggleNotificationScheduleActive.ts
```

### Priority 3: Medium Complexity

```
packages/use-cases/src/interactors/CreateLocation.ts
packages/use-cases/src/interactors/UpdateLocation.ts
packages/use-cases/src/interactors/ShareLocation.ts
packages/use-cases/src/interactors/AddSharingUser.ts
packages/use-cases/src/interactors/RemoveSharingUser.ts
packages/use-cases/src/interactors/CreateTrip.ts
packages/use-cases/src/interactors/UpdateTrip.ts
packages/use-cases/src/interactors/CreateSubmission.ts
packages/use-cases/src/interactors/UpdateSubmission.ts
packages/use-cases/src/interactors/CreateChallenge.ts
packages/use-cases/src/interactors/UpdateChallenge.ts
packages/use-cases/src/interactors/CreateChallengeVote.ts
packages/use-cases/src/interactors/UpdateChallengeVote.ts
packages/use-cases/src/interactors/DeleteChallengeVote.ts
packages/use-cases/src/interactors/CreateNotification.ts
packages/use-cases/src/interactors/UpdateNotification.ts
packages/use-cases/src/interactors/ScheduleNotification.ts
packages/use-cases/src/interactors/UpdateNotificationSchedule.ts
packages/use-cases/src/interactors/UpdateNotificationScheduleLastRun.ts
packages/use-cases/src/interactors/DuplicateNotificationSchedule.ts
packages/use-cases/src/interactors/CreateReward.ts
packages/use-cases/src/interactors/UpdateReward.ts
packages/use-cases/src/interactors/UpdatePurchaseStatus.ts
packages/use-cases/src/interactors/UpdateMyPurchaseStatus.ts
packages/use-cases/src/interactors/UpdateSharingSettings.ts
packages/use-cases/src/interactors/LogTelemetry.ts
```

### Priority 4: High Complexity (Retain Effect for Now)

```
packages/use-cases/src/interactors/PurchaseReward.ts      # Complex transactions
packages/use-cases/src/interactors/AddCoins.ts            # Race conditions
packages/use-cases/src/interactors/RemoveCoins.ts         # Race conditions
packages/use-cases/src/interactors/SubmitVote.ts          # Multiple operations
packages/use-cases/src/interactors/SubmitVotes.ts          # Batch operations
packages/use-cases/src/interactors/ListRewards.ts         # Complex calculations
packages/use-cases/src/interactors/ForceEndVoting.ts       # Complex state transitions
packages/use-cases/src/interactors/AuthenticateUser.ts   # Auth complexity
packages/use-cases/src/interactors/RefreshToken.ts         # Auth complexity
packages/use-cases/src/interactors/LogoutUser.ts          # Auth complexity
packages/use-cases/src/interactors/AddReaction.ts          # Activity feed + notifications
packages/use-cases/src/interactors/CreateReport.ts         # Report + notifications
packages/use-cases/src/interactors/AuthorizeModerator.ts  # Role checks
packages/use-cases/src/interactors/AuthorizeAdmin.ts      # Role checks (already uses Result!)
```

## Migration Strategy

### Step 1: Port Layer Migration (Foundation)

**Before:**

```typescript
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, never, never>;
}
```

**After:**

```typescript
export interface UserRepository {
  findById(id: string): Promise<User | null>;
}
```

### Step 2: Interactor Migration

**Before:**

```typescript
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

**After:**

```typescript
export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(
    input: GetUserInput,
  ): Promise<Result<GetUserOutput, GetUserNotFoundError>> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return err(new GetUserNotFoundError());
    }
    return ok(toOutput(user));
  }
}
```

### Step 3: Adapter Migration

**Before:**

```typescript
// Controller
const program = getUserUseCase(input).pipe(
  Effect.provideService(UserRepositoryTag, this.userRepo),
);
const result = await Effect.runPromise(program);
```

**After:**

```typescript
// Controller
const useCase = this.container.resolve("getUserUseCase");
const result = await useCase.execute(input);
if (result.kind === "err") {
  throw new TRPCError({ code: "NOT_FOUND", message: result.error.message });
}
return result.value;
```

## Test Migration

### Before:

```typescript
const program = getUserUseCase(input).pipe(
  Effect.provideService(UserRepositoryTag, mockRepo),
);
const either = await Effect.runPromise(Effect.either(program));
expect(Either.isLeft(either)).toBe(true);
```

### After:

```typescript
const useCase = new GetUserUseCase(mockRepo);
const result = await useCase.execute(input);
expect(result.kind).toBe("err");
```

## Risk Assessment

| Risk                    | Impact | Mitigation                                   |
| ----------------------- | ------ | -------------------------------------------- |
| Breaking existing tests | High   | Migrate tests alongside interactors          |
| Runtime errors          | High   | Comprehensive test coverage, gradual rollout |
| Type incompatibility    | Medium | Update port interfaces first                 |
| DI container changes    | Medium | Update module definitions                    |
| Performance regression  | Low    | Benchmark before/after                       |
| Developer confusion     | Low    | Update AGENTS.md examples                    |

## Effort Estimation

| Phase                       | Files    | Estimated Effort         |
| --------------------------- | -------- | ------------------------ |
| Phase 1 (Simple Getters)    | ~30      | 2-3 days                 |
| Phase 2 (Simple Mutations)  | ~40      | 3-4 days                 |
| Phase 3 (Medium Complexity) | ~35      | 5-7 days                 |
| Phase 4 (High Complexity)   | ~10      | 3-5 days (retain Effect) |
| Port Layer Migration        | 20+      | 2-3 days                 |
| Test Migration              | 80+      | 5-7 days                 |
| **Total**                   | **~165** | **20-29 days**           |

## Recommended Migration Order

1. **Foundation First:** Migrate port interfaces from Effect to Promise
2. **Batch by Feature:** Migrate all interactors for a single feature together
3. **Tests Together:** Update tests immediately after interactor migration
4. **Controllers Last:** Update adapter controllers after use cases are stable
5. **Keep Effect Where Needed:** Don't force-migrate complex transactional code

## Success Criteria

- [ ] All P1 interactors migrated to async/await
- [ ] All P2 interactors migrated to async/await
- [ ] Test coverage maintained at current levels
- [ ] No `Effect.runPromise` calls in use-cases layer (except P4)
- [ ] All new code follows AGENTS.md guidelines
- [ ] Performance benchmarks show no regression

## Conclusion

The migration from Effect-based to async/await patterns in the use-cases layer is **feasible and recommended** per AGENTS.md guidelines. Approximately **140 of 155 interactors** can be migrated, while **~15 complex interactors** should retain Effect for transactional and orchestration benefits.

**Recommended approach:**

1. Start with Phase 1 (simple getters) to validate the pattern
2. Migrate port interfaces first (foundation)
3. Batch migrate by feature area
4. Maintain test parity throughout
5. Keep Effect at adapter boundaries where it provides clear value

The estimated effort is **3-4 weeks** for full migration, but this can be done incrementally without disrupting ongoing development.
