# Hands-On Exercise: Dependency Injection Migration

> **Practice implementing awilix-modular DI patterns**
> Time: 30-45 minutes | Difficulty: Intermediate

---

## Exercise Overview

### Goal

Migrate a simple tRPC router from manual instantiation to container-based DI. By the end of this exercise, you'll have hands-on experience with:

1. Creating a repository registration
2. Setting up a controller with DI
3. Migrating a router to use container resolution
4. Testing with the DI container

### Prerequisites

- [ ] Mirai App codebase cloned and `bun install` complete
- [ ] [DI Cheat Sheet](./di-cheat-sheet.md) reviewed
- [ ] [DI Training Session](./di-training-session.md) attended or video watched
- [ ] Tests pass: `bun test` baseline green

### Exercise Structure

```
Exercise: Migrate Location Router to DI
├── Part 1: Repository Registration (10 min)
├── Part 2: Controller Setup (10 min)
├── Part 3: Router Migration (10 min)
├── Part 4: Testing (10 min)
└── Bonus: Add New Use Case (Optional, 15 min)
```

---

## Part 1: Repository Registration (10 minutes)

### Task

Register `PrismaLocationRepository` in the DI container.

### Current State

The repository exists but is NOT registered in DI:

```typescript
// packages/adapters/src/gateways/PrismaLocationRepository.ts
export class PrismaLocationRepository extends BasePrismaRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Location | null> { ... }
  async findByTripId(tripId: string): Promise<Location[]> { ... }
  async create(location: Location): Promise<Location> { ... }
}
```

### Steps to Complete

1. **Add Token to REPOSITORY_TOKENS** (`packages/adapters/src/modules/RepositoryModule.ts`):

```typescript
export const REPOSITORY_TOKENS = {
  // ... existing tokens
  LocationRepository: "locationRepository", // ADD THIS
} as const;
```

2. **Add Provider to RepositoryModule**:

```typescript
export const RepositoryModule = createStaticModule({
  providers: {
    // ... existing providers
    [REPOSITORY_TOKENS.LocationRepository]: {
      factory: (cradle) => new PrismaLocationRepository(cradle.prisma),
      lifetime: Lifetime.SINGLETON,
    },
  },
  exports: [
    // ... existing exports
    REPOSITORY_TOKENS.LocationRepository, // ADD THIS
  ],
});
```

3. **Update RepositoryModuleDeps Interface**:

```typescript
export interface RepositoryModuleDeps {
  // ... existing deps
  [REPOSITORY_TOKENS.LocationRepository]: LocationRepository;
}
```

4. **Add Re-export**:

```typescript
export { PrismaLocationRepository } from "../gateways/PrismaLocationRepository";
```

### Verification

Create a quick test file to verify registration works:

```typescript
// packages/adapters/src/modules/__tests__/repository-di.test.ts
import { describe, it, expect } from "bun:test";
import { createContainer, asValue } from "awilix";
import { RepositoryModule, REPOSITORY_TOKENS } from "../RepositoryModule";

describe("Repository DI Registration", () => {
  it("should resolve LocationRepository", () => {
    const container = createContainer();

    // Register prisma mock
    container.register({
      prisma: asValue({} as any), // Mock PrismaClient
    });

    // Register RepositoryModule providers (manual for test)
    container.register({
      locationRepository:
        RepositoryModule.providers![REPOSITORY_TOKENS.LocationRepository],
    });

    const repo = container.resolve(REPOSITORY_TOKENS.LocationRepository);
    expect(repo).toBeDefined();
  });
});
```

Run the test:

```bash
cd packages/adapters && bun test src/modules/__tests__/repository-di.test.ts
```

### Checklist

- [ ] Token added to REPOSITORY_TOKENS
- [ ] Provider added to RepositoryModule providers
- [ ] Token added to exports array
- [ ] RepositoryModuleDeps interface updated
- [ ] Re-export added at bottom of file
- [ ] Test passes

---

## Part 2: Controller Setup (10 minutes)

### Task

Set up `LocationController` with DI for use case injection.

### Current State

