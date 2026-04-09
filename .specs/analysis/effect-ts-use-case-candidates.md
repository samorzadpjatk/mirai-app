# Effect.ts Use Case Candidates

> **Date:** 2026-04-09  
> **Analysis Step:** 13 of awilix-modular implementation  
> **Selection Criteria:** Complexity, async patterns, error handling richness

---

## Top 3 High-Value Migration Candidates

After analyzing all 81 use cases across the Mirai App codebase, these three candidates offer the highest value for Effect.ts migration demonstration:

---

## Candidate 1: PurchaseRewardUseCase

### File Location

`packages/use-cases/src/interactors/PurchaseReward.ts`

### Why This Use Case?

| Criterion          | Score      | Justification                              |
| ------------------ | ---------- | ------------------------------------------ |
| **Complexity**     | ⭐⭐⭐⭐⭐ | Multi-step transaction with 5 dependencies |
| **Error Paths**    | ⭐⭐⭐⭐⭐ | 7 distinct error conditions                |
| **Async Patterns** | ⭐⭐⭐⭐⭐ | Sequential + parallel operations           |
| **Business Value** | ⭐⭐⭐⭐⭐ | Critical purchase flow (revenue-adjacent)  |
| **Test Coverage**  | ⭐⭐⭐⭐   | Existing 584-line test file                |

### Current Implementation Analysis

**Dependencies (5):**

```typescript
constructor(
  private rewardRepository: RewardRepository,
  private purchaseRepository: RewardPurchaseRepository,
  private pointsCalculator: TripPointsCalculator,
  private coinsService: GroupCoinsService,
  private accessChecker: TripAccessChecker,
) {}
```

**Error Handling Pattern:**

```typescript
// Current: Sequential validation with early returns
async execute(input): Promise<Result<Output, string>> {
  // 1. Find reward
  const reward = await this.rewardRepository.findById(input.rewardId);
  if (!reward) return err("Reward not found");

  // 2. Check trip ended
  const hasEnded = await this.accessChecker.hasTripEnded(reward.tripId);
  if (hasEnded) return err("Cannot purchase rewards for ended trips");

  // 3. Check hidden
  if (reward.isHidden) return err("Reward is hidden");

  // 4. Check quantity
  if (!reward.canPurchaseQuantity(input.quantity)) {
    return err("Not enough rewards available");
  }

  // 5. Check authorization
  const leaderCheck = await this.accessChecker.isGroupLeader(...);
  if (!leaderCheck.isLeader) return err("Only group leaders can purchase rewards");

  // 6. Calculate cost
  const totalPoints = await this.pointsCalculator.calculateTotalAvailablePoints(...);
  const totalCost = reward.calculateTotalCost(input.quantity, totalPoints);

  // 7. Check balance
  const groupCoins = await this.coinsService.getBalance(...);
  if (!hasEnoughCoins) return err("Not enough coins");

  // 8. Execute transaction (4 steps)
  try {
    await this.rewardRepository.decrementQuantity(...);
    await this.coinsService.deductCoins(...);
    const savedPurchase = await this.purchaseRepository.create(...);
    return ok(output);
  } catch (error) {
    return err(`Purchase failed: ${error.message}`);
  }
}
```

**Current Lines of Code:** 170 lines

### Effect.ts Migration Potential

**With Effect.ts:**

