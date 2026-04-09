---
title: Implement InversifyJS for dependency injection and analyze Effect.ts for boilerplate reduction
---

## Initial User Prompt

Use https://inversify.io/ and https://inversify.io/docs/ecosystem/binding-decorators/ for dependency injection; also analyse the use of https://effect.website/docs to reduce the boilerplate code

// REFINEMENT: Instead of InversifyJS, use this: https://github.com/wildstyles/awilix-modular

## Description

### What and Why

**InversifyJS** is a powerful, lightweight IoC (Inversion of Control) container for TypeScript applications. It enables dependency injection through decorators, providing:

- **Type-safe dependency resolution** at compile time
- **Lifecycle management** (singletons, transient, request-scoped)
- **Framework-agnostic design** compatible with Clean Architecture
- **Testability** through easy implementation swapping

**Binding Decorators** (`@inversifyjs/binding-decorators`) streamline container configuration by:

- Using `@provide()` decorator to auto-register classes
- Keeping bindings co-located with class definitions
- Reducing container setup boilerplate by ~60%
- Supporting named and tagged bindings for complex scenarios

**Effect.ts** is a comprehensive TypeScript library for building composable programs with built-in:

- **Structured error handling** (no exceptions, explicit error types)
- **Concurrency primitives** via fiber-based model
- **Resource safety** (automatic acquisition/release)
- **Observability** with full tracing capabilities

### Current Pain Points

The Mirai App currently uses **manual constructor injection** without a DI container:

```typescript
// Current pattern (repeated in 100+ tRPC procedures)
.query(async ({ ctx, input }) => {
  const repo = new PrismaUserRepository(ctx.db);  // Manual instantiation
  const controller = new UserController(repo);     // Manual wiring
  const useCase = new GetUserUseCase(repo);        // More manual wiring
  return useCase.execute(input);
})
```

**Problems:**

1. **Boilerplate overhead**: Every procedure repeats repository instantiation
2. **No centralized management**: Each router creates independent instances
3. **Testing friction**: Manual mocking required for every test
4. **Lifecycle chaos**: No clear patterns for singletons vs request-scoped dependencies
5. **Transaction complexity**: Passing transaction context requires manual plumbing

### Benefits

1. **Reduced boilerplate**: Container resolves dependencies automatically
2. **Improved testability**: Swap implementations at container level
3. **Better separation**: Framework layer manages container, use cases remain pure
4. **Scalable patterns**: Easy to add new repositories following established pattern
5. **Effect.ts potential**: Analyze structured effects for complex use cases

## Acceptance Criteria

### Given-When-Then Format

**AC1: InversifyJS Core Integration**

```
Given the container is configured
When I request a UserController from the container
Then it should resolve with all dependencies auto-wired
```

**AC2: Binding Decorators Configuration**

```
Given @provide() decorator is applied to PrismaUserRepository
When the container loads
Then the repository should be auto-registered without manual binding
```

**AC3: Repository Migration (Pilot)**

```
Given PrismaUserRepository, PrismaChallengeRepository, and PrismaGroupRepository are decorated
When any tRPC procedure requests these via container
Then dependencies resolve correctly without manual instantiation
```

**AC4: Controller Migration (Proof of Concept)**

```
Given the UserController is decorated and bound
When the user router handles a request
Then it retrieves the controller from container instead of manual creation
```

**AC5: Testing Pattern**

```
Given a test wants to use mock repositories
When the container is configured with InMemoryUserRepository
Then all resolved UserController instances use the mock
```

**AC6: Effect.ts Analysis**

```
Given the current Result<T,E> pattern is documented
When Effect.ts patterns are compared
Then a recommendation document exists with:
  - 3+ use cases suitable for Effect.ts
  - Migration effort estimate
  - Go/No-Go decision criteria
```

**AC7: Documentation**

```
Given a developer wants to add a new repository
When they read the container setup guide
Then they can implement DI in <15 minutes
```

## Scope Definition

### In-Scope

1. **Container Setup**
   - Install `inversify` and `@inversifyjs/binding-decorators`
   - Configure container in `packages/frameworks/container/`
   - Define service identifiers for repository interfaces

2. **Pilot Migration (3 repositories)**
   - PrismaUserRepository
   - PrismaChallengeRepository
   - PrismaGroupRepository

3. **Proof of Concept Controller**
   - UserController decorated
   - User router migrated to use container

4. **tRPC Context Update**
   - Add container instance to TRPCContext
   - Ensure container is request-scoped

5. **Effect.ts Analysis**
   - Document current patterns vs Effect.ts patterns
   - Identify high-value migration candidates
   - Provide adoption recommendation

6. **Testing Pattern Documentation**
   - Guide for mocking with DI container
   - Example test using in-memory repositories

### Out-of-Scope (Explicitly NOT Included)

1. **Full Repository Migration** - Only 3 repositories as pilot
2. **Full Controller Migration** - Only UserController as proof of concept
3. **Production Deployment** - Setup and analysis only
4. **Effect.ts Implementation** - Analysis phase only, no code migration
5. **Breaking API Changes** - All existing endpoints must remain functional
6. **Database Migration** - No schema changes
7. **CI/CD Pipeline Changes** - No GitHub Actions modifications

### Future Work (Post-Task)

1. Migrate remaining 13 repositories to use decorators
2. Migrate all 20+ controllers to container resolution
3. Implement Effect.ts in identified high-value use cases
4. Add request-scoped transaction support via container
5. Create container-based integration testing patterns
6. Performance benchmarking of DI overhead

## User Scenarios

### Scenario 1: Developer Adding New Repository

**Current Experience:**

```typescript
// Developer must manually wire in every router procedure
export const tripRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaTripRepository(ctx.db); // Boilerplate
      const controller = new TripController(repo); // More boilerplate
      const result = await controller.getById(input);
      // ...
    }),
});
```

**Desired Experience (Post-Implementation):**

```typescript
// 1. Decorate the repository
@provide(TYPES.TripRepository)
class PrismaTripRepository extends BasePrismaRepository<Trip, ...>
  implements TripRepository { }

// 2. Decorate the controller
@provide(TYPES.TripController)
class TripController {
  constructor(@inject(TYPES.TripRepository) repo: TripRepository) { }
}

// 3. Use in router (clean, minimal)
export const tripRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.get(TripController);
      return controller.getById(input);
    }),
});
```

### Scenario 2: Testing with Mocked Dependencies

**Current Experience:**

```typescript
describe("GetUserUseCase", () => {
  it("should return user when exists", async () => {
    // Manual mocking for every test
    const mockRepo: UserRepository = {
      findById: mock(() => Promise.resolve(mockUser)),
      findByAuthUserId: mock(() => Promise.resolve(null)),
      // Must mock ALL methods
    };

    const useCase = new GetUserUseCase(mockRepo);
    const result = await useCase.execute({ userId: "123" });

    expect(result.isSuccess()).toBe(true);
  });
});
```

**Desired Experience (Post-Implementation):**

```typescript
describe("GetUserUseCase", () => {
  let container: Container;

  beforeEach(() => {
    container = createTestContainer();
    // Swap implementation once at container level
    container.rebind(TYPES.UserRepository).to(InMemoryUserRepository);
  });

  it("should return user when exists", async () => {
    // Container provides fully configured use case with mock
    const useCase = container.get(GetUserUseCase);

    // Pre-configure mock data
    const inMemoryRepo = container.get<UserRepository>(TYPES.UserRepository);
    inMemoryRepo.seed({ id: "123", name: "Test User" });

    const result = await useCase.execute({ userId: "123" });
    expect(result.isSuccess()).toBe(true);
  });
});
```

### Scenario 3: Transaction Management Across Use Cases

**Current Experience:**

```typescript
// Developer manually passes transaction context
async function complexOperation(input, prisma: PrismaClient) {
  const repo = new PrismaChallengeRepository(prisma);
  const submissionRepo = new PrismaSubmissionRepository(prisma);

  const useCase1 = new CreateChallengeUseCase(repo);
  const useCase2 = new CreateSubmissionUseCase(submissionRepo);

  // Must manually coordinate transactions
}
```

**Future Potential (Post-InversifyJS, requires additional work):**

```typescript
async function complexOperation(input, ctx: TRPCContext) {
  return await ctx.container.runInTransaction(async (txContainer) => {
    // All resolved dependencies share the same transaction
    const useCase1 = txContainer.get(CreateChallengeUseCase);
    const useCase2 = txContainer.get(CreateSubmissionUseCase);

    const challenge = await useCase1.execute(input.challenge);
    return await useCase2.execute({
      ...input.submission,
      challengeId: challenge.id,
    });
  });
}
```

### Scenario 4: Adding Cross-Cutting Concerns

**Current Experience:**

```typescript
// Logging must be added manually to each use case
class CreateUserUseCase {
  constructor(private repo: UserRepository) {}

  async execute(input) {
    console.log("[CreateUser] Started", input);
    const result = await this.repo.create(user);
    console.log("[CreateUser] Completed", result.id);
    return result;
  }
}
```

**Future Potential:**

```typescript
// Interceptors can be added at container level
container
  .bind(UserRepository)
  .to(PrismaUserRepository)
  .onActivation((context, repo) => {
    return new LoggingProxy(repo); // Auto-wrap with logging
  });
```

---

## Implementation Process

### Phase 1: Setup (Foundation)

Infrastructure setup enabling all subsequent DI migration work.

#### Step 1: Install Dependencies

- **Goal**: Add InversifyJS and binding-decorators packages to the monorepo
- **Output**: Updated `package.json` files with dependencies
- **Agent**: `opus` (Complex reasoning - package version analysis, Bun compatibility verification)
- **Parallel with**: None (first step, foundation)
- **Success Criteria**:
  ```
  Given the monorepo has package.json files
  When dependencies are installed
  Then inversify v8.x and @inversifyjs/binding-decorators are listed in dependencies
  And reflect-metadata is installed for decorator metadata
  ```
