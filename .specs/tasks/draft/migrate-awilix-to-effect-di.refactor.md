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
