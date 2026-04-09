---
title: Migrate all source code to use DI (awilix-modular) and Effect.ts
depends_on:
  - .specs/tasks/done/implement-inversify-dependency-injection.refactor.md
---

## Initial User Prompt

Now migrate all sourcecode to use DI and Effect

## Description

Complete architectural migration of the Mirai App monorepo to use:

1. **Full DI container adoption** (awilix-modular) - All repositories, use cases, and controllers registered and resolved via the DI container
2. **Effect.ts patterns** - Replace custom `Result<T,E>` type with Effect's `Effect<never, E, T>` for all error handling and async operations

The current codebase has inconsistent patterns - partial DI adoption with direct instantiation in some areas, and a custom `Result<T,E>` implementation that predates Effect.ts adoption. This migration will:

- Eliminate mixed patterns and reduce cognitive load
- Provide better composability through Effect's monadic operations
- Enable superior error tracking and resource management
- Align with industry-standard functional programming patterns
- Improve testability through complete DI coverage

**Scope**:

- **Included**: All 16 Prisma repositories, all use case interactors, all tRPC controllers, all Result<T,E> to Effect conversions, all test updates
- **Excluded**: Business logic changes, new features, database schema modifications, API contract changes, frontend app changes (unless direct Result usage)

**User Scenarios**:

1. **Primary Flow**: Migrate DI first (register all components), then Effect (convert Result types), then update tests
2. **Alternative Flow**: Package-by-package migration (domain → use-cases → adapters → frameworks → apps)
3. **Error Handling**: All Effect failures must be properly typed and handled at tRPC boundary

## Architecture Overview

### Solution Strategy

The migration adopts a **hybrid architectural approach** that leverages the strengths of both awilix-modular and Effect.ts:

1. **awilix-modular for DI Infrastructure**: Retain the existing decorator-free DI container for service registration, lifetime management, and dependency resolution. This provides:
   - Zero-configuration TypeScript integration (no tsconfig changes)
   - Module-based organization (RepositoryModule, ControllerModule, UseCaseModule)
   - Scoped lifetime management for request-bound services
   - Familiar container.resolve() pattern in tRPC routers

2. **Effect.ts for Business Logic**: Introduce Effect<never, E, A> as the primary return type for use cases and repositories, providing:
   - Type-safe error tracking at compile time
   - Composable async workflows via Effect.gen and pipe
   - Resource safety and automatic cleanup
   - Lazy evaluation for better testability

3. **Integration Pattern**: awilix-modular resolves service instances → Services return Effect instances → Effects are executed at tRPC boundary with proper error handling.

### Key Architectural Decisions

#### KD1: Hybrid DI + Effect Pattern (Selected)

- **Decision**: Keep awilix-modular for DI wiring, migrate business logic to Effect
- **Rationale**: Minimizes disruption to existing DI infrastructure while gaining Effect benefits
- **Alternative Rejected**: Full Effect Layer migration would require rewriting 400+ files simultaneously
- **Impact**: Gradual migration possible, existing tests require less rework

#### KD2: Repository Layer - Effect-Ready Interfaces

- **Decision**: Repositories return `Effect<never, Error, Entity>` instead of `Promise<Entity>`
- **Rationale**: Database operations are inherently effectful (async, may fail)
- **Pattern**: Wrap Prisma calls with `Effect.tryPromise({ try: () => ..., catch: (e) => new DatabaseError(e) })`
- **Lifecycle**: Repositories remain SINGLETON in DI container

#### KD3: Use Case Layer - Full Effect Adoption

- **Decision**: All use cases convert from `async execute(): Promise<Result<T,E>>` to `execute(): Effect<never, E, T>`
- **Rationale**: Use cases orchestrate multiple effects (repos, services) - perfect for Effect composition
- **Pattern**: Use `Effect.gen(function* () { ... })` for sequential operations, `Effect.all()` for parallel
- **Error Types**: Replace string errors with typed error classes (UserNotFoundError, ValidationError, etc.)

#### KD4: Controller Layer - Effect-to-Result Bridge

- **Decision**: Controllers accept Effects from use cases, convert to Result at boundary
- **Rationale**: Maintains compatibility with existing tRPC router expectations during transition
- **Pattern**: `Effect.runPromise(effect).then(Either.from).then(result => resultToResponse(result))`
- **Future State**: tRPC routers eventually consume Effects directly

#### KD5: Migration Phasing - Dependency Order

- **Decision**: Sequential foundation (Phase 1), parallel execution (Phases 2-3), stabilization (Phases 4-5)
- **Rationale**: AppModule integration is a blocker for all use case DI resolution
- **Phase Order**:
  1. AppModule integration (foundation)
  2. Router DI migration (parallel by domain)
  3. Controller index migration (parallel by controller)
  4. Effect.ts integration (sequential, high-complexity first)
  5. Test migration (parallel)

### Component Overview

#### Repository Layer (16 Components)

All repositories registered in RepositoryModule with SINGLETON lifetime:

| Component                            | Token                          | Effect Status                       |
| ------------------------------------ | ------------------------------ | ----------------------------------- |
| PrismaUserRepository                 | userRepository                 | Wrap methods with Effect.tryPromise |
| PrismaTripRepository                 | tripRepository                 | Wrap methods with Effect.tryPromise |
| PrismaChallengeRepository            | challengeRepository            | Wrap methods with Effect.tryPromise |
| PrismaGroupRepository                | groupController                | Wrap methods with Effect.tryPromise |
| PrismaLocationRepository             | locationRepository             | Wrap methods with Effect.tryPromise |
| PrismaNotificationRepository         | notificationRepository         | Wrap methods with Effect.tryPromise |
| PrismaChallengeSubmissionRepository  | challengeSubmissionRepository  | Wrap methods with Effect.tryPromise |
| PrismaChallengeVoteRepository        | challengeVoteRepository        | Wrap methods with Effect.tryPromise |
| PrismaActivityFeedRepository         | activityFeedRepository         | Wrap methods with Effect.tryPromise |
| PrismaSponsorRepository              | sponsorRepository              | Wrap methods with Effect.tryPromise |
| PrismaSubmissionReportRepository     | submissionReportRepository     | Wrap methods with Effect.tryPromise |
| PrismaRewardRepository               | rewardRepository               | Wrap methods with Effect.tryPromise |
| PrismaCoinTransactionRepository      | coinTransactionRepository      | Wrap methods with Effect.tryPromise |
| PrismaNotificationDeliveryRepository | notificationDeliveryRepository | Wrap methods with Effect.tryPromise |
| PrismaNotificationScheduleRepository | notificationScheduleRepository | Wrap methods with Effect.tryPromise |
| PrismaRewardPurchaseRepository       | rewardPurchaseRepository       | Wrap methods with Effect.tryPromise |

**Migration Pattern**: Keep existing Prisma repository implementations, add Effect wrappers:

```typescript
findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({
    try: () => this.prisma.user.findUnique({ where: { id } }),
    catch: (e) => new DatabaseError(e),
  });
}
```

#### Use Case Layer (75 Components)

All use cases registered in UseCaseModule with SCOPED lifetime, migrated to Effect return types:

**High-Priority Effect Candidates** (complex async flows):

- PurchaseReward.ts - Multi-step transaction (validation, coin check, inventory, purchase)
- SubmitVotes.ts - Batch vote creation with validation
- ForceEndVoting.ts - Vote calculation + ranking update workflow
- AddCoins.ts / RemoveCoins.ts - Financial operations with audit trails
- CreateSubmission.ts - DB write + side effects (activity feed)

**Standard Use Cases** (CRUD operations):

- GetUser.ts, CreateUser.ts, UpdateUser.ts
- GetChallenge.ts, CreateChallenge.ts, UpdateChallenge.ts
- GetGroup.ts, CreateGroup.ts, UpdateGroup.ts
- All notification, location, sponsor use cases

**Migration Pattern**:

```typescript
// Before: async execute(input: CreateUserInput): Promise<Result<UserDTO, string>>
// After: Effect-based
execute(input: CreateUserInput): Effect.Effect<UserDTO, UserError, never> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepository; // Via DI context
    const existing = yield* userRepo.findByEmail(input.email);

    if (existing) {
      return yield* Effect.fail(new UserAlreadyExistsError());
    }

    const user = User.create(input);
    if (Either.isLeft(user)) {
      return yield* Effect.fail(new ValidationError(user.left));
    }

    const saved = yield* userRepo.create(user.right);
    return UserDTO.fromDomain(saved);
  });
}
```

#### Controller Layer (17 Components)

All controllers registered in ControllerModule with SCOPED lifetime:

Controllers act as the **Effect-to-tRPC bridge**:

- Accept Effect-returning use cases
- Execute Effects with proper error handling
- Convert Effect failures to TRPCError for HTTP responses
- Maintain backward-compatible API contracts

**Key Controllers**:

- user-controller.ts
- trip-controller.ts
- challenge-controller.ts
- group-controller.ts
- location-controller.ts
- notification-controller.ts
- notification-schedule-controller.ts
- notification-delivery-controller.ts
- challengeSubmission-controller.ts
- challengeVote-controller.ts
- activityFeed-controller.ts
- reward-controller.ts
- coin-controller.ts
- coin-transaction-controller.ts
- sponsor-controller.ts
- submissionReport-controller.ts
- storage-controller.ts

### Contract/Interface Definitions

#### TRPCContext with DI

```typescript
// packages/adapters/src/api/trpc.ts (lines 168-200)
export interface DIContext {
  container: AwilixContainer; // awilix-modular container
  runtimeLayer?: Layer.Layer<never>; // Optional Effect Layer for dependency composition
}

// Router procedure context
interface Context extends DIContext {
  db: SupabaseClient;
  user?: { id: string; role: string };
  // ... other context properties
}
```

#### Effect Return Type Standards

**Repository Interface**:

```typescript
interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
  findByEmail(email: string): Effect.Effect<User | null, DatabaseError, never>;
  create(user: User): Effect.Effect<User, DatabaseError, never>;
  update(user: User): Effect.Effect<User, DatabaseError, never>;
  delete(id: UserId): Effect.Effect<void, DatabaseError, never>;
}
```

**Use Case Interface**:

```typescript
interface CreateUserUseCase {
  execute(input: CreateUserInput): Effect.Effect<UserDTO, UserError, never>;
}

// Error types
class UserError extends Data.TaggedError("UserError")<{
  message: string;
  code: "ALREADY_EXISTS" | "VALIDATION_FAILED" | "NOT_FOUND";
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}
```

**Controller Response Types** (maintain existing tRPC contracts):

```typescript
// Controllers remain compatible with existing router expectations
type UserResponse = {
  id: string;
  email: string;
  createdAt: Date;
  // ... other fields
};
```

### Expected Changes

#### Files to Create (New Infrastructure)

1. **Error Type Definitions**:
   - `packages/domain/src/errors/DomainErrors.ts` - Base error classes using Data.TaggedError
   - `packages/use-cases/src/errors/UseCaseErrors.ts` - Use case specific errors
   - `packages/adapters/src/errors/AdapterErrors.ts` - Database and external service errors

2. **Effect Layer Definitions** (for full Effect DI integration):
   - `packages/adapters/src/layers/RepositoryLayer.ts` - Layer for repository implementations
   - `packages/use-cases/src/layers/UseCaseLayer.ts` - Layer for use case composition
   - `packages/frameworks/src/layers/RuntimeLayer.ts` - Application runtime composition

3. **Test Utilities**:
   - `packages/frameworks/src/testing/EffectTestHarness.ts` - Utilities for testing Effect-based code
   - `packages/frameworks/src/testing/MockLayers.ts` - Pre-built mock layers for common services

#### Files to Modify (Migration Targets)

**Phase 1 - Foundation (Week 1)**:

- `packages/frameworks/src/di/AppModule.ts` - Replace UseCaseModulePlaceholder with actual UseCaseModule

**Phase 2 - Router Migration (Weeks 2-3, 17 files)**:
Priority order by usage:

1. `packages/adapters/src/api/routers/challengeVote.ts` - High traffic
2. `packages/adapters/src/api/routers/challengeSubmission.ts` - High traffic
3. `packages/adapters/src/api/routers/activityFeed.ts` - Medium traffic
4. `packages/adapters/src/api/routers/reward.ts` - Medium traffic
5. `packages/adapters/src/api/routers/location.ts` - Medium traffic
6. `packages/adapters/src/api/routers/notificationSchedule.ts` - Admin usage
7. `packages/adapters/src/api/routers/notificationDelivery.ts` - Admin usage
8. `packages/adapters/src/api/routers/coinTransaction.ts` - Admin usage
9. `packages/adapters/src/api/routers/sponsor.ts` - Admin usage
10. `packages/adapters/src/api/routers/submissionReport.ts` - Moderator usage
11. `packages/adapters/src/api/routers/notifications.ts` - System usage
12. `packages/adapters/src/api/routers/coin.ts` - System usage
13. `packages/adapters/src/api/routers/storage.ts` - File operations
14. `packages/adapters/src/api/routers/group.ts` - Group management
15. `packages/adapters/src/api/routers/trip.ts` - Trip management
16. `packages/adapters/src/api/routers/notificationSender.ts` - Background jobs

**Phase 3 - Controller Index (Week 3-4, 1 file)**:

- `packages/adapters/src/api/controllers/index.ts` (4,311 lines) - Migrate by controller:
  - StorageController (lines 98-169)
  - GroupController procedures
  - NotificationController procedures
  - ActivityFeedController procedures
  - ChallengeSubmissionController procedures
  - ChallengeVoteController procedures
  - Remaining controllers

**Phase 4 - Effect Integration (Weeks 5-6, ~10 priority files)**:
Priority use cases (complex async flows):

1. `packages/use-cases/src/interactors/PurchaseReward.ts` - Complex transaction
2. `packages/use-cases/src/interactors/SubmitVotes.ts` - Batch operations
3. `packages/use-cases/src/interactors/ForceEndVoting.ts` - Multi-step workflow
4. `packages/use-cases/src/interactors/AddCoins.ts` - Financial operations
5. `packages/use-cases/src/interactors/RemoveCoins.ts` - Financial operations
6. `packages/use-cases/src/interactors/CreateSubmission.ts` - Side effects (activity feed)
7. `packages/use-cases/src/interactors/GetCoinStatistics.ts` - Aggregation queries

All 16 repository implementations (add Effect wrappers):

- `packages/adapters/src/gateways/PrismaUserRepository.ts`
- `packages/adapters/src/gateways/PrismaTripRepository.ts`
- ... (all 16 repositories)

**Phase 5 - Test Migration (Weeks 6-8, 20+ files)**:

- `packages/use-cases/src/interactors/__tests__/CreateUser.test.ts`
- `packages/use-cases/src/interactors/__tests__/GetUser.test.ts`
- `packages/use-cases/src/interactors/__tests__/UpdateUser.test.ts`
- `packages/use-cases/src/interactors/__tests__/GetChallenge.test.ts`
- `packages/use-cases/src/interactors/__tests__/CreateChallenge.test.ts`
- `packages/use-cases/src/interactors/__tests__/UpdateChallenge.test.ts`
- `packages/use-cases/src/interactors/__tests__/UpdateChallengeStatus.test.ts`
- `packages/use-cases/src/interactors/__tests__/CreateReward.test.ts`
- `packages/use-cases/src/interactors/__tests__/PurchaseReward.test.ts`
- `packages/use-cases/src/interactors/__tests__/AddCoins.test.ts`
- `packages/use-cases/src/interactors/__tests__/RemoveCoins.test.ts`
- `packages/use-cases/src/interactors/__tests__/GetCoinStatistics.test.ts`
- `packages/use-cases/src/interactors/__tests__/GetNotification.test.ts`
- `packages/use-cases/src/interactors/__tests__/GetDeliveries.test.ts`

Module tests:

- `packages/use-cases/src/modules/__tests__/UseCaseModule.test.ts`
- `packages/adapters/src/modules/__tests__/ControllerModule.test.ts`
- `packages/frameworks/src/di/__tests__/AppModule.test.ts`

**Documentation Updates**:

- `AGENTS.md` - Update DI and Effect patterns
- `CLAUDE.md` - Add Effect.ts best practices section

### Integration Points

#### tRPC Integration

```typescript
// Router resolving from DI context
export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      // Resolve controller from container
      const controller = ctx.container.resolve<CreateUserController>(
        CONTROLLER_TOKENS.CreateUserController,
      );

      // Controller handles Effect execution and error conversion
      return controller.create(input);
    }),
});
```

#### Module Integration (awilix-modular)

```typescript
// AppModule composition
export const AppModule = createStaticModule({
  name: "AppModule",
  imports: [
    RepositoryModule, // 16 repositories
    ControllerModule, // 17 controllers
    UseCaseModule, // 75 use cases (was placeholder)
  ],
  exports: [
    // Exported services for external consumption
  ],
});
```

#### Effect Layer Integration (for advanced use cases)

```typescript
// Optional: Layer composition for Effect-native workflows
const RepositoryLive = Layer.effect(
  RepositoryService,
  Effect.gen(function* () {
    const prisma = yield* PrismaClientTag;
    return {
      user: createUserRepository(prisma),
      trip: createTripRepository(prisma),
      // ... 16 repositories
    };
  }),
);

const AppLayer = RepositoryLive.pipe(
  Layer.provide(PrismaClientLive),
  Layer.provide(LoggerLive),
);
```

#### Test Integration

```typescript
// Container-based mocking for tests
describe("CreateUserUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      userRepository: asClass(MockUserRepository).singleton(),
    });
  });

  it("should create user", async () => {
    const useCase = container.resolve(CreateUserUseCase);
    const result = await Effect.runPromise(
      useCase.execute({ email: "test@example.com" }),
    );
    expect(result.email).toBe("test@example.com");
  });
});
```

---

## Implementation Process

### Overview

This migration follows a **phased approach** prioritizing infrastructure first, then incrementally adopting DI and Effect patterns. Each phase has strict success criteria and quality gates to ensure the migration doesn't introduce regressions.

**Migration Strategy:**

1. **Phase 1** - Create foundation: Effect error types, Layer definitions, AppModule integration
2. **Phase 2** - Router migration: 17 tRPC routers convert to DI-based resolution
3. **Phase 3** - Controller migration: Register all 17 controllers in ControllerModule
4. **Phase 4** - Effect integration: Repositories and use cases migrate to Effect
5. **Phase 5** - Test migration: Update 14+ test files for Effect patterns
6. **Phase 6** - Documentation: Update AGENTS.md, CLAUDE.md, and create training materials

---

### Phase 1: Infrastructure Setup (Week 1)

**Goal:** Establish the Effect and DI foundation that all subsequent phases depend on.

**Output:** Core infrastructure files and AppModule integration.

**Success Criteria:**

- [ ] All Effect error types defined and exported
- [ ] RepositoryLayer and UseCaseLayer created
- [ ] AppModule imports UseCaseModule (replacing placeholder)
- [ ] Zero breaking changes to existing code

#### Step 1.1: Create Effect Error Type Definitions

**Agent type:** sonnet
**Execution mode:** Sequential
**Blocked by:** None (foundation step)
**Parallel with:** None
**Effort:** Medium (3-4 hours)

**Description:**
Define typed error hierarchies using Effect's `Data.TaggedError` pattern. Replace string-based errors in use cases with proper error classes.

**Subtasks:**

- [ ] Create `packages/domain/src/errors/DomainErrors.ts` - Base error classes (EntityNotFoundError, ValidationError, UnauthorizedError)
- [ ] Create `packages/use-cases/src/errors/UseCaseErrors.ts` - Use case specific errors (UserAlreadyExistsError, InsufficientCoinsError, ChallengeClosedError)
- [ ] Create `packages/adapters/src/errors/AdapterErrors.ts` - External service errors (DatabaseError, ExternalAPIError)
- [ ] Create `packages/domain/src/errors/index.ts` - Barrel export
- [ ] Create `packages/use-cases/src/errors/index.ts` - Barrel export
- [ ] Create `packages/adapters/src/errors/index.ts` - Barrel export
- [ ] Update `packages/domain/package.json` exports if needed

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Error naming conflicts with existing classes | Prefix with domain name (e.g., `DomainValidationError`) |
| Circular dependency between error types | Keep errors in domain, avoid importing from use-cases |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Error type explosion | Medium | Medium | Start with common errors, add specific ones during Phase 4 |
| Breaking existing error handling | Low | High | Keep string errors in parallel, migrate gradually in Phase 4 |

**Success Criteria:**

- [ ] All error classes extend `Data.TaggedError`
- [ ] Error types have proper `code` discriminator field
- [ ] Barrel exports created and tested
- [ ] Import `grep "from.*errors" packages/domain/src/` returns expected paths

#### Verification

**Level:** HIGH (Panel of 2 judges)
**Threshold:** 4.0/5.0
**Judge Type:** opus

| Criterion                      | Weight | Description                                                                  | Scale                                                      |
| ------------------------------ | ------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| TaggedError Pattern Compliance | 0.30   | All errors properly extend Data.TaggedError with correct type parameters     | 1=Incomplete, 3=Basic, 5=Full pattern with type inference  |
| Error Hierarchy Completeness   | 0.25   | All required error classes defined across Domain, UseCase, Adapter layers    | 1=Missing categories, 3=Basic, 5=Complete with sub-types   |
| Naming Convention Consistency  | 0.25   | Follows `{Domain}{ErrorType}Error` pattern consistently across all files     | 1=Inconsistent, 3=Mostly consistent, 5=Perfect consistency |
| Barrel Export Correctness      | 0.20   | All error types properly exported via index.ts with no circular dependencies | 1=Missing, 3=Basic, 5=Complete with proper organization    |

**Total Weight:** 1.00

---

#### Step 1.2: Create Effect Layer Definitions

**Agent type:** sonnet
**Execution mode:** Sequential
**Blocked by:** Step 1.1 (error types defined)
**Parallel with:** None
**Effort:** Medium (4-5 hours)

**Description:**
Create Layer definitions for Effect-based dependency injection. These layers will eventually replace direct DI container access for Effect-native workflows.

**Subtasks:**

- [ ] Create `packages/adapters/src/layers/RepositoryLayer.ts` - Layer providing repository service tag
- [ ] Create `packages/use-cases/src/layers/UseCaseLayer.ts` - Layer composing use cases with repository dependencies
- [ ] Create `packages/frameworks/src/layers/RuntimeLayer.ts` - Application runtime composition (prisma, logger, repositories)
- [ ] Create `packages/frameworks/src/layers/index.ts` - Barrel export
- [ ] Define `RepositoryService` tag interface in RepositoryLayer.ts
- [ ] Define `UseCaseService` tag interface in UseCaseLayer.ts
- [ ] Create layer composition utilities in RuntimeLayer.ts

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Layer conflicts with awilix-modular | Keep both patterns, document when to use each |
| Prisma client typing in Layer | Use existing PrismaClient type from `@mirai-app/db` |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Over-engineering with dual DI | Medium | Medium | Document clear guidelines: awilix for routers, Effect for use cases |
| Layer composition complexity | Medium | Low | Start with simple layers, add composition in Phase 4 |

**Success Criteria:**

- [ ] RepositoryLayer exposes tag for repository access
- [ ] UseCaseLayer composes with RepositoryLayer
- [ ] RuntimeLayer provides full application context
- [ ] Layer tests pass: `bun test packages/frameworks/src/layers/`

#### Verification

**Level:** HIGH (Panel of 2 judges)
**Threshold:** 4.0/5.0
**Judge Type:** opus

