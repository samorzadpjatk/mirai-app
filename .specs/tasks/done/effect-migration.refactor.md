---
title: Effect Framework Migration
last_updated: 2026-04-14
priority: high
type: refactor
scope: monorepo-wide
---

# Effect Framework Migration

> **Given** the current Promise-based architecture with custom `Result<T,E>` types  
> **When** we migrate to the Effect framework  
> **Then** we gain structured concurrency, better error handling, and observability while maintaining Clean Architecture boundaries

---

## Description

The Mirai App monorepo requires a comprehensive migration from Promise-based architecture (with custom `Result<T,E>` types) to the **Effect framework**. This is a technical refactoring initiative that maintains Clean Architecture boundaries while modernizing error handling, introducing structured concurrency, and enabling observability.

**Business Value**: This migration improves system reliability through type-safe error handling and structured concurrency, reduces bug rates via exhaustive error checking, and enhances developer productivity through better composability and testability. The Effect framework provides built-in observability (tracing, logging, metrics) that reduces time-to-resolution for production issues.

**Scope**: This is a framework-level migration affecting all architectural layers (Domain, Use Cases, Adapters, Frameworks, and Apps). The migration preserves all existing business logic, maintains GraphQL API contracts, and keeps database schemas unchanged. Success is measured by passing test suites, type-safe error handling, and equal or better performance.

**Constraints**: Migration must be completed within 8 weeks, support Bun runtime for server packages and JSC/Hermes for React Native, maintain Clean Architecture boundaries, and provide a rollback strategy for each layer.

### Scope Summary

**Included**:

- Domain layer: Convert `Result<T,E>` to `Effect.Effect<T,E,never>`
- Use Cases layer: Convert async/await to `Effect.gen`, replace awilix with Effect Context/Layers
- Adapters layer: Wrap Drizzle with `@effect/sql-drizzle`, update mappers
- GraphQL layer: Bridge Effect with `Effect.runPromise`
- Testing: Update all tests for Effect patterns with Layer-based DI
- Libraries: Remove awilix, awilix-modular; add Effect ecosystem
- Documentation: Update CLAUDE.md and AGENTS.md

**Excluded**:

- New business features or functionality
- Database schema migrations or changes
- GraphQL schema modifications
- Frontend UI/UX changes
- Infrastructure or deployment changes
- Third-party API integrations changes

### User Scenarios

1. **Primary Flow**: Developer converts each layer incrementally (Domain → Use Cases → Adapters → GraphQL) while maintaining compatibility and keeping all tests passing.

2. **Alternative Flow**: Gradual migration per package or module, allowing mixed Promise/Effect codebase temporarily during transition.

3. **Error Handling**: When errors occur, they propagate through Effect's type-safe error channels, with explicit handling at GraphQL boundaries and comprehensive logging for debugging.

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[Criterion 1]**: All domain entities use Effect types
  - **Given**: Existing domain entity with Result-based factory
  - **When**: Migration is complete
  - **Then**: Entity factory returns `Effect.Effect<T, E, never>` and errors use `Data.TaggedError`

- [ ] **[Criterion 2]**: Domain package has minimal dependencies
  - **Given**: Domain package package.json
  - **When**: Migration is complete
  - **Then**: Only `effect` is listed in dependencies (no external runtime deps)

- [ ] **[Criterion 3]**: All use cases use Effect patterns
  - **Given**: Existing use case with async/await implementation
  - **When**: Migration is complete
  - **Then**: Use case uses `Effect.gen`, repository ports use `Context.Tag`, provides `Layer.effect` implementation

- [ ] **[Criterion 4]**: awilix removed from use-cases
  - **Given**: Use-cases package imports
  - **When**: Migration is complete
  - **Then**: No `awilix` or `awilix-modular` imports exist in use-cases package

- [ ] **[Criterion 5]**: All repositories use @effect/sql-drizzle
  - **Given**: Repository implementation
  - **When**: Migration is complete
  - **Then**: Database queries use `@effect/sql-drizzle`, errors wrapped with Effect error channels

- [ ] **[Criterion 6]**: GraphQL context provides Effect Runtime
  - **Given**: GraphQL server initialization
  - **When**: Migration is complete
  - **Then**: Context factory provides pre-wired Runtime via `createEffectContextFactory`

- [ ] **[Criterion 7]**: All GraphQL resolvers bridge Effect properly
  - **Given**: GraphQL resolver function
  - **When**: Migration is complete
  - **Then**: Resolver uses `Effect.runPromise` at boundary, errors mapped to GraphQL format

- [ ] **[Criterion 8]**: AppLayer merges all service layers
  - **Given**: Application layer composition
  - **When**: Migration is complete
  - **Then**: `AppLayer` uses `Layer.mergeAll` to combine BunContext, SqlLive, repositories, and use cases

- [ ] **[Criterion 9]**: awilix completely removed
  - **Given**: Entire codebase
  - **When**: Migration is complete
  - **Then**: No `awilix` or `awilix-modular` imports exist anywhere

- [ ] **[Criterion 10]**: Full test suite passes
  - **Given**: Test suite execution
  - **When**: Migration is complete
  - **Then**: `bun test` exits with zero failures

- [ ] **[Criterion 11]**: Integration tests use Effect patterns
  - **Given**: Integration test file
  - **When**: Migration is complete
  - **Then**: Tests use `Effect.runPromise`, Layer-based wiring, and testcontainers work correctly

- [ ] **[Criterion 12]**: Documentation updated
  - **Given**: CLAUDE.md and AGENTS.md files
  - **When**: Migration is complete
  - **Then**: Files contain Effect patterns, Layer composition, and testing conventions

### Non-Functional Requirements

- [ ] **[Criterion 13]**: Performance equal or better
  - **Given**: Benchmark suite
  - **When**: Migration is complete
  - **Then**: Response times within ±10% of Promise-based baseline

