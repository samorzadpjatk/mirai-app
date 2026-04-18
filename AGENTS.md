# AGENTS.md — Quick Reference

> **Quick reference for AI agents working with this codebase**
>
> This document complements **CLAUDE.md** with practical, actionable instructions.
> For full CEK Five Pillars conventions, see **CLAUDE.md**.

---

## Quick start checklist

- **Read conventions:** Open CLAUDE.md and the pillar section relevant to your task.
- **Check active work:** Review `.specs/tasks/in-progress/` for ongoing tasks.
- **Verify spec exists:** Ensure your task has a spec in `.specs/tasks/*/`. Use `/sdd:add-task`.
- **Baseline green:** Run `bun test` before changing anything.
- **TDD first:** Write the failing test before implementation.

**Test output:** `ENABLE_TEST_LOGS=1 bun test` enables console output.

---

## Layer decision tree

```
Is it pure business logic?
├─ YES → Domain Layer (packages/domain/)
│   ├─ Core entities → entities/
│   ├─ Immutable concepts → value-objects/
│   └─ Business rules → domain-services/
│
└─ NO → Does it orchestrate domain objects?
    ├─ YES → Use Case Layer (packages/use-cases/)
    │   ├─ Business workflow → interactors/
    │   ├─ External interfaces → ports/
    │   └─ Data transfer → dto/
    │
    └─ NO → Does it connect to frameworks?
        ├─ YES → Adapter Layer (packages/adapters/)
        │   ├─ GraphQL resolvers → controllers/
        │   ├─ DB implementations → gateways/
        │   └─ Format conversions → mappers/
        │
        └─ NO → Framework Layer (packages/frameworks/)
            ├─ GraphQL config → graphql/
            ├─ Effect Layers → effect/
            └─ Supabase config → supabase/
```

---

## Per-pillar summaries

### SDD: Specification-driven development

- **Create spec:** Use `/sdd:add-task` with Given–When–Then acceptance criteria.
- **Plan:** Use `/sdd:plan` to refine and parallelize tasks.
- **Execute:** Use `/sdd:implement` with automated quality gates.

### TDD: Test-driven development

- **RED:** Write failing test first; watch it fail for the right reason.
- **GREEN:** Minimal code to pass the test.
- **REFACTOR:** Clean up while tests stay green.
- **Effect Testing:** See TESTING.md for Effect-based testing patterns. Use `Effect.either` with `Either.isLeft()`/`Either.isRight()` for type-safe error testing.

### SADD: Subagent-driven development

- **When:** Parallel work, complex tasks, quality gates (threshold: 4.5/5.0).
- **Commands:** `/sadd:do-in-parallel`, `/sadd:do-and-judge`, `/sadd:judge`.
- **Patterns:** Independent entities in parallel; Domain → Use Case → Adapter sequentially.

### Kaizen: Continuous improvement

- **YAGNI:** Need now? Simplify? Refactor while fresh?
- **Red flags:** "Later" refactor, speculative features, untested "simple" code.
- **Action:** Apply PDCA cycles for systematic improvement.

---

## Navigation: Per-package guides

| Package                                                                      | Focus                     | Key Patterns                                                   |
| ---------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| [`packages/domain/AGENTS.md`](./packages/domain/AGENTS.md)                   | Entities, value objects   | Branded IDs, `Effect<T,E,never>`, `Data.TaggedError`           |
| [`packages/use-cases/AGENTS.md`](./packages/use-cases/AGENTS.md)             | Effect orchestration      | `Effect.gen`, `yield*`, `Context.Tag`, `Layer.provide` testing |
| [`packages/adapters/AGENTS.md`](./packages/adapters/AGENTS.md)               | DI, controllers, gateways | awilix-modular, `Effect.tryPromise`, auth helpers              |
| [`packages/frameworks/AGENTS.md`](./packages/frameworks/AGENTS.md)           | Layer composition         | `Layer.mergeAll`, `Layer.toRuntime`, Effect Runtime            |
| [`packages/frameworks/src/di`](./packages/frameworks/src/di)                 | Effect DI patterns        | `makeAppLayer`, `createTestLayer`, type inference              |
| [`apps/backend-server/AGENTS.md`](./apps/backend-server/AGENTS.md)           | GraphQL resolvers, auth   | Container resolution, `Effect.runPromise` at boundaries        |
| [`apps/native/AGENTS.md`](./apps/native/AGENTS.md)                           | Mobile testing            | Jest patterns, spike cleanup                                   |
| [`apps/web/AGENTS.md`](./apps/web/AGENTS.md)                                 | Frontend patterns         | Component testing, Effect patterns                             |
| [`apps/notification-sender/AGENTS.md`](./apps/notification-sender/AGENTS.md) | Background jobs           | Parallel workflows, PDCA                                       |

