---
title: Migrate from awilix to Effect DI
status: draft
type: refactor
priority: high
created: 2026-04-15
---

## User Intent

Create a specific migration plan for the codebase to eliminate the dual dependency injection systems (awilix-modular + Effect) in favor of pure Effect Layers.

## Description

### WHAT

Migrate all dependency injection from awilix-modular to pure Effect DI using Effect Layers. The codebase currently operates in a **mixed state** where:

- Controllers already use Effect Layers (receive `Layer.Layer<unknown>` in constructor)
- awilix modules still exist for backward compatibility (5 module files)
- GraphQL resolvers still resolve controllers from container using `context.container.resolve()`
- Tests still use deprecated container-based utilities

### WHY

1. **Eliminate dual DI systems**: Currently maintaining two DI patterns (awilix + Effect) creates confusion and increases cognitive load
2. **Improve type safety**: Move from runtime string-based resolution to compile-time Layer composition
3. **Reduce complexity**: Remove 5 module files, 57 import statements, and 2 package dependencies
4. **Align with architecture**: Controllers already use Effect Layers - complete the migration

### SCOPE

| Component            | Count | Location                                                                     |
| -------------------- | ----- | ---------------------------------------------------------------------------- |
| Controllers          | 17    | `packages/adapters/src/controllers/`                                         |
| Repositories         | 17    | `packages/adapters/src/gateways/drizzle/`                                    |
| GraphQL Resolvers    | 20    | `apps/backend-server/src/graphql/resolvers/`                                 |
| Module Files         | 5     | `packages/adapters/src/modules/` (4) + `packages/use-cases/src/modules/` (1) |
| awilix Imports       | 57    | Across all packages                                                          |
| Package Dependencies | 2     | `awilix`, `awilix-modular`                                                   |

**Files to Delete:**

1. `packages/adapters/src/modules/ControllerModule.ts`
2. `packages/adapters/src/modules/RepositoryModule.ts`
3. `packages/adapters/src/modules/UseCaseModule.ts`
4. `packages/adapters/src/modules/AnalyticsModule.ts`
5. `packages/use-cases/src/modules/UseCaseModule.ts`

## Architecture Overview

### 1. Solution Strategy

The migration eliminates runtime dependency resolution (awilix container) in favor of compile-time dependency injection using Effect Layers. The solution follows a **Controller Factory Pattern**:

1. **Layer Composition at Context Creation**: All Layers (Repository, Service, Port) are composed once when creating the GraphQL context
2. **Controller Instantiation**: All 17 controllers are instantiated with the composed Layer and attached to context as a typed object
3. **Direct Access**: GraphQL resolvers access controllers via `context.controllers.controllerName` with full TypeScript intellisense
4. **Backward Compatibility**: Maintain shim functions during migration to prevent breaking changes

**Why This Approach?**

- Controllers already use Effect Layers (receive `Layer.Layer<unknown>` in constructor)
- Converting resolvers to full Effect programs would be a massive undertaking (20+ files, ~173 resolve calls)
- Direct property access provides immediate type safety without complex Effect chains
- Aligns with existing codebase patterns where controllers are Effect-based but resolvers are async/await

**Migration Flow:**

```
Current:  Request → Container → resolve("token") → Controller → Effect.provide
            ↓
Target:   Request → createControllers(Layer) → context.controllers → Controller → Effect.provide
            ↓
Future:   Request → Layer → Effect.gen(yield* Tag) → pure Effect program (optional evolution)
```

---

### 2. Key Decisions

#### Decision 1: Controller Factory vs. Tagged Resolution in Resolvers

**Chosen**: Controller Factory with direct property access

**Rationale**:

- Resolvers currently use async/await, not Effect
- Converting all resolvers to Effect.gen would require rewriting ~173 resolution calls
- Factory pattern provides immediate type safety with minimal resolver changes
- Can evolve to full Effect style later if desired

**Rejected Alternative**: Effect-style resolution

```typescript
// Rejected: Too complex for current scope
Effect.gen(function* () {
  const controller = yield* UserControllerTag;
  return yield* controller.getById({ id });
}).pipe(Effect.provide(context.appLayer));
```

#### Decision 2: Repository Tags Stay in Use Cases Layer

**Chosen**: Keep Repository Tags in `packages/use-cases/src/ports/`

**Rationale**:

- Tags already exist and work correctly
- Use cases layer defines ports (interfaces) per Clean Architecture
- Adapters layer provides implementations (Drizzle repositories)
- Dependencies point inward (adapters depend on use cases, not vice versa)

#### Decision 3: Layer Composition Location

**Chosen**: Compose Layers in controller factory, not in each resolver

**Rationale**:

- Single composition point ensures consistent Layer stack
- RepositoryLayer + ServiceLayer + PortLayer merged once per request
- Controllers receive fully composed Layer in constructor
- Matches current controller design pattern

#### Decision 4: Gradual Migration with Shim

**Chosen**: Maintain `createTestContainer` shim with deprecation warnings

**Rationale**:

- 4 test files (~2,687 lines) use deprecated container APIs
- Immediate removal would break CI/CD
- Deprecation warnings guide developers to `createTestLayer`
- Clean removal after all tests migrated

---

### 3. Component Diagram

#### Before (awilix Architecture)

```
HTTP/WebSocket Request
         │
         ▼
┌─────────────────────────────┐
│    GraphQL Context Factory   │
│  ┌───────────────────────┐   │
│  │  Container Creation   │   │
│  │  - RepositoryModule   │   │
│  │  - UseCaseModule        │   │
│  │  - ControllerModule     │   │
│  └───────────────────────┘   │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│      GraphQL Context         │
│    { container: Container }  │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐     ┌──────────────────────────┐
│       GraphQL Resolver        │────▶│    container.resolve()   │
│  context.container.resolve()  │     │  (Runtime string lookup) │
│      ("userController")       │     └──────────────────────────┘
└─────────────────────────────┘                  │
                                                   ▼
                                          ┌────────────────┐
                                          │   Controller   │
                                          │  (has Layer)   │
                                          └────────────────┘
                                                   │
                                                   ▼
                                          ┌────────────────┐
                                          │  Effect.gen +  │
                                          │ Effect.provide │
                                          └────────────────┘
```

#### After (Effect DI Architecture)

```
HTTP/WebSocket Request
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│               GraphQL Context Factory                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Layer Composition                     │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  appLayer = Layer.mergeAll(                        │ │ │
│  │  │    makeRepositoryLayer(db),     ← 17 repositories  │ │ │
│  │  │    makeServiceLayer(config),    ← services        │ │ │
│  │  │    makePortsLayer(env)          ← adapters       │ │ │
│  │  │  )                                                  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                           │                            │ │
│  │                           ▼                            │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │           createControllers(appLayer)             │ │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │ │ │
│  │  │  │ UserController│  │TripController│  │   ...     │ │ │ │
│  │  │  │  (appLayer)   │  │  (appLayer)   │  │ (appLayer)│ │ │ │
│  │  │  └─────────────┘  └─────────────┘  └───────────┘ │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  GraphQL Context                             │
│        { controllers: Controllers }  ← Typed object        │
│                                                             │
│        controllers: {                                       │
│          userController: UserController,                     │
│          tripController: TripController,                     │
│          challengeController: ChallengeController,             │
│          // ... 14 more                                      │
│        }                                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   GraphQL Resolver                           │
│         context.controllers.userController                   │
│                                                             │
│    Benefits:                                                │
│    • Compile-time type checking                             │
│    • IDE autocomplete                                        │
│    • No runtime resolution errors                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Controller                               │
│              (receives Layer in constructor)                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Effect.gen                                │
│              const repo = yield* UserRepositoryTag            │
│              return yield* repo.findById(id)                │
│                                                             │
│              .pipe(Effect.provide(this.appLayer))            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository                                 │
│              (via RepositoryTag - already exists)          │
└─────────────────────────────────────────────────────────────┘
```

**Key Architectural Change**: Runtime string-based resolution (container.resolve) → Compile-time property access (context.controllers)

---

### 4. Integration Points

#### 4.1 GraphQL Context Factory

**Location**: `apps/backend-server/src/graphql/context.ts`

**Current Behavior**:

- Creates AwilixContainer
- Registers 4 module files
- Returns `{ container, ...otherContext }`

**New Behavior**:

- Composes Effect Layers (`makeRepositoryLayer`, `makeServiceLayer`, etc.)
- Calls `createControllers(appLayer)` to instantiate all 17 controllers
- Returns `{ controllers, ...otherContext }`

**Migration Strategy**:

```typescript
// During migration (dual mode)
return {
  container: existingContainer, // Deprecated, for old resolvers
  controllers: newControllers, // New, for migrated resolvers
};

// After migration complete
return {
  controllers: newControllers, // Only this remains
};
```

#### 4.2 GraphQL Server Types

**Location**: `packages/frameworks/src/graphql/server.ts`, `builder.ts`

**Changes**:

```typescript
// Before
export interface GraphQLContext {
  container: AwilixContainer;
  user?: UserContext;
}

// After
export interface GraphQLContext {
  controllers: Controllers; // All 17 controllers as typed properties
  user?: UserContext;
}
```

#### 4.3 WebSocket Auth Handler

**Location**: `apps/backend-server/src/websocket/auth-handler.ts`

**Current**: 2 resolve calls

```typescript
const authPort = container.resolve<AuthPort>("authPort");
const telemetryPort = container.resolve<TelemetryPort>("telemetryPort");
```

**New**: Pass services in connection context or use Effect

```typescript
// Option 1: Services in context
const { authPort, telemetryPort } = connectionContext.services;

// Option 2: Effect Layer (preferred for consistency)
const program = Effect.gen(function* () {
  const authPort = yield* AuthPortTag;
  const telemetryPort = yield* TelemetryPortTag;
  // ...
}).pipe(Effect.provide(appLayer));
```

#### 4.4 Test Infrastructure

**Location**: `packages/frameworks/src/di/test-layer.ts`, test files

**Migration Path**:

1. Create `createTestLayer()` utility using `Layer.succeed(Tag, mock)`
2. Update `createTestContainer()` to use Layer internally (shim)
3. Add deprecation warnings to shim
4. Migrate tests incrementally
5. Remove shim after all tests use Layer directly

#### 4.5 tRPC Routers (if applicable)

**Investigation Needed**: Check if any tRPC routers use container resolution

**Approach** (if needed):

- Same pattern as GraphQL: include controllers in tRPC context
- Or convert tRPC procedures to use Effect directly (more advanced)

---

### 5. Expected Changes

#### 5.1 Files to Create