- [ ] **[Criterion 14]**: Type safety for all errors
  - **Given**: Effect operations in codebase
  - **When**: Migration is complete
  - **Then**: No `unknown` error types, all errors are `Data.TaggedError` subtypes

### Definition of Done

- [ ] All acceptance criteria (1-14) pass
- [ ] All tests written and passing
- [ ] CLAUDE.md and AGENTS.md updated
- [ ] Code reviewed and approved
- [ ] Performance benchmarks documented

---

## Key Outcomes

| Aspect          | Before                            | After                                       |
| --------------- | --------------------------------- | ------------------------------------------- |
| **Error Model** | Custom `Result<T,E>` + exceptions | `Effect.Effect<T, E, R>` with tagged errors |
| **DI System**   | awilix + awilix-modular           | Effect Context + Layers                     |
| **DB Access**   | async/await with Drizzle          | `@effect/sql-drizzle` with Effect           |
| **GraphQL**     | async/await resolvers             | `Effect.runPromise` at boundaries           |
| **Test Setup**  | Container mocking                 | Layer-based test wiring                     |

### Timeline

**8 weeks (1-2 months solo)** with comprehensive test coverage:

- **Week 1-2:** Foundation & Domain Layer
- **Week 3-4:** Use Cases Layer
- **Week 5-6:** Adapters & GraphQL Layer
- **Week 7-8:** Integration, Testing & Performance

---

## Library Changes

### Libraries to Remove

| Library            | Package(s)               | Replacement           | Reason                                            |
| ------------------ | ------------------------ | --------------------- | ------------------------------------------------- |
| **awilix**         | backend-server, adapters | Effect Context/Layers | Effect's native DI is more powerful and type-safe |
| **awilix-modular** | backend-server, adapters | Effect Layers         | No need for external DI framework                 |
| **zod** (partial)  | adapters, frameworks     | Effect Schema         | Validation + effect composition                   |

### Effect Ecosystem by Package

**Core (all packages):**

- `effect: ^3.15.0`

**Bun-based apps/packages:**

- `@effect/platform: ^0.75.0`
- `@effect/platform-bun: ^0.75.0`
- `@effect/sql: ^0.30.0`
- `@effect/sql-drizzle: ^0.30.0`

**React Native / Expo:**

- `effect: ^3.15.0` only (NO platform packages - uses JSC/Hermes runtime)

---

## Migration Sequence

**Layer-by-layer migration** maintains Clean Architecture while converting:

1. **Domain Layer** → Convert `Result` to `Effect`
2. **Use Cases Layer** → Convert async/await to `Effect.gen`
3. **Adapters Layer** → Wrap external calls with `Effect.tryPromise`
4. **Apps Layer** → Bridge Effect back to GraphQL with `Effect.runPromise`

---

## Key Patterns

### Error Types (Effect-Native)

Replace custom error classes with `Data.TaggedError`:

```typescript
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{
  entityType: string;
  id: string;
}> {}
```

### Entity Migration

**Before:**

```typescript
static create(props: {...}): Result<User, ValidationError> {
  if (invalid) return err(new ValidationError("..."));
  return ok(new User(...));
}
```

**After:**

```typescript
static create(props: {...}): Effect.Effect<User, ValidationError> {
  return Effect.gen(function* () {
    if (invalid) {
      return yield* Effect.fail(new ValidationError({
        field: "email",
        message: "Invalid email format"
      }));
    }
    return new User(...);
  });
}
```

### Use Case Migration

**Before:**

```typescript
async execute(input: { email: string }): Promise<Result<User, Error>> {
  const existing = await this.userRepo.findByEmail(input.email);
  if (existing) return err(new UserAlreadyExistsError());
  // ...
}
```

**After:**

```typescript
export class CreateUserUseCase extends Context.Tag("CreateUserUseCase")<
  CreateUserUseCase,
  {
    readonly execute: (input: {
      email: string;
    }) => Effect.Effect<
      User,
      UserAlreadyExistsError | ValidationError | RepositoryError
    >;
  }
>() {}

export const CreateUserUseCaseLive = Layer.effect(
  CreateUserUseCase,
  Effect.gen(function* () {
    const userRepo = yield* UserRepository;
    return {
      execute: (input) =>
        Effect.gen(function* () {
          const existing = yield* userRepo.findByEmail(input.email);
          if (existing !== null) {
            return yield* Effect.fail(new UserAlreadyExistsError());
          }
          const user = yield* User.create({ email: input.email });
          return yield* userRepo.create(user);
        }),
    };
  }),
);
```

### Repository with @effect/sql-drizzle

```typescript
export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const db = Drizzle.make(sql, { schema });
    return {
      findById: (id: string) =>
        db.query.users.findFirst({ where: eq(schema.users.id, id) }).pipe(
          Effect.map((record) => (record ? UserMapper.toDomain(record) : null)),
          Effect.catchAll((error) =>
            Effect.fail(
              new RepositoryError({ operation: "findById", cause: error }),
            ),
          ),
        ),
      // ...
    };
  }),
);
```

### GraphQL Resolver

```typescript
resolve: async (_root, args, context): Promise<GetUserOutput | null> => {
  return await Effect.runPromise(
    Effect.gen(function* () {
      yield* requireAuthEffect(context);
      const getUserUseCase = yield* GetUserUseCase;
      return yield* getUserUseCase.execute({ id: args.id }).pipe(
        Effect.catchTag("EntityNotFoundError", () => Effect.succeed(null)),
        Effect.mapError((error) => mapErrorToGraphQLEffect(error)),
      );
    }).pipe(Effect.provide(context.runtime)),
  );
};
```

### Layer Composition

