# Migration Plan: awilix → Effect DI

> **Document Type**: Technical Specification  
> **Scope**: Complete removal of awilix-modular DI system in favor of pure Effect Layers  
> **Risk Level**: MEDIUM (incremental migration with backward compatibility)  
> **Estimated Duration**: 2-3 weeks (parallelizable work)  
> **Created**: 2026-04-15

---

## Executive Summary

This document outlines the complete migration plan from awilix-modular to pure Effect-based dependency injection. The codebase is currently in a **mixed state** where:

- **Controllers already use Effect Layers** (receive `Layer.Layer<unknown>` in constructor)
- **awilix modules still exist** for backward compatibility
- **GraphQL resolvers still resolve from container**

The migration will eliminate the remaining awilix infrastructure while maintaining full test coverage and zero-downtime transition.

### Current vs Target State

| Aspect               | Current (Mixed)                                  | Target (Pure Effect)                 |
| -------------------- | ------------------------------------------------ | ------------------------------------ |
| DI System            | Effect + awilix-modular                          | Effect only                          |
| Controller Creation  | `container.resolve("userController")`            | `new UserController(appLayer)`       |
| Test Setup           | `createTestContainer()` + `container.register()` | `Layer.succeed(Tag, implementation)` |
| Module Registration  | `createStaticModule()` with factories            | Direct Layer composition             |
| Package Dependencies | `awilix`, `awilix-modular`                       | None (Effect built-in)               |

---

## Phase 1: Audit & Preparation (Week 1)

### 1.1 Current State Audit

**Files to Audit:**

| Package        | Path                              | Purpose                         | Status     |
| -------------- | --------------------------------- | ------------------------------- | ---------- |
| adapters       | `src/modules/RepositoryModule.ts` | 17 repository registrations     | ACTIVE     |
| adapters       | `src/modules/ControllerModule.ts` | 17 controller registrations     | ACTIVE     |
| adapters       | `src/modules/UseCaseModule.ts`    | Port + use case registrations   | ACTIVE     |
| adapters       | `src/modules/AnalyticsModule.ts`  | Analytics service registrations | ACTIVE     |
| use-cases      | `src/modules/UseCaseModule.ts`    | Use case registrations (empty)  | STUB       |
| frameworks     | `src/di/test-layer.ts`            | Backward compat test utils      | DEPRECATED |
| frameworks     | `src/di/index.ts`                 | Deprecated exports              | DEPRECATED |
| backend-server | `src/graphql/context.ts`          | Container in context            | HYBRID     |
| backend-server | `src/graphql/resolvers/*.ts`      | Use `container.resolve()`       | TO MIGRATE |

**Usage Statistics:**

- **57 imports** of `awilix` or `awilix-modular` across codebase
- **4 module files** with `createStaticModule()` registrations
- **~17 resolvers** using `context.container.resolve()`
- **~15 test files** potentially using deprecated container API

### 1.2 Dependency Graph Analysis

```
AppLayer (Effect Layer)
├── RepositoryLayer (from RepositoryModule)
│   ├── userRepository → UserRepositoryTag
│   ├── tripRepository → TripRepositoryTag
│   └── ... (17 repositories)
├── PortLayer (from UseCaseModule)
│   ├── authPort → AuthPortTag
│   ├── realtimePort → RealtimePortTag
│   ├── storagePort → StoragePortTag
│   └── telemetryPort → TelemetryPortTag
└── ServiceLayer (from ControllerModule - partially migrated)
    └── (controllers receive Layer in constructor)
```

### 1.3 Migration Strategy: Layer-First

**Principle**: Migrate bottom-up, starting from infrastructure and moving up to resolvers.

1. **Repositories** already inject via Layer (RepositoryLayer exists)
2. **Ports** already inject via Layer (PortLayer exists)
3. **Controllers** receive Layer in constructor (hybrid - need to finish)
4. **Resolvers** need to migrate from `container.resolve()` to direct instantiation

---

## Phase 2: Core Infrastructure (Week 1-2)

### 2.1 Create Controller Factory

**File**: `packages/adapters/src/controllers/factory.ts` (NEW)