---

## Package Export Patterns

Keep package exports minimal and intentional. Avoid backward compatibility re-exports.

### Domain Package (@mirai-app/domain)

**Structure:** Single root export only.

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**index.ts pattern:**

```typescript
// Shared utilities
export * from "./shared/errors/domain-errors";
export * from "./shared/value-objects/branded-id";
export type { IAuthPort, IStoragePort, IRealtimePort } from "./shared/services";

// Domain modules (barrel exports)
export * from "./user";
export * from "./trip";
// ... etc
```

### Use-Cases Package (@mirai-app/use-cases)

**Structure:** Namespace exports + specific port patterns.

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./user": "./src/user/index.ts",
    "./user/ports/*": "./src/user/ports/*.ts",
    "./trip": "./src/trip/index.ts",
    "./trip/ports/*": "./src/trip/ports/*.ts",
    "./shared/ports": "./src/shared/ports/index.ts"
  }
}
```

**index.ts pattern:**

```typescript
// Namespace exports
export * as user from "./user";
export * as trip from "./trip";

// Shared service ports
export { AuthPortTag, StoragePortTag, RealtimePortTag } from "./shared/ports";
```

**Usage:**

```typescript
// Import namespace
import { user } from "@mirai-app/use-cases";
const program = Effect.gen(function* () {
  const repo = yield* user.UserPortTag;
});

// Import specific port (for DI wiring)
import { UserPortTag } from "@mirai-app/use-cases/user/ports/UserPort";
```

### Adapters Package (@mirai-app/adapters)

**Structure:** Root export only. All gateways accessed through main index.

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./service-layer": "./src/system/service-layer.ts"
  }
}
```

**index.ts pattern:**

```typescript
// Service layer composition
export {
  makeServiceLayer,
  makeAuthLayer,
  type ServiceLayerConfig,
} from "./system/service-layer";

// Service gateways
export { SupabaseAuthGateway } from "./auth/gateways/supabase/SupabaseAuthGateway";
export { SupabaseStorageGateway } from "./storage/gateways/supabase/SupabaseStorageGateway";

// Domain gateways (organized by domain)
export { UserDrizzleGateway } from "./user/gateways/drizzle";
export { GroupDrizzleGateway } from "./group/gateways/drizzle";
// ... etc
```

### Anti-patterns to Avoid

**Don't:** Multiple redundant export patterns

```json
// Bad - redundant patterns
"./user/ports/*": "./src/user/ports/*.ts",
"./user/ports/*.ts": "./src/user/ports/*.ts",
"./ports/user/*.ts": "./src/user/ports/*.ts"
```

**Don't:** Deep re-export chains in index.ts

```typescript
// Bad - index.ts shouldn't re-export from other packages
export type { IGroupPort } from "@mirai-app/domain"; // Don't do this
export { GroupPortTag } from "./group/ports/GroupPort"; // Already exported via namespace
```

**Don't:** Non-existent paths in package.json

```json
// Bad - verify paths exist
"./controllers/*": "./src/controllers/*.ts" // Only if dir exists
```

### Principles

1. **Single root export** for domain package (pure, no subpaths needed)
2. **Namespace + port patterns** for use-cases (clean access + DI needs)
3. **Root + minimal subpaths** for adapters (gateways via main index)
4. **No backward compatibility** re-exports - update imports instead
5. **Verify paths exist** before adding to package.json exports

---

## 11 Universal Rules