```typescript
export const AppLayer = Layer.mergeAll(
  BunContext.layer, // Bun platform context
  SqlLive, // Database connection pool
  UserRepositoryLive, // Repository implementations
  GetUserUseCaseLive, // Use case implementations
  CreateUserUseCaseLive,
  // ...
);

export type AppServices = typeof AppLayer;
```

---

## Testing Strategy

### Domain Testing

```typescript
describe("[UNIT] User entity", () => {
  it("creates valid user", async () => {
    const result = await Effect.runPromise(
      User.create({ email: "test@example.com", ... })
    );
    expect(result.email).toBe("test@example.com");
  });

  it("fails with invalid email", async () => {
    const result = await Effect.runPromiseExit(
      User.create({ email: "invalid", ... })
    );
    expect(result._tag).toBe("Failure");
  });
});
```

### Use Case Testing

```typescript
const TestLayer = Layer.mergeAll(
  InMemoryUserRepositoryLive,
  CreateUserUseCaseLive,
);

describe("[UNIT] CreateUserUseCase", () => {
  it("creates user successfully", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const useCase = yield* CreateUserUseCase;
        return yield* useCase.execute({ email: "test@example.com" });
      }).pipe(Effect.provide(TestLayer)),
    );
    expect(result.email).toBe("test@example.com");
  });
});
```

### Integration Testing

```typescript
describe("[INTEGRATION] DrizzleUserRepository", () => {
  let postgresContainer: PostgreSqlContainer;
  let TestLayer: Layer.Layer<UserRepository>;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer().start();
    TestLayer = Layer.mergeAll(
      SqlClient.layer({ url: postgresContainer.getConnectionUri() }),
      UserRepositoryLive,
    );
  });
  // ...
});
```

---

## Risks and Mitigations

| Risk                             | Mitigation                                                        |
| -------------------------------- | ----------------------------------------------------------------- |
| **Effect runtime leaks**         | Always use `Effect.runPromise` at boundaries, never store Runtime |
| **Error type proliferation**     | Use shared error types, avoid creating one-off errors             |
| **Layer composition complexity** | Build layers incrementally, test each layer independently         |
| **Performance regression**       | Benchmark after each phase, Effect should be faster or equal      |

### Rollback Strategy

If critical issues arise:

1. **Domain layer** can stay as Effect (pure, no runtime)
2. **Use cases** can be wrapped back to async/await with `Effect.runPromise`
3. **Adapters** can keep Effect but expose Promise-based APIs

---

## Benefits Summary

After migration, the codebase gains:

1. **Structured Concurrency** - Fibers, cancellation, and supervision
2. **Resource Safety** - Automatic cleanup of DB connections, handles
3. **Observability** - Built-in tracing, logging, and metrics
4. **Error Handling** - Exhaustive error checking via tagged errors
5. **Composability** - Effects compose naturally with `andThen`, `flatMap`, `race`, etc.
6. **Type Safety** - Full type inference for error channels
7. **Testability** - Layer-based mocking is cleaner than container mocking

---

## Architecture Overview

### References

This architecture overview is based on the following research outputs and documentation:

| Document                   | Path                                                 | Purpose                                                                                    |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Codebase Analysis**      | `.specs/analysis/analysis-effect-migration.md`       | Comprehensive file inventory, layer-by-layer analysis, and migration complexity assessment |
| **Effect Framework Skill** | `.claude/skills/effect-framework-migration/SKILL.md` | Migration patterns, testing strategies, and Clean Architecture integration guides          |
| **Effect Official Docs**   | https://effect.website/docs/introduction             | Core Effect framework documentation and API reference                                      |

### Solution Strategy

The migration follows an **inside-out evolutionary pattern** that preserves working code at every stage:

1. **Fix Foundation First** - Correct gateway error channels (remove `orDie`) to unblock downstream use cases
2. **Migrate Core Logic** - Convert 107 use cases from transitional `Effect<Result<T,E>>` to native `Effect<T,E,R>`
3. **Standardize Testing** - Update 400+ test files with consistent Effect patterns
4. **Cleanup** - Deprecate legacy `Result<T,E>` type and utilities

**Strategic Rationale**:

- **Risk Mitigation**: Each phase produces deployable, tested code
- **Parallel Safety**: Working codebase never broken - transitional patterns bridge gaps
- **Developer Velocity**: Fixes immediate issues (error swallowing) before structural changes
- **Clean Architecture Preservation**: Domain boundaries maintained throughout

**Platform-Specific Considerations**:

| Platform         | Strategy                                               | Constraint                                        |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------- |
| **Bun Backend**  | Full Effect ecosystem including `@effect/platform-bun` | Use structured concurrency, SQL client layers     |
| **React Native** | Core `effect` only (no platform packages)              | JSC/Hermes runtime - custom fetch/SQLite wrappers |

### Key Architectural Decisions

#### Decision 1: Remove `orDie` from Gateways (Priority: Critical)

**Context**: Gateways currently use `Effect.tryPromise(...).pipe(Effect.orDie)` which removes error channels, converting typed errors into defects.

**Decision**: Remove `orDie` from all 17 gateway files to restore type-safe error propagation.

**Rationale**:

- Port interfaces define `Effect.Effect<T, DatabaseError, never>`
- Gateways must align with port contracts
- Error information is currently lost at the boundary
- Simple, surgical fix with high impact

**Impact**: 17 files in `packages/adapters/src/gateways/drizzle/`

#### Decision 2: Use Case Error Channel Migration (Priority: High)

**Context**: All 107 use cases use transitional pattern: `Effect.Effect<Result<T,E>, never, never>`

**Decision**: Migrate to native Effect error channels: `Effect.Effect<T, E, R>` where errors flow through the E channel.

**Migration Pattern**:

```typescript
// Before (Transitional)
execute(input): Effect.Effect<Result<User, NotFoundError>, never, never>

// After (Native)
execute(input): Effect.Effect<User, NotFoundError, UserRepository>
```