Controller exists but doesn't use DI:

```typescript
// packages/adapters/src/controllers/location-controller.ts
export class LocationController {
  constructor(
    private getLocationUseCase: GetLocationUseCase,
    private createLocationUseCase: CreateLocationUseCase,
  ) {}

  async getById(id: string) {
    return this.getLocationUseCase.execute({ id });
  }

  async create(input: CreateLocationInput) {
    return this.createLocationUseCase.execute(input);
  }
}
```

### Steps to Complete

1. **Verify Use Cases Are Registered** (check `UseCaseModule.ts`):

Ensure these exist:

- `GetLocationUseCase`
- `CreateLocationUseCase`

If not, you need to register them (similar to repository pattern).

2. **Add Controller to ControllerModule** (`packages/adapters/src/modules/ControllerModule.ts`):

```typescript
// 1. Add token
export const CONTROLLER_TOKENS = {
  // ... existing tokens
  LocationController: "locationController",
} as const;

// 2. Add to providers
export const ControllerModule = createStaticModule({
  name: "ControllerModule",
  imports: [UseCaseModule],
  providers: {
    // ... existing providers
    [CONTROLLER_TOKENS.LocationController]: {
      factory: (cradle) =>
        new LocationController(
          cradle.getLocationUseCase,
          cradle.createLocationUseCase,
        ),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: [
    // ... existing exports
    CONTROLLER_TOKENS.LocationController,
  ],
});

// 3. Add to interface
export interface ControllerModuleDeps {
  // ... existing deps
  [CONTROLLER_TOKENS.LocationController]: LocationController;
}

// 4. Re-export
export { LocationController } from "../controllers/location-controller";
```

### Verification

Create a container resolution test:

```typescript
// packages/adapters/src/modules/__tests__/controller-di.test.ts
describe("Controller DI Registration", () => {
  it("should resolve LocationController", () => {
    const container = createContainer();

    // Register dependencies
    container.register({
      getLocationUseCase: asValue({ execute: () => {} }),
      createLocationUseCase: asValue({ execute: () => {} }),
    });

    // Register controller
    container.register({
      locationController:
        ControllerModule.providers![CONTROLLER_TOKENS.LocationController],
    });

    const controller = container.resolve(CONTROLLER_TOKENS.LocationController);
    expect(controller).toBeInstanceOf(LocationController);
  });
});
```

### Checklist

- [ ] Controller token defined
- [ ] Provider registered with factory function
- [ ] Use cases injected from cradle
- [ ] SCOPED lifetime set
- [ ] Token exported
- [ ] Interface updated
- [ ] Re-export added
- [ ] Test passes

---

## Part 3: Router Migration (10 minutes)

### Task

Migrate `locationRouter` to use container-based DI.

### Current State

```typescript
// apps/backend-server/src/routers/location.ts
export const locationRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaLocationRepository(ctx.db);
      const useCase = new GetLocationUseCase(repo);
      const controller = new LocationController(useCase, null as any);
      return controller.getById(input.id);
    }),

  create: protectedProcedure
    .input(CreateLocationInput.schema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaLocationRepository(ctx.db);
      const createUseCase = new CreateLocationUseCase(repo);
      const getUseCase = new GetLocationUseCase(repo);
      const controller = new LocationController(getUseCase, createUseCase);
      return controller.create(input);
    }),
});
```

### Steps to Complete

1. **Remove Manual Instantiation**:

```typescript
export const locationRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // BEFORE:
      // const repo = new PrismaLocationRepository(ctx.db);
      // const useCase = new GetLocationUseCase(repo);
      // const controller = new LocationController(useCase, null as any);

      // AFTER:
      const controller = ctx.container.resolve("locationController");
      return controller.getById(input.id);
    }),

  create: protectedProcedure
    .input(CreateLocationInput.schema)
    .mutation(async ({ ctx, input }) => {
      // BEFORE:
      // const repo = new PrismaLocationRepository(ctx.db);
      // const createUseCase = new CreateLocationUseCase(repo);
      // const getUseCase = new GetLocationUseCase(repo);
      // const controller = new LocationController(getUseCase, createUseCase);

      // AFTER:
      const controller = ctx.container.resolve("locationController");
      return controller.create(input);
    }),
});
```

