---
title: Implement awilix-modular for dependency injection and analyze Effect.ts for boilerplate reduction
---

## Initial User Prompt

Use https://github.com/wildstyles/awilix-modular for dependency injection; also analyse the use of https://effect.website/docs to reduce the boilerplate code

## Description

### What and Why

**awilix-modular** is a powerful modular dependency injection framework built on top of awilix. It enables dependency injection through module organization and automatic resolution, providing:

- **No experimental TypeScript features needed** - Unlike InversifyJS, no decorators or reflect-metadata required
- **Better type safety** with automatic ModuleDef inference - Types are inferred automatically without manual service identifiers
- **Modular organization** similar to NestJS - Clean separation of concerns with @Module() decorators
- **Framework-agnostic design** compatible with Clean Architecture
- **Testability** through easy implementation swapping at module level

**awilix-modular** benefits include:

- No `experimentalDecorators` or `emitDecoratorMetadata` needed in tsconfig
- No `reflect-metadata` dependency to install and import
- Automatic type inference eliminates symbol/string service identifiers
- Module-based organization scales better than flat container bindings
- Request-scoped lifecycle support out of the box

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
2. **Improved testability**: Swap implementations at module level
3. **Better separation**: Framework layer manages container, use cases remain pure
4. **Scalable patterns**: Easy to add new repositories following established module pattern
5. **No TypeScript configuration changes**: Works with current tsconfig settings
6. **Effect.ts potential**: Analyze structured effects for complex use cases

## Acceptance Criteria

### Given-When-Then Format

**AC1: awilix-modular Core Integration**

```
Given the container is configured with modules
When I request a UserController from the container
Then it should resolve with all dependencies auto-wired
And no manual service identifiers are required
```

**AC2: Module Decorator Configuration**

```
Given @Module() decorator is applied to RepositoryModule
When the container loads
Then all repositories should be auto-registered as a module
And dependencies should be resolvable by type inference
```

**AC3: Repository Migration (Pilot)**

```
Given PrismaUserRepository, PrismaChallengeRepository, and PrismaGroupRepository are in modules
When any tRPC procedure requests these via container
Then dependencies resolve correctly without manual instantiation
```

**AC4: Controller Migration (Proof of Concept)**

```
Given the UserController is registered in a module
When the user router handles a request
Then it retrieves the controller from container instead of manual creation
```

**AC5: Testing Pattern**

```
Given a test wants to use mock repositories
When the container is configured with InMemoryUserRepository in the module
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
When they read the awilix-modular setup guide
Then they can implement DI in <15 minutes
And they don't need to modify tsconfig.json
```

## Scope Definition

### In-Scope

1. **Container Setup**
   - Install `awilix` and `awilix-modular`
   - Configure container in `packages/frameworks/container/`
   - Create module structure for repositories and controllers

2. **Pilot Migration (3 repositories)**
   - PrismaUserRepository
   - PrismaChallengeRepository
   - PrismaGroupRepository

3. **Proof of Concept Controller**
   - UserController registered in module
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
8. **TypeScript Configuration Changes** - No tsconfig.json modifications needed

### Future Work (Post-Task)

1. Migrate remaining 13 repositories to use modules
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
// 1. Define the repository module
@Module({
  providers: [{ token: "TripRepository", useClass: PrismaTripRepository }],
  exports: ["TripRepository"],
})
class TripRepositoryModule {}

// 2. Define the controller module
@Module({
  imports: [TripRepositoryModule],
  providers: [TripController],
  exports: [TripController],
})
class TripControllerModule {}