#### Decision 3: Context.Tag for Dependency Injection (Priority: High)

**Decision**: Replace constructor injection with `Context.Tag` resolution within `Effect.gen`.

**Rationale**:

- Type-safe dependency resolution
- Composable with Layer system
- Testable via Layer-based mocking
- Eliminates awilix (already removed from codebase)

#### Decision 4: Layer-Based Test Wiring (Priority: Medium)

**Decision**: Standardize on Layer-based test doubles using `Layer.succeed` and `Layer.effect`.

**Rationale**:

- Mirrors production architecture
- Type-safe test doubles
- Composable test scenarios

#### Decision 5: React Native Compatibility (Priority: Medium)

**Decision**: Use `effect` core only for React Native. Implement custom wrappers for fetch and SQLite.

**Rationale**:

- JSC/Hermes runtime constraints
- Avoid polyfill complexity
- Minimal bundle size

### Migration Sequence with Dependencies

| Phase       | Timeline  | Files         | Dependencies | Deliverable                  | Reference     |
| ----------- | --------- | ------------- | ------------ | ---------------------------- | ------------- |
| **Phase 1** | Week 1    | 17 gateways   | None         | Type-safe error propagation  | Analysis §4.4 |
| **Phase 2** | Week 1    | 1 port        | Phase 1      | 100% Effect-based ports      | Analysis §4.3 |
| **Phase 3** | Weeks 2-4 | 107 use cases | Phase 1, 2   | Native Effect error channels | Analysis §4.2 |
| **Phase 4** | Weeks 4-6 | 400+ tests    | Phase 3      | Consistent test patterns     | Analysis §6   |
| **Phase 5** | Weeks 7-8 | 11 + docs     | All phases   | Clean codebase               | —             |

**Phase 3 Batch Order**:

1. Core user/group operations (highest usage)
2. Challenge/reward operations
3. Notification/activity operations
4. Administrative operations

**Source**: See `.specs/analysis/analysis-effect-migration.md` Section "Recommendations" for detailed file lists and priority ordering.

### Expected Changes by Layer

| Layer           | Status          | Files Changed | Key Changes                             |
| --------------- | --------------- | ------------- | --------------------------------------- |
| **Domain**      | ✅ Complete     | 0             | No changes needed                       |
| **Use Cases**   | ⚠️ Transitional | 107           | `Effect<Result<T,E>>` → `Effect<T,E,R>` |
| **Ports**       | ⚠️ 95% Complete | 1             | `TelemetryPort.ts` to Effect            |
| **Gateways**    | ⚠️ Needs Fix    | 17            | Remove `orDie` from all gateway files   |
| **Controllers** | ✅ Complete     | 0             | Already migrated                        |
| **Frameworks**  | ✅ Complete     | 0             | Already migrated                        |
| **Tests**       | ⚠️ Mixed        | 400+          | Standardize Effect patterns             |

#### Gateway Files (17 files to fix in Phase 1)

All files in `packages/adapters/src/gateways/drizzle/`:

1. `packages/adapters/src/gateways/drizzle/user.ts`
2. `packages/adapters/src/gateways/drizzle/group.ts`
3. `packages/adapters/src/gateways/drizzle/trip.ts`
4. `packages/adapters/src/gateways/drizzle/challenge.ts`
5. `packages/adapters/src/gateways/drizzle/reward.ts`
6. `packages/adapters/src/gateways/drizzle/sponsor.ts`
7. `packages/adapters/src/gateways/drizzle/notification.ts`
8. `packages/adapters/src/gateways/drizzle/location.ts`
9. `packages/adapters/src/gateways/drizzle/event.ts`
10. `packages/adapters/src/gateways/drizzle/activity-feed.ts`
11. `packages/adapters/src/gateways/drizzle/challenge-vote.ts`
12. `packages/adapters/src/gateways/drizzle/challenge-submission.ts`
13. `packages/adapters/src/gateways/drizzle/notification-schedule.ts`
14. `packages/adapters/src/gateways/drizzle/notification-delivery.ts`
15. `packages/adapters/src/gateways/drizzle/coin-transaction.ts`
16. `packages/adapters/src/gateways/drizzle/submission-report.ts`
17. `packages/adapters/src/gateways/drizzle/user-agent.ts`

**Fix Required**: Remove `.pipe(Effect.orDie)` from all methods to restore type-safe error channels.

#### Use Case Files (107 files in Phase 3)

Representative samples from `packages/use-cases/src/interactors/`:

| Category                 | Sample Files                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------- |
| **Core User/Group**      | `GetUser.ts`, `GetGroup.ts`, `GetLocation.ts`, `CreateUser.ts`, `UpdateUser.ts`     |
| **Challenge Operations** | `GetChallenge.ts`, `CreateChallenge.ts`, `SubmitChallenge.ts`, `VoteOnChallenge.ts` |
| **Reward/Coin**          | `GetReward.ts`, `ClaimReward.ts`, `GetCoinBalance.ts`, `TransferCoins.ts`           |
| **Notifications**        | `SendNotification.ts`, `ScheduleNotification.ts`, `GetNotification.ts`              |
| **Activity/Trips**       | `GetActivityFeed.ts`, `GetTrip.ts`, `CreateTrip.ts`, `JoinTrip.ts`                  |
| **Admin/Reports**        | `GetSubmissionReport.ts`, `CreateSubmissionReport.ts`, `AdminGetStats.ts`           |

**Full list**: See `.specs/analysis/analysis-effect-migration.md` Section "Phase 2: Use Case Migration (107 files)"

**Migration Pattern**:

```typescript
// Before (Transitional)
execute(input): Effect.Effect<Result<User, NotFoundError>, never, never>

// After (Native)
execute(input): Effect.Effect<User, NotFoundError, UserRepository>
```

### Integration Strategy

**Boundary Management**:

```typescript
// Domain → Use Cases: Errors flow through E channel
const user = yield* User.create({ email: input.email });

// Use Cases → Controllers: Bridge at GraphQL boundary
return await Effect.runPromise(program.pipe(
  Effect.provide(context.runtime)
));

// Ports → Gateways: Fixed error preservation
findById(id): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({...}); // No orDie
}
```

**Test Double Pattern**:

```typescript
const MockUserRepository = Layer.succeed(
  UserRepository,
  UserRepository.of({
    findById: () => Effect.succeed(mockUser),
    save: () => Effect.void,
  }),
);
const result = await Effect.runPromise(
  Effect.provide(program, MockUserRepository),
);
```

**Error Propagation**:

- **Domain → Use Cases**: Tagged errors through Effect error channel
- **Use Cases → Controllers**: Errors mapped to HTTP/GraphQL responses
- **Gateways → Use Cases**: Database errors converted to domain-specific errors

---

## Implementation Process

> **Note**: See full decomposition in `.specs/scratchpad/effect-migration-decomposition.md`
> **Parallelization Plan**: See detailed parallelization analysis in `.specs/scratchpad/effect-migration-parallelization.md`

Each step includes:

- **Agent**: Recommended agent (`opus` = complex/architectural, `sonnet` = medium/implementation, `haiku` = simple/cleanup)
- **Parallel With**: Steps that can execute simultaneously (no dependencies or shared state)
- **Wave**: Execution wave number for orchestration
- **Dependencies**: Steps that must complete before this step starts

### Phase 1: Fix Foundation (Week 1)

#### Step 1.1: Remove orDie from Gateways

- **Files**: 17 gateway files in `packages/adapters/src/gateways/drizzle/`
- **Goal**: Restore type-safe error propagation by removing `.pipe(Effect.orDie)`
- **Success Criteria**:
  - All gateways return `Effect.Effect<T, DatabaseError, never>`
  - Zero `orDie` occurrences in gateway files
  - All tests pass
- **Effort**: 2-3 days
- **Risk**: Low
- **Verification**: `grep -r "orDie" packages/adapters/src/gateways/` returns zero
- **Agent**: `opus` (architectural change, error channel design)
- **Parallel With**: 3.1, 4.3
- **Wave**: 1

**Verification**:

- **Level**: HIGH (Panel verification required)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Error Channel Restoration (35%): All gateway methods return `Effect.Effect<T, DatabaseError, never>` with explicit error channels
  - orDie Removal (30%): Zero occurrences of `.pipe(Effect.orDie)` across all 17 gateway files
  - Port Contract Alignment (20%): Gateway implementations align with port interface contracts for error types
  - Test Pass Rate (15%): All existing gateway tests pass without modification

#### Step 1.2: Migrate TelemetryPort to Effect

- **Files**: 1 file (`packages/use-cases/src/ports/TelemetryPort.ts`)
- **Goal**: Convert last Promise-based port to Effect
- **Success Criteria**:
  - Port uses `Effect.Effect<T, TelemetryError, R>`
  - All implementations updated
  - Tests pass
- **Effort**: 0.5 days
- **Dependencies**: Step 1.1
- **Risk**: Low
- **Agent**: `sonnet` (port conversion pattern)
- **Parallel With**: 3.2, 4.3
- **Wave**: 2

**Verification**:

- **Level**: MEDIUM (Single judge verification)
- **Threshold**: 3.5/5.0
- **Rubric**:
  - Effect Pattern Conversion (35%): Port interface uses `Effect.Effect<T, TelemetryError, R>` pattern
  - Implementation Alignment (30%): All implementations updated to return Effect types
  - Contract Completeness (20%): All port methods migrated, no Promise-based signatures remain
  - Test Compatibility (15%): Tests updated and passing with new Effect-based port

---

### Phase 2: Use Case Migration (Weeks 2-4)

#### Step 2.1: Core User/Group Use Cases

- **Files**: ~15 use cases (GetUser, CreateUser, GetGroup, etc.)
- **Goal**: Convert `Effect<Result<T,E>>` to `Effect<T,E,R>`
- **Success Criteria**:
  - Native Effect error channels
  - Context.Tag resolution
  - Layer-based test wiring
- **Effort**: 3-4 days
- **Dependencies**: Step 1.2
- **Risk**: Medium
- **Agent**: `opus` (complex use case orchestration)
- **Parallel With**: None (use case chain start)
- **Wave**: 3

**Verification**:

- **Level**: HIGH (Panel verification required)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Error Channel Migration (35%): All use cases converted from `Effect<Result<T,E>>` to `Effect<T,E,R>`
  - Context.Tag Usage (25%): Dependencies resolved via `Context.Tag` within `Effect.gen` (not constructor injection)
  - Layer-Based Wiring (20%): Tests use Layer-based dependency injection with `Layer.succeed`/`Layer.effect`
  - Native Effect Patterns (20%): Use of `Effect.gen`, `Effect.fail`, `Effect.succeed` (not transitional wrappers)

#### Step 2.2: Challenge/Reward Use Cases

- **Files**: ~25 use cases (GetChallenge, SubmitChallenge, ClaimReward, etc.)
- **Effort**: 4-5 days
- **Dependencies**: Step 2.1
- **Risk**: Medium
- **Agent**: `opus` (complex use case orchestration)
- **Parallel With**: None (sequential chain)
- **Wave**: 4

**Verification**:

- **Level**: HIGH (Panel verification required)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Error Channel Migration (35%): All use cases converted from `Effect<Result<T,E>>` to `Effect<T,E,R>`
  - Context.Tag Usage (25%): Dependencies resolved via `Context.Tag` within `Effect.gen`
  - Layer-Based Wiring (20%): Tests use Layer-based dependency injection
  - Error Propagation (20%): Errors flow through Effect error channel (not wrapped in Result)

#### Step 2.3: Notification/Activity Use Cases