```typescript
// Effect<R,E,A> where R = Dependencies, E = PurchaseError, A = Output
execute = (
  input: PurchaseRewardInput,
): Effect<
  PurchaseRewardDeps, // R: Dependencies layer
  PurchaseError, // E: Typed errors (not string)
  PurchaseRewardOutput // A: Success output
> =>
  Effect.gen(function* () {
    const { rewardRepo, purchaseRepo, pointsCalc, coinsSvc, access } =
      yield* PurchaseRewardDeps;

    // Sequential validations with short-circuiting
    const reward = yield* rewardRepo
      .findById(input.rewardId)
      .pipe(
        Effect.mapError(
          () => new RewardNotFoundError({ rewardId: input.rewardId }),
        ),
      );

    yield* access.hasTripEnded(reward.tripId).pipe(
      Effect.filterOrFail(
        (ended) => !ended,
        () => new TripEndedError({ tripId: reward.tripId }),
      ),
    );

    yield* Effect.filterOrFail(
      reward,
      (r) => !r.isHidden,
      () => new RewardHiddenError({ rewardId: reward.id }),
    );

    // ... additional validations

    // Atomic transaction with compensation
    return yield* Effect.acquireUseRelease(
      // Acquire: decrement quantity
      rewardRepo.decrementQuantity(input.rewardId, input.quantity),
      // Use: complete purchase
      (updatedReward) =>
        Effect.gen(function* () {
          yield* coinsSvc.deductCoins(groupId, totalCost);
          const purchase = yield* purchaseRepo.create(purchaseData);
          return { purchase, updatedReward, remainingCoins };
        }),
      // Release: compensation if needed
      (updatedReward, exit) =>
        exit._tag === "Failure"
          ? rewardRepo.incrementQuantity(input.rewardId, input.quantity)
          : Effect.void,
    );
  });
```

**Estimated Lines After Migration:** ~80 lines (53% reduction)

**Key Benefits:**

1. **Typed errors:** `PurchaseError` union type instead of `string`
2. **Automatic short-circuiting:** No manual `if (err) return err` checks
3. **Resource safety:** Automatic compensation on failure
4. **Composability:** Can compose with other effects
5. **Observability:** Built-in tracing for each step

### Migration Effort Estimate

| Task                         | Hours        | Notes                    |
| ---------------------------- | ------------ | ------------------------ |
| Define typed error hierarchy | 2h           | Create 7+ error classes  |
| Create dependency layer      | 2h           | PurchaseRewardDeps layer |
| Migrate use case logic       | 4h           | Convert to Effect.gen    |
| Update tests                 | 4h           | Use Effect test layer    |
| Integration testing          | 2h           | End-to-end verification  |
| **Total**                    | **14 hours** | Pilot implementation     |

---

## Candidate 2: SubmitVotesUseCase

### File Location

`packages/use-cases/src/interactors/SubmitVotes.ts`

### Why This Use Case?

| Criterion          | Score      | Justification                            |
| ------------------ | ---------- | ---------------------------------------- |
| **Complexity**     | ⭐⭐⭐⭐   | Batch operations with validation         |
| **Error Paths**    | ⭐⭐⭐⭐⭐ | 6 distinct error conditions + validation |
| **Async Patterns** | ⭐⭐⭐⭐   | Loop with entity creation                |
| **Business Value** | ⭐⭐⭐⭐⭐ | Core voting functionality                |
| **Edge Cases**     | ⭐⭐⭐⭐⭐ | Position uniqueness, duplicate votes     |

### Current Implementation Analysis

**Batch Processing Pattern:**

```typescript
async execute(input): Promise<Result<Output, string>> {
  // Validation 1-4: Input validation
  if (!input.challengeId) return err("challengeId is required");
  if (!input.voterId) return err("voterId is required");
  if (!input.votes?.length) return err("at least one vote is required");

  // Validation 5: Already voted check
  const hasVoted = await this.voteRepository.hasVoted(...);
  if (hasVoted) return err("You have already voted in this challenge");

  // Validation 6: Vote set validation
  const validation = validateVoteSet(input.votes, input.requiredPositions);
  if (!validation.isValid) return err(validation.error);

  // Loop: Create entities (can fail individually)
  const voteEntities: ChallengeVote[] = [];
  for (const voteInput of input.votes) {
    const voteResult = ChallengeVote.create({...});
    if (voteResult.kind === "err") {
      return err(`Failed to create vote: ${voteResult.error}`);
    }
    voteEntities.push(voteResult.value);
  }

  // Batch persistence
  const savedVotes = await this.voteRepository.createMany(voteEntities);

  return ok({ votes: savedVotes, totalVotesCast: savedVotes.length });
}
```

**Current Lines of Code:** 140 lines

### Effect.ts Migration Potential

**With Effect.ts:**