| Criterion                     | Weight | Description                                                                | Scale                                                               |
| ----------------------------- | ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Layer Composition Correctness | 0.30   | Layers correctly compose using Layer.provide and Layer.effect              | 1=Broken, 3=Basic, 5=Properly nested composable layers              |
| Type Inference Quality        | 0.30   | Full TypeScript type inference for Layer.Effect contexts and service tags  | 1=Manual types, 3=Partial, 5=Complete automatic inference           |
| Service Tag Definition        | 0.25   | Proper Context.Tag definitions for RepositoryService, UseCaseService, etc. | 1=Missing, 3=Basic, 5=Properly typed service tags                   |
| Testability Support           | 0.15   | Layers can be easily mocked/replaced for testing purposes                  | 1=Hard to mock, 3=Mockable, 5=Easily mockable with clear interfaces |

**Total Weight:** 1.00

---

#### Step 1.3: Update AppModule for Effect Integration

**Agent type:** sonnet
**Execution mode:** Sequential
**Blocked by:** Step 1.2 (layers created)
**Parallel with:** None
**Quality Gate:** Phase 1 Foundation Complete
**Effort:** Small (2-3 hours)

**Description:**
Replace UseCaseModulePlaceholder with actual UseCaseModule in AppModule. This is the critical integration point that enables DI resolution for all use cases.

**Subtasks:**

- [ ] Open `packages/frameworks/src/di/AppModule.ts`
- [ ] Replace `UseCaseModulePlaceholder` import with `UseCaseModule`
- [ ] Update `imports` array to include `UseCaseModule`
- [ ] Verify all exports remain compatible
- [ ] Run `bun run build` in frameworks package
- [ ] Run container tests: `bun test packages/frameworks/src/di/`

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| UseCaseModule not yet implemented | This step is placeholder-aware; module structure will be validated |
| Circular dependencies between modules | Run dependency-cruiser to verify: `bunx dependency-cruiser --validate .dependency-cruiser.cjs .` |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing router resolution | Medium | High | Verify all existing container.resolve() calls still work |
| Module import cycle | Low | High | Check with dependency-cruiser before and after |

**Success Criteria:**

- [ ] AppModule.ts imports UseCaseModule (not placeholder)
- [ ] `bun run build` passes in packages/frameworks
- [ ] All existing DI tests pass
- [ ] No new dependency-cruiser violations

#### Verification

**Level:** HIGH (Panel of 2 judges)
**Threshold:** 4.5/5.0
**Judge Type:** opus

| Criterion                      | Weight | Description                                                                            | Scale                                                                |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Module Integration Correctness | 0.35   | UseCaseModule correctly imported, replacing placeholder without breaking existing code | 1=Broken, 3=Basic integration, 5=Seamless with zero breaking changes |
| Build Success                  | 0.25   | Zero TypeScript compilation errors in frameworks package after integration             | 1=Multiple errors, 3=Some warnings, 5=Zero errors or warnings        |
| Test Pass Rate                 | 0.25   | 100% of existing DI container tests passing after integration                          | 1=<80%, 3=80-95%, 5=100% passing                                     |
| Dependency Graph Integrity     | 0.15   | No new dependency-cruiser violations introduced                                        | 1=New violations, 3=Same violations, 5=No violations, clean graph    |

**Total Weight:** 1.00

---

### Phase 2: Router DI Migration (Weeks 2-3)

**Goal:** Convert all 17 tRPC routers to resolve controllers from DI container instead of direct instantiation.

**Output:** All routers using `ctx.container.resolve()` pattern.

**Success Criteria:**

- [ ] All 17 routers resolve controllers from container
- [ ] Zero direct controller instantiations in routers
- [ ] All router tests pass
- [ ] No breaking API changes

#### Step 2.1: High-Traffic Routers - challengeVote, challengeSubmission

**Agent type:** sonnet
**Execution mode:** Parallel
**Parallel agents:** 2 (one per router)
**Blocked by:** Phase 1 complete (AppModule integrated)
**Parallel with:** Step 2.1 (both routers can run simultaneously - no shared state)
**Coordination notes:** Each router migration is independent. Both agents must follow the same DI resolution pattern from Phase 1.
**Effort:** Medium (4-5 hours each, 8-10 hours total with parallelization)

**Description:**
Migrate the highest-traffic routers first. These handle voting and submission operations - critical user flows that need thorough testing.

**Subtasks - challengeVote.ts:**

- [ ] Open `packages/adapters/src/api/routers/challengeVote.ts`
- [ ] Identify all direct controller usages (currently instantiating controllers inline)
- [ ] Replace with `ctx.container.resolve(CONTROLLER_TOKENS.ChallengeVoteController)`
- [ ] Update all procedure handlers to use resolved controller
- [ ] Add error handling for controller resolution failures
- [ ] Run router-specific tests: `bun test packages/adapters/src/api/routers/__tests__/challengeVote.test.ts`
- [ ] Verify no direct imports from controller files

**Subtasks - challengeSubmission.ts:**

- [ ] Open `packages/adapters/src/api/routers/challengeSubmission.ts`
- [ ] Identify all direct controller usages
- [ ] Replace with `ctx.container.resolve(CONTROLLER_TOKENS.ChallengeSubmissionController)`
- [ ] Update CreateSubmission procedure to use DI
- [ ] Update GetSubmissions procedure to use DI
- [ ] Run router-specific tests

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Controllers not yet in ControllerModule | Temporarily register controllers inline, mark with TODO for Phase 3 |
| Token naming inconsistencies | Follow existing CONTROLLER_TOKENS pattern from ControllerModule |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Controller resolution failures at runtime | Low | High | Add error handling and fallback logging |
| Performance degradation | Low | Medium | Benchmark before/after; container resolution is fast |

**Success Criteria:**

- [ ] challengeVote.ts has zero direct controller imports
- [ ] challengeSubmission.ts has zero direct controller imports
- [ ] Both routers use `ctx.container.resolve()` exclusively
- [ ] All existing tests pass
- [ ] Manual smoke test: vote and submission operations work

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion                 | Weight | Description                                                                      | Scale                                                                |
| ------------------------- | ------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| DI Pattern Compliance     | 0.30   | All controllers resolved via ctx.container.resolve(), zero direct instantiation  | 1=Direct instantiation, 3=Mixed patterns, 5=Complete DI compliance   |
| Error Handling Quality    | 0.25   | Proper TRPCError thrown on controller resolution failures with appropriate codes | 1=No handling, 3=Basic handling, 5=Comprehensive with proper codes   |
| API Contract Stability    | 0.25   | All input/output schemas unchanged, no breaking changes to procedures            | 1=Breaking changes, 3=Minor changes, 5=Perfect contract preservation |
| Test Coverage Maintenance | 0.20   | All existing tests pass, no coverage regression in router tests                  | 1=<70%, 3=70-90%, 5=100% tests passing                               |

**Total Weight:** 1.00

---

#### Step 2.2: Medium-Traffic Routers - activityFeed, reward, location

**Agent type:** sonnet
**Execution mode:** Parallel
**Parallel agents:** 3 (one per router)
**Blocked by:** Step 2.1 (high-traffic patterns established)
**Parallel with:** Step 2.2 (all 3 routers independent - activityFeed, reward, location have no shared dependencies)
**Coordination notes:** All three routers can migrate simultaneously. Use Step 2.1 as reference pattern. Share findings if any router reveals edge cases.
**Effort:** Small-Medium (3 hours each, 9 hours sequential / 3 hours with parallelization)

**Description:**
Migrate medium-traffic routers. These are important but slightly less critical than voting/submission flows.

**Subtasks:**

- [ ] Migrate `activityFeed.ts` - activity feed operations
- [ ] Migrate `reward.ts` - reward management (admin operations)
- [ ] Migrate `location.ts` - location tracking and queries
- [ ] Each router follows pattern from Step 2.1
- [ ] Run tests for each router after migration

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Shared controller dependencies | Ensure ControllerModule properly exports all dependencies |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Inconsistent patterns across routers | Medium | Low | Use Step 2.1 as reference implementation |

**Success Criteria:**

- [ ] All 3 routers use DI resolution
- [ ] Zero direct controller instantiations
- [ ] All router tests pass

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion           | Weight | Description                                                       | Scale                                                                    |
| ------------------- | ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Pattern Consistency | 0.40   | Follows high-traffic router patterns exactly, consistent DI usage | 1=Different patterns, 3=Mostly consistent, 5=Perfect pattern consistency |
| Test Pass Rate      | 0.35   | 100% of router tests passing after migration                      | 1=<80%, 3=80-95%, 5=100% passing                                         |
| Code Quality        | 0.25   | No lint warnings, proper TypeScript types throughout              | 1=Multiple warnings, 3=Some warnings, 5=Zero warnings, perfect types     |

**Total Weight:** 1.00

---

#### Step 2.3: Admin/System Routers - notificationSchedule, notificationDelivery, coinTransaction, sponsor