- **Files**: ~20 use cases (SendNotification, GetActivityFeed, etc.)
- **Effort**: 3-4 days
- **Dependencies**: Step 2.2
- **Risk**: Medium
- **Agent**: `opus` (complex use case orchestration)
- **Parallel With**: None (sequential chain)
- **Wave**: 5

**Verification**:

- **Level**: HIGH (Panel verification required)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Error Channel Migration (35%): All use cases converted from `Effect<Result<T,E>>` to `Effect<T,E,R>`
  - Context.Tag Usage (25%): Dependencies resolved via `Context.Tag` within `Effect.gen`
  - Layer-Based Wiring (20%): Tests use Layer-based dependency injection
  - Error Propagation (20%): Errors flow through Effect error channel

#### Step 2.4: Remaining Use Cases

- **Files**: ~47 use cases (Trips, Admin, Reports, Coins, etc.)
- **Success Criteria**: Zero `Effect<Result<T,E>>` patterns remain
- **Effort**: 5-6 days
- **Dependencies**: Step 2.3
- **Risk**: Medium
- **Agent**: `opus` (complex use case orchestration)
- **Parallel With**: None (sequential chain end)
- **Wave**: 6

**Verification**:

- **Level**: HIGH (Panel verification required)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Zero Transitional Patterns (35%): No `Effect<Result<T,E>>` patterns remain in any use case
  - Complete Migration (30%): All 47+ remaining use cases use native Effect error channels
  - Test Coverage (20%): All use case tests pass with Layer-based wiring
  - Consistency (15%): Pattern consistency across all use case categories

---

### Phase 3: Test Standardization (Weeks 4-6)

#### Step 3.1: Create Test Infrastructure Helpers

- **Goal**: Layer-based test utilities
- **Success Criteria**: `TestLayer` builders, `runWithTestLayer` helper
- **Effort**: 2-3 days
- **Risk**: Low
- **Agent**: `sonnet` (test helper implementation)
- **Parallel With**: 1.1, 4.3
- **Wave**: 1

**Verification**:

- **Level**: MEDIUM (Single judge verification)
- **Threshold**: 3.5/5.0
- **Rubric**:
  - Layer Builder Completeness (35%): TestLayer builders for all service types (repositories, use cases)
  - Test Helper Usability (30%): `runWithTestLayer` helper works across all test categories
  - Type Safety (20%): Layer composition maintains type safety, no `any` types
  - Documentation (15%): Helpers documented with usage examples

#### Step 3.2: Migrate Domain Package Tests

- **Files**: ~60 tests
- **Effort**: 3-4 days
- **Dependencies**: Step 3.1, Step 1.2
- **Risk**: Low
- **Agent**: `sonnet` (test migration)
- **Parallel With**: 1.2, 2.1
- **Wave**: 2

**Verification**:

- **Level**: LOW (Test execution verification)
- **Threshold**: 3.0/5.0
- **Rubric**:
  - Effect.runPromise Usage (30%): Tests use `Effect.runPromise` for Effect-based assertions
  - Test Isolation (25%): Each test is isolated, no state leakage between tests
  - Coverage Maintenance (25%): Code coverage equal or better than pre-migration baseline
  - Pattern Consistency (20%): Consistent Effect testing patterns across all domain tests

#### Step 3.3: Migrate Use Cases Package Tests

- **Files**: ~100 tests
- **Effort**: 5-6 days
- **Dependencies**: Step 2.4, Step 3.1
- **Risk**: Medium
- **Agent**: `sonnet` (test migration)
- **Parallel With**: 3.4
- **Wave**: 7

**Verification**:

- **Level**: LOW (Test execution verification)
- **Threshold**: 3.0/5.0
- **Rubric**:
  - Layer-Based Mocking (35%): All tests use Layer-based mocking (not container mocking)
  - Effect Patterns (25%): Tests use `Effect.provide`, `Effect.runPromise` correctly
  - Coverage Maintenance (25%): Code coverage equal or better than baseline
  - Mock Completeness (15%): All dependencies mocked via Layer, no missing service errors

#### Step 3.4: Migrate Adapters Package Tests

- **Files**: ~80 tests
- **Effort**: 4-5 days
- **Dependencies**: Step 2.4, Step 3.1
- **Risk**: Medium
- **Agent**: `sonnet` (test migration)
- **Parallel With**: 3.3
- **Wave**: 7

**Verification**:

- **Level**: LOW (Test execution verification)
- **Threshold**: 3.0/5.0
- **Rubric**:
  - Layer-Based Mocking (30%): Tests use Layer-based mocking for repositories/gateways
  - Testcontainers Compatibility (25%): Integration tests work with testcontainers and Effect
  - Coverage Maintenance (25%): Code coverage equal or better than baseline
  - SQL-Drizzle Integration (20%): Tests correctly use `@effect/sql-drizzle` patterns

#### Step 3.5: Migrate Remaining Test Files

- **Files**: ~160 tests
- **Success Criteria**: Full test suite passes (`bun test` exits zero)
- **Effort**: 5-6 days
- **Dependencies**: Step 3.3, Step 3.4
- **Risk**: Medium
- **Agent**: `sonnet` (test migration)
- **Parallel With**: None
- **Wave**: 8

**Verification**:

- **Level**: LOW (Test execution verification)
- **Threshold**: 3.0/5.0
- **Rubric**:
  - Full Suite Pass (35%): `bun test` exits with zero failures
  - Consistent Patterns (30%): All ~160 remaining tests use consistent Effect patterns
  - Coverage Maintenance (20%): Overall code coverage equal or better than baseline
  - Migration Completeness (15%): No Promise-based test patterns remain

---

### Phase 4: Cleanup (Weeks 7-8)

#### Step 4.1: Remove zod Usage

