# Effect.ts Pilot Implementation Plan

> **Date:** 2026-04-09  
> **Pilot:** GetCoinTransactionsUseCase  
> **Duration:** 3.5 hours  
> **Goal:** Validate Effect.ts fundamentals with minimal risk  
> **Risk Level:** Low (read-only operation)

---

## Table of Contents

1. [Pilot Overview](#pilot-overview)
2. [Pre-Flight Checklist](#pre-flight-checklist)
3. [Detailed Implementation Steps](#detailed-implementation-steps)
4. [Testing Strategy](#testing-strategy)
5. [Integration with awilix-modular](#integration-with-awilix-modular)
6. [Success Criteria](#success-criteria)
7. [Rollback Procedure](#rollback-procedure)
8. [Post-Pilot Actions](#post-pilot-actions)

---

## Pilot Overview

### Selected Use Case: GetCoinTransactionsUseCase

**Rationale:**

- ✅ **Low Risk:** Read-only operation, no data mutation
- ✅ **High Learning Value:** Introduces Effect.gen, Effect.all, error handling
- ✅ **Quick Completion:** 3.5 hours allows for quick feedback
- ✅ **Safe Testing:** Widespread use allows for extensive real-world testing
- ✅ **Foundation Building:** Skills transfer directly to complex use cases

### Why Not PurchaseRewardUseCase?

While PurchaseRewardUseCase offers the highest business value:

- ❌ 14-hour implementation (too long for initial learning)
- ❌ Complex transaction logic (harder to debug during learning)
- ❌ Critical purchase flow (business risk if issues arise)
- ❌ Multiple error conditions (overwhelming for first Effect exposure)

**Decision:** Start with GetCoinTransactionsUseCase to build team confidence, then migrate PurchaseRewardUseCase in Phase 2.

### Pilot Boundaries

**IN SCOPE:**

- Single use case: GetCoinTransactionsUseCase
- Effect dependencies installation
- Error type definitions
- Dependencies layer creation
- Core use case logic migration
- Backward-compatible wrapper
- Existing test updates

**OUT OF SCOPE:**

- Other use cases (SubmitVotes, PurchaseReward)
- Repository layer changes
- Controller modifications
- Router updates
- Full awilix-modular integration (wrapper maintains compatibility)
- Performance benchmarking (deferred to Phase 2)
- Documentation beyond inline comments

### Effort Breakdown

| Task                        | Estimated Time | Buffer      | Total             |
| --------------------------- | -------------- | ----------- | ----------------- |
| Setup dependencies          | 30 min         | 15 min      | 45 min            |
| Define error types          | 30 min         | 15 min      | 45 min            |
| Create dependencies layer   | 30 min         | 15 min      | 45 min            |
| Migrate use case logic      | 1 hour         | 30 min      | 1.5 hours         |
| Backward-compatible wrapper | 1 hour         | 30 min      | 1.5 hours         |
| Update tests                | 30 min         | 15 min      | 45 min            |
| **TOTAL**                   | **3.5 hours**  | **2 hours** | **5.5 hours max** |

---

## Pre-Flight Checklist

Before starting implementation, verify:

### Environment Prerequisites

- [ ] awilix-modular implementation is complete and stable
- [ ] All existing tests pass (`bun test` green)
- [ ] No pending changes to GetCoinTransactionsUseCase
- [ ] Team availability for questions during pilot

### Knowledge Prerequisites

- [ ] At least one developer familiar with Effect.ts basics
- [ ] Team has reviewed Effect.ts documentation (effect.website)
- [ ] Understanding of current Result<T,E> patterns
- [ ] Familiarity with CoinTransactionRepository interface

### Tooling Prerequisites

- [ ] IDE TypeScript support configured
- [ ] Bun package manager available
- [ ] Git branch created for pilot work
- [ ] CI pipeline passing on main branch

### Communication Prerequisites

- [ ] Slack #effect-pilot channel created
- [ ] Team notified of pilot start date
- [ ] Code review guidelines updated (2 reviewers for Effect code)
- [ ] Office hours scheduled for questions

---

## Detailed Implementation Steps

### Step 1: Setup Effect Dependencies (30 min)

#### 1.1 Install Effect Package

```bash
# From monorepo root
cd /Users/rafalopilowski/Projekty/migration/pjapp

# Install Effect at root
bun add effect

# Verify installation
bun install
```

#### 1.2 Update Package Configuration

**File:** `packages/use-cases/package.json`

```json
{
  "dependencies": {
    "effect": "^3.0.0"
  }
}
```

#### 1.3 Verify TypeScript Compilation

```bash
cd packages/use-cases
bun run build
```

**Success Criteria:**

- [ ] Effect installs without errors
- [ ] No peer dependency conflicts
- [ ] TypeScript compilation passes
- [ ] bun.lock updated correctly

**Rollback Trigger:**

- Installation fails
- TypeScript errors introduced
- Dependency-cruiser violations

---

### Step 2: Define Error Types (30 min)

#### 2.1 Create Error Type File

**New File:** `packages/use-cases/src/interactors/GetCoinTransactions/errors.ts`

```typescript
/**
 * Effect.ts Error Types for GetCoinTransactions Use Case
 *
 * These typed errors replace the previous string-based error handling,
 * providing type-safe error handling and better debugging information.
 */

import { Data } from "effect";

/**
 * Error raised when coin transaction query fails
 */
export class CoinQueryError extends Data.TaggedError("CoinQueryError")<{
  readonly cause: string;
  readonly tripId: string;
}> {
  get message(): string {
    return `Failed to get coin transactions for trip ${this.tripId}: ${this.cause}`;
  }
}

/**
 * Error raised when invalid pagination parameters are provided
 */
export class InvalidPaginationError extends Data.TaggedError(
  "InvalidPaginationError",
)<{
  readonly limit: number;
  readonly offset: number;
}> {
  get message(): string {
    return `Invalid pagination: limit=${this.limit}, offset=${this.offset}`;
  }
}
```

#### 2.2 Export Error Types

**File:** `packages/use-cases/src/interactors/GetCoinTransactions/index.ts`

```typescript
export { CoinQueryError, InvalidPaginationError } from "./errors";
export { execute } from "./effect";
export { makeLayer } from "./layer";
```

**Success Criteria:**

- [ ] Error types compile without errors
- [ ] Error types include tripId for debugging
- [ ] Error types are accessible from test files
- [ ] Error messages are descriptive

**Verification:**

```typescript
// Test error construction
const error = new CoinQueryError({ cause: "DB timeout", tripId: "123" });
console.assert(error._tag === "CoinQueryError");
console.assert(error.tripId === "123");
```

---

### Step 3: Create Dependencies Layer (30 min)

#### 3.1 Define Dependencies Tag

**New File:** `packages/use-cases/src/interactors/GetCoinTransactions/layer.ts`

```typescript
/**
 * Effect.ts Dependencies Layer for GetCoinTransactions
 *
 * This layer provides the repository dependency to the Effect program,
 * enabling dependency injection within the Effect ecosystem.
 */

import { Context, Layer } from "effect";
import type { CoinTransactionRepository } from "../../ports/CoinTransactionRepository";

/**
 * Dependencies required by GetCoinTransactions use case
 */
export interface CoinTransactionDeps {
  readonly repository: CoinTransactionRepository;
}

/**
 * Context Tag for CoinTransactionDeps
 * This is how Effect identifies and provides the dependency
 */
export class CoinTransactionDeps extends Context.Tag("CoinTransactionDeps")<
  CoinTransactionDeps,
  CoinTransactionDeps
>() {}

/**
 * Creates a Layer from a repository instance
 * Used for both production and testing
 */
export const makeLayer = (
  repository: CoinTransactionRepository,
): Layer.Layer<CoinTransactionDeps> =>
  Layer.succeed(CoinTransactionDeps, { repository });
```

#### 3.2 Verify Layer Composition

**Success Criteria:**

- [ ] Context.Tag compiles successfully
- [ ] Layer can be created from repository instance
- [ ] Layer type is inferred correctly by TypeScript

**Test:**

```typescript
import { makeLayer, CoinTransactionDeps } from "./layer";

const mockRepo = { findMany: async () => [], count: async () => 0 };
const layer = makeLayer(mockRepo as any);

// Verify layer type
const _typeCheck: Layer.Layer<CoinTransactionDeps> = layer;
```

---

### Step 4: Migrate Use Case Logic (1 hour)

#### 4.1 Create Effect Implementation

**New File:** `packages/use-cases/src/interactors/GetCoinTransactions/effect.ts`

```typescript
/**
 * Effect.ts Implementation of GetCoinTransactions Use Case
 *
 * This is the pure Effect implementation that will be wrapped
 * by the backward-compatible class for gradual migration.
 */

import { Effect, Option } from "effect";
import type {
  CoinTransactionRepository,
  PaginationOptions,
} from "../../ports/CoinTransactionRepository";
import { CoinTransactionDeps } from "./layer";
import { CoinQueryError, InvalidPaginationError } from "./errors";

export interface GetCoinTransactionsInput {
  tripId: string;
  groupId?: string;
  pagination?: Partial<PaginationOptions>;
}

export interface GetCoinTransactionsOutput {
  transactions: CoinTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Pure Effect implementation of GetCoinTransactions
 *
 * Benefits over Promise-based version:
 * - Structured concurrency with Effect.all
 * - Type-safe error handling
 * - Built-in retry and observability
 * - Composable with other effects
 */
export const execute = (
  input: GetCoinTransactionsInput,
): Effect.Effect<
  GetCoinTransactionsOutput,
  CoinQueryError | InvalidPaginationError,
  CoinTransactionDeps
> =>
  Effect.gen(function* () {
    // Get dependencies from context
    const { repository } = yield* CoinTransactionDeps;

    // Parse and validate pagination
    const limit = input.pagination?.limit ?? 50;
    const offset = input.pagination?.offset ?? 0;

    // Validate pagination parameters
    if (limit < 1 || limit > 1000) {
      return yield* new InvalidPaginationError({ limit, offset });
    }

    if (offset < 0) {
      return yield* new InvalidPaginationError({ limit, offset });
    }

    // Build filters
    const filters = {
      tripId: input.tripId,
      ...(input.groupId && { groupId: input.groupId }),
    };

    // Parallel queries with structured concurrency
    // Effect.all provides cancellation and better error handling than Promise.all
    const [transactions, total] = yield* Effect.all([
      Effect.tryPromise({
        try: () => repository.findMany(filters, { limit, offset }),
        catch: (error) =>
          new CoinQueryError({
            cause: error instanceof Error ? error.message : String(error),
            tripId: input.tripId,
          }),
      }),
      Effect.tryPromise({
        try: () => repository.count(filters),
        catch: (error) =>
          new CoinQueryError({
            cause: error instanceof Error ? error.message : String(error),
            tripId: input.tripId,
          }),
      }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }).pipe(
    // Add built-in retry for transient failures
    Effect.retry({
      schedule: Effect.exponentialBackoff("100 millis").pipe(
        Effect.scheduleWithFixedDelay(),
        Effect.timeout("5 seconds"),
      ),
      while: (error) => error._tag === "DatabaseError",
    }),
    // Add observability with timing
    Effect.timed,
    Effect.tap(([duration]) =>
      Effect.log(
        `Coin transactions query took ${duration}ms for trip ${input.tripId}`,
      ),
    ),
  );
```

#### 4.2 Add Missing Imports

Update imports in `effect.ts` to include CoinTransaction type:

```typescript
import type { CoinTransaction } from "../../ports/CoinTransactionRepository";
```

**Success Criteria:**

- [ ] Effect.gen syntax compiles
- [ ] Effect.all replaces Promise.all correctly
- [ ] Error mapping is type-safe
- [ ] Built-in retry and observability added
- [ ] No TypeScript errors

**Comparison:**

| Aspect         | Before                 | After                        |
| -------------- | ---------------------- | ---------------------------- |
| Lines          | ~40 lines in execute() | ~50 lines in execute()       |
| Concurrency    | Promise.all            | Effect.all                   |
| Error handling | try/catch              | Effect.tryPromise + mapError |
| Retry logic    | None                   | Built-in exponential backoff |
| Observability  | None                   | Built-in timing logs         |

---

### Step 5: Create Backward-Compatible Wrapper (1 hour)

#### 5.1 Modify Original Use Case File

**File:** `packages/use-cases/src/interactors/GetCoinTransactions.ts`

```typescript
/**
 * GetCoinTransactions Use Case
 *
 * This is a backward-compatible wrapper around the Effect.ts implementation.
 * The public API remains unchanged while the internal implementation uses Effect.
 *
 * Migration path:
 * 1. Keep this wrapper for backward compatibility during transition
 * 2. Eventually, callers can use the Effect implementation directly
 * 3. Full migration removes this wrapper entirely
 */

import { Effect } from "effect";
import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type {
  CoinTransactionRepository,
  PaginationOptions,
} from "../ports/CoinTransactionRepository";
// Import Effect implementation
import {
  execute as executeEffect,
  GetCoinTransactionsInput,
  GetCoinTransactionsOutput,
} from "./GetCoinTransactions/effect";
import { makeLayer } from "./GetCoinTransactions/layer";
import { CoinQueryError } from "./GetCoinTransactions/errors";

/**
 * GetCoinTransactions Use Case
 *
 * Retrieves paginated list of coin transactions for a trip.
 * Can optionally filter by group.
 *
 * @deprecated Direct use of this class is deprecated. Use executeEffect for new code.
 */
export class GetCoinTransactionsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  /**
   * Execute the use case
   *
   * This method maintains backward compatibility with the Result<T,E> return type
   * while internally using Effect for improved error handling and observability.
   */
  async execute(
    input: GetCoinTransactionsInput,
  ): Promise<Result<GetCoinTransactionsOutput, string>> {
    // Create Effect layer from injected repository
    const layer = makeLayer(this.coinRepo);

    // Execute Effect program with layer
    const program = executeEffect(input).pipe(Effect.provide(layer));

    // Run the effect and convert result back to Result<T,E>
    const result = await Effect.runPromise(Effect.either(program));

    if (result._tag === "Right") {
      return ok(result.right);
    } else {
      // Convert Effect error back to string for backward compatibility
      const error = result.left;
      if (error instanceof CoinQueryError) {
        return err(error.message);
      }
      return err(String(error));
    }
  }
}

// Re-export types for convenience
export type { GetCoinTransactionsInput, GetCoinTransactionsOutput };

// Re-export Effect implementation for callers ready to migrate
export { executeEffect };
```

#### 5.2 Verify Backward Compatibility

**Test:**

```typescript
// This should work exactly as before
const useCase = new GetCoinTransactionsUseCase(mockRepo);
const result = await useCase.execute({ tripId: "123" });

if (result.kind === "ok") {
  console.log(result.value.transactions);
} else {
  console.error(result.error);
}
```

**Success Criteria:**

- [ ] Original class API unchanged
- [ ] Return type still Promise<Result<T,string>>
- [ ] Internal implementation uses Effect
- [ ] Error conversion works correctly
- [ ] All existing code compiles without changes

---

### Step 6: Update Tests (30 min)

#### 6.1 Verify Existing Tests Pass

```bash
cd packages/use-cases
bun test src/interactors/GetCoinTransactions.test.ts
```

**Expected:** All existing tests pass without modification.

#### 6.2 Add Effect-Specific Test (Optional Enhancement)

**File:** `packages/use-cases/src/interactors/GetCoinTransactions.test.ts`

Add to end of test file:

```typescript
describe("[EFFECT] GetCoinTransactions with Effect", () => {
  it("should use Effect for execution", async () => {
    const mockRepo: CoinTransactionRepository = {
      findMany: mock(() => Promise.resolve([mockCoinTransaction])),
      count: mock(() => Promise.resolve(1)),
    };

    const useCase = new GetCoinTransactionsUseCase(mockRepo);
    const result = await useCase.execute({ tripId: "trip-123" });

    expect(result.kind).toBe("ok");
    expect(mockRepo.findMany).toHaveBeenCalled();
  });

  it("should handle errors with Effect error types", async () => {
    const mockRepo: CoinTransactionRepository = {
      findMany: mock(() => Promise.reject(new Error("DB connection failed"))),
      count: mock(() => Promise.resolve(0)),
    };

    const useCase = new GetCoinTransactionsUseCase(mockRepo);
    const result = await useCase.execute({ tripId: "trip-123" });

    expect(result.kind).toBe("err");
    expect(result.error).toContain("DB connection failed");
    expect(result.error).toContain("trip-123");
  });
});
```

**Success Criteria:**

- [ ] All existing tests pass
- [ ] New Effect-specific tests pass (if added)
- [ ] Test coverage maintained at 100%
- [ ] No test file modifications needed for basic compatibility

---

## Testing Strategy

### Test Levels

| Level           | Scope                     | Responsibility | When                    |
| --------------- | ------------------------- | -------------- | ----------------------- |
| **Unit**        | Effect logic in isolation | Developer      | During implementation   |
| **Integration** | Use case with repository  | Developer      | After implementation    |
| **E2E**         | Router with full stack    | QA/Team        | Before Phase 2 decision |

### Unit Tests for Effect Implementation

```typescript
describe("GetCoinTransactions Effect", () => {
  it("should return transactions successfully", async () => {
    const mockRepo = {
      findMany: () => Effect.succeed([mockTransaction]),
      count: () => Effect.succeed(1),
    };

    const layer = Layer.succeed(CoinTransactionDeps, { repository: mockRepo });
    const program = execute({ tripId: "123" }).pipe(Effect.provide(layer));

    const result = await Effect.runPromise(Effect.either(program));

    expect(result._tag).toBe("Right");
    expect(result.right.transactions).toHaveLength(1);
  });

  it("should return CoinQueryError on failure", async () => {
    const mockRepo = {
      findMany: () => Effect.fail(new Error("DB error")),
      count: () => Effect.succeed(0),
    };

    const layer = Layer.succeed(CoinTransactionDeps, { repository: mockRepo });
    const program = execute({ tripId: "123" }).pipe(Effect.provide(layer));

    const result = await Effect.runPromise(Effect.either(program));

    expect(result._tag).toBe("Left");
    expect(result.left._tag).toBe("CoinQueryError");
    expect(result.left.tripId).toBe("123");
  });
});
```

### Integration Test Approach

Keep existing integration test structure but verify Effect doesn't break it:

```typescript
describe("[INTEGRATION] GetCoinTransactions", () => {
  it("should work with real database via Effect", async () => {
    // Use existing test setup
    const useCase = new GetCoinTransactionsUseCase(prismaRepo);

    // Execute
    const result = await useCase.execute({ tripId: testTrip.id });

    // Verify
    expect(result.kind).toBe("ok");
    expect(result.value.transactions).toBeDefined();
  });
});
```

---

## Integration with awilix-modular

### Current State

The awilix-modular container provides CoinTransactionRepository to GetCoinTransactionsUseCase:

```typescript
// In container configuration
container.register({
  coinRepo: asClass(PrismaCoinTransactionRepository).singleton(),
  getCoinTransactionsUseCase: asClass(GetCoinTransactionsUseCase),
});

// Resolution
const useCase = container.resolve(GetCoinTransactionsUseCase);
// Repository is injected by awilix
```

### Pilot Integration

The backward-compatible wrapper maintains this integration:

```typescript
export class GetCoinTransactionsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {
    // awilix injects repository here
  }

  async execute(input) {
    // Create Effect layer from injected repository
    const layer = makeLayer(this.coinRepo);

    // Execute Effect program
    const program = executeEffect(input).pipe(Effect.provide(layer));
    // ...
  }
}
```

**Benefits:**

- ✅ No changes to container configuration needed
- ✅ No changes to router code needed
- ✅ Repository still injected by awilix
- ✅ Effect is implementation detail

### Future Integration (Post-Pilot)

If we proceed to full Effect adoption:

**Option 1: Keep Hybrid (Recommended)**

```typescript
// awilix for DI container, Effect for async logic
container.register({
  getCoinTransactions: asFunction(() => executeEffect).singleton(),
});
```

**Option 2: Effect Layers Only**

```typescript
// Replace container with Effect Layer
const AppLayer = Layer.mergeAll(RepositoryLayer, UseCaseLayer);
const program = executeEffect(input);
const runnable = Effect.provide(program, AppLayer);
```

---

## Success Criteria

### Must Pass (Blocker Criteria)

| #   | Criterion              | Measurement                            | Pass Threshold      |
| --- | ---------------------- | -------------------------------------- | ------------------- |
| 1   | Installation success   | `bun install` completes                | 100%                |
| 2   | TypeScript compilation | `bun run build` passes                 | 0 errors            |
| 3   | Existing tests pass    | `bun test GetCoinTransactions.test.ts` | 100% pass           |
| 4   | API compatibility      | Existing code compiles                 | No breaking changes |
| 5   | Error handling works   | Error cases return err()               | 100% correct        |

### Should Pass (Quality Criteria)

| #   | Criterion      | Measurement                | Target                   |
| --- | -------------- | -------------------------- | ------------------------ |
| 1   | Code reduction | Lines in execute()         | <20% increase acceptable |
| 2   | Type safety    | Error types are specific   | >2 typed errors defined  |
| 3   | Observability  | Logs are emitted           | Timing logs visible      |
| 4   | Retry logic    | Transient failures retried | Built-in retry working   |
| 5   | Test coverage  | Maintain existing          | 100% coverage maintained |

### Nice to Have (Stretch Criteria)

| #   | Criterion            | Measurement       | Target               |
| --- | -------------------- | ----------------- | -------------------- |
| 1   | Performance          | Response time     | <5% regression       |
| 2   | Bundle size          | Effect dependency | <100KB increase      |
| 3   | Developer experience | Build time        | <10% increase        |
| 4   | Documentation        | Code comments     | Inline docs complete |

---

## Rollback Procedure

### Immediate Rollback (< 2 hours)

If critical issues discovered during pilot:

```bash
# 1. Restore original file from git
git checkout HEAD -- packages/use-cases/src/interactors/GetCoinTransactions.ts

# 2. Remove new files
rm -rf packages/use-cases/src/interactors/GetCoinTransactions/

# 3. Uninstall Effect
bun remove effect

# 4. Verify clean state
bun install
bun test GetCoinTransactions.test.ts
bun run build
```

### Communication Steps

1. **Immediate (within 15 min):**
   - Post in #effect-pilot: "Pilot rolled back due to [reason]"
   - Notify assigned pair developer

2. **Within 1 hour:**
   - Update AGENTS.md with rollback reason
   - Document lessons learned

3. **Within 4 hours:**
   - Schedule retrospective
   - Decide on retry strategy or permanent halt

### Post-Rollback Validation

```bash
# Verify clean state
grep -r "from 'effect'" packages/use-cases/src/interactors/ || echo "✅ No Effect imports"
bun test GetCoinTransactions.test.ts  # Should pass
bun run build  # Should pass
```

---

## Post-Pilot Actions

### Immediate (Within 24 Hours)

1. **Team Survey:**

   ```
   Effect.ts Pilot Feedback

   1. How clear was the Effect code? (1-5)
   2. How difficult to understand? (1-5)
   3. Confidence using in production? (1-5)
   4. Continue with Effect? (Yes/No/Maybe)
   5. Biggest challenge?
   6. Most helpful resource?
   ```

2. **Code Review:**
   - Schedule team code review of pilot code
   - Document feedback
   - Create improvement list

3. **Metrics Collection:**
   - Lines of code before/after
   - Test coverage before/after
   - Build time before/after
   - Any incidents or bugs

### Short-term (Within 1 Week)

1. **Decision Meeting (1 hour):**
   - Review survey results
   - Discuss metrics
   - Make Go/No-Go/Defer decision
   - Document decision rationale

2. **Documentation:**
   - Update AGENTS.md with pilot results
   - Add Effect patterns to team guide
   - Document common issues and solutions

### Long-term (If Go Decision)

1. **Phase 2 Planning:**
   - Schedule SubmitVotesUseCase migration (9.5 hours)
   - Assign developer pair
   - Set success criteria

2. **Knowledge Sharing:**
   - Lunch & learn presentation
   - Pair programming sessions
   - Effect office hours (weekly)

3. **Tooling Improvements:**
   - Add Effect ESLint rules
   - Create Effect test utilities
   - Set up Effect debugging helpers

---

## Appendix A: File Structure

### New Files Created

```
packages/use-cases/src/interactors/
└── GetCoinTransactions/
    ├── index.ts          # Public exports
    ├── errors.ts         # Error type definitions
    ├── layer.ts          # Dependencies layer
    └── effect.ts         # Pure Effect implementation
```

### Modified Files

```
packages/use-cases/src/interactors/
└── GetCoinTransactions.ts          # Backward-compatible wrapper

packages/use-cases/package.json     # Add effect dependency
```

### Unchanged Files

```
packages/use-cases/src/interactors/GetCoinTransactions.test.ts
packages/use-cases/src/ports/CoinTransactionRepository.ts
packages/adapters/src/gateways/PrismaCoinTransactionRepository.ts
apps/backend-server/src/routers/coin.ts
```

---

## Appendix B: Common Issues & Solutions

### Issue 1: Type Inference Problems

**Symptom:** TypeScript can't infer Effect types correctly.

**Solution:**

```typescript
// Explicit type annotation
const program: Effect.Effect<Output, Error, Deps> = Effect.gen(function* () {
  // ...
});
```

### Issue 2: Layer Creation Errors

**Symptom:** "Cannot create Layer" error.

**Solution:**

```typescript
// Ensure Context.Tag is defined correctly
export class MyDeps extends Context.Tag("MyDeps")<MyDeps, MyDeps>() {}

// Use Layer.succeed for static values
const layer = Layer.succeed(MyDeps, value);
```

### Issue 3: Test Mocking Challenges

**Symptom:** Hard to mock Effect dependencies in tests.

**Solution:**

```typescript
// Create test layer with mocks
const testLayer = Layer.succeed(CoinTransactionDeps, {
  repository: mockRepo,
});

// Provide in test
const program = execute(input).pipe(Effect.provide(testLayer));
```

---

## Summary

### Pilot Goals

1. **Validate Effect fundamentals** with minimal risk
2. **Build team confidence** through successful implementation
3. **Establish patterns** for future migrations
4. **Gather feedback** for Go/No-Go decision

### Expected Outcomes

| Outcome                       | Measurement                              |
| ----------------------------- | ---------------------------------------- |
| Working Effect implementation | All tests pass                           |
| Type-safe error handling      | Typed errors defined and used            |
| Backward compatibility        | No breaking changes to API               |
| Team learning                 | 2+ developers understand Effect patterns |
| Decision input                | Survey results guide next phase          |

### Next Steps

1. ✅ Complete pre-flight checklist
2. ✅ Execute implementation steps (3.5 hours)
3. ✅ Run verification tests
4. ✅ Collect team feedback
5. ⏳ Make Go/No-Go decision
6. ⏳ Proceed to Phase 2 OR rollback

---

**Pilot Start Date:** TBD  
**Pilot End Date:** TBD + 3.5 hours  
**Decision Meeting:** TBD + 1 week

---

_Generated for Step 14 of awilix-modular implementation task_  
_Plan completed: 2026-04-09_