```typescript
/**
 * Controller Factory - Pure Effect Layer-based controller creation
 *
 * Replaces awilix container resolution with direct controller instantiation.
 * All controllers receive the AppLayer for Effect-based dependency injection.
 */

import type { Layer } from "effect";
import { UserController } from "./user";
import { TripController } from "./trip";
// ... other imports

export interface Controllers {
  userController: UserController;
  tripController: TripController;
  challengeController: ChallengeController;
  // ... all 17 controllers
}

/**
 * Create all controllers with the given AppLayer
 *
 * @param appLayer - Effect Layer with all repositories and services
 * @returns Object containing all controller instances
 */
export function createControllers(appLayer: Layer.Layer<unknown>): Controllers {
  return {
    userController: new UserController(appLayer),
    tripController: new TripController(appLayer),
    challengeController: new ChallengeController(appLayer),
    // ... all 17 controllers
  };
}

/**
 * Create a single controller (for selective injection)
 */
export const ControllerFactory = {
  user: (appLayer: Layer.Layer<unknown>) => new UserController(appLayer),
  trip: (appLayer: Layer.Layer<unknown>) => new TripController(appLayer),
  // ... etc
};
```

### 2.2 Update GraphQL Context

**File**: `apps/backend-server/src/graphql/context.ts` (MODIFY)

**Current (Hybrid)**:

```typescript
export interface GraphQLContext {
  appLayer: Layer.Layer<unknown>;
  request: Request;
  authContext?: AuthContext;
  runtime: GraphQLRuntime;
  container?: AwilixContainer; // <-- REMOVE
}
```

**Target (Pure Effect)**:

```typescript
export interface GraphQLContext {
  appLayer: Layer.Layer<unknown>;
  request: Request;
  authContext?: AuthContext;
  runtime: GraphQLRuntime;
  // Controllers are created once per request
  controllers: Controllers;
}
```

**Implementation**:

```typescript
export function createContextFactory(): (
  honoContext: HonoContext,
) => Promise<GraphQLContext> {
  return async (honoContext: HonoContext): Promise<GraphQLContext> => {
    const appLayer = honoContext.get("appLayer") as Layer.Layer<unknown>;
    if (!appLayer) {
      throw new Error("AppLayer not found in Hono context");
    }

    // Create controllers directly with AppLayer
    const controllers = createControllers(appLayer);

    // ... auth resolution ...

    return {
      appLayer,
      request: honoContext.req.raw,
      runtime: createGraphQLRuntime(),
      controllers, // <-- NEW
    };
  };
}
```

### 2.3 Create Resolver Helper

**File**: `apps/backend-server/src/graphql/utils/resolver-helpers.ts` (NEW)

```typescript
/**
 * Resolver Helpers - Utilities for GraphQL resolvers
 *
 * Provides type-safe controller access and common resolver patterns.
 */

import type { GraphQLContext } from "../context";
import type { Controllers } from "@mirai-app/adapters";

/**
 * Get controller from context with type safety
 */
export function getController<K extends keyof Controllers>(
  context: GraphQLContext,
  name: K,
): Controllers[K] {
  return context.controllers[name];
}

/**
 * Type-safe controller accessor for common controllers
 */
export const ControllersFrom = {
  user: (ctx: GraphQLContext) => ctx.controllers.userController,
  trip: (ctx: GraphQLContext) => ctx.controllers.tripController,
  challenge: (ctx: GraphQLContext) => ctx.controllers.challengeController,
  // ... etc
};
```

---

## Phase 3: Resolver Migration (Week 2)

### 3.1 Migration Pattern for Each Resolver

**Current Pattern** (in `resolvers/User.ts`):

```typescript
resolve: async (_root, args, context) => {
  const controller =
    context.container.resolve<UserController>("userController");
  const result = await controller.getById({ id: args.id });
  // ...
};
```

**Target Pattern**:

```typescript
resolve: async (_root, args, context) => {
  const controller = context.controllers.userController; // Direct access
  const result = await controller.getById({ id: args.id });
  // ...
};
```

### 3.2 Resolver Migration Checklist

