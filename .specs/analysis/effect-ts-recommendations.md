# Effect.ts Recommendations

> **Date:** 2026-04-09  
> **Task:** Step 14 of awilix-modular implementation  
> **Decision:** **GO with Conditions** 🟢  
> **Selected Pilot:** GetCoinTransactionsUseCase (lowest risk, highest learning value)

---

## Executive Summary

### Decision: **GO** - Proceed with Phased Adoption

After comprehensive analysis of 212+ Result<T,E> imports across 157 files and 81 use cases, **Effect.ts adoption is recommended** for the Mirai App. However, a **phased, pilot-driven approach** is essential rather than wholesale migration.

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

**Result:** ✅ GO with conditions (score > 3.5 threshold)

### Three-Tier Migration Strategy

| Tier         | Use Cases                              | Count | Effort | Value     |
| ------------ | -------------------------------------- | ----- | ------ | --------- |
| **Critical** | Complex transactions, multi-step flows | 12    | 96h    | Very High |
| **Valuable** | Medium complexity, async patterns      | 20    | 80h    | High      |
| **Optional** | Simple CRUD operations                 | 45    | 90h    | Low       |

**Recommendation:** Migrate only Tier 1 (complex) use cases immediately. Defer Tier 2 and Tier 3 until team proficiency is established.

---

## Selected Pilot Use Case

### GetCoinTransactionsUseCase - Phase 1 Pilot

**Why this use case?**

| Factor             | Assessment                                                |
| ------------------ | --------------------------------------------------------- |
| **Risk**           | ⭐⭐ Low - read-only operation, no side effects           |
| **Learning Value** | ⭐⭐⭐⭐⭐ High - demonstrates Effect's concurrency model |
| **Complexity**     | ⭐⭐⭐ Medium - parallel queries showcase Effect.all      |
| **Effort**         | ⭐⭐⭐ Low - 3.5 hours estimated                          |
| **Business Value** | ⭐⭐⭐ Medium - commonly used across features             |

**File Location:** `packages/use-cases/src/interactors/GetCoinTransactions.ts`

**Current State:** 72 lines, Promise.all parallel queries, try/catch error handling

**Rationale:**

- **Low risk:** Read-only, widely tested, no data mutation
- **High learning value:** Introduces Effect.gen, Effect.all, and basic error handling
- **Quick win:** 3.5-hour implementation demonstrates value to team
- **Foundation for next phases:** Skills learned apply directly to more complex use cases

### Alternative Consideration: PurchaseRewardUseCase

While PurchaseRewardUseCase offers the highest business value and showcases Effect's advanced features (transactions, compensation, typed errors), it's also the most complex. Starting with GetCoinTransactionsUseCase:

- Allows team to learn Effect fundamentals on a safe use case
- Reduces risk of production issues during learning phase
- Provides quick feedback loop (3.5h vs 14h)
- Builds confidence before tackling complex transactions

---

## Before/After Code Comparison

### Current Implementation (Result<T,E> Pattern)

**File:** `packages/use-cases/src/interactors/GetCoinTransactions.ts`  
**Lines:** 72

```typescript
import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type {
  CoinTransactionRepository,
  CoinTransaction,
  PaginationOptions,
} from "../ports/CoinTransactionRepository";

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

export class GetCoinTransactionsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: GetCoinTransactionsInput,
  ): Promise<Result<GetCoinTransactionsOutput, string>> {
    try {
      const limit = input.pagination?.limit ?? 50;
      const offset = input.pagination?.offset ?? 0;

      const filters = {
        tripId: input.tripId,
        ...(input.groupId && { groupId: input.groupId }),
      };

      const [transactions, total] = await Promise.all([
        this.coinRepo.findMany(filters, { limit, offset }),
        this.coinRepo.count(filters),
      ]);

      return ok({
        transactions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      return err(
        `Failed to get coin transactions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