| File Path                                                   | Purpose                                                                                 | Est. Lines |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- |
| `packages/adapters/src/controllers/factory.ts`              | Controller factory exporting `createControllers(appLayer)` and `ControllerFactory` type | ~100       |
| `apps/backend-server/src/graphql/utils/resolver-helpers.ts` | Helper functions for type-safe controller access, shortcuts like `ControllersFrom`      | ~80        |

#### 5.2 Files to Modify

| File Path                                                    | Changes                                                                         | Complexity |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------- |
| `packages/frameworks/src/graphql/server.ts`                  | Update GraphQLContext type to use Controllers instead of Container              | LOW        |
| `packages/frameworks/src/graphql/builder.ts`                 | Update context type references                                                  | LOW        |
| `apps/backend-server/src/graphql/context.ts`                 | Create controllers via factory instead of container; dual-mode during migration | MEDIUM     |
| `apps/backend-server/src/websocket/auth-handler.ts`          | Remove 2 container.resolve calls; use Layer or context services                 | MEDIUM     |
| 20 resolvers in `apps/backend-server/src/graphql/resolvers/` | Replace `context.container.resolve("X")` with `context.controllers.xController` | HIGH       |
| 12 resolvers in `packages/frameworks/src/graphql/resolvers/` | Same changes as above                                                           | MEDIUM     |
| Test files (4 files, ~2,687 lines)                           | Migrate from `createTestContainer` to `createTestLayer`                         | MEDIUM     |
| `packages/frameworks/src/di/index.ts`                        | Add deprecation notices, maintain backward compatibility                        | LOW        |

#### 5.3 Files to Delete

| File Path                                                       | Reason                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `packages/adapters/src/modules/ControllerModule.ts` (570 lines) | Replaced by controller factory                                   |
| `packages/adapters/src/modules/RepositoryModule.ts` (580 lines) | Replaced by Layer factories in `packages/frameworks/src/layers/` |
| `packages/adapters/src/modules/UseCaseModule.ts` (709 lines)    | Replaced by Layer factories                                      |
| `packages/adapters/src/modules/AnalyticsModule.ts` (351 lines)  | Replaced by Layer.succeed binding                                |
| `packages/use-cases/src/modules/UseCaseModule.ts` (114 lines)   | Already Effect-based, module pattern no longer needed            |
| `packages/adapters/src/modules/` directory                      | Empty after module deletion                                      |

**Total Lines Removed**: ~2,324 lines (module files only)

#### 5.4 Dependencies to Remove

| Package          | From           | Action |
| ---------------- | -------------- | ------ |
| `awilix`         | `package.json` | Remove |
| `awilix-modular` | `package.json` | Remove |

**Import Statements to Clean Up**:

- 57 awilix-related imports across codebase
- `import { createStaticModule } from 'awilix-modular'`
- `import { Lifetime } from 'awilix'`
- `import type { AwilixContainer } from 'awilix'`
- `import { asClass, asValue } from 'awilix'`

#### 5.5 Types to Create

```typescript
// In controller factory.ts
export interface Controllers {
  userController: UserController;
  tripController: TripController;
  challengeController: ChallengeController;
  groupController: GroupController;
  locationController: LocationController;
  notificationController: NotificationController;
  notificationScheduleController: NotificationScheduleController;
  notificationDeliveryController: NotificationDeliveryController;
  challengeSubmissionController: ChallengeSubmissionController;
  challengeVoteController: ChallengeVoteController;
  activityFeedController: ActivityFeedController;
  rewardController: RewardController;
  coinController: CoinController;
  coinTransactionController: CoinTransactionController;
  sponsorController: SponsorController;
  submissionReportController: SubmissionReportController;
  storageController: StorageController;
}

// Helper type for resolvers
type ControllersFrom<T extends keyof Controllers> = Pick<Controllers, T>;
```

---

## Acceptance Criteria

### AC1: All awilix imports removed

```
Given the codebase has 57 awilix-related imports
When the migration is complete
Then zero awilix imports remain in the codebase
And no files contain "import { createStaticModule } from 'awilix-modular'"
And no files contain "import { Lifetime } from 'awilix'"
And no files contain "import type { AwilixContainer } from 'awilix'"
And no files contain "import { asClass, asValue } from 'awilix'"
```

### AC2: All module files deleted

```
Given 5 awilix-modular module files exist
When the migration is complete
Then all 5 module files are deleted
And no references to CONTROLLER_TOKENS or SERVICE_TOKENS remain
And the modules/ directory in adapters is empty or removed
```

### AC3: GraphQL resolvers use direct controller instantiation

```
Given all 20 GraphQL resolvers use context.container.resolve()
When the migration is complete
Then context includes controllers via context.controllers
And resolvers access controllers directly: context.controllers.userController
And context no longer exports a container property
And the createSimpleContextFactory helper no longer includes container
```

### AC4: Controller factory created

```
Given 17 controllers need instantiation
When the migration is complete
Then a controller factory exists at packages/adapters/src/controllers/factory.ts
And the factory exports createControllers(appLayer) returning all 17 controllers
And the factory exports ControllerFactory for selective controller access
And GraphQL context uses createControllers() to instantiate controllers per request
```

### AC5: Resolver helpers created

```
Given resolvers need type-safe controller access
When the migration is complete
Then resolver helpers exist at apps/backend-server/src/graphql/utils/resolver-helpers.ts
And helpers include getController<K>(context, name) for type-safe access
And helpers include ControllersFrom shortcuts (user, trip, challenge, etc.)
```

### AC6: Test utilities migrated to Effect Layer pattern

```
Given test files use deprecated container-based utilities
When the migration is complete
Then tests use Layer.succeed(Tag, implementation) for mocking
Then tests use Effect.provide(testLayer) for dependency injection
Then all tests pass without awilix dependencies
```

### AC7: Package dependencies removed

```
Given package.json includes "awilix" and "awilix-modular" dependencies
When the migration is complete
Then both dependencies are removed from package.json files
And bun.lockb is updated to reflect removal
And no lockfile references to awilix remain
```

### AC8: All tests pass

```
Given the full test suite
When the migration is complete
Then bun test passes with no failures
Then bun test:integration passes with no failures
Then no tests reference deprecated container APIs
```

## User Scenarios

### Scenario 1: Developer adds a new controller

```
As a developer adding a new controller
I want to instantiate it directly with Layer instead of registering in a module
So that I don't need to learn or maintain awilix patterns

Given a new PaymentController
When I create the controller
Then I pass Layer to its constructor
Then I add it to createControllers() in factory.ts
Then I add it to Controllers interface in factory.ts
Then GraphQL resolvers can access it via context.controllers.paymentController
And no module registration is required
```

### Scenario 2: Developer writes a resolver

```
As a developer writing a GraphQL resolver
I want direct, type-safe controller access
So that I get compile-time errors instead of runtime resolution failures

Given a User resolver
When I need the UserController
Then I use: context.controllers.userController
Then I get full TypeScript intellisense
Then no string-based resolution is needed
And no runtime container errors can occur
```

### Scenario 3: Developer writes tests

```
As a developer writing integration tests
I want to mock dependencies using Effect Layers
So that tests are consistent with production code patterns

Given a test for UserController
When I need to mock UserRepository
Then I create: Layer.succeed(UserRepositoryTag, new InMemoryUserRepository())
Then I provide it: Effect.provide(testLayer)
Then I run with: Effect.runPromise(program)
And no container setup or registration is needed
```

## Migration Approach

### Phase 1: Infrastructure (Week 1)

- Create controller factory with all 17 controllers
- Update GraphQL context to include controllers
- Create resolver helpers for type-safe access

### Phase 2: Resolver Migration (Week 1-2)

- Migrate 20 resolvers from `context.container.resolve()` to `context.controllers`
- Batch 1: User, Trip, Location (simple, well-tested)
- Batch 2: Challenge, Group, ActivityFeed (moderate complexity)
- Batch 3: Notifications, Schedule, Delivery (multiple dependencies)
- Batch 4: Coin, Reward, Storage, remaining (financial/storage operations)

### Phase 3: Cleanup (Week 2-3)

- Delete all 5 module files
- Remove deprecated exports from di/index.ts
- Update test utilities to remove container compatibility code

### Phase 4: Dependencies (Week 3)

- Remove awilix and awilix-modular from package.json
- Clean up all import statements
- Final verification with full test suite

---

## Implementation Process

### Phase 1: Infrastructure (Week 1)

**Phase Goal**: Establish foundation for Effect DI migration with controller factory, updated context, and resolver helpers.

**Phase Success Criteria**:

- Controller factory compiles with all 17 controller types
- GraphQL context exports both container (deprecated) and controllers (new)
- Resolver helpers provide type-safe controller access
- All existing tests still pass (backward compatibility maintained)

---

#### Step 1.1: Create Controller Factory

**Goal**: Create `packages/adapters/src/controllers/factory.ts` that instantiates all 17 controllers with Effect Layer composition.

**Output**:

- File: `packages/adapters/src/controllers/factory.ts` (~100 lines)
- Exports: `createControllers(appLayer)`, `Controllers` interface, `ControllerFactory` type

**Success Criteria**:

- [ ] File compiles with `bun tsc --noEmit`
- [ ] `createControllers` accepts `Layer.Layer<unknown>` and returns `Controllers`
- [ ] `Controllers` interface includes all 17 controller properties
- [ ] All 17 controller imports resolve correctly
- [ ] No awilix imports in the new file

**Subtasks**:

| Subtask                                | Acceptance Criteria                                              | Est. Effort |
| -------------------------------------- | ---------------------------------------------------------------- | ----------- |
| 1.1.1 Define Controllers interface     | Interface lists all 17 controllers with correct types            | 30 min      |
| 1.1.2 Implement createControllers      | Function takes appLayer, returns all 17 instantiated controllers | 1 hour      |
| 1.1.3 Add ControllerFactory type       | Type supports selective controller instantiation                 | 30 min      |
| 1.1.4 Export from controllers/index.ts | Factory exports available from controllers package               | 15 min      |

**Estimated Effort**: 2-3 hours

**Risk Level**: LOW

**Dependencies**: None (foundational)

**Blockers & Resolutions**:
| Blocker | Resolution |
|---------|------------|
| Controller types don't expose Layer parameter | Verify all controllers accept Layer in constructor |
| Missing controller imports | Add index.ts exports if needed |

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                         | Weight | Description                                                             | Scoring (1-5)                                               |
| --------------------------------- | ------ | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| Controller Interface Completeness | 0.25   | All 17 controllers present in Controllers interface with correct types  | 1=Missing >3, 3=Missing 1-2, 5=All 17 present               |
| createControllers Implementation  | 0.25   | Function correctly instantiates all controllers with appLayer parameter | 1=Doesn't compile, 3=Works but types loose, 5=Perfect types |
| ControllerFactory Type Utility    | 0.20   | Type supports selective controller access with proper generics          | 1=Missing, 3=Basic implementation, 5=Full generic support   |
| Export Completeness               | 0.15   | All types and functions exported from index.ts                          | 1=No exports, 3=Partial, 5=All exported                     |
| No awilix Dependencies            | 0.15   | Zero awilix imports or references in file                               | 1=Has imports, 5=Clean                                      |