- **Subtasks**:
  - [ ] Install `inversify` at monorepo root level
  - [ ] Install `@inversifyjs/binding-decorators` at monorepo root level
  - [ ] Install `reflect-metadata` at monorepo root level
  - [ ] Update `bun.lock` with new dependencies
  - [ ] Verify packages resolve correctly with `bun install`
- **Blockers**: None (first step)
- **Risks**:
  - **Package version conflicts** with existing TypeScript setup
    - _Mitigation_: Pin to stable versions, test in isolated branch
  - **Bun compatibility issues** with reflect-metadata
    - _Mitigation_: Verify with minimal test before proceeding
- **Effort**: XS (30-60 minutes)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Package Installation Correctness | 0.30 | All packages (inversify, binding-decorators, reflect-metadata) installed with correct versions | 1-5 |
  | Lock File Integrity | 0.25 | bun.lock updated correctly with no conflicts | 1-5 |
  | Import Resolution | 0.25 | All packages resolve correctly with `bun install` | 1-5 |
  | No Breaking Changes | 0.20 | Existing imports and builds unaffected | 1-5 |
- **Judge Type**: sonnet (standard package installation verification)

---

#### Step 2: Configure tsconfig for Decorators

- **Goal**: Enable TypeScript decorator support across all packages
- **Output**: Updated `tsconfig.json` files with decorator settings
- **Agent**: `opus` (Architecture decision - TypeScript compiler settings affect entire build)
- **Parallel with**: None (depends on Step 1)
- **Success Criteria**:
  ```
  Given tsconfig.json exists in frameworks package
  When compiler options are updated
  Then experimentalDecorators is set to true
  And emitDecoratorMetadata is set to true
  And strictPropertyInitialization remains compatible
  ```
- **Subtasks**:
  - [ ] Update `packages/frameworks/tsconfig.json` with decorator settings
  - [ ] Update `packages/adapters/tsconfig.json` with decorator settings
  - [ ] Update `packages/use-cases/tsconfig.json` with decorator settings
  - [ ] Verify no TypeScript compilation errors with `bun run build`
  - [ ] Run `bunx tsc --noEmit` to validate configuration
- **Blockers**: Step 1 (dependencies installed)
- **Risks**:
  - **Breaking changes to existing code** with strictPropertyInitialization
    - _Mitigation_: Review and adjust strict settings incrementally
  - **Build performance degradation** from metadata emission
    - _Mitigation_: Monitor build times, consider incremental builds
- **Effort**: XS (30-60 minutes)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Decorator Settings | 0.30 | experimentalDecorators and emitDecoratorMetadata correctly enabled | 1-5 |
  | TypeScript Compilation | 0.25 | `bunx tsc --noEmit` passes without errors | 1-5 |
  | Backward Compatibility | 0.25 | Existing code continues to compile | 1-5 |
  | Build Performance | 0.20 | Build times remain acceptable | 1-5 |
- **Judge Type**: sonnet (configuration verification)

---

#### Step 3: Create Container Configuration Files

- **Goal**: Establish DI container infrastructure in frameworks layer
- **Output**: Container setup files in `packages/frameworks/src/di/`
- **Agent**: `opus` (Core infrastructure - container hierarchy, module loading)
- **Parallel with**: None (depends on Steps 1-2)
- **Success Criteria**:
  ```
  Given container configuration exists
  When container is imported
  Then it exports a configured Container instance
  And buildProviderModule() is loaded for auto-registration
  And container can resolve a simple test class
  ```
- **Subtasks**:
  - [ ] Create `packages/frameworks/src/di/` directory
  - [ ] Create `packages/frameworks/src/di/container.ts` with root container
  - [ ] Create `packages/frameworks/src/di/index.ts` for public exports
  - [ ] Add container initialization with `buildProviderModule()`
  - [ ] Create test to verify container resolves a @provide decorated class
  - [ ] Verify no dependency-cruiser violations from new imports
- **Blockers**: Step 1, Step 2 (dependencies and tsconfig ready)
- **Risks**:
  - **Circular dependency detection** issues with container setup
    - _Mitigation_: Use dependency-cruiser validation after each file creation
  - **Import path resolution** problems between packages
    - _Mitigation_: Follow established monorepo import patterns
- **Effort**: S (2-3 hours)

**Verification:**

- **Level**: HIGH
- **Threshold**: 4.0/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Container Resolution | 0.25 | Container resolves @provide decorated test class | 1-5 |
  | Provider Module Loading | 0.20 | buildProviderModule() loads without errors | 1-5 |
  | No Dependency Violations | 0.20 | Zero dependency-cruiser violations from di/ directory | 1-5 |
  | Child Container Creation | 0.20 | Can create child containers from root | 1-5 |
  | Test Coverage | 0.15 | Unit tests verify container behavior | 1-5 |
- **Judge Type**: opus (critical infrastructure verification)

---

#### Step 4: Set Up Service Identifiers (Symbols)

- **Goal**: Define injection tokens for all services that will use DI
- **Output**: `packages/frameworks/src/di/types.ts` with TYPES constant
- **Agent**: `opus` (Architecture foundation - symbol naming conventions affect entire codebase)
- **Parallel with**: None (depends on Step 3)
- **Success Criteria**:
  ```
  Given service identifiers file exists
  When TYPES constant is imported
  Then it contains symbols for: PrismaClient, UserRepository, ChallengeRepository, GroupRepository, UserController
  And all symbols use Symbol.for() for cross-realm compatibility
  And symbols are typed as unique symbol
  ```
- **Subtasks**:
  - [ ] Create `packages/frameworks/src/di/types.ts`
  - [ ] Define TYPES object with symbol constants
  - [ ] Add PrismaClient symbol
  - [ ] Add UserRepository, ChallengeRepository, GroupRepository symbols
  - [ ] Add UserController symbol
  - [ ] Export TYPES from `packages/frameworks/src/di/index.ts`
  - [ ] Verify symbols are unique and don't conflict
- **Blockers**: Step 3 (container directory exists)
- **Risks**:
  - **Symbol naming collisions** with future services
    - _Mitigation_: Use descriptive prefixes, document naming conventions
  - **TypeScript symbol typing issues**
    - _Mitigation_: Use `unique symbol` type annotation
