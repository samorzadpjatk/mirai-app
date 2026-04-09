# Router Migration Template (awilix-modular DI)

> **Template for migrating tRPC routers to use awilix-modular dependency injection**
>
> Based on pilot migrations: User Router, Challenge Router, Trip Router

## Overview

This template provides step-by-step instructions for migrating existing tRPC routers from manual dependency instantiation to container-based dependency injection using awilix-modular.

## Migration Checklist

- [ ] Verify Controller is registered in ControllerModule
- [ ] Verify Repository injection is configured
- [ ] Update tRPC controller wrapper to use `ctx.di.resolve()`
- [ ] Remove manual repository/controller instantiation
- [ ] Update tests with DI context mocking
- [ ] Run all tests to verify migration
- [ ] Document any domain-specific handling

---

## Step-by-Step Migration Guide

### Step 1: Verify Controller Registration

Before migrating a router, ensure the controller is properly registered in `ControllerModule.ts`:

```typescript
// packages/adapters/src/modules/ControllerModule.ts

// 1. Import the controller
import { TripController } from "../controllers/trip-controller";

// 2. Add token to CONTROLLER_TOKENS
export const CONTROLLER_TOKENS = {
  // ... other tokens
  TripController: "tripController",
};

// 3. Add to ControllerModuleDeps interface
export interface ControllerModuleDeps {
  // ... other dependencies
  [CONTROLLER_TOKENS.TripController]: TripController;
  tripRepository: TripRepository; // Required dependency
}

// 4. Create factory function
function createTripController(cradle: Cradle): TripController {
  return new TripController(cradle.tripRepository);
}

// 5. Register in ControllerModule
export const ControllerModule: StaticModule<ControllerModuleDef> =
  createStaticModule<ControllerModuleDef>({
    name: "ControllerModule",
    providers: {
      [CONTROLLER_TOKENS.TripController]: {
        factory: createTripController,
        lifetime: Lifetime.SCOPED,
      },
      // ... other providers
    },
    exports: [
      CONTROLLER_TOKENS.TripController,
      // ... other exports
    ],
  });
```

### Step 2: Verify RepositoryModule Configuration

Ensure the repository is registered in `RepositoryModule.ts`:

```typescript
// packages/adapters/src/modules/RepositoryModule.ts

// Repository should already be registered:
// - Token: "tripRepository"
// - Class: PrismaTripRepository
// - Lifetime: SINGLETON
```

### Step 3: Migrate tRPC Controller Wrapper

Update the tRPC controller wrapper in `packages/adapters/src/api/controllers/index.ts`:

#### Before (Manual Instantiation)

```typescript
export const tripController = {
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Manual instantiation - OLD PATTERN
      const repo = new PrismaTripRepository(ctx.db);
      const controller = new TripController(repo);
      const result = await controller.getById({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
```

#### After (DI Pattern)

```typescript
export const tripController = {
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Using DI container - NEW PATTERN
      const controller = ctx.di.resolve<TripController>("tripController");
      const result = await controller.getById({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
```

### Step 4: Update Tests

Update router tests to include DI context mocking:

#### Before

```typescript
beforeEach(() => {
  mockCtx = {
    db: createMockDb(),
    supabase: createMockSupabase(),
    headers: new Headers(),
    accessToken: "test-token",
    dbUser: {
      /* ... */
    },
    // No DI context
  };
});
```

#### After

```typescript
beforeEach(() => {
  mockCtx = {
    db: createMockDb(),
    supabase: createMockSupabase(),
    headers: new Headers(),
    accessToken: "test-token",
    dbUser: {
      /* ... */
    },
    // Mock DI context
    di: {
      container: {} as any,
      resolve: <T>(token: string): T => {
        if (token === "tripController") {
          return {
            getById: mock(({ id }: { id: string }) => {
              if (id === "nonexistent") {
                return Promise.resolve({
                  success: false,
                  error: "Trip not found",
                });
              }
              return Promise.resolve({
                success: true,
                data: {
                  /* trip data */
                },
              });
            }),
            // ... other methods
          } as unknown as T;
        }
        throw new Error(`Unknown token: ${token}`);
      },
      scope: {
        requestId: "test-request-id",
        dispose: () => Promise.resolve(),
        container: {} as any,
      },
    },
  };
});
```

---

## Boilerplate Comparison: Before vs After

### Lines of Code Comparison

| Router           | Before (Manual) | After (DI) | Reduction |
| ---------------- | --------------- | ---------- | --------- |
| User Router      | 18 lines        | 16 lines   | 11%       |
| Challenge Router | 16 lines        | 16 lines   | 0%\*      |
| Trip Router      | 16 lines        | 16 lines   | 0%\*      |

