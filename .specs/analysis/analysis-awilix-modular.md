# Codebase Analysis: awilix-modular Implementation

**Task**: Implement dependency injection with awilix-modular  
**Phase**: 2b (Codebase Analysis)  
**Date**: 2026-04-09  
**Analyst**: sdd:code-explorer agent

---

## Executive Summary

The codebase currently uses **InversifyJS** for dependency injection with decorator-based registration (`@provide`, `@inject`). The migration to **awilix-modular** will replace Inversify's container system with Awilix's modular architecture while maintaining decorator compatibility where possible.

### Key Findings

- **16 repositories** already use DI decorators (need conversion)
- **17 controllers** currently instantiated manually in tRPC wrappers (main integration point)
- **73 use cases** already have Inversify decorators
- **19 tRPC routers** are thin delegators to controllers
- **Root challenge**: Request-scoped PrismaClient per tRPC request

### Risk Level: **MEDIUM-HIGH**

Rationale: While the codebase has DI foundations, the tRPC integration pattern (manual instantiation in controller wrappers) requires significant refactoring. The request-scoped container pattern with awilix-modular is powerful but introduces complexity for transaction management.

---

## 1. Current Repository Pattern Analysis

### Location

`packages/adapters/src/gateways/` (16 repositories)

### Pattern

```typescript
@provide(TYPES.UserRepository)
export class PrismaUserRepository extends BasePrismaRepository<...>
  implements UserRepository
{
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
    super(prisma, { model: prisma.user }, UserMapperAdapter);
  }
}
```

### Base Repository

`BasePrismaRepository.ts` provides generic CRUD and accepts `PrismaClient` via constructor.

### Repositories List

| Repository                           | File                                    | DI Status          |
| ------------------------------------ | --------------------------------------- | ------------------ |
| PrismaUserRepository                 | PrismaUserRepository.ts                 | @provide + @inject |
| PrismaChallengeRepository            | PrismaChallengeRepository.ts            | @provide + @inject |
| PrismaTripRepository                 | PrismaTripRepository.ts                 | @provide + @inject |
| PrismaGroupRepository                | PrismaGroupRepository.ts                | @provide + @inject |
| PrismaNotificationRepository         | PrismaNotificationRepository.ts         | @provide + @inject |
| PrismaActivityFeedRepository         | PrismaActivityFeedRepository.ts         | @provide + @inject |
| PrismaChallengeSubmissionRepository  | PrismaChallengeSubmissionRepository.ts  | @provide + @inject |
| PrismaChallengeVoteRepository        | PrismaChallengeVoteRepository.ts        | @provide + @inject |
| PrismaLocationRepository             | PrismaLocationRepository.ts             | @provide + @inject |
| PrismaRewardRepository               | PrismaRewardRepository.ts               | @provide + @inject |
| PrismaSponsorRepository              | PrismaSponsorRepository.ts              | @provide + @inject |
| PrismaSubmissionReportRepository     | PrismaSubmissionReportRepository.ts     | @provide + @inject |
| PrismaCoinTransactionRepository      | PrismaCoinTransactionRepository.ts      | @provide + @inject |
| PrismaNotificationDeliveryRepository | PrismaNotificationDeliveryRepository.ts | @provide + @inject |
| PrismaNotificationScheduleRepository | PrismaNotificationScheduleRepository.ts | @provide + @inject |
| BasePrismaRepository                 | BasePrismaRepository.ts                 | Base class         |

### Migration Notes

- All repositories already use constructor injection
- Need to replace `@provide(TYPES.X)` with awilix-modular module registration
- Keep `@inject(TYPES.PrismaClient)` pattern or switch to awilix `deps` type

---

## 2. Current Controller Pattern Analysis

### Location

`packages/adapters/src/controllers/` (17 controllers)

### Pattern

```typescript
export class UserController {
  constructor(private userRepository: UserRepository) {}
  // Methods return ControllerResult types
}
```

### Controllers List