- **Files**: ~11 files
- **Goal**: Replace zod with Effect Schema
- **Effort**: 2-3 days
- **Dependencies**: Step 3.5
- **Risk**: Low
- **Agent**: `haiku` (simple cleanup)
- **Parallel With**: 4.2, 4.4
- **Wave**: 9

**Verification**:

- **Level**: NONE (Inspection-based)
- **Verification**: Manual inspection via `grep -r "from 'zod'"` shows zero imports in production code

#### Step 4.2: Deprecate Result<T,E> Type

- **Files**: `packages/domain/src/utils/result.ts`
- **Goal**: Zero `Result<T,E>` in production code
- **Effort**: 1-2 days
- **Dependencies**: Step 3.5
- **Risk**: Low
- **Agent**: `haiku` (simple cleanup)
- **Parallel With**: 4.1, 4.4
- **Wave**: 9

**Verification**:

- **Level**: NONE (Inspection-based)
- **Verification**: Manual inspection via `grep -r "Result<" packages/` (excluding tests/legacy) shows zero production usage

#### Step 4.3: Update Documentation

- **Files**: CLAUDE.md, AGENTS.md, TESTING.md
- **Goal**: Effect patterns documented
- **Effort**: 2-3 days
- **Dependencies**: Step 1.1
- **Risk**: Low
- **Agent**: `haiku` (documentation)
- **Parallel With**: 3.1, 1.2, 3.2
- **Wave**: 1-2

**Verification**:

- **Level**: NONE (Inspection-based)
- **Verification**: Manual review of CLAUDE.md, AGENTS.md, TESTING.md for Effect pattern coverage and accuracy

#### Step 4.4: Performance Validation

- **Goal**: Response times within ±10% of baseline
- **Effort**: 2-3 days
- **Dependencies**: Step 3.5
- **Risk**: Low
- **Agent**: `sonnet` (benchmarking)
- **Parallel With**: 4.1, 4.2
- **Wave**: 9

**Verification**:

- **Level**: MEDIUM (Single judge verification)
- **Threshold**: 3.5/5.0
- **Rubric**:
  - Benchmark Execution (35%): All performance benchmarks execute without errors
  - ±10% Threshold (35%): Response times within ±10% of Promise-based baseline
  - Reporting (20%): Results documented with before/after comparison
  - Regression Identification (10%): Any regressions >10% identified with root cause

#### Step 4.5: Final Integration Testing

- **Goal**: All 14 acceptance criteria pass
- **Effort**: 2 days
- **Dependencies**: Step 4.1, Step 4.2, Step 4.4
- **Risk**: Low
- **Agent**: `opus` (final validation, orchestration)
- **Parallel With**: None
- **Wave**: 10

**Verification**:

- **Level**: HIGH (Panel verification required)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Acceptance Criteria (40%): All 14 acceptance criteria from task file pass
  - Test Suite Pass (25%): Full `bun test` suite exits zero
  - Integration Success (20%): End-to-end workflows (user→challenge→reward) function correctly
  - Clean Architecture (15%): Layer boundaries maintained, no architectural violations

---

### Implementation Summary (Parallelized)

| Phase     | Steps  | Files    | Duration    | Key Deliverable              | Parallel Wave  |
| --------- | ------ | -------- | ----------- | ---------------------------- | -------------- |
| 1         | 2      | 18       | 3-4 days    | Type-safe error propagation  | Waves 1-2      |
| 2         | 4      | 107      | 15-19 days  | Native Effect error channels | Waves 3-6      |
| 3         | 5      | 400+     | 14-17 days  | Consistent test patterns     | Waves 7-8      |
| 4         | 5      | 11+      | 4 days      | Clean codebase               | Waves 9-10     |
| **Total** | **16** | **~550** | **38 days** | **Full migration**           | **~5.4 weeks** |

**Time Savings**: ~18 days (32% reduction from 8 weeks sequential)

### Parallelization Overview

| Metric                  | Value                     |
| ----------------------- | ------------------------- |
| **Sequential Duration** | ~56 days (8 weeks)        |
| **Parallel Duration**   | ~38 days (5.4 weeks)      |
| **Time Savings**        | ~18 days (32% reduction)  |
| **Max Parallel Depth**  | 3 tracks (Wave 9 cleanup) |
| **Critical Path**       | 10 steps (36.5 days)      |

### Agent Workload Summary

| Agent      | Steps Assigned                    | Total Effort | Complexity                     |
| ---------- | --------------------------------- | ------------ | ------------------------------ |
| **opus**   | 1.1, 2.1, 2.2, 2.3, 2.4, 4.5      | ~22 days     | High (architectural decisions) |
| **sonnet** | 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.4 | ~28 days     | Medium (implementation, tests) |
| **haiku**  | 4.1, 4.2, 4.3                     | ~6 days      | Low (cleanup, docs)            |

### Execution Waves

| Wave        | Steps         | Parallel With | Dependencies  | Duration |
| ----------- | ------------- | ------------- | ------------- | -------- |
| **Wave 1**  | 1.1, 3.1      | Each other    | None          | 3 days   |
| **Wave 2**  | 1.2, 3.2, 4.3 | Each other    | 1.1           | 3-4 days |
| **Wave 3**  | 2.1           | None          | 1.2           | 3-4 days |
| **Wave 4**  | 2.2           | None          | 2.1           | 4-5 days |
| **Wave 5**  | 2.3           | None          | 2.2           | 3-4 days |
| **Wave 6**  | 2.4           | None          | 2.3           | 5-6 days |
| **Wave 7**  | 3.3, 3.4      | Each other    | 2.4, 3.1      | 5-6 days |
| **Wave 8**  | 3.5           | None          | 3.3, 3.4      | 5-6 days |
| **Wave 9**  | 4.1, 4.2, 4.4 | Each other    | 3.5           | 2-3 days |
| **Wave 10** | 4.5           | None          | 4.1, 4.2, 4.4 | 2 days   |