\*Router files remain the same size because they delegate to controllers. The savings are in the controller wrappers.

### Controller Wrapper Comparison

| Aspect                   | Manual Pattern                  | DI Pattern                                   |
| ------------------------ | ------------------------------- | -------------------------------------------- |
| Repository Import        | Required                        | Not needed in wrapper                        |
| Repository Instantiation | `new PrismaXRepository(ctx.db)` | Removed                                      |
| Controller Instantiation | `new XController(repo)`         | `ctx.di.resolve<XController>("xController")` |
| Lines per endpoint       | 2 lines (repo + controller)     | 1 line (resolve)                             |
| Testability              | Manual mocking                  | Container-based mocking                      |

---

## Pattern Consistency Across Pilots

### Common Patterns (All 3 Routers)

1. **DI Resolution**: All use `ctx.di.resolve<Controller>("controllerName")`
2. **Error Handling**: All follow same pattern: check `result.success`, throw TRPCError
3. **Lifetime**: All controllers use `Lifetime.SCOPED`
4. **Test Mocking**: All tests use `mockCtx.di.resolve` pattern

### Differences by Domain

| Aspect           | User          | Challenge              | Trip                    |
| ---------------- | ------------- | ---------------------- | ----------------------- |
| Complexity       | Simple (CRUD) | Medium (state machine) | Simple (CRUD + status)  |
| Dependencies     | 1 repo        | 1 repo                 | 1 repo                  |
| Special Handling | None          | Status transitions     | Participant filtering\* |
| Use Cases        | 3 use cases   | 4 use cases            | Direct repository       |

\*Note: Trip controller has participant filtering in the tRPC wrapper layer, which remains unchanged with DI.

---

## Handling Domain-Specific Cases

### Case 1: Repositories with Complex Dependencies

Some repositories require additional dependencies beyond PrismaClient:

```typescript
// Example: RewardController with multiple dependencies
function createRewardController(cradle: Cradle): RewardController {
  return new RewardController(
    cradle.rewardRepository,
    cradle.rewardPurchaseRepository,
    cradle.tripPointsCalculator,
    cradle.groupCoinsService,
    cradle.tripAccessChecker,
  );
}
```

### Case 2: Controllers Using Use Cases

Controllers that depend on use cases instead of repositories directly:

```typescript
// Example: NotificationDeliveryController
function createNotificationDeliveryController(
  cradle: Cradle,
): NotificationDeliveryController {
  return new NotificationDeliveryController(
    cradle.getDeliveriesUseCase,
    cradle.getDeliveryByNotificationIdUseCase,
    cradle.getDeliveryStatsUseCase,
    cradle.getFailedDeliveriesUseCase,
  );
}
```

### Case 3: Geospatial Operations

For controllers with geospatial operations (LocationController):

```typescript
// LocationRepository is already registered
// No special handling needed - geospatial operations are in the repository
function createLocationController(cradle: Cradle): LocationController {
  return new LocationController(cradle.locationRepository);
}
```

---

## Testing Patterns

### Basic Test Structure

```typescript
describe("[INTEGRATION] example router", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        /* ... */
      },
      di: {
        container: {} as any,
        resolve: <T>(token: string): T => {
          if (token === "exampleController") {
            return {
              getById: mock(({ id }: { id: string }) => {
                if (id === "nonexistent") {
                  return Promise.resolve({
                    success: false,
                    error: "Not found",
                  });
                }
                return Promise.resolve({
                  success: true,
                  data: { id /* ... */ },
                });
              }),
            } as unknown as T;
          }
          throw new Error(`Unknown token: ${token}`);
        },
        scope: {
          requestId: "test-request-id",
          dispose: () => Promise.resolve(),
          container: {} as any,
        },
      },
    };
  });

  test("returns data via DI", async () => {
    setupAuthMocks();
    const caller = createCaller(mockCtx);
    const result = await caller.example.getById({ id: "example-1" });
    expect(result.id).toBe("example-1");
  });

  test("throws NOT_FOUND when not exists", async () => {
    setupAuthMocks();
    const caller = createCaller(mockCtx);
    await expect(caller.example.getById({ id: "nonexistent" })).rejects.toThrow(
      TRPCError,
    );
  });
});
```

### Testing DI Resolution