// 3. Use in router (clean, minimal)
export const tripRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.resolve(TripController);
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
  let container: AwilixContainer;

  beforeEach(() => {
    // Create test module with mock implementation
    const testModule = createModule({
      providers: [
        { token: "UserRepository", useClass: InMemoryUserRepository },
        GetUserUseCase,
      ],
    });
    container = createContainer();
    container.register(testModule);
  });

  it("should return user when exists", async () => {
    // Container provides fully configured use case with mock
    const useCase = container.resolve(GetUserUseCase);

    // Pre-configure mock data
    const inMemoryRepo = container.resolve<UserRepository>("UserRepository");
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

**Future Potential (Post-awilix-modular, requires additional work):**

```typescript
async function complexOperation(input, ctx: TRPCContext) {
  return await ctx.container.createScope(async (scopedContainer) => {
    // All resolved dependencies share the same transaction scope
    const useCase1 = scopedContainer.resolve(CreateChallengeUseCase);
    const useCase2 = scopedContainer.resolve(CreateSubmissionUseCase);

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
// Modules can be wrapped at container level
@Module({
  imports: [RepositoryModule],
  providers: [UserController],
  interceptors: [LoggingInterceptor], // Cross-cutting concerns at module level
})
class UserModule {}
```

---

## Implementation Process

### Phase 1: Setup (Foundation)

Infrastructure setup enabling all subsequent DI migration work.

#### Step 1: Install Dependencies (awilix, awilix-modular)

- **Goal**: Add awilix and awilix-modular packages to the monorepo with version analysis
- **Output**: Updated `package.json` files with dependencies, verified Bun compatibility
- **Agent Type**: `opus` (Complex reasoning - package version analysis, Bun compatibility verification)
- **BlockedBy**: None (first step, foundation)
- **Parallel with**: None (sequential foundation step)
- **Success Criteria**:
  ```
  Given the monorepo has package.json files
  When dependencies are installed
  Then awilix v12.x and awilix-modular are listed in dependencies
  And no reflect-metadata package is required
  And packages resolve correctly with bun install
  ```
- **Subtasks**:
  - [ ] Analyze latest stable awilix version compatible with Bun
  - [ ] Analyze awilix-modular version and dependencies
  - [ ] Install `awilix` at monorepo root level
  - [ ] Install `awilix-modular` at monorepo root level
  - [ ] Update `bun.lock` with new dependencies
  - [ ] Verify packages resolve correctly with `bun install`
  - [ ] Confirm no tsconfig.json changes needed
  - [ ] Create minimal test to verify awilix loads
- **Blockers**: None (first step)
- **Risks & Mitigations**:
  - **Risk**: Package version conflicts with existing TypeScript setup
    - **Mitigation**: Pin to stable versions, test in isolated branch
    - **Impact**: HIGH - could block entire implementation
    - **Probability**: MEDIUM
  - **Risk**: Bun compatibility issues with awilix
    - **Mitigation**: Verify with minimal test before proceeding
    - **Impact**: HIGH - could require switching to npm/yarn
    - **Probability**: LOW
  - **Risk**: Missing peer dependencies
    - **Mitigation**: Check package.json for peer deps, install explicitly
    - **Impact**: MEDIUM - runtime errors
    - **Probability**: LOW
- **Effort**: XS (30-60 minutes)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (standard package installation verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Package Installation Correctness | 0.30 | All packages installed with correct versions | 1-5 |
  | Lock File Integrity | 0.25 | bun.lock updated correctly with no conflicts | 1-5 |
  | Import Resolution | 0.25 | All packages resolve correctly with `bun install` | 1-5 |
  | No Breaking Changes | 0.20 | Existing imports and builds unaffected | 1-5 |

---

#### Step 2: Create DI Context Files (packages/frameworks/src/di/)

- **Goal**: Establish awilix-modular container infrastructure in frameworks layer
- **Output**: Container setup files in `packages/frameworks/src/di/` with proper exports
- **Agent Type**: `opus` (Core infrastructure - container hierarchy, module loading)
- **BlockedBy**: Step 1 (dependencies installed)
- **Parallel with**: None (depends on Step 1)
- **Success Criteria**:
  ```
  Given container configuration exists in frameworks package
  When container is imported
  Then it exports a configured AwilixContainer instance
  And module registration works for @Module decorated classes
  And container can resolve a class registered in a module
  And no dependency-cruiser violations exist
  ```
- **Subtasks**:
  - [ ] Create `packages/frameworks/src/di/` directory structure
  - [ ] Create `packages/frameworks/src/di/container.ts` with root container
  - [ ] Create `packages/frameworks/src/di/index.ts` for public exports
  - [ ] Add container initialization with module loading support
  - [ ] Create `packages/frameworks/src/di/types.ts` for DI type definitions
  - [ ] Create `packages/frameworks/src/di/scope.ts` for request scoping utilities
  - [ ] Create test to verify container resolves classes from modules
  - [ ] Run dependency-cruiser to verify no violations
  - [ ] Verify TypeScript compilation passes
- **Blockers**: Step 1 (dependencies installed)
- **Risks & Mitigations**:
  - **Risk**: Circular dependency detection issues with container setup
    - **Mitigation**: Use dependency-cruiser validation after each file creation
    - **Impact**: MEDIUM - CI failures
    - **Probability**: MEDIUM
  - **Risk**: Import path resolution problems between packages
    - **Mitigation**: Follow established monorepo import patterns, test imports
    - **Impact**: MEDIUM - build failures
    - **Probability**: LOW
  - **Risk**: Container scoping configuration errors
    - **Mitigation**: Write tests for singleton vs transient vs request scopes
    - **Impact**: HIGH - memory leaks or state corruption
    - **Probability**: MEDIUM
- **Effort**: S (2-3 hours)

**Verification:**

- **Level**: HIGH
- **Threshold**: 4.0/5.0
- **Judge Type**: opus (critical infrastructure verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Container Resolution | 0.25 | Container resolves class from @Module decorated module | 1-5 |
  | Module Loading | 0.20 | @Module() decorator works with auto-registration | 1-5 |
  | No Dependency Violations | 0.20 | Zero dependency-cruiser violations from di/ directory | 1-5 |
  | Child Container Creation | 0.20 | Can create child containers from root for request scoping | 1-5 |
  | Test Coverage | 0.15 | Unit tests verify container behavior | 1-5 |

---

#### Step 3: Create Root Module (AppModule.ts)

- **Goal**: Define the root application module that orchestrates all other modules
- **Output**: `AppModule.ts` with proper imports and exports structure
- **Agent Type**: `opus` (Architecture foundation - module organization patterns)
- **BlockedBy**: Step 2 (container directory exists)
- **Parallel with**: None (depends on Step 2)
- **Success Criteria**:
  ```
  Given AppModule is defined with @Module() decorator
  When the container loads AppModule
  Then all child modules are properly imported
  And exports are correctly configured
  And modules can be registered with the container
  ```
- **Subtasks**:
  - [ ] Create `packages/frameworks/src/di/AppModule.ts`
  - [ ] Define @Module() decorator configuration
  - [ ] Set up imports array structure for future modules
  - [ ] Configure exports for public API surface
  - [ ] Create placeholder for RepositoryModule import
  - [ ] Create placeholder for ControllerModule import
  - [ ] Verify AppModule can be imported by container
  - [ ] Document module hierarchy and naming conventions
  - [ ] Add module dependency graph documentation
- **Blockers**: Step 2 (container directory exists)
- **Risks & Mitigations**:
  - **Risk**: Module organization confusion - unclear boundaries
    - **Mitigation**: Document clear module hierarchy following NestJS patterns
    - **Impact**: MEDIUM - developer confusion
    - **Probability**: MEDIUM
  - **Risk**: Token naming collisions with future services
    - **Mitigation**: Use descriptive prefixes, document naming conventions
    - **Impact**: MEDIUM - runtime errors
    - **Probability**: LOW
  - **Risk**: Module circular dependencies
    - **Mitigation**: Design unidirectional dependency graph, verify with dependency-cruiser
    - **Impact**: HIGH - container fails to initialize
    - **Probability**: MEDIUM
- **Effort**: S (1-2 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (module definition verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Module Completeness | 0.25 | Root module properly defined with all imports/exports | 1-5 |
  | Token Definitions | 0.25 | Provider tokens properly typed | 1-5 |
  | Import/Export | 0.25 | Modules can be imported across packages | 1-5 |
  | No Collisions | 0.25 | Token naming avoids future collisions | 1-5 |

---

### Phase 2: Foundational Migration

Core DI patterns that enable router migration and demonstrate the approach.

#### Step 4: Create RepositoryModule (16 repositories as providers)

- **Goal**: Define RepositoryModule with all 16 repository providers and proper injection tokens
- **Output**: `RepositoryModule.ts` with 16 repository registrations
- **Agent Type**: `opus` (Architecture foundation - repository organization, token strategy)
- **BlockedBy**: Step 3 (AppModule exists)
- **Parallel with**: None (depends on Step 3 - creates foundation for Phase 2)
- **Success Criteria**:
  ```
  Given RepositoryModule includes all 16 repositories
  When container.resolve() is called with any repository token
  Then it returns the correct Prisma repository instance
  And PrismaClient is properly injected
  And BasePrismaRepository inheritance is preserved
  ```
- **Subtasks**:
  - [ ] Create `packages/adapters/src/modules/RepositoryModule.ts`
  - [ ] Catalog all 16 repositories from codebase
  - [ ] Define injection tokens for each repository (UserRepository, ChallengeRepository, etc.)
  - [ ] Configure PrismaClient injection for all repositories
  - [ ] Handle BasePrismaRepository base class injection
  - [ ] Export RepositoryModule from adapters package
  - [ ] Verify no dependency-cruiser violations
  - [ ] Create integration test for RepositoryModule
  - [ ] Document repository registration pattern
- **Blockers**: Step 3 (AppModule exists)
- **Risks & Mitigations**:
  - **Risk**: Repository instantiation with BasePrismaRepository inheritance issues
    - **Mitigation**: Test awilix injection with base class pattern carefully
    - **Impact**: HIGH - repositories fail to resolve
    - **Probability**: MEDIUM
  - **Risk**: Constructor signature changes breaking existing instantiations
    - **Mitigation**: Keep backward-compatible constructors with optional injection
    - **Impact**: MEDIUM - test failures
    - **Probability**: MEDIUM
  - **Risk**: Token collision with existing code
    - **Mitigation**: Use repository-specific prefixes in token names
    - **Impact**: LOW - naming conflicts
    - **Probability**: LOW
- **Effort**: M (3-4 hours)

**Verification:**

- **Level**: HIGH
- **Threshold**: 4.0/5.0
- **Judge Type**: opus (critical infrastructure verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Module Completeness | 0.25 | All 16 repositories registered | 1-5 |
  | Container Resolution | 0.25 | All repositories resolve correctly | 1-5 |
  | PrismaClient Injection | 0.20 | PrismaClient properly injected | 1-5 |
  | No Dependency Violations | 0.20 | Zero dependency-cruiser violations | 1-5 |
  | Documentation | 0.10 | Registration pattern documented | 1-5 |

---

#### Step 5: Migrate Pilot Repositories (User, Challenge, Group)

- **Goal**: Convert 3 pilot repositories to use awilix-modular with full backward compatibility
- **Output**: Updated PrismaUserRepository, PrismaChallengeRepository, PrismaGroupRepository
- **Agent Type**: `sonnet` (Standard development - pattern repetition across 3 repositories)
- **BlockedBy**: Step 4 (RepositoryModule structure defined)
- **Parallel with**: Steps 6, 7, 8 (all depend on Step 4, no inter-dependencies)
- **Quality Gate**: 3.5/5.0 (MEDIUM - pattern application verification)
- **Success Criteria**:
  ```
  Given RepositoryModule includes pilot repositories
  When container.resolve('UserRepository') is called
  Then it returns an instance of PrismaUserRepository
  And the repository has PrismaClient injected via awilix
  And existing tests still pass
  And manual instantiation still works for backward compatibility
  ```
- **Subtasks**:
  - [ ] Update PrismaUserRepository for awilix injection
  - [ ] Update PrismaChallengeRepository for awilix injection
  - [ ] Update PrismaGroupRepository for awilix injection
  - [ ] Configure constructor injection in RepositoryModule
  - [ ] Maintain backward-compatible constructor signatures
  - [ ] Update repository tests to use container (optional)
  - [ ] Verify repositories resolve from container
  - [ ] Run existing repository tests to ensure no regression
  - [ ] Document migration pattern for remaining 13 repositories
- **Blockers**: Step 4 (RepositoryModule structure defined)
- **Risks & Mitigations**:
  - **Risk**: BasePrismaRepository inheritance issues with awilix
    - **Mitigation**: Test carefully, may need custom factory functions
    - **Impact**: HIGH - repositories won't instantiate
    - **Probability**: MEDIUM
  - **Risk**: Test suite breakage from constructor changes
    - **Mitigation**: Keep backward-compatible constructors
    - **Impact**: MEDIUM - CI failures
    - **Probability**: MEDIUM
  - **Risk**: Performance degradation from container overhead
    - **Mitigation**: Benchmark pilot repositories vs baseline
    - **Impact**: LOW - potential performance issue
    - **Probability**: LOW
- **Effort**: M (4-6 hours across 3 repositories)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (pattern application verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Module Registration | 0.25 | All 3 repositories registered in RepositoryModule | 1-5 |
  | Container Resolution | 0.25 | All repositories resolve from container by token | 1-5 |
  | PrismaClient Injection | 0.20 | PrismaClient injected via awilix | 1-5 |
  | Test Regression | 0.20 | All existing repository tests pass | 1-5 |
  | Backward Compatibility | 0.10 | Constructors remain backward-compatible | 1-5 |

---

#### Step 6: Create UseCaseModule (73 use cases as providers)

- **Goal**: Define UseCaseModule with all 73 use case providers organized by domain
- **Output**: `UseCaseModule.ts` with 73 use case registrations
- **Agent Type**: `opus` (Architecture foundation - use case organization, dependency mapping)
- **BlockedBy**: Step 4 (RepositoryModule defined)
- **Parallel with**: Steps 5, 7, 8 (all depend on Step 4, no inter-dependencies)
- **Quality Gate**: 4.0/5.0 (HIGH - critical infrastructure verification)
- **Success Criteria**:
  ```
  Given UseCaseModule includes all 73 use cases
  When container.resolve() is called with any use case
  Then it returns the correct use case instance
  And all required repositories are auto-injected
  And complex multi-dependency use cases resolve correctly
  ```
- **Subtasks**:
  - [ ] Create `packages/use-cases/src/modules/UseCaseModule.ts`
  - [ ] Catalog all 73 use cases from codebase
  - [ ] Identify use case dependencies (single repo vs multi-repo)
  - [ ] Group use cases by domain (User, Challenge, Group, Trip, etc.)
  - [ ] Configure repository injection for each use case
  - [ ] Handle complex use cases (PurchaseRewardUseCase, etc.)
  - [ ] Export UseCaseModule from use-cases package
  - [ ] Create integration test resolving all use cases
  - [ ] Document use case registration pattern
- **Blockers**: Step 4 (RepositoryModule defined)
- **Risks & Mitigations**:
  - **Risk**: Use cases with multiple dependencies (PurchaseRewardUseCase) too complex
    - **Mitigation**: Create complex registration pattern, test individually
    - **Impact**: HIGH - use cases fail to resolve
    - **Probability**: HIGH
  - **Risk**: Circular dependencies between use cases
    - **Mitigation**: Map dependency graph before implementation
    - **Impact**: HIGH - container initialization fails
    - **Probability**: MEDIUM
  - **Risk**: Memory overhead from 73 use case registrations
    - **Mitigation**: Use transient scope, lazy initialization where possible
    - **Impact**: LOW - startup performance
    - **Probability**: LOW
- **Effort**: M (4-5 hours)

**Verification:**

- **Level**: HIGH
- **Threshold**: 4.0/5.0
- **Judge Type**: opus (critical infrastructure verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Module Completeness | 0.25 | All 73 use cases registered | 1-5 |
  | Container Resolution | 0.20 | All use cases resolve correctly | 1-5 |
  | Repository Injection | 0.20 | Repositories auto-injected | 1-5 |
  | Complex Use Cases | 0.20 | Multi-dependency use cases work | 1-5 |
  | Documentation | 0.15 | Registration pattern documented | 1-5 |

---

#### Step 7: Migrate Pilot Use Cases (User, Challenge, Group)

- **Goal**: Convert pilot use cases for User, Challenge, and Group domains to use DI
- **Output**: 9+ use cases migrated with container-based testing
- **Agent Type**: `sonnet` (Standard development - pattern repetition across use cases)
- **BlockedBy**: Step 4 (UseCaseModule structure defined)
- **Parallel with**: Steps 5, 6, 8 (all depend on Step 4, no inter-dependencies)
- **Quality Gate**: 3.5/5.0 (MEDIUM - pattern application verification)
- **Success Criteria**:
  ```
  Given pilot use cases are registered in UseCaseModule
  When container.resolve(GetUserUseCase) is called
  Then it returns an instance with UserRepository auto-injected
  And use case methods work without manual repository instantiation
  And tests use container-based setup
  ```
- **Subtasks**:
  - [ ] Identify 3 use cases per domain (User: GetUserUseCase, CreateUserUseCase, UpdateUserUseCase)
  - [ ] Identify Challenge domain use cases (3 use cases)
  - [ ] Identify Group domain use cases (3 use cases)
  - [ ] Update use case constructors for awilix injection
  - [ ] Configure in UseCaseModule
  - [ ] Create container-based test setup utility
  - [ ] Update pilot use case tests to use container
  - [ ] Verify use cases resolve from container
  - [ ] Run existing use case tests to ensure no regression
  - [ ] Document migration pattern for remaining use cases
- **Blockers**: Step 4 (UseCaseModule structure defined) - Can run parallel with Steps 5-6
- **Risks & Mitigations**:
  - **Risk**: Test refactoring volume is high
    - **Mitigation**: Create shared test container setup utility
    - **Impact**: MEDIUM - test maintenance
    - **Probability**: HIGH
  - **Risk**: Use case with complex dependencies failing to resolve
    - **Mitigation**: Test complex use cases individually before batch migration
    - **Impact**: HIGH - feature breakage
    - **Probability**: MEDIUM
  - **Risk**: Constructor signature changes breaking manual instantiation
    - **Mitigation**: Maintain backward compatibility
    - **Impact**: MEDIUM - existing code breakage
    - **Probability**: LOW
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (pattern application verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Module Registration | 0.25 | Use cases registered in UseCaseModule | 1-5 |
  | Container Resolution | 0.25 | Use cases resolve with injected repositories | 1-5 |
  | Test Migration | 0.20 | Tests use container-based setup | 1-5 |
  | Existing Tests Pass | 0.20 | All existing use case tests pass | 1-5 |
  | Test Utility Reuse | 0.10 | Shared test container utility used | 1-5 |

---

#### Step 8: Create ControllerModule (17 controllers)

- **Goal**: Define ControllerModule with all 17 controller providers
- **Output**: `ControllerModule.ts` with 17 controller registrations
- **Agent Type**: `opus` (Architecture foundation - controller organization, use case injection)
- **BlockedBy**: Step 4 (RepositoryModule defined)
- **Parallel with**: Steps 5, 6, 7 (all depend on Step 4, no inter-dependencies)
- **Quality Gate**: 4.0/5.0 (HIGH - critical infrastructure verification)
- **Success Criteria**:
  ```
  Given ControllerModule includes all 17 controllers
  When container.resolve() is called with any controller
  Then it returns the correct controller instance
  And all required use cases are auto-injected
  And controllers can be used in tRPC routers
  ```
- **Subtasks**:
  - [ ] Create `packages/adapters/src/modules/ControllerModule.ts`
  - [ ] Catalog all 17 controllers from codebase
  - [ ] Import UseCaseModule into ControllerModule
  - [ ] Configure use case injection for each controller
  - [ ] Handle controllers with multiple use case dependencies
  - [ ] Export ControllerModule from adapters package
  - [ ] Create integration test resolving all controllers
  - [ ] Import ControllerModule into AppModule
  - [ ] Document controller registration pattern
- **Blockers**: Step 4 (RepositoryModule defined) - Controllers depend on use cases which depend on repositories
- **Risks & Mitigations**:
  - **Risk**: Controllers with many use case dependencies (5-10+) complex to configure
    - **Mitigation**: Create batch injection pattern, test complex controllers individually
    - **Impact**: HIGH - controllers won't resolve
    - **Probability**: MEDIUM
  - **Risk**: Controller-UseCase circular dependencies
    - **Mitigation**: Ensure unidirectional dependency: Controller -> UseCase -> Repository
    - **Impact**: HIGH - container fails
    - **Probability**: LOW
  - **Risk**: tRPC integration complexity with controllers
    - **Mitigation**: Verify controller resolution works in tRPC context
    - **Impact**: MEDIUM - router migration blocked
    - **Probability**: MEDIUM
- **Effort**: M (3-4 hours)

**Verification:**

- **Level**: HIGH
- **Threshold**: 4.0/5.0
- **Judge Type**: opus (critical infrastructure verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Module Completeness | 0.25 | All 17 controllers registered | 1-5 |
  | Container Resolution | 0.25 | All controllers resolve correctly | 1-5 |
  | Use Case Injection | 0.20 | Use cases auto-injected | 1-5 |
  | No Dependency Violations | 0.20 | Zero dependency-cruiser violations | 1-5 |
  | Documentation | 0.10 | Registration pattern documented | 1-5 |

---

#### Step 9: Update tRPC Context (add DIContext to TRPCContext)

- **Goal**: Integrate awilix container into tRPC context with proper request scoping
- **Output**: Updated TRPCContext type and createTRPCContext function with DIContext
- **Agent Type**: `opus` (Critical integration - tRPC type system, container scoping, request lifecycle)
- **BlockedBy**: Steps 5, 6, 7, 8 (repositories, use cases, and controllers ready)
- **Parallel with**: None (sequential integration step - blocks all router migrations)
- **Quality Gate**: 4.0/5.0 (HIGH - critical integration verification)
- **Success Criteria**:
  ```
  Given createTRPCContext is called with db and supabase
  When context is created
  Then it includes a diContext property with request-scoped AwilixContainer
  And container can resolve UserRepository with bound PrismaClient
  And all existing tRPC procedures continue to work
  And memory is properly managed (no leaks)
  ```
- **Subtasks**:
  - [ ] Update TRPCContext interface to include diContext: DIContext
  - [ ] Define DIContext type with container and helper methods
  - [ ] Modify createTRPCContext to create request-scoped container
  - [ ] Register PrismaClient with container from opts.db
  - [ ] Ensure container inherits from root container for module registrations
  - [ ] Add container disposal/cleanup on request end
  - [ ] Update context type exports for router type inference
  - [ ] Test context creation in isolation
  - [ ] Verify existing routers compile without errors
  - [ ] Test with concurrent requests for scoping correctness
- **Blockers**: Steps 5, 6, 7, 8 (repositories, use cases, and controllers ready)
- **Risks & Mitigations**:
  - **Risk**: Type inference breaking in tRPC routers
    - **Mitigation**: Careful type export, test with one router before all
    - **Impact**: HIGH - all routers affected
    - **Probability**: MEDIUM
  - **Risk**: Container scoping issues causing singleton vs request-scoped confusion
    - **Mitigation**: Document scope strategy, test with concurrent requests
    - **Impact**: HIGH - data corruption or security issues
    - **Probability**: MEDIUM
  - **Risk**: Memory leaks from container instances not being disposed
    - **Mitigation**: Ensure container cleanup, monitor memory in load tests
    - **Impact**: HIGH - production stability
    - **Probability**: MEDIUM
  - **Risk**: Request lifecycle integration issues
    - **Mitigation**: Test with tRPC middleware, verify disposal timing
    - **Impact**: MEDIUM - resource exhaustion
    - **Probability**: MEDIUM
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: HIGH
- **Threshold**: 4.0/5.0
- **Judge Type**: opus (critical integration verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | TRPCContext Augmentation | 0.25 | Container property added to TRPCContext interface | 1-5 |
  | Request Scoping | 0.20 | Request-scoped child containers created correctly | 1-5 |
  | PrismaClient Registration | 0.20 | PrismaClient registered per request | 1-5 |
  | Type Inference | 0.15 | Type inference works in router files | 1-5 |
  | Backward Compatibility | 0.10 | Existing context properties preserved | 1-5 |
  | Memory Management | 0.10 | No memory leaks from container instances | 1-5 |

---

### Phase 3: User Stories (Pilots)

Pilot implementations demonstrating DI value and validating patterns.

#### Step 10: Migrate User Router to DI

- **Goal**: Convert user router to use container-based dependency resolution
- **Output**: Updated `apps/backend-server/src/routers/user.ts` using ctx.diContext
- **Agent Type**: `sonnet` (Standard development - router migration following established pattern)
- **BlockedBy**: Step 9 (tRPC context with DIContext)
- **Parallel with**: Steps 11, 12, 13 (all depend on Step 9, no inter-dependencies)
- **Quality Gate**: 3.5/5.0 (MEDIUM - router migration verification)
- **Success Criteria**:
  ```
  Given user router procedures are updated
  When a request hits user.getById endpoint
  Then it uses ctx.diContext.container.resolve(UserController) instead of manual instantiation
  And response time is within 5% of baseline
  And all existing tests pass
  And boilerplate is reduced by >30%
  ```
- **Subtasks**:
  - [ ] Register UserController in ControllerModule
  - [ ] Configure UserRepository injection in UserController provider
  - [ ] Update user router to import DIContext types
  - [ ] Replace manual controller instantiation with container resolution
  - [ ] Remove manual repository instantiation from user router
  - [ ] Update user router type imports
  - [ ] Run user router tests to verify functionality
  - [ ] Measure response time vs baseline
  - [ ] Count lines of boilerplate removed
  - [ ] Document before/after comparison
- **Blockers**: Step 9 (tRPC context with DIContext)
- **Risks & Mitigations**:
  - **Risk**: Router regression affecting production endpoints
    - **Mitigation**: Comprehensive test coverage before deployment, gradual rollout
    - **Impact**: HIGH - user-facing issues
    - **Probability**: LOW
  - **Risk**: Developer confusion with new pattern
    - **Mitigation**: Code review with team, pair programming session
    - **Impact**: MEDIUM - adoption friction
    - **Probability**: MEDIUM
  - **Risk**: Performance degradation from container resolution
    - **Mitigation**: Benchmark endpoints, optimize if >5% degradation
    - **Impact**: MEDIUM - user experience
    - **Probability**: LOW
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (router migration verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Controller Resolution | 0.25 | UserController resolves from container | 1-5 |
  | Repository Injection | 0.25 | UserRepository auto-injected into controller | 1-5 |
  | Endpoint Functionality | 0.20 | All user endpoints work correctly | 1-5 |
  | Performance | 0.15 | Response time within 5% of baseline | 1-5 |
  | Test Coverage | 0.15 | All existing user router tests pass | 1-5 |

---

#### Step 11: Migrate Challenge Router to DI

- **Goal**: Convert challenge router to demonstrate pattern works across domains
- **Output**: Updated challenge router using container-based resolution
- **Agent Type**: `sonnet` (Standard development - router migration, similar pattern to User Router)
- **BlockedBy**: Step 9 (tRPC context with DIContext)
- **Parallel with**: Steps 10, 12, 13 (all depend on Step 9, no inter-dependencies)
- **Quality Gate**: 3.5/5.0 (MEDIUM - router migration verification)
- **Success Criteria**:
  ```
  Given challenge router uses container
  When challenge.create endpoint is called
  Then ChallengeController is resolved from container
  And ChallengeRepository is auto-injected into controller
  And all challenge endpoints work correctly
  And pattern is consistent with User router
  ```
- **Subtasks**:
  - [ ] Register ChallengeController in ControllerModule
  - [ ] Configure ChallengeRepository injection in ChallengeController provider
  - [ ] Update challenge router to use ctx.diContext.container.resolve()
  - [ ] Verify challenge creation, update, and query endpoints work
  - [ ] Run challenge router integration tests
  - [ ] Document any domain-specific issues encountered
  - [ ] Compare pattern consistency with User router
  - [ ] Count boilerplate reduction
- **Blockers**: Step 9 (tRPC context with DIContext)
- **Risks & Mitigations**:
  - **Risk**: Complex challenge use cases (CreateChallengeUseCase with multiple steps)
    - **Mitigation**: Simplify pilot scope, handle complexity in Phase 4
    - **Impact**: MEDIUM - some endpoints may need manual wiring
    - **Probability**: MEDIUM
  - **Risk**: Challenge domain has complex state transitions
    - **Mitigation**: Thorough testing of all state changes
    - **Impact**: MEDIUM - data integrity issues
    - **Probability**: MEDIUM
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (router migration verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Controller Resolution | 0.25 | ChallengeController resolves from container | 1-5 |
  | Repository Injection | 0.25 | ChallengeRepository auto-injected | 1-5 |
  | Endpoint Functionality | 0.25 | All challenge endpoints work correctly | 1-5 |
  | Test Coverage | 0.15 | All existing challenge router tests pass | 1-5 |
  | Pattern Consistency | 0.10 | Follows same pattern as User router | 1-5 |

---

#### Step 12: Migrate Trip Router to DI

- **Goal**: Complete pilot coverage with third domain (Trip) demonstrating pattern consistency
- **Output**: Updated trip router demonstrating pattern consistency across all domains
- **Agent Type**: `sonnet` (Standard development - router migration, validates pattern across all 3 domains)
- **BlockedBy**: Step 9 (tRPC context with DIContext)
- **Parallel with**: Steps 10, 11, 13 (all depend on Step 9, no inter-dependencies)
- **Quality Gate**: 3.5/5.0 (MEDIUM - router migration verification)
- **Success Criteria**:
  ```
  Given trip router is migrated
  When trip.create or trip.getById is called
  Then dependencies resolve correctly via container
  And pattern consistency is verified across all 3 pilot routers
  And location dependencies are handled correctly
  ```
- **Subtasks**:
  - [ ] Register TripController in ControllerModule
  - [ ] Configure TripRepository injection in TripController provider
  - [ ] Update trip router to use container resolution
  - [ ] Handle LocationRepository dependency for trip operations
  - [ ] Verify trip endpoints work correctly
  - [ ] Run trip router tests
  - [ ] Compare boilerplate across user/challenge/trip routers
  - [ ] Document pattern for remaining 14 routers
  - [ ] Create router migration template
- **Blockers**: Step 9 (tRPC context with DIContext)
- **Risks & Mitigations**:
  - **Risk**: Trip domain complexity with location dependencies
    - **Mitigation**: Focus on core CRUD, ensure LocationRepository is available
    - **Impact**: MEDIUM - some features may need manual wiring
    - **Probability**: MEDIUM
  - **Risk**: Trip has complex geospatial operations
    - **Mitigation**: Test geospatial endpoints thoroughly
    - **Impact**: LOW - specific feature issues
    - **Probability**: LOW
- **Effort**: M (4-6 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (router migration verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Controller Resolution | 0.25 | TripController resolves from container | 1-5 |
  | Repository Injection | 0.25 | TripRepository auto-injected | 1-5 |
  | Endpoint Functionality | 0.25 | All trip endpoints work correctly | 1-5 |
  | Test Coverage | 0.15 | All existing trip router tests pass | 1-5 |
  | Pattern Consistency | 0.10 | Consistent with User and Challenge routers | 1-5 |

---

### Phase 4: Analysis & Polish

Effect.ts analysis and team enablement for ongoing DI usage.

#### Step 13: Conduct Effect.ts Analysis (114 Result<T,E> imports)

- **Goal**: Analyze Effect.ts patterns vs current Result<T,E> implementation across all 114 usages
- **Output**: Comprehensive analysis document with migration recommendations
- **Agent Type**: `opus` (Complex analysis - 114 Result<T,E> imports, architectural comparison)
- **BlockedBy**: Step 4 (container foundation established)
- **Parallel with**: Steps 10, 11, 12 (can run parallel with router migrations after Step 4)
- **Quality Gate**: 3.5/5.0 (LOW - analysis quality verification)
- **Success Criteria**:
  ```
  Given current Result<T,E> usage is documented (114 imports across all packages)
  When Effect.ts patterns are compared
  Then analysis identifies 3+ high-value use cases
  And provides Go/No-Go recommendation with effort estimates
  And documents Effect.ts Either vs Result<T,E> isomorphism
  And includes learning curve assessment
  ```
- **Subtasks**:
  - [ ] Document all 114 Result<T,E> import locations using grep
  - [ ] Catalog current error handling patterns in use cases by category
  - [ ] Research Effect.ts Effect<A,E,R> vs async/await patterns
  - [ ] Identify high-value migration candidates (complex async flows, chaining)
  - [ ] Map Result<T,E> patterns to Effect.ts equivalents
  - [ ] Document Effect.ts learning curve and training requirements
  - [ ] Compare test patterns: Result<T,E> mocks vs Effect test layers
  - [ ] Write recommendation: Go with conditions / No-Go with rationale
  - [ ] Include migration effort estimate (hours + training)
  - [ ] Analyze integration with existing awilix-modular setup
- **Blockers**: Step 4 (container foundation established) - Can start early, parallel with Phase 3
- **Risks & Mitigations**:
  - **Risk**: Analysis paralysis from over-researching Effect.ts
    - **Mitigation**: Time-box analysis to 1 day, focus on concrete use cases
    - **Impact**: MEDIUM - delays other work
    - **Probability**: MEDIUM
  - **Risk**: Premature optimization recommendations
    - **Mitigation**: Ground analysis in actual codebase pain points
    - **Impact**: MEDIUM - wrong architectural decisions
    - **Probability**: MEDIUM
  - **Risk**: Team resistance to functional programming concepts
    - **Mitigation**: Include learning curve assessment, provide training options
    - **Impact**: HIGH - adoption failure
    - **Probability**: MEDIUM
- **Effort**: M (6-8 hours)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (analysis quality verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Result Catalog Completeness | 0.30 | All 114 Result<T,E> import locations documented | 1-5 |
  | Analysis Depth | 0.25 | Effect.ts patterns thoroughly compared | 1-5 |
  | High-Value Candidates | 0.20 | 3+ high-value migration use cases identified | 1-5 |
  | Recommendation Clarity | 0.15 | Go/No-Go recommendation with clear rationale | 1-5 |
  | Effort Estimation | 0.15 | Migration effort estimates documented | 1-5 |

---

#### Step 14: Create Effect.ts Recommendations

- **Goal**: Provide concrete guidance for potential Effect.ts adoption with pilot plan
- **Output**: Recommendation document with pilot use case and implementation plan
- **Agent Type**: `sonnet` (Standard development - document writing based on analysis)
- **BlockedBy**: Step 13 (analysis complete)
- **Parallel with**: None (sequential - depends on Step 13)
- **Quality Gate**: 3.5/5.0 (MEDIUM - recommendation quality verification)
- **Success Criteria**:
  ```
  Given Effect.ts analysis is complete
  When recommendations are reviewed
  Then they include specific use case for pilot implementation
  And provide before/after code examples with metrics
  And define success criteria for pilot evaluation
  And include rollback plan
  ```
- **Subtasks**:
  - [ ] Select highest-value use case for Effect.ts pilot (complex async flow)
  - [ ] Write before/after code comparison with line count
  - [ ] Define pilot scope boundaries (what's in/out)
  - [ ] Create implementation plan for pilot (steps + effort)
  - [ ] Document success metrics for pilot evaluation (error rates, test coverage)
  - [ ] Include rollback plan if pilot fails
  - [ ] Get team feedback on recommendations
  - [ ] Create decision matrix: Go / No-Go / Defer
  - [ ] Include integration plan with awilix-modular DI
- **Blockers**: Step 13 (analysis complete)
- **Risks & Mitigations**:
  - **Risk**: Recommendation rejection by team
    - **Mitigation**: Present as options, not mandates; include trade-off analysis
    - **Impact**: MEDIUM - wasted analysis effort
    - **Probability**: MEDIUM
  - **Risk**: Over-engineering with Effect.ts for simple use cases
    - **Mitigation**: Focus recommendations on genuinely complex scenarios
    - **Impact**: LOW - unnecessary complexity
    - **Probability**: MEDIUM
- **Effort**: S (2-4 hours)

**Verification:**

- **Level**: MEDIUM
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (recommendation quality verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Pilot Use Case Selection | 0.30 | Highest-value use case selected for pilot | 1-5 |
  | Code Examples | 0.25 | Before/after code comparison provided | 1-5 |
  | Scope Definition | 0.20 | Clear scope boundaries defined | 1-5 |
  | Implementation Plan | 0.15 | Step-by-step implementation plan with effort | 1-5 |
  | Success Metrics | 0.10 | Measurable success criteria defined | 1-5 |

---

#### Step 15: Update Documentation (AGENTS.md, CLAUDE.md, setup guide)

- **Goal**: Create comprehensive documentation for DI patterns with troubleshooting
- **Output**: Updated AGENTS.md, CLAUDE.md, and awilix-modular setup guide
- **Agent Type**: `sonnet` (Standard development - guide writing, pattern documentation)
- **BlockedBy**: Steps 10, 11, 12 (all pilot routers complete, patterns validated)
- **Parallel with**: Step 14 (can run in parallel with Step 14 if Step 13 done)
- **Quality Gate**: 3.5/5.0 (LOW - documentation quality verification)
- **Success Criteria**:
  ```
  Given a developer wants to add a new repository
  When they read the awilix-modular setup guide
  Then they can implement DI in <15 minutes
  And no tsconfig.json changes are required
  And documentation includes troubleshooting section with 5+ common issues
  And examples cover testing patterns
  ```
- **Subtasks**:
  - [ ] Create `packages/frameworks/src/di/README.md` with awilix-modular setup guide
  - [ ] Document @Module() decorator usage pattern with examples
  - [ ] Document ctx.diContext.container.resolve() usage pattern
  - [ ] Add troubleshooting section for common DI issues (5+ items)
  - [ ] Include code examples for testing with DI container
  - [ ] Document scope strategy (singleton vs transient vs request)
  - [ ] Document "No tsconfig changes needed" as key benefit
  - [ ] Update AGENTS.md with DI pattern section
  - [ ] Update CLAUDE.md with container conventions
  - [ ] Create quick start cheat sheet
  - [ ] Add migration guide for existing code
- **Blockers**: Steps 10, 11, 12 (all pilot routers complete, patterns validated)
- **Risks & Mitigations**:
  - **Risk**: Documentation drift from implementation changes
    - **Mitigation**: Review and update docs before task completion, validate with team
    - **Impact**: MEDIUM - confusion
    - **Probability**: MEDIUM
  - **Risk**: Incomplete documentation for edge cases
    - **Mitigation**: Capture edge cases encountered during migration
    - **Impact**: LOW - support burden
    - **Probability**: MEDIUM
- **Effort**: S (3-4 hours)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (documentation quality verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Setup Guide Completeness | 0.30 | awilix-modular setup guide covers all patterns | 1-5 |
  | AGENTS.md/CLAUDE.md Updates | 0.25 | Both files updated with DI patterns | 1-5 |
  | Code Examples | 0.20 | Working code examples provided | 1-5 |
  | Troubleshooting Section | 0.15 | 5+ common DI issues documented | 1-5 |
  | 15-Minute Test | 0.10 | New developer can implement DI in <15 min | 1-5 |

---

#### Step 16: Team Knowledge Transfer

- **Goal**: Enable team to work effectively with new DI patterns through training
- **Output**: Team training session with recording, cheat sheet, and FAQ
- **Agent Type**: `sonnet` (Standard development - session preparation, FAQ documentation)
- **BlockedBy**: Step 15 (documentation complete)
- **Parallel with**: None (sequential - final step)
- **Quality Gate**: 3.5/5.0 (LOW - training completeness verification)
- **Success Criteria**:
  ```
  Given team has access to documentation and training
  When they implement a new repository with DI
  Then they can complete it without additional guidance
  And they understand when to use @Module() vs manual registration
  And they can troubleshoot common DI issues
  ```
- **Subtasks**:
  - [ ] Schedule team walkthrough session (30-60 min)
  - [ ] Create DI cheat sheet/quick reference (1-page)
  - [ ] Demonstrate user router migration as worked example
  - [ ] Show testing patterns with container
  - [ ] Answer team questions and capture in FAQ
  - [ ] Update documentation with team feedback
  - [ ] Create video recording if team is distributed
  - [ ] Provide hands-on exercise: migrate simple router
  - [ ] Collect feedback on documentation clarity
  - [ ] Create #di-support Slack channel or equivalent
- **Blockers**: Step 15 (documentation complete)
- **Risks & Mitigations**:
  - **Risk**: Team resistance to new patterns
    - **Mitigation**: Emphasize no tsconfig changes and reduced boilerplate, show metrics
    - **Impact**: HIGH - adoption failure
    - **Probability**: MEDIUM
  - **Risk**: Scheduling conflicts for knowledge transfer session
    - **Mitigation**: Record session for async consumption, provide written materials
    - **Impact**: MEDIUM - delayed adoption
    - **Probability**: MEDIUM
  - **Risk**: Knowledge retention after session
    - **Mitigation**: Provide cheat sheet, FAQ, recorded session, and ongoing support channel
    - **Impact**: MEDIUM - repeated questions
    - **Probability**: MEDIUM
- **Effort**: S (2-3 hours)

**Verification:**

- **Level**: LOW
- **Threshold**: 3.5/5.0
- **Judge Type**: sonnet (training completeness verification)
- **Rubric**:
  | Criterion | Weight | Description | Scale |
  |-----------|--------|-------------|-------|
  | Training Session Completed | 0.30 | Team walkthrough session held | 1-5 |
  | DI Cheat Sheet | 0.25 | Quick reference guide created | 1-5 |
  | FAQ Documented | 0.20 | Team questions captured with answers | 1-5 |
  | Examples Demonstrated | 0.15 | User router migration demonstrated | 1-5 |
  | Recording Available | 0.10 | Session recorded for async consumption | 1-5 |

---

### Verification Summary Table

| Step | Name                             | Verification Level | Threshold | Judge Type | Criteria Count |
| ---- | -------------------------------- | ------------------ | --------- | ---------- | -------------- |
| 1    | Install Dependencies             | LOW                | 3.5/5.0   | sonnet     | 4              |
| 2    | Create DI Context Files          | HIGH               | 4.0/5.0   | opus       | 5              |
| 3    | Create Root Module               | MEDIUM             | 3.5/5.0   | sonnet     | 4              |
| 4    | Create RepositoryModule          | HIGH               | 4.0/5.0   | opus       | 5              |
| 5    | Migrate Pilot Repositories       | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 6    | Create UseCaseModule             | HIGH               | 4.0/5.0   | opus       | 5              |
| 7    | Migrate Pilot Use Cases          | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 8    | Create ControllerModule          | HIGH               | 4.0/5.0   | opus       | 5              |
| 9    | Update tRPC Context              | HIGH               | 4.0/5.0   | opus       | 6              |
| 10   | Migrate User Router              | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 11   | Migrate Challenge Router         | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 12   | Migrate Trip Router              | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 13   | Conduct Effect.ts Analysis       | LOW                | 3.5/5.0   | sonnet     | 5              |
| 14   | Create Effect.ts Recommendations | MEDIUM             | 3.5/5.0   | sonnet     | 5              |
| 15   | Update Documentation             | LOW                | 3.5/5.0   | sonnet     | 5              |
| 16   | Team Knowledge Transfer          | LOW                | 3.5/5.0   | sonnet     | 5              |

**Verification Breakdown:**

- **HIGH**: 5 steps (31.3%) - Critical infrastructure requiring opus judgment
- **MEDIUM**: 8 steps (50.0%) - Important patterns requiring single judge
- **LOW**: 3 steps (18.7%) - Documentation and low-risk tasks
- **NONE**: 0 steps (0%)

**Total Evaluations**: 76 criteria across 16 steps (avg 4.75 criteria per step)

**Judge Distribution:**

- **opus**: 6 steps (critical infrastructure - Steps 2, 4, 6, 8, 9, 13)
- **sonnet**: 10 steps (pattern application and documentation)

---

### Implementation Summary Table (With Parallel Execution)

| Step | Phase | Name                             | Priority | Effort | BlockedBy  | Parallel With   | Critical Path | Agent    | Quality Gate |
| ---- | ----- | -------------------------------- | -------- | ------ | ---------- | --------------- | ------------- | -------- | ------------ |
| 1    | 1     | Install Dependencies             | P0       | XS     | None       | None            | ✅ Yes        | `opus`   | 3.5/5.0      |
| 2    | 1     | Create DI Context Files          | P0       | S      | Step 1     | None            | ✅ Yes        | `opus`   | 4.0/5.0      |
| 3    | 1     | Create Root Module               | P0       | S      | Step 2     | None            | ✅ Yes        | `opus`   | 3.5/5.0      |
| 4    | 2     | Create RepositoryModule          | P1       | M      | Step 3     | None            | ✅ Yes        | `opus`   | 4.0/5.0      |
| 5    | 2     | Migrate Pilot Repositories       | P1       | M      | Step 4     | 6, 7, 8         | ✅ Yes        | `sonnet` | 3.5/5.0      |
| 6    | 2     | Create UseCaseModule             | P1       | M      | Step 4     | 5, 7, 8         | ✅ Yes        | `opus`   | 4.0/5.0      |
| 7    | 2     | Migrate Pilot Use Cases          | P1       | M      | Step 4     | 5, 6, 8         | ✅ Yes        | `sonnet` | 3.5/5.0      |
| 8    | 2     | Create ControllerModule          | P1       | M      | Step 4     | 5, 6, 7         | ✅ Yes        | `opus`   | 4.0/5.0      |
| 9    | 2.5   | Update tRPC Context              | P1       | M      | 5, 6, 7, 8 | None            | ✅ Yes        | `opus`   | 4.0/5.0      |
| 10   | 3     | Migrate User Router              | P1       | M      | Step 9     | 11, 12, 13      | ✅ Yes        | `sonnet` | 3.5/5.0      |
| 11   | 3     | Migrate Challenge Router         | P2       | M      | Step 9     | 10, 12, 13      | ✅ Yes        | `sonnet` | 3.5/5.0      |
| 12   | 3     | Migrate Trip Router              | P2       | M      | Step 9     | 10, 11, 13      | ✅ Yes        | `sonnet` | 3.5/5.0      |
| 13   | 3     | Conduct Effect.ts Analysis       | P2       | M      | Step 4     | 10, 11, 12      | ❌ No         | `opus`   | 3.5/5.0      |
| 14   | 4     | Create Effect.ts Recommendations | P3       | S      | Step 13    | None            | ❌ No         | `sonnet` | 3.5/5.0      |
| 15   | 4     | Update Documentation             | P2       | S      | 10, 11, 12 | 14 (if 13 done) | ❌ No         | `sonnet` | 3.5/5.0      |
| 16   | 4     | Team Knowledge Transfer          | P3       | S      | Step 15    | None            | ❌ No         | `sonnet` | 3.5/5.0      |

**Total Steps**: 16  
**Critical Path Steps**: 12 (Steps 1-12)  
**Parallelizable Steps**: 9 (Steps 5-8, 10-13)  
**Maximum Parallel Depth**: 4 agents  
**Total Estimated Effort**: 48-70 hours sequential / 26-35 hours parallel  
**Time Savings**: 22-35 hours (46-50% reduction) with parallel execution

### Agent Distribution

| Agent Type | Steps Assigned               | Count   | Phase Distribution                            |
| ---------- | ---------------------------- | ------- | --------------------------------------------- |
| `opus`     | 1, 2, 3, 4, 6, 8, 9, 13      | 6 steps | Foundation + Critical Integrations + Analysis |
| `sonnet`   | 5, 7, 10, 11, 12, 14, 15, 16 | 8 steps | Pattern Application + Documentation           |
| `haiku`    | None                         | 0 steps | All steps require substantial complexity      |

### Parallelization by Phase

| Phase           | Steps | Max Parallel Agents | Agent Mix         | Time (Parallel) |
| --------------- | ----- | ------------------- | ----------------- | --------------- |
| 1. Setup        | 1-4   | 1                   | 1 opus            | 6h              |
| 2. Foundational | 5-8   | 4                   | 2 sonnet + 2 opus | 6h              |
| 2.5 Integration | 9     | 1                   | 1 opus            | 6h              |
| 3. User Stories | 10-13 | 4                   | 3 sonnet + 1 opus | 6h              |
| 4. Finalization | 14-16 | 1                   | 1 sonnet          | 8h              |
| **TOTAL**       | -     | **4**               | -                 | **32h**         |

---

### Parallelization Diagram

#### Visual Execution Flow

```
PHASE 1: SETUP (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Install Dependencies (opus)                          │
│   ↓                                                         │
│ Step 2: Create DI Context Files (opus)                     │
│   ↓                                                         │
│ Step 3: Create Root Module (opus)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓

PHASE 2: FOUNDATIONAL (Parallel - 4 Agents Max)
────────────────────────────────────────────────────────────────
┌──────────────────────────┐ ┌──────────────────────────┐
│ Step 4: Create           │ │ Step 5: Migrate Pilot    │
│   RepositoryModule       │ │   Repositories (sonnet)  │
│   (opus)                 │ │                          │
│                          │ │ • UserRepository         │
│ • 16 repos defined       │ │ • ChallengeRepository   │
│ • Tokens configured      │ │ • GroupRepository       │
└───────────┬──────────────┘ └───────────┬──────────────┘
            │                            │
            └──────────────┬─────────────┘
                           ↓
┌──────────────────────────┐ ┌──────────────────────────┐
│ Step 6: Create           │ │ Step 7: Migrate Pilot    │
│   UseCaseModule          │ │   Use Cases (sonnet)   │
│   (opus)                 │ │                          │
│                          │ │ • 9 use cases total     │
│ • 73 use cases defined   │ │ • User domain (3)       │
│ • Complex deps handled   │ │ • Challenge domain (3)  │
└───────────┬──────────────┘ │ • Group domain (3)      │
            │                └───────────┬──────────────┘
            └──────────────┬─────────────┘
                           ↓
┌──────────────────────────┐
│ Step 8: Create           │
│   ControllerModule       │
│   (opus)                 │
│                          │
│ • 17 controllers defined │
│ • UseCase injection      │
└───────────┬──────────────┘
            │
            ↓

PHASE 2.5: INTEGRATION (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 9: Update tRPC Context (opus)                          │
│                                                             │
│ • Add DIContext to TRPCContext                             │
│ • Configure request-scoped child containers                  │
│ • Register PrismaClient per request                        │
│ • Memory management                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓

PHASE 3: USER STORIES (Parallel - 4 Agents Max)
────────────────────────────────────────────────────────────────
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ Step 10: User Router │ │ Step 11: Challenge   │ │ Step 12: Trip Router │
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
│ Step 13: Effect.ts Analysis (opus)                          │
│   ↓                                                         │
│ Step 14: Create Recommendations (sonnet)                  │
│                                                             │
│ • 114 Result<T,E> imports documented                       │
│ • Go/No-Go recommendation                                  │
│ • Pilot use case selected                                  │
│ • Before/after code examples                               │
└─────────────────────────────────────────────────────────────┘

PHASE 5: FINALIZATION (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 15: Update Documentation (sonnet)                    │
│   ↓                                                         │
│ Step 16: Team Knowledge Transfer (sonnet)                 │
│                                                             │
│ • AGENTS.md, CLAUDE.md updates                             │
│ • Setup guide with examples                                │
│ • Troubleshooting section (5+ items)                       │
│ • Team training session                                    │
│ • Cheat sheet & FAQ                                        │
└─────────────────────────────────────────────────────────────┘
```

PHASE 1: SETUP (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Install Dependencies (opus) │
│ ↓ │
│ Step 2: Verify tsconfig (opus) │
│ ↓ │
│ Step 3: Create Container (opus) │
│ ↓ │
│ Step 4: Module Structure (opus) │
└─────────────────────────────────────────────────────────────┘
↓

PHASE 2: FOUNDATIONAL (Parallel - 2 Agents)
────────────────────────────────────────────────────────────────
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Step 5: Migrate Repositories│ │ Step 6: Migrate Use Cases │
│ (sonnet) │ │ (sonnet) │
│ │ │ │
│ • PrismaUserRepository │ │ • GetUserUseCase │
│ • PrismaChallengeRepository │ │ • GetChallengeUseCase │
│ • PrismaGroupRepository │ │ • GetGroupUseCase │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
└──────────────────┬───────────────┘
↓

PHASE 2.5: INTEGRATION (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Update tRPC Context (opus) │
│ │
│ • Add container to TRPCContext │
│ • Configure request-scoped child containers │
│ • Register PrismaClient per request │
└─────────────────────────────────────────────────────────────┘
↓

PHASE 3: USER STORIES (Parallel - 4 Agents Max)
────────────────────────────────────────────────────────────────
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ Step 8: User Router │ │ Step 9: Challenge │ │ Step 10: Trip Router │
│ (sonnet) │ │ Router (sonnet) │ │ (sonnet) │
│ │ │ │ │ │
│ • UserController │ │ • ChallengeController│ │ • TripController │
│ • user.ts migration │ │ • challenge.ts │ │ • trip.ts migration │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
└─────────────────────┬─────────────────────┘
↓

PHASE 4: ANALYSIS (Parallel - 1 Agent, runs WITH Phase 3)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 11: Effect.ts Analysis (opus) │
│ ↓ │
│ Step 12: Recommendations (sonnet) │
│ │
│ • 114 Result<T,E> imports │
│ • Go/No-Go recommendation │
│ • Pilot use case selection │
└─────────────────────────────────────────────────────────────┘

PHASE 5: FINALIZATION (Sequential - 1 Agent)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Step 13: Update Documentation (sonnet) │
│ ↓ │
│ Step 14: Knowledge Transfer (sonnet) │
│ │
│ • AGENTS.md / CLAUDE.md updates │
│ • awilix-modular setup guide │
│ • Team walkthrough session │
└─────────────────────────────────────────────────────────────┘

```

#### Execution Timeline

```

Time →
│
├─ 0-1h: [opus] Step 1 (Dependencies)
├─ 1-2h: [opus] Step 2 (Verify tsconfig)
├─ 2-4h: [opus] Step 3 (Container)
├─ 4-6h: [opus] Step 4 (Module Structure)
│
├─ 6-10h: [sonnet] Step 5 (Repositories) ──────────────┐
├─ 6-10h: [sonnet] Step 6 (Use Cases) ────────────────┤
│ │
├─ 10-14h: [opus] Step 7 (tRPC Context) ◄───────────────┘
│
├─ 14-18h: [sonnet] Step 8 (User Router) ────┐
├─ 14-18h: [sonnet] Step 9 (Challenge Router)├┐
├─ 14-18h: [sonnet] Step 10 (Trip Router) ───┘│
├─ 14-20h: [opus] Step 11 (Effect.ts Analysis)─┘
│
├─ 20-22h: [sonnet] Step 12 (Recommendations)
├─ 22-24h: [sonnet] Step 13 (Documentation)
└─ 24-26h: [sonnet] Step 14 (Knowledge Transfer)

````

**Key Insight**: Maximum parallelization occurs between hours 14-18 when 4 agents can work simultaneously (3 routers + Effect analysis).

---

### Sub-Agent Execution Directive

#### Execution Strategy Overview

This task uses a **phased parallel execution** strategy with clear quality gates between phases. Steps within the same phase can execute in parallel; steps across phases have explicit dependencies.

#### How to Execute Steps in Parallel

**Phase 1 (Steps 1-4): Sequential Execution**

- Single `opus` agent executes all 4 steps in sequence
- No parallelization possible (each step builds on previous)
- Quality Gate: Foundation Complete (verify container resolves @Module decorated test class)

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
````

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
  "taskFile": ".specs/tasks/draft/implement-awilix-dependency-injection.refactor.md",
  "step": 8,
  "stepName": "Migrate User Router to DI (Pilot)",
  "agentType": "sonnet",
  "parallelWith": [9, 10, 11],
  "blockedBy": [7],
  "qualityGate": "User router uses ctx.container.resolve(UserController)",
  "filesToModify": [
    "apps/backend-server/src/routers/user.ts",
    "packages/adapters/src/controllers/user-controller.ts"
  ],
  "patternTemplate": "Use @Module() decorator and container.resolve() pattern",
  "risks": ["Router regression affecting production endpoints"],
  "rollback": "Revert to manual instantiation in user.ts"
}
```

#### Quality Gates Between Phases

**Gate 1: Foundation Complete** (After Step 4)

```yaml
Checklist:
  - [ ] Container resolves a test class from @Module decorated module
  - [ ] bun.lock includes awilix and awilix-modular
  - [ ] TypeScript compiles without errors (bunx tsc --noEmit)
  - [ ] Zero dependency-cruiser violations from new di/ directory
  - [ ] Module structure exports all required modules
  - [ ] No experimentalDecorators or emitDecoratorMetadata in tsconfig
Verification:
  Run: bun test packages/frameworks/src/di/container.test.ts
```

**Gate 2: Domain Layer Ready** (After Steps 5 & 6)

```yaml
Checklist:
  - [ ] PrismaUserRepository resolves from container by token
  - [ ] PrismaChallengeRepository resolves from container by token
  - [ ] PrismaGroupRepository resolves from container by token
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
  - [ ] Container can resolve UserRepository with registered PrismaClient
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
  - [ ] "No tsconfig changes" documented as key benefit
Verification:
  Review: All documentation files
  Test: New developer can implement DI in <15 minutes (timeboxed)
```

#### Example Sub-Agent Prompts

**Prompt for Parallel Repository Migration (Step 5):**

```
You are a sonnet sub-agent assigned to execute Step 5 of the awilix-modular implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-awilix-dependency-injection.refactor.md
- Your Step: 5 (Migrate Repositories to Modules)
- Running Parallel With: Step 6 (Migrate Use Cases)
- Blocked Until: Step 4 completes
- Agent Type: sonnet (standard development)

YOUR ASSIGNMENT:
Register 3 pilot repositories in RepositoryModule:
1. PrismaUserRepository
2. PrismaChallengeRepository
3. PrismaGroupRepository

CRITICAL PATTERNS:
- Use @Module() decorator for RepositoryModule
- Register providers with { token: 'UserRepository', useClass: PrismaUserRepository }
- Use awilix inject pattern for PrismaClient (NOT decorators)
- Keep backward-compatible constructors (optional injection)

OUTPUT FILES:
- packages/adapters/src/modules/RepositoryModule.ts
- packages/adapters/src/gateways/PrismaUserRepository.ts (modified)
- packages/adapters/src/gateways/PrismaChallengeRepository.ts (modified)
- packages/adapters/src/gateways/PrismaGroupRepository.ts (modified)
- packages/adapters/src/gateways/__tests__/container-resolution.test.ts (new)

QUALITY GATE:
- All 3 repositories resolve from container in test
- Existing repository tests still pass
- Zero dependency-cruiser violations
- No experimental TypeScript settings needed

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
You are a sonnet sub-agent assigned to execute Step 6 of the awilix-modular implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-awilix-dependency-injection.refactor.md
- Your Step: 6 (Migrate Use Cases to Modules)
- Running Parallel With: Step 5 (Migrate Repositories)
- Blocked Until: Step 4 completes
- Agent Type: sonnet (standard development)

YOUR ASSIGNMENT:
Register 3-5 pilot use cases in UseCaseModule:
1. GetUserUseCase
2. GetChallengeUseCase
3. GetGroupUseCase
(+ 2 more as time permits)

CRITICAL PATTERNS:
- Use @Module() decorator for UseCaseModule
- Import RepositoryModule to get repository access
- Configure provider injection for repositories
- Remove manual repository instantiation from tests
- Use test container utility (created by Step 5 agent)

OUTPUT FILES:
- packages/use-cases/src/modules/UseCaseModule.ts
- packages/use-cases/src/interactors/GetUserUseCase.ts (modified)
- packages/use-cases/src/interactors/GetChallengeUseCase.ts (modified)
- packages/use-cases/src/interactors/GetGroupUseCase.ts (modified)
- packages/use-cases/src/interactors/__tests__/container-based.test.ts (new)

QUALITY GATE:
- All use cases resolve from container with injected repositories
- Existing use case tests pass with new container setup
- Can swap repository implementations via module override

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
You are a sonnet sub-agent assigned to execute Step {{stepNumber}} of the awilix-modular implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-awilix-dependency-injection.refactor.md
- Your Step: {{stepNumber}} ({{stepName}})
- Running Parallel With: Steps 8, 9, 10, 11 (all router pilots + Effect analysis)
- Blocked Until: Step 7 completes
- Agent Type: sonnet (standard development)

YOUR ASSIGNMENT:
Migrate {{domain}} router to use container-based dependency resolution:
- Register {{domain}}Controller in ControllerModule
- Configure {{domain}}Repository injection
- Update {{domain}} router to use ctx.container.resolve()
- Remove manual repository/controller instantiation
- Measure and document boilerplate reduction

CRITICAL PATTERNS:
- Register in ControllerModule: { useClass: {{domain}}Controller }
- Inject repository via awilix
- Replace: `new {{domain}}Controller(repo)` → `ctx.container.resolve({{domain}}Controller)`
- Router file: apps/backend-server/src/routers/{{domainLower}}.ts

OUTPUT FILES:
- packages/adapters/src/modules/ControllerModule.ts (modified)
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
You are an opus sub-agent assigned to execute Step 11 of the awilix-modular implementation task.

CONTEXT:
- Task File: .specs/tasks/draft/implement-awilix-dependency-injection.refactor.md
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
   - ✅ AC2: @Module() decorator auto-registers repositories
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
   - ✅ No tsconfig.json changes required (verified)

3. **Documentation Complete**:
   - ✅ awilix-modular setup guide exists
   - ✅ AGENTS.md updated with DI pattern section
   - ✅ CLAUDE.md updated with container conventions
   - ✅ Troubleshooting guide exists
   - ✅ "No experimental TypeScript" documented as benefit

4. **Team Enablement**:
   - ✅ Knowledge transfer session completed
   - ✅ Team can implement new DI-enabled repositories
   - ✅ FAQ document addresses common questions

5. **Metrics**:
   - ✅ Boilerplate reduction measured (target: 30%+ reduction in router code)
   - ✅ Response time overhead <5% vs baseline
   - ✅ Test setup time reduction documented
   - ✅ Configuration overhead eliminated (no tsconfig changes)

---

### Critical Path (Optimized with Parallelization)

**Critical Path Definition**: The minimum sequence of steps required for the core DI implementation, accounting for maximum parallel execution.

**Optimized Critical Path**: **Steps 1 → 2 → 3 → 4 → (5||6) → 7 → (8||9||10||11) → 12 → 13 → 14**

```
Phase 1: Setup (Steps 1-4) - Sequential, 1 Agent
├─ Step 1: Install Dependencies (opus)
├─ Step 2: Verify tsconfig (opus)
├─ Step 3: Create Container (opus)
└─ Step 4: Module Structure (opus)
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

- **Sequential**: ~38-56 hours (all steps in series)
- **Optimized**: ~26 hours (with parallel execution)
- **Time Savings**: 12-30 hours (32-53% reduction)

**Maximum Parallel Depth**: **5 Agents**
At peak (Phase 3), can run:

- 3 sonnet agents on router migrations (Steps 8, 9, 10)
- 1 opus agent on Effect.ts analysis (Step 11)
- 1 opus agent on tRPC Context (Step 7, if timing overlaps)

**Effort Distribution by Agent Type**:

- **opus**: 5 steps (1, 2, 3, 4, 7, 11) - Foundation + Critical Integrations
- **sonnet**: 9 steps (5, 6, 8, 9, 10, 12, 13, 14) - Pattern Application
- **haiku**: 0 steps (all require substantial complexity)

---

### High Priority Risks

| Rank  | Risk                            | Likelihood | Impact | Mitigation Strategy                                                                                                                                                |
| ----- | ------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | **Awilix Module Configuration** | Medium     | High   | Test awilix-modular with minimal module setup immediately in Step 2; have fallback to manual registration if needed; validate with test case before full migration |
| **2** | **Circular Dependencies**       | Low        | High   | Run dependency-cruiser after each phase; use dependency visualization to catch cycles early; consider splitting modules if cycles emerge                           |
| **3** | **Test Mocking Complexity**     | Medium     | Medium | Create shared `createTestContainer()` utility; document module override patterns; include test examples in documentation                                           |
| **4** | **tRPC Context Type Breaks**    | Medium     | High   | Validate type changes with one router before all; maintain backward-compatible context properties; use TypeScript strict checking                                  |
| **5** | **Container Scope Confusion**   | Medium     | Medium | Document scope strategy clearly (singleton repos, transient use cases); test with concurrent requests; add runtime validation in development                       |
| **6** | **Module Organization Chaos**   | Medium     | Medium | Document clear module hierarchy patterns; enforce naming conventions; create module creation guide                                                                 |

**Risk Monitoring**:

- Weekly risk review during implementation
- Stop-work criteria if Risk #1 or #4 materializes (rollback to manual DI)
- Risk #3, #5, and #6 can be addressed during implementation without stopping work

---

## Architecture Overview

### Solution Strategy

#### How awilix-modular Fits into Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Frameworks Layer (packages/frameworks/src/di/)              │
│ ├─ DIContext initialization with awilix-modular             │
│ ├─ Root container configuration                             │
│ ├─ Module registration (AppModule, RepositoryModule, etc.)  │
│ └─ CommonDependencies type declaration                      │
├─────────────────────────────────────────────────────────────┤
│ Adapters Layer (packages/adapters/src/)                   │
│ ├─ Controller implementations (registered in modules)       │
│ ├─ Repository implementations (registered in modules)       │
│ ├─ Module definitions per domain/feature                    │
│ └─ Receive dependencies via ModuleDef['deps']               │
├─────────────────────────────────────────────────────────────┤
│ Use Cases Layer (packages/use-cases/src/)                   │
│ ├─ Interactor implementations (registered in modules)       │
│ └─ Receive repositories via type-safe injection             │
├─────────────────────────────────────────────────────────────┤
│ Domain Layer (packages/domain/src/)                         │
│ └─ Pure entities/value objects (no DI coupling)             │
└─────────────────────────────────────────────────────────────┘
```

The DIContext lives in the Frameworks layer as infrastructure concern. Adapters receive dependencies via `ModuleDef['deps']` type-safe injection, maintaining Clean Architecture's inward dependency direction. Domain layer remains pure with no DI coupling.

#### Container Lifecycle

| Component    | Scope     | Rationale                                             |
| ------------ | --------- | ----------------------------------------------------- |
| PrismaClient | SINGLETON | Connection pooling, expensive initialization          |
| Repositories | SINGLETON | Stateless, hold PrismaClient reference, thread-safe   |
| Use Cases    | SCOPED    | Request-scoped business logic, may hold request state |
| Controllers  | SCOPED    | Per-request handling, access to request-scoped deps   |
| DIContext    | SCOPED    | Created per tRPC request for isolation                |

**Reasoning**: PrismaClient and repositories are stateless and expensive to create, making them ideal for singleton scope. Use cases and controllers encapsulate request-specific logic and should be request-scoped (SCOPED) for proper isolation. DIContext is created fresh per tRPC request, enabling clean transaction scoping.

#### Migration Strategy

**Approach**: Incremental Pilot Migration (Phase-based with Parallelization)

1. **Phase 1: Infrastructure** (Sequential - 1 opus agent)
   - Install awilix + awilix-modular packages
   - Verify NO tsconfig.json changes needed (key benefit)
   - Create DIContext configuration in frameworks layer
   - Create module structure (RepositoryModule, ControllerModule, UseCaseModule)

2. **Phase 2: Foundational** (Parallel - 2 agents)
   - Migrate 3 pilot repositories: PrismaUserRepository, PrismaChallengeRepository, PrismaGroupRepository
   - Migrate 3-5 pilot use cases: GetUserUseCase, GetChallengeUseCase, GetGroupUseCase
   - Update tRPC context with DIContext integration

3. **Phase 3: Router Pilots** (Parallel - 3-4 agents)
   - Migrate User, Challenge, Trip routers
   - Effect.ts analysis runs in parallel (Step 11)
   - Measure boilerplate reduction and response times

4. **Phase 4: Finalization** (Sequential - 1 agent)
   - Complete Effect.ts recommendations document
   - Update AGENTS.md and CLAUDE.md with DI patterns
   - Conduct knowledge transfer session

**Rationale**: Incremental migration minimizes risk while allowing pattern refinement. Phased approach enables parallel execution (up to 4 agents), reducing total time from 56 hours to ~26 hours. Backward compatibility maintained—existing manual DI continues to work alongside container-based DI.

#### Effect.ts Analysis Approach

**Approach**: Analysis only (no implementation)

Effect.ts represents a paradigm shift from the current `Result<T,E>` pattern to functional programming with `Effect<A,E,R>`. The analysis will:

- Document all 114 Result<T,E> import locations across 73 use cases
- Compare Effect.ts `Either<A,E>` patterns with current Result<T,E> implementation
- Identify 3+ high-value migration candidates (complex async flows, retry scenarios, resource management)
- Analyze learning curve and training requirements for team
- Provide Go/No-Go recommendation with effort estimates and pilot plan

**Rationale**: Full Effect.ts migration would require 280-520 hours and significant team training. Current `Result<T,E>` implementation is adequate and battle-tested. Effect.ts adoption should be evaluated for greenfield modules post-awilix stabilization. Analysis fulfills AC6 without scope creep.

### Key Architectural Decisions

#### KD1: awilix-modular vs InversifyJS

**Decision**: awilix-modular

**Rationale**:

- **No experimental TypeScript features needed** - Works with standard tsconfig.json (major advantage for Mirai App)
- **No reflect-metadata dependency** - Eliminates polyfill and import overhead
- **Automatic type safety** - `ModuleDef['deps']` provides full type inference without manual service identifiers
- **NestJS-like module organization** - Familiar to developers with NestJS experience
- **Framework-agnostic** - Works with tRPC, Fastify, Clean Architecture without coupling
- **Progressive migration** - Can work alongside existing code during transition

**Comparison:**

| Aspect         | awilix-modular            | InversifyJS                     |
| -------------- | ------------------------- | ------------------------------- |
| TS Config      | No changes needed         | Requires experimentalDecorators |
| Metadata       | No reflect-metadata       | Requires reflect-metadata       |
| Type Safety    | Automatic ModuleDef       | Manual symbol definitions       |
| Modularity     | Built-in @Module system   | Manual container modules        |
| Migration Path | Progressive               | Requires full adoption          |
| Bundle Size    | Lightweight (awilix base) | Larger with metadata overhead   |

**Rejected Alternative**: InversifyJS - requires experimentalDecorators and emitDecoratorMetadata in tsconfig.json, reflect-metadata dependency, manual symbol definitions with string/Symbol identifiers.

#### KD2: Module-based vs Decorator-based Registration

**Decision**: Module-based with `createStaticModule()` (not decorator-based)

**Rationale**:

- **Single source of truth** - Define dependencies once in ModuleDef, reuse across all services
- **Clear separation by domain** - UserModule, ChallengeModule, TripModule for maintainability
- **Type-safe dependencies** - `ModuleDef['deps']` provides IntelliSense for all injected services
- **Testability** - Easy to override entire modules for testing with mock implementations
- **No domain coupling** - Keep decorators out of domain layer (Clean Architecture compliant)
- **Native ES decorators** - Uses Stage 3 decorators if needed, no experimental TypeScript features

**Pattern:**

```typescript
// Define module structure with full type inference
type UserModuleDef = ModuleDef<{
  providers: {
    userController: UserController;
    userRepository: PrismaUserRepository;
    getUserUseCase: GetUserUseCase;
  };
  exports: {
    userController: UserController;
  };
}>;

// Export deps type for constructor injection
export type UserModuleDeps = UserModuleDef["deps"];

// Create static module with providers
export const UserModule = createStaticModule<UserModuleDef>({
  name: "UserModule",
  providers: {
    userController: UserController,
    userRepository: PrismaUserRepository,
    getUserUseCase: GetUserUseCase,
  },
  exports: {
    userController: UserController,
  },
});
```

**Trade-off**: More initial setup than flat container, but better long-term maintainability and type safety.

#### KD3: Container Placement

**Decision**: `packages/frameworks/src/di/`

**Rationale**:

- Container is infrastructure/framework concern (not business logic)
- Maintains Clean Architecture dependency direction (inward only)
- Adapters layer receives dependencies via injection, doesn't define container
- Test setup can override module bindings without modifying adapter code
- No dependency-cruiser violations (frameworks layer can be imported by adapters)
- Follows existing pattern: Prisma config in frameworks, repositories in adapters

**File Structure:**

```
packages/frameworks/src/di/
├── AppModule.ts       # Root module composing RepositoryModule, UseCaseModule, ControllerModule
├── index.ts           # Public exports (createDIContext, test utilities)
├── types.ts           # CommonDependencies type declaration
└── test-utils.ts      # Test container factory and mocking utilities
```

**Rejected Alternative**: `packages/adapters/src/di/` would violate Clean Architecture by placing infrastructure in the adapters layer, causing dependency direction violations.

#### KD4: Effect.ts Implementation Scope

**Decision**: Analysis only for this task

**Rationale**:

- Task scope limited to awilix-modular implementation (AC1-AC5 primary deliverables)
- Effect analysis fulfills AC6 ("recommendation document exists") without implementation
- 114 Result<T,E> imports across 73 use cases would require massive refactoring
- Current `Result<T,E>` pattern is adequate and battle-tested in production
- Team learning curve requires 40+ hours training for functional programming concepts
- Recommends greenfield module evaluation post-awilix stabilization

### Component Overview

#### DIContext Configuration

**File:** `packages/frameworks/src/di/index.ts`

```typescript
import { createStaticModule, DIContext, type ModuleDef } from "awilix-modular";
import { RepositoryModule } from "@mirai/adapters";
import { UseCaseModule } from "@mirai/use-cases";
import type { PrismaClient } from "@mirai/db";
import type { SupabaseClient } from "@supabase/supabase-js";

// Define common dependencies available to all modules
type CommonDeps = {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
};

// Root module composing all sub-modules
type AppModuleDef = ModuleDef<{
  imports: [typeof RepositoryModule, typeof UseCaseModule];
}>;

export const AppModule = createStaticModule<AppModuleDef>({
  name: "AppModule",
  imports: [RepositoryModule, UseCaseModule],
});

// Make common deps available globally via TypeScript module augmentation
declare module "awilix-modular" {
  interface CommonDependencies extends CommonDeps {}
}

// Factory function for creating DIContext (used in tRPC context creation)
export function createDIContext(
  framework: FastifyInstance,
  rootProviders: CommonDeps,
) {
  return DIContext.create(AppModule, {
    framework,
    rootProviders,
  });
}

// Factory function for creating test DIContext
export function createTestDIContext(overrides: Partial<CommonDeps> = {}) {
  return DIContext.create(TestAppModule, {
    rootProviders: {
      prisma: overrides.prisma || mockPrisma,
      supabase: overrides.supabase || mockSupabase,
      headers: new Headers(),
      accessToken: null,
      ...overrides,
    },
  });
}
```

#### Module Organization

**RepositoryModule:** `packages/adapters/src/modules/RepositoryModule.ts`

```typescript
import { createStaticModule, type ModuleDef, Lifetime } from "awilix-modular";
import {
  PrismaUserRepository,
  PrismaChallengeRepository,
  PrismaGroupRepository,
} from "../gateways";
import type {
  UserRepository,
  ChallengeRepository,
  GroupRepository,
} from "@mirai/use-cases";

type RepositoryModuleDef = ModuleDef<{
  providers: {
    userRepository: PrismaUserRepository;
    challengeRepository: PrismaChallengeRepository;
    groupRepository: PrismaGroupRepository;
  };
}>;

export type RepositoryModuleDeps = RepositoryModuleDef["deps"];

export const RepositoryModule = createStaticModule<RepositoryModuleDef>({
  name: "RepositoryModule",
  providers: {
    userRepository: {
      useClass: PrismaUserRepository,
      lifetime: Lifetime.SINGLETON,
    },
    challengeRepository: {
      useClass: PrismaChallengeRepository,
      lifetime: Lifetime.SINGLETON,
    },
    groupRepository: {
      useClass: PrismaGroupRepository,
      lifetime: Lifetime.SINGLETON,
    },
  },
});
```

**ControllerModule:** `packages/adapters/src/modules/ControllerModule.ts`

```typescript
import { createStaticModule, type ModuleDef, Lifetime } from "awilix-modular";
import {
  UserController,
  ChallengeController,
  TripController,
} from "../controllers";
import { RepositoryModule } from "./RepositoryModule";
import { UseCaseModule } from "@mirai/use-cases";

type ControllerModuleDef = ModuleDef<{
  providers: {
    userController: UserController;
    challengeController: ChallengeController;
    tripController: TripController;
  };
  imports: [typeof RepositoryModule, typeof UseCaseModule];
}>;

export const ControllerModule = createStaticModule<ControllerModuleDef>({
  name: "ControllerModule",
  imports: [RepositoryModule, UseCaseModule],
  providers: {
    userController: {
      useClass: UserController,
      lifetime: Lifetime.SCOPED,
    },
    challengeController: {
      useClass: ChallengeController,
      lifetime: Lifetime.SCOPED,
    },
    tripController: {
      useClass: TripController,
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: {
    userController: UserController,
    challengeController: ChallengeController,
    tripController: TripController,
  },
});
```

**UseCaseModule:** `packages/use-cases/src/modules/UseCaseModule.ts`

```typescript
import { createStaticModule, type ModuleDef, Lifetime } from "awilix-modular";
import {
  GetUserUseCase,
  GetChallengeUseCase,
  GetGroupUseCase,
} from "../interactors";
import { RepositoryModule } from "@mirai/adapters";

type UseCaseModuleDef = ModuleDef<{
  providers: {
    getUserUseCase: GetUserUseCase;
    getChallengeUseCase: GetChallengeUseCase;
    getGroupUseCase: GetGroupUseCase;
  };
  imports: [typeof RepositoryModule];
}>;

export const UseCaseModule = createStaticModule<UseCaseModuleDef>({
  name: "UseCaseModule",
  imports: [RepositoryModule],
  providers: {
    getUserUseCase: {
      useClass: GetUserUseCase,
      lifetime: Lifetime.SCOPED,
    },
    getChallengeUseCase: {
      useClass: GetChallengeUseCase,
      lifetime: Lifetime.SCOPED,
    },
    getGroupUseCase: {
      useClass: GetGroupUseCase,
      lifetime: Lifetime.SCOPED,
    },
  },
});
```

#### Provider Patterns

**useClass (Most Common):**

```typescript
providers: {
  // Simple class registration with default lifetime
  userController: UserController,

  // With explicit lifetime configuration
  userRepository: {
    useClass: PrismaUserRepository,
    lifetime: Lifetime.SINGLETON,
  },

  // Multiple providers in module
  challengeRepository: {
    useClass: PrismaChallengeRepository,
    lifetime: Lifetime.SINGLETON,
  },
}
```

**useFactory (Configuration with Dependencies):**

```typescript
import { createFactoryProvider } from "awilix-modular";

const factory = createFactoryProvider<UserModuleDef["deps"]>();

providers: {
  // Primitive value provider
  apiKey: "sendgrid_key_123",

  // Factory provider with dependency injection
  emailService: factory({
    provide: EmailService,
    inject: ["apiKey", "logger"],
    useFactory: (apiKey, logger) => {
      return new EmailService({ apiKey, logger });
    },
  }),
}
```

**useValue (Primitives and Config):**

```typescript
providers: {
  // Configuration values
  apiUrl: "https://api.example.com",
  port: 3000,
  isDevelopment: process.env.NODE_ENV === "development",

  // Pre-constructed objects
  logger: new PinoLogger(),

  // Feature flags
  features: {
    enableCache: true,
    maxRetries: 3,
  },
}
```

### Contract/Interface Definitions

#### Extended TRPCContext with DIContext

**File:** `packages/adapters/src/api/trpc.ts`

```typescript
import type { DIContext } from "awilix-modular";
import type { AppModule } from "@mirai/frameworks";
import type { PrismaClient } from "@mirai/db";
import type { SupabaseClient } from "@supabase/supabase-js";

// Extract DIContext type from AppModule
type DIContextType = ReturnType<typeof DIContext.create<typeof AppModule>>;

export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
  di: DIContextType; // NEW: awilix-modular DI context for dependency resolution
}

// Updated context creation function
export const createTRPCContext = (opts: {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
  di: DIContextType;
}) => {
  return {
    db: opts.db,
    supabase: opts.supabase,
    headers: opts.headers,
    accessToken: opts.accessToken,
    di: opts.di, // DI context available to all procedures
  };
};
```

#### Test Container Factory

**File:** `packages/frameworks/src/di/test-utils.ts`

```typescript
import { createContainer, asClass, asValue, Lifetime } from "awilix";
import { createStaticModule, DIContext } from "awilix-modular";

/**
 * Creates a test container with optional repository overrides.
 * Used for unit testing services with mocked dependencies.
 */
export function createTestContainer(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof createContainer> {
  const container = createContainer();

  // Register default test implementations (in-memory)
  container.register({
    userRepository: asClass(InMemoryUserRepository).singleton(),
    challengeRepository: asClass(InMemoryChallengeRepository).singleton(),
    groupRepository: asClass(InMemoryGroupRepository).singleton(),
  });

  // Apply test-specific overrides
  Object.entries(overrides).forEach(([key, value]) => {
    container.register(key, asValue(value));
  });

  return container;
}

/**
 * Creates a mock repository module for integration testing.
 * Allows swapping real repositories with in-memory implementations.
 */
export function createMockRepositoryModule(mocks: Record<string, unknown>) {
  return createStaticModule({
    name: "MockRepositoryModule",
    providers: mocks,
  });
}

/**
 * Creates a test DIContext with configurable root providers.
 * Used for integration testing with full module resolution.
 */
export function createTestDIContext(
  options: {
    prisma?: PrismaClient;
    supabase?: SupabaseClient;
    repositoryOverrides?: Record<string, unknown>;
  } = {},
) {
  const mockRepoModule = createMockRepositoryModule({
    userRepository:
      options.repositoryOverrides?.userRepository ||
      new InMemoryUserRepository(),
    challengeRepository:
      options.repositoryOverrides?.challengeRepository ||
      new InMemoryChallengeRepository(),
    groupRepository:
      options.repositoryOverrides?.groupRepository ||
      new InMemoryGroupRepository(),
  });

  return DIContext.create(TestAppModule, {
    rootProviders: {
      prisma: options.prisma || mockPrisma,
      supabase: options.supabase || mockSupabase,
      headers: new Headers(),
      accessToken: null,
    },
  });
}
```

**Usage in Tests:**

```typescript
// Unit test with mocked repository
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { createTestContainer } from "@mirai/frameworks/di";
import { GetUserUseCase } from "@mirai/use-cases";

describe("GetUserUseCase", () => {
  let container: ReturnType<typeof createTestContainer>;

  beforeEach(() => {
    container = createTestContainer({
      userRepository: {
        findById: mock(() => Promise.resolve({ id: "123", name: "Test" })),
        findByEmail: mock(() => Promise.resolve(null)),
      },
    });
  });

  it("should return user when exists", async () => {
    const useCase = container.cradle.getUserUseCase;
    const result = await useCase.execute({ userId: "123" });
    expect(result.isSuccess()).toBe(true);
  });
});

// Integration test with in-memory repositories
describe("UserController Integration", () => {
  let diContext: ReturnType<typeof createTestDIContext>;

  beforeEach(() => {
    diContext = createTestDIContext();
  });

  it("should create user", async () => {
    const controller = diContext.cradle.userController;
    const result = await controller.create({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });
});
```

#### Factory Patterns (Before/After)

**Repository Resolution - Before:**

```typescript
// packages/adapters/src/api/controllers/index.ts (lines 260-265)
export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Manual instantiation - repeated boilerplate in 100+ procedures
      const repo = new PrismaUserRepository(ctx.db);
      const controller = new UserController(repo);
      const result = await controller.getById({ id: input.id });

      if (!result.success) {
        throw new TRPCError({ code: "NOT_FOUND", message: result.error });
      }

      return result.data;
    }),
};
```

**Repository Resolution - After:**

```typescript
// packages/adapters/src/api/controllers/index.ts
export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Single line - DI resolves controller and all dependencies
      const result = await ctx.di.cradle.userController.getById(input);

      if (!result.success) {
        throw new TRPCError({ code: "NOT_FOUND", message: result.error });
      }

      return result.data;
    }),
};
```

**Controller Factory Pattern - Before:**

```typescript
// Manual instantiation with cascading dependencies
const repo = new PrismaUserRepository(ctx.db);
const useCase = new GetUserUseCase(repo);
const controller = new UserController(useCase);
const result = await controller.getById(input);
```

**Controller Factory Pattern - After:**

```typescript
// Automatic resolution via DIContext cradle
const result = await ctx.di.cradle.userController.getById(input);
// Dependencies (controller -> useCase -> repo) resolved automatically
```

### Expected Changes

#### New Files (7)

| File                | Location                          | Purpose                                                                 |
| ------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| AppModule.ts        | `packages/frameworks/src/di/`     | Root module composing RepositoryModule, UseCaseModule, ControllerModule |
| index.ts            | `packages/frameworks/src/di/`     | Public exports (createDIContext, createTestDIContext, test utilities)   |
| types.ts            | `packages/frameworks/src/di/`     | CommonDependencies type declaration and module augmentation             |
| test-utils.ts       | `packages/frameworks/src/di/`     | Test container factory and mocking utilities                            |
| RepositoryModule.ts | `packages/adapters/src/modules/`  | Repository provider registrations with SINGLETON lifetime               |
| ControllerModule.ts | `packages/adapters/src/modules/`  | Controller provider registrations with SCOPED lifetime                  |
| UseCaseModule.ts    | `packages/use-cases/src/modules/` | Use case provider registrations with SCOPED lifetime                    |

#### Files to Modify (Pilot Scope - 9 files)

| Layer      | File                           | Changes                                                          |
| ---------- | ------------------------------ | ---------------------------------------------------------------- |
| Frameworks | `tsconfig.json`                | **NO CHANGES NEEDED** - Key benefit of awilix-modular            |
| Adapters   | `PrismaUserRepository.ts`      | Constructor updated to use `deps: RepositoryModuleDeps` pattern  |
| Adapters   | `PrismaChallengeRepository.ts` | Constructor updated to use `deps: RepositoryModuleDeps` pattern  |
| Adapters   | `PrismaGroupRepository.ts`     | Constructor updated to use `deps: RepositoryModuleDeps` pattern  |
| Adapters   | `user-controller.ts`           | Constructor updated to use `deps: ControllerModuleDeps` pattern  |
| Adapters   | `api/trpc.ts`                  | Add `di: DIContextType` property to TRPCContext interface        |
| Adapters   | `api/controllers/index.ts`     | Replace manual instantiation with `ctx.di.cradle.controller`     |
| Apps       | `server.ts`                    | Initialize DIContext in createContext, pass to createTRPCContext |
| Apps       | `routers/user.ts`              | Update to use `ctx.di.cradle.userController` (thin wrapper)      |

### Integration Points

#### IP1: tRPC Context Creation

**Location:** `apps/backend-server/src/server.ts` (createContext function)

**Integration Pattern:**

```typescript
import { createDIContext } from "@mirai/frameworks";

createContext: (opts) => {
  // Create fresh PrismaClient per request (existing pattern)
  const db = createDb(databaseUrl);
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const headers = opts.req.headers;
  const accessToken = extractToken(headers);

  // Create DIContext with request-scoped providers
  const di = createDIContext(server, {
    prisma: db,
    supabase,
    headers,
    accessToken,
  });

  return createTRPCContext({
    db,
    supabase,
    headers,
    accessToken,
    di, // DI context for dependency resolution throughout request
  });
};
```

**Key Points:**

- DIContext created fresh per request (request-scoped, Lifetime.SCOPED)
- PrismaClient registered as root provider per request (enables transaction scoping)
- All 19 routers share the same DIContext instance for a given request
- Enables clean transaction management across multiple repositories
- Maintains existing tRPC context creation pattern with DI addition

---

#### IP2: Repository Instantiation

**Location:** `packages/adapters/src/gateways/` (16 repositories)

**Integration Pattern:**

```typescript
// PrismaUserRepository.ts
import type { RepositoryModuleDeps } from "../modules/RepositoryModule";

export class PrismaUserRepository
  extends BasePrismaRepository<User>
  implements UserRepository
{
  // Dependencies injected via constructor with type-safe ModuleDef
  constructor(private readonly deps: RepositoryModuleDeps) {
    super(deps.prisma); // PrismaClient from CommonDependencies
  }

  async findById(id: string): Promise<User | null> {
    // Access prisma via deps for all database operations
    const record = await this.deps.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.deps.prisma.user.findUnique({
      where: { email: email.value },
    });
    return record ? UserMapper.toDomain(record) : null;
  }
}
```

**Registration in Module:**

```typescript
// RepositoryModule.ts
export const RepositoryModule = createStaticModule<RepositoryModuleDef>({
  name: "RepositoryModule",
  providers: {
    userRepository: {
      useClass: PrismaUserRepository,
      lifetime: Lifetime.SINGLETON, // Stateless, thread-safe
    },
    challengeRepository: {
      useClass: PrismaChallengeRepository,
      lifetime: Lifetime.SINGLETON,
    },
    groupRepository: {
      useClass: PrismaGroupRepository,
      lifetime: Lifetime.SINGLETON,
    },
  },
});
```

**Key Points:**

- Repositories use `deps: RepositoryModuleDeps` pattern for type-safe injection
- `RepositoryModuleDeps` includes `prisma` from CommonDependencies via module imports
- Lifetime.SINGLETON ensures one repository instance per container (stateless)
- BasePrismaRepository pattern maintained with PrismaClient from deps

---

#### IP3: Use Case Creation

**Location:** `packages/use-cases/src/interactors/` (73 use cases)

**Integration Pattern:**

```typescript
// GetUserUseCase.ts
import type { UseCaseModuleDeps } from "../modules/UseCaseModule";
import { ok, err } from "../../utils/result";

export class GetUserUseCase {
  constructor(private readonly deps: UseCaseModuleDeps) {}

  async execute(input: GetUserInput): Promise<Result<UserDTO, string>> {
    // Repository accessed via type-safe deps
    const user = await this.deps.userRepository.findById(input.userId);

    if (!user) {
      return err("User not found");
    }

    return ok(UserDTO.fromDomain(user));
  }
}
```

**Registration in Module:**

```typescript
// UseCaseModule.ts
export const UseCaseModule = createStaticModule<UseCaseModuleDef>({
  name: "UseCaseModule",
  imports: [RepositoryModule], // Access to repositories
  providers: {
    getUserUseCase: {
      useClass: GetUserUseCase,
      lifetime: Lifetime.SCOPED, // Request-scoped
    },
    getChallengeUseCase: {
      useClass: GetChallengeUseCase,
      lifetime: Lifetime.SCOPED,
    },
  },
});
```

**Key Points:**

- Use cases use `deps: UseCaseModuleDeps` for type-safe repository access
- `UseCaseModuleDeps` includes all repositories via `RepositoryModule` import
- Lifetime.SCOPED creates new use case instance per request (if needed)
- Result<T,E> pattern maintained for error handling

---

#### IP4: Controller Resolution

**Location:** `packages/adapters/src/controllers/` (17 controllers) and `packages/adapters/src/api/controllers/index.ts` (tRPC wrappers)

**Integration Pattern:**

```typescript
// UserController.ts
import type { ControllerModuleDeps } from "../modules/ControllerModule";

export class UserController {
  constructor(private readonly deps: ControllerModuleDeps) {}

  async getById(input: { id: string }): Promise<ControllerResult<UserDTO>> {
    // Use case accessed via type-safe deps
    const result = await this.deps.getUserUseCase.execute({
      userId: input.id,
    });

    if (result.isError()) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  async create(input: CreateUserInput): Promise<ControllerResult<UserDTO>> {
    const result = await this.deps.createUserUseCase.execute(input);
    // ...
  }
}
```

**Usage in tRPC Wrapper (controllers/index.ts):**

```typescript
// packages/adapters/src/api/controllers/index.ts
export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve from DIContext - all dependencies auto-wired
      const result = await ctx.di.cradle.userController.getById(input);

      if (!result.success) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: result.error,
        });
      }

      return result.data;
    }),

  create: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.di.cradle.userController.create(input);
      // ...
    }),
};
```

**Key Points:**

- Controllers use `deps: ControllerModuleDeps` for type-safe use case access
- `ControllerModuleDeps` includes use cases via `UseCaseModule` import
- tRPC wrapper accesses controller via `ctx.di.cradle.userController`
- `cradle` provides access to all exported providers from ControllerModule
- Boilerplate reduced from 3+ lines to 1 line per procedure

---

#### IP5: Test Mocking

**Location:** Test files across all packages (50+ test files)

**Integration Pattern:**

```typescript
// Unit test with mocked repository
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { createTestContainer } from "@mirai/frameworks/di";
import { GetUserUseCase } from "@mirai/use-cases";

describe("GetUserUseCase with DI", () => {
  let container: ReturnType<typeof createTestContainer>;

  beforeEach(() => {
    // Create container with mock repository
    container = createTestContainer({
      userRepository: {
        findById: mock(() =>
          Promise.resolve({
            id: "123",
            name: "Test User",
            email: "test@example.com",
          }),
        ),
        findByEmail: mock(() => Promise.resolve(null)),
      },
    });
  });

  it("should return user when exists", async () => {
    // Container resolves use case with mocked repository injected
    const useCase = container.cradle.getUserUseCase;
    const result = await useCase.execute({ userId: "123" });

    expect(result.isSuccess()).toBe(true);
    expect(result.value.id).toBe("123");
  });

  it("should return error when user not found", async () => {
    // Override mock for this test scenario
    container.register(
      "userRepository",
      asValue({
        findById: mock(() => Promise.resolve(null)),
      }),
    );

    const useCase = container.cradle.getUserUseCase;
    const result = await useCase.execute({ userId: "nonexistent" });

    expect(result.isError()).toBe(true);
    expect(result.error).toBe("User not found");
  });
});

// Integration test with in-memory repository
describe("UserController Integration", () => {
  let diContext: ReturnType<typeof createTestDIContext>;
  let inMemoryRepo: InMemoryUserRepository;

  beforeEach(() => {
    inMemoryRepo = new InMemoryUserRepository();

    diContext = createTestDIContext({
      repositoryOverrides: {
        userRepository: inMemoryRepo,
      },
    });
  });

  it("should create and retrieve user", async () => {
    const controller = diContext.cradle.userController;

    // Create user
    const createResult = await controller.create({
      email: "test@example.com",
      name: "Test User",
    });
    expect(createResult.success).toBe(true);

    // Retrieve user
    const getResult = await controller.getById({ id: createResult.data.id });
    expect(getResult.success).toBe(true);
    expect(getResult.data.email).toBe("test@example.com");
  });
});
```

**Key Points:**

- `createTestContainer()` provides container with configurable mocks
- Mock repositories registered at container level override real implementations
- Same use case class works with both real and mock repositories
- `container.cradle.getUserUseCase` resolves with mock automatically
- Module-level mocking via `createMockRepositoryModule()` for integration tests
- No manual constructor injection needed in tests

---

## Implementation Notes

### Technology Choices

| Technology     | Purpose                              | Status                  |
| -------------- | ------------------------------------ | ----------------------- |
| awilix         | IoC Container for DI                 | **Primary deliverable** |
| awilix-modular | Module organization with type safety | **Primary deliverable** |
| Effect.ts      | Structured effects analysis          | **Analysis only**       |

### Architecture Alignment

This implementation aligns with Clean Architecture principles:

```
Frameworks Layer (DIContext lives here)
      ↑ (depends on)
Adapters Layer (controllers, repositories receive injected deps)
      ↑ (depends on)
Use Cases Layer (interactors receive injected repositories)
      ↑ (depends on)
Domain Layer (pure entities, no external dependencies)
```

### Risk Mitigation

1. **Gradual migration**: Only 3 repositories as pilot (Phase 2)
2. **Backward compatibility**: Existing manual DI continues to work during transition
3. **No TypeScript config changes**: Eliminates major risk category (verified in Phase 1)
4. **Type safety**: ModuleDef['deps'] provides compile-time checking
5. **Testing strategy**: Test utilities created before router migrations (Step 5)

### Key Benefits of awilix-modular

| Benefit                    | InversifyJS     | awilix-modular      |
| -------------------------- | --------------- | ------------------- |
| Experimental TS decorators | Required        | NOT required        |
| reflect-metadata           | Required        | NOT required        |
| tsconfig.json changes      | Needed          | NOT needed          |
| Type inference             | Manual symbols  | Automatic ModuleDef |
| Service identifiers        | Symbols/strings | Type inference      |
| Module organization        | Flat            | Hierarchical        |
| Migration path             | All-or-nothing  | Progressive         |

## Implementation Notes

### Technology Choices

| Technology     | Purpose              | Status                  |
| -------------- | -------------------- | ----------------------- |
| awilix         | IoC Container for DI | **Primary deliverable** |
| awilix-modular | Module organization  | **Primary deliverable** |
| Effect.ts      | Structured effects   | **Analysis only**       |

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
3. **No TypeScript config changes**: Eliminates major risk category
4. **Rollback plan**: Can revert to manual DI if issues arise
5. **Testing**: Comprehensive tests before expanding to full codebase

### Key Benefits of awilix-modular

| Benefit                    | InversifyJS     | awilix-modular |
| -------------------------- | --------------- | -------------- |
| Experimental TS decorators | Required        | NOT required   |
| reflect-metadata           | Required        | NOT required   |
| tsconfig changes           | Needed          | NOT needed     |
| Type inference             | Manual          | Automatic      |
| Service identifiers        | Symbols/strings | Type inference |
| Module organization        | Flat            | Hierarchical   |

## Success Metrics

- [ ] Lines of boilerplate reduced in pilot routers
- [ ] Time to add new repository (measured vs current)
- [ ] Test setup time reduction
- [ ] Configuration overhead eliminated (no tsconfig changes)
- [ ] Developer satisfaction (post-implementation survey)

## References

- awilix: https://github.com/jeffijoe/awilix
- awilix-modular: https://github.com/wildstyles/awilix-modular
- Effect.ts: https://effect.website/docs
- Current repository pattern: `packages/adapters/src/gateways/BasePrismaRepository.ts`

## Research References

This task has been researched and documented. The following resources are available:

### Skill Documentation

- **Path:** `.claude/skills/awilix-effect-integration/SKILL.md` (TO BE CREATED)
- **Contents:**
  - Executive summary of awilix-modular
  - Module organization patterns
  - Comparison: awilix-modular vs InversifyJS
  - Integration patterns for Clean Architecture/DDD
  - Testing patterns with awilix
  - Best practices and common pitfalls
  - Resources and references section

### Research Scratchpad

- **Path:** `.specs/scratchpad/research-awilix-effect.md` (TO BE CREATED)
- **Contents:**
  - awilix-modular documentation analysis
  - Code examples collected
  - Compatibility analysis with current architecture
  - TypeScript configuration verification
  - Migration complexity assessment
  - Decision recommendations

### Key Research Findings

1. **awilix-modular** provides modular DI without experimental TypeScript features
2. **No tsconfig.json changes** required (eliminates configuration risk)
3. **Better type safety** with automatic ModuleDef inference
4. **NestJS-like patterns** for developers familiar with NestJS
5. Both libraries align well with DDD/Clean Architecture principles
6. awilix-modular should be prioritized (foundational DI framework)

### Resources Gathered

- awilix-modular GitHub repository (wildstyles/awilix-modular)
- awilix documentation (jeffijoe/awilix)
- Effect.ts official documentation (effect.website)
- Current codebase Result<T,E> implementation analysis

**Total Resources:** 3 documentation sources + 1 codebase analysis

---

## Sub-Agent Execution Directive

### Execution Strategy Overview

This task uses a **phased parallel execution** strategy with clear quality gates between phases. Steps within the same phase can execute in parallel; steps across phases have explicit dependencies.

### Parallelization Configuration

| Metric                     | Value                          |
| -------------------------- | ------------------------------ |
| **Total Steps**            | 16                             |
| **Sequential Steps**       | 7 (Steps 1-4, 9, 14-16)        |
| **Parallel Steps**         | 9 (Steps 5-8, 10-13)           |
| **Maximum Parallel Depth** | 4 agents                       |
| **Sequential Duration**    | 48-70 hours                    |
| **Parallel Duration**      | 26-35 hours                    |
| **Time Savings**           | 22-35 hours (46-50% reduction) |

### Phase Execution Matrix

| Phase           | Steps | Max Agents                   | Dependencies      | Gate                 |
| --------------- | ----- | ---------------------------- | ----------------- | -------------------- |
| 1. Setup        | 1-4   | 1 opus                       | Sequential        | Foundation Complete  |
| 2. Foundational | 5-8   | 4 agents (3 sonnet + 1 opus) | After Step 4      | Domain Layer Ready   |
| 2.5 Integration | 9     | 1 opus                       | After Steps 5-8   | Integration Complete |
| 3. User Stories | 10-13 | 4 agents (3 sonnet + 1 opus) | After Step 9      | Pilots Complete      |
| 4. Finalization | 14-16 | 1 sonnet                     | After Steps 10-13 | Ready for KT         |

### How to Execute Steps in Parallel

**Phase 1 (Steps 1-4): Sequential Execution**

- Single `opus` agent executes all 4 steps in sequence
- No parallelization possible (each step builds on previous)
- Quality Gate: Foundation Complete (verify container resolves @Module decorated test class)

**Phase 2 (Steps 5-8): Quad Parallel Execution**

```yaml
Strategy:
  Type: Parallel
  Agents: 4 (3 sonnet + 1 opus)
  Steps: [5, 6, 7, 8]

Execution:
  - Launch Sub-Agent A (sonnet): Execute Step 5 (Repositories)
  - Launch Sub-Agent B (opus): Execute Step 6 (UseCaseModule)
  - Launch Sub-Agent C (sonnet): Execute Step 7 (Migrate Use Cases)
  - Launch Sub-Agent D (opus): Execute Step 8 (ControllerModule)
  - All 4 start immediately after Step 4 completes
  - Wait for ALL to complete before proceeding to Step 9

Coordination:
  - Steps 5, 6, 7, 8 have NO inter-dependencies
  - Each works on different files within their domains
  - Step 5 creates test container utility first (shared resource)
  - Communication via: .specs/scratchpad/awilix-parallel-coordination.md
```

**Phase 3 (Steps 10-13): Quad Parallel Execution**

```yaml
Strategy:
  Type: Parallel
  Max Agents: 4 (3 sonnet + 1 opus)
  Steps: [10, 11, 12, 13]

Execution:
  - Launch Sub-Agent A (sonnet): Step 10 (User Router)
  - Launch Sub-Agent B (sonnet): Step 11 (Challenge Router)
  - Launch Sub-Agent C (sonnet): Step 12 (Trip Router)
  - Launch Sub-Agent D (opus): Step 13 (Effect.ts Analysis)
  - All 4 start immediately after Step 9 completes
  - Steps 10, 11, 12 have NO dependencies on each other
  - Step 13 also has NO dependency on Steps 10-12 (only needs Step 4)

Coordination:
  - Agents 10, 11, 12 share pattern knowledge via documentation
  - Agent 10 sets the pattern; 11 and 12 follow
  - Agent 13 operates independently on code analysis
  - No file conflicts (each router is separate file)
```

### Required Context to Pass to Sub-Agents

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
  "taskFile": ".specs/tasks/draft/implement-awilix-dependency-injection.refactor.md",
  "step": 10,
  "stepName": "Migrate User Router to DI",
  "agentType": "sonnet",
  "parallelWith": [11, 12, 13],
  "blockedBy": [9],
  "qualityGate": "User router uses ctx.di.container.resolve(UserController)",
  "filesToModify": [
    "apps/backend-server/src/routers/user.ts",
    "packages/adapters/src/controllers/user-controller.ts"
  ],
  "patternTemplate": "Use @Module() decorator and container.resolve() pattern",
  "risks": ["Router regression affecting production endpoints"],
  "rollback": "Revert to manual instantiation in user.ts"
}
```

### Quality Gates Between Phases

**Gate 1: Foundation Complete** (After Step 4)

```yaml
Checklist:
  - [ ] Container resolves a test class from @Module decorated module
  - [ ] bun.lock includes awilix and awilix-modular
  - [ ] TypeScript compiles without errors (bunx tsc --noEmit)
  - [ ] Zero dependency-cruiser violations from new di/ directory
  - [ ] No experimentalDecorators in tsconfig
Verification:
  Run: bun test packages/frameworks/src/di/container.test.ts
```

**Gate 2: Domain Layer Ready** (After Steps 5-8)

```yaml
Checklist:
  - [ ] All 3 pilot repositories resolve from container
  - [ ] All pilot use cases resolve with injected repositories
  - [ ] ControllerModule defined with 17 controllers
  - [ ] All existing tests pass
Verification:
  Run: bun test packages/adapters/src/gateways/
  Run: bun test packages/use-cases/src/interactors/
```

**Gate 3: Integration Complete** (After Step 9)

```yaml
Checklist:
  - [ ] TRPCContext includes container property
  - [ ] Request-scoped child containers created
  - [ ] Container can resolve UserRepository
  - [ ] Type inference works in routers
Verification:
  Run: bun test packages/adapters/src/api/trpc.test.ts
  Run: bun run build
```

**Gate 4: Pilots Complete** (After Steps 10-13)

```yaml
Checklist:
  - [ ] All 3 routers migrated and tests pass
  - [ ] Response time within 5% of baseline
  - [ ] Boilerplate reduction >30%
  - [ ] Effect.ts analysis document complete
Verification:
  Run: bun test apps/backend-server/src/routers/
  Review: .specs/analysis/effect-ts-analysis.md
```

### Example Sub-Agent Prompts

**Prompt for Parallel Repository Migration (Step 5):**

```
You are a sonnet sub-agent assigned to execute Step 5.

CONTEXT:
- Task File: .specs/tasks/draft/implement-awilix-dependency-injection.refactor.md
- Your Step: 5 (Migrate Repositories to Modules)
- Running Parallel With: Steps 6, 7, 8
- Blocked Until: Step 4 completes
- Agent Type: sonnet (standard development)
- Quality Gate: 3.5/5.0

YOUR ASSIGNMENT:
Register 3 pilot repositories in RepositoryModule:
1. PrismaUserRepository
2. PrismaChallengeRepository
3. PrismaGroupRepository

CRITICAL PATTERNS:
- Use @Module() decorator for RepositoryModule
- Register providers with { token: 'UserRepository', useClass: PrismaUserRepository }
- Keep backward-compatible constructors

OUTPUT FILES:
- packages/adapters/src/modules/RepositoryModule.ts
- Modify: PrismaUserRepository.ts, PrismaChallengeRepository.ts, PrismaGroupRepository.ts

QUALITY GATE:
- All 3 repositories resolve from container in test
- Existing repository tests still pass
- Zero dependency-cruiser violations

REPORT BACK:
1. Test results (all passing?)
2. Lines of code added/removed
3. Any blockers encountered
4. Files modified
```

**Prompt for Parallel Router Migration (Step 10, 11, or 12):**

```
You are a sonnet sub-agent assigned to execute Step {{stepNumber}}.

CONTEXT:
- Task File: .specs/tasks/draft/implement-awilix-dependency-injection.refactor.md
- Your Step: {{stepNumber}} ({{domain}} Router)
- Running Parallel With: Steps 10, 11, 12, 13
- Blocked Until: Step 9 completes
- Agent Type: sonnet (standard development)
- Quality Gate: 3.5/5.0

YOUR ASSIGNMENT:
Migrate {{domain}} router to use container-based DI:
- Register {{domain}}Controller in ControllerModule
- Configure {{domain}}Repository injection
- Update router to use ctx.container.resolve()
- Remove manual instantiation

CRITICAL PATTERNS:
- Replace: new {{domain}}Controller(repo) → ctx.container.resolve({{domain}}Controller)
- Router file: apps/backend-server/src/routers/{{domainLower}}.ts

QUALITY GATE:
- All {{domain}} endpoints work via container
- Response time within 5% of baseline
- All tests pass

REPORT BACK:
1. Test results
2. Boilerplate reduction (lines removed)
3. Performance comparison
4. Any issues encountered
```

**Prompt for Effect.ts Analysis (Step 13):**

```
You are an opus sub-agent assigned to execute Step 13.

CONTEXT:
- Task File: .specs/tasks/draft/implement-awilix-dependency-injection.refactor.md
- Your Step: 13 (Conduct Effect.ts Analysis)
- Running Parallel With: Steps 10, 11, 12
- Blocked Until: Step 4 completes
- Agent Type: opus (complex analysis)
- Quality Gate: 3.5/5.0

YOUR ASSIGNMENT:
Analyze Effect.ts patterns vs current Result<T,E> implementation:
- Catalog all 114 Result<T,E> import locations
- Compare Effect.ts Either<A,E> vs Result<T,E>
- Identify 3+ high-value migration candidates
- Provide Go/No-Go recommendation

OUTPUT FILES:
- .specs/analysis/effect-ts-analysis.md
- .specs/analysis/effect-ts-imports-catalog.md
- .specs/analysis/effect-ts-recommendations.md

QUALITY GATE:
- Analysis identifies specific use cases with before/after code
- Effort estimate includes training time
- Recommendation includes rollback plan

TIME BOUND: 6-8 hours maximum

REPORT BACK:
1. Go/No-Go recommendation
2. Top 3 use case candidates
3. Key findings summary
```

---

_Updated from InversifyJS to awilix-modular on 2026-04-09_
_Research pending for awilix-modular implementation_
