# Phase 5: DI System Consolidation — Full Effect Migration

**Status:** 📦 **COMPONENT of effect-migration.design.md**  
**Relationship:** This is Phase 5 of the Effect migration (Weeks 5-6: Adapters Layer)  
**Referenced by:** effect-migration.design.md §3.2 "DI System Migration"  
**Integration:** Use this detailed plan when implementing the DI consolidation phase

---

## Overview

**Goal:** Eliminate dual DI systems (awilix-modular + Effect Context) by fully migrating to Effect's Context.Tag and Layer system.

**Current State:**

- 87 usages of `ctx.container.resolve` (awilix)
- 135+ Context.Tag definitions (Effect)
- Complex bridging via `effect-layer.ts`
- 361 lines of container.ts + effect-layer.ts + modules

**Target State:**

- 0 usages of awilix
- Single Effect-based DI system
- ~70% reduction in DI infrastructure code
- Type-safe dependency resolution throughout

**Rationale:**

- Use-cases already 100% Effect-based (135+ Context.Tags)
- Controllers are the only layer using awilix
- Effect Context provides better type safety and composability
- Eliminates cognitive overhead of choosing DI system
- Aligns with CLAUDE.md §10.4 Effect integration patterns

---

## Architecture Decision

### Decision: Migrate to Pure Effect DI

**Approach:** Replace awilix container resolution with Effect Layers

**Benefits:**

- Type-safe (compile-time dependency checking)
- Composable (Layer.merge for combining dependencies)
- Testable (Layer.succeed for mocks)
- Consistent with use-cases layer
- No runtime resolution overhead

**Migration Strategy:**

1. Create repository Layers from Drizzle gateways
2. Create service Layers for external dependencies
3. Compose into AppLayer at application entry point
4. Controllers receive pre-resolved dependencies via Effect

---

## Implementation Plan

### Phase 5.1: Repository Layers (packages/frameworks/src/layers/)

Create Effect Layers for all repositories currently resolved via awilix:

```typescript
// frameworks/src/layers/RepositoryLayer.ts
import { Layer } from "effect";
import {
  UserRepositoryTag,
  GroupRepositoryTag,
  TripRepositoryTag,
  // ... all repository tags
} from "@mirai-app/use-cases";

export const RepositoryLayer = Layer.mergeAll(
  Layer.succeed(UserRepositoryTag, new DrizzleUserRepository(db)),
  Layer.succeed(GroupRepositoryTag, new DrizzleGroupRepository(db)),
  Layer.succeed(TripRepositoryTag, new DrizzleTripRepository(db)),
  // ... all repositories
);
```

**Files to Create:**

1. `packages/frameworks/src/layers/RepositoryLayer.ts` — All repository bindings
2. `packages/frameworks/src/layers/ServiceLayer.ts` — External service bindings
3. `packages/frameworks/src/layers/AppLayer.ts` — Combined application layer
4. `packages/frameworks/src/layers/index.ts` — Barrel exports

**Count:** ~30 repositories × 2 lines each = ~60 lines

---

### Phase 5.2: Controller Migration (packages/adapters/src/controllers/)

Update controllers to use Effect instead of awilix resolution:

**Before:**

```typescript
async getById(input: GetByIdInput, di: DIContext) {
  const controller = di.container.resolve("groupController");
  const result = await controller.getById(parsed.data);
  // ...
}
```

**After:**

```typescript
// Controllers receive resolved use cases via Effect
async getById(input: GetByIdInput, deps: { getGroupUseCase: GetGroupUseCase }) {
  const result = await deps.getGroupUseCase.execute({ id: input.id }).pipe(
    Effect.provide(AppLayer),
    Effect.runPromise
  );
  // ...
}
```

**Alternative (Recommended):** Move controller logic into Effect programs:

```typescript
// router directly provides AppLayer
export const groupRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return await Effect.runPromise(
        getGroupUseCase.execute({ id: input.id }).pipe(
          Effect.provide(AppLayer),
          Effect.catchTag("GetGroupNotFoundError", () =>
            Effect.fail(new TRPCError({ code: "NOT_FOUND" })),
          ),
        ),
      );
    }),
});
```

**Files to Modify:**

- All controller files in `packages/adapters/src/controllers/` (6 files)
- All router files in `apps/backend-server/src/routers/`
- TRPC context to provide AppLayer instead of container

---

### Phase 5.3: Remove awilix-modular Infrastructure

**Delete/Archive:**

1. `packages/frameworks/src/di/container.ts` (361 lines)
2. `packages/frameworks/src/di/effect-layer.ts`
3. `packages/frameworks/src/di/modules/` (all module files)
4. `packages/frameworks/src/di/index.ts` (DI exports)

**Update:**

- `packages/frameworks/src/index.ts` — Remove DI exports
- `apps/backend-server/src/trpc.ts` — Remove container from context
- All test files using `createTestContainer()`

---

### Phase 5.4: Update Test Infrastructure

**Before:**

```typescript
const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});
const useCase = container.resolve("getUserUseCase");
```