```typescript
execute = (input: SubmitVotesInput): Effect<
  VoteRepositoryDeps,
  VoteSubmissionError,
  SubmitVotesOutput
> =>
  Effect.gen(function* () {
    const repo = yield* VoteRepository;

    // Validations as effects
    yield* validateRequired(input.challengeId, "challengeId");
    yield* validateRequired(input.voterId, "voterId");
    yield* validateNonEmpty(input.votes, "votes");

    // Check already voted
    yield* repo.hasVoted(input.challengeId, input.voterId).pipe(
      Effect.filterOrFail(
        hasVoted => !hasVoted,
        () => new AlreadyVotedError({ challengeId: input.challengeId })
      )
    );

    // Validate vote set
    yield* Effect.fromNullable(validateVoteSet(input.votes, input.requiredPositions))
      .pipe(Effect.mapError(() => new InvalidVoteSetError()));

    // Batch entity creation with error accumulation
    const voteEntities = yield* Effect.forEach(
      input.votes,
      (voteInput) => ChallengeVote.createEffect({...}),  // Effect version
      { discard: false }  // Collect all errors, don't short-circuit
    );

    // Atomic batch persistence
    const savedVotes = yield* repo.createMany(voteEntities);

    return { votes: savedVotes.map(toOutput), totalVotesCast: savedVotes.length };
  });
```

**Key Benefits:**

1. **Parallel validation:** Input validations could run in parallel
2. **Error accumulation:** `Effect.forEach` with `discard: false` collects all errors
3. **No manual loops:** Functional composition replaces imperative loops
4. **Atomic batching:** Transaction boundary is explicit

### Migration Effort Estimate

| Task                                  | Hours         | Notes                      |
| ------------------------------------- | ------------- | -------------------------- |
| Define typed error hierarchy          | 1.5h          | 6 error types              |
| Create Effect-friendly entity methods | 2h            | ChallengeVote.createEffect |
| Migrate use case logic                | 3h            | Batch operations           |
| Update tests                          | 3h            | Effect test patterns       |
| **Total**                             | **9.5 hours** |                            |

---

## Candidate 3: GetCoinTransactionsUseCase

### File Location

`packages/use-cases/src/interactors/GetCoinTransactions.ts`

### Why This Use Case?

| Criterion          | Score      | Justification                      |
| ------------------ | ---------- | ---------------------------------- |
| **Complexity**     | ⭐⭐⭐     | Moderate complexity                |
| **Async Patterns** | ⭐⭐⭐⭐⭐ | Promise.all parallel operations    |
| **Composability**  | ⭐⭐⭐⭐⭐ | Building block for other use cases |
| **Learning Value** | ⭐⭐⭐⭐⭐ | Shows Effect's concurrency model   |
| **Risk Level**     | ⭐⭐       | Low risk - read-only operation     |

### Current Implementation Analysis

**Parallel Data Fetching:**

```typescript
async execute(input): Promise<Result<Output, string>> {
  try {
    const limit = input.pagination?.limit ?? 50;
    const offset = input.pagination?.offset ?? 0;

    const filters = {
      tripId: input.tripId,
      ...(input.groupId && { groupId: input.groupId }),
    };

    // Parallel queries
    const [transactions, total] = await Promise.all([
      this.coinRepo.findMany(filters, { limit, offset }),
      this.coinRepo.count(filters),
    ]);

    return ok({ transactions, pagination: { total, limit, offset, hasMore } });
  } catch (error) {
    return err(`Failed to get coin transactions: ${error.message}`);
  }
}
```

**Current Lines of Code:** 72 lines

### Effect.ts Migration Potential

**With Effect.ts:**

```typescript
execute = (
  input: GetCoinTransactionsInput,
): Effect<CoinRepositoryDeps, CoinQueryError, GetCoinTransactionsOutput> => {
  const limit = input.pagination?.limit ?? 50;
  const offset = input.pagination?.offset ?? 0;
  const filters = { tripId: input.tripId, groupId: input.groupId };

  // Parallel effects with structured concurrency
  return Effect.all([
    CoinRepository.pipe(
      Effect.flatMap((repo) => repo.findMany(filters, { limit, offset })),
    ),
    CoinRepository.pipe(Effect.flatMap((repo) => repo.count(filters))),
  ]).pipe(
    Effect.map(([transactions, total]) => ({
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })),
    Effect.mapError((error) => new CoinQueryError({ cause: error })),
  );
};
```