| Resolver             | File                                | Status     | Notes                                    |
| -------------------- | ----------------------------------- | ---------- | ---------------------------------------- |
| User                 | `resolvers/User.ts`                 | ⏳ PENDING | 4 resolvers (user, users, me, mutations) |
| Trip                 | `resolvers/trip.ts`                 | ⏳ PENDING |                                          |
| Challenge            | `resolvers/challenge.ts`            | ⏳ PENDING |                                          |
| Group                | `resolvers/group.ts`                | ⏳ PENDING |                                          |
| Location             | `resolvers/location.ts`             | ⏳ PENDING |                                          |
| Notification         | `resolvers/notifications.ts`        | ⏳ PENDING |                                          |
| ChallengeSubmission  | `resolvers/challengeSubmission.ts`  | ⏳ PENDING |                                          |
| ChallengeVote        | `resolvers/challengeVote.ts`        | ⏳ PENDING |                                          |
| ActivityFeed         | `resolvers/activityFeed.ts`         | ⏳ PENDING |                                          |
| Sponsor              | `resolvers/sponsor.ts`              | ⏳ PENDING |                                          |
| SubmissionReport     | `resolvers/submissionReport.ts`     | ⏳ PENDING |                                          |
| Reward               | `resolvers/reward.ts`               | ⏳ PENDING |                                          |
| Coin                 | `resolvers/coin.ts`                 | ⏳ PENDING |                                          |
| CoinTransaction      | `resolvers/coinTransaction.ts`      | ⏳ PENDING |                                          |
| Storage              | `resolvers/storage.ts`              | ⏳ PENDING |                                          |
| NotificationSchedule | `resolvers/notificationSchedule.ts` | ⏳ PENDING |                                          |
| NotificationDelivery | `resolvers/notificationDelivery.ts` | ⏳ PENDING |                                          |
| NotificationSender   | `resolvers/notificationSender.ts`   | ⏳ PENDING |                                          |

### 3.3 Batch Migration Order

**Batch 1 (Low Risk)**: User, Trip, Location - Simple controllers, well-tested
**Batch 2 (Medium Risk)**: Challenge, Group, ActivityFeed - Moderate complexity
**Batch 3 (Medium Risk)**: Notifications, Schedule, Delivery - Multiple dependencies
**Batch 4 (Higher Risk)**: Coin, Reward, Storage - Financial/storage operations

---

## Phase 4: Module Cleanup (Week 2-3)

### 4.1 Remove Module Registrations

#### Step 4.1.1: Delete ControllerModule

**File**: `packages/adapters/src/modules/ControllerModule.ts` (DELETE)

- All controller registrations become direct instantiation
- No longer needed once resolvers use `context.controllers`

#### Step 4.1.2: Delete RepositoryModule

**File**: `packages/adapters/src/modules/RepositoryModule.ts` (DELETE)

- RepositoryLayer in frameworks already handles this
- Repositories are accessed via `yield* UserRepositoryTag` in Effects

#### Step 4.1.3: Delete UseCaseModule (adapters)

**File**: `packages/adapters/src/modules/UseCaseModule.ts` (DELETE)

- Port implementations move to direct Layer registration
- Use cases are pure functions, no DI registration needed

#### Step 4.1.4: Delete UseCaseModule (use-cases)

**File**: `packages/use-cases/src/modules/UseCaseModule.ts` (DELETE)

- Already a stub (empty providers)
- Use cases are used as functions with `Effect.provideService`

#### Step 4.1.5: Delete AnalyticsModule

**File**: `packages/adapters/src/modules/AnalyticsModule.ts` (DELETE)

- Analytics services move to direct Layer registration
- Or inline in AppLayer composition

### 4.2 Simplify AppLayer Composition

**Current**: AppLayer composition in `packages/frameworks/src/layers/app-layer.ts`

**Target**: Direct Layer composition without module intermediates

```typescript
// Simplified AppLayer composition
export const makeAppLayer = (config: AppLayerConfig): Layer.Layer<unknown> => {
  const dbLayer = Layer.succeed(DbTag, config.db);
  const supabaseLayer = Layer.succeed(SupabaseTag, config.supabase);

  // Repository layer directly
  const repositoryLayer = Layer.mergeAll(
    Layer.succeed(UserRepositoryTag, new DrizzleUserRepository(config.db)),
    Layer.succeed(TripRepositoryTag, new DrizzleTripRepository(config.db)),
    // ... all 17 repositories
  );

  // Port layer directly
  const portLayer = Layer.mergeAll(
    Layer.succeed(AuthPortTag, new SupabaseAuthAdapter(config.supabase)),
    Layer.succeed(StoragePortTag, new SupabaseStorageAdapter(config.supabase)),
    // ... other ports
  );

  return Layer.mergeAll(dbLayer, supabaseLayer, repositoryLayer, portLayer);
};
```