| Controller                     | Dependencies                               | DI Status     |
| ------------------------------ | ------------------------------------------ | ------------- |
| UserController                 | UserRepository                             | No decorators |
| ChallengeController            | ChallengeRepository                        | No decorators |
| TripController                 | TripRepository                             | No decorators |
| GroupController                | GroupRepository                            | No decorators |
| NotificationController         | NotificationRepository                     | No decorators |
| ActivityFeedController         | ActivityFeedRepository                     | No decorators |
| ChallengeSubmissionController  | ChallengeSubmissionRepository              | No decorators |
| ChallengeVoteController        | ChallengeVoteRepository                    | No decorators |
| LocationController             | LocationRepository                         | No decorators |
| RewardController               | RewardRepository, RewardPurchaseRepository | No decorators |
| NotificationScheduleController | NotificationScheduleRepository             | No decorators |
| NotificationDeliveryController | NotificationDeliveryRepository             | No decorators |
| CoinController                 | CoinService                                | No decorators |
| CoinTransactionController      | CoinTransactionRepository                  | No decorators |
| StorageController              | SupabaseClient                             | No decorators |
| SponsorController              | SponsorRepository                          | No decorators |
| SubmissionReportController     | SubmissionReportRepository                 | No decorators |

### Migration Notes

- Controllers currently receive dependencies via constructor (DI-ready)
- Need to add DI registration to module definitions
- No decorators currently - clean slate for awilix-modular

---

## 3. Current Use Case Pattern Analysis

### Location

`packages/use-cases/src/interactors/` (73 use cases, 8 with tests)

### Pattern

```typescript
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
  ) {}
}
```

### Key Use Cases

| Use Case                | Repository Dependencies                                             | DI Status             |
| ----------------------- | ------------------------------------------------------------------- | --------------------- |
| CreateUserUseCase       | UserRepository                                                      | @injectable + @inject |
| GetUserUseCase          | UserRepository                                                      | @injectable + @inject |
| CreateChallengeUseCase  | ChallengeRepository                                                 | @injectable + @inject |
| CreateSubmissionUseCase | ChallengeSubmissionRepository, ChallengeRepository, GroupRepository | @injectable + @inject |
| AddCoinsUseCase         | GroupRepository, CoinTransactionRepository                          | @injectable + @inject |

### Migration Notes

- Use cases already fully decorated for Inversify
- Need to convert to awilix-modular module pattern
- May keep constructor pattern or switch to `ModuleDeps` type approach

---

## 4. tRPC Context Analysis

### Location

`packages/adapters/src/api/trpc.ts` (lines 124-176)

### Current TRPCContext Interface

```typescript
export interface TRPCContext {
  db: PrismaClient; // Per-request instance
  supabase: SupabaseClient; // Per-request instance
  headers: Headers;
  accessToken: string | null;
}
```

### Context Creation (server.ts lines 43-92)

```typescript
createContext: (opts: {
  req: FastifyRequest;
  connectionParams?: Record<string, string>;
}) => {
  const db = createDb(databaseUrl); // Fresh PrismaClient per request
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  return createTRPCContext({ headers, db, supabase, connectionParams });
};
```

### Awilix-Modular Integration Point

The context creation is the **primary integration point** for request-scoped containers:

```typescript
// New approach with awilix-modular
createContext: (opts) => {
  const requestContainer = createRequestContainer();
  requestContainer.register("headers", headers);
  requestContainer.register("accessToken", accessToken);

  return {
    container: requestContainer, // ADD: request-scoped container
    db: requestContainer.resolve<PrismaClient>("prismaClient"),
    supabase: requestContainer.resolve<SupabaseClient>("supabaseClient"),
    headers,
    accessToken,
  };
};
```

---

## 5. Router Analysis

### Location

`packages/adapters/src/api/routers/` (19 routers)

### Pattern

All routers are thin delegators:

```typescript
export const userRouter = createTRPCRouter({
  ...userController,
});
```

### Routers List