**Threshold**: 4.0/5.0

---

#### Step 1.2: Update GraphQL Context

**Goal**: Modify `apps/backend-server/src/graphql/context.ts` to create controllers via factory while maintaining backward compatibility with container.

**Output**:

- Modified: `apps/backend-server/src/graphql/context.ts`
- Context type includes both `container` (deprecated) and `controllers` (new)

**Success Criteria**:

- [ ] Context factory composes Layers (`makeRepositoryLayer`, `makeServiceLayer`, etc.)
- [ ] Context factory calls `createControllers(appLayer)`
- [ ] Returned context includes `controllers` property with all 17 controllers
- [ ] Returned context includes `container` property for backward compatibility
- [ ] TypeScript compilation passes
- [ ] Existing resolvers continue to work (dual-mode)

**Subtasks**:

| Subtask                       | Acceptance Criteria                                        | Est. Effort |
| ----------------------------- | ---------------------------------------------------------- | ----------- |
| 1.2.1 Import Layer factories  | All required Layer factories imported                      | 15 min      |
| 1.2.2 Compose appLayer        | `Layer.mergeAll` combines Repository, Service, Port layers | 30 min      |
| 1.2.3 Create controllers      | `createControllers(appLayer)` called in context factory    | 15 min      |
| 1.2.4 Update context type     | `GraphQLContext` includes both container and controllers   | 30 min      |
| 1.2.5 Add deprecation comment | JSDoc @deprecated on container property                    | 15 min      |

**Estimated Effort**: 2 hours

**Risk Level**: MEDIUM

**Dependencies**: Step 1.1 (factory must exist)

**Blockers & Resolutions**:
| Blocker | Resolution |
|---------|------------|
| Layer factories not exported | Check `packages/frameworks/src/layers/` exports |
| Missing environment variables | Ensure config loading in context factory |
| Circular dependencies | Verify layer composition order |

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                        | Weight | Description                                               | Scoring (1-5)                                                                |
| -------------------------------- | ------ | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Layer Composition Correctness    | 0.30   | Proper Layer.mergeAll of Repository, Service, Port layers | 1=Wrong order/missing layers, 3=Works but not optimal, 5=Correct composition |
| createControllers Integration    | 0.25   | Factory called correctly with composed appLayer           | 1=Not called, 3=Called but wrong params, 5=Perfect integration               |
| Dual-Mode Backward Compatibility | 0.20   | Both container (deprecated) and controllers present       | 1=Only one, 3=Both but no deprecation, 5=Both with @deprecated JSDoc         |
| TypeScript Context Type Update   | 0.15   | GraphQLContext type includes both properties correctly    | 1=Wrong types, 3=Partial update, 5=Complete correct types                    |
| Compilation Success              | 0.10   | `bun tsc --noEmit` passes with no errors                  | 1=Errors, 5=Clean compile                                                    |

**Threshold**: 4.0/5.0

---

#### Step 1.3: Create Resolver Helpers

**Goal**: Create `apps/backend-server/src/graphql/utils/resolver-helpers.ts` for type-safe controller access patterns.

**Output**:

- File: `apps/backend-server/src/graphql/utils/resolver-helpers.ts` (~80 lines)
- Exports: `getController()`, `ControllersFrom`, controller-specific shortcuts

**Success Criteria**:

- [ ] File compiles with strict TypeScript
- [ ] `getController<K>(context, name)` provides type-safe controller access
- [ ] `ControllersFrom<T>` helper type extracts controller subsets
- [ ] Controller shortcuts exist: `user(context)`, `trip(context)`, etc.
- [ ] All helpers use `context.controllers` (not container)
- [ ] JSDoc comments explain usage patterns

**Subtasks**:

| Subtask                           | Acceptance Criteria                           | Est. Effort |
| --------------------------------- | --------------------------------------------- | ----------- |
| 1.3.1 Define getController helper | Generic function with proper type constraints | 30 min      |
| 1.3.2 Define ControllersFrom type | Type utility for controller subset selection  | 20 min      |
| 1.3.3 Create controller shortcuts | 17 shortcut functions for direct access       | 30 min      |
| 1.3.4 Add JSDoc comments          | All exports documented with examples          | 20 min      |
| 1.3.5 Export from utils/index.ts  | Helpers available from utils package          | 10 min      |

**Estimated Effort**: 2 hours

**Risk Level**: LOW

**Dependencies**: Step 1.1 (Controllers type must exist)

**Blockers & Resolutions**:
| Blocker | Resolution |
|---------|------------|
| Shim still needed by tests | Verify no tests use createTestContainer before removing |

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                   | Weight | Description                                       | Scoring (1-5)                                     |
| --------------------------- | ------ | ------------------------------------------------- | ------------------------------------------------- |
| createTestLayer Enhancement | 0.25   | Accepts Layer overrides via options parameter     | 1=Not enhanced, 3=Basic, 5=Full options support   |
| Mock Helper Functions       | 0.20   | Helpers for Layer.succeed(Tag, mock) patterns     | 1=Missing, 3=Basic, 5=Comprehensive               |
| Deprecation Warnings        | 0.20   | createTestContainer shim shows warning on use     | 1=No warning, 3=Console log, 5=Proper deprecation |
| JSDoc Migration Path        | 0.20   | Clear documentation on migration to Layer pattern | 1=Missing, 3=Basic, 5=Detailed with examples      |
| Export Completeness         | 0.15   | All utilities exported from di/index.ts           | 1=Missing, 5=Complete                             |

**Threshold**: 4.0/5.0

---

### Phase 2: Resolver Migration (Week 1-2)

**Phase Goal**: Migrate all 20 GraphQL resolvers from `context.container.resolve("X")` to `context.controllers.xController`.

**Phase Success Criteria**:

- All 20 resolvers use `context.controllers` instead of `context.container.resolve()`
- All resolver tests pass
- No runtime errors in resolver execution
- TypeScript strict mode passes for all resolver files

**Migration Strategy**:

- Batch by complexity and dependencies
- Each resolver batch in separate commit
- Test after each batch
- Rollback capability per batch

---

#### Step 2.1: Migrate User Resolver

**Goal**: Migrate `apps/backend-server/src/graphql/resolvers/User.resolver.ts` to use `context.controllers.userController`.

**Output**:

- Modified: `User.resolver.ts`
- All `context.container.resolve("userController")` replaced

**Success Criteria**:

- [ ] All resolve calls replaced with `context.controllers.userController`
- [ ] TypeScript compilation passes
- [ ] `User.resolver.test.ts` passes
- [ ] No awilix imports remain in file
- [ ] Resolver functions use typed controller access

**Estimated Effort**: 1 hour

**Risk Level**: LOW

**Dependencies**: Phase 1 (context must have controllers)

**Blockers & Resolutions**:
| Blocker | Resolution |
|---------|------------|
| Test file uses container mocks | Use shim or migrate test in parallel |

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                | Weight | Description                                              | Scoring (1-5)                              |
| ------------------------ | ------ | -------------------------------------------------------- | ------------------------------------------ |
| Resolve Call Replacement | 0.30   | All context.container.resolve("userController") replaced | 1=Still present, 3=Partial, 5=All replaced |
| Direct Controller Access | 0.25   | Uses context.controllers.userController correctly        | 1=Wrong access pattern, 5=Correct pattern  |
| TypeScript Compilation   | 0.20   | Strict mode passes with no type errors                   | 1=Errors, 3=Warnings, 5=Clean              |
| Test File Migration      | 0.15   | User.resolver.test.ts uses Layer pattern                 | 1=Container mocks, 3=Partial, 5=Full Layer |
| No awilix Imports        | 0.10   | Zero awilix imports in file                              | 1=Present, 5=Absent                        |

**Threshold**: 4.0/5.0

---

#### Step 2.2: Migrate Trip Resolver

**Goal**: Migrate `apps/backend-server/src/graphql/resolvers/Trip.resolver.ts` to use `context.controllers.tripController`.

**Output**:

- Modified: `Trip.resolver.ts`
- All `context.container.resolve("tripController")` replaced

**Success Criteria**:

- [ ] All resolve calls replaced with `context.controllers.tripController`
- [ ] TypeScript compilation passes
- [ ] Trip resolver tests pass
- [ ] No awilix imports remain in file

**Estimated Effort**: 1 hour

**Risk Level**: LOW

**Dependencies**: Phase 1

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                | Weight | Description                                              | Scoring (1-5)                              |
| ------------------------ | ------ | -------------------------------------------------------- | ------------------------------------------ |
| Resolve Call Replacement | 0.30   | All context.container.resolve("tripController") replaced | 1=Still present, 3=Partial, 5=All replaced |
| Direct Controller Access | 0.25   | Uses context.controllers.tripController correctly        | 1=Wrong pattern, 5=Correct pattern         |
| TypeScript Compilation   | 0.20   | Strict mode passes with no errors                        | 1=Errors, 5=Clean                          |
| Test Migration           | 0.15   | Related tests pass with Layer pattern                    | 1=Fail, 3=Some pass, 5=All pass            |
| No awilix Imports        | 0.10   | Zero awilix imports in file                              | 1=Present, 5=Absent                        |

**Threshold**: 4.0/5.0

---

#### Step 2.3: Migrate Challenge Resolver

**Goal**: Migrate `apps/backend-server/src/graphql/resolvers/Challenge.resolver.ts` and related files.

**Output**:

- Modified: `Challenge.resolver.ts`
- All challenge-related resolve calls replaced

**Success Criteria**:

- [ ] `context.container.resolve("challengeController")` → `context.controllers.challengeController`
- [ ] `context.container.resolve("challengeSubmissionController")` → `context.controllers.challengeSubmissionController`
- [ ] `context.container.resolve("challengeVoteController")` → `context.controllers.challengeVoteController`
- [ ] All Challenge-related tests pass
- [ ] TypeScript compilation passes

**Estimated Effort**: 1.5 hours

**Risk Level**: MEDIUM

**Dependencies**: Phase 1