### Critical Path

```
1.1 (3d) → 1.2 (0.5d) → 2.1 (4d) → 2.2 (5d) → 2.3 (4d) → 2.4 (6d) → 3.3 (6d) → 3.5 (6d) → 4.5 (2d)
   │          │
   ↓          ↓
  3.1        3.2, 4.3
 (parallel)  (parallel)

Critical Path Duration: ~36.5 days
Total Parallel Duration: ~38 days
```

### Parallel Execution Diagram

```
DAY 0                    DAY 10                   DAY 20                   DAY 30                   DAY 38
  │                        │                        │                        │                        │
  ├─[1.1] Gateways (opus) ──────────────────────────────────────────────────────────────────────────┤
  │   Parallel: [3.1] Test Helpers (sonnet), [4.3] Docs (haiku)                                         │
  │                                                                                                   │
  │                                              [2.1-2.4] Use Cases (opus) ────────────────────────────┤
  │                                              Sequential chain (15-19 days)                        │
  │                                                                                                   │
  │                                              ┌─[3.3] Use Case Tests (sonnet) ──────────────────────┤
  │                                              ├─[3.4] Adapter Tests (sonnet) ────────────────────────┤
  │                                              └─[3.5] Remaining Tests (sonnet) ──────────────────────┤
  │                                                                                                   │
  │                                              ┌─[4.1] Remove zod (haiku) ────────────────────────────┤
  │                                              ├─[4.2] Deprecate Result (haiku) ──────────────────────┤
  │                                              ├─[4.4] Performance (sonnet) ───────────────────────────┤
  │                                              └─[4.5] Final Integration (opus) ───────────────────────┤
  └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Risk Summary

| Risk                                | Level  | Mitigation                            |
| ----------------------------------- | ------ | ------------------------------------- |
| Gateway fixes cause runtime defects | Low    | Error logging; staging validation     |
| Use case migration breaks flows     | Medium | Tests; feature flags; gradual rollout |
| Test migration volume               | Medium | Parallel execution; prioritize        |
| Performance regression              | Low    | Benchmark each phase                  |
| Integration issues                  | Low    | Comprehensive integration tests       |

### Definition of Done

- [ ] **Phase 1**: Gateways preserve errors; TelemetryPort uses Effect
- [ ] **Phase 2**: All 107 use cases use `Effect<T,E,R>`; zero `Effect<Result<T,E>>`
- [ ] **Phase 3**: All 400+ tests use Layer-based wiring; `bun test` passes
- [ ] **Phase 4**: zod removed; Result deprecated; docs updated; performance validated
- [ ] **All 14 Acceptance Criteria pass**
- [ ] **Staging deployment successful**
- [ ] **Code reviewed and approved**
- [ ] **CLAUDE.md, AGENTS.md, TESTING.md updated**

---

## Verification Summary

### Coverage by Step

| Step | Description | Level | Threshold | Verification Method |
|------|-------------|-------|-----------|-------------------|
| 1.1 | Remove orDie from Gateways | HIGH | 4.0/5.0 | Panel of 2 judges |
| 1.2 | Migrate TelemetryPort to Effect | MEDIUM | 3.5/5.0 | Single judge |
| 2.1 | Core User/Group Use Cases | HIGH | 4.0/5.0 | Panel of 2 judges |
| 2.2 | Challenge/Reward Use Cases | HIGH | 4.0/5.0 | Panel of 2 judges |
| 2.3 | Notification/Activity Use Cases | HIGH | 4.0/5.0 | Panel of 2 judges |
| 2.4 | Remaining Use Cases | HIGH | 4.0/5.0 | Panel of 2 judges |
| 3.1 | Create Test Infrastructure Helpers | MEDIUM | 3.5/5.0 | Single judge |
| 3.2 | Migrate Domain Package Tests | LOW | 3.0/5.0 | Test execution + spot check |
| 3.3 | Migrate Use Cases Package Tests | LOW | 3.0/5.0 | Test execution + spot check |
| 3.4 | Migrate Adapters Package Tests | LOW | 3.0/5.0 | Test execution + spot check |
| 3.5 | Migrate Remaining Test Files | LOW | 3.0/5.0 | Test execution + spot check |
| 4.1 | Remove zod Usage | NONE | N/A | Manual inspection |
| 4.2 | Deprecate Result<T,E> Type | NONE | N/A | Manual inspection |
| 4.3 | Update Documentation | NONE | N/A | Manual review |
| 4.4 | Performance Validation | MEDIUM | 3.5/5.0 | Single judge |
| 4.5 | Final Integration Testing | HIGH | 4.0/5.0 | Panel of 2 judges |

### Verification Level Distribution

| Level | Count | Steps | Purpose |
|-------|-------|-------|---------|
| HIGH | 6 | 1.1, 2.1, 2.2, 2.3, 2.4, 4.5 | Critical path requiring panel review |
| MEDIUM | 3 | 1.2, 3.1, 4.4 | Important localized changes |
| LOW | 4 | 3.2, 3.3, 3.4, 3.5 | Test migrations (execution-verified) |
| NONE | 3 | 4.1, 4.2, 4.3 | Simple cleanup/documentation |

### Critical Verification Points

1. **Gateway Error Channels (Step 1.1)**: Foundation for all downstream error handling
2. **Use Case Migration (Steps 2.1-2.4)**: Core business logic transformation
3. **Final Integration (Step 4.5)**: End-to-end validation of all 14 acceptance criteria

### Verification Artifacts

- **Scratchpad**: `.specs/scratchpad/effect-migration-verification.md` (detailed rubrics)
- **Results**: Each step verification results logged in implementation notes
- **Escalation**: Scores below threshold trigger automatic re-implementation

---

**Last Updated**: 2026-04-14  
**Verification Version**: 1.0