- **Effort**: S (1-2 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Symbol Completeness | 0.25 | All required symbols defined (PrismaClient, Repositories, Controller) | 1-5 |
  | Type Safety | 0.25 | Symbols properly typed as unique symbol | 1-5 |
  | Cross-Realm Compatibility | 0.25 | Uses Symbol.for() for cross-realm support | 1-5 |
  | No Collisions | 0.25 | Symbol naming avoids future collisions | 1-5 |
- **Judge Type**: sonnet (symbol definition verification)

---

### Phase 2: Foundational Migration

Core DI patterns that enable router migration and demonstrate the approach.

#### Step 5: Migrate Repositories to @injectable

- **Goal**: Convert 3 pilot repositories to use @provide decorator with DI
- **Output**: Updated PrismaUserRepository, PrismaChallengeRepository, PrismaGroupRepository with decorators
- **Agent**: `sonnet` (Standard development - pattern repetition across 3 repositories)
- **Parallel with**: Step 6 (Use Cases) - Both depend only on Step 4, no dependencies between 5 and 6
- **Success Criteria**:
  ```
  Given PrismaUserRepository is decorated with @provide(TYPES.UserRepository)
  When container.get(TYPES.UserRepository) is called
  Then it returns an instance of PrismaUserRepository
  And the repository has PrismaClient injected via constructor
  And existing tests still pass
  ```
- **Subtasks**:
  - [ ] Import `reflect-metadata` at top of each repository file
  - [ ] Import `@provide` from `@inversifyjs/binding-decorators`
  - [ ] Add `@provide(TYPES.UserRepository)` to PrismaUserRepository class
  - [ ] Add `@provide(TYPES.ChallengeRepository)` to PrismaChallengeRepository class
  - [ ] Add `@provide(TYPES.GroupRepository)` to PrismaGroupRepository class
  - [ ] Add `@inject(TYPES.PrismaClient)` to constructor parameters
  - [ ] Update repository imports to include container types
  - [ ] Verify repositories resolve from container in test
  - [ ] Run existing repository tests to ensure no regression
- **Blockers**: Step 4 (service identifiers defined)
- **Risks**:
  - **Constructor signature changes** breaking existing instantiations
    - _Mitigation_: Keep backward-compatible constructors with optional injection
  - **BasePrismaRepository inheritance issues** with decorators
    - _Mitigation_: Test decorator inheritance carefully, may need @injectable on base
- **Effort**: M (4-6 hours across 3 repositories)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Decorator Application | 0.25 | @provide decorator correctly applied to all 3 repositories | 1-5 |
  | Container Resolution | 0.25 | All repositories resolve from container in tests | 1-5 |
  | Constructor Injection | 0.20 | PrismaClient injected via @inject decorator | 1-5 |
  | Test Regression | 0.20 | All existing repository tests pass | 1-5 |
  | Backward Compatibility | 0.10 | Constructors remain backward-compatible | 1-5 |
- **Judge Type**: sonnet (pattern application verification)

---

#### Step 6: Migrate Use Cases to @injectable

- **Goal**: Convert use cases that work with pilot repositories to use DI
- **Output**: 3+ use cases with @injectable decorator and @inject parameters
- **Agent**: `sonnet` (Standard development - pattern repetition across 3-5 use cases)
- **Parallel with**: Step 5 (Repositories) - Both depend only on Step 4, no dependencies between 5 and 6
- **Success Criteria**:
  ```
  Given GetUserUseCase is decorated
  When container.get(GetUserUseCase) is called
  Then it returns an instance with UserRepository auto-injected
  And use case methods work without manual repository instantiation
  ```
- **Subtasks**:
  - [ ] Identify use cases for User, Challenge, and Group domains (3-5 use cases)
  - [ ] Add `@injectable()` decorator to selected use case classes
  - [ ] Add `@inject(TYPES.UserRepository)` to constructor parameters
  - [ ] Remove manual repository instantiation from use case tests
  - [ ] Create container-based test setup for use case tests
  - [ ] Verify use cases resolve from container in integration test
  - [ ] Run existing use case tests to ensure no regression
- **Blockers**: Step 4 (service identifiers defined) - **NOTE: Blocker updated from Step 5 to Step 4**
- **Risks**:
  - **Use cases with multiple dependencies** (PurchaseRewardUseCase) too complex for pilot
    - _Mitigation_: Exclude complex use cases from pilot, handle in future cycle
  - **Test refactoring volume** is high
    - _Mitigation_: Create shared test container setup utility
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Decorator Usage | 0.25 | @injectable and @inject correctly applied | 1-5 |
  | Container Resolution | 0.25 | Use cases resolve with injected repositories | 1-5 |
  | Test Migration | 0.20 | Tests use container-based setup | 1-5 |
  | Existing Tests Pass | 0.20 | All existing use case tests pass | 1-5 |
  | Test Utility Reuse | 0.10 | Shared test container utility used | 1-5 |
- **Judge Type**: sonnet (pattern application verification)

---

#### Step 7: Update tRPC Context with Container

- **Goal**: Integrate Inversify container into tRPC context for dependency resolution
- **Output**: Updated TRPCContext type and createTRPCContext function with container
- **Agent**: `opus` (Critical integration - tRPC type system, container scoping, request lifecycle)
- **Parallel with**: None (depends on BOTH Step 5 AND Step 6)
- **Success Criteria**:
  ```
  Given createTRPCContext is called with db and supabase
  When context is created
  Then it includes a container property with request-scoped Container
  And container can resolve UserRepository with bound PrismaClient
  And all existing tRPC procedures continue to work
  ```
- **Subtasks**:
  - [ ] Update TRPCContext interface to include container: Container
  - [ ] Modify createTRPCContext to create request-scoped container
  - [ ] Bind PrismaClient to container from opts.db
  - [ ] Ensure container inherits from root container for @provide registrations
  - [ ] Update context type exports for router type inference
  - [ ] Test context creation in isolation
  - [ ] Verify existing routers compile without errors
- **Blockers**: Step 5, Step 6 (repositories and use cases ready)
- **Risks**:
  - **Type inference breaking** in tRPC routers
    - _Mitigation_: Careful type export, test with one router before all
  - **Container scoping issues** causing singleton vs request-scoped confusion
    - _Mitigation_: Document scope strategy, test with concurrent requests
  - **Memory leaks** from container instances
    - _Mitigation_: Ensure container cleanup, monitor memory in load tests
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: HIGH
- **Threshold**: 4.0/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | TRPCContext Augmentation | 0.25 | Container property added to TRPCContext interface | 1-5 |
  | Request Scoping | 0.20 | Request-scoped child containers created correctly | 1-5 |
  | PrismaClient Binding | 0.20 | PrismaClient bound per request | 1-5 |
  | Type Inference | 0.15 | Type inference works in router files | 1-5 |
  | Backward Compatibility | 0.10 | Existing context properties preserved | 1-5 |
  | Memory Management | 0.10 | No memory leaks from container instances | 1-5 |
- **Judge Type**: opus (critical integration verification)

---

### Phase 3: User Stories (Routers)

Pilot implementations demonstrating DI value and validating patterns.

#### Step 8: Migrate User Router to DI (Pilot)

- **Goal**: Convert user router to use container-based dependency resolution
- **Output**: Updated `apps/backend-server/src/routers/user.ts` using ctx.container
- **Agent**: `sonnet` (Standard development - router migration following established pattern)
- **Parallel with**: Step 9 (Challenge Router), Step 10 (Trip Router), Step 11 (Effect.ts Analysis) - All depend only on Step 7
- **Success Criteria**:
  ```
  Given user router procedures are updated
  When a request hits user.getById endpoint
  Then it uses ctx.container.get(UserController) instead of manual instantiation
  And response time is within 5% of baseline
  And all existing tests pass
  ```
- **Subtasks**:
  - [ ] Add @provide(TYPES.UserController) to UserController class
  - [ ] Add @inject(TYPES.UserRepository) to UserController constructor
  - [ ] Update user router to import container types
  - [ ] Replace manual controller instantiation with ctx.container.get(UserController)
  - [ ] Remove manual repository instantiation from user router
  - [ ] Run user router tests to verify functionality
  - [ ] Measure response time vs baseline
  - [ ] Document boilerplate reduction (count lines removed)
- **Blockers**: Step 7 (tRPC context with container)
- **Risks**:
  - **Router regression** affecting production endpoints
    - _Mitigation_: Comprehensive test coverage before deployment
  - **Developer confusion** with new pattern
    - _Mitigation_: Code review with team, pair programming session
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Controller Resolution | 0.25 | UserController resolves from container | 1-5 |
  | Repository Injection | 0.25 | UserRepository auto-injected into controller | 1-5 |
  | Endpoint Functionality | 0.20 | All user endpoints work correctly | 1-5 |
  | Performance | 0.15 | Response time within 5% of baseline | 1-5 |
  | Test Coverage | 0.15 | All existing user router tests pass | 1-5 |
- **Judge Type**: sonnet (router migration verification)

---

#### Step 9: Migrate Challenge Router to DI (Pilot)

- **Goal**: Convert challenge router to demonstrate pattern works across domains
- **Output**: Updated challenge router using container-based resolution
- **Agent**: `sonnet` (Standard development - router migration, similar pattern to User Router)
- **Parallel with**: Step 8 (User Router), Step 10 (Trip Router), Step 11 (Effect.ts Analysis) - All depend only on Step 7
- **Success Criteria**:
  ```
  Given challenge router uses container
  When challenge.create endpoint is called
  Then ChallengeController is resolved from container
  And ChallengeRepository is auto-injected into controller
  And all challenge endpoints work correctly
  ```
- **Subtasks**:
  - [ ] Add @provide(TYPES.ChallengeController) to ChallengeController
  - [ ] Add @inject(TYPES.ChallengeRepository) to ChallengeController constructor
  - [ ] Update challenge router to use ctx.container.get(ChallengeController)
  - [ ] Verify challenge creation, update, and query endpoints work
  - [ ] Run challenge router integration tests
  - [ ] Document any domain-specific issues encountered
- **Blockers**: Step 7 (tRPC context with container)
- **Risks**:
  - **Complex challenge use cases** (CreateChallengeUseCase with multiple steps)
    - _Mitigation_: Simplify pilot scope, handle complexity in Phase 4
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Controller Resolution | 0.25 | ChallengeController resolves from container | 1-5 |
  | Repository Injection | 0.25 | ChallengeRepository auto-injected | 1-5 |
  | Endpoint Functionality | 0.25 | All challenge endpoints work correctly | 1-5 |
  | Test Coverage | 0.15 | All existing challenge router tests pass | 1-5 |
  | Pattern Consistency | 0.10 | Follows same pattern as User router | 1-5 |
- **Judge Type**: sonnet (router migration verification)

---

#### Step 10: Migrate Trip Router to DI (Pilot)

- **Goal**: Complete pilot coverage with third domain (Trip)
- **Output**: Updated trip router demonstrating pattern consistency
- **Agent**: `sonnet` (Standard development - router migration, validates pattern across all 3 domains)
- **Parallel with**: Step 8 (User Router), Step 9 (Challenge Router), Step 11 (Effect.ts Analysis) - All depend only on Step 7
- **Success Criteria**:
  ```
  Given trip router is migrated
  When trip.create or trip.getById is called
  Then dependencies resolve correctly via container
  And pattern consistency is verified across all 3 pilot routers
  ```
- **Subtasks**:
  - [ ] Add @provide(TYPES.TripController) to TripController
  - [ ] Add @inject(TYPES.TripRepository) to TripController constructor
  - [ ] Update trip router to use container resolution
  - [ ] Verify trip endpoints work correctly
  - [ ] Run trip router tests
  - [ ] Compare boilerplate across user/challenge/trip routers
  - [ ] Document pattern for remaining 15 routers
- **Blockers**: Step 7 (tRPC context with container)
- **Risks**:
  - **Trip domain complexity** with location dependencies
    - _Mitigation_: Focus on core CRUD, defer location integration
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Controller Resolution | 0.25 | TripController resolves from container | 1-5 |
  | Repository Injection | 0.25 | TripRepository auto-injected | 1-5 |
  | Endpoint Functionality | 0.25 | All trip endpoints work correctly | 1-5 |
  | Test Coverage | 0.15 | All existing trip router tests pass | 1-5 |
  | Pattern Consistency | 0.10 | Consistent with User and Challenge routers | 1-5 |
- **Judge Type**: sonnet (router migration verification)

---

### Phase 4: Analysis & Polish

Effect.ts analysis and team enablement for ongoing DI usage.

#### Step 11: Conduct Effect.ts Analysis

- **Goal**: Analyze Effect.ts patterns vs current Result<T,E> implementation
- **Output**: Analysis document with migration recommendations
- **Agent**: `opus` (Complex analysis - 114 Result<T,E> imports, architectural comparison)
- **Parallel with**: Step 8 (User Router), Step 9 (Challenge Router), Step 10 (Trip Router) - Can run in parallel with router migrations
- **Success Criteria**:
  ```
  Given current Result<T,E> usage is documented (114 imports)
  When Effect.ts patterns are compared
  Then analysis identifies 3+ high-value use cases
  And provides Go/No-Go recommendation with effort estimates
  And documents Effect.ts Either vs Result<T,E> isomorphism
  ```
- **Subtasks**:
  - [ ] Document all 114 Result<T,E> import locations
  - [ ] Catalog current error handling patterns in use cases
  - [ ] Research Effect.ts Effect<A,E,R> vs async/await patterns
  - [ ] Identify high-value migration candidates (complex async flows)
  - [ ] Document Effect.ts learning curve and training requirements
  - [ ] Compare test patterns: Result<T,E> mocks vs Effect test layers
  - [ ] Write recommendation: Go with conditions / No-Go with rationale
  - [ ] Include migration effort estimate (hours + training)
- **Blockers**: Step 4 (container foundation established) - **NOTE: Can start early, parallel with Phase 3**
- **Risks**:
  - **Analysis paralysis** from over-researching Effect.ts
    - _Mitigation_: Time-box analysis to 1 day, focus on concrete use cases
  - **Premature optimization** recommendations
    - _Mitigation_: Ground analysis in actual codebase pain points
- **Effort**: M (6-8 hours)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Result Catalog Completeness | 0.30 | All 114 Result<T,E> import locations documented | 1-5 |
  | Analysis Depth | 0.25 | Effect.ts patterns thoroughly compared | 1-5 |
  | High-Value Candidates | 0.20 | 3+ high-value migration use cases identified | 1-5 |
  | Recommendation Clarity | 0.15 | Go/No-Go recommendation with clear rationale | 1-5 |
  | Effort Estimation | 0.15 | Migration effort estimates documented | 1-5 |
- **Judge Type**: sonnet (analysis quality verification)

---

#### Step 12: Create Effect.ts Pilot Recommendations

- **Goal**: Provide concrete guidance for potential Effect.ts adoption
- **Output**: Recommendation document with pilot use case and implementation plan
- **Agent**: `sonnet` (Standard development - document writing based on analysis)
- **Parallel with**: None (depends on Step 11)
- **Success Criteria**:
  ```
  Given Effect.ts analysis is complete
  When recommendations are reviewed
  Then they include specific use case for pilot implementation
  And provide before/after code examples
  And define success criteria for pilot
  ```
- **Subtasks**:
  - [ ] Select highest-value use case for Effect.ts pilot
  - [ ] Write before/after code comparison
  - [ ] Define pilot scope boundaries (what's in/out)
  - [ ] Create implementation plan for pilot (steps + effort)
  - [ ] Document success metrics for pilot evaluation
  - [ ] Include rollback plan if pilot fails
  - [ ] Get team feedback on recommendations
- **Blockers**: Step 11 (analysis complete)
- **Risks**:
  - **Recommendation rejection** by team
    - _Mitigation_: Present as options, not mandates; include trade-off analysis
- **Effort**: S (2-4 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Pilot Use Case Selection | 0.30 | Highest-value use case selected for pilot | 1-5 |
  | Code Examples | 0.25 | Before/after code comparison provided | 1-5 |
  | Scope Definition | 0.20 | Clear scope boundaries defined | 1-5 |
  | Implementation Plan | 0.15 | Step-by-step implementation plan with effort | 1-5 |
  | Success Metrics | 0.10 | Measurable success criteria defined | 1-5 |
- **Judge Type**: sonnet (recommendation quality verification)

---

#### Step 13: Update Documentation

- **Goal**: Create comprehensive documentation for DI patterns
- **Output**: Updated AGENTS.md, CLAUDE.md, and container setup guide
- **Agent**: `sonnet` (Standard development - guide writing, pattern documentation)
- **Parallel with**: None (depends on ALL pilot routers completed - Steps 8, 9, 10)
- **Success Criteria**:
  ```
  Given a developer wants to add a new repository
  When they read the container setup guide
  Then they can implement DI in <15 minutes
  And documentation includes troubleshooting section
  ```
- **Subtasks**:
  - [ ] Create `packages/frameworks/src/di/README.md` with setup guide
  - [ ] Update AGENTS.md with DI pattern section
  - [ ] Update CLAUDE.md with container conventions
  - [ ] Document @provide decorator usage pattern
  - [ ] Document @inject constructor parameter pattern
  - [ ] Add troubleshooting section for common DI issues
  - [ ] Include code examples for testing with DI
  - [ ] Document scope strategy (singleton vs transient vs request)
- **Blockers**: Step 10 (pilot routers complete, patterns validated) - **NOTE: Requires all 3 pilot routers**
- **Risks**:
  - **Documentation drift** from implementation changes
    - _Mitigation_: Review and update docs before task completion
- **Effort**: S (3-4 hours)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Setup Guide Completeness | 0.30 | Container setup guide covers all patterns | 1-5 |
  | AGENTS.md/CLAUDE.md Updates | 0.25 | Both files updated with DI patterns | 1-5 |
  | Code Examples | 0.20 | Working code examples provided | 1-5 |
  | Troubleshooting Section | 0.15 | 5+ common DI issues documented | 1-5 |
  | 15-Minute Test | 0.10 | New developer can implement DI in <15 min | 1-5 |
- **Judge Type**: sonnet (documentation quality verification)

---

#### Step 14: Team Knowledge Transfer

- **Goal**: Enable team to work effectively with new DI patterns
- **Output**: Team training session recording or documentation review
- **Agent**: `sonnet` (Standard development - session preparation, FAQ documentation)
- **Parallel with**: None (depends on Step 13 documentation)
- **Success Criteria**:
  ```
  Given team has access to documentation
  When they implement a new repository with DI
  Then they can complete it without additional guidance
  And they understand when to use @provide vs manual binding
  ```
- **Subtasks**:
  - [ ] Schedule team walkthrough session (30-60 min)
  - [ ] Create DI cheat sheet/quick reference
  - [ ] Demonstrate user router migration as example
  - [ ] Show testing patterns with container
  - [ ] Answer team questions and capture in FAQ
  - [ ] Update documentation with team feedback
  - [ ] Create video recording if team is distributed
- **Blockers**: Step 13 (documentation complete)
- **Risks**:
  - **Team resistance** to new patterns
    - _Mitigation_: Emphasize reduced boilerplate and improved testing
  - **Scheduling conflicts** for knowledge transfer session
    - _Mitigation_: Record session for async consumption
- **Effort**: S (2-3 hours)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Training Session Completed | 0.30 | Team walkthrough session held | 1-5 |
  | DI Cheat Sheet | 0.25 | Quick reference guide created | 1-5 |
  | FAQ Documented | 0.20 | Team questions captured with answers | 1-5 |
  | Examples Demonstrated | 0.15 | User router migration demonstrated | 1-5 |
  | Recording Available | 0.10 | Session recorded for async consumption | 1-5 |
- **Judge Type**: sonnet (training completeness verification)

---

### Verification Summary Table

| Step | Name                      | Verification Level | Threshold | Judge Type | Criteria Count |
| ---- | ------------------------- | ------------------ | --------- | ---------- | -------------- |
| 1    | Install Dependencies      | LOW                | 3.5/5.0   | sonnet     | 4              |
| 2    | Configure tsconfig        | MEDIUM             | 3.5/5.0   | sonnet     | 4              |
| 3    | Create Container          | HIGH               | 4.0/5.0   | opus       | 5              |
| 4    | Service Identifiers       | MEDIUM             | 3.5/5.0   | sonnet     | 4              |
| 5    | Migrate Repositories      | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 6    | Migrate Use Cases         | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 7    | Update tRPC Context       | HIGH               | 4.0/5.0   | opus       | 6              |
| 8    | User Router Pilot         | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 9    | Challenge Router Pilot    | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 10   | Trip Router Pilot         | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 11   | Effect.ts Analysis        | LOW                | 3.5/5.0   | sonnet     | 5              |
| 12   | Effect.ts Recommendations | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 13   | Update Documentation      | LOW                | 3.5/5.0   | sonnet     | 5              |
| 14   | Knowledge Transfer        | LOW                | 3.5/5.0   | sonnet     | 5              |

**Verification Breakdown:**

- **HIGH**: 2 steps (14.3%) - Critical infrastructure requiring panel judgment
- **MEDIUM**: 8 steps (57.1%) - Important patterns requiring single judge
- **LOW**: 4 steps (28.6%) - Documentation and low-risk tasks
- **NONE**: 0 steps (0%)

**Total Evaluations**: 65 criteria across 14 steps (avg 4.6 criteria per step)

**Judge Distribution:**

- **opus**: 2 steps (critical infrastructure - Steps 3, 7)
- **sonnet**: 12 steps (pattern application and documentation)

---

### Implementation Summary Table

| Step | Phase | Name                      | Priority | Effort | Blockers | Critical Path | Agent    | Parallel With                   |
| ---- | ----- | ------------------------- | -------- | ------ | -------- | ------------- | -------- | ------------------------------- |
| 1    | 1     | Install Dependencies      | P0       | XS     | None     | ✅ Yes        | `opus`   | None                            |
| 2    | 1     | Configure tsconfig        | P0       | XS     | Step 1   | ✅ Yes        | `opus`   | None                            |
| 3    | 1     | Create Container          | P0       | S      | Step 1,2 | ✅ Yes        | `opus`   | None                            |
| 4    | 1     | Service Identifiers       | P0       | S      | Step 3   | ✅ Yes        | `opus`   | None                            |
| 5    | 2     | Migrate Repositories      | P1       | M      | Step 4   | ✅ Yes        | `sonnet` | Step 6                          |
| 6    | 2     | Migrate Use Cases         | P1       | M      | Step 4   | ✅ Yes        | `sonnet` | Step 5                          |
| 7    | 2     | Update tRPC Context       | P1       | M      | Step 5,6 | ✅ Yes        | `opus`   | None                            |
| 8    | 3     | User Router Pilot         | P1       | M      | Step 7   | ✅ Yes        | `sonnet` | Steps 9, 10, 11                 |
| 9    | 3     | Challenge Router Pilot    | P2       | M      | Step 7   | ✅ Yes        | `sonnet` | Steps 8, 10, 11                 |
| 10   | 3     | Trip Router Pilot         | P2       | M      | Step 7   | ✅ Yes        | `sonnet` | Steps 8, 9, 11                  |
| 11   | 4     | Effect.ts Analysis        | P2       | M      | Step 4   | ❌ No         | `opus`   | Steps 8, 9, 10                  |
| 12   | 4     | Effect.ts Recommendations | P3       | S      | Step 11  | ❌ No         | `sonnet` | None                            |
| 13   | 4     | Update Documentation      | P2       | S      | Step 10  | ❌ No         | `sonnet` | None (needs Steps 8,9,10,11,12) |
| 14   | 4     | Knowledge Transfer        | P3       | S      | Step 13  | ❌ No         | `sonnet` | None                            |

**Total Steps**: 14  
**Critical Path Steps**: 10 (Steps 1-10)  
**Parallelizable Steps**: 6 (Steps 5-6, 8-11)  
**Maximum Parallel Depth**: 5 agents (Steps 8, 9, 10, 11 + support)  
**Total Estimated Effort**: 40-60 hours sequential / 24-30 hours parallel  
**Time Savings**: 10-15 hours (25-37% reduction) with parallel execution

---

### Parallelization Diagram

#### Visual Execution Flow

```
PHASE 1: SETUP (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Install Dependencies (opus)                           │
│   ↓                                                          │
│ Step 2: Configure tsconfig (opus)                           │
│   ↓                                                          │
│ Step 3: Create Container (opus)                             │
│   ↓                                                          │
│ Step 4: Service Identifiers (opus)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓

PHASE 2: FOUNDATIONAL (Parallel - 2 Agents)
────────────────────────────────────────────────────────────────
┌─────────────────────────────┐    ┌─────────────────────────────┐
│ Step 5: Migrate Repositories│    │ Step 6: Migrate Use Cases   │
│   (sonnet)                  │    │   (sonnet)                  │
│                             │    │                             │
│ • PrismaUserRepository      │    │ • GetUserUseCase            │
│ • PrismaChallengeRepository │    │ • GetChallengeUseCase       │
│ • PrismaGroupRepository     │    │ • GetGroupUseCase           │
└──────────────┬──────────────┘    └──────────────┬──────────────┘
               └──────────────────┬───────────────┘
                                  ↓

PHASE 2.5: INTEGRATION (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Update tRPC Context (opus)                           │
│                                                             │
│ • Add container to TRPCContext                              │
│ • Configure request-scoped child containers                 │
│ • Bind PrismaClient per request                             │
└─────────────────────────────────────────────────────────────┘
                              ↓

PHASE 3: USER STORIES (Parallel - 4 Agents Max)
────────────────────────────────────────────────────────────────
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ Step 8: User Router  │ │ Step 9: Challenge    │ │ Step 10: Trip Router │
│   (sonnet)           │ │   Router (sonnet)    │ │   (sonnet)           │
│                      │ │                      │ │                      │
│ • UserController     │ │ • ChallengeController│ │ • TripController     │
│ • user.ts migration  │ │ • challenge.ts       │ │ • trip.ts migration  │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
           └─────────────────────┬─────────────────────┘
                                  ↓

PHASE 4: ANALYSIS (Parallel - 1 Agent, runs WITH Phase 3)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 11: Effect.ts Analysis (opus)                           │
│   ↓                                                          │
│ Step 12: Recommendations (sonnet)                           │
│                                                             │
│ • 114 Result<T,E> imports                                   │
│ • Go/No-Go recommendation                                   │
│ • Pilot use case selection                                  │
└─────────────────────────────────────────────────────────────┘

PHASE 5: FINALIZATION (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 13: Update Documentation (sonnet)                       │
│   ↓                                                          │
│ Step 14: Knowledge Transfer (sonnet)                         │
│                                                             │
│ • AGENTS.md / CLAUDE.md updates                             │
│ • DI setup guide                                            │
│ • Team walkthrough session                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Execution Timeline

```
Time →
│
├─ 0-2h:    [opus] Step 1 (Dependencies)
├─ 2-3h:    [opus] Step 2 (tsconfig)
├─ 3-5h:    [opus] Step 3 (Container)
├─ 5-6h:    [opus] Step 4 (Service IDs)
│
├─ 6-10h:   [sonnet] Step 5 (Repositories) ──────────────┐
├─ 6-10h:   [sonnet] Step 6 (Use Cases) ─────────────────┤
│                                                        │
├─ 10-14h:  [opus] Step 7 (tRPC Context) ◄───────────────┘
│
├─ 14-18h:  [sonnet] Step 8 (User Router) ────┐
├─ 14-18h:  [sonnet] Step 9 (Challenge Router)├┐
├─ 14-18h:  [sonnet] Step 10 (Trip Router) ───┘│
├─ 14-20h:  [opus] Step 11 (Effect.ts Analysis)─┘
│
├─ 20-22h:  [sonnet] Step 12 (Recommendations)
├─ 22-24h:  [sonnet] Step 13 (Documentation)
└─ 24-26h:  [sonnet] Step 14 (Knowledge Transfer)
```

**Key Insight**: Maximum parallelization occurs between hours 14-18 when 4 agents can work simultaneously (3 routers + Effect analysis).

---

### Sub-Agent Execution Directive

#### Execution Strategy Overview

This task uses a **phased parallel execution** strategy with clear quality gates between phases. Steps within the same phase can execute in parallel; steps across phases have explicit dependencies.

#### How to Execute Steps in Parallel

**Phase 1 (Steps 1-4): Sequential Execution**

- Single `opus` agent executes all 4 steps in sequence
- No parallelization possible (each step builds on previous)
- Quality Gate: Foundation Complete (verify container resolves @provide decorated test class)

**Phase 2 (Steps 5-6): Dual Parallel Execution**

```yaml
Strategy:
  Type: Parallel
  Agents: 2 (both sonnet)
  Steps: [5, 6]

Execution:
  - Launch Sub-Agent A: Execute Step 5 (Repositories)
  - Launch Sub-Agent B: Execute Step 6 (Use Cases)
  - Both start immediately after Phase 1 completes
  - Wait for BOTH to complete before proceeding

Coordination:
  - Both sub-agents share the common test container setup utility
  - Avoid conflicts: Agent A creates utility, Agent B uses it
  - Communication via shared file: .specs/scratchpad/test-container-setup.ts
```

**Phase 3 (Steps 8-11): Multi-Way Parallel Execution**

```yaml
Strategy:
  Type: Parallel
  Max Agents: 4
  Steps: [8, 9, 10, 11]

Execution:
  - Launch Sub-Agent A (sonnet): Step 8 (User Router)
  - Launch Sub-Agent B (sonnet): Step 9 (Challenge Router)
  - Launch Sub-Agent C (sonnet): Step 10 (Trip Router)
  - Launch Sub-Agent D (opus): Step 11 (Effect.ts Analysis)

Coordination:
  - All 4 agents can run simultaneously after Phase 2.5 (Step 7) completes
  - Steps 8, 9, 10 have NO dependencies on each other
  - Step 11 also has NO dependency on Steps 8, 9, 10 (only needs Step 4)
  - Agents 8, 9, 10 share pattern knowledge via documentation
  - Agent 11 operates independently on code analysis
```

#### Required Context to Pass to Sub-Agents

**Every sub-agent MUST receive:**

1. **Task Reference**: Full path to this task file
2. **Step Assignment**: Explicit step number and name
3. **Agent Type**: Which agent model to use (`opus` vs `sonnet`)
4. **Parallel Group**: Which other steps run in parallel (for coordination)
5. **Blocking Steps**: Which steps must complete before this one starts
6. **Quality Gate**: How to verify step completion
7. **File Paths**: Specific files to create/modify
8. **Code Examples**: Pattern templates to follow
9. **Risks & Mitigations**: What to watch out for
10. **Rollback Plan**: How to revert if issues arise

**Example Context Object:**

```json
{
  "taskFile": ".specs/tasks/draft/implement-inversify-dependency-injection.refactor.md",
  "step": 8,
  "stepName": "Migrate User Router to DI (Pilot)",
  "agentType": "sonnet",
  "parallelWith": [9, 10, 11],
  "blockedBy": [7],
  "qualityGate": "User router uses ctx.container.get(UserController)",
  "filesToModify": [
    "apps/backend-server/src/routers/user.ts",
    "packages/adapters/src/controllers/user-controller.ts"
  ],
  "patternTemplate": "Use @provide(TYPES.UserController) and @inject decorators",
  "risks": ["Router regression affecting production endpoints"],
  "rollback": "Revert to manual instantiation in user.ts"
}
```

#### Quality Gates Between Phases

**Gate 1: Foundation Complete** (After Step 4)

```yaml
Checklist:
  - [ ] Container resolves a test class decorated with @provide
  - [ ] bun.lock includes inversify, @inversifyjs/binding-decorators, reflect-metadata
  - [ ] TypeScript compiles without errors (bunx tsc --noEmit)
  - [ ] Zero dependency-cruiser violations from new di/ directory
  - [ ] TYPES object exports all required symbols
Verification:
  Run: bun test packages/frameworks/src/di/container.test.ts
```

**Gate 2: Domain Layer Ready** (After Steps 5 & 6)

```yaml
Checklist:
  - [ ] PrismaUserRepository resolves from container
  - [ ] PrismaChallengeRepository resolves from container
  - [ ] PrismaGroupRepository resolves from container
  - [ ] GetUserUseCase resolves with injected UserRepository
  - [ ] All existing repository tests pass
  - [ ] All existing use case tests pass
  - [ ] Test container utility created and documented
Verification:
  Run: bun test packages/adapters/src/gateways/
  Run: bun test packages/use-cases/src/interactors/
```

**Gate 3: Integration Complete** (After Step 7)

```yaml
Checklist:
  - [ ] TRPCContext interface includes container property
  - [ ] createTRPCContext creates request-scoped child container
  - [ ] Container can resolve UserRepository with bound PrismaClient
  - [ ] Type inference works in router files
  - [ ] Existing routers compile without errors
  - [ ] No memory leaks in container creation (run stress test)
Verification:
  Run: bun test packages/adapters/src/api/trpc.test.ts
  Run: bun run build (verify no type errors)
```

**Gate 4: Pilots Complete** (After Steps 8, 9, 10)

```yaml
Checklist:
  - [ ] User router migrated and all tests pass
  - [ ] Challenge router migrated and all tests pass
  - [ ] Trip router migrated and all tests pass
  - [ ] Response time within 5% of baseline for all 3 routers
  - [ ] Boilerplate reduction measured and documented
  - [ ] Pattern consistency verified across all 3 domains
Verification:
  Run: bun test apps/backend-server/src/routers/user.test.ts
  Run: bun test apps/backend-server/src/routers/challenge.test.ts
  Run: bun test apps/backend-server/src/routers/trip.test.ts
  Check: Performance benchmarks vs baseline
```

**Gate 5: Analysis Complete** (After Steps 11, 12)

```yaml
Checklist:
  - [ ] Effect.ts analysis document exists
  - [ ] 114 Result<T,E> imports catalogued
  - [ ] 3+ high-value use cases identified
  - [ ] Go/No-Go recommendation provided with rationale
  - [ ] Pilot use case selected with implementation plan
  - [ ] Migration effort estimate documented
Verification:
  Review: .specs/analysis/effect-ts-analysis.md
  Review: .specs/analysis/effect-ts-recommendations.md
```

**Final Gate: Ready for Knowledge Transfer** (After Step 13)

```yaml
Checklist:
  - [ ] packages/frameworks/src/di/README.md complete
  - [ ] AGENTS.md updated with DI pattern section
  - [ ] CLAUDE.md updated with container conventions
  - [ ] Troubleshooting guide includes 5+ common issues
  - [ ] Code examples for testing with DI provided
  - [ ] Scope strategy documented (singleton vs transient vs request)
Verification:
  Review: All documentation files
  Test: New developer can implement DI in <15 minutes (timeboxed)
```

#### Example Sub-Agent Prompts

**Prompt for Parallel Repository Migration (Step 5):**

```
You are a sonnet sub-agent assigned to execute Step 5 of the InversifyJS implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-inversify-dependency-injection.refactor.md
- Your Step: 5 (Migrate Repositories to @injectable)
- Running Parallel With: Step 6 (Migrate Use Cases)
- Blocked Until: Step 4 completes
- Agent Type: sonnet (standard development)

YOUR ASSIGNMENT:
Decorate 3 pilot repositories with @provide and @inject decorators:
1. PrismaUserRepository
2. PrismaChallengeRepository
3. PrismaGroupRepository

CRITICAL PATTERNS:
- Add `import "reflect-metadata"` at TOP of each file
- Use @provide(TYPES.RepositoryName) on the class
- Use @inject(TYPES.PrismaClient) in constructor
- Keep backward-compatible constructors (optional injection)

OUTPUT FILES:
- packages/adapters/src/gateways/PrismaUserRepository.ts
- packages/adapters/src/gateways/PrismaChallengeRepository.ts
- packages/adapters/src/gateways/PrismaGroupRepository.ts
- packages/adapters/src/gateways/__tests__/container-resolution.test.ts (new)

QUALITY GATE:
- All 3 repositories resolve from container in test
- Existing repository tests still pass
- Zero dependency-cruiser violations

COORDINATION NOTES:
- Step 6 (Use Cases) is running in parallel
- Create the test container utility FIRST so they can use it
- Utility location: packages/frameworks/src/di/test-container.ts

REPORT BACK:
When complete, report:
1. Test results (all passing?)
2. Lines of code added/removed
3. Any blockers encountered
4. Files modified
```

**Prompt for Parallel Use Case Migration (Step 6):**

```
You are a sonnet sub-agent assigned to execute Step 6 of the InversifyJS implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-inversify-dependency-injection.refactor.md
- Your Step: 6 (Migrate Use Cases to @injectable)
- Running Parallel With: Step 5 (Migrate Repositories)
- Blocked Until: Step 4 completes
- Agent Type: sonnet (standard development)

YOUR ASSIGNMENT:
Decorate 3-5 pilot use cases with @injectable and @inject decorators:
1. GetUserUseCase
2. GetChallengeUseCase
3. GetGroupUseCase
(+ 2 more as time permits)

CRITICAL PATTERNS:
- Use @injectable() on the class
- Use @inject(TYPES.RepositoryName) in constructor
- Remove manual repository instantiation from tests
- Use test container utility (created by Step 5 agent)

OUTPUT FILES:
- packages/use-cases/src/interactors/GetUserUseCase.ts (modified)
- packages/use-cases/src/interactors/GetChallengeUseCase.ts (modified)
- packages/use-cases/src/interactors/GetGroupUseCase.ts (modified)
- packages/use-cases/src/interactors/__tests__/container-based.test.ts (new)

QUALITY GATE:
- All use cases resolve from container with injected repositories
- Existing use case tests pass with new container setup
- Can swap repository implementations via container.rebind()

COORDINATION NOTES:
- Step 5 (Repositories) is running in parallel
- Wait for test-container.ts utility to be created
- Import utility from: packages/frameworks/src/di/test-container

REPORT BACK:
When complete, report:
1. Test results (all passing?)
2. Use cases migrated (count)
3. Test setup time reduction (estimate)
4. Any blockers encountered
```

**Prompt for Parallel Router Migration (Step 8, 9, or 10):**

```
You are a sonnet sub-agent assigned to execute Step {{stepNumber}} of the InversifyJS implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-inversify-dependency-injection.refactor.md
- Your Step: {{stepNumber}} ({{stepName}})
- Running Parallel With: Steps 8, 9, 10, 11 (all router pilots + Effect analysis)
- Blocked Until: Step 7 completes
- Agent Type: sonnet (standard development)

YOUR ASSIGNMENT:
Migrate {{domain}} router to use container-based dependency resolution:
- Decorate {{domain}}Controller with @provide and @inject
- Update {{domain}} router to use ctx.container.get()
- Remove manual repository/controller instantiation
- Measure and document boilerplate reduction

CRITICAL PATTERNS:
- @provide(TYPES.{{domain}}Controller) on class
- @inject(TYPES.{{domain}}Repository) in constructor
- Replace: `new {{domain}}Controller(repo)` → `ctx.container.get(TYPES.{{domain}}Controller)`
- Router file: apps/backend-server/src/routers/{{domainLower}}.ts

OUTPUT FILES:
- packages/adapters/src/controllers/{{domainLower}}-controller.ts (modified)
- apps/backend-server/src/routers/{{domainLower}}.ts (modified)

QUALITY GATE:
- All {{domain}} endpoints work correctly via container
- Response time within 5% of baseline
- All existing router tests pass
- Boilerplate lines counted (before/after)

COORDINATION NOTES:
- Other router migrations running in parallel (User, Challenge, Trip)
- Share learnings via: .specs/scratchpad/router-migration-notes.md
- Document any domain-specific issues encountered

REPORT BACK:
When complete, report:
1. Test results (all passing?)
2. Boilerplate reduction (lines removed)
3. Performance comparison (vs baseline)
4. Any issues or deviations from pattern
```

**Prompt for Effect.ts Analysis (Step 11):**

```
You are an opus sub-agent assigned to execute Step 11 of the InversifyJS implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-inversify-dependency-injection.refactor.md
- Your Step: 11 (Conduct Effect.ts Analysis)
- Running Parallel With: Steps 8, 9, 10 (router migrations)
- Blocked Until: Step 4 completes (foundation ready)
- Agent Type: opus (complex analysis)

YOUR ASSIGNMENT:
Analyze Effect.ts patterns vs current Result<T,E> implementation:
- Catalog all 114 Result<T,E> import locations
- Compare Effect.ts Either<A,E> vs Result<T,E>
- Identify 3+ high-value migration candidates
- Provide Go/No-Go recommendation with rationale

ANALYSIS SCOPE:
1. Current State:
   - Find all Result<T,E> imports in codebase
   - Document error handling patterns in use cases
   - Catalog async/await complexity levels

2. Effect.ts Comparison:
   - Either<A,E> vs Result<T,E> isomorphism
   - Effect<A,E,R> for async operations
   - Test layer patterns vs current mocks
   - Learning curve and training requirements

3. Recommendations:
   - Go/No-Go decision criteria
   - 3+ high-value use case candidates
   - Migration effort estimate (hours + training)
   - Pilot implementation plan (if Go)

OUTPUT FILES:
- .specs/analysis/effect-ts-analysis.md (detailed comparison)
- .specs/analysis/effect-ts-imports-catalog.md (114 locations)
- .specs/analysis/effect-ts-use-case-candidates.md (top 3)

QUALITY GATE:
- Analysis document identifies specific use cases with before/after code
- Effort estimate includes training time for team
- Recommendation includes rollback plan

TIME BOUND:
- 6-8 hours maximum (avoid analysis paralysis)
- Focus on concrete, high-value use cases only

COORDINATION NOTES:
- Independent from router migrations (no shared files)
- Can proceed as soon as Step 4 completes
- No coordination needed with other parallel agents

REPORT BACK:
When complete, report:
1. Go/No-Go recommendation
2. Top 3 use case candidates with effort estimates
3. Key findings summary (1 page)
```

---

### Definition of Done

The task is considered complete when all of the following are true:

1. **Acceptance Criteria Met** (AC1-AC7):
   - ✅ AC1: Container resolves UserController with auto-wired dependencies
   - ✅ AC2: @provide() decorator auto-registers repositories
   - ✅ AC3: 3 repositories resolve without manual instantiation
   - ✅ AC4: User router uses container (proof of concept)
   - ✅ AC5: Test container supports mock repository injection
   - ✅ AC6: Effect.ts analysis document with recommendations exists
   - ✅ AC7: Developer can implement DI in <15 minutes with guide

2. **Quality Gates**:
   - ✅ All existing tests pass (unit + integration)
   - ✅ Zero dependency-cruiser violations
   - ✅ No TypeScript compilation errors
   - ✅ CI/CD pipeline green
   - ✅ Code coverage maintained or improved

3. **Documentation Complete**:
   - ✅ Container setup guide exists
   - ✅ AGENTS.md updated with DI patterns
   - ✅ CLAUDE.md updated with conventions
   - ✅ Troubleshooting guide exists

4. **Team Enablement**:
   - ✅ Knowledge transfer session completed
   - ✅ Team can implement new DI-enabled repositories
   - ✅ FAQ document addresses common questions

5. **Metrics**:
   - ✅ Boilerplate reduction measured (target: 30%+ reduction in router code)
   - ✅ Response time overhead <5% vs baseline
   - ✅ Test setup time reduction documented

---

### Critical Path (Optimized with Parallelization)

**Critical Path Definition**: The minimum sequence of steps required for the core DI implementation, accounting for maximum parallel execution.

**Optimized Critical Path**: **Steps 1 → 2 → 3 → 4 → (5||6) → 7 → (8||9||10||11) → 12 → 13 → 14**

```
Phase 1: Setup (Steps 1-4) - Sequential, 1 Agent
├─ Step 1: Install Dependencies (opus)
├─ Step 2: Configure tsconfig (opus)
├─ Step 3: Create Container (opus)
└─ Step 4: Service Identifiers (opus)
           ↓
Phase 2: Foundational (Steps 5-7) - Parallel Phase 2
├─ Step 5: Migrate Repositories (sonnet) ──┐
├─ Step 6: Migrate Use Cases (sonnet) ──────┤ Parallel (2 agents)
└─ Step 7: Update tRPC Context (opus) ◄────┘
           ↓
Phase 3: User Stories (Steps 8-11) - Maximum Parallelism (4-5 Agents)
├─ Step 8: User Router Pilot (sonnet) ──────┐
├─ Step 9: Challenge Router Pilot (sonnet)  ├┐
├─ Step 10: Trip Router Pilot (sonnet) ────┤│ Parallel (3-4 agents)
└─ Step 11: Effect.ts Analysis (opus) ─────┘│
           ↓                                │
Phase 4: Finalization (Steps 12-14) ────────┘
├─ Step 12: Effect.ts Recommendations (sonnet)
├─ Step 13: Update Documentation (sonnet)
└─ Step 14: Knowledge Transfer (sonnet)
```

**Parallelization Summary**:

| Phase           | Steps | Agents            | Duration | Cumulative |
| --------------- | ----- | ----------------- | -------- | ---------- |
| 1. Setup        | 1-4   | 1 opus            | 6 hours  | 6 hours    |
| 2. Foundational | 5-7   | 2 sonnet + 1 opus | 8 hours  | 14 hours   |
| 3. User Stories | 8-11  | 3 sonnet + 1 opus | 6 hours  | 20 hours   |
| 4. Finalization | 12-14 | 1 sonnet          | 6 hours  | 26 hours   |

**Critical Path Duration**:

- **Sequential**: ~40-60 hours (all steps in series)
- **Optimized**: ~26 hours (with parallel execution)
- **Time Savings**: 14-34 hours (35-57% reduction)

**Maximum Parallel Depth**: **5 Agents**
At peak (Phase 3), can run:

- 3 sonnet agents on router migrations (Steps 8, 9, 10)
- 1 opus agent on Effect.ts analysis (Step 11)
- 1 opus agent on tRPC Context (Step 7, if timing overlaps)

**Effort Distribution by Agent Type**:

- **opus**: 6 steps (1, 2, 3, 4, 7, 11) - Foundation + Critical Integrations
- **sonnet**: 8 steps (5, 6, 8, 9, 10, 12, 13, 14) - Pattern Application
- **haiku**: 0 steps (all require substantial complexity)

---

### High Priority Risks

| Rank  | Risk                          | Likelihood | Impact | Mitigation Strategy                                                                                                                                               |
| ----- | ----------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Decorator Metadata Issues** | Medium     | High   | Test reflect-metadata with Bun immediately in Step 1; have fallback to manual binding decorators if needed; validate with minimal test case before full migration |
| **2** | **Circular Dependencies**     | Low        | High   | Run dependency-cruiser after each phase; use dependency visualization to catch cycles early; consider ContainerModule split if cycles emerge                      |
| **3** | **Test Mocking Complexity**   | Medium     | Medium | Create shared `createTestContainer()` utility; document rebind patterns; include test examples in documentation                                                   |
| **4** | **tRPC Context Type Breaks**  | Medium     | High   | Validate type changes with one router before all; maintain backward-compatible context properties; use TypeScript strict checking                                 |
| **5** | **Container Scope Confusion** | Medium     | Medium | Document scope strategy clearly (singleton repos, transient use cases); test with concurrent requests; add runtime validation in development                      |

**Risk Monitoring**:

- Weekly risk review during implementation
- Stop-work criteria if Risk #1 or #4 materializes (rollback to manual DI)
- Risk #3 and #5 can be addressed during implementation without stopping work

---

## Architecture Overview

### Solution Strategy

#### How InversifyJS Fits into Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│  Frameworks Layer                      │
│  - Container configuration              │
│  - DI container lives here             │
│  - ContainerModule definitions          │
├─────────────────────────────────────────┤
│  Adapters Layer                        │
│  - Controllers: @injectable             │
│  - Repositories: @provide()             │
│  - Receive injected deps               │
├─────────────────────────────────────────┤
│  Use Cases Layer                       │
│  - Interactors: @injectable             │
│  - Receive injected repos              │
├─────────────────────────────────────────┤
│  Domain Layer                          │
│  - Pure logic (no DI needed)           │
└─────────────────────────────────────────┘
```

The container lives in the Frameworks layer as it is an infrastructure/framework concern. Adapters receive dependencies via constructor injection, maintaining Clean Architecture's inward dependency direction.

#### Container Lifecycle

| Component    | Scope     | Rationale                                    |
| ------------ | --------- | -------------------------------------------- |
| PrismaClient | Singleton | Connection pooling, expensive initialization |
| Repositories | Singleton | Stateless, hold PrismaClient reference       |
| Use Cases    | Transient | Request-scoped business logic                |
| Controllers  | Transient | Per-request handling                         |

**Reasoning**: PrismaClient and repositories are stateless and expensive to create, making them ideal for singleton scope. Use cases and controllers encapsulate request-specific logic and should be transient.

#### Migration Strategy

**Approach**: Incremental (Pilot → Validate → Expand)

1. **Setup Phase** (2-4 hours): Install packages, configure tsconfig.json, create container setup
2. **Pilot Phase** (8-16 hours): Migrate 3 repositories (User, Challenge, Group), 1 controller (UserController), and 1 router (user.ts)
3. **Validation Phase** (4-8 hours): Run test suite, validate CI passes, gather developer feedback
4. **Expansion Phase** (Future work): Roll out to remaining 13 repositories and 17 routers

**Rationale**: Incremental migration minimizes risk while allowing pattern refinement before full rollout. Backward compatibility is maintained—existing manual DI continues to work alongside container-based DI.

#### Effect.ts Analysis Approach

**Approach**: Analysis only (no implementation)

Effect.ts represents a paradigm shift from the current `Result<T,E>` pattern to functional programming with `Effect<A,E,R>`. The analysis will:

- Document current `Result<T,E>` usage patterns (114 imports across codebase)
- Compare with Effect.ts `Either<A,E>` patterns
- Identify 3+ high-value migration candidates (complex async flows, retry scenarios)
- Provide Go/No-Go recommendation with effort estimates

**Rationale**: Full Effect.ts migration would require 280-520 hours and team training. Current `Result<T,E>` implementation is sufficient. Effect.ts adoption should be evaluated for greenfield modules post-MVP.

### Key Architectural Decisions

#### KD1: InversifyJS vs tsyringe

**Decision**: InversifyJS

**Reasoning**:

- Mature ecosystem with binding-decorators package (~60% boilerplate reduction)
- Superior TypeScript decorator metadata support
- Container hierarchy enables testing overrides
- Minimal bundle size (~5KB)
- Active maintenance (v8.0.0 recently released)
- Proven in large TypeScript codebases

**Rejected Alternative**: tsyringe (Microsoft) - while capable, lacks the binding-decorators ecosystem that gives InversifyJS an edge.

#### KD2: binding-decorators vs Manual Registration

**Decision**: binding-decorators (`@provide()` decorator)

**Reasoning**:

- ~60% reduction in container setup boilerplate
- Bindings co-located with implementations improves discoverability
- Scope declarations in decorator: `@provide(TYPES.Cache).inSingletonScope()`
- Manual binding still available for complex scenarios
- Aligns with codebase preference for co-location (existing repository pattern)

**Trade-off**: Less dynamic flexibility, but codebase does not require dynamic bindings.

#### KD3: Container Placement

**Decision**: `packages/frameworks/src/di/`

**Reasoning**:

- Container is a framework/infrastructure concern
- Adapters layer receives dependencies, does not define container
- Follows Clean Architecture dependency direction (inward)
- Test setup can override bindings without modifying adapters

**Rejected Alternative**: `packages/adapters/src/di/` would violate Clean Architecture by placing infrastructure in the adapters layer.

#### KD4: Effect.ts Implementation Scope

**Decision**: Analysis only for this task

**Reasoning**:

- Task scope limited to InversifyJS implementation (AC1-AC5)
- Effect analysis fulfills AC6 without implementation
- 145+ files would require modification for full migration
- Team learning curve requires 40+ hours training
- Current `Result<T,E>` pattern is adequate for existing needs
- Recommends greenfield module evaluation post-Inversify stabilization

### Component Overview

#### Container Configuration

```typescript
// Service Identifiers
// packages/frameworks/src/di/types.ts
export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),
  UserRepository: Symbol.for("UserRepository"),
  ChallengeRepository: Symbol.for("ChallengeRepository"),
  GroupRepository: Symbol.for("GroupRepository"),
  UserController: Symbol.for("UserController"),
  // ... additional identifiers
};

// Container Setup
// packages/frameworks/src/di/container.ts
import { Container } from "inversify";
import { buildProviderModule } from "@inversifyjs/binding-decorators";

export const container = new Container();
container.load(buildProviderModule()); // Auto-loads all @provide decorators
```

#### Module Organization

```
packages/
├── frameworks/src/di/
│   ├── types.ts           # Service identifiers (symbols)
│   ├── container.ts       # Container configuration
│   └── index.ts           # Public exports
├── adapters/src/
│   ├── gateways/          # Repositories with @provide decorators
│   └── controllers/       # Controllers with @injectable decorators
└── use-cases/src/
    └── interactors/       # Use cases with @injectable decorators
```

#### Decorator Usage Patterns

**Repository Pattern**:

```typescript
@provide(TYPES.UserRepository)
class PrismaUserRepository
  extends BasePrismaRepository<User>
  implements UserRepository
{
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}
}
```

**Controller Pattern**:

```typescript
@provide(TYPES.UserController)
class UserController {
  constructor(@inject(TYPES.UserRepository) private repo: UserRepository) {}
}
```

### Contract/Interface Definitions

#### Service Identifiers (Symbols)

| Identifier          | Symbol Value            | Bound To                  | Scope     |
| ------------------- | ----------------------- | ------------------------- | --------- |
| PrismaClient        | `"PrismaClient"`        | PrismaClient              | Singleton |
| UserRepository      | `"UserRepository"`      | PrismaUserRepository      | Singleton |
| ChallengeRepository | `"ChallengeRepository"` | PrismaChallengeRepository | Singleton |
| GroupRepository     | `"GroupRepository"`     | PrismaGroupRepository     | Singleton |
| UserController      | `"UserController"`      | UserController            | Transient |

#### Container Interfaces

```typescript
// Extended TRPCContext with container
export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  container: Container; // NEW: Inversify container
}

// Test container factory
export function createTestContainer(): Container {
  const container = new Container();
  container.load(buildProviderModule());
  return container;
}
```

#### Factory Patterns

**Before (Manual)**:

```typescript
const repo = new PrismaUserRepository(ctx.db);
const controller = new UserController(repo);
```

**After (Container)**:

```typescript
const controller = ctx.container.get<UserController>(TYPES.UserController);
```

### Expected Changes

#### New Files (6)

| File                | Location                      | Purpose                               |
| ------------------- | ----------------------------- | ------------------------------------- |
| types.ts            | `packages/frameworks/src/di/` | Service identifiers (symbols)         |
| container.ts        | `packages/frameworks/src/di/` | Container configuration               |
| index.ts            | `packages/frameworks/src/di/` | Public exports                        |
| RepositoryModule.ts | `packages/adapters/src/di/`   | Manual repository bindings (fallback) |
| UseCaseModule.ts    | `packages/use-cases/src/di/`  | Manual use case bindings (fallback)   |
| ControllerModule.ts | `packages/adapters/src/di/`   | Manual controller bindings (fallback) |

#### Files to Modify (Pilot Scope)

| Layer     | File                           | Changes                                                  |
| --------- | ------------------------------ | -------------------------------------------------------- |
| Framework | `tsconfig.json`                | Enable `experimentalDecorators`, `emitDecoratorMetadata` |
| Adapters  | `PrismaUserRepository.ts`      | Add `@provide(TYPES.UserRepository)` decorator           |
| Adapters  | `PrismaChallengeRepository.ts` | Add `@provide(TYPES.ChallengeRepository)` decorator      |
| Adapters  | `PrismaGroupRepository.ts`     | Add `@provide(TYPES.GroupRepository)` decorator          |
| Adapters  | `user-controller.ts`           | Add `@provide` and `@inject` decorators                  |
| Adapters  | `api/trpc.ts`                  | Add container to TRPCContext                             |
| Adapters  | `api/controllers/index.ts`     | Use `container.get()` instead of `new`                   |
| Apps      | `routers/user.ts`              | Update to use `ctx.container`                            |
| Tests     | User-related tests             | Container-based test setup                               |

### Integration Points

#### IP1: tRPC Context Creation

**Location**: `packages/adapters/src/api/trpc.ts`

**Integration**: Container is attached to TRPCContext at request creation time, enabling dependency resolution throughout the request lifecycle.

```typescript
export const createTRPCContext = (opts: { db; supabase; headers }) => {
  const requestContainer = new Container({ parent: rootContainer });
  requestContainer.bind(TYPES.PrismaClient).toConstantValue(opts.db);

  return {
    db: opts.db,
    supabase: opts.supabase,
    container: requestContainer,
  };
};
```

#### IP2: Repository Instantiation

**Location**: All repository usage in routers/controllers

**Integration**: Repositories are resolved from container instead of manual instantiation. BasePrismaRepository pattern maintained with PrismaClient injected via constructor.

```typescript
// Before
const repo = new PrismaUserRepository(ctx.db);

// After
const repo = ctx.container.get<UserRepository>(TYPES.UserRepository);
```

#### IP3: Use Case Creation

**Location**: Controller methods

**Integration**: Use cases receive injected repositories via constructor. Container resolves full dependency chain automatically.

```typescript
@provide(TYPES.GetUserUseCase)
class GetUserUseCase {
  constructor(@inject(TYPES.UserRepository) private repo: UserRepository) {}
}
```

#### IP4: Controller Resolution

**Location**: tRPC routers

**Integration**: Controllers are resolved from container, which cascades to resolve all dependencies (use cases, repositories).

```typescript
// Before
const controller = new UserController(repo);

// After
const controller = ctx.container.get<UserController>(TYPES.UserController);
```

#### IP5: Test Mocking

**Location**: Test files

**Integration**: Test containers can rebind implementations, enabling easy mocking without manual constructor injection.

```typescript
const container = createTestContainer();
container.rebind(TYPES.UserRepository).to(InMemoryUserRepository);
const useCase = container.get(GetUserUseCase); // Uses mock automatically
```

## Implementation Notes

### Technology Choices

| Technology         | Purpose              | Status                  |
| ------------------ | -------------------- | ----------------------- |
| InversifyJS        | IoC Container for DI | **Primary deliverable** |
| Binding Decorators | Auto-registration    | **Primary deliverable** |
| Effect.ts          | Structured effects   | **Analysis only**       |

### Architecture Alignment

This implementation aligns with Clean Architecture principles:

```
Frameworks Layer (container lives here)
      ↑
Adapters Layer (controllers receive injected dependencies)
      ↑
Use Cases Layer (use cases receive injected repositories)
      ↑
Domain Layer (pure, no dependencies)
```

### Risk Mitigation

1. **Gradual migration**: Only 3 repositories as pilot
2. **Backward compatibility**: Existing code continues to work
3. **Rollback plan**: Can revert to manual DI if issues arise
4. **Testing**: Comprehensive tests before expanding to full codebase

## Success Metrics

- [ ] Lines of boilerplate reduced in pilot routers
- [ ] Time to add new repository (measured vs current)
- [ ] Test setup time reduction
- [ ] Developer satisfaction (post-implementation survey)

## References

- InversifyJS: https://inversify.io/
- Binding Decorators: https://inversify.io/docs/ecosystem/binding-decorators/
- Effect.ts: https://effect.website/docs
- Current repository pattern: `packages/adapters/src/gateways/BasePrismaRepository.ts`

## Research References

This task has been researched and documented. The following resources are available:

### Skill Documentation

- **Path:** `.claude/skills/inversify-effect-integration/SKILL.md`
- **Contents:**
  - Executive summary of both technologies
  - Complete InversifyJS overview with code examples
  - Binding-decorators overview with comparison to manual binding
  - Effect.ts overview with Either and Effect patterns
  - Detailed comparison: Effect.ts vs Result<T,E>
  - Integration patterns for Clean Architecture/DDD
  - Installation requirements
  - Best practices and common pitfalls
  - Resources and references section

### Research Scratchpad

- **Path:** `.specs/scratchpad/research-inversify-effect.md`
- **Contents:**
  - Raw research notes from all documentation sources
  - Code examples collected
  - Compatibility analysis with current architecture
  - Limitations and gotchas identified
  - Migration complexity assessment
  - Decision recommendations
  - 11 documentation resources analyzed

### Key Research Findings

1. **InversifyJS** provides mature, type-safe DI with minimal overhead (~5KB)
2. **Binding-decorators** can reduce container setup code by ~60%
3. **Effect Either** is isomorphic to current `Result<T,E>` with better ergonomics
4. **Effect** offers significant additional capabilities beyond simple error handling
5. Both libraries align well with DDD/Clean Architecture principles
6. Migration should prioritize InversifyJS first (foundational), then evaluate Effect

### Resources Gathered

- InversifyJS official documentation (main site + 4 sub-pages)
- Effect.ts official documentation (main site + 4 sub-pages)
- Current codebase Result<T,E> implementation analysis
- Community resources (Discord, GitHub)

**Total Resources:** 11 documentation sources + 1 codebase analysis

---

_Research completed on 2026-04-09_