| Router                  | Controller Source                          | Lines |
| ----------------------- | ------------------------------------------ | ----- |
| user.ts                 | userController (from controllers/index.ts) | ~16   |
| coin.ts                 | coinController (from controllers/index.ts) | ~16   |
| coinTransaction.ts      | coinTransactionController                  | ~16   |
| notifications.ts        | notificationController                     | ~16   |
| notificationSchedule.ts | notificationScheduleController             | ~16   |
| notificationDelivery.ts | notificationDeliveryController             | ~16   |
| notificationSender.ts   | notificationSenderController               | ~16   |
| location.ts             | locationController                         | ~16   |
| trip.ts                 | tripController                             | ~16   |
| challenge.ts            | challengeController                        | ~16   |
| challengeSubmission.ts  | challengeSubmissionController              | ~16   |
| challengeVote.ts        | challengeVoteController                    | ~16   |
| submissionReport.ts     | submissionReportController                 | ~16   |
| storage.ts              | storageController                          | ~16   |
| reward.ts               | rewardController                           | ~16   |
| activityFeed.ts         | activityFeedController                     | ~16   |
| sponsor.ts              | sponsorController                          | ~16   |
| group.ts                | groupController                            | ~16   |

### Controller Wrapper Pattern (CRITICAL!)

The **actual** controller logic is in `packages/adapters/src/api/controllers/index.ts` (~1700 lines):

```typescript
export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaUserRepository(ctx.db); // MANUAL INSTANTIATION
      const controller = new UserController(repo); // MANUAL INSTANTIATION
      const result = await controller.getById({ id: input.id });
      // ...
    }),
};
```

This is the **primary file to refactor** for DI integration.

---

## 6. Files to Create (New Infrastructure)

### Module Definitions

| File                                                     | Purpose                            | Lines Est. |
| -------------------------------------------------------- | ---------------------------------- | ---------- |
| `packages/frameworks/src/di/modules/RepositoryModule.ts` | Registers all 16 repositories      | ~60        |
| `packages/frameworks/src/di/modules/ControllerModule.ts` | Registers all 17 controllers       | ~50        |
| `packages/frameworks/src/di/modules/UseCaseModule.ts`    | Registers all 73 use cases         | ~100       |
| `packages/frameworks/src/di/modules/ServiceModule.ts`    | Registers domain services          | ~40        |
| `packages/frameworks/src/di/AppModule.ts`                | Root module composing all          | ~30        |
| `packages/frameworks/src/di/context.ts`                  | DIContext initialization           | ~50        |
| `packages/frameworks/src/di/types-awilix.ts`             | Awilix-compatible type definitions | ~40        |

### New Exports

- `packages/frameworks/src/di/index.ts` - Update to export new APIs

---

## 7. Files to Modify (Existing)

### Critical Core Files (5 files)

| File                                      | Changes Required                        | Risk   |
| ----------------------------------------- | --------------------------------------- | ------ |
| `packages/frameworks/src/di/container.ts` | Replace Inversify Container with Awilix | High   |
| `packages/frameworks/src/di/index.ts`     | Update exports for new API              | Medium |
| `packages/frameworks/src/di/types.ts`     | Keep symbols or migrate to awilix keys  | Medium |
| `apps/backend-server/src/server.ts`       | Initialize DIContext in createContext   | High   |
| `packages/adapters/src/api/trpc.ts`       | Extend TRPCContext with container       | Medium |

### Controller Wrappers (1 major file)

| File                                             | Changes Required                                     | Risk         |
| ------------------------------------------------ | ---------------------------------------------------- | ------------ |
| `packages/adapters/src/api/controllers/index.ts` | Refactor 19 controller wrappers to use DI resolution | **Critical** |

### Controllers (17 files)

| File                                                        | Changes                                          |
| ----------------------------------------------------------- | ------------------------------------------------ |
| `packages/adapters/src/controllers/user-controller.ts`      | Add @injectable decorator or module registration |
| `packages/adapters/src/controllers/challenge-controller.ts` | Add @injectable decorator or module registration |
| `packages/adapters/src/controllers/trip-controller.ts`      | Add @injectable decorator or module registration |
| ... (14 more)                                               | Same pattern                                     |