**Blockers & Resolutions**:
| Blocker | Resolution |
|---------|------------|
| Multiple controller references | Verify all 3 challenge controllers in factory |

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                     | Weight | Description                                                                                                        | Scoring (1-5)                        |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Multiple Controller Migration | 0.35   | All 3 challenge controllers migrated (challengeController, challengeSubmissionController, challengeVoteController) | 1=<2 migrated, 3=2 migrated, 5=All 3 |
| Correct Controller References | 0.25   | Each resolve call maps to correct controller property                                                              | 1=Wrong mappings, 5=All correct      |
| TypeScript Compilation        | 0.20   | Strict mode passes                                                                                                 | 1=Errors, 5=Clean                    |
| Challenge Tests Pass          | 0.15   | All challenge-related tests pass                                                                                   | 1=Fail, 3=Some, 5=All                |
| No awilix Imports             | 0.05   | Zero awilix imports                                                                                                | 1=Present, 5=Absent                  |

**Threshold**: 4.0/5.0

---

#### Step 2.4: Migrate Group Resolver

**Goal**: Migrate `apps/backend-server/src/graphql/resolvers/Group.resolver.ts` to use controllers.

**Output**:

- Modified: `Group.resolver.ts`
- All group-related resolve calls replaced

**Success Criteria**:

- [ ] `context.container.resolve("groupController")` → `context.controllers.groupController`
- [ ] TypeScript compilation passes
- [ ] Group resolver tests pass
- [ ] No awilix imports remain

**Estimated Effort**: 1 hour

**Risk Level**: LOW

**Dependencies**: Phase 1

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                | Weight | Description                                               | Scoring (1-5)                   |
| ------------------------ | ------ | --------------------------------------------------------- | ------------------------------- |
| Resolve Call Replacement | 0.30   | All context.container.resolve("groupController") replaced | 1=Still present, 5=All replaced |
| Direct Controller Access | 0.25   | Uses context.controllers.groupController correctly        | 1=Wrong, 5=Correct              |
| TypeScript Compilation   | 0.20   | Strict mode passes                                        | 1=Errors, 5=Clean               |
| Tests Pass               | 0.15   | Group resolver tests pass                                 | 1=Fail, 5=Pass                  |
| No awilix Imports        | 0.10   | Zero awilix imports                                       | 1=Present, 5=Absent             |

**Threshold**: 4.0/5.0

---

#### Step 2.5: Migrate ActivityFeed Resolver

**Goal**: Migrate `apps/backend-server/src/graphql/resolvers/ActivityFeed.resolver.ts` to use controllers.

**Output**:

- Modified: `ActivityFeed.resolver.ts`
- All resolve calls replaced

**Success Criteria**:

- [ ] `context.container.resolve("activityFeedController")` → `context.controllers.activityFeedController`
- [ ] TypeScript compilation passes
- [ ] ActivityFeed tests pass
- [ ] No awilix imports remain

**Estimated Effort**: 1 hour

**Risk Level**: LOW

**Dependencies**: Phase 1

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                | Weight | Description                                                      | Scoring (1-5)                   |
| ------------------------ | ------ | ---------------------------------------------------------------- | ------------------------------- |
| Resolve Call Replacement | 0.30   | All context.container.resolve("activityFeedController") replaced | 1=Still present, 5=All replaced |
| Direct Controller Access | 0.25   | Uses context.controllers.activityFeedController correctly        | 1=Wrong, 5=Correct              |
| TypeScript Compilation   | 0.20   | Strict mode passes                                               | 1=Errors, 5=Clean               |
| Tests Pass               | 0.15   | ActivityFeed tests pass                                          | 1=Fail, 5=Pass                  |
| No awilix Imports        | 0.10   | Zero awilix imports                                              | 1=Present, 5=Absent             |

**Threshold**: 4.0/5.0

---

#### Step 2.6: Migrate Notification Resolvers (3 files)

**Goal**: Migrate notification-related resolvers:

- `Notification.resolver.ts`
- `NotificationSchedule.resolver.ts`
- `NotificationDelivery.resolver.ts`

**Output**:

- Modified: 3 notification resolver files
- All notification controller references updated

**Success Criteria**:

- [ ] `notificationController` → `context.controllers.notificationController`
- [ ] `notificationScheduleController` → `context.controllers.notificationScheduleController`
- [ ] `notificationDeliveryController` → `context.controllers.notificationDeliveryController`
- [ ] All notification tests pass
- [ ] TypeScript compilation passes for all 3 files

**Estimated Effort**: 2 hours (3 files × 40 min)

**Risk Level**: MEDIUM

**Dependencies**: Phase 1

**Blockers & Resolutions**:
| Blocker | Resolution |
|---------|------------|
| Shared notification logic | Extract common patterns to helpers |

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                  | Weight | Description                                                                                                                | Scoring (1-5)                    |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| All 3 Files Migrated       | 0.30   | Notification.resolver.ts, NotificationSchedule.resolver.ts, NotificationDelivery.resolver.ts all updated                   | 1=1 file, 3=2 files, 5=All 3     |
| Correct Controller Mapping | 0.25   | Each file uses correct controller (notificationController, notificationScheduleController, notificationDeliveryController) | 1=Wrong, 5=All correct           |
| Shared Logic Preservation  | 0.15   | Common notification patterns maintained                                                                                    | 1=Broken, 3=Partial, 5=Preserved |
| TypeScript Compilation     | 0.15   | All 3 files compile without errors                                                                                         | 1=Errors, 5=Clean                |
| All Tests Pass             | 0.15   | All notification tests pass                                                                                                | 1=Fail, 3=Some, 5=All            |

**Threshold**: 4.0/5.0

---

#### Step 2.7: Migrate Remaining Resolvers (10 files)

**Goal**: Migrate remaining resolver files:

- `Location.resolver.ts`
- `Reward.resolver.ts`
- `Coin.resolver.ts`
- `CoinTransaction.resolver.ts`
- `Sponsor.resolver.ts`
- `SubmissionReport.resolver.ts`
- `Storage.resolver.ts`
- `Analytics.resolver.ts`
- `Search.resolver.ts`
- `Health.resolver.ts`

**Output**:

- Modified: 10 resolver files
- All resolve calls replaced with direct controller access

**Success Criteria**:

- [ ] All 10 resolvers use `context.controllers.X`
- [ ] TypeScript compilation passes for all files
- [ ] All related tests pass
- [ ] No awilix imports in any resolver file

**Estimated Effort**: 6 hours (10 files × 36 min avg)

**Risk Level**: MEDIUM

**Dependencies**: Phase 1, Steps 2.1-2.6 (preferably complete first batches)

**Blockers & Resolutions**:
| Blocker | Resolution |
|---------|------------|
| High file count | Split into 2 sub-batches if needed |
| Test dependencies | Run full test suite after all 10 migrated |

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion                    | Weight | Description                                                                                                                             | Scoring (1-5)                        |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Batch Completion Rate        | 0.30   | All 10 resolver files migrated (Location, Reward, Coin, CoinTransaction, Sponsor, SubmissionReport, Storage, Analytics, Search, Health) | 1=<7, 3=7-9, 5=All 10                |
| Consistent Migration Pattern | 0.20   | All files use same pattern (context.controllers.X)                                                                                      | 1=Inconsistent, 5=Uniform            |
| No Regression                | 0.20   | All related tests pass                                                                                                                  | 1=Many fail, 3=Some fail, 5=All pass |
| TypeScript Compilation       | 0.15   | All 10 files compile cleanly                                                                                                            | 1=Errors, 5=Clean                    |
| Zero awilix References       | 0.15   | No container.resolve in any of the 10 files                                                                                             | 1=Present, 5=Absent                  |

**Threshold**: 4.0/5.0

---

### Phase 3: Module Cleanup (Week 2)

**Phase Goal**: Delete all 5 awilix module files and remove backward compatibility code.

**Phase Success Criteria**:

- All 5 module files deleted
- No compilation errors from missing modules
- No tests reference module files
- All tests pass without module dependencies

**Warning**: Module deletion is irreversible. Verify with `git grep` that nothing references modules before deleting.

---

#### Step 3.1: Delete ControllerModule

**Goal**: Delete `packages/adapters/src/modules/ControllerModule.ts` (570 lines).

**Risk Level**: MEDIUM

**Success Criteria**:

- [ ] File deleted from repository
- [ ] `git grep ControllerModule` returns no results
- [ ] `git grep CONTROLLER_TOKENS` returns no results
- [ ] Compilation passes without ControllerModule
- [ ] No imports reference ControllerModule

**Rollback Plan**: File can be restored from git history if needed

**Verification Commands**:

```bash
git grep -l "ControllerModule" --include="*.ts"
git grep -l "CONTROLLER_TOKENS" --include="*.ts"
```

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion                 | Weight | Description                                                         | Scoring (1-5)             |
| ------------------------- | ------ | ------------------------------------------------------------------- | ------------------------- |
| File Actually Deleted     | 0.30   | packages/adapters/src/modules/ControllerModule.ts removed from repo | 1=Still exists, 5=Deleted |
| Zero References Remain    | 0.30   | git grep ControllerModule returns nothing                           | 1=Matches found, 5=Clean  |
| CONTROLLER_TOKENS Removed | 0.20   | No token references remain                                          | 1=Found, 5=Clean          |
| Compilation Passes        | 0.20   | bun tsc --noEmit succeeds                                           | 1=Errors, 5=Clean         |

**Threshold**: 4.5/5.0

---

#### Step 3.2: Delete RepositoryModule

**Goal**: Delete `packages/adapters/src/modules/RepositoryModule.ts` (580 lines).

**Risk Level**: MEDIUM

**Success Criteria**:

- [ ] File deleted from repository
- [ ] `git grep RepositoryModule` returns no results
- [ ] `git grep REPOSITORY_TOKENS` returns no results
- [ ] Compilation passes without RepositoryModule

**Verification Commands**:

```bash
git grep -l "RepositoryModule" --include="*.ts"
git grep -l "REPOSITORY_TOKENS" --include="*.ts"
```

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion                 | Weight | Description                                               | Scoring (1-5)       |
| ------------------------- | ------ | --------------------------------------------------------- | ------------------- |
| File Actually Deleted     | 0.30   | packages/adapters/src/modules/RepositoryModule.ts removed | 1=Exists, 5=Deleted |
| Zero References Remain    | 0.30   | git grep RepositoryModule returns nothing                 | 1=Found, 5=Clean    |
| REPOSITORY_TOKENS Removed | 0.20   | No token references                                       | 1=Found, 5=Clean    |
| Compilation Passes        | 0.20   | bun tsc --noEmit succeeds                                 | 1=Errors, 5=Clean   |

**Threshold**: 4.5/5.0

---

#### Step 3.3: Delete UseCaseModule (adapters)

**Goal**: Delete `packages/adapters/src/modules/UseCaseModule.ts` (709 lines).

**Risk Level**: MEDIUM