**Agent type:** haiku
**Execution mode:** Parallel
**Parallel agents:** 4 (one per router)
**Blocked by:** Steps 2.1-2.2 (patterns established)
**Parallel with:** Step 2.3 (all 4 routers independent - admin operations don't overlap)
**Coordination notes:** Simpler routers suitable for haiku agents. If any controller dependencies are missing, temporarily register inline with TODO for Phase 3.
**Effort:** Small (2-3 hours each, 8-12 hours sequential / 3 hours with parallelization)

**Description:**
Migrate admin and system-facing routers. These have lower traffic but still require proper DI for consistency.

**Subtasks:**

- [ ] Migrate `notificationSchedule.ts` - notification scheduling
- [ ] Migrate `notificationDelivery.ts` - delivery tracking
- [ ] Migrate `coinTransaction.ts` - coin transaction admin
- [ ] Migrate `sponsor.ts` - sponsor management
- [ ] Each follows established DI pattern
- [ ] Run tests after each migration

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Less test coverage | Add basic integration tests if missing |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Admin-only edge cases missed | Medium | Medium | Test with admin user context |

**Success Criteria:**

- [ ] All 4 routers migrated to DI
- [ ] Admin procedures properly resolve controllers
- [ ] All tests pass

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion              | Weight | Description                                                                                                          | Scale                                                     |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Migration Completeness | 0.50   | All 4 routers (notificationSchedule, notificationDelivery, coinTransaction, sponsor) fully migrated to DI resolution | 1=Partial, 3=Mostly migrated, 5=All 4 completely migrated |
| Test Pass Rate         | 0.50   | 100% of tests passing across all 4 routers                                                                           | 1=<80%, 3=80-95%, 5=100% passing                          |

**Total Weight:** 1.00

---

#### Step 2.4: Remaining Routers - submissionReport, notifications, coin, storage, group, trip, notificationSender

**Agent type:** haiku
**Execution mode:** Parallel
**Parallel agents:** 7 (one per router) - **MAXIMUM PARALLELIZATION DEPTH**
**Blocked by:** Steps 2.1-2.3 (patterns mature)
**Parallel with:** Step 2.4 (all 7 routers independent - simple CRUD patterns)
**Coordination notes:** Maximum parallelization batch. notificationSender may need custom handling (background job triggers). Each agent works on one router file.
**Quality Gate:** Phase 2 Router Migration Complete
**Effort:** Small (1.5-2 hours each, 12-14 hours sequential / 2 hours with parallelization)

**Description:**
Migrate remaining routers. These have simpler patterns and lower risk.

**Subtasks:**

- [ ] Migrate `submissionReport.ts` - report management
- [ ] Migrate `notifications.ts` - notification queries
- [ ] Migrate `coin.ts` - coin balance operations
- [ ] Migrate `storage.ts` - file storage operations
- [ ] Migrate `group.ts` - group management
- [ ] Migrate `trip.ts` - trip management
- [ ] Migrate `notificationSender.ts` - background job triggers
- [ ] Run all remaining router tests

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| notificationSender has different pattern | Analyze separately, may need custom handling |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bulk migration errors | Low | Medium | Review each router individually despite parallel execution |

**Success Criteria:**

- [ ] All 7 routers migrated
- [ ] 100% of router procedures use DI
- [ ] All tests pass

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion        | Weight | Description                                                                                                               | Scale                                                     |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Batch Completion | 0.60   | All 7 routers (submissionReport, notifications, coin, storage, group, trip, notificationSender) migrated to DI resolution | 1=Partial, 3=Mostly migrated, 5=All 7 completely migrated |
| Test Pass Rate   | 0.40   | 100% of tests passing across all 7 routers                                                                                | 1=<80%, 3=80-95%, 5=100% passing                          |

**Total Weight:** 1.00

---

### Phase 3: Controller DI Migration (Week 4)

**Goal:** Register all 17 controllers in ControllerModule and migrate controller index.ts in chunks.

**Output:** ControllerModule with all 17 controllers, index.ts using DI.

**Success Criteria:**

- [ ] All 17 controllers registered in ControllerModule
- [ ] Controller index.ts migrated
- [ ] Zero breaking changes to controller APIs
- [ ] All controller tests pass

#### Step 3.1: Update ControllerModule with All Controllers

**Agent type:** sonnet
**Execution mode:** Sequential (one comprehensive update)
**Blocked by:** Phase 2 (routers expect controllers)
**Parallel with:** None
**Effort:** Medium-Large (6-8 hours)

**Description:**
Register all 17 controllers in ControllerModule with proper SCOPED lifetime. This is the central registry for controller DI. Must be completed before controller index.ts chunks can be migrated in parallel.

**Subtasks:**

- [ ] Open `packages/adapters/src/modules/ControllerModule.ts`
- [ ] Add tokens for all 17 controllers:
  - UserController
  - TripController
  - ChallengeController
  - GroupController
  - LocationController
  - NotificationController
  - NotificationScheduleController
  - NotificationDeliveryController
  - ChallengeSubmissionController
  - ChallengeVoteController
  - ActivityFeedController
  - RewardController
  - CoinController
  - CoinTransactionController
  - SponsorController
  - SubmissionReportController
  - StorageController
- [ ] Register each controller with SCOPED lifetime
- [ ] Ensure proper imports array (needs RepositoryModule, UseCaseModule)
- [ ] Export all controller tokens
- [ ] Verify no circular dependencies
- [ ] Run `bunx dependency-cruiser --validate .dependency-cruiser.cjs .`

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Controller file paths vary | Use glob to find: `ls packages/adapters/src/controllers/*-controller.ts` |
| Controller dependencies unclear | Each controller constructor must be analyzed |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing controller registration | Medium | High | Create checklist of all 17, verify each |
| Dependency injection failures | Low | High | Run container tests after registration |

**Success Criteria:**

- [ ] ControllerModule.ts has 17 provider registrations
- [ ] All 17 tokens exported
- [ ] dependency-cruiser passes
- [ ] Container tests pass

#### Verification

**Level:** HIGH (Panel of 2 judges)
**Threshold:** 4.5/5.0
**Judge Type:** opus

| Criterion                 | Weight | Description                                                         | Scale                                                           |
| ------------------------- | ------ | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| Registration Completeness | 0.35   | All 17 controllers registered with correct tokens in providers      | 1=Missing, 3=Mostly registered, 5=All 17 correctly registered   |
| Lifetime Configuration    | 0.25   | All controllers use appropriate Lifetime (SCOPED for request-bound) | 1=Wrong lifetimes, 3=Mostly correct, 5=All correctly configured |
| Dependency Graph Validity | 0.20   | No circular dependencies, passes dependency-cruiser validation      | 1=Circular deps, 3=Some issues, 5=Clean dependency graph        |
| Export Completeness       | 0.20   | All 17 tokens properly exported in exports array                    | 1=Missing, 3=Mostly exported, 5=All 17 tokens exported          |

**Total Weight:** 1.00

---

#### Step 3.2: Migrate Controller Index.ts - Storage, Group, Trip (Chunk 1)

**Agent type:** sonnet
**Execution mode:** Parallel (after Step 3.1, all chunks can run simultaneously)
**Blocked by:** Step 3.1 (controllers registered in ControllerModule)
**Parallel with:** Steps 3.3, 3.4, 3.5 (all index.ts chunks are independent)
**Coordination notes:** Each chunk works on different line ranges of index.ts. No merge conflicts if agents work on separate controllers. Ensure index.ts remains functional after each chunk.
**Effort:** Medium (4-5 hours)

**Subtasks:**

- [ ] Open `packages/adapters/src/controllers/index.ts`
- [ ] Locate StorageController procedures (lines 98-169)
- [ ] Refactor to use DI resolution instead of direct instantiation
- [ ] Locate GroupController procedures
- [ ] Refactor GroupController for DI
- [ ] Locate TripController procedures
- [ ] Refactor TripController for DI
- [ ] Ensure all 3 controllers resolve from container
- [ ] Run chunk 1 tests

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Index.ts size (4311 lines) | Work in chunks, avoid single massive PR |
| Inter-controller dependencies | Document dependencies, resolve in order |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Index.ts merge conflicts | High | Medium | Coordinate with team, migrate during low-activity period |
| Partial migration state | Medium | Low | Each chunk must leave index.ts in working state |

**Success Criteria:**

- [ ] StorageController uses DI
- [ ] GroupController uses DI
- [ ] TripController uses DI
- [ ] Chunk 1 tests pass
- [ ] Index.ts still functional

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion            | Weight | Description                                                       | Scale                                                |
| -------------------- | ------ | ----------------------------------------------------------------- | ---------------------------------------------------- |
| DI Migration Quality | 0.40   | All 3 controllers (Storage, Group, Trip) use container resolution | 1=Partial, 3=Mostly migrated, 5=All 3 fully migrated |
| Test Pass Rate       | 0.35   | All chunk 1 controller tests passing                              | 1=<80%, 3=80-95%, 5=100% passing                     |
| No Regressions       | 0.25   | Index.ts remains functional, no broken imports or exports         | 1=Broken, 3=Minor issues, 5=Fully functional         |

**Total Weight:** 1.00

---

#### Step 3.3: Migrate Controller Index.ts - Notification Controllers (Chunk 2)

**Agent type:** sonnet
**Execution mode:** Parallel (runs concurrently with other chunks)
**Blocked by:** Step 3.1 (controllers registered)
**Parallel with:** Steps 3.2, 3.4, 3.5 (all index.ts chunks independent)
**Coordination notes:** Notification controllers (NotificationController, NotificationScheduleController, NotificationDeliveryController) have no shared state with other chunks.
**Effort:** Medium (4-5 hours)

**Description:**
Migrate notification-related controllers in index.ts.

**Subtasks:**

- [ ] Refactor NotificationController for DI
- [ ] Refactor NotificationScheduleController for DI
- [ ] Refactor NotificationDeliveryController for DI
- [ ] Update all notification procedures
- [ ] Run notification controller tests

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Notification services may have side effects | Document and test thoroughly |

**Success Criteria:**

- [ ] All 3 notification controllers use DI
- [ ] Notification tests pass

**Verification:**

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion              | Weight | Description                |
| ---------------------- | ------ | -------------------------- |
| Migration Completeness | 0.50   | All 3 controllers migrated |
| Test Pass Rate         | 0.50   | All tests passing          |

---

#### Step 3.4: Migrate Controller Index.ts - Challenge Controllers (Chunk 3)

**Agent type:** sonnet
**Execution mode:** Parallel (runs concurrently with other chunks)
**Blocked by:** Step 3.1 (controllers registered)
**Parallel with:** Steps 3.2, 3.3, 3.5 (all index.ts chunks independent)
**Coordination notes:** Challenge controllers (ChallengeController, ChallengeSubmissionController, ChallengeVoteController) work with different entities than other chunks.
**Effort:** Medium (4-5 hours)

**Description:**
Migrate challenge-related controllers in index.ts.

**Subtasks:**

- [ ] Refactor ChallengeController for DI
- [ ] Refactor ChallengeSubmissionController for DI
- [ ] Refactor ChallengeVoteController for DI
- [ ] Update all challenge-related procedures
- [ ] Run challenge controller tests

**Success Criteria:**

- [ ] All 3 challenge controllers use DI
- [ ] Challenge tests pass

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion              | Weight | Description                                                        | Scale                                                |
| ---------------------- | ------ | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Migration Completeness | 0.50   | All 3 challenge controllers (Challenge, Submission, Vote) migrated | 1=Partial, 3=Mostly migrated, 5=All 3 fully migrated |
| Test Pass Rate         | 0.50   | All challenge controller tests passing                             | 1=<80%, 3=80-95%, 5=100% passing                     |

**Total Weight:** 1.00

---

#### Step 3.5: Migrate Controller Index.ts - Remaining Controllers (Chunk 4)

**Agent type:** sonnet
**Execution mode:** Parallel (runs concurrently with other chunks)
**Blocked by:** Step 3.1 (controllers registered)
**Parallel with:** Steps 3.2, 3.3, 3.4 (all index.ts chunks independent)
**Coordination notes:** Remaining 6 controllers (ActivityFeed, Reward, Coin, CoinTransaction, Sponsor, SubmissionReport) have no inter-dependencies.
**Quality Gate:** Phase 3 Controller Migration Complete
**Effort:** Medium (4-5 hours)

**Description:**
Migrate remaining controllers: ActivityFeed, Reward, Coin, CoinTransaction, Sponsor, SubmissionReport.

**Subtasks:**

- [ ] Refactor ActivityFeedController for DI
- [ ] Refactor RewardController for DI
- [ ] Refactor CoinController for DI
- [ ] Refactor CoinTransactionController for DI
- [ ] Refactor SponsorController for DI
- [ ] Refactor SubmissionReportController for DI
- [ ] Run all remaining controller tests

**Success Criteria:**

- [ ] All 6 controllers use DI
- [ ] All remaining tests pass
- [ ] Full index.ts migrated

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion              | Weight | Description                                                                                                   | Scale                                                |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Migration Completeness | 0.50   | All 6 remaining controllers (ActivityFeed, Reward, Coin, CoinTransaction, Sponsor, SubmissionReport) migrated | 1=Partial, 3=Mostly migrated, 5=All 6 fully migrated |
| Test Pass Rate         | 0.50   | All remaining controller tests passing                                                                        | 1=<80%, 3=80-95%, 5=100% passing                     |

**Total Weight:** 1.00

---

### Phase 4: Effect Migration - Repositories & Use Cases (Weeks 5-6)

**Goal:** Migrate all repositories to return Effects and convert 75 use cases to Effect patterns.

**Output:** Effect-based repositories and use cases with typed errors.

**Success Criteria:**

- [ ] All 16 repositories return Effect<never, Error, T>
- [ ] All 75 use cases return Effect<never, Error, T>
- [ ] Zero Result<T,E> usage in use cases
- [ ] All tests updated and passing

#### Step 4.1: Migrate High-Priority Use Cases (Complex Flows)

**Agent type:** opus
**Execution mode:** Parallel
**Parallel agents:** 4 (one per complex use case)
**Blocked by:** Phase 3 complete (all controllers must be DI-ready)
**Parallel with:** Step 4.1 (PurchaseReward, SubmitVotes, ForceEndVoting, AddCoins/RemoveCoins are independent)
**Coordination notes:** Each opus agent works on one complex use case. Repository Effect wrappers can be created as temporary stubs if not ready from Step 4.3. Complex financial operations (AddCoins, RemoveCoins, PurchaseReward) should coordinate to ensure consistent audit trail patterns.
**Effort:** Large (8-10 hours each, 32-40 hours sequential / 10 hours with parallelization)

**Description:**
Migrate the most complex use cases first. These have the most to gain from Effect's composition and error handling.

**Subtasks - PurchaseReward.ts:**

- [ ] Open `packages/use-cases/src/interactors/PurchaseReward.ts`
- [ ] Analyze multi-step transaction (validation → coin check → inventory → purchase)
- [ ] Convert from `async execute(): Promise<Result<T,E>>` to `execute(): Effect<never, E, T>`
- [ ] Wrap each step with Effect.gen
- [ ] Replace Result with Effect.fail/Effect.succeed
- [ ] Add proper error types (InsufficientCoinsError, OutOfStockError, etc.)
- [ ] Update PurchaseReward.test.ts

**Subtasks - SubmitVotes.ts:**

- [ ] Convert batch vote creation to Effect
- [ ] Use Effect.all for parallel vote creation
- [ ] Add validation error handling
- [ ] Update tests

**Subtasks - ForceEndVoting.ts:**

- [ ] Convert vote calculation workflow to Effect
- [ ] Use Effect.gen for sequential operations
- [ ] Add ranking update logic with Effect
- [ ] Update tests

**Subtasks - AddCoins.ts & RemoveCoins.ts:**

- [ ] Convert financial operations to Effect
- [ ] Add audit trail effects
- [ ] Ensure atomic operations
- [ ] Update tests

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Repository Effect wrappers not ready | Create temporary wrappers, finalize in Step 4.3 |
| Complex transaction boundaries | Document transaction scope, use Effect.scoped if needed |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Effect performance overhead | Low | Medium | Benchmark critical paths, Effect is optimized |
| Error type conversion bugs | Medium | High | Comprehensive test coverage for error paths |
| Breaking business logic | Low | Critical | Extensive testing, feature flags if needed |

**Success Criteria:**

- [ ] All 4 complex use cases return Effect
- [ ] All 4 use cases have typed errors (not string)
- [ ] All tests pass with Effect patterns
- [ ] No Result<T,E> imports remain in these files

#### Verification

**Level:** HIGH (Panel of 2 judges)
**Threshold:** 4.5/5.0
**Judge Type:** opus

| Criterion                   | Weight | Description                                                                       | Scale                                                       |
| --------------------------- | ------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Effect Pattern Quality      | 0.30   | Proper use of Effect.gen, Effect.flatMap, Effect.all, Effect.fail, Effect.succeed | 1=Improper, 3=Basic, 5=Advanced patterns with composition   |
| Error Type Safety           | 0.25   | All errors are typed (no string errors), proper error hierarchies used            | 1=String errors, 3=Some typed, 5=All properly typed         |
| Business Logic Preservation | 0.25   | All existing behavior maintained, no logic changes or regressions                 | 1=Logic changed, 3=Minor deviations, 5=Perfect preservation |
| Test Coverage Quality       | 0.20   | Tests updated and passing with Effect.runPromise patterns                         | 1=Tests failing, 3=Some passing, 5=All tests passing        |

**Total Weight:** 1.00

---

#### Step 4.2: Migrate Standard Use Cases (CRUD Operations)

**Agent type:** sonnet
**Execution mode:** Parallel batches
**Parallel agents:** 10 batches x 3-4 sonnet agents each = **30-40 parallel agents**
**Blocked by:** Step 4.1 (patterns established)
**Parallel with:** Step 4.2 batches (all use case batches independent - User, Challenge, Group, etc.)
**Coordination notes:**

- Batch 1: User operations (GetUser, CreateUser, UpdateUser, DeleteUser, GetUserProfile) - 1 agent
- Batch 2: Challenge operations - 1 agent
- Batch 3: Group operations - 1 agent
- Continue for all 75 use cases in batches of 5-10
- Each batch agent works on a domain group (no shared state between domains)
  **Effort:** Medium (4-5 hours per batch, ~20 batches = 80-100 hours sequential / 5 hours with full parallelization)

**Description:**
Migrate standard CRUD use cases. These follow simpler patterns and can be massively batched.

**Subtasks per batch:**

- [ ] Migrate batch of 10 use cases (e.g., GetUser, CreateUser, UpdateUser, etc.)
- [ ] Each: convert async to Effect, replace Result with Effect
- [ ] Update corresponding test files
- [ ] Run tests after each batch

**Batch organization:**

- Batch 1: User operations (GetUser, CreateUser, UpdateUser, DeleteUser, GetUserProfile)
- Batch 2: Challenge operations (GetChallenge, CreateChallenge, UpdateChallenge, DeleteChallenge, UpdateChallengeStatus)
- Batch 3: Group operations (GetGroup, CreateGroup, UpdateGroup, DeleteGroup, AddUserToGroup)
- ... (continue for all 75 use cases)

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Large volume of use cases | Parallel batch processing with multiple agents |
| Test file updates | Each batch includes corresponding test updates |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Inconsistent patterns across batches | Medium | Low | Use Step 4.1 as reference |
| Test maintenance burden | Medium | Medium | Batch tests with implementation |

**Success Criteria:**

- [ ] All 75 use cases migrated
- [ ] Zero Result<T,E> usage in use-cases package
- [ ] All tests pass

#### Verification

**Level:** MEDIUM (Single judge per batch)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion           | Weight | Description                                                         | Scale                                                      |
| ------------------- | ------ | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Batch Completion    | 0.40   | All use cases in batch migrated from async/Promise/Result to Effect | 1=Partial, 3=Mostly complete, 5=Complete batch             |
| Pattern Consistency | 0.30   | Follows complex use case patterns from Step 4.1 consistently        | 1=Inconsistent, 3=Mostly consistent, 5=Perfect consistency |
| Test Pass Rate      | 0.30   | All tests in batch passing with Effect patterns                     | 1=<80%, 3=80-95%, 5=100% passing                           |

**Total Weight:** 1.00

---

#### Step 4.3: Migrate All 16 Repositories to Effect

**Agent type:** sonnet
**Execution mode:** Parallel
**Parallel agents:** 4 (one per batch of 4 repositories)
**Blocked by:** Step 4.1 (use case patterns inform repository interface needs)
**Parallel with:** Step 4.3 (all 4 repository batches independent - User/Trip/Challenge/Group, Location/Notification/Submission/Vote, ActivityFeed/Sponsor/Report/Reward, Coin/NotificationDelivery/NotificationSchedule/RewardPurchase)
**Coordination notes:**

- Batch 1: User, Trip, Challenge, Group repositories
- Batch 2: Location, Notification, ChallengeSubmission, ChallengeVote repositories
- Batch 3: ActivityFeed, Sponsor, SubmissionReport, Reward repositories
- Batch 4: CoinTransaction, NotificationDelivery, NotificationSchedule, RewardPurchase repositories
- Each batch agent wraps all repository methods with Effect.tryPromise
- Update port interfaces after each batch
  **Quality Gate:** Phase 4 Effect Migration Complete
  **Effort:** Medium (3-4 hours per batch, 12-16 hours sequential / 4 hours with parallelization)

**Description:**
Add Effect wrappers to all 16 repository implementations. Repositories remain the same internally but expose Effect-based interfaces.

**Subtasks per repository:**

- [ ] Wrap `findById` with Effect.tryPromise
- [ ] Wrap `findByXxx` methods with Effect.tryPromise
- [ ] Wrap `create` with Effect.tryPromise
- [ ] Wrap `update` with Effect.tryPromise
- [ ] Wrap `delete` with Effect.tryPromise
- [ ] Update repository interface in ports/
- [ ] Update repository tests

**Repository batches:**

- Batch 1: User, Trip, Challenge, Group
- Batch 2: Location, Notification, ChallengeSubmission, ChallengeVote
- Batch 3: ActivityFeed, Sponsor, SubmissionReport, Reward
- Batch 4: CoinTransaction, NotificationDelivery, NotificationSchedule, RewardPurchase

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Prisma types in Effect | Use existing Prisma types, wrap in Effect.tryPromise |
| Repository interface changes | Update all port interfaces, verify implementations match |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking use case dependencies | Medium | High | Migrate repositories before use cases that depend on them |
| Performance impact of Effect.tryPromise | Low | Low | Effect.tryPromise is lightweight wrapper |

**Success Criteria:**

- [ ] All 16 repositories return Effect types
- [ ] All repository interfaces updated
- [ ] All repository tests pass
- [ ] No Promise returns from repositories

#### Verification

**Level:** MEDIUM (Single judge per batch)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion              | Weight | Description                                                              | Scale                                                      |
| ---------------------- | ------ | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Effect Wrapper Quality | 0.35   | Proper Effect.tryPromise with appropriate error mapping to DatabaseError | 1=Improper, 3=Basic, 5=Perfect wrapping with error mapping |
| Interface Consistency  | 0.35   | All methods return Effect<never, DatabaseError, T> consistently          | 1=Inconsistent, 3=Mostly consistent, 5=Perfect consistency |
| Test Pass Rate         | 0.30   | All repository tests passing with Effect-based mocks                     | 1=<80%, 3=80-95%, 5=100% passing                           |

**Total Weight:** 1.00

---

### Phase 5: Test Migration (Week 7)

**Goal:** Update all test files to work with Effect-based code and container-based testing.

**Output:** All 14+ test files updated for Effect and DI patterns.

**Success Criteria:**

- [ ] All use case tests use Effect.runPromise
- [ ] All repository tests work with Effect
- [ ] Container-based mocking works in tests
- [ ] 100% test pass rate

#### Step 5.1: Create Effect Test Utilities

**Agent type:** sonnet
**Execution mode:** Sequential (foundation)
**Blocked by:** Phase 4 (Effect patterns established)
**Parallel with:** None
**Effort:** Medium (4-5 hours)

**Description:**
Create reusable test utilities for Effect-based testing. Foundation step - must complete before test file updates can run in parallel.

**Subtasks:**

- [ ] Create `packages/frameworks/src/testing/EffectTestHarness.ts`
  - Utility to run effects in tests
  - Error extraction helpers
  - Mock layer composition
- [ ] Create `packages/frameworks/src/testing/MockLayers.ts`
  - Pre-built mock layers for common services
  - Repository mock layer
  - Logger mock layer
- [ ] Create `packages/frameworks/src/testing/index.ts` - Barrel export
- [ ] Add tests for test utilities themselves

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Effect test patterns not documented | Research Effect testing patterns, document findings |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Test utility complexity | Medium | Medium | Keep utilities simple, add complexity only as needed |

**Success Criteria:**

- [ ] EffectTestHarness.ts created with core utilities
- [ ] MockLayers.ts has common mock layers
- [ ] Utilities tested and documented

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion             | Weight | Description                                                                        | Scale                                                  |
| --------------------- | ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Utility Completeness  | 0.40   | Covers common Effect testing scenarios (runPromise, error extraction, mock layers) | 1=Incomplete, 3=Basic, 5=Comprehensive coverage        |
| Documentation Quality | 0.30   | JSDoc comments and usage examples provided                                         | 1=No docs, 3=Basic docs, 5=Comprehensive with examples |
| Self-Test Coverage    | 0.30   | Test utilities themselves have tests                                               | 1=No tests, 3=Some tests, 5=Comprehensive self-tests   |

**Total Weight:** 1.00

---

#### Step 5.2: Update Use Case Tests (Priority Use Cases)

**Agent type:** sonnet
**Execution mode:** Parallel
**Parallel agents:** 4 (one per priority test file)
**Blocked by:** Step 5.1 (utilities available)
**Parallel with:** Step 5.2 (PurchaseReward.test.ts, SubmitVotes.test.ts, ForceEndVoting.test.ts, AddCoins.test.ts/RemoveCoins.test.ts are independent)
**Coordination notes:** Each agent updates one priority test file. Mock repositories must be updated to return Effects (can reuse patterns from Step 4.3).
**Effort:** Medium (4-5 hours each, 16-20 hours sequential / 5 hours with parallelization)

**Description:**
Update tests for the high-priority use cases migrated in Step 4.1.

**Subtasks per test file:**

- [ ] Update `PurchaseReward.test.ts` - Use Effect.runPromise, update mocks
- [ ] Update `SubmitVotes.test.ts` - Effect patterns, batch operation tests
- [ ] Update `ForceEndVoting.test.ts` - Workflow testing with Effect
- [ ] Update `AddCoins.test.ts` & `RemoveCoins.test.ts` - Financial operation tests

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Mock repository compatibility | Update mock repositories to return Effects |

**Success Criteria:**

- [ ] All 4 priority use case tests updated
- [ ] All tests pass with Effect patterns

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion            | Weight | Description                                                            | Scale                                                  |
| -------------------- | ------ | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| Test Effectiveness   | 0.40   | Tests verify both success and error paths with proper assertions       | 1=Limited coverage, 3=Basic, 5=Comprehensive coverage  |
| Effect Pattern Usage | 0.35   | Proper use of Effect.runPromise, error extraction, mock Effect returns | 1=Improper, 3=Basic, 5=Perfect Effect testing patterns |
| Pass Rate            | 0.25   | All priority use case tests passing                                    | 1=<80%, 3=80-95%, 5=100% passing                       |

**Total Weight:** 1.00

---

#### Step 5.3: Update Remaining Use Case Tests

**Agent type:** haiku
**Execution mode:** Parallel batches
**Parallel agents:** 14+ batches (one per test file, can run simultaneously)
**Blocked by:** Step 5.2 (patterns established)
**Parallel with:** Step 5.3 (all test file updates independent - each file is self-contained)
**Coordination notes:**

- Batch test updates by domain (User tests, Challenge tests, Group tests, etc.)
- Each haiku agent handles 1-2 test files
- Convert Result-based assertions to Effect patterns (Effect.runPromise, error extraction)
- Update mock setups for container-based DI
  **Effort:** Small-Medium (2-3 hours per batch, 14+ batches = 28-42 hours sequential / 3 hours with parallelization)

**Description:**
Update remaining use case tests in batches.

**Subtasks:**

- [ ] Update all remaining use case tests (10+ batches)
- [ ] Convert Result-based assertions to Effect patterns
- [ ] Update mock setups for container-based DI
- [ ] Run full test suite after each batch

**Success Criteria:**

- [ ] All 14+ use case test files updated
- [ ] 100% test pass rate

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion        | Weight | Description                                    | Scale                                                |
| ---------------- | ------ | ---------------------------------------------- | ---------------------------------------------------- |
| Batch Completion | 0.50   | All tests in batch updated for Effect patterns | 1=Partial, 3=Mostly updated, 5=Complete batch update |
| Pass Rate        | 0.50   | All tests in batch passing                     | 1=<80%, 3=80-95%, 5=100% passing                     |

**Total Weight:** 1.00

---

#### Step 5.4: Update Module and Integration Tests

**Agent type:** sonnet
**Execution mode:** Sequential
**Blocked by:** Steps 5.2-5.3 (use case tests done)
**Parallel with:** None
**Quality Gate:** Phase 5 Test Migration Complete
**Effort:** Medium (4-5 hours)

**Description:**
Update module-level and integration tests.

**Subtasks:**

- [ ] Update `UseCaseModule.test.ts` - Verify Effect-based use cases resolve
- [ ] Update `ControllerModule.test.ts` - Verify controllers resolve with Effect dependencies
- [ ] Update `AppModule.test.ts` - Full DI container integration
- [ ] Run all module tests

**Success Criteria:**

- [ ] All module tests updated
- [ ] All module tests pass

#### Verification

**Level:** MEDIUM (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion                | Weight | Description                                                                  | Scale                                                |
| ------------------------ | ------ | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| Module Test Completeness | 0.50   | All 3 module test files (UseCaseModule, ControllerModule, AppModule) updated | 1=Partial, 3=Mostly updated, 5=All 3 fully updated   |
| Integration Verification | 0.50   | DI resolution works correctly with Effect-based services                     | 1=Broken, 3=Partially working, 5=Perfect integration |

**Total Weight:** 1.00

---

### Phase 6: Documentation & Finalization (Week 8)

**Goal:** Update all documentation and verify the migration is complete.

**Output:** Updated AGENTS.md, CLAUDE.md, training materials, verification reports.

**Success Criteria:**

- [ ] AGENTS.md updated with DI and Effect patterns
- [ ] CLAUDE.md updated with Effect best practices
- [ ] Team training materials created
- [ ] Migration verification complete (zero Result usage)

#### Step 6.1: Update AGENTS.md with DI and Effect Patterns

**Agent type:** sonnet
**Execution mode:** Sequential
**Blocked by:** All prior phases (patterns finalized)
**Parallel with:** None
**Effort:** Medium (4-5 hours)

**Description:**
Update AGENTS.md to reflect the new DI and Effect patterns. This is the primary reference for AI agents.

**Subtasks:**

- [ ] Update "Layer Decision Tree" section - Add Effect considerations
- [ ] Add "Effect Patterns" section - Error handling, Effect.gen, composition
- [ ] Update "DI Patterns" section - Document full DI adoption
- [ ] Add "Testing with Effect" section - Effect.runPromise, mock layers
- [ ] Update code examples to use Effect
- [ ] Add migration examples (Before/After)
- [ ] Update "Common Patterns" section with Effect examples

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Documentation scope | Focus on agent-facing patterns, not full Effect tutorial |

**Success Criteria:**

- [ ] AGENTS.md reflects Effect patterns
- [ ] All code examples use Effect
- [ ] DI examples show full container resolution

#### Verification

**Level:** LOW (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion        | Weight | Description                                                         | Scale                                                 |
| ---------------- | ------ | ------------------------------------------------------------------- | ----------------------------------------------------- |
| Pattern Accuracy | 0.35   | Documentation matches actual code patterns implemented              | 1=Inaccurate, 3=Mostly accurate, 5=Perfectly accurate |
| Example Quality  | 0.35   | Code examples are correct, runnable, and demonstrate best practices | 1=Broken, 3=Working, 5=Excellent examples             |
| Completeness     | 0.30   | Covers DI patterns, Effect patterns, and testing approaches         | 1=Missing sections, 3=Basic, 5=Comprehensive coverage |

**Total Weight:** 1.00

---

#### Step 6.2: Update CLAUDE.md with Effect Best Practices

**Agent type:** sonnet
**Execution mode:** Sequential
**Blocked by:** Step 6.1 (AGENTS.md finalized)
**Parallel with:** Step 6.2 (CLAUDE.md can be updated in parallel with Step 6.1 once patterns are clear)
**Coordination notes:** AGENTS.md and CLAUDE.md updates can proceed in parallel after patterns are established. AGENTS.md focuses on agent-facing patterns, CLAUDE.md on Effect best practices.
**Effort:** Medium (4-5 hours)

**Description:**
Update CLAUDE.md with Effect.ts best practices for the project.

**Subtasks:**

- [ ] Add "Effect Best Practices" section
- [ ] Document error type conventions
- [ ] Document Effect.gen vs Effect.flatMap usage
- [ ] Add "Common Effect Patterns" subsection
- [ ] Document when to use Effect vs Promise
- [ ] Add Effect debugging tips
- [ ] Update any existing Effect references

**Success Criteria:**

- [ ] CLAUDE.md has Effect best practices section
- [ ] Guidelines are clear and actionable
- [ ] Examples from actual codebase

#### Verification

**Level:** LOW (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion          | Weight | Description                                                    | Scale                                                   |
| ------------------ | ------ | -------------------------------------------------------------- | ------------------------------------------------------- |
| Practice Relevance | 0.40   | Best practices match actual project needs and patterns used    | 1=Irrelevant, 3=Somewhat relevant, 5=Perfectly relevant |
| Clarity            | 0.35   | Guidelines are clear, actionable, and easy to follow           | 1=Unclear, 3=Somewhat clear, 5=Crystal clear            |
| Example Quality    | 0.25   | Examples are from actual codebase and illustrate concepts well | 1=No examples, 3=Basic, 5=Excellent real examples       |

**Total Weight:** 1.00

---

#### Step 6.3: Create Team Training Materials

**Agent type:** haiku
**Execution mode:** Parallel (can run with Steps 6.1-6.2)
**Blocked by:** Phase 5 complete (all patterns established)
**Parallel with:** Steps 6.1, 6.2 (training materials can be created in parallel with documentation updates)
**Coordination notes:** Cheatsheet and migration examples can be drafted while AGENTS.md and CLAUDE.md are being finalized. Final review after both are complete.
**Effort:** Small (2-3 hours)

**Description:**
Create quick reference materials for the team.

**Subtasks:**

- [ ] Create `docs/di-effect-cheatsheet.md` - Quick reference card
- [ ] Create `docs/effect-migration-examples.md` - Before/After examples
- [ ] Add links in README.md to new documentation
- [ ] Create slide deck outline for team presentation (optional)

**Success Criteria:**

- [ ] Cheatsheet created
- [ ] Migration examples documented
- [ ] Documentation discoverable

#### Verification

**Level:** LOW (Single judge)
**Threshold:** 4.0/5.0
**Judge Type:** sonnet

| Criterion          | Weight | Description                                                     | Scale                                          |
| ------------------ | ------ | --------------------------------------------------------------- | ---------------------------------------------- |
| Cheatsheet Utility | 0.50   | Quick reference is useful, concise, and covers common scenarios | 1=Not useful, 3=Somewhat useful, 5=Very useful |
| Example Clarity    | 0.50   | Before/After migration examples are clear and educational       | 1=Unclear, 3=Somewhat clear, 5=Crystal clear   |

**Total Weight:** 1.00

---

#### Step 6.4: Final Verification and Migration Report

**Agent type:** sonnet
**Execution mode:** Sequential
**Blocked by:** Steps 6.1, 6.2, 6.3 (all documentation and verification complete)
**Parallel with:** None
**Quality Gate:** FINAL - Migration Complete
**Effort:** Small (2-3 hours)

**Description:**
Verify the migration is complete and create a summary report.

**Subtasks:**

- [ ] Run comprehensive grep: `grep -r "Result<" packages/ apps/` (expect zero)
- [ ] Run comprehensive grep: `grep -r "from.*utils/result" packages/ apps/` (expect zero)
- [ ] Run test suite: `bun test` (expect 100% pass)
- [ ] Run dependency-cruiser: `bunx dependency-cruiser --validate .dependency-cruiser.cjs .` (expect pass)
- [ ] Run TypeScript check: `bun run typecheck` (expect zero errors)
- [ ] Create migration report: `.specs/analysis/di-effect-migration-report.md`
  - List of all files changed
  - Lines of code changed
  - Test coverage before/after
  - Lessons learned
  - Remaining technical debt

**Blockers:**
| Blocker | Resolution |
|---------|------------|
| Grep shows remaining Result usage | Fix remaining occurrences before completing |
| Test failures | Fix all tests before marking complete |

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hidden Result usage | Low | Medium | Multiple grep patterns, thorough search |

**Success Criteria:**

- [ ] Zero Result<T,E> usage in codebase (except docs)
- [ ] 100% test pass rate
- [ ] Migration report created
- [ ] All acceptance criteria met

#### Verification

**Level:** HIGH (Panel of 2 judges)
**Threshold:** 4.5/5.0
**Judge Type:** opus

| Criterion              | Weight | Description                                                            | Scale                                            |
| ---------------------- | ------ | ---------------------------------------------------------------------- | ------------------------------------------------ |
| Migration Completeness | 0.40   | Zero Result<T,E> usage, all components migrated (DI + Effect)          | 1=Incomplete, 3=Mostly complete, 5=100% complete |
| Test Pass Rate         | 0.25   | 100% of all tests passing across all packages                          | 1=<90%, 3=90-98%, 5=100% passing                 |
| Documentation Quality  | 0.20   | AGENTS.md and CLAUDE.md fully updated with new patterns                | 1=Outdated, 3=Partially updated, 5=Fully updated |
| Report Completeness    | 0.15   | Migration report includes metrics, lessons learned, and remaining debt | 1=Minimal, 3=Basic, 5=Comprehensive report       |

**Total Weight:** 1.00

---

## Execution Strategy

### Phase Execution Matrix

| Phase       | Max Agents | Sequential Steps | Parallel Steps | Total Agents      | Quality Gates            |
| ----------- | ---------- | ---------------- | -------------- | ----------------- | ------------------------ |
| **Phase 1** | 1          | 3                | 0              | 1                 | 1 (Foundation)           |
| **Phase 2** | 16         | 0                | 4              | 2+3+4+7=16        | 1 (Routers Complete)     |
| **Phase 3** | 5          | 1                | 4              | 1+4=5             | 1 (Controllers Complete) |
| **Phase 4** | 48         | 0                | 3              | 4+40+4=48         | 1 (Effect Migration)     |
| **Phase 5** | 19         | 2                | 3              | 1+4+14=19         | 1 (Tests Complete)       |
| **Phase 6** | 3          | 2                | 2              | 1+2=3             | 1 (Final)                |
| **TOTAL**   | **92**     | **8**            | **16**         | **92 agents max** | **6 gates**              |

### Agent Distribution Table

| Agent Type | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | **Total** |
| ---------- | ------- | ------- | ------- | ------- | ------- | ------- | --------- |
| **opus**   | 0       | 0       | 0       | 4       | 0       | 0       | **4**     |
| **sonnet** | 3       | 5       | 5       | 44      | 5       | 2       | **64**    |
| **haiku**  | 0       | 11      | 0       | 0       | 14      | 1       | **26**    |
| **TOTAL**  | **3**   | **16**  | **5**   | **48**  | **19**  | **3**   | **94**    |

### Critical Path Identification

```
Critical Path (determines minimum duration):

Phase 1 (Infrastructure) - 3 sequential steps
├─ Step 1.1: Error Types (4h)
├─ Step 1.2: Layer Definitions (5h) ──► FOUNDATION READY
└─ Step 1.3: AppModule Integration (3h) [QUALITY GATE 1]

Phase 2 (Routers) - 4 parallel steps (max 16 agents)
├─ Step 2.1: High-Traffic (5h parallel) ──► PATTERN ESTABLISHED
├─ Step 2.2: Medium-Traffic (3h parallel)
├─ Step 2.3: Admin Routers (3h parallel)
└─ Step 2.4: Remaining Routers (2h parallel) [QUALITY GATE 2]
   └── MAXIMUM PARALLELIZATION: 7 agents

Phase 3 (Controllers) - 1 sequential + 4 parallel
├─ Step 3.1: ControllerModule (8h) ──► REGISTRY READY
├─ Step 3.2-3.5: Index Chunks (5h parallel, 4 agents)
│   └── 4 sonnet agents on different index.ts line ranges
└─ [QUALITY GATE 3]

Phase 4 (Effect Migration) - 3 massively parallel steps (max 48 agents)
├─ Step 4.1: Complex Use Cases (10h parallel, 4 opus agents)
├─ Step 4.2: Standard Use Cases (5h parallel, 40 sonnet agents in batches)
│   └── 10 batches × 4 agents each = 40 parallel use case migrations
└─ Step 4.3: Repositories (4h parallel, 4 agents) [QUALITY GATE 4]

Phase 5 (Tests) - 2 sequential + 3 parallel (max 19 agents)
├─ Step 5.1: Test Utilities (5h)
├─ Step 5.2: Priority Tests (5h parallel, 4 agents)
├─ Step 5.3: Remaining Tests (3h parallel, 14 agents)
└─ Step 5.4: Module Tests (5h) [QUALITY GATE 5]

Phase 6 (Documentation) - 2 sequential + 2 parallel (max 3 agents)
├─ Step 6.1: AGENTS.md (5h parallel with 6.2)
├─ Step 6.2: CLAUDE.md (5h parallel with 6.1)
├─ Step 6.3: Training Materials (3h parallel)
└─ Step 6.4: Final Verification (3h) [FINAL GATE]
```

**Critical Path Duration**: 4+5+3 + 5 + 8 + 10 + 5 + 5 = **45 hours** (with full parallelization)
**Sequential Duration**: 4+5+3 + 5+3+3+2 + 8+5+5+5+5 + 10+5+4 + 5+5+3+5 + 5+5+3+3 = **~112 hours**

### Time Savings Calculation

| Metric    | Sequential | Parallel | Savings         |
| --------- | ---------- | -------- | --------------- |
| Phase 1   | 12h        | 12h      | 0% (foundation) |
| Phase 2   | 37h        | 5h       | **86%**         |
| Phase 3   | 28h        | 13h      | **54%**         |
| Phase 4   | 156h       | 10h      | **94%**         |
| Phase 5   | 40h        | 8h       | **80%**         |
| Phase 6   | 17h        | 8h       | **53%**         |
| **TOTAL** | **~290h**  | **~56h** | **81%**         |

**Estimated calendar time:**

- Sequential (1 agent): ~36 working days (8 weeks)
- Parallel (92 agents): ~7 working days (1.4 weeks)
- **Time savings: ~29 working days (7.3 weeks)**

---

## Sub-Agent Execution Directive

### Required Context for Each Sub-Agent

Every sub-agent **MUST** receive:

```yaml
Required Context:
  task_file: .specs/tasks/draft/migrate-all-sourcecode-di-effect.refactor.md
  phase: <Phase number>
  step: <Step number>
  step_title: <Step title>
  agent_type: <opus|sonnet|haiku>
  blocked_by: <List of blocking steps>
  parallel_with: <List of parallel steps>

Codebase Context:
  repository_structure: /Users/rafalopilowski/Projekty/migration/pjapp/AGENTS.md
  coding_standards: /Users/rafalopilowski/Projekty/migration/pjapp/CLAUDE.md
  di_patterns: /Users/rafalopilowski/Projekty/migration/pjapp/packages/frameworks/src/di/README.md

Execution Context:
  quality_gate_threshold: 4.0/5.0 (4.5/5.0 for critical steps)
  max_iterations: 3
  test_command: bun test
  build_command: bun run build
```

### Coordination Notes Between Parallel Agents

**Phase 2 - Router Parallelization:**

```yaml
Coordination Protocol:
  shared_state: None (routers are independent)
  pattern_reference: Step 2.1 establishes DI resolution pattern
  conflict_resolution: First agent to complete documents edge cases in scratchpad

Agent Responsibilities:
  Agent-A (challengeVote.ts):
    - Migrate challengeVote router
    - Document any controller resolution issues
    - Update .specs/scratchpad/router-migration-challenges.md

  Agent-B (challengeSubmission.ts):
    - Migrate challengeSubmission router
    - Reference Agent-A's pattern
    - Add findings to shared scratchpad
```

**Phase 3 - Controller Index Parallelization:**

```yaml
Coordination Protocol:
  shared_file: packages/adapters/src/controllers/index.ts
  merge_strategy: Line-range isolation (no overlap)

Line Range Assignments:
  Step 3.2: Lines 1-1000 (Storage, Group, Trip)
  Step 3.3: Lines 1001-2000 (Notification controllers)
  Step 3.4: Lines 2001-3000 (Challenge controllers)
  Step 3.5: Lines 3001-4311 (Remaining controllers)

Merge Order: Any order (independent chunks)
Quality Gate: All chunks must pass before proceeding to Phase 4
```

**Phase 4 - Use Case Parallelization:**

```yaml
Coordination Protocol:
  shared_patterns: Effect conversion patterns
  batch_isolation: Each batch works on different domain (User, Challenge, Group, etc.)

Batch Assignments (Step 4.2):
  Batch 1-10: User domain use cases
  Batch 11-20: Challenge domain use cases
  Batch 21-30: Group domain use cases
  ... (continue for all 75 use cases)

Repository Interface Updates:
  - Each batch agent must update corresponding repository port interfaces
  - Port updates are independent per repository
  - Aggregate all port changes in quality gate review
```

### Quality Gates Between Phases

| Gate    | Location      | Criteria                                               | Verification                      |
| ------- | ------------- | ------------------------------------------------------ | --------------------------------- |
| **QG1** | After Phase 1 | AppModule integrates UseCaseModule, builds pass        | `bun run build` in frameworks     |
| **QG2** | After Phase 2 | All 17 routers use DI resolution                       | grep -c "container.resolve" = 17  |
| **QG3** | After Phase 3 | All 17 controllers registered, index.ts migrated       | ControllerModule has 17 providers |
| **QG4** | After Phase 4 | Zero Result<T,E> in use cases, all repos return Effect | grep -c "Result<" = 0             |
| **QG5** | After Phase 5 | 100% test pass rate                                    | `bun test` passes                 |
| **QG6** | After Phase 6 | Documentation updated, zero Result usage               | grep -r "Result<" packages/ = 0   |

### Example Sub-Agent Prompts

**Example 1: Phase 2 Router Agent (sonnet)**

```
You are migrating the challengeVote.ts router to use DI.

CONTEXT:
- Task: migrate-all-sourcecode-di-effect.refactor.md
- Phase: 2, Step: 2.1
- Blocked by: Phase 1 complete
- Parallel with: challengeSubmission.ts migration (separate agent)

REQUIRED ACTIONS:
1. Read packages/adapters/src/api/routers/challengeVote.ts
2. Replace all direct controller instantiations with ctx.container.resolve()
3. Use CONTROLLER_TOKENS.ChallengeVoteController token
4. Add error handling for resolution failures
5. Run tests: bun test packages/adapters/src/api/routers/__tests__/challengeVote.test.ts

VERIFICATION:
- Zero direct controller imports
- All procedures use ctx.container.resolve()
- Tests pass

SCRATCHPAD:
Document any edge cases in .specs/scratchpad/router-challengeVote.md
```

**Example 2: Phase 4 Use Case Agent (opus)**

```
You are migrating PurchaseReward.ts to Effect.ts patterns.

CONTEXT:
- Task: migrate-all-sourcecode-di-effect.refactor.md
- Phase: 4, Step: 4.1
- Blocked by: Phase 3 complete
- Parallel with: SubmitVotes.ts, ForceEndVoting.ts, AddCoins.ts migrations

REQUIRED ACTIONS:
1. Read packages/use-cases/src/interactors/PurchaseReward.ts
2. Convert from async/Promise/Result to Effect<never, E, T>
3. Use Effect.gen for sequential operations
4. Replace Result with Effect.fail/Effect.succeed
5. Add typed errors (InsufficientCoinsError, OutOfStockError)
6. Update PurchaseReward.test.ts

VERIFICATION:
- Function signature: execute(): Effect<never, PurchaseRewardError, RewardDTO>
- All async operations wrapped in Effect
- Zero Result imports
- Tests pass with Effect.runPromise

QUALITY GATE: Panel of 2 judges, threshold 4.5/5.0
```

**Example 3: Phase 4 Repository Batch Agent (sonnet)**

```
You are adding Effect wrappers to 4 repositories (Batch 1: User, Trip, Challenge, Group).

CONTEXT:
- Task: migrate-all-sourcecode-di-effect.refactor.md
- Phase: 4, Step: 4.3
- Blocked by: Step 4.1 (patterns established)
- Parallel with: Other repository batches (2, 3, 4)

REQUIRED ACTIONS:
1. For each repository in batch:
   - Read PrismaXRepository.ts
   - Wrap findById with Effect.tryPromise
   - Wrap findByXxx methods with Effect.tryPromise
   - Wrap create/update/delete with Effect.tryPromise
2. Update port interfaces in packages/use-cases/src/ports/
3. Update repository tests

VERIFICATION per repository:
- All methods return Effect<never, DatabaseError, T>
- Effect.tryPromise with proper error mapping
- Tests pass

DELIVERABLE: 4 fully Effect-wrapped repositories
```

---

### Parallelization Summary

The following diagram shows parallelization opportunities across phases:

```
Phase 1 (Week 1) - Infrastructure
├── Step 1.1: Error Types [sonnet] ─────────────────────────────┐
├── Step 1.2: Layer Definitions [sonnet] ──────────────────────┤ Sequential
└── Step 1.3: AppModule Integration [sonnet] ──────────────────┘

Phase 2 (Weeks 2-3) - Router Migration - MAX 16 AGENTS
├── Step 2.1: High-Traffic Routers [sonnet x2] ────────────────┐
├── Step 2.2: Medium-Traffic Routers [sonnet x3] ──────────────┤ Parallel
├── Step 2.3: Admin Routers [haiku x4] ──────────────────────────┤ (16 agents)
└── Step 2.4: Remaining Routers [haiku x7] ─────────────────────┘

Phase 3 (Week 4) - Controller Migration - MAX 5 AGENTS
├── Step 3.1: ControllerModule Update [sonnet] ────────────────┐
├── Step 3.2: Index Chunk 1 [sonnet] ──────────────────────────┤ 1+4 Parallel
├── Step 3.3: Index Chunk 2 [sonnet] ──────────────────────────┤ (5 agents)
├── Step 3.4: Index Chunk 3 [sonnet] ──────────────────────────┤
└── Step 3.5: Index Chunk 4 [sonnet] ──────────────────────────┘

Phase 4 (Weeks 5-6) - Effect Migration - MAX 48 AGENTS
├── Step 4.1: Complex Use Cases [opus x4] ─────────────────────┐
├── Step 4.2: Standard Use Cases [sonnet x40 batches] ─────────┤ 4+40+4 Parallel
└── Step 4.3: Repositories [sonnet x4] ──────────────────────────┘ (48 agents)

Phase 5 (Week 7) - Test Migration - MAX 19 AGENTS
├── Step 5.1: Test Utilities [sonnet] ─────────────────────────┐
├── Step 5.2: Priority Tests [sonnet x4] ────────────────────┤ 1+4+14 Parallel
├── Step 5.3: Remaining Tests [haiku x14] ─────────────────────┤ (19 agents)
└── Step 5.4: Module Tests [sonnet] ───────────────────────────┘

Phase 6 (Week 8) - Documentation - MAX 3 AGENTS
├── Step 6.1: AGENTS.md Update [sonnet] ─────────────────────┐
├── Step 6.2: CLAUDE.md Update [sonnet] ─────────────────────┤ 1+2 Parallel
├── Step 6.3: Training Materials [haiku] ────────────────────┤ (3 agents)
└── Step 6.4: Final Verification [sonnet] ─────────────────────┘
```

**Maximum Parallelization Depth:** 48 agents (Phase 4, Step 4.2 - Standard Use Cases)

---

### Verification Summary Table

All 23 implementation steps require LLM-as-Judge verification with defined rubrics:

| Step      | Description                                                                                         | Level  | Threshold | Judge  | Criteria | Evaluations |
| --------- | --------------------------------------------------------------------------------------------------- | ------ | --------- | ------ | -------- | ----------- |
| 1.1       | Create Effect Error Type Definitions                                                                | HIGH   | 4.0/5.0   | opus   | 4        | 2 (panel)   |
| 1.2       | Create Effect Layer Definitions                                                                     | HIGH   | 4.0/5.0   | opus   | 4        | 2 (panel)   |
| 1.3       | Update AppModule for Effect Integration                                                             | HIGH   | 4.5/5.0   | opus   | 4        | 2 (panel)   |
| 2.1       | High-Traffic Routers - challengeVote, challengeSubmission                                           | MEDIUM | 4.0/5.0   | sonnet | 4        | 1           |
| 2.2       | Medium-Traffic Routers - activityFeed, reward, location                                             | MEDIUM | 4.0/5.0   | sonnet | 3        | 1           |
| 2.3       | Admin/System Routers - notificationSchedule, notificationDelivery, coinTransaction, sponsor         | MEDIUM | 4.0/5.0   | sonnet | 2        | 1           |
| 2.4       | Remaining Routers - submissionReport, notifications, coin, storage, group, trip, notificationSender | MEDIUM | 4.0/5.0   | sonnet | 2        | 1           |
| 3.1       | Update ControllerModule with All Controllers                                                        | HIGH   | 4.5/5.0   | opus   | 4        | 2 (panel)   |
| 3.2       | Migrate Controller Index.ts - Storage, Group, Trip (Chunk 1)                                        | MEDIUM | 4.0/5.0   | sonnet | 3        | 1           |
| 3.3       | Migrate Controller Index.ts - Notification Controllers (Chunk 2)                                    | MEDIUM | 4.0/5.0   | sonnet | 2        | 1           |
| 3.4       | Migrate Controller Index.ts - Challenge Controllers (Chunk 3)                                       | MEDIUM | 4.0/5.0   | sonnet | 2        | 1           |
| 3.5       | Migrate Controller Index.ts - Remaining Controllers (Chunk 4)                                       | MEDIUM | 4.0/5.0   | sonnet | 2        | 1           |
| 4.1       | Migrate High-Priority Use Cases (Complex Flows)                                                     | HIGH   | 4.5/5.0   | opus   | 4        | 2 (panel)   |
| 4.2       | Migrate Standard Use Cases (CRUD Operations)                                                        | MEDIUM | 4.0/5.0   | sonnet | 3        | 1           |
| 4.3       | Migrate All 16 Repositories to Effect                                                               | MEDIUM | 4.0/5.0   | sonnet | 3        | 1           |
| 5.1       | Create Effect Test Utilities                                                                        | MEDIUM | 4.0/5.0   | sonnet | 3        | 1           |
| 5.2       | Update Use Case Tests (Priority Use Cases)                                                          | MEDIUM | 4.0/5.0   | sonnet | 3        | 1           |
| 5.3       | Update Remaining Use Case Tests                                                                     | MEDIUM | 4.0/5.0   | sonnet | 2        | 1           |
| 5.4       | Update Module and Integration Tests                                                                 | MEDIUM | 4.0/5.0   | sonnet | 2        | 1           |
| 6.1       | Update AGENTS.md with DI and Effect Patterns                                                        | LOW    | 4.0/5.0   | sonnet | 3        | 1           |
| 6.2       | Update CLAUDE.md with Effect Best Practices                                                         | LOW    | 4.0/5.0   | sonnet | 3        | 1           |
| 6.3       | Create Team Training Materials                                                                      | LOW    | 4.0/5.0   | sonnet | 2        | 1           |
| 6.4       | Final Verification and Migration Report                                                             | HIGH   | 4.5/5.0   | opus   | 4        | 2 (panel)   |
| **TOTAL** |                                                                                                     |        |           |        | **73**   | **35**      |

**Verification Level Guidelines:**

- **HIGH (Panel of 2)**: Critical infrastructure (Error types, Layer definitions, AppModule, Complex use cases, Final verification)
- **MEDIUM (Single)**: Standard components (Routers, Controllers, Repositories, Tests, Modules)
- **LOW (Single)**: Simple operations (Documentation updates)

**Judge Type Selection:**

- **opus**: Complex analysis, critical infrastructure, nuanced evaluation (Steps 1.1-1.3, 3.1, 4.1, 6.4)
- **sonnet**: Standard patterns, established conventions (All other steps)

**Threshold Rationale:**

- **4.5/5.0**: Critical foundation steps with high impact on subsequent work (Steps 1.3, 3.1, 4.1, 6.4)
- **4.0/5.0**: Standard implementation steps with acceptable margin for minor refinement

**Total Evaluations Required:** 35 (23 steps with 12 requiring panel of 2 judges)

---

### Implementation Summary Table

| Phase     | Steps  | Sequential Effort | Parallel Effort | Max Agents | Critical Path | Quality Gates |
| --------- | ------ | ----------------- | --------------- | ---------- | ------------- | ------------- |
| Phase 1   | 3      | 9-12 hours        | 12 hours        | 1          | Yes           | 1 gate        |
| Phase 2   | 4      | 37-51 hours       | 5 hours         | 16         | Yes           | 1 gate        |
| Phase 3   | 5      | 22-28 hours       | 13 hours        | 5          | Yes           | 1 gate        |
| Phase 4   | 3      | 128-156 hours     | 10 hours        | 48         | Yes           | 1 gate        |
| Phase 5   | 4      | 30-40 hours       | 8 hours         | 19         | No            | 1 gate        |
| Phase 6   | 4      | 12-17 hours       | 8 hours         | 3          | No            | 1 gate        |
| **TOTAL** | **23** | **~240-300 hrs**  | **~56 hours**   | **92 max** | **~45 hrs**   | **6 gates**   |

**Efficiency Metrics:**

- **Parallelization Speedup:** 5.2x (290h → 56h)
- **Agent Utilization:** 92 parallel agents at peak (Phase 4)
- **Time Savings:** ~234 hours (~29 working days)
- **Calendar Compression:** 8 weeks → 1.4 weeks (81% reduction)

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[DI-01] DI Registration - Repositories**: All 16 Prisma repository implementations registered in RepositoryModule with unique tokens and exported
  - Given: RepositoryModule configuration is inspected
  - When: All repository tokens are checked
  - Then: All 16 Prisma repositories have registration entries and are exported

- [ ] **[DI-02] DI Registration - Use Cases**: All use case interactors auto-wire dependencies via constructor injection
  - Given: Use case source files in packages/use-cases
  - When: DI container resolves use cases
  - Then: All dependencies injected via constructor, no direct instantiation

- [ ] **[DI-03] DI Registration - Controllers**: All tRPC controllers registered in ControllerModule with SCOPED lifetime
  - Given: ControllerModule configuration is inspected
  - When: Controller registrations are verified
  - Then: All controllers registered with Lifetime.SCOPED and exported

- [ ] **[DI-04] tRPC Router Migration**: All tRPC procedures resolve services from `ctx.container`
  - Given: tRPC router implementations in apps/
  - When: Procedures execute service calls
  - Then: All services resolved via `ctx.container.resolve()`, never instantiated directly

- [ ] **[EF-01] Result Type Elimination - Domain**: Zero Result<T,E> imports in domain package
  - Given: Domain package source files
  - When: grep for "Result" imports
  - Then: Zero imports from "../utils/result" or "@mirai-app/domain"

- [ ] **[EF-02] Result Type Elimination - Use Cases**: All use cases return Effect<never, E, T> instead of Result<T,E>
  - Given: Use case source files
  - When: Function signatures are inspected
  - Then: All async functions return Effect<never, ErrorType, ReturnType>

- [ ] **[EF-03] Error Handling Migration**: All error handling uses Effect patterns
  - Given: Error handling code patterns
  - When: Code is executed
  - Then: All use Effect.match, Effect.flatMap, or Effect.catchAll (not isSuccess/isError)

- [ ] **[TEST-01] Test Migration**: All tests pass with Effect patterns
  - Given: Test suite execution
  - When: `bun test` runs
  - Then: 100% of tests passing, no Result-based test utilities remain

### Non-Functional Requirements

- [ ] **[NF-01] Type Safety**: TypeScript compilation with zero errors
  - Given: TypeScript compiler runs with strict mode
  - When: Compilation completes
  - Then: Zero type errors, full type inference preserved

- [ ] **[NF-02] Performance**: No measurable performance degradation
  - Given: Benchmark comparison before/after
  - When: Key operations are measured
  - Then: Performance equal or better than Result implementation

- [ ] **[NF-03] Backward Compatibility**: All API contracts unchanged
  - Given: API contracts before migration
  - When: Compared to after migration
  - Then: All inputs/outputs identical (internal implementation only)

### Definition of Done

- [ ] **[DOD-01] Code Complete**: Zero Result<T,E> usage in codebase
  - Given: Full codebase grep
  - When: `grep -r "Result<" packages/ apps/` executed
  - Then: Zero occurrences (except in migration documentation)

- [ ] **[DOD-02] Test Complete**: All test suites pass
  - Given: Complete test execution
  - When: `bun test` runs in all packages
  - Then: All tests passing across domain, use-cases, adapters, frameworks, apps

- [ ] **[DOD-03] Documentation**: AGENTS.md and CLAUDE.md updated
  - Given: Documentation files reviewed
  - When: Effect patterns and DI examples are checked
  - Then: All examples use Effect patterns, Result type documentation removed or marked deprecated
