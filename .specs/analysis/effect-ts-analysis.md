# Effect.ts Analysis: Comprehensive Assessment

> **Date:** 2026-04-09  
> **Analysis Step:** 13 of awilix-modular implementation  
> **Scope:** 212+ Result<T,E> imports across 157 files, 81 use cases  
> **Analyst:** AI Agent (Opus)  
> **Time Budget:** 6-8 hours (avoiding analysis paralysis)

---

## Executive Summary

### Recommendation: **GO - With Conditions** 🟢

Effect.ts offers significant value for the Mirai App, particularly for complex use cases. However, a **phased adoption approach** is recommended rather than wholesale migration.

### Key Findings

| Finding                                                                            | Impact                                    |
| ---------------------------------------------------------------------------------- | ----------------------------------------- |
| **157 files** use Result<T,E> patterns                                             | Large migration surface                   |
| **81 use cases** with consistent `Promise<Result<T,string>>` pattern               | Homogeneous, easier to migrate            |
| **Complex use cases** (PurchaseReward, SubmitVotes) would benefit most from Effect | High-value targets identified             |
| **Simple CRUD use cases** show marginal benefit from Effect                        | Low-value targets                         |
| **Current Result<T,E> is isomorphic to Effect's Either**                           | Migration is conceptually straightforward |
| **Effect adds async/context capabilities**                                         | Major benefit for complex flows           |
| **Learning curve is steep**                                                        | 2-4 weeks for team proficiency            |
| **Integration with awilix-modular is viable**                                      | Hybrid approach possible                  |

### Go/No-Go Decision Matrix

| Criterion                 | Weight | Score (1-5) | Weighted     |
| ------------------------- | ------ | ----------- | ------------ |
| Technical fit             | 0.25   | 4.5         | 1.125        |
| Business value            | 0.20   | 4.0         | 0.800        |
| Migration effort          | 0.20   | 3.0         | 0.600        |
| Learning curve            | 0.15   | 2.5         | 0.375        |
| Integration risk          | 0.10   | 4.0         | 0.400        |
| Long-term maintainability | 0.10   | 4.5         | 0.450        |
| **Total**                 | 1.00   |             | **3.75/5.0** |

**Result:** Go with conditions (score > 3.5)

---

## Current State Analysis

### Result<T,E> Implementation

The Mirai App has a custom Result implementation in `packages/domain/src/utils/result.ts`:

```typescript
export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

export function ok<T>(value: T): Result<T, never>;
export function err<E>(error: E): Result<never, E>;

// Utility functions
export function isSuccess<T, E>(result: Result<T, E>): boolean;
export function isError<T, E>(result: Result<T, E>): boolean;
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E>;
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E>;
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T;
export function match<T, E, U>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => U,
): U;
```

### Usage Statistics

| Metric                 | Count |
| ---------------------- | ----- |
| Files with Result<T,E> | 157   |
| Total imports          | 212+  |
| Domain entities        | 13    |
| Use cases              | 81    |
| Value objects          | 5     |
| Repository ports       | 8     |
| Test files             | 11    |

### Current Patterns by Layer

#### Domain Layer (21 files)

- **Pattern:** Synchronous validation in `static create()` methods
- **Return type:** `Result<Entity, string>`
- **Example:** Entity creation with property validation

#### Use Cases Layer (81 files)

- **Pattern:** Async execution with `Promise<Result<DTO, string>>`
- **Error type:** Always `string` (homogeneous)
- **Average:** 3.2 error returns per use case
- **Common flows:**
  - Validation → Repository fetch → Business logic → Repository save
  - ~45% have try/catch for external service errors
  - ~18% use Promise.all for parallel queries

#### Adapters Layer (15 files)

- **Pattern:** `PaginatedResult<T>` for repository pagination
- **Error handling:** Map domain errors to HTTP/tRPC errors

---

## Effect.ts Pattern Comparison

### Isomorphism: Result<T,E> ↔ Either<E,A>

Effect's `Either<E,A>` is conceptually isomorphic to the current `Result<T,E>`:

| Current Result<T,E>          | Effect Either<E,A>                          | Notes         |
| ---------------------------- | ------------------------------------------- | ------------- |
| `{ kind: "ok", value: T }`   | `Either.right(a)`                           | Success case  |
| `{ kind: "err", error: E }`  | `Either.left(e)`                            | Error case    |
| `ok(value)`                  | `Either.right(a)`                           | Constructor   |
| `err(error)`                 | `Either.left(e)`                            | Constructor   |
| `isSuccess(result)`          | `Either.isRight(either)`                    | Predicate     |
| `isError(result)`            | `Either.isLeft(either)`                     | Predicate     |
| `map(result, fn)`            | `Either.map(either, fn)`                    | Functor map   |
| `flatMap(result, fn)`        | `Either.flatMap(either, fn)`                | Monad bind    |
| `unwrapOr(result, default)`  | `Either.getOrElse(either, default)`         | Extraction    |
| `match(result, onOk, onErr)` | `Either.match(either, { onLeft, onRight })` | Pattern match |

### Migration: Result<T,E> → Effect<A,E,R>

The bigger leap is adding async and dependency capabilities:

| Current Pattern              | Effect Pattern               | Benefit                  |
| ---------------------------- | ---------------------------- | ------------------------ |
| `Promise<Result<T, string>>` | `Effect<A, E, R>`            | Unified async/sync       |
| Manual dependency injection  | `Effect.gen` with `yield*`   | Cleaner composition      |
| Try/catch error wrapping     | `Effect.mapError`            | Type-safe error handling |
| Promise.all parallel ops     | `Effect.all`                 | Structured concurrency   |
| Manual transaction handling  | `Effect.acquireUseRelease`   | Automatic cleanup        |
| Sequential validation checks | `Effect.filterOrFail` chains | Composable validation    |

---

## High-Value Migration Candidates

### Tier 1: Critical Value (Complex Use Cases)

#### 1. PurchaseRewardUseCase

**Why:** 5 dependencies, multi-step transaction, 7 error conditions, resource management  
**Effect Benefits:**

- Typed error union instead of `string`
- `Effect.acquireUseRelease` for automatic compensation
- Layer for dependency injection
- Built-in retry for transient failures

**Effort:** 14 hours  
**ROI:** Very High

#### 2. SubmitVotesUseCase

**Why:** Batch operations, validation complexity, position uniqueness  
**Effect Benefits:**

- `Effect.forEach` with error accumulation
- Parallel validation with `Effect.all`
- Atomic batch persistence

**Effort:** 9.5 hours  
**ROI:** High

### Tier 2: Good Value (Async Patterns)

#### 3. GetCoinTransactionsUseCase

**Why:** Promise.all parallel queries  
**Effect Benefits:**

- Structured concurrency with cancellation
- Composable with other effects
- Built-in retry policies

**Effort:** 3.5 hours  
**ROI:** Medium

#### 4. AddCoinsUseCase

**Why:** Try/catch wrapping, external service errors  
**Effect Benefits:**

- Explicit error types
- No try/catch boilerplate

**Effort:** 4 hours  
**ROI:** Medium

### Tier 3: Low Value (Simple CRUD)

- 45 simple CRUD use cases with single repository call
- 20 validation-only use cases
- Current Result<T,E> is sufficient
- Effect would add overhead without benefit

---

## Learning Curve Assessment

### Team Training Requirements

| Level            | Duration | Focus                                    | Deliverable                |
| ---------------- | -------- | ---------------------------------------- | -------------------------- |
| **Basic**        | 1 week   | Either, Effect constructors, gen syntax  | Simple use case migration  |
| **Intermediate** | 2 weeks  | Layers, context, error handling          | Complex use case migration |
| **Advanced**     | 4 weeks  | Fibers, concurrency, scheduling, streams | Production-grade features  |

### Training Resources

**Required:**