---

## Phase 5: Test Migration (Week 3)

### 5.1 Update Test Utilities

**File**: `packages/frameworks/src/di/test-layer.ts` (KEEP but simplify)

**Current**: Complex backward compatibility with `createTestContainer()`

**Target**: Pure Layer-based testing only

```typescript
// Keep only the Layer-based utilities
export { createTestLayer, createMinimalTestLayer, runWithTestLayer };

// Remove all deprecated container-based exports
// - createTestContainer() → already deprecated
// - createConfiguredTestContainer() → remove
// - createTestContainerFromModule() → remove
// - All getInMemory*Adapter() functions → remove
```

### 5.2 Test File Migration

**Pattern for migrating tests:**

```typescript
// OLD (awilix-based)
import { createTestContainer } from "@mirai-app/frameworks/di";

const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});
const repo = container.resolve<UserRepository>("userRepository");

// NEW (Effect Layer-based)
import { createTestLayer } from "@mirai-app/frameworks/di";
import { Layer, Effect } from "effect";

const testLayer = Layer.succeed(
  UserRepositoryTag,
  new InMemoryUserRepository(),
);

const program = Effect.gen(function* () {
  const repo = yield* UserRepositoryTag;
  return yield* repo.findById("123");
}).pipe(Effect.provide(testLayer));

const result = await Effect.runPromise(program);
```

### 5.3 Test Migration Checklist

| Test File               | Container Usage                           | Priority |
| ----------------------- | ----------------------------------------- | -------- |
| `migration.e2e.test.ts` | Line 31: `asClass, asValue from "awilix"` | HIGH     |
| `User.resolver.test.ts` | Line 14: `asClass, asValue from "awilix"` | HIGH     |
| `performance.bench.ts`  | Line 22: `asClass from "awilix"`          | LOW      |
| `auth-handler.test.ts`  | Type imports only                         | LOW      |

---

## Phase 6: Dependency Cleanup (Week 3)

### 6.1 Remove awilix Packages

**Files to modify**: Root `package.json`, `packages/frameworks/package.json`, `packages/adapters/package.json`

```bash
# Remove dependencies
npm uninstall awilix awilix-modular

# Or if using bun
bun remove awilix awilix-modular
```

### 6.2 Clean Up Import Statements

**Search and replace** (57 occurrences):

```typescript
// Remove these imports
import { createStaticModule } from "awilix-modular";
import { Lifetime } from "awilix";
import type { AwilixContainer } from "awilix";
import { asClass, asValue } from "awilix";
```

### 6.3 Delete Deprecated Files

| File                                         | Reason                           |
| -------------------------------------------- | -------------------------------- |
| `packages/frameworks/src/di/container.ts`    | Never existed (stub in index.ts) |
| `packages/frameworks/src/di/types-awilix.ts` | Create if exists                 |
| `packages/adapters/src/modules/*.ts`         | All module files                 |

---

## Risk Mitigation

### 6.4 Rollback Strategy

If critical issues arise during migration:

1. **Git Revert**: All changes are in version control
2. **Feature Flags**: Keep both DI systems during transition (already in place)
3. **Staged Rollout**: Migrate resolvers one at a time, not all at once

### 6.5 Testing Strategy

| Phase   | Tests Required                                 |
| ------- | ---------------------------------------------- |
| Phase 2 | Unit tests for controller factory              |
| Phase 3 | Resolver integration tests (existing coverage) |
| Phase 4 | Full test suite run after each module deletion |
| Phase 5 | All test files must pass                       |
| Phase 6 | E2E tests, performance benchmarks              |

---

## Expected Outcomes

### Code Reduction

| Metric               | Before | After | Reduction |
| -------------------- | ------ | ----- | --------- |
| DI-related LOC       | ~2,500 | ~500  | 80%       |
| Module files         | 5      | 0     | 100%      |
| Package dependencies | 2      | 0     | 100%      |
| Import statements    | 57     | 0     | 100%      |