**After:**

```typescript
const TestLayer = Layer.mergeAll(
  Layer.succeed(UserRepositoryTag, new InMemoryUserRepository()),
  // ... other test mocks
);

const program = getUserUseCase
  .execute({ id: "123" })
  .pipe(Effect.provide(TestLayer));
const result = await Effect.runPromise(program);
```

---

### Phase 5.5: Update Entry Points

**apps/backend-server/src/index.ts:**

```typescript
import { AppLayer } from "@mirai-app/frameworks/layers";

// Build runtime from AppLayer
const runtime = await Effect.runPromise(Layer.toRuntime(AppLayer));

// Pass runtime to TRPC handler
app.use("/trpc", trpcHandler({ runtime }));
```

---

## File Inventory

### Create (New Files):

1. `packages/frameworks/src/layers/RepositoryLayer.ts` (~60 lines)
2. `packages/frameworks/src/layers/ServiceLayer.ts` (~20 lines)
3. `packages/frameworks/src/layers/AppLayer.ts` (~10 lines)
4. `packages/frameworks/src/layers/index.ts` (~5 lines)
5. `packages/frameworks/src/testing/TestLayers.ts` (~30 lines)

**Total New: ~125 lines**

### Modify (Existing Files):

1. `packages/adapters/src/controllers/` (6 files) — Update to use Effect
2. `apps/backend-server/src/trpc.ts` — Replace container with Layer
3. `apps/backend-server/src/index.ts` — Initialize Effect runtime
4. All router files — Update context type

### Delete (Remove):

1. `packages/frameworks/src/di/container.ts` (361 lines)
2. `packages/frameworks/src/di/effect-layer.ts` (~50 lines)
3. `packages/frameworks/src/di/modules/*` (~200 lines total)
4. `packages/frameworks/src/di/index.ts` (~30 lines)

**Total Removed: ~641 lines**

**Net Code Reduction: ~516 lines (-80%)**

---

## Acceptance Criteria

1. **Zero awilix references:** `grep -r "awilix" packages apps --include="*.ts" | wc -l` → 0
2. **Zero container.resolve:** `grep -r "container.resolve" packages apps --include="*.ts" | wc -l` → 0
3. **All tests pass:** `bun test` passes
4. **No type errors:** `bun typecheck` passes
5. **No dependency cruiser violations:** `bun depcruise` passes
6. **Effect layers created:** All repositories accessible via Context.Tags
7. **Test infrastructure updated:** Tests use Layer.succeed for mocking

---

## Risks & Mitigations

| Risk                | Impact | Mitigation                                                    |
| ------------------- | ------ | ------------------------------------------------------------- |
| Test breakage       | High   | Update test infrastructure before controller migration        |
| Runtime performance | Low    | Effect Layer resolution is compile-time, no runtime overhead  |
| Developer confusion | Medium | Update AGENTS.md with new DI patterns, provide examples       |
| Partial migration   | Medium | Strict verification: zero awilix references before completion |
| Scope creep         | High   | Limit to DI consolidation, no other refactors                 |

---

## Definition of Done

- [ ] All awilix imports removed
- [ ] All container.resolve calls replaced
- [ ] Repository Layers created for all repositories
- [ ] Controllers updated to use Effect
- [ ] TRPC context updated to provide AppLayer
- [ ] Test infrastructure migrated to Layer-based mocking
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] AGENTS.md updated with new DI patterns
- [ ] Example migration guide created

---

## Success Metrics

| Metric                  | Before                 | After               | Target        |
| ----------------------- | ---------------------- | ------------------- | ------------- |
| awilix references       | 87                     | 0                   | 0 ✅          |
| DI infrastructure lines | ~641                   | ~125                | -80% ✅       |
| Test mocking complexity | High (container setup) | Low (Layer.succeed) | Simplified ✅ |
| Type safety             | Runtime                | Compile-time        | Improved ✅   |
| DI pattern consistency  | Mixed (2 systems)      | Single (Effect)     | Unified ✅    |

---

**Estimated Time:** 2-3 days (distributed across SADD sub-agents)
**Estimated Complexity:** High (architectural change)
**Recommendation:** Execute via `/sadd:do-in-steps` due to sequential dependencies

---

## Parallelization Strategy

While this is fundamentally a sequential task (each step builds on previous), we can parallelize within steps:

**Step 1 (Repository Layers):** Can parallelize by repository group

- Group A: User/Group/Trip repositories
- Group B: Challenge/Submission/Vote repositories
- Group C: Notification/Delivery/Reward repositories
- Group D: Activity/Event/Location repositories

**Step 2 (Controller Migration):** Can parallelize by controller

- 6 controller files can be migrated independently

**Step 3 (Test Updates):** Can parallelize by test file

- Update test helpers first (blocking)
- Then parallelize test file updates

**Step 4 (Cleanup):** Sequential - must happen after all migrations

**Recommendation:** Use `/sadd:do-in-steps` with parallel sub-steps where possible.