### Repositories (16 files)

| File                                                          | Changes                               |
| ------------------------------------------------------------- | ------------------------------------- |
| `packages/adapters/src/gateways/PrismaUserRepository.ts`      | Remove @provide, keep @inject pattern |
| `packages/adapters/src/gateways/PrismaChallengeRepository.ts` | Remove @provide, keep @inject pattern |
| ... (14 more)                                                 | Same pattern                          |

### Use Cases (73 files)

Most use cases already have `@injectable()` - may only need minor updates for awilix-modular compatibility.

---

## 8. Files to Delete

| File                                                | Reason                               |
| --------------------------------------------------- | ------------------------------------ |
| `packages/frameworks/src/di/container.ts`           | Replaced by awilix-modular DIContext |
| `packages/frameworks/src/di/test-container.ts`      | Replaced by awilix test utilities    |
| `packages/adapters/src/utils/repository-factory.ts` | Replaced by DI container             |

---

## 9. Interface Documentation

### Current Container API (Inversify)

```typescript
export const container: Container;
export function initializeContainer(): void;
export function createChildContainer(parent?: Container): Container;
export function createTestContainer(): Container;
export function resetContainer(): void;
```

### New Container API (Awilix-modular)

```typescript
// Module definition
type RepositoryModuleDef = ModuleDef<{
  providers: {
    userRepository: UserRepository;
    // ... all repos
  };
  exportKeys: keyof RepositoryModuleDef["providers"];
}>;

export const RepositoryModule: StaticModule<RepositoryModuleDef>;
export type RepositoryModuleDeps = RepositoryModuleDef["deps"];

// Context creation
export interface DIContextConfig {
  framework: FastifyInstance;
  rootProviders: {
    prismaClient: FactoryProvider<PrismaClient>;
    supabaseClient: FactoryProvider<SupabaseClient>;
  };
}

export function createDIContext(config: DIContextConfig): DIContext;

// Request container
export function createRequestContainer(): Container;
```

### TRPCContext Extension

```typescript
export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
  container: Container; // NEW: request-scoped DI container
}
```

---

## 10. Integration Points with awilix-modular

### Point 1: Root Container Initialization

**Location**: `apps/backend-server/src/server.ts`

```typescript
import { DIContext } from '@repo/frameworks/di';
import { AppModule } from '@repo/frameworks/di/modules/AppModule';

// Initialize DI context during server creation
DIContext.create(AppModule, {
  framework: server,
  rootProviders: {
    prismaClient: { useFactory: () => createDb(databaseUrl) },
    supabaseClient: { useFactory: () => createSupabaseClient(...) },
  },
});
```

### Point 2: Request-Scoped Container per tRPC Request

**Location**: `apps/backend-server/src/server.ts` (createContext)

```typescript
createContext: (opts) => {
  // Create request-scoped container with PrismaClient
  const requestContainer = createRequestContainer();

  // Register request-specific values
  requestContainer.register('prismaClient', createDb(databaseUrl));
  requestContainer.register('supabaseClient', createSupabaseClient(...));

  return {
    container: requestContainer,
    db: requestContainer.resolve('prismaClient'),
    supabase: requestContainer.resolve('supabaseClient'),
    headers,
    accessToken,
  };
}
```

### Point 3: Controller Resolution in tRPC Wrappers

**Location**: `packages/adapters/src/api/controllers/index.ts`

```typescript
export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve controller from request container instead of manual instantiation
      const controller =
        ctx.container.resolve<UserController>("userController");
      const result = await controller.getById({ id: input.id });
      // ...
    }),
};
```

### Point 4: Module Imports for Cross-Layer Dependencies

**Pattern**:

```typescript
type ControllerModuleDef = ModuleDef<{
  providers: {
    userController: UserController;
    // ...
  };
  imports: [typeof RepositoryModule, typeof UseCaseModule];
}>;
```

### Point 5: Scoped PrismaClient with Transactions

**Challenge**: Maintaining transaction scope across multiple repositories
**Solution**: Use `Lifetime.SCOPED` for PrismaClient with `resolveSelf` pattern if needed

---

## 11. Risk Assessment

### Risk Level: **MEDIUM-HIGH** (7/10)

### High Risk Areas

1. **tRPC Controller Wrapper Refactoring** (Critical)
   - File: `packages/adapters/src/api/controllers/index.ts` (~1700 lines)
   - Impact: 19 routers depend on this
   - Mitigation: Incremental migration, keep old pattern during transition

2. **Request-Scoped Container Pattern** (High)
   - Challenge: Proper PrismaClient lifecycle per request
   - Impact: Memory leaks if not handled correctly
   - Mitigation: Extensive testing, use `Lifetime.SCOPED` correctly

3. **Test Container Updates** (High)
   - All tests using `createTestContainer()` need updates
   - Impact: ~50+ test files
   - Mitigation: Create compatibility layer first

### Medium Risk Areas

1. **Repository Decorator Migration** (Medium)
   - 16 repositories need `@provide` removal
   - Risk: Missing registration in module definition
   - Mitigation: Automated verification script

2. **Use Case Compatibility** (Medium)
   - 73 use cases with Inversify decorators
   - Risk: Decorator incompatibility
   - Mitigation: Gradual migration, test each use case

3. **Circular Dependencies** (Medium)
   - Potential hidden circular deps in current code
   - Risk: Awilix strict mode failures
   - Mitigation: Use `allowCircular: true` where needed

### Low Risk Areas

1. **Domain Layer** - No dependencies, unaffected
2. **DTOs** - Pure types, no changes needed
3. **Mappers** - Already framework-agnostic

---

## 12. Key Integration Points Summary

| Point                 | Location                  | Pattern                      | Complexity |
| --------------------- | ------------------------- | ---------------------------- | ---------- |
| Root Container        | `server.ts`               | `DIContext.create()`         | Medium     |
| Request Container     | `server.ts` createContext | Scoped container per request | High       |
| Controller Resolution | `controllers/index.ts`    | `ctx.container.resolve()`    | High       |
| Module Composition    | `AppModule.ts`            | Static modules with imports  | Medium     |
| PrismaClient Scope    | `RepositoryModule.ts`     | `Lifetime.SCOPED`            | High       |

---

## 13. Counts Summary

### Files Affected

- **Create**: 7 new module/infrastructure files
- **Modify**: 38 existing files (5 core + 1 wrapper + 17 controllers + 16 repositories - overlap)
- **Delete**: 3 old DI infrastructure files
- **Total**: ~55 files including test updates

### Components Affected

- **16 repositories**: Convert from @provide to module registration
- **17 controllers**: Add to module registration, no decorators needed
- **73 use cases**: Verify/convert decorators
- **19 routers**: No changes (thin wrappers)
- **1 tRPC wrapper**: Major refactoring (~1700 lines)

---

## 14. Recommended Migration Strategy

### Phase 1: Infrastructure (Low Risk)

1. Create new module files alongside existing DI
2. Add `container` to TRPCContext without breaking changes
3. Create compatibility layer for gradual migration

### Phase 2: Repository Migration (Medium Risk)

1. Convert repositories 4 at a time using parallel subagents
2. Keep Inversify running during transition
3. Verify each batch with tests

### Phase 3: Controller Migration (High Risk)

1. Refactor tRPC wrapper to support both patterns
2. Migrate controllers one at a time
3. Extensive integration testing

### Phase 4: Cleanup (Low Risk)

1. Remove Inversify dependencies
2. Delete old container files
3. Update documentation

---

## Analysis Complete

**Next Step**: Proceed to Phase 3 (Design) to create detailed module definitions and integration specifications.