**Success Criteria**:

- [ ] File deleted from repository
- [ ] `git grep "from.*adapters.*UseCaseModule"` returns no results
- [ ] Compilation passes

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion                 | Weight | Description                                            | Scoring (1-5)       |
| ------------------------- | ------ | ------------------------------------------------------ | ------------------- |
| File Actually Deleted     | 0.35   | packages/adapters/src/modules/UseCaseModule.ts removed | 1=Exists, 5=Deleted |
| Import References Cleaned | 0.35   | No "from.*adapters.*UseCaseModule" imports remain      | 1=Found, 5=Clean    |
| Compilation Passes        | 0.30   | bun tsc --noEmit succeeds                              | 1=Errors, 5=Clean   |

**Threshold**: 4.5/5.0

---

#### Step 3.4: Delete AnalyticsModule

**Goal**: Delete `packages/adapters/src/modules/AnalyticsModule.ts` (351 lines).

**Risk Level**: LOW

**Success Criteria**:

- [ ] File deleted
- [ ] No references to AnalyticsModule remain
- [ ] Analytics functionality still works (uses Layers now)

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion             | Weight | Description                                              | Scoring (1-5)       |
| --------------------- | ------ | -------------------------------------------------------- | ------------------- |
| File Deleted          | 0.30   | packages/adapters/src/modules/AnalyticsModule.ts removed | 1=Exists, 5=Deleted |
| Zero References       | 0.30   | No AnalyticsModule references                            | 1=Found, 5=Clean    |
| Analytics Still Works | 0.25   | Analytics functionality preserved via Layers             | 1=Broken, 5=Working |
| Compilation Passes    | 0.15   | bun tsc --noEmit succeeds                                | 1=Errors, 5=Clean   |

**Threshold**: 4.0/5.0

---

#### Step 3.5: Delete UseCaseModule (use-cases)

**Goal**: Delete `packages/use-cases/src/modules/UseCaseModule.ts` (114 lines).

**Risk Level**: LOW

**Success Criteria**:

- [ ] File deleted
- [ ] `git grep "from.*use-cases.*modules"` returns no results
- [ ] Compilation passes
- [ ] Remove `modules/` directory if empty

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                | Weight | Description                                             | Scoring (1-5)       |
| ------------------------ | ------ | ------------------------------------------------------- | ------------------- |
| File Deleted             | 0.35   | packages/use-cases/src/modules/UseCaseModule.ts removed | 1=Exists, 5=Deleted |
| Module Directory Cleaned | 0.35   | No "from.*use-cases.*modules" imports remain            | 1=Found, 5=Clean    |
| Compilation Passes       | 0.30   | bun tsc --noEmit succeeds                               | 1=Errors, 5=Clean   |

**Threshold**: 4.0/5.0

---

#### Step 3.6: Clean Empty Directories

**Goal**: Remove empty `packages/adapters/src/modules/` directory.

**Risk Level**: LOW

**Success Criteria**:

- [ ] Directory removed
- [ ] No `.gitkeep` or placeholder files left

### Verification

**Verification Level**: LOW (Self-Verification)

**Custom Rubric**:

| Criterion            | Weight | Description                                      | Scoring (1-5)       |
| -------------------- | ------ | ------------------------------------------------ | ------------------- |
| Directory Removed    | 0.40   | packages/adapters/src/modules/ directory removed | 1=Exists, 5=Deleted |
| No Placeholder Files | 0.30   | No .gitkeep or placeholder files left            | 1=Present, 5=Clean  |
| Clean git status     | 0.30   | No untracked directory entries                   | 1=Issues, 5=Clean   |

**Threshold**: 3.5/5.0

---

### Phase 4: Test Migration (Week 2-3)

**Phase Goal**: Migrate all test utilities and test files from container-based to Layer-based testing.

**Phase Success Criteria**:

- `createTestLayer()` is primary test utility
- `createTestContainer()` shim removed (or deprecated)
- All 4 test files use Layer pattern
- All tests pass without awilix dependencies

---

#### Step 4.1: Update Test Layer Utilities

**Goal**: Update `packages/frameworks/src/di/test-layer.ts` with comprehensive test utilities.

**Output**:

- Enhanced `createTestLayer()` utility
- Deprecation warnings added to `createTestContainer()`

**Success Criteria**:

- [ ] `createTestLayer()` accepts Layer overrides via options
- [ ] Helper for common mock patterns (Layer.succeed)
- [ ] `createTestContainer()` shim shows deprecation warning
- [ ] JSDoc explains migration path
- [ ] Utilities exported from di/index.ts

**Estimated Effort**: 2 hours

**Risk Level**: MEDIUM

**Dependencies**: Phase 1 (context patterns established)

---

#### Step 4.2: Migrate migration.e2e.test.ts

**Goal**: Migrate `apps/backend-server/src/graphql/__tests__/migration.e2e.test.ts` to Layer pattern.

**Success Criteria**:

- [ ] Test uses `createTestLayer()` instead of `createTestContainer()`
- [ ] Mocks use `Layer.succeed(Tag, implementation)`
- [ ] Effects run with `Effect.provide(testLayer)`
- [ ] All test cases pass
- [ ] No awilix imports remain

**Estimated Effort**: 3 hours

**Risk Level**: MEDIUM

**Dependencies**: Step 4.1

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                  | Weight | Description                                             | Scoring (1-5)                   |
| -------------------------- | ------ | ------------------------------------------------------- | ------------------------------- |
| createTestLayer Usage      | 0.25   | Uses createTestLayer() instead of createTestContainer() | 1=Container, 5=Layer            |
| Layer.succeed Mocking      | 0.25   | Mocks use Layer.succeed(Tag, implementation) pattern    | 1=Old mocks, 5=Layer mocks      |
| Effect.provide Integration | 0.20   | Effects use Effect.provide(testLayer)                   | 1=No provide, 5=Correct provide |
| All Test Cases Pass        | 0.20   | Full test suite passes                                  | 1=Fail, 3=Some, 5=All           |
| No awilix Imports          | 0.10   | Zero awilix imports in file                             | 1=Present, 5=Absent             |

**Threshold**: 4.0/5.0

---

#### Step 4.3: Migrate User.resolver.test.ts

**Goal**: Migrate `apps/backend-server/src/graphql/resolvers/__tests__/User.resolver.test.ts` to Layer pattern.

**Success Criteria**:

- [ ] Test uses Layer-based mocking
- [ ] UserController mocked via Layer
- [ ] All test cases pass
- [ ] No container references

**Estimated Effort**: 2 hours

**Risk Level**: MEDIUM

**Dependencies**: Step 4.1, Step 2.1

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                 | Weight | Description                                                       | Scoring (1-5)                           |
| ------------------------- | ------ | ----------------------------------------------------------------- | --------------------------------------- |
| Layer-Based Mocking       | 0.25   | UserController mocked via Layer.succeed                           | 1=Container mock, 5=Layer mock          |
| Test Layer Composition    | 0.25   | Tests compose proper test Layer with UserRepositoryTag            | 1=No composition, 5=Correct composition |
| All Tests Pass            | 0.25   | All User resolver test cases pass                                 | 1=Fail, 3=Some, 5=All                   |
| Effect Pattern Compliance | 0.15   | Tests follow Effect patterns (no Effect.runPromise unless needed) | 1=Non-Effect, 5=Proper Effect           |
| No Container References   | 0.10   | Zero container imports or references                              | 1=Present, 5=Absent                     |

**Threshold**: 4.0/5.0

---

#### Step 4.4: Migrate Remaining Test Files

**Goal**: Migrate remaining test files (~2,687 lines total).

**Test Files**:

- Remaining resolver tests (18 files)
- Integration tests (2 files)
- Any tests in `packages/frameworks/`

**Success Criteria**:

- [ ] All tests use `createTestLayer()` or direct Layer composition
- [ ] No tests import `createTestContainer`
- [ ] All tests pass
- [ ] Test code follows Effect patterns (no Effect.runPromise in tests unless needed)

**Estimated Effort**: 10 hours

**Risk Level**: MEDIUM-HIGH

**Dependencies**: Steps 4.1, 4.2, 4.3

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion                   | Weight | Description                                               | Scoring (1-5)                        |
| --------------------------- | ------ | --------------------------------------------------------- | ------------------------------------ |
| Test Migration Rate         | 0.30   | All remaining test files (~2,687 lines) migrated          | 1=<50%, 3=50-80%, 5=100%             |
| createTestContainer Absence | 0.25   | No tests import or use createTestContainer                | 1=Found, 3=Few, 5=None               |
| Layer Pattern Adoption      | 0.20   | All tests use createTestLayer or direct Layer composition | 1=Old pattern, 5=Layer pattern       |
| Test Suite Pass Rate        | 0.15   | bun test shows all passing                                | 1=Many fail, 3=Some fail, 5=All pass |
| Effect Pattern Compliance   | 0.10   | Tests use Effect patterns appropriately                   | 1=Wrong, 5=Correct                   |

**Threshold**: 4.0/5.0

---

#### Step 4.5: Remove Test Container Shim

**Goal**: Remove `createTestContainer()` after all tests migrated.

**Risk Level**: MEDIUM

**Success Criteria**:

- [ ] Verify no tests use `createTestContainer` via `git grep`
- [ ] Remove `createTestContainer` function
- [ ] Remove all container-related test utilities
- [ ] Update documentation

**Verification Command**:

```bash
git grep -l "createTestContainer" --include="*.ts"
```

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion                   | Weight | Description                                    | Scoring (1-5)         |
| --------------------------- | ------ | ---------------------------------------------- | --------------------- |
| createTestContainer Absence | 0.35   | Function removed from codebase                 | 1=Present, 5=Removed  |
| git grep Verification       | 0.25   | `git grep createTestContainer` returns nothing | 1=Matches, 5=Clean    |
| Container Utils Cleanup     | 0.20   | All container-related test utilities removed   | 1=Present, 5=Removed  |
| Documentation Updated       | 0.20   | Test documentation reflects Layer pattern      | 1=Old docs, 5=Updated |

**Threshold**: 4.5/5.0

---

### Phase 5: Dependencies (Week 3)

**Phase Goal**: Remove awilix dependencies and clean up all imports.

**Phase Success Criteria**:

- Zero awilix imports in codebase
- `awilix` and `awilix-modular` removed from package.json
- `bun.lockb` updated
- Full test suite passes
- No regression in functionality

---

#### Step 5.1: Remove awilix from package.json

**Goal**: Remove `awilix` and `awilix-modular` from all package.json files.

**Output**:

- Modified: Root `package.json`
- Modified: Any workspace package.json with awilix deps

**Success Criteria**:

- [ ] `grep -r "awilix" package.json` returns nothing
- [ ] No `awilix` in `dependencies`
- [ ] No `awilix` in `devDependencies`
- [ ] No `awilix-modular` references

**Estimated Effort**: 30 minutes

**Risk Level**: LOW

**Dependencies**: Phase 4 complete (no code uses awilix)

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                    | Weight | Description                                 | Scoring (1-5)       |
| ---------------------------- | ------ | ------------------------------------------- | ------------------- |
| Root package.json Clean      | 0.25   | No awilix in root package.json              | 1=Present, 5=Absent |
| Workspace package.json Clean | 0.25   | No awilix in workspace package.json files   | 1=Present, 5=Absent |
| awilix-modular Removed       | 0.25   | No awilix-modular references                | 1=Present, 5=Absent |
| Dependencies Section Check   | 0.15   | Neither in dependencies nor devDependencies | 1=Present, 5=Absent |
| Peer Dependencies Check      | 0.10   | No peer dependencies on awilix              | 1=Present, 5=Absent |

**Threshold**: 4.0/5.0

---

#### Step 5.2: Clean Up All Imports

**Goal**: Remove all awilix-related import statements.

**Patterns to Remove**:

- `import { createStaticModule } from 'awilix-modular'`
- `import { Lifetime } from 'awilix'`
- `import type { AwilixContainer } from 'awilix'`
- `import { asClass, asValue } from 'awilix'`
- `import { AwilixContainer } from 'awilix'`

**Success Criteria**:

- [ ] `grep -r "from 'awilix'" --include="*.ts" | wc -l` returns 0
- [ ] `grep -r "from 'awilix-modular'" --include="*.ts" | wc -l` returns 0
- [ ] TypeScript compilation passes
- [ ] No `AwilixContainer` type references

**Verification Commands**:

```bash
grep -r "from 'awilix'" --include="*.ts" | wc -l
grep -r "AwilixContainer" --include="*.ts" | wc -l
grep -r "createStaticModule" --include="*.ts" | wc -l
```

**Estimated Effort**: 1 hour

**Risk Level**: LOW

**Dependencies**: Steps 5.1-5.4

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion                     | Weight | Description                                                   | Scoring (1-5)              |
| ----------------------------- | ------ | ------------------------------------------------------------- | -------------------------- |
| AC1: Zero awilix Imports      | 0.15   | `grep -r "from 'awilix'" --include="*.ts" \| wc -l` = 0       | 1=>0, 5=0                  |
| AC2: Modules Deleted          | 0.15   | `ls packages/adapters/src/modules/` = empty or missing        | 1=Files present, 5=Clean   |
| AC3: Direct Controller Access | 0.15   | `grep -r "context.container" --include="*.ts" \| wc -l` = 0   | 1=>0, 5=0                  |
| AC4: Factory Exists           | 0.10   | Controller factory file exists and compiles                   | 1=Missing, 5=Present+works |
| AC5: Helpers Exist            | 0.10   | Resolver helpers file exists and exports correctly            | 1=Missing, 5=Present+works |
| AC6: Test Layer Pattern       | 0.10   | `grep -r "createTestContainer" --include="*.ts" \| wc -l` = 0 | 1=>0, 5=0                  |
| AC7: Dependencies Removed     | 0.10   | `grep -r "awilix" package.json` returns nothing               | 1=Present, 5=Absent        |
| AC8: All Tests Pass           | 0.15   | `bun test && bun test:integration` passes                     | 1=Fail, 3=Partial, 5=All   |

**Threshold**: 4.5/5.0

---

#### Step 5.3: Update Lockfile

**Goal**: Run `bun install` to update `bun.lockb`.

**Success Criteria**:

- [ ] `bun.lockb` updated
- [ ] No awilix references in lockfile
- [ ] `bun install` completes without errors

**Estimated Effort**: 15 minutes

**Risk Level**: LOW

**Dependencies**: Step 5.1

### Verification

**Verification Level**: LOW (Self-Verification)

**Custom Rubric**:

| Criterion             | Weight | Description                             | Scoring (1-5)            |
| --------------------- | ------ | --------------------------------------- | ------------------------ |
| bun.lockb Updated     | 0.30   | Lockfile reflects dependency removal    | 1=Not updated, 5=Updated |
| No awilix in Lockfile | 0.30   | `grep awilix bun.lockb` returns nothing | 1=Present, 5=Absent      |
| Install Success       | 0.25   | `bun install` completes without errors  | 1=Errors, 5=Clean        |
| Dependencies Resolved | 0.15   | All remaining deps resolve correctly    | 1=Issues, 5=Clean        |

**Threshold**: 3.5/5.0

---

#### Step 5.4: Run Full Test Suite

**Goal**: Verify entire codebase works without awilix.

**Success Criteria**:

- [ ] `bun test` passes (all unit tests)
- [ ] `bun test:integration` passes (all integration tests)
- [ ] `bun tsc --noEmit` passes (type checking)
- [ ] No console errors about missing dependencies

**Estimated Effort**: 30 minutes (runtime)

**Risk Level**: MEDIUM

**Dependencies**: Steps 5.1, 5.2, 5.3

### Verification

**Verification Level**: HIGH (Panel - 3 Judges)

**Custom Rubric**:

| Criterion              | Weight | Description                          | Scoring (1-5)                        |
| ---------------------- | ------ | ------------------------------------ | ------------------------------------ |
| Unit Test Pass         | 0.30   | `bun test` passes all unit tests     | 1=Many fail, 3=Some fail, 5=All pass |
| Integration Test Pass  | 0.30   | `bun test:integration` passes        | 1=Fail, 3=Some, 5=All                |
| Type Check Pass        | 0.20   | `bun tsc --noEmit` passes            | 1=Errors, 5=Clean                    |
| No Console Errors      | 0.10   | No dependency-related console errors | 1=Errors, 5=Clean                    |
| Performance Regression | 0.10   | No significant test slowdown         | 1=Slow, 5=Normal                     |

**Threshold**: 4.5/5.0

---

#### Step 5.5: Final Verification

**Goal**: Complete final acceptance criteria verification.

**Verification Checklist**:

| AC  | Verification Command                                           | Expected Result       |
| --- | -------------------------------------------------------------- | --------------------- |
| AC1 | `grep -r "from 'awilix'" --include="*.ts" \| wc -l`            | 0                     |
| AC2 | `ls packages/adapters/src/modules/`                            | Empty or no directory |
| AC3 | `grep -r "context.container" --include="*.ts" \| wc -l`        | 0                     |
| AC4 | `ls packages/adapters/src/controllers/factory.ts`              | File exists           |
| AC5 | `ls apps/backend-server/src/graphql/utils/resolver-helpers.ts` | File exists           |
| AC6 | `grep -r "createTestContainer" --include="*.ts" \| wc -l`      | 0                     |
| AC7 | `grep -r "awilix" package.json`                                | Nothing               |
| AC8 | `bun test` && `bun test:integration`                           | Pass                  |

**Estimated Effort**: 1 hour

**Risk Level**: LOW

**Dependencies**: Phase 1

### Verification

**Verification Level**: MEDIUM (Single Judge)

**Custom Rubric**:

| Criterion                | Weight | Description                                               | Scoring (1-5)                   |
| ------------------------ | ------ | --------------------------------------------------------- | ------------------------------- |
| Resolve Call Replacement | 0.30   | All context.container.resolve("groupController") replaced | 1=Still present, 5=All replaced |
| Direct Controller Access | 0.25   | Uses context.controllers.groupController correctly        | 1=Wrong, 5=Correct              |
| TypeScript Compilation   | 0.20   | Strict mode passes                                        | 1=Errors, 5=Clean               |
| Tests Pass               | 0.15   | Group resolver tests pass                                 | 1=Fail, 5=Pass                  |
| No awilix Imports        | 0.10   | Zero awilix imports                                       | 1=Present, 5=Absent             |

**Threshold**: 4.0/5.0

---

## Summary

### Effort Summary

| Phase     | Steps        | Est. Effort     | Risk Level  |
| --------- | ------------ | --------------- | ----------- |
| Phase 1   | 3 steps      | 6-7 hours       | MEDIUM      |
| Phase 2   | 7 steps      | 14.5 hours      | MEDIUM      |
| Phase 3   | 6 steps      | 4 hours         | MEDIUM      |
| Phase 4   | 5 steps      | 17 hours        | MEDIUM-HIGH |
| Phase 5   | 5 steps      | 3 hours         | LOW         |
| **Total** | **26 steps** | **~44.5 hours** | **MEDIUM**  |

### Timeline Summary

- **Week 1**: Phase 1 (Infrastructure) + Phase 2 batch 1-2 (User, Trip, Challenge, Group)
- **Week 2**: Phase 2 batch 3-7 (remaining resolvers) + Phase 3 (Cleanup)
- **Week 3**: Phase 4 (Test migration) + Phase 5 (Dependencies)

### Critical Path

```
1.1 Controller Factory → 1.2 GraphQL Context → 2.1 User Resolver → ... → 5.5 Final Verification
```

The critical path runs through all phases sequentially. Parallel work possible within phases.

### Rollback Points

Safe rollback points after completion of:

1. Phase 1 (revert to container-only context)
2. Each Phase 2 batch (revert specific resolvers)
3. Phase 3 (restore modules from git)
4. Phase 4 (keep container shim)
5. Phase 5 (re-add dependencies if critical issue found)

## Definition of Done

- [ ] All 57 awilix imports removed
- [ ] All 5 module files deleted
- [ ] All 20 GraphQL resolvers use context.controllers
- [ ] Controller factory created with all 17 controllers
- [ ] Resolver helpers created for type-safe access
- [ ] Test utilities migrated to Layer pattern
- [ ] awilix and awilix-modular dependencies removed
- [ ] All tests pass (bun test and bun test:integration)
- [ ] No regression in application functionality
- [ ] Documentation updated (CLAUDE.md if needed)

## Related Documents

- Migration Plan: `.specs/tasks/in-progress/awilix-to-effect-migration.md`
- Root AGENTS.md: `AGENTS.md`
- Adapters AGENTS.md: `packages/adapters/AGENTS.md`
- Effect Testing Guide: `TESTING.md`

---

## Parallelization

This section provides a parallel execution plan for the 26 implementation steps, enabling multiple agents to work simultaneously while respecting dependencies.

### 1. Dependency Graph