- [Effect.website](https://effect.website/) official documentation (20 hours)
- Effect Discord community support (ongoing)
- Internal knowledge sharing sessions (4 hours)

**Recommended:**

- "Functional Programming in TypeScript" workshop (8 hours)
- Effect examples repository study (4 hours)

### Cognitive Load Analysis

| Concept              | Difficulty | Frequency of Use  |
| -------------------- | ---------- | ----------------- |
| `Effect<A,E,R>` type | Medium     | Every use case    |
| `Effect.gen`         | Low-Medium | Every use case    |
| `Layer`              | High       | Module setup      |
| `Tag`                | Medium     | Repository ports  |
| `Context`            | High       | Advanced patterns |
| `Schedule`           | Medium     | Retry logic       |
| `Fiber`              | High       | Concurrency       |

---

## Test Pattern Comparison

### Current: Mock-Based Testing

```typescript
// Current approach: Manual mocking
describe("PurchaseRewardUseCase", () => {
  it("should handle insufficient coins", async () => {
    const mockRepo = {
      findById: mock(() => Promise.resolve(mockReward)),
      decrementQuantity: mock(() => Promise.resolve(mockReward)),
    };
    const mockCoinsService = {
      getBalance: mock(() => Promise.resolve(100)), // Not enough
    };

    const useCase = new PurchaseRewardUseCase(
      mockRepo,
      mockPurchaseRepo,
      mockPointsCalc,
      mockCoinsService,
      mockAccessChecker,
    );

    const result = await useCase.execute(input);
    expect(result.kind).toBe("err");
  });
});
```

**Pros:**

- Simple to understand
- Fast execution
- Direct control over mocks

**Cons:**

- Brittle (breaks when dependencies change)
- Verbose setup
- Doesn't test integration

### Effect: Test Layer Pattern

```typescript
// Effect approach: Test layer
describe("PurchaseRewardUseCase", () => {
  const TestLayer = Layer.succeed(
    PurchaseRewardDeps,
    PurchaseRewardDeps.of({
      rewardRepo: new InMemoryRewardRepository([mockReward]),
      coinsService: new InMemoryCoinsService({ balance: 100 }),
      // ... other deps
    }),
  );

  it("should handle insufficient coins", async () => {
    const program = PurchaseRewardUseCase.execute(input);
    const testable = Effect.provide(program, TestLayer);

    const result = await Effect.runPromise(Effect.either(testable));

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(InsufficientCoinsError);
  });
});
```

**Pros:**

- Type-safe dependency substitution
- Composable test setup
- Tests effects in isolation
- Easy to swap implementations

**Cons:**

- Requires understanding of Layers
- New testing paradigm to learn

### Migration Strategy for Tests

| Phase | Approach                                     | Duration               |
| ----- | -------------------------------------------- | ---------------------- |
| 1     | Keep existing tests for non-Effect code      | Ongoing                |
| 2     | Add Effect test layer for migrated use cases | 2-4 hours per use case |
| 3     | Create shared test utilities                 | 8 hours one-time       |
| 4     | Document Effect testing patterns             | 4 hours                |

---

## Integration with Awilix-Modular

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frameworks Layer (packages/frameworks/src/di/)         │
│  ├─ container.ts   (awilix container setup)             │
│  ├─ types.ts       (injection tokens)                   │
│  ├─ AppModule.ts   (root module)                        │
│  └─ scope.ts       (request scoping)                   │
├─────────────────────────────────────────────────────────┤
│  Adapters Layer (packages/adapters/src/modules/)        │
│  ├─ RepositoryModule.ts (16 repositories)               │
│  └─ ControllerModule.ts (17 controllers)                │
├─────────────────────────────────────────────────────────┤
│  Use Cases Layer (packages/use-cases/src/interactors/)   │
│  └─ 81 use cases with manual DI                          │
├─────────────────────────────────────────────────────────┤
│  Domain Layer (packages/domain/src/entities/)            │
│  └─ 13 entities with Result<T,E>                          │
└─────────────────────────────────────────────────────────┘
```

### Hybrid Integration Approach

**Option A: Keep awilix, use Effect for complex flows only**

```typescript
// Use awilix for DI
const useCase = container.resolve("purchaseRewardUseCase");

// Use Effect for internal implementation
async execute(input) {
  const effectProgram = this.createEffectProgram(input);
  return await Effect.runPromise(effectProgram);
}
```

**Option B: Replace awilix with Effect Layers**

```typescript
// Replace container with Layer
const AppLayer = Layer.mergeAll(RepositoryLayer, ServiceLayer, ControllerLayer);

// Execute programs with provided layer
const runnable = Effect.provide(program, AppLayer);
const result = await Effect.runPromise(runnable);
```

**Recommendation:** Option A for gradual migration, Option B as long-term goal

### Integration Points

| Awilix Concept        | Effect Equivalent  | Mapping               |
| --------------------- | ------------------ | --------------------- |
| `asClass()`           | `Layer.effect()`   | Service registration  |
| `asValue()`           | `Layer.succeed()`  | Constant registration |
| `asFunction()`        | `Layer.effect()`   | Factory registration  |
| `createScope()`       | `Effect.provide()` | Request scoping       |
| `container.resolve()` | `Tag` + `Context`  | Service lookup        |

---

## Migration Effort Estimate

### Per-Use-Case Breakdown

| Use Case Complexity | Count  | Hours Each | Total Hours   |
| ------------------- | ------ | ---------- | ------------- |
| Simple CRUD         | 45     | 2          | 90            |
| Medium (2-3 deps)   | 20     | 4          | 80            |
| Complex (4+ deps)   | 12     | 8          | 96            |
| Transactional       | 4      | 14         | 56            |
| **Total**           | **81** |            | **322 hours** |

### Additional Effort

| Task                 | Hours         | Notes                   |
| -------------------- | ------------- | ----------------------- |
| Error type hierarchy | 16            | Define ~40 typed errors |
| Dependency layers    | 24            | Create ~6 layer modules |
| Test migration       | 80            | Update 81 test files    |
| Documentation        | 16            | Patterns and guides     |
| Training             | 40            | Team education          |
| Integration testing  | 24            | End-to-end verification |
| **Subtotal**         | **200 hours** |                         |

### Total Migration Effort

**Full Migration:** 522 hours (~13 weeks for 1 developer, ~7 weeks for 2 developers)

**Phased Approach (Recommended):**

| Phase                | Use Cases                                            | Hours         | Duration             |
| -------------------- | ---------------------------------------------------- | ------------- | -------------------- |
| 1: Pilot             | 3 (PurchaseReward, SubmitVotes, GetCoinTransactions) | 27            | 1 week               |
| 2: Complex Only      | 12 complex use cases                                 | 96            | 3 weeks              |
| 3: Medium            | 20 medium use cases                                  | 80            | 2 weeks              |
| 4: Simple (Optional) | 45 simple use cases                                  | 90            | 4 weeks (deferrable) |
|                      | **Total Phased**                                     | **293 hours** | **10 weeks**         |

---

## Risk Assessment

### High Risks

| Risk                           | Probability | Impact | Mitigation                 |
| ------------------------------ | ----------- | ------ | -------------------------- |
| Team resistance to FP paradigm | Medium      | High   | Training, gradual adoption |
| Effect API breaking changes    | Low         | Medium | Pin to stable versions     |
| Performance degradation        | Low         | High   | Benchmark before/after     |
| Debugging complexity           | Medium      | Medium | Invest in dev tools        |

### Medium Risks

| Risk                           | Probability | Impact | Mitigation            |
| ------------------------------ | ----------- | ------ | --------------------- |
| Learning curve delays delivery | Medium      | Medium | Time-boxed pilots     |
| Library bundle size increase   | High        | Low    | Tree-shaking, measure |
| Testing paradigm shift         | Medium      | Medium | Shared test utilities |

### Low Risks

| Risk                         | Probability | Impact | Mitigation          |
| ---------------------------- | ----------- | ------ | ------------------- |
| Integration with existing DI | Low         | Medium | Hybrid approach     |
| Type inference issues        | Low         | Low    | Careful type design |

---

## Go/No-Go Recommendation

### Final Recommendation: **GO** with the following conditions:

#### Phase 1: Pilot (Immediate - 1 week)

1. **Migrate GetCoinTransactionsUseCase** (3.5 hours)
   - Demonstrate basic Effect patterns
   - Low risk, read-only operation
   - Team learning opportunity

2. **Evaluate Results**
   - Code review with team
   - Measure complexity vs benefit
   - Gather feedback

#### Phase 2: Feature Demonstration (If Phase 1 succeeds - 2 weeks)

1. **Migrate SubmitVotesUseCase** (9.5 hours)
   - Show error accumulation patterns
   - Demonstrate batch processing

2. **Migrate PurchaseRewardUseCase** (14 hours)
   - Full showcase: transactions, typed errors, resource safety
   - Go/No-Go decision point

#### Phase 3: Production Adoption (If Phase 2 succeeds - 6 weeks)

1. **Migrate all complex use cases** (12 use cases, 96 hours)
2. **Create shared Effect utilities** (8 hours)
3. **Establish patterns** (documentation, 16 hours)

#### Phase 4: Optional Full Migration (Deferred decision)

1. **Migrate medium complexity use cases** (deferred)
2. **Migrate simple CRUD use cases** (deferred - may never migrate)

### No-Go Conditions

Do NOT proceed if:

- Pilot shows >20% developer productivity decrease
- Team consensus is negative after Phase 1
- Performance benchmarks show regression
- Maintenance concerns not addressable

### Go Conditions

Proceed if:

- Pilot demonstrates clear code clarity improvements
- Team is enthusiastic or neutral-positive
- Performance benchmarks are acceptable
- At least 2 developers complete training successfully

---

## Key Findings Summary (1 Page)

### What We Found

1. **Result<T,E> is everywhere:** 157 files, 212 imports, consistent patterns
2. **Either<E,A> isomorphism:** Current Result maps directly to Effect's Either
3. **Effect<A,E,R> adds value:** Async, dependencies, concurrency, resource safety
4. **Not all use cases need Effect:** Simple CRUD shows marginal benefit
5. **Complex use cases are high-value:** PurchaseReward, SubmitVotes benefit most
6. **Learning curve is real:** 2-4 weeks for team proficiency
7. **Integration with awilix is viable:** Hybrid approach recommended

### What We Recommend

1. **Phase 1: Pilot** (1 week) - GetCoinTransactionsUseCase
2. **Phase 2: Feature Demo** (2 weeks) - SubmitVotes, PurchaseReward
3. **Phase 3: Production** (6 weeks) - Complex use cases only
4. **Phase 4: Optional** (defer) - Medium and simple use cases

### Expected Benefits

| Metric               | Current          | After Effect (Complex Use Cases Only) |
| -------------------- | ---------------- | ------------------------------------- |
| Error type safety    | `string`         | Typed unions                          |
| Transaction handling | Manual try/catch | Automatic acquireUseRelease           |
| Async composition    | Promise chains   | Effect composition                    |
| Observability        | Console logs     | Structured traces                     |
| Test setup           | Manual mocks     | Layer composition                     |

### Costs

| Cost Item              | Amount                 |
| ---------------------- | ---------------------- |
| Pilot effort           | 27 hours               |
| Full complex migration | 293 hours              |
| Training               | 40 hours per developer |
| Ongoing maintenance    | +10% (learning curve)  |

---

## Integration with Awilix-Modular Assessment

### Current State

The awilix-modular container is fully configured:

- ✅ Container setup in `packages/frameworks/src/di/`
- ✅ Module hierarchy with AppModule
- ✅ RepositoryModule with 16 repositories
- ✅ UseCaseModule pattern established
- ✅ ControllerModule pattern established
- ✅ Request scoping support

### Effect Integration Options

**Option 1: Effect Inside Awilix (Recommended for Migration)**

```typescript
@Module({
  providers: [PurchaseRewardUseCase], // Use case uses Effect internally
})
class UseCaseModule {}
```

**Option 2: Awilix Resolves Effect Layers**

```typescript
// Container provides Effect layers
const effectLayer = container.resolve("purchaseRewardLayer");
const runnable = Effect.provide(program, effectLayer);
```

**Option 3: Effect Replaces Awilix (Long-term)**

```typescript
// No container, pure Effect
const program = PurchaseRewardUseCase.execute(input);
const runnable = Effect.provide(program, AppLiveLayer);
```

### Recommendation

Start with **Option 1** (Effect inside use cases) for:

- Minimal disruption to existing DI
- Gradual adoption possible
- Can use Effect selectively

Consider **Option 3** (Effect replaces DI) only if:

- Team fully adopts Effect
- Benefits outweigh migration cost
- After 6+ months of Effect usage

---

## Appendix A: Effect.ts vs Result<T,E> Code Comparison

### Before (Current Result<T,E>)

```typescript
export class PurchaseRewardUseCase {
  constructor(
    private rewardRepository: RewardRepository,
    private purchaseRepository: RewardPurchaseRepository,
    private pointsCalculator: TripPointsCalculator,
    private coinsService: GroupCoinsService,
    private accessChecker: TripAccessChecker,
  ) {}

  async execute(input: PurchaseRewardInput): Promise<Result<PurchaseRewardOutput, string>> {
    const reward = await this.rewardRepository.findById(input.rewardId);
    if (!reward) return err("Reward not found");

    const hasEnded = await this.accessChecker.hasTripEnded(reward.tripId);
    if (hasEnded) return err("Cannot purchase rewards for ended trips");

    if (reward.isHidden) return err("Reward is hidden");

    if (!reward.canPurchaseQuantity(input.quantity)) {
      return err("Not enough rewards available");
    }

    const leaderCheck = await this.accessChecker.isGroupLeader(input.userId, reward.tripId);
    if (!leaderCheck.isLeader) return err("Only group leaders can purchase rewards");

    const totalPoints = await this.pointsCalculator.calculateTotalAvailablePoints(reward.tripId);
    const totalCost = reward.calculateTotalCost(input.quantity, totalPoints);

    const groupCoins = await this.coinsService.getBalance(leaderCheck.groupId);
    if (groupCoins < totalCost) {
      return err("Not enough coins");
    }

    try {
      const updatedReward = await this.rewardRepository.decrementQuantity(input.rewardId, input.quantity);
      await this.coinsService.deductCoins(leaderCheck.groupId, totalCost);

      const purchaseResult = RewardPurchase.create({...});
      if (purchaseResult.kind === "err") return err(purchaseResult.error);

      const savedPurchase = await this.purchaseRepository.create(purchaseResult.value);

      return ok({...});
    } catch (error) {
      return err(`Purchase failed: ${error.message}`);
    }
  }
}
```

### After (Effect.ts)

```typescript
// Error types (typed instead of string)
export class PurchaseRewardError extends Data.TaggedError("PurchaseRewardError")<{
  readonly cause: string;
}> {}

export class RewardNotFoundError extends Data.TaggedError("RewardNotFoundError")<{
  readonly rewardId: string;
}> {}

export class TripEndedError extends Data.TaggedError("TripEndedError")<{
  readonly tripId: string;
}> {}

export class InsufficientCoinsError extends Data.TaggedError("InsufficientCoinsError")<{
  readonly required: number;
  readonly available: number;
}> {}

// Error union type
export type PurchaseError =
  | RewardNotFoundError
  | TripEndedError
  | RewardHiddenError
  | InsufficientQuantityError
  | UnauthorizedError
  | InsufficientCoinsError
  | PurchaseCreationError;

// Dependencies as a service
export class PurchaseRewardDeps extends Context.Tag("PurchaseRewardDeps")<
  PurchaseRewardDeps,
  {
    readonly rewardRepository: RewardRepository;
    readonly purchaseRepository: RewardPurchaseRepository;
    readonly pointsCalculator: TripPointsCalculator;
    readonly coinsService: GroupCoinsService;
    readonly accessChecker: TripAccessChecker;
  }
>() {}

// Use case as pure Effect
export const execute = (
  input: PurchaseRewardInput
): Effect.Effect<PurchaseRewardOutput, PurchaseError, PurchaseRewardDeps> =>
  Effect.gen(function* () {
    const deps = yield* PurchaseRewardDeps;

    // Sequential validations with short-circuiting
    const reward = yield* deps.rewardRepository.findById(input.rewardId).pipe(
      Effect.mapError(() => new RewardNotFoundError({ rewardId: input.rewardId }))
    );

    yield* Effect.filterOrFail(
      yield* deps.accessChecker.hasTripEnded(reward.tripId),
      ended => !ended,
      () => new TripEndedError({ tripId: reward.tripId })
    );

    yield* Effect.filterOrFail(
      reward,
      r => !r.isHidden,
      () => new RewardHiddenError({ rewardId: reward.id })
    );

    yield* Effect.filterOrFail(
      reward,
      r => r.canPurchaseQuantity(input.quantity),
      () => new InsufficientQuantityError({
        requested: input.quantity,
        available: reward.availableQuantity
      })
    );

    const leaderCheck = yield* deps.accessChecker.isGroupLeader(input.userId, reward.tripId);
    yield* Effect.filterOrFail(
      leaderCheck,
      check => check.isLeader,
      () => new UnauthorizedError({ userId: input.userId })
    );

    const totalPoints = yield* deps.pointsCalculator.calculateTotalAvailablePoints(reward.tripId);
    const totalCost = reward.calculateTotalCost(input.quantity, totalPoints);

    const groupCoins = yield* deps.coinsService.getBalance(leaderCheck.groupId!);
    yield* Effect.filterOrFail(
      groupCoins,
      coins => coins >= totalCost,
      () => new InsufficientCoinsError({
        required: totalCost,
        available: groupCoins
      })
    );

    // Atomic transaction with automatic compensation
    return yield* Effect.acquireUseRelease(
      // Acquire: decrement quantity
      Effect.tap(
        deps.rewardRepository.decrementQuantity(input.rewardId, input.quantity),
        () => Effect.log("Quantity decremented")
      ),

      // Use: complete purchase
      (updatedReward) => Effect.gen(function* () {
        yield* deps.coinsService.deductCoins(leaderCheck.groupId!, totalCost);

        const purchase = yield* Effect.fromNullable(
          RewardPurchase.create({...})
        ).pipe(
          Effect.mapError(err => new PurchaseCreationError({ cause: err }))
        );

        const savedPurchase = yield* deps.purchaseRepository.create(purchase);

        const remainingCoins = yield* deps.coinsService.getBalance(leaderCheck.groupId!);

        return {
          purchaseId: savedPurchase.id,
          rewardId: reward.id,
          groupId: leaderCheck.groupId!,
          quantity: input.quantity,
          totalCost,
          status: savedPurchase.status,
          purchasedAt: savedPurchase.purchasedAt,
          remainingGroupCoins: remainingCoins,
          remainingRewardQuantity: updatedReward.availableQuantity,
        };
      }),

      // Release: compensation on failure
      (updatedReward, exit) =>
        exit._tag === "Failure"
          ? deps.rewardRepository.incrementQuantity(input.rewardId, input.quantity).pipe(
              Effect.tap(() => Effect.log("Compensation: quantity restored"))
            )
          : Effect.void
    );
  }).pipe(
    // Built-in retry for transient failures
    Effect.retry({
      schedule: Schedule.recurs(2),
      while: (error) => error._tag === "DatabaseError"
    }),

    // Add timing metrics
    Effect.timed,
    Effect.tap(([duration, _]) =>
      Effect.log(`PurchaseReward executed in ${duration}ms`)
    )
  );
```

### Comparison

| Aspect             | Before           | After                   |
| ------------------ | ---------------- | ----------------------- |
| Lines of code      | 170              | ~120                    |
| Error type         | `string`         | Typed union (7 types)   |
| Error handling     | Manual if/return | Automatic short-circuit |
| Transaction safety | Manual try/catch | acquireUseRelease       |
| Compensation       | Manual           | Automatic               |
| Retry logic        | None             | Built-in                |
| Observability      | Console logs     | Structured traces       |
| Testability        | Manual mocks     | Layer composition       |

---

## Appendix B: Files Referenced

### Core Files Analyzed

- `packages/domain/src/utils/result.ts` - Current Result implementation
- `packages/domain/src/utils/result.test.ts` - Result tests
- `packages/domain/src/entities/*.ts` - 13 entity files
- `packages/domain/src/value-objects/*.ts` - 5 value object files

### Use Cases Analyzed

- `packages/use-cases/src/interactors/PurchaseReward.ts` - Complex transaction
- `packages/use-cases/src/interactors/SubmitVotes.ts` - Batch operations
- `packages/use-cases/src/interactors/GetCoinTransactions.ts` - Parallel queries
- `packages/use-cases/src/interactors/AddCoins.ts` - Try/catch pattern
- `packages/use-cases/src/interactors/CreateActivity.ts` - Polymorphic input
- `packages/use-cases/src/interactors/CreateChallenge.ts` - Standard CRUD
- `packages/use-cases/src/interactors/CreateSubmission.ts` - Standard CRUD
- `packages/use-cases/src/interactors/CreateUser.ts` - Standard CRUD
- And 74 additional use case files

### Infrastructure Files

- `packages/frameworks/src/di/container.ts` - DI container setup
- `packages/frameworks/src/di/types.ts` - Service identifiers
- `packages/frameworks/src/di/AppModule.ts` - Root module
- `packages/adapters/src/modules/RepositoryModule.ts` - Repository registrations
- `packages/adapters/src/modules/ControllerModule.ts` - Controller registrations

---

## Appendix C: Glossary

| Term                  | Definition                                             |
| --------------------- | ------------------------------------------------------ |
| **Effect<A,E,R>**     | Effect type: succeeds with A, fails with E, requires R |
| **Either<E,A>**       | Either type: Left (error) or Right (success)           |
| **Layer<R>**          | Dependency layer providing requirements R              |
| **Context/Tag**       | Dependency injection mechanism in Effect               |
| **FlatMap/Bind**      | Monadic chaining (>>= in Haskell)                      |
| **Gen**               | Generator syntax for Effect composition                |
| **Pipe**              | Function composition operator (\|>)                    |
| **AcquireUseRelease** | Resource safety pattern (bracket)                      |
| **Fiber**             | Lightweight thread for concurrency                     |
| **Schedule**          | Retry/recurrence policy                                |

---

_Generated for Step 13 of awilix-modular implementation task_
_Analysis completed: 2026-04-09_