```typescript
test("DI resolve is called with correct token", async () => {
  setupAuthMocks();
  const resolveSpy = mock((token: string) => {
    // Return mock controller
    return {
      getById: mock(() =>
        Promise.resolve({
          success: true,
          data: { id: "test" /* ... */ },
        }),
      ),
    };
  });
  mockCtx.di.resolve = resolveSpy;
  const caller = createCaller(mockCtx);
  await caller.example.getById({ id: "test" });
  expect(resolveSpy).toHaveBeenCalledWith("exampleController");
});
```

---

## Migration Order for Remaining 14 Routers

### Priority 1: Simple Controllers (1 repository)

1. `groupRouter` - GroupController (groupRepository)
2. `notificationRouter` - NotificationController (notificationRepository)
3. `sponsorRouter` - SponsorController (sponsorRepository)
4. `storageRouter` - StorageController (supabase only)

### Priority 2: Medium Complexity (2-3 repositories)

5. `challengeSubmissionRouter` - ChallengeSubmissionController
6. `locationRouter` - LocationController (locationRepository)
7. `coinRouter` - CoinController (use cases)
8. `coinTransactionRouter` - CoinTransactionController

### Priority 3: High Complexity (4+ repositories/use cases)

9. `activityFeedRouter` - ActivityFeedController
10. `challengeVoteRouter` - ChallengeVoteController
11. `rewardRouter` - RewardController
12. `submissionReportRouter` - SubmissionReportController
13. `notificationScheduleRouter` - NotificationScheduleController
14. `notificationDeliveryRouter` - NotificationDeliveryController

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Update Tests

**Problem**: Tests fail with "Cannot read property 'resolve' of undefined"

**Solution**: Add `di` mock to test context:

```typescript
di: {
  container: {} as any,
  resolve: <T>(token: string): T => { /* ... */ },
  scope: { /* ... */ },
}
```

### Pitfall 2: Wrong Token Name

**Problem**: "Unknown token: XController" error

**Solution**: Verify token matches CONTROLLER_TOKENS:

```typescript
// Check token case sensitivity
ctx.di.resolve<TripController>("tripController"); // ✓ Correct
ctx.di.resolve<TripController>("TripController"); // ✗ Wrong case
```

### Pitfall 3: Repository Not Registered

**Problem**: Controller fails to resolve with missing dependency error

**Solution**: Verify repository is registered in RepositoryModule:

```typescript
// RepositoryModule.ts
providers: {
  tripRepository: {
    factory: createTripRepository,
    lifetime: Lifetime.SINGLETON,
  },
}
```

### Pitfall 4: Type Errors in Tests

**Problem**: TypeScript errors in test mocks

**Solution**: Use `as unknown as T` pattern:

```typescript
return {
  getById: mock(() =>
    Promise.resolve({
      /* ... */
    }),
  ),
} as unknown as T;
```

---

## Quick Reference

### Token Names

| Controller          | Token                 | Import Path                              |
| ------------------- | --------------------- | ---------------------------------------- |
| UserController      | `userController`      | `../../controllers/user-controller`      |
| TripController      | `tripController`      | `../../controllers/trip-controller`      |
| ChallengeController | `challengeController` | `../../controllers/challenge-controller` |
| GroupController     | `groupController`     | `../../controllers/group-controller`     |
| LocationController  | `locationController`  | `../../controllers/location-controller`  |

### Lifetime Guidelines

| Component    | Lifetime            | Rationale                      |
| ------------ | ------------------- | ------------------------------ |
| Repositories | SINGLETON           | Stateless, expensive to create |
| Use Cases    | SCOPED              | Request-scoped business logic  |
| Controllers  | SCOPED              | Per-request handling           |
| Services     | SINGLETON or SCOPED | Depends on state requirements  |

---

## Success Criteria

Before marking a router migration complete, verify:

- [ ] All endpoints use `ctx.di.resolve()` pattern
- [ ] No manual repository instantiation in tRPC wrapper
- [ ] Controller properly registered in ControllerModule
- [ ] Repository properly registered in RepositoryModule
- [ ] All existing tests pass
- [ ] New tests verify DI resolution
- [ ] No TypeScript compilation errors
- [ ] No dependency-cruiser violations

---

## Additional Resources

- [ControllerModule.ts](../packages/adapters/src/modules/ControllerModule.ts)
- [RepositoryModule.ts](../packages/adapters/src/modules/RepositoryModule.ts)
- [DI Setup Guide](../packages/frameworks/src/di/README.md)
- [User Router Example](../packages/adapters/src/api/controllers/index.ts) (lines 75-93)
- [Trip Router Example](../packages/adapters/src/api/controllers/index.ts) (lines 586-744)

---

**Template Version**: 1.0
**Last Updated**: 2026-04-09
**Based On**: User, Challenge, Trip Router migrations (Steps 10, 11, 12)