2. **Import CONTROLLER_TOKENS** (optional, for type safety):

```typescript
import { CONTROLLER_TOKENS } from "@mirai-app/adapters/modules";

// Then use:
const controller = ctx.container.resolve(CONTROLLER_TOKENS.LocationController);
```

### Verification

Run existing router tests:

```bash
cd apps/backend-server && bun test src/routers/location.test.ts
```

All tests should pass.

### Line Count Comparison

| Procedure | Before      | After       | Reduction |
| --------- | ----------- | ----------- | --------- |
| `getById` | 4 lines     | 1 line      | 75%       |
| `create`  | 5 lines     | 1 line      | 80%       |
| **Total** | **9 lines** | **2 lines** | **78%**   |

### Checklist

- [ ] Manual instantiation removed from getById
- [ ] Manual instantiation removed from create
- [ ] Container resolution added
- [ ] Router tests pass
- [ ] Line count documented

---

## Part 4: Testing with DI (10 minutes)

### Task

Write a test using the DI container with mock repository.

### Setup

Create a test helper for Location module:

```typescript
// packages/adapters/src/gateways/__mocks__/InMemoryLocationRepository.ts
import type { LocationRepository } from "@mirai-app/use-cases/ports";
import type { Location } from "@mirai-app/domain/entities";

export class InMemoryLocationRepository implements LocationRepository {
  private locations: Location[] = [];

  async seed(location: Location): Promise<void> {
    this.locations.push(location);
  }

  async findById(id: string): Promise<Location | null> {
    return this.locations.find((l) => l.id === id) || null;
  }

  async findByTripId(tripId: string): Promise<Location[]> {
    return this.locations.filter((l) => l.tripId === tripId);
  }

  async create(location: Location): Promise<Location> {
    this.locations.push(location);
    return location;
  }
}
```

### Test Implementation

```typescript
// packages/use-cases/src/interactors/__tests__/GetLocationUseCase.di.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { createContainer, asClass } from "awilix";
import { InMemoryLocationRepository } from "@mirai-app/adapters/gateways/__mocks__/InMemoryLocationRepository";
import { GetLocationUseCase } from "../GetLocationUseCase";
import { Location } from "@mirai-app/domain/entities";

describe("GetLocationUseCase with DI", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createContainer();

    // Register mock repository
    container.register({
      locationRepository: asClass(InMemoryLocationRepository).singleton(),
    });
  });

  it("should get location by id", async () => {
    // Seed data through mock
    const mockRepo =
      container.resolve<InMemoryLocationRepository>("locationRepository");
    await mockRepo.seed(
      new Location({
        id: "loc-123",
        name: "Test Location",
        tripId: "trip-456",
      }),
    );

    // Resolve use case with auto-injected dependencies
    const useCase = container.resolve(GetLocationUseCase);
    const result = await useCase.execute({ id: "loc-123" });

    expect(result.isSuccess()).toBe(true);
    expect(result.value?.name).toBe("Test Location");
  });

  it("should return error when location not found", async () => {
    const useCase = container.resolve(GetLocationUseCase);
    const result = await useCase.execute({ id: "non-existent" });

    expect(result.isError()).toBe(true);
    expect(result.error).toBe("Location not found");
  });
});
```

### Run Tests

```bash
cd packages/use-cases && bun test src/interactors/__tests__/GetLocationUseCase.di.test.ts
```

### Checklist

- [ ] InMemoryLocationRepository created
- [ ] Test container setup in beforeEach
- [ ] Mock repository registered
- [ ] Use case resolved from container
- [ ] Mock data seeded
- [ ] Tests pass

---

## Bonus: Add New Use Case (Optional, 15 minutes)

### Task

Create and register a new `UpdateLocationUseCase` with full DI.

### Steps

1. **Create the Use Case**:

```typescript
// packages/use-cases/src/interactors/UpdateLocationUseCase.ts
export class UpdateLocationUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(input: UpdateLocationInput): Promise<Result<Location, string>> {
    const existing = await this.locationRepository.findById(input.id);
    if (!existing) {
      return err("Location not found");
    }

    const updated = existing.update(input);
    const saved = await this.locationRepository.save(updated);

    return ok(saved);
  }
}
```

2. **Register in UseCaseModule** (follow existing pattern)

3. **Inject into LocationController**:

```typescript
export class LocationController {
  constructor(
    private getLocationUseCase: GetLocationUseCase,
    private createLocationUseCase: CreateLocationUseCase,
    private updateLocationUseCase: UpdateLocationUseCase, // NEW
  ) {}

  async update(input: UpdateLocationInput) {
    return this.updateLocationUseCase.execute(input);
  }
}
```

4. **Update ControllerModule** to inject new use case

5. **Add router endpoint**:

```typescript
update: protectedProcedure
  .input(UpdateLocationInput.schema)
  .mutation(async ({ ctx, input }) => {
    const controller = ctx.container.resolve("locationController");
    return controller.update(input);
  }),
```

### Verification

- [ ] Use case created
- [ ] Registered in UseCaseModule
- [ ] Injected into controller
- [ ] ControllerModule updated
- [ ] Router endpoint added
- [ ] Tests pass

---

## Exercise Completion Checklist

### Core Requirements

- [ ] Part 1: Repository registered and test passes
- [ ] Part 2: Controller registered and test passes
- [ ] Part 3: Router migrated and tests pass
- [ ] Part 4: DI-based test created and passes

### Code Quality

- [ ] No TypeScript errors (`bunx tsc --noEmit`)
- [ ] No dependency-cruiser violations (`bunx dependency-cruiser --validate .`)
- [ ] All existing tests still pass (`bun test`)
- [ ] Code follows naming conventions (camelCase tokens)

### Documentation

- [ ] Line count reduction documented
- [ ] Any issues encountered noted
- [ ] Feedback on exercise clarity provided

---

## Troubleshooting Exercise Issues

### Issue 1: "Cannot find module"

**Solution:** Check import paths:

```typescript
// ✅ Correct
import { REPOSITORY_TOKENS } from "@mirai-app/adapters/modules";

// ❌ Might cause issues
import { REPOSITORY_TOKENS } from "../../../modules/RepositoryModule";
```

### Issue 2: "AwilixResolutionError"

**Solution:** Check exports and imports:

```typescript
// Ensure token is in exports
exports: [REPOSITORY_TOKENS.LocationRepository];

// Ensure parent module imports the module
imports: [RepositoryModule];
```

### Issue 3: Tests fail after migration

**Solution:**

1. Check that use cases still work with InMemoryRepository
2. Verify mock data is properly seeded
3. Ensure container is created fresh in beforeEach

---

## Submission

### What to Submit

1. **Branch name:** `exercise/di-migration-location`
2. **Commit message:** "Exercise: Migrate location router to DI"
3. **Pull Request:** Tag team lead for review

### PR Description Template

```markdown
## DI Migration Exercise: Location Router

### Changes

- Registered LocationRepository in RepositoryModule
- Set up LocationController with DI
- Migrated locationRouter to container resolution
- Added DI-based tests

### Metrics

- Line reduction: 78% (9 → 2 lines per procedure)
- Tests: All passing
- Time to complete: [Your time]

### Learnings

- [What you learned]
- [Any challenges faced]
- [Feedback on exercise]
```

---

## Next Steps

After completing this exercise:

1. **Review** your solution with the team lead
2. **Apply** the pattern to your current feature work
3. **Document** any additional patterns discovered
4. **Share** feedback on this exercise for improvement

---

## Resources

- [DI Cheat Sheet](./di-cheat-sheet.md) - Quick reference
- [DI FAQ](./di-faq.md) - Common questions answered
- [DI Training Session](./di-training-session.md) - Full session outline
- [DI Support Guide](./di-support-guide.md) - Getting help

---

_Last Updated: 2026-04-09 | Exercise Version 1.0_