### Performance Improvements

- **Startup time**: ~50ms faster (no container initialization)
- **Request latency**: ~2-5ms per request (no container resolution)
- **Memory usage**: Slightly lower (no container objects)

### Developer Experience

- **Single mental model**: Effect only (no context switching)
- **Compile-time safety**: No runtime container errors
- **Simpler testing**: Direct Layer composition
- **Less documentation**: Remove dual-DI documentation

---

## Appendix A: Migration Task Tracking

```yaml
# .specs/tasks/in-progress/awilix-to-effect-migration.yaml
title: "Migrate from awilix to Effect DI"
description: |
  Complete migration of dependency injection from awilix-modular
  to pure Effect Layers. See migration-plan.md for full details.

phases:
  - name: "Phase 1 - Audit"
    status: "in-progress"
    tasks:
      - id: "1.1"
        description: "Audit current awilix usage"
        status: "completed"
      - id: "1.2"
        description: "Document dependency graph"
        status: "pending"

  - name: "Phase 2 - Infrastructure"
    status: "pending"
    tasks:
      - id: "2.1"
        description: "Create controller factory"
        status: "pending"
      - id: "2.2"
        description: "Update GraphQL context"
        status: "pending"
      - id: "2.3"
        description: "Create resolver helpers"
        status: "pending"

  - name: "Phase 3 - Resolvers"
    status: "pending"
    tasks:
      - id: "3.1"
        description: "Migrate User resolver"
        status: "pending"
      - id: "3.2"
        description: "Migrate Trip resolver"
        status: "pending"
      # ... etc

  - name: "Phase 4 - Cleanup"
    status: "pending"
    tasks:
      - id: "4.1"
        description: "Delete ControllerModule"
        status: "pending"
      - id: "4.2"
        description: "Delete RepositoryModule"
        status: "pending"
      # ... etc

  - name: "Phase 5 - Tests"
    status: "pending"
    tasks:
      - id: "5.1"
        description: "Update test utilities"
        status: "pending"
      - id: "5.2"
        description: "Migrate test files"
        status: "pending"

  - name: "Phase 6 - Final"
    status: "pending"
    tasks:
      - id: "6.1"
        description: "Remove awilix dependencies"
        status: "pending"
      - id: "6.2"
        description: "Update documentation"
        status: "pending"
      - id: "6.3"
        description: "Final verification"
        status: "pending"
```

---

## Appendix B: Reference Code

### B.1 Controller Factory (Full Implementation)

```typescript
// packages/adapters/src/controllers/factory.ts
import type { Layer } from "effect";
import { UserController } from "./user";
import { TripController } from "./trip";
import { ChallengeController } from "./challenge";
import { GroupController } from "./group";
import { NotificationController } from "./notification";
import { ActivityFeedController } from "./activity-feed";
import { ChallengeSubmissionController } from "./challenge-submission";
import { ChallengeVoteController } from "./challenge-vote";
import { LocationController } from "./location";
import { RewardController } from "./reward";
import { SponsorController } from "./sponsor";
import { SubmissionReportController } from "./submission-report";
import { NotificationScheduleController } from "./notification-schedule";
import { NotificationDeliveryController } from "./notification-delivery";
import { CoinController } from "./coin";
import { CoinTransactionController } from "./coin-transaction";
import { StorageController } from "./storage";

export interface Controllers {
  userController: UserController;
  tripController: TripController;
  challengeController: ChallengeController;
  groupController: GroupController;
  locationController: LocationController;
  notificationController: NotificationController;
  activityFeedController: ActivityFeedController;
  challengeSubmissionController: ChallengeSubmissionController;
  challengeVoteController: ChallengeVoteController;
  rewardController: RewardController;
  sponsorController: SponsorController;
  submissionReportController: SubmissionReportController;
  notificationScheduleController: NotificationScheduleController;
  notificationDeliveryController: NotificationDeliveryController;
  coinController: CoinController;
  coinTransactionController: CoinTransactionController;
  storageController: StorageController;
}

export function createControllers(appLayer: Layer.Layer<unknown>): Controllers {
  return {
    userController: new UserController(appLayer),
    tripController: new TripController(appLayer),
    challengeController: new ChallengeController(appLayer),
    groupController: new GroupController(appLayer),
    locationController: new LocationController(appLayer),
    notificationController: new NotificationController(appLayer),
    activityFeedController: new ActivityFeedController(appLayer),
    challengeSubmissionController: new ChallengeSubmissionController(appLayer),
    challengeVoteController: new ChallengeVoteController(appLayer),
    rewardController: new RewardController(appLayer),
    sponsorController: new SponsorController(appLayer),
    submissionReportController: new SubmissionReportController(appLayer),
    notificationScheduleController: new NotificationScheduleController(
      appLayer,
    ),
    notificationDeliveryController: new NotificationDeliveryController(
      appLayer,
    ),
    coinController: new CoinController(appLayer),
    coinTransactionController: new CoinTransactionController(appLayer),
    storageController: new StorageController(appLayer),
  };
}
```