```
FOUNDATION (No Dependencies)
├── Step 1.1: Controller Factory
│   ├──► Step 1.2: GraphQL Context ──┐
│   └──► Step 1.3: Resolver Helpers  │
│                                    │
│   PHASE 1 COMPLETE                 │
│           │                        │
│           ▼                        │
RESOLVER MIGRATION (All depend on Phase 1)
├── Step 2.1: User Resolver (Independent)
├── Step 2.2: Trip Resolver (Independent)
├── Step 2.3: Challenge Resolver (Independent)
├── Step 2.4: Group Resolver (Independent)
├── Step 2.5: ActivityFeed Resolver (Independent)
├── Step 2.6: Notification Resolvers (3 files, Independent)
└── Step 2.7: Remaining Resolvers (10 files, Prefer after 2.1-2.6)
│
│   PHASE 2 COMPLETE
│           │
│           ▼
MODULE CLEANUP (All depend on Phase 2)
├── Step 3.1: Delete ControllerModule (Independent)
├── Step 3.2: Delete RepositoryModule (Independent)
├── Step 3.3: Delete UseCaseModule (adapters) (Independent)
├── Step 3.4: Delete AnalyticsModule (Independent)
├── Step 3.5: Delete UseCaseModule (use-cases) (Independent)
└── Step 3.6: Clean Empty Directories (Depends on 3.1-3.5)
│
│   PHASE 3 COMPLETE
│           │
│           ▼
TEST MIGRATION (Mixed Dependencies)
├── Step 4.1: Update Test Layer Utilities (Depends on Phase 1)
│   ├──► Step 4.2: Migrate migration.e2e.test.ts (Depends on 4.1)
│   ├──► Step 4.3: Migrate User.resolver.test.ts (Depends on 4.1, 2.1)
│   └──► Step 4.4: Migrate Remaining Tests (Depends on 4.1, 4.2, 4.3)
│           │
│           ▼
└── Step 4.5: Remove Test Container Shim (Depends on 4.4)
│
│   PHASE 4 COMPLETE
│           │
│           ▼
DEPENDENCIES (Sequential)
└── Step 5.1: Remove awilix from package.json
    ├──► Step 5.2: Clean Up All Imports (Depends on 5.1, parallel with 5.3)
    ├──► Step 5.3: Update Lockfile (Depends on 5.1, parallel with 5.2)
    ├──► Step 5.4: Run Full Test Suite (Depends on 5.1, 5.2, 5.3)
    └──► Step 5.5: Final Verification (Depends on 5.4)
```

### 2. Parallel Groups

#### Group 1: Foundation (Immediate Start)

| Step | Description        | Dependencies | Est. Time | Risk |
| ---- | ------------------ | ------------ | --------- | ---- |
| 1.1  | Controller Factory | None         | 2-3h      | LOW  |

**Entry Criteria**: None
**Exit Criteria**: File compiles, exports all 17 controllers

---

#### Group 2: Infrastructure (Depends on Group 1)

| Step | Description      | Dependencies | Est. Time | Risk   |
| ---- | ---------------- | ------------ | --------- | ------ |
| 1.2  | GraphQL Context  | 1.1          | 2h        | MEDIUM |
| 1.3  | Resolver Helpers | 1.1          | 2h        | LOW    |

**Entry Criteria**: Step 1.1 COMPLETE
**Exit Criteria**: Context has both container (deprecated) and controllers
**Parallelism**: Both steps can run simultaneously (2 agents)

---

#### Group 3: Resolver Batch 1 (Independent - Simple Resolvers)

| Step | Description           | Dependencies | Est. Time | Risk |
| ---- | --------------------- | ------------ | --------- | ---- |
| 2.1  | User Resolver         | Phase 1      | 1h        | LOW  |
| 2.2  | Trip Resolver         | Phase 1      | 1h        | LOW  |
| 2.4  | Group Resolver        | Phase 1      | 1h        | LOW  |
| 2.5  | ActivityFeed Resolver | Phase 1      | 1h        | LOW  |

**Entry Criteria**: Phase 1 COMPLETE
**Exit Criteria**: All 4 resolvers use context.controllers
**Parallelism**: 100% - 4 agents can work simultaneously

---

#### Group 4: Resolver Batch 2 (Moderate Complexity)

| Step | Description                      | Dependencies | Est. Time | Risk   |
| ---- | -------------------------------- | ------------ | --------- | ------ |
| 2.3  | Challenge Resolver               | Phase 1      | 1.5h      | MEDIUM |
| 2.6  | Notification Resolvers (3 files) | Phase 1      | 2h        | MEDIUM |

**Entry Criteria**: Phase 1 COMPLETE
**Exit Criteria**: All files migrated, tests pass
**Parallelism**: Can run alongside Group 3 (2 additional agents)
**Note**: Challenge has 3 controllers; Notifications batch has 3 files

---

#### Group 5: Resolver Batch 3 (Remaining 10 Files)

| Step | Description                    | Dependencies | Est. Time | Risk   |
| ---- | ------------------------------ | ------------ | --------- | ------ |
| 2.7  | Remaining Resolvers (10 files) | Phase 1      | 6h        | MEDIUM |

**Entry Criteria**: Groups 3 and 4 COMPLETE (pattern established)
**Exit Criteria**: All 10 resolvers migrated
**Parallelism**: Split across 2 agents (5 files each):

- Agent A: Location, Reward, Coin, CoinTransaction, Sponsor
- Agent B: SubmissionReport, Storage, Analytics, Search, Health

---

#### Group 6: Module Cleanup (Parallel Deletion)

| Step | Description                      | Dependencies | Est. Time | Risk   |
| ---- | -------------------------------- | ------------ | --------- | ------ |
| 3.1  | Delete ControllerModule          | Phase 2      | 30min     | MEDIUM |
| 3.2  | Delete RepositoryModule          | Phase 2      | 30min     | MEDIUM |
| 3.3  | Delete UseCaseModule (adapters)  | Phase 2      | 30min     | MEDIUM |
| 3.4  | Delete AnalyticsModule           | Phase 2      | 30min     | LOW    |
| 3.5  | Delete UseCaseModule (use-cases) | Phase 2      | 30min     | LOW    |
| 3.6  | Clean Empty Directories          | 3.1-3.5      | 15min     | LOW    |

**Entry Criteria**: Phase 2 COMPLETE
**Exit Criteria**: All 5 modules deleted, compilation passes
**Parallelism**: Steps 3.1-3.5 can run simultaneously (5 agents), 3.6 after completion

---

#### Group 7: Test Utilities Foundation

| Step | Description                 | Dependencies | Est. Time | Risk   |
| ---- | --------------------------- | ------------ | --------- | ------ |
| 4.1  | Update Test Layer Utilities | Phase 1      | 2h        | MEDIUM |

**Entry Criteria**: Phase 1 COMPLETE
**Exit Criteria**: createTestLayer() works, shim has deprecation warning

---

#### Group 8: Test Migration Batch 1

| Step | Description                   | Dependencies | Est. Time | Risk   |
| ---- | ----------------------------- | ------------ | --------- | ------ |
| 4.2  | Migrate migration.e2e.test.ts | 4.1          | 3h        | MEDIUM |
| 4.3  | Migrate User.resolver.test.ts | 4.1, 2.1     | 2h        | MEDIUM |

**Entry Criteria**: Step 4.1 COMPLETE
**Exit Criteria**: Both test files use Layer pattern
**Parallelism**: 100% - independent test files

---

#### Group 9: Test Migration Batch 2 (Remaining Tests)

| Step | Description                  | Dependencies  | Est. Time | Risk        |
| ---- | ---------------------------- | ------------- | --------- | ----------- |
| 4.4  | Migrate Remaining Test Files | 4.1, 4.2, 4.3 | 10h       | MEDIUM-HIGH |
| 4.5  | Remove Test Container Shim   | 4.4           | 30min     | MEDIUM      |

**Entry Criteria**: Group 8 COMPLETE
**Exit Criteria**: No tests use createTestContainer
**Parallelism**: Split 4.4 across 3 agents:

- Agent A: Resolver tests batch 1 (6 files)
- Agent B: Resolver tests batch 2 (6 files)
- Agent C: Integration tests (6 files)

---

#### Group 10: Dependency Removal (Sequential)

| Step | Description                     | Dependencies  | Est. Time | Risk   |
| ---- | ------------------------------- | ------------- | --------- | ------ |
| 5.1  | Remove awilix from package.json | Phase 4       | 30min     | LOW    |
| 5.2  | Clean Up All Imports            | 5.1           | 1h        | LOW    |
| 5.3  | Update Lockfile                 | 5.1           | 15min     | LOW    |
| 5.4  | Run Full Test Suite             | 5.1, 5.2, 5.3 | 30min     | MEDIUM |
| 5.5  | Final Verification              | 5.4           | 1h        | LOW    |

**Entry Criteria**: Phase 4 COMPLETE
**Exit Criteria**: All acceptance criteria verified
**Parallelism**: Steps 5.2 and 5.3 can run in parallel after 5.1

### 3. Agent Assignments

#### Recommended Agent Configuration (6 agents)

| Agent                  | Assigned Steps                 | Role                          | Justification                                                      |
| ---------------------- | ------------------------------ | ----------------------------- | ------------------------------------------------------------------ |
| **opus**               | 1.1                            | Complex Architecture          | Controller Factory requires design decisions for Layer composition |
| **sonnet**             | 1.2, 1.3, 5.2                  | Standard Implementation       | Context updates and import cleanup                                 |
| **sdd:developer #1**   | 2.1, 2.4, 2.7 (part)           | Resolver Migration            | User, Group, and 5 remaining resolvers                             |
| **sdd:developer #2**   | 2.2, 2.3, 2.5, 2.6, 2.7 (part) | Resolver Migration            | Trip, Challenge, ActivityFeed, Notifications, 5 remaining          |
| **sdd:qa-engineer #1** | 4.1, 4.3, 4.4 (part)           | Test Migration                | Utilities, User tests, remaining tests batch                       |
| **sdd:qa-engineer #2** | 4.2, 4.4 (part), 4.5, 5.4      | Test Migration + Verification | E2E tests, remaining tests, shim removal, test suite               |
| **haiku**              | 3.1-3.6, 5.1, 5.3              | Cleanup + Admin               | Module deletion, dependency removal, lockfile update               |
| **sdd:tech-lead**      | 5.5                            | Final Review                  | Verification of all acceptance criteria                            |

#### Alternative: Minimum Configuration (3 agents)

| Agent               | Assigned Steps   | Timeline                             |
| ------------------- | ---------------- | ------------------------------------ |
| **sonnet**          | 1.1-1.3, 2.1-2.7 | 0-12 hours                           |
| **sdd:qa-engineer** | 4.1-4.5          | 5-14 hours (starts after 1.1)        |
| **haiku**           | 3.1-3.6, 5.1-5.5 | 11-17 hours (starts after resolvers) |

### 4. Parallelization Diagram