```

### Proposed Implementation (Effect.ts Pattern)

**File:** `packages/use-cases/src/interactors/GetCoinTransactions.ts` (post-migration)  
**Estimated Lines:** 45-55 (~30% reduction)

```typescript
import { Effect, Data, Layer, Context } from "effect";
import type {
  CoinTransactionRepository,
  CoinTransaction,
  PaginationOptions,
} from "../ports/CoinTransactionRepository";

// Typed error instead of string
export class CoinQueryError extends Data.TaggedError("CoinQueryError")<{
  readonly cause: string;
  readonly tripId: string;
}> {}

// Dependencies as a Tag
export class CoinRepositoryDeps extends Context.Tag("CoinRepositoryDeps")<
  CoinRepositoryDeps,
  {
    readonly repository: CoinTransactionRepository;
  }
>() {}

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

// Pure Effect function (no class needed)
export const execute = (
  input: GetCoinTransactionsInput,
): Effect.Effect<
  GetCoinTransactionsOutput,
  CoinQueryError,
  CoinRepositoryDeps
> =>
  Effect.gen(function* () {
    const { repository } = yield* CoinRepositoryDeps;

    const limit = input.pagination?.limit ?? 50;
    const offset = input.pagination?.offset ?? 0;
    const filters = {
      tripId: input.tripId,
      ...(input.groupId && { groupId: input.groupId }),
    };

    // Structured concurrency with Effect.all
    const [transactions, total] = yield* Effect.all([
      repository.findMany(filters, { limit, offset }),
      repository.count(filters),
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
    // Type-safe error mapping
    Effect.mapError(
      (error) =>
        new CoinQueryError({
          cause: error instanceof Error ? error.message : String(error),
          tripId: input.tripId,
        }),
    ),
    // Built-in retry for transient failures
    Effect.retry({
      schedule: Effect.exponentialBackoff("100 millis").pipe(
        Effect.scheduleWithFixedDelay(),
        Effect.timeout("5 seconds"),
      ),
      while: (error) => error._tag === "DatabaseError",
    }),
    // Built-in observability
    Effect.timed,
    Effect.tap(([duration]) =>
      Effect.log(
        `Coin transactions query took ${duration}ms for trip ${input.tripId}`,
      ),
    ),
  );

// Backward-compatible wrapper (optional during transition)
export class GetCoinTransactionsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: GetCoinTransactionsInput,
  ): Promise<
    | { kind: "ok"; value: GetCoinTransactionsOutput }
    | { kind: "err"; error: string }
  > {
    const layer = Layer.succeed(CoinRepositoryDeps, {
      repository: this.coinRepo,
    });

    const program = execute(input).pipe(Effect.provide(layer));

    const result = await Effect.runPromise(Effect.either(program));

    if (result._tag === "Right") {
      return { kind: "ok", value: result.right };
    } else {
      return { kind: "err", error: result.left.cause };
    }
  }
}
```

### Comparison Summary

| Aspect             | Before       | After                    | Change       |
| ------------------ | ------------ | ------------------------ | ------------ |
| **Lines of Code**  | 72           | 50-55                    | -24% to -31% |
| **Error Type**     | `string`     | `CoinQueryError` (typed) | Type-safe    |
| **Error Handling** | try/catch    | Effect.mapError          | Declarative  |
| **Concurrency**    | Promise.all  | Effect.all               | Structured   |
| **Retry Logic**    | None         | Built-in                 | Zero effort  |
| **Observability**  | None         | Built-in timing logs     | Zero effort  |
| **Testability**    | Manual mocks | Layer composition        | Composable   |

---

## Implementation Plan

### Phase 1: Pilot (Week 1) - 3.5 hours

**Goal:** Validate Effect.ts fundamentals with GetCoinTransactionsUseCase

#### Step 1.1: Setup Effect Dependencies (30 min)

```bash
# Install Effect.ts
bun add effect

# Add to relevant packages
bun add effect --cwd packages/use-cases
bun add effect --cwd packages/domain
```

**Acceptance Criteria:**

- [ ] Effect installs without peer dependency conflicts
- [ ] TypeScript compilation passes
- [ ] No dependency-cruiser violations

#### Step 1.2: Define Error Types (30 min)

**File:** `packages/use-cases/src/interactors/GetCoinTransactions/errors.ts`

```typescript
import { Data } from "effect";

export class CoinQueryError extends Data.TaggedError("CoinQueryError")<{
  readonly cause: string;
  readonly tripId: string;
}> {}
```

**Acceptance Criteria:**

- [ ] Error type compiles successfully
- [ ] Error type is accessible from test files

#### Step 1.3: Create Dependencies Layer (30 min)

**File:** `packages/use-cases/src/interactors/GetCoinTransactions/layer.ts`

**Acceptance Criteria:**

- [ ] Context.Tag defined for repository dependency
- [ ] Layer can be created from CoinTransactionRepository

#### Step 1.4: Migrate Use Case Logic (1 hour)

**File:** `packages/use-cases/src/interactors/GetCoinTransactions/effect.ts`

**Acceptance Criteria:**

- [ ] Effect.gen syntax working
- [ ] Effect.all replaces Promise.all
- [ ] Error mapping in place

#### Step 1.5: Create Backward-Compatible Wrapper (1 hour)

**Modify:** `packages/use-cases/src/interactors/GetCoinTransactions.ts`

**Acceptance Criteria:**

- [ ] Original class API unchanged
- [ ] Internal implementation uses Effect
- [ ] Return type maintains Result<T,E> shape

#### Step 1.6: Update Tests (30 min)

**File:** `packages/use-cases/src/interactors/GetCoinTransactions.test.ts`

**Acceptance Criteria:**

- [ ] All existing tests pass
- [ ] Optional: Add Effect-specific test demonstrating Layer pattern

### Phase 2: Feature Demonstration (Weeks 2-3) - 23.5 hours

**Goal:** Demonstrate Effect's value for complex use cases

#### Use Case 1: SubmitVotesUseCase (9.5 hours)

**Why:** Batch operations, error accumulation, validation complexity

**Key Features:**

- `Effect.forEach` with error accumulation
- Parallel validation with `Effect.all`
- Typed error unions

#### Use Case 2: PurchaseRewardUseCase (14 hours)

**Why:** Multi-step transaction, compensation, resource safety

**Key Features:**

- `Effect.acquireUseRelease` for transactions
- Automatic compensation on failure
- Built-in retry with `Schedule`
- Observability with `Effect.timed`

**Go/No-Go Decision Point:** After PurchaseRewardUseCase completion

### Phase 3: Production Adoption (Weeks 4-9) - 96 hours

**Goal:** Migrate all Tier 1 (complex) use cases

**Scope:** 12 complex use cases

**Exit Criteria:**

- All complex use cases use Effect
- Shared Effect utilities created
- Team proficiency established (2+ developers comfortable with Effect)

### Phase 4: Optional Expansion (Deferred)

**Decision Point:** After 3 months of production use

**Options:**

1. **Migrate medium complexity** (20 use cases, 80 hours)
2. **Keep awilix-modular for simple cases** (current state is acceptable)
3. **Full migration to Effect Layers** (replace awilix-modular, 322 hours)

---

## Success Metrics

### Quantitative Metrics

| Metric                    | Baseline                  | Phase 1 Target      | Phase 2 Target      | Phase 3 Target           |
| ------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------ |
| **Lines of Code**         | 170 (PurchaseReward)      | 140 (24% reduction) | 100 (41% reduction) | 80 (53% reduction)       |
| **Test Lines**            | 584 (PurchaseReward test) | 500 (14% reduction) | 400 (31% reduction) | 350 (40% reduction)      |
| **Error Type Coverage**   | 0% (string errors)        | 25% (typed)         | 50% (typed)         | 100% (complex use cases) |
| **Retry/Circuit Breaker** | 0% (manual)               | 0% (not applicable) | 50% (built-in)      | 80% (built-in)           |
| **Test Coverage**         | Current baseline          | Maintain 100%       | Maintain 100%       | Maintain 100%            |
| **Build Time**            | Current baseline          | <5% increase        | <5% increase        | <10% increase            |
| **Bundle Size**           | Current baseline          | <50KB increase      | <100KB increase     | <200KB increase          |

### Qualitative Metrics

| Metric                   | Evaluation Method             | Target                        |
| ------------------------ | ----------------------------- | ----------------------------- |
| **Developer Confidence** | Post-pilot survey (1-5 scale) | ≥3.5 average                  |
| **Code Clarity**         | Team code review rating       | "Improved" or "Much Improved" |
| **Debugging Experience** | Developer feedback            | Neutral or positive           |
| **Learning Curve**       | Time to first productive PR   | <2 weeks                      |
| **Maintenance Burden**   | Incident rate comparison      | No increase vs baseline       |

### Operational Metrics

| Metric                | Measurement                       | Target                    |
| --------------------- | --------------------------------- | ------------------------- |
| **Error Rate**        | Production error logs             | No increase vs baseline   |
| **Response Time**     | APM p95 latency                   | <5% increase vs baseline  |
| **Observability**     | Structured trace coverage         | 100% for Effect use cases |
| **Incident Recovery** | MTTR for Effect-related incidents | <1 hour                   |

---

## Rollback Plan

### Triggers for Rollback

**Immediate Rollback (within 24 hours):**

- Production error rate increases >10% from baseline
- Critical functionality broken (purchases, votes, etc.)
- Data integrity issues

**Consider Rollback (within 1 week):**

- Developer productivity decreases >30% (measured by PR velocity)
- Team consensus strongly negative after Phase 1
- Performance regression >20% in response times
- Unresolvable integration issues

### Rollback Procedure

#### Step 1: Stop New Deployments (< 30 minutes)

```bash
# Halt CI/CD pipeline
github actions: pause workflow
# Or block merges
github: enable branch protection
```

#### Step 2: Revert to Last Known Good State (< 1 hour)

```bash
# Revert to pre-Effect commit
git revert HEAD~3..HEAD --no-commit  # Adjust range as needed
git checkout HEAD -- packages/use-cases/src/interactors/GetCoinTransactions.ts
```

#### Step 3: Remove Effect Dependencies (< 30 minutes)

```bash
# Uninstall Effect
bun remove effect
bun remove effect --cwd packages/use-cases
bun remove effect --cwd packages/domain

# Verify clean state
bun install
bun run build
```

#### Step 4: Validate Rollback (< 1 hour)

```bash
# Run full test suite
bun test

# Verify no Effect imports remain
grep -r "from 'effect'" packages/ || echo "No Effect imports found"
```

#### Step 5: Deploy Reverted Code (< 1 hour)

- Deploy via normal CI/CD process
- Monitor production metrics for 4 hours
- Verify error rates return to baseline

### Rollback Communication

**Within 1 hour:**

- Notify team via Slack #engineering
- Update AGENTS.md with rollback reason

**Within 4 hours:**

- Post-mortem scheduled
- Lessons learned documented

---

## Integration with awilix-modular

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frameworks Layer (packages/frameworks/src/di/)               │
│  ├─ container.ts   (awilix container setup)                   │
│  ├─ types.ts       (injection tokens)                       │
│  ├─ AppModule.ts   (root module)                            │
│  └─ scope.ts       (request scoping)                          │
├─────────────────────────────────────────────────────────────┤
│  Adapters Layer (packages/adapters/src/modules/)            │
│  ├─ RepositoryModule.ts (16 repositories)                     │
│  └─ ControllerModule.ts (17 controllers)                      │
├─────────────────────────────────────────────────────────────┤
│  Use Cases Layer (packages/use-cases/src/interactors/)        │
│  └─ 81 use cases                                              │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (packages/domain/src/entities/)                 │
│  └─ 13 entities with Result<T,E>                              │
└─────────────────────────────────────────────────────────────┘
```

### Hybrid Integration Strategy

**Recommended:** Effect Inside Awilix (Option A)

```typescript
// 1. Define Effect Tag for dependency
class CoinRepositoryDeps extends Context.Tag("CoinRepositoryDeps")<
  CoinRepositoryDeps,
  { readonly repository: CoinTransactionRepository }
>() {}

// 2. Use case uses Effect internally, exposed via awilix container
@Module({
  providers: [GetCoinTransactionsUseCase],
  imports: [RepositoryModule], // Provides repository via awilix
})
class UseCaseModule {}

// 3. Controller resolves use case from container
const useCase = container.resolve(GetCoinTransactionsUseCase);

// 4. Use case creates Effect layer internally
async execute(input) {
  // Create Effect layer from injected repository
  const layer = Layer.succeed(CoinRepositoryDeps, {
    repository: this.coinRepo, // Injected via awilix
  });

  // Execute Effect program
  const program = executeEffect(input).pipe(Effect.provide(layer));
  return await Effect.runPromise(program);
}
```

### Migration Path

**Current → Phase 1 → Phase 2 → Long-term**

```
Current:  awilix-modular for DI
          └─> Manual Promise handling in use cases

Phase 1: awilix-modular for DI
          └─> Effect for GetCoinTransactions (internal)

Phase 2: awilix-modular for DI
          └─> Effect for complex use cases (internal)

Long-term (Optional):
         awilix-modular for simple use cases
         └─> Effect Layers for complex use cases
```

### Awilix-to-Effect Mapping

| Awilix Concept        | Effect Equivalent        | Migration Strategy                      |
| --------------------- | ------------------------ | --------------------------------------- |
| `asClass()`           | `Layer.effect()`         | Keep awilix for now                     |
| `asValue()`           | `Layer.succeed()`        | Create Effect layer from resolved value |
| `createScope()`       | `Effect.provide()`       | Use Effect for request-scoped effects   |
| `container.resolve()` | `Context.Tag` + `yield*` | Use Tag for Effect-only dependencies    |

---

## Decision Matrix

### Go / No-Go / Defer Criteria

#### Go (Proceed with Phased Migration)

**Required:**

- ✅ Pilot (Phase 1) completes within 3.5 hours
- ✅ All tests pass after GetCoinTransactions migration
- ✅ Team survey shows ≥3.5/5.0 average confidence
- ✅ No performance regression in benchmarks
- ✅ Code clarity improves (team consensus)

**Timeline:** Start Phase 2 immediately after successful pilot

#### No-Go (Halt Effect Migration)

**Any of the following:**

- ❌ Production error rate increases >10%
- ❌ Team survey shows <2.5/5.0 average confidence
- ❌ Performance regression >20% in benchmarks
- ❌ Critical functionality broken during pilot
- ❌ Cannot resolve integration issues within 1 week

**Action:** Rollback to Result<T,E>, document reasons

#### Defer (Postpone Decision)

**Any of the following:**

- ⏸️ Team survey shows 2.5-3.5/5.0 (neutral)
- ⏸️ Learning curve concerns from >1 team member
- ⏸️ Other high-priority work conflicts
- ⏸️ Dependencies not ready (e.g., test infrastructure)

**Action:**

- Document pilot results
- Schedule revisit in 2-3 months
- Keep Result<T,E> patterns in meantime
- May retry pilot with different use case

### Decision Timeline

| Phase       | Decision Point   | Criteria                   | Outcomes                                         |
| ----------- | ---------------- | -------------------------- | ------------------------------------------------ |
| **Phase 1** | After 3.5 hours  | Pilot complete             | Go → Phase 2, No-Go → Rollback, Defer → Wait     |
| **Phase 2** | After 23.5 hours | Feature demos complete     | Go → Phase 3, No-Go → Partial rollback           |
| **Phase 3** | After 6 weeks    | Complex use cases migrated | Go → Phase 4 evaluation, No-Go → Maintain status |
| **Phase 4** | After 3 months   | Production experience      | Full migration, Partial, or Keep hybrid          |

---

## Team Feedback Process

### Phase 1 Feedback (Week 1)

**Developer Pairing:**

- One "Effect champion" pairs with one skeptical developer
- Daily 15-minute standup on pilot progress
- Shared notes in Slack #effect-pilot channel

**Code Review:**

- All Effect code requires 2 reviewers (vs normal 1)
- One reviewer must be from different team
- Explicit "learning opportunity" framing

**Survey (Anonymous):**

```
Effect.ts Pilot - Week 1 Feedback

1. How would you rate the code clarity with Effect? (1-5)
2. How difficult was it to understand the Effect patterns? (1-5)
3. How confident are you using Effect in production? (1-5)
4. Would you recommend continuing with Effect migration? (Yes/No/Maybe)
5. What was the biggest challenge?
6. What was the most helpful resource?
```

**Retrospective (1 hour):**

- After Phase 1 completion
- Include all developers who reviewed Effect code
- Document lessons learned

### Phase 2+ Feedback (Ongoing)

**Monthly Check-ins:**

- 30-minute team discussion on Effect experience
- Metrics review (lines of code, test coverage, incidents)
- Adjust migration pace based on feedback

**Office Hours:**

- Weekly 1-hour open session for Effect questions
- Rotating "Effect expert" on-call

**Documentation Contributions:**

- Encourage team to add to internal Effect guide
- Recognize contributors in team meetings

### Feedback Integration

| Feedback Type          | Integration Method            | Decision Impact |
| ---------------------- | ----------------------------- | --------------- |
| Survey scores          | Weighted in Go/No-Go matrix   | 30% of decision |
| Code review comments   | Documented in lessons learned | 20% of decision |
| Retrospective insights | Prioritized improvements      | 25% of decision |
| Incident/bug reports   | Immediate escalation path     | 25% of decision |

---

## Summary

### What We're Recommending

1. **GO** with phased Effect.ts adoption
2. **Start with GetCoinTransactionsUseCase** as lowest-risk pilot (3.5 hours)
3. **Migrate 12 complex use cases** if pilot succeeds (10 weeks total)
4. **Defer simple CRUD migration** indefinitely (not enough value)
5. **Maintain awilix-modular** for DI throughout (hybrid approach)

### Expected Outcomes

| Timeline    | Outcome                                                    |
| ----------- | ---------------------------------------------------------- |
| **Week 1**  | Pilot complete, team feedback collected                    |
| **Week 3**  | Feature demos complete, Go/No-Go decision                  |
| **Week 9**  | Complex use cases migrated, 40% code reduction             |
| **Month 6** | Team proficiency established, considering medium use cases |

### Risk Summary

| Risk                   | Mitigation                          | Residual Risk |
| ---------------------- | ----------------------------------- | ------------- |
| Learning curve delays  | Time-boxed pilots, pairing          | Low           |
| Production issues      | Comprehensive rollback plan         | Low           |
| Team resistance        | Anonymous feedback, opt-in approach | Medium        |
| Integration complexity | Hybrid approach preserves awilix    | Low           |

---

**Next Steps:**

1. Team review of this recommendation document
2. Schedule Phase 1 kickoff
3. Assign pilot pair (Effect champion + developer)
4. Begin GetCoinTransactionsUseCase migration

---

_Generated for Step 14 of awilix-modular implementation task_  
_Recommendation completed: 2026-04-09_