1. **TDD first:** Write the failing test before implementation.
2. **Effect-based:** Domain uses `Effect<T,E,never>`; orchestration uses `Effect.gen` + `Context.Tag`.
3. **Branded IDs:** Use branded types; never mix IDs across aggregates.
4. **Never modify lint/type config:** Fix the actual code error, never disable rules or change ESLint, tsc, or other lint/type configuration to bypass errors.
5. **No emojis in commits:** Use plain text for commit messages. No emoji prefixes (e.g., "fix:" not "🐛 fix:").
6. **No emojis in source code:** Use plain text in console.log, console.error, and all source code. No emoji characters in .ts, .js, .tsx, .jsx files. This ensures clean diffs and avoids encoding issues.
7. **GraphQL workflow:** Never edit generated GraphQL clients, types, or operations in `packages/graphql-client/src/generated/`. Never edit `packages/graphql-client/codegen.ts`. Only edit Pothos schema files, then sync schema, then regenerate client.
8. **TODO comments:** When fixing a TODO, implement the fix without rephrasing or removing the TODO comment. The TODO comment documents the original intent and should remain intact for reference.
9. **Minimal comments:** Write self-explanatory code with clear naming, types, and structure. Avoid explanatory comments that describe what the code does; use comments only for _why_ (business rationale, non-obvious design decisions). If code needs a comment to explain what it does, refactor it to be clearer instead.
10. **No inline type imports:** Use standard ES module imports at the top of the file. Never use inline type imports like `import("@mirai-app/domain").ActivityId`. If a type is needed, import it properly: `import type { ActivityId } from "@mirai-app/domain"`
11. **No `as unknown as` casts:** Never use `as unknown as Type` type assertions. Fix the underlying type mismatch through proper type guards, type narrowing, or by correcting the type definitions. If external types are incorrect, use proper type declarations or wrapper functions instead of unsafe casting.
12. **Port naming convention:** Domain interfaces use I-prefix (`IUserPort`), Context.Tag classes use Tag suffix (`UserPortTag`). Never use declaration merging between interfaces and classes.

---

## Port Naming Pattern (Effect DI)

### Rule: No Declaration Merging