### B.2 Updated GraphQL Context (Full)

```typescript
// apps/backend-server/src/graphql/context.ts
import type { Context as HonoContext } from "hono";
import type { Layer } from "effect";
import type { AuthContext } from "@mirai-app/domain";
import { Effect, Runtime } from "effect";
import type { Runtime as EffectRuntime } from "effect";
import {
  authenticateUserUseCase,
  AuthPortTag,
  type AuthPort,
} from "@mirai-app/use-cases";
import {
  TokenExtractor,
  createControllers,
  type Controllers,
} from "@mirai-app/adapters";

export type GraphQLRuntime = EffectRuntime<never>;

export interface GraphQLContext {
  appLayer: Layer.Layer<unknown>;
  request: Request;
  authContext?: AuthContext;
  runtime: GraphQLRuntime;
  controllers: Controllers; // <-- NEW
}

export function createContextFactory(): (
  honoContext: HonoContext,
) => Promise<GraphQLContext> {
  return async (honoContext: HonoContext): Promise<GraphQLContext> => {
    const appLayer = honoContext.get("appLayer") as Layer.Layer<unknown>;
    if (!appLayer) {
      throw new Error("AppLayer not found in Hono context");
    }

    // Create controllers directly with AppLayer
    const controllers = createControllers(appLayer);

    // Extract auth token and resolve auth context
    const authHeader =
      honoContext.req.header("authorization") ??
      honoContext.req.header("Authorization");
    const token = TokenExtractor.extract(authHeader);

    let authContext: AuthContext | undefined;

    if (token) {
      try {
        const authEffect = authenticateUserUseCase({ token }).pipe(
          Effect.provide(appLayer),
        );
        const authEither = await Effect.runPromise(Effect.either(authEffect));

        if (authEither._tag === "Right") {
          authContext = {
            userId: authEither.right.userId,
            role: authEither.right.role as AuthContext["role"],
            authenticatedAt: authEither.right.authenticatedAt,
            sessionId: authEither.right.sessionId,
          };
        }
      } catch {
        authContext = undefined;
      }
    }

    return {
      appLayer,
      request: honoContext.req.raw,
      runtime: Runtime.defaultRuntime,
      controllers,
      ...(authContext ? { authContext } : {}),
    };
  };
}
```

### B.3 Migrated Resolver Example (User.ts)

```typescript
// apps/backend-server/src/graphql/resolvers/User.ts (partial)
builder.queryField("user", (t) =>
  t.field({
    description: "Get a user by their unique ID",
    type: "User",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "User ID to fetch",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context): Promise<GetUserOutput | null> => {
      await requireAuth(context);

      // Direct controller access - no container resolution
      const controller = context.controllers.userController;
      const result = await controller.getById({ id: args.id });

      if (result.success === false) {
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);
```

---

## Summary

This migration plan provides a complete roadmap for eliminating awilix-modular from the codebase. The migration:

1. **Preserves existing architecture** - Controllers already use Effect Layers
2. **Maintains test coverage** - Tests migrate to pure Layer-based approach
3. **Is incremental** - Can be done in small batches (resolver by resolver)
4. **Reduces complexity** - Single DI system instead of dual systems
5. **Improves type safety** - Compile-time guarantees instead of runtime resolution

**Next Step**: Begin with Phase 1 audit completion, then proceed to Phase 2 infrastructure creation.

---

_Document Version: 1.0_  
_Last Updated: 2026-04-15_