```
Timeline (Hours 0-18 with 6 agents)
═══════════════════════════════════════════════════════════════════════════════

Agent:    opus        sonnet      dev-1       dev-2       qa-1        qa-2
          │           │           │           │           │           │
Hour 0    [1.1═══════════════════════]          │           │           │
Hour 3                [1.2═══════][1.3═══════]  │           │           │
Hour 5                            [2.1][2.4]   [2.2][2.3][2.5]         │
Hour 6                            [2.7═══════════════════════════]     │
                              (part 1)│           (part 2)│           │
Hour 8                                          [2.6════════════]     │
Hour 10                                                             [4.1═══]
Hour 12   [haiku starts 3.x cleanup parallel to remaining work]      │
Hour 13                                          [4.3═══]           [4.2══════]
Hour 15                                          [4.4═══════════════════════]
                                              (part 1)│     (part 2)│
Hour 17                                           [4.5]              [5.4]
Hour 18   [tech-lead: 5.5 verification]                              │
          │
Hour 19   [COMPLETE]

═══════════════════════════════════════════════════════════════════════════════
Key:
[═══] Active work on that step
Numbers indicate step identifiers (e.g., 1.1 = Step 1.1)
```

### 5. Execution Directive

#### Pre-Flight Checklist for All Agents

Before starting any step, each agent MUST:

1. **Read the full task file** at `.specs/tasks/draft/migrate-awilix-to-effect-di.refactor.md`
2. **Check dependency status** in `.specs/scratchpad/status.log`
3. **Verify no conflicts** - check if another agent is working on same files
4. **Update status log** with: `echo "Step X.Y: STARTED - Agent <name>" >> .specs/scratchpad/status.log`

#### Dependency Verification Commands

```bash
# Before starting any step, verify dependencies are COMPLETE
verify_dependency() {
    local step="$1"
    if ! grep -q "^$step: COMPLETE" .specs/scratchpad/status.log 2>/dev/null; then
        echo "ERROR: $step is not complete. Cannot proceed."
        exit 1
    fi
}

# Example usage before starting Step 1.2:
verify_dependency "Step 1.1"
```

#### Parallel Execution Rules

1. **No File Conflicts**: Agents working in parallel must not modify the same files
   - Group 3/4 resolvers: Each agent gets distinct resolver files
   - Group 6 cleanup: Each agent deletes different modules
   - Group 9 tests: Split test files across agents

2. **Status Updates**: After each subtask completion:

   ```bash
   echo "$(date -Iseconds) Step X.Y Subtask Z: COMPLETE - Agent <name>" >> .specs/scratchpad/status.log
   ```

3. **Compilation Gates**: After each group completes:

   ```bash
   bun tsc --noEmit || { echo "TypeScript errors detected"; exit 1; }
   ```

4. **Test Gates**: After resolver batches:
   ```bash
   bun test:unit --testNamePattern="Resolver" || { echo "Resolver tests failed"; exit 1; }
   ```

#### Communication Protocol

| Event            | Action                         | Log Entry                          |
| ---------------- | ------------------------------ | ---------------------------------- |
| Start work       | Update status.log              | `Step X.Y: STARTED - Agent <name>` |
| Subtask complete | Update status.log              | `Step X.Y Subtask Z: COMPLETE`     |
| Blocked          | Update status.log + notify     | `Step X.Y: BLOCKED - <reason>`     |
| Step complete    | Update status.log + git commit | `Step X.Y: COMPLETE`               |
| Critical error   | Halt all agents                | `CRITICAL: <description>`          |

#### Rollback Protocol

If a parallel step fails:

1. Agent marks status: `echo "Step X.Y: FAILED - <reason>" >> .specs/scratchpad/status.log`
2. Agents on dependent steps PAUSE (do not start new work)
3. Failed agent attempts fix or requests help
4. If unrecoverable, use git to revert:
   ```bash
   git log --oneline --all --grep="Step X.Y"
   git revert <commit-hash>
   ```
5. Re-run verification: `bun test`
6. Resume dependent steps after fix confirmed

#### Quality Gates Between Groups

| Gate           | Command                                                                  | Required Result  |
| -------------- | ------------------------------------------------------------------------ | ---------------- | --- |
| After Group 1  | `bun tsc --noEmit`                                                       | No errors        |
| After Group 2  | `bun test:unit`                                                          | Pass             |
| After Group 5  | `grep -r "container.resolve" apps/backend-server/src/graphql/resolvers/` | No matches       |
| After Group 6  | `ls packages/adapters/src/modules/`                                      | Empty or missing |
| After Group 9  | `grep -r "createTestContainer" --include="\*.ts"                         | wc -l`           | 0   |
| After Group 10 | `./scripts/verify-acceptance-criteria.sh`                                | All pass         |

---

## Verification Summary Table

| Step | Description                              | Verification Level      | Threshold | Key Risk                             |
| ---- | ---------------------------------------- | ----------------------- | --------- | ------------------------------------ |
| 1.1  | Create Controller Factory                | MEDIUM (Single Judge)   | 4.0/5.0   | Controller instantiation correctness |
| 1.2  | Update GraphQL Context                   | MEDIUM (Single Judge)   | 4.0/5.0   | Backward compatibility break         |
| 1.3  | Create Resolver Helpers                  | MEDIUM (Single Judge)   | 4.0/5.0   | Type inference issues                |
| 2.1  | Migrate User Resolver                    | MEDIUM (Single Judge)   | 4.0/5.0   | Resolver behavior change             |
| 2.2  | Migrate Trip Resolver                    | MEDIUM (Single Judge)   | 4.0/5.0   | Resolver behavior change             |
| 2.3  | Migrate Challenge Resolver               | MEDIUM (Single Judge)   | 4.0/5.0   | Multiple controller complexity       |
| 2.4  | Migrate Group Resolver                   | MEDIUM (Single Judge)   | 4.0/5.0   | Resolver behavior change             |
| 2.5  | Migrate ActivityFeed Resolver            | MEDIUM (Single Judge)   | 4.0/5.0   | Resolver behavior change             |
| 2.6  | Migrate Notification Resolvers (3 files) | MEDIUM (Single Judge)   | 4.0/5.0   | Batch complexity (3 files)           |
| 2.7  | Migrate Remaining Resolvers (10 files)   | HIGH (Panel - 3 Judges) | 4.0/5.0   | Large batch size (10 files)          |
| 3.1  | Delete ControllerModule                  | HIGH (Panel - 3 Judges) | 4.5/5.0   | Irreversible deletion                |
| 3.2  | Delete RepositoryModule                  | HIGH (Panel - 3 Judges) | 4.5/5.0   | Irreversible deletion                |
| 3.3  | Delete UseCaseModule (adapters)          | HIGH (Panel - 3 Judges) | 4.5/5.0   | Irreversible deletion                |
| 3.4  | Delete AnalyticsModule                   | MEDIUM (Single Judge)   | 4.0/5.0   | Feature regression                   |
| 3.5  | Delete UseCaseModule (use-cases)         | MEDIUM (Single Judge)   | 4.0/5.0   | Import cleanup                       |
| 3.6  | Clean Empty Directories                  | LOW (Self-Verification) | 3.5/5.0   | Trivial cleanup                      |
| 4.1  | Update Test Layer Utilities              | MEDIUM (Single Judge)   | 4.0/5.0   | Test utility correctness             |
| 4.2  | Migrate migration.e2e.test.ts            | MEDIUM (Single Judge)   | 4.0/5.0   | E2E test criticality                 |
| 4.3  | Migrate User.resolver.test.ts            | MEDIUM (Single Judge)   | 4.0/5.0   | Test pattern correctness             |
| 4.4  | Migrate Remaining Test Files             | HIGH (Panel - 3 Judges) | 4.0/5.0   | Large test volume                    |
| 4.5  | Remove Test Container Shim               | HIGH (Panel - 3 Judges) | 4.5/5.0   | Irreversible removal                 |
| 5.1  | Remove awilix from package.json          | MEDIUM (Single Judge)   | 4.0/5.0   | Dependency cleanup                   |
| 5.2  | Clean Up All Imports                     | MEDIUM (Single Judge)   | 4.0/5.0   | Import cleanup                       |
| 5.3  | Update Lockfile                          | LOW (Self-Verification) | 3.5/5.0   | Lockfile update                      |
| 5.4  | Run Full Test Suite                      | HIGH (Panel - 3 Judges) | 4.5/5.0   | Critical quality gate                |
| 5.5  | Final Verification                       | HIGH (Panel - 3 Judges) | 4.5/5.0   | Final acceptance                     |

### Verification Level Legend

| Level      | Description                            | Judge Count | Use Case                                               |
| ---------- | -------------------------------------- | ----------- | ------------------------------------------------------ |
| **HIGH**   | Panel evaluation with debate consensus | 3 judges    | Irreversible operations, critical gates, large batches |
| **MEDIUM** | Single judge evaluation                | 1 judge     | Standard implementation tasks, low-moderate risk       |
| **LOW**    | Self-verification or automated checks  | 0-1 judge   | Documentation, trivial changes, administrative tasks   |

### Threshold Legend

| Threshold         | Use Case                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| **4.5/5.0 (90%)** | Critical steps: module deletion, shim removal, final verification, test suite |
| **4.0/5.0 (80%)** | Standard steps: file creation, resolver migration, test migration, cleanup    |
| **3.5/5.0 (70%)** | Experimental/admin steps: directory cleanup, lockfile update                  |

### Critical Path Verification Points

Steps requiring mandatory panel verification (HIGH level):

1. **Step 2.7** - Remaining Resolvers (10 files): Ensures consistent migration across all resolvers
2. **Steps 3.1-3.3** - Module deletions: Irreversible operations requiring consensus
3. **Step 4.4** - Remaining Test Files: High volume of test changes
4. **Step 4.5** - Remove Test Container Shim: Irreversible removal
5. **Step 5.4** - Run Full Test Suite: Critical quality gate before acceptance
6. **Step 5.5** - Final Verification: Acceptance criteria compliance

---

## Summary of Parallel Effort

| Configuration          | Agents | Wall Time    | Speedup |
| ---------------------- | ------ | ------------ | ------- |
| Sequential             | 1      | 44.5 hours   | 1x      |
| Minimum (3 agents)     | 3      | ~24 hours    | 1.85x   |
| Recommended (6 agents) | 6-8    | ~16-18 hours | 2.5x    |
| Maximum (12+ agents)   | 12+    | ~14 hours    | 3.2x    |

**Critical Path Duration**: ~16 hours (with 6 agents)
**Bottleneck**: Steps 1.1 → 1.2 → 2.1 → 2.7 → 4.1 → 4.2 → 4.4 → 5.1 → 5.5