**Key Benefits:**

1. **Structured concurrency:** `Effect.all` vs `Promise.all` with better cancellation
2. **Composable:** Can be combined with other effects
3. **No try/catch:** Error handling is explicit in the type
4. **Cancellation:** Fiber-based cancellation support
5. **Retry:** Built-in retry policies for transient failures

### Migration Effort Estimate

| Task                   | Hours         | Notes                     |
| ---------------------- | ------------- | ------------------------- |
| Define error type      | 0.5h          | Simple query error        |
| Migrate use case logic | 1.5h          | Simple Effect.all pattern |
| Update tests           | 1.5h          | Effect test patterns      |
| **Total**              | **3.5 hours** | Simplest candidate        |

---

## Comparison Summary

| Candidate               | Complexity  | Business Value | Migration Effort | Risk   | Recommended?                   |
| ----------------------- | ----------- | -------------- | ---------------- | ------ | ------------------------------ |
| **PurchaseReward**      | High        | Critical       | 14h              | Medium | ⭐⭐⭐⭐⭐ Yes - Best showcase |
| **SubmitVotes**         | Medium-High | High           | 9.5h             | Medium | ⭐⭐⭐⭐ Yes - Good patterns   |
| **GetCoinTransactions** | Low-Medium  | Medium         | 3.5h             | Low    | ⭐⭐⭐ Yes - Learning value    |

---

## Recommended Migration Order

### Phase 1: Proof of Concept (GetCoinTransactions)

**Duration:** 3.5 hours  
**Goal:** Demonstrate basic Effect patterns with minimal risk  
**Outcome:** Team familiarity with Effect syntax

### Phase 2: Feature Demo (SubmitVotes)

**Duration:** 9.5 hours  
**Goal:** Show error accumulation and batch processing  
**Outcome:** Validation of Effect's value for complex use cases

### Phase 3: Full Showcase (PurchaseReward)

**Duration:** 14 hours  
**Goal:** Demonstrate resource safety, transactions, and typed errors  
**Outcome:** Go/No-Go decision for broader adoption

---

## Effect.ts Integration with Awilix-Modular

### Current Container Setup

The awilix-modular container provides:

- `createContainer()` with `PROXY` injection mode
- Module-based registration via `createStaticModule()`
- Request scoping via `createScope()`

### Effect.ts Layer Integration

Effect's `Layer` can replace awilix for dependency management:

```typescript
// Current awilix-modular
const container = initializeContainer([RepositoryModule]);
const useCase = container.resolve("purchaseRewardUseCase");

// Potential Effect.ts equivalent
const program = PurchaseRewardUseCase.execute(input);
const runnable = Effect.provide(program, AppLiveLayer);
const result = await Effect.runPromise(runnable);
```

### Hybrid Approach

For gradual migration:

1. Keep awilix-modular for current DI needs
2. Create Effect `Layer` from awilix container
3. Use Effect for complex async flows only
4. Migrate incrementally over time

---

## Success Metrics for Pilot

| Metric                         | Current         | Target (After Effect)         |
| ------------------------------ | --------------- | ----------------------------- |
| Error type safety              | `string` errors | Typed error unions            |
| Lines of code (PurchaseReward) | 170 lines       | <100 lines                    |
| Test complexity                | 584 lines       | <400 lines                    |
| Retry/circuit breaker          | Manual          | Built-in                      |
| Observability                  | Console logs    | Structured traces             |
| Compensation logic             | Try/catch       | Automatic (acquireUseRelease) |

---

## Files Referenced

- `packages/use-cases/src/interactors/PurchaseReward.ts`
- `packages/use-cases/src/interactors/SubmitVotes.ts`
- `packages/use-cases/src/interactors/GetCoinTransactions.ts`
- `packages/use-cases/src/interactors/PurchaseReward.test.ts`
- `packages/frameworks/src/di/container.ts`
- `packages/frameworks/src/di/types.ts`

---

_Generated for Step 13 of awilix-modular implementation task_