Never use the same name for both an interface and a class (this triggers ESLint's `no-unsafe-declaration-merging`).

### Naming Convention

| Layer         | Pattern              | Example                      |
| ------------- | -------------------- | ---------------------------- |
| **Domain**    | `I` + `XxxPort`      | `IUserPort`, `ITripPort`     |
| **Use-Cases** | `XxxPortTag`         | `UserPortTag`, `TripPortTag` |
| **Gateways**  | Implement `IXxxPort` | `implements IUserPort`       |

### Code Pattern

**Domain layer (`packages/domain/src/user/ports/UserPort.ts`):**

```typescript
export interface IUserPort {
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never>;
  create(user: User): Effect.Effect<User, DatabaseError, never>;
  // ... other methods
}
```

**Use-cases layer (`packages/use-cases/src/user/ports/UserPort.ts`):**

```typescript
import type { IUserPort } from "@mirai-app/domain";

export class UserPortTag extends Context.Tag("UserPort")<
  UserPortTag,
  IUserPort
>() {}
```

**Adapter layer (`packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts`):**

```typescript
import type { IUserPort } from "@mirai-app/domain";

export class UserDrizzleGateway implements IUserPort {
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never> {
    return Effect.tryPromise({ ... });
  }
  // ... implement all interface methods
}
```

**Usage in interactors:**

```typescript
import { UserPortTag } from "../ports/UserPort";

const program = Effect.gen(function* () {
  const userPort = yield* UserPortTag; // Use Tag suffix
  const user = yield* userPort.findById(id);
});
```

---

## Return Type Annotation Guidelines

### Rule: Inference-First for Implementations

Explicit return type annotations are **not required** when TypeScript can infer types correctly. Use explicit types only for:

- Interface/port definitions (contracts)
- When inference produces `any`, `unknown`, or overly broad types
- Public API boundaries where clarity is critical

### Abstract Error Interface

Use `IPortError` interface to enable concrete error composition:

```typescript
// packages/domain/src/shared/errors/ports.ts
export interface IPortError {
  readonly _tag: string;
  readonly message: string;
}

// Concrete errors implement the interface
export class DatabaseError
  extends Data.TaggedError("DatabaseError")<{
    cause: unknown;
  }>
  implements IPortError
{
  readonly message = "Database operation failed";
}
```

### Code Pattern

**Interface (explicit with abstract error):**

```typescript
// packages/domain/src/user/ports/UserPort.ts
export interface IUserPort {
  findById(id: UserId): Effect.Effect<User | null, IPortError, never>;
  create(user: User): Effect.Effect<User, IPortError, never>;
}
```

**Implementation (inferred):**

```typescript
// packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts
export class UserDrizzleGateway implements IUserPort {
  // Inferred: Effect<User | null, DatabaseError | NotFoundError, never>
  findById(id: UserId) {
    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      if (!result) {
        return yield* Effect.fail(new NotFoundError({ entity: "User", id }));
      }

      return this.mapper.toDomain(result);
    });
  }

  // Inferred: Effect<User, DatabaseError, never>
  create(user: User) {
    return Effect.tryPromise({
      try: () => this.db.insert(users).values(this.mapper.toInsert(user)),
      catch: (error) => new DatabaseError({ cause: error }),
    }).pipe(Effect.map(() => user));
  }
}
```

### ESLint Configuration

```javascript
// eslint.config.mjs - Require explicit only when not implementing interface
{
  files: ['packages/adapters/src/**/*.ts', 'packages/use-cases/src/**/*.ts'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
      allowOverrideWithoutType: true, // Allow inference for interface impls
    }],
  },
}
```

---

## Effect Framework Quick Reference

### Core Patterns

| Pattern           | Syntax                               | Use Case                          |
| ----------------- | ------------------------------------ | --------------------------------- |
| Pure domain       | `Effect<T, E, never>`                | Entity validation, value objects  |
| Orchestration     | `Effect.gen(function* () { ... })`   | Use case workflows                |
| Dependency access | `yield* ContextTag`                  | Repository access in use cases    |
| Error creation    | `new Data.TaggedError("Name")<{}>()` | Domain/use case errors            |
| Error raising     | `yield* Effect.fail(error)`          | Short-circuit on error            |
| Success           | `yield* Effect.succeed(value)`       | Wrap success values               |
| Parallel ops      | `yield* Effect.all([e1, e2])`        | Concurrent execution              |
| External calls    | `Effect.tryPromise({ try, catch })`  | Wrap external APIs                |
| Error recovery    | `Effect.catchTag("Error", handler)`  | Handle specific errors            |
| Error testing     | `Effect.either` + `Either.isLeft`    | Type-safe error testing           |
| Pattern match     | `Either.match({ onLeft, onRight })`  | Handle both cases cleanly         |
| Provide deps      | `Effect.provide(Layer)`              | Inject dependencies               |
| Run Effect        | `Effect.runPromise(effect)`          | Execute at boundaries             |
| **Logging**       | `yield* EffectLogger.info(msg, ctx)` | Observability in Effect workflows |

### Layer Composition

```typescript
// Define service
const MyService = Context.Tag<MyService>("MyService");

// Create layer
const MyLayer = Layer.succeed(MyService, implementation);

// Compose layers
const AppLayer = Layer.mergeAll(Layer1, Layer2, Layer3);

// Build runtime
const runtime = await Effect.runPromise(Layer.toRuntime(AppLayer));

// Run with runtime
await Runtime.runPromise(runtime)(program);
```

---

## DI Layer Patterns (packages/frameworks/di)

### Module Structure

The DI module provides Effect Layer compositions for dependency injection:

```
packages/frameworks/src/di/
├── index.ts                 # Main exports
└── layer/
    ├── app.ts              # Complete app layer (repositories + services)
    ├── repository.ts       # All domain repository Layers
    ├── service.ts          # Supabase service Layers
    ├── service-tags.ts     # Context.Tags for services
    ├── infrastructure.ts   # Database/logger configuration
    ├── test.ts            # Test utilities and mock layers
    └── storage-path-resolver.ts
```

### Creating Layers

**Complete App Layer:**

```typescript
import { makeAppLayer } from "@mirai-app/frameworks/di";
import { UserPortTag } from "@mirai-app/use-cases/user/ports/UserPort";
import { Effect } from "effect";

const appLayer = makeAppLayer({ db, supabase });

const program = Effect.gen(function* () {
  const userRepo = yield* UserPortTag;
  return yield* userRepo.findById("123");
}).pipe(Effect.provide(appLayer));
```

**Individual Repository Layer:**

```typescript
import { makeUserRepositoryLayer } from "@mirai-app/frameworks/di";

const userLayer = makeUserRepositoryLayer({ db });
```

### Test Layer Utilities

```typescript
import { createTestLayer, runWithTestLayer } from "@mirai-app/frameworks/di";

const testLayer = createTestLayer();

const result = await runWithTestLayer(
  testLayer,
  Effect.gen(function* () {
    const repo = yield* UserPortTag;
    return yield* repo.findById("123");
  }),
);
```

### Key Principles

1. **Type inference over explicit annotations** - Let TypeScript infer Layer types; only add explicit types when necessary
2. **No `as unknown as` casts** - Use proper gateway implementations; avoid unsafe type assertions
3. **Check existing implementations** - Before creating placeholders, verify if gateways already exist in adapters
4. **Layer composition** - Use `Layer.mergeAll()` for combining multiple repository layers
5. **Service separation** - Repository layers (db) and service layers (supabase) can be created independently

---

## Test execution

| Command                | Purpose           |
| ---------------------- | ----------------- |
| `bun test`             | Run all tests     |
| `bun test:unit`        | Unit tests only   |
| `bun test:integration` | Integration tests |
| `bun test --coverage`  | With coverage     |

**Tagging:** `[UNIT]` for pure logic, `[INTEGRATION]` for DB/APIs.

**Effect Testing:** Use standard Effect patterns:

```typescript
// Error testing with Either.isLeft and instanceof
const either = await Effect.runPromise(Effect.either(effect));
expect(Either.isLeft(either)).toBe(true);
if (Either.isLeft(either)) {
  expect(either.left).toBeInstanceOf(NotFoundError);
}

// Success testing with Either.isRight
expect(Either.isRight(either)).toBe(true);
if (Either.isRight(either)) {
  expect(either.right.id).toBe("valid-id");
}

// Pattern matching with Either.match
return Either.match(either, {
  onLeft: (error) => `Error: ${error._tag}`,
  onRight: (value) => `Success: ${value.id}`,
});
```

See TESTING.md for comprehensive Effect testing patterns including:

- `Effect.runSync` and `Effect.runPromise`
- `Effect.either` with `Either.isLeft`/`Either.isRight`
- Mock layers with `Layer.succeed`
- Dependency injection with `Effect.provide`

---

## Skill reference

| Skill                      | Path                                       | Use case            |
| -------------------------- | ------------------------------------------ | ------------------- |
| `sdd:add-task`             | `.agents/skills/sdd-add-task/`             | Create spec         |
| `sdd:plan`                 | `.agents/skills/sdd-plan/`                 | Refine plan         |
| `sdd:implement`            | `.agents/skills/sdd-implement/`            | Execute             |
| `sadd:launch-sub-agent`    | `.agents/skills/sadd-launch-sub-agent/`    | Launch subagent     |
| `sadd:do-and-judge`        | `.agents/skills/sadd-do-and-judge/`        | Execute + verify    |
| `sadd:judge`               | `.agents/skills/sadd-judge/`               | Evaluate work       |
| `kaizen:why`               | `.agents/skills/kaizen-why/`               | Root cause analysis |
| `kaizen:plan-do-check-act` | `.agents/skills/kaizen-plan-do-check-act/` | PDCA cycle          |

---

## Gateway-Level Auth Protection

Gateway-level auth protection ensures users can only access resources they own. This section documents the implementation patterns for auth-protected gateways.

### Architecture Overview

```
Domain Layer          Use-Cases Layer        Adapters Layer        Frameworks Layer
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ IAuthPort       │   │ AuthPortTag     │   │ SupabaseAuth    │   │ makeAuthLayer() │
│ interface       │→  │ Context.Tag     │←  │ Gateway         │←  │ Layer.compose   │
│ verifyAccess()  │   │ yield* AuthPort │   │ implements      │   │ merge with      │
└─────────────────┘   └─────────────────┘   │ IAuthPort       │   │ repoLayer       │
│ AccessCheckRequest│                     └─────────────────┘   └─────────────────┘
└─────────────────┘
```

### Key Components

**Domain Layer (`@mirai-app/domain`)**: Defines auth contracts and error types
- `IAuthPort` interface with `verifyAccess()` method
- `AccessCheckRequest` type for resource verification
- Auth error classes: `AuthSessionExpiredError`, `PermissionDeniedError`, `TokenMissingError`, `AuthServiceError`

**Use-Cases Layer (`@mirai-app/use-cases`)**: Provides Effect DI tag
- `AuthPortTag` Context.Tag for accessing auth port
- Re-export of `IAuthPort` type

**Adapters Layer (`@mirai-app/adapters`)**: Implements auth verification
- `SupabaseAuthGateway` implements `IAuthPort`
- `verifyAccess()` validates JWT via Supabase and checks resource permissions
- Supports resource types: trip, group, challenge, user, activity, notification, reward, sponsor, coin, challengeSubmission

**Frameworks Layer (`@mirai-app/frameworks/di`)**: Wires auth into DI system
- `makeAuthLayer({ supabase })` creates auth Layer
- Merged into `makeAppLayer()` via `Layer.mergeAll(authLayer, repoLayer, serviceLayer)`
- Test utilities in `createTestLayer()` with mock auth support

### Effect.gen Pattern with AuthPortTag

**Basic Pattern:**

```typescript
import { Effect } from "effect";
import { AuthPortTag } from "@mirai-app/use-cases";

const protectedOperation = Effect.gen(function* () {
  const authPort = yield* AuthPortTag;
  
  // Verify access before operation
  yield* authPort.verifyAccess({
    token: authToken,
    resourceType: "trip",
    resourceId: tripId,
    requiredPermission: "write",
  });
  
  // Proceed with protected operation
  const result = yield* performOperation();
  return result;
});
```

**Gateway Implementation Pattern:**

```typescript
import { Effect } from "effect";
import { AuthPortTag } from "@mirai-app/use-cases";
import type { ITripPort } from "@mirai-app/domain";

export class TripDrizzleGateway implements ITripPort {
  findById(id: TripId, authToken?: string) {
    return Effect.gen(function* () {
      // Skip auth for public operations (token optional)
      if (authToken) {
        const authPort = yield* AuthPortTag;
        yield* authPort.verifyAccess({
          token: authToken,
          resourceType: "trip",
          resourceId: TripId.toString(id),
          requiredPermission: "read",
        });
      }
      
      // Proceed with database query
      const result = yield* databaseQuery();
      return result;
    });
  }
}
```

### Permission Levels

| Level  | Access | Typical Use Case |
|--------|--------|------------------|
| `read`  | View resource | Get operations, list queries |
| `write` | Modify resource | Create, update operations |
| `admin` | Full control | Delete operations, admin operations |

### Error Handling

Auth errors implement `IPortError` and can be matched with `Effect.catchTag`:

```typescript
import { AuthSessionExpiredError, PermissionDeniedError } from "@mirai-app/domain";

const program = Effect.gen(function* () {
  // ... auth verification
}).pipe(
  Effect.catchTag("AuthSessionExpiredError", (error) => {
    // Handle expired token - redirect to login
    return Effect.fail(new UnauthorizedError({}));
  }),
  Effect.catchTag("PermissionDeniedError", (error) => {
    // Handle permission denied - return 403
    return Effect.fail(new ForbiddenError({}));
  })
);
```

### Testing Auth-Protected Operations

**Mock Auth Helpers (from `@mirai-app/frameworks/di`):**

```typescript
import { 
  createTestLayer, 
  createAlwaysAllowMockAuth, 
  createAlwaysDenyMockAuth,
  createConditionalMockAuth,
  MockUnauthorizedError,
  MockPermissionDeniedError 
} from "@mirai-app/frameworks/di";
import { Effect, Either } from "effect";

// Test with auth bypassed (always succeeds)
const testLayer = createTestLayer(); // includes mock auth

// Test with auth failure
const denyLayer = createTestLayer({
  authPort: createAlwaysDenyMockAuth(new MockUnauthorizedError({}))
});

// Test conditional auth
const conditionalLayer = createTestLayer({
  authPort: createConditionalMockAuth({
    isAllowed: (token) => token === "valid-token",
    error: new MockPermissionDeniedError({}),
  })
});

// Type-safe error testing with Effect.either
const either = await Effect.runPromise(
  Effect.either(program.pipe(Effect.provide(denyLayer)))
);
expect(Either.isLeft(either)).toBe(true);
if (Either.isLeft(either)) {
  expect(either.left).toBeInstanceOf(MockUnauthorizedError);
}
```

---

## Migration Pattern for Existing Gateways

For comprehensive conventions, see **AGENTS.md** (this file) and per-package AGENTS.md files:

- `packages/domain/AGENTS.md` — Domain layer patterns, entities, value objects
- `packages/use-cases/AGENTS.md` — Effect orchestration, Context.Tags
- `packages/adapters/AGENTS.md` — DI, controllers, gateways
- `packages/frameworks/AGENTS.md` — Layer composition, Effect Runtime

---

**Last Updated:** 2026-04-18
**Version:** 2.10.0 (Added gateway-level auth protection documentation with Effect DI patterns and migration guide)
