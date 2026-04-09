# AGENTS.md - Agent Instructions for Mirai App Monorepo

> **Quick reference for AI agents working with this codebase**
>
> This document complements CLAUDE.md with practical, actionable instructions.
> For full CEK Five Pillars conventions, see [CLAUDE.md](./CLAUDE.md).

---

## Quick Start Checklist

When starting work on this codebase:

- [ ] Read the relevant section in CLAUDE.md for the pillar you're working on
- [ ] Check `.specs/tasks/in-progress/` for active work
- [ ] Verify your task has a specification document
- [ ] Run `bun test` to ensure baseline is green
- [ ] Follow TDD: Write tests before implementation

---

## Layer Decision Tree

When adding new code, use this decision tree to determine the correct layer:

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
        │   ├─ tRPC routes → controllers/
        │   ├─ DB implementations → gateways/
        │   └─ Format conversions → mappers/
        │
        └─ NO → Framework Layer (packages/frameworks/)
            ├─ tRPC config → trpc/
            ├─ Prisma config → prisma/
            └─ Supabase config → supabase/
```

---

## Per-Pillar Agent Instructions

### SDD: Specification-Driven Development

**When to use:** Every feature, refactor, or significant change

**Process:**

1. **Create** specification using `/sdd:add-task`
2. **Refine** until acceptance criteria are clear (Given-When-Then)
3. **Plan** implementation steps with `/sdd:plan`
4. **Execute** with `/sdd:implement`

**File locations:**

- Draft specs: `.specs/tasks/draft/`
- Ready specs: `.specs/tasks/todo/`
- Active work: `.specs/tasks/in-progress/`
- Completed: `.specs/tasks/done/`

**Template to use:** `.specs/templates/feature-spec.md`

---

### TDD: Test-Driven Development

**When to use:** ALL code implementation

**Process:**

1. **RED:** Write failing test first
2. **GREEN:** Write minimal code to pass
3. **REFACTOR:** Clean up while tests pass

**Test locations by layer:**

| Layer     | Pattern      | Example                                                |
| --------- | ------------ | ------------------------------------------------------ |
| Domain    | Co-located   | `src/entities/User.ts` → `User.test.ts`                |
| Use Cases | Co-located   | `src/interactors/CreateUser.ts` → `CreateUser.test.ts` |
| Adapters  | `__tests__/` | `src/gateways/*.ts` → `__tests__/*.test.ts`            |
| Apps      | `__tests__/` | `src/components/*.tsx` → `__tests__/*.test.tsx`        |

**Test running:**

```bash
# All tests
bun test

# Specific package
cd packages/domain && bun test

# With coverage
bun test --coverage
```

---

### DDD: Domain-Driven Design

**When to use:** Any code that models business concepts

**Key Rules:**

1. **Domain purity:** ZERO external dependencies in domain layer
2. **Dependency direction:** Always inward (Frameworks → Adapters → Use Cases → Domain)
3. **Error handling:** Use `Result<T,E>` everywhere
4. **ID types:** Use branded types to prevent mixing

**Creating a new entity:**

```typescript
// packages/domain/src/entities/MyEntity.ts
import { Result, ok, err } from "../utils/result";

export class MyEntity {
  private constructor(
    public readonly id: string,
    // ... other properties
  ) {}

  static create(props: CreateProps): Result<MyEntity, string> {
    // Validation logic
    if (!isValid(props)) {
      return err("Validation failed");
    }
    return ok(new MyEntity(/* ... */));
  }

  // Business methods (pure functions)
  updateSomething(newValue: string): Result<MyEntity, string> {
    // Return new instance (immutable)
    return ok(new MyEntity(/* ... */));
  }
}
```

**Common Mistakes to Avoid:**

- ❌ Importing frameworks into domain
- ❌ Using `Date.now()` or `Math.random()` directly (inject or pass in)
- ❌ Mutating entity state (always return new instances)
- ❌ Throwing exceptions (use `Result<T,E>`)

---

### SADD: Subagent-Driven Development

**When to use:** Parallel work, quality gates, complex tasks

**Quality Gates:**

| Component         | Threshold | Judges    |
| ----------------- | --------- | --------- |
| Documentation     | 4.0/5.0   | 1         |
| Package scaffold  | 4.0/5.0   | 1         |
| Entity extraction | 4.5/5.0   | 2 (panel) |
| Use case          | 4.5/5.0   | 2 (panel) |
| Critical logic    | 4.5/5.0   | 2 (panel) |

**Parallel vs Sequential:**

```
Parallel (independent):
┌─────────┐ ┌─────────┐
│ EntityA │ │ EntityB │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ▼
     ┌─────────┐
     │ Combine │
     └─────────┘

Sequential (dependent):
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Domain  │──>│Use Case │──>│ Adapter │
└─────────┘   └─────────┘   └─────────┘
```

**Subagent Commands:**

- `/sadd:launch-sub-agent` - Execute task with isolated context
- `/sadd:do-and-judge` - Execute with automatic retry
- `/sadd:do-in-parallel` - Multiple subagents at once
- `/sadd:judge` - Evaluate existing work

---

### Kaizen: Continuous Improvement

**When to use:** Every code interaction

**YAGNI Checklist:**

- [ ] Is this feature actually needed now?
- [ ] Can this code be simpler?
- [ ] Am I refactoring while context is fresh?

**Red Flags (Refactor NOW):**

- "I'll refactor this later" → Refactor it now
- "We might need this" → You probably don't
- "Too simple to test" → Write the test anyway

**Standard Patterns:**

| Aspect      | Pattern             | Example                |
| ----------- | ------------------- | ---------------------- |
| Files       | kebab-case.ts       | `user-controller.ts`   |
| Entities    | PascalCase.ts       | `User.ts`              |
| Tests       | \*.test.ts          | `User.test.ts`         |
| Directories | layer/src/category/ | `domain/src/entities/` |

---

## Dependency Injection (DI) Patterns

The Mirai App uses **awilix-modular** for dependency injection - a decorator-free, zero-configuration DI framework.

### Quick Reference

```typescript
// In router: Resolve controller from container
const controller = ctx.container.resolve("userController");

// In test: Create isolated container
const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});
```

### Key Benefits

1. **No tsconfig changes needed** - Works with existing TypeScript config
2. **No decorators required** - No `@injectable`, `@inject` annotations
3. **Automatic type inference** - No manual service identifiers
4. **Module-based organization** - NestJS-like `@Module()` pattern

### Container Resolution in Routers

```typescript
// apps/backend-server/src/routers/user.ts
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve from request-scoped container
      const controller = ctx.container.resolve("userController");
      return controller.getById(input);
    }),

  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      const result = await controller.create(input);

      if (result.isError()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.value;
    }),
});
```

### Creating a New Repository with DI

```typescript
// 1. Create repository
// packages/adapters/src/gateways/PrismaMyEntityRepository.ts
export class PrismaMyEntityRepository implements MyEntityRepository {
  constructor(private prisma: PrismaClient) {}
  // ... implementation
}

// 2. Add to RepositoryModule
// packages/adapters/src/modules/RepositoryModule.ts
export const REPOSITORY_TOKENS = {
  // ... existing
  MyEntityRepository: "myEntityRepository",
} as const;

export const RepositoryModule = createStaticModule({
  providers: {
    // ... existing
    [REPOSITORY_TOKENS.MyEntityRepository]: PrismaMyEntityRepository,
  },
  exports: [
    // ... existing
    REPOSITORY_TOKENS.MyEntityRepository,
  ],
});

// 3. Update ModuleDeps interface
export interface RepositoryModuleDeps {
  // ... existing
  [REPOSITORY_TOKENS.MyEntityRepository]: MyEntityRepository;
}

// 4. Re-export
export { PrismaMyEntityRepository } from "../gateways/PrismaMyEntityRepository";
```

### Testing with DI Container

```typescript
// packages/use-cases/src/interactors/CreateMyEntity.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { createTestContainer } from "@mirai-app/frameworks/di";
import { asClass } from "awilix";
import { InMemoryMyEntityRepository } from "./mocks/InMemoryMyEntityRepository";
import { CreateMyEntityUseCase } from "./CreateMyEntity";

describe("CreateMyEntityUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();
    // Override with mock implementation
    container.register({
      myEntityRepository: asClass(InMemoryMyEntityRepository).singleton(),
    });
  });

  it("should create entity", async () => {
    // Seed mock data
    const mockRepo =
      container.resolve<MyEntityRepository>("myEntityRepository");
    await mockRepo.seed({ id: "123", name: "Test" });

    // Resolve use case with auto-wired dependencies
    const useCase = container.resolve(CreateMyEntityUseCase);
    const result = await useCase.execute({ name: "Test" });

    expect(result.isSuccess()).toBe(true);
  });
});
```

### Module Structure Pattern

```typescript
// packages/adapters/src/modules/ControllerModule.ts
import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

// Define tokens
export const CONTROLLER_TOKENS = {
  UserController: "userController",
} as const;

// Define module
export const ControllerModule: StaticModule = createStaticModule({
  name: "ControllerModule",
  imports: [RepositoryModule], // Import dependencies
  providers: {
    [CONTROLLER_TOKENS.UserController]: {
      factory: (cradle) => new UserController(cradle.userRepository),
      lifetime: Lifetime.SCOPED, // New instance per request
    },
  },
  exports: [CONTROLLER_TOKENS.UserController],
});

// Export Deps interface for injection
export interface ControllerModuleDeps {
  [CONTROLLER_TOKENS.UserController]: UserController;
  // ... other dependencies
}
```

### Scope Strategy

| Scope         | Use For                | Lifetime               |
| ------------- | ---------------------- | ---------------------- |
| **SINGLETON** | Repositories, services | One instance for app   |
| **SCOPED**    | Controllers, use cases | One per request        |
| **TRANSIENT** | Utilities, factories   | New instance each time |

```typescript
// Repository: Singleton (stateless, thread-safe)
providers: {
  userRepository: {
    factory: (cradle) => new PrismaUserRepository(cradle.prisma),
    lifetime: Lifetime.SINGLETON,
  },
}

// Controller: Scoped (request-scoped)
providers: {
  userController: {
    factory: (cradle) => new UserController(cradle.userRepository),
    lifetime: Lifetime.SCOPED,
  },
}
```

### DI Troubleshooting

**Issue: "Container not initialized"**

```typescript
// Ensure initialization before use
import { initializeContainer, AppModule } from "@mirai-app/frameworks/di";
initializeContainer([AppModule]);
```

**Issue: "Service not found"**

```typescript
// Check exports array
exports: ["myService"]; // Must export!

// Check parent module imports
imports: [MyModule]; // Must import!
```

**Issue: Type inference not working**

```typescript
// Use explicit type annotation
const repo = container.resolve<UserRepository>("userRepository");

// Or use ModuleDeps interface
class MyService {
  constructor(private deps: RepositoryModuleDeps) {}
}
```

### DI Documentation References

- [Full DI Guide](../../packages/frameworks/src/di/README.md)
- [DI Quick Start Cheat Sheet](../../.specs/templates/di-quick-start.md)
- [DI Migration Guide](../../.specs/templates/di-migration-guide.md)

---

## Common Patterns

### Creating a New Entity (DDD Flow)

```
1. Create domain entity
   ├─ packages/domain/src/entities/MyEntity.ts
   └─ packages/domain/src/entities/MyEntity.test.ts

2. Define repository interface
   └─ packages/use-cases/src/ports/MyEntityRepository.ts

3. Create use case
   ├─ packages/use-cases/src/interactors/CreateMyEntity.ts
   └─ packages/use-cases/src/interactors/CreateMyEntity.test.ts

4. Implement repository
   ├─ packages/adapters/src/gateways/PrismaMyEntityRepository.ts
   └─ packages/adapters/src/mappers/MyEntityMapper.ts

5. Create controller
   └─ packages/adapters/src/controllers/my-entity-controller.ts

6. Wire in app
   └─ apps/backend-server/src/routers/myEntity.ts
```

### Adding a New Use Case

```typescript
// 1. Define input DTO
// packages/use-cases/src/dto/input/DoSomethingInput.ts
export class DoSomethingInput {
  constructor(
    public readonly entityId: string,
    public readonly newValue: string,
  ) {}
}

// 2. Define output DTO
// packages/use-cases/src/dto/output/SomethingResultDTO.ts
export class SomethingResultDTO {
  constructor(
    public readonly id: string,
    public readonly status: string,
  ) {}

  static fromDomain(entity: MyEntity): SomethingResultDTO {
    return new SomethingResultDTO(entity.id, entity.status);
  }
}

// 3. Create use case
// packages/use-cases/src/interactors/DoSomething.ts
export class DoSomethingUseCase {
  constructor(private entityRepo: MyEntityRepository) {}

  async execute(
    input: DoSomethingInput,
  ): Promise<Result<SomethingResultDTO, string>> {
    const entity = await this.entityRepo.findById(input.entityId);
    if (!entity) {
      return err("Entity not found");
    }

    const updated = entity.updateSomething(input.newValue);
    if (updated.isError()) {
      return err(updated.error);
    }

    const saved = await this.entityRepo.save(updated.value);
    return ok(SomethingResultDTO.fromDomain(saved));
  }
}

// 4. Test first!
// packages/use-cases/src/interactors/DoSomething.test.ts
```

### Implementing a Repository

```typescript
// 1. Interface in use-cases
// packages/use-cases/src/ports/UserRepository.ts
export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: UserId): Promise<void>;
}

// 2. Implementation in adapters
// packages/adapters/src/gateways/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(user: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email.value,
        createdAt: user.createdAt,
      },
    });
    return UserMapper.toDomain(record);
  }

  // ... other methods
}
```

### Writing Tests for Each Layer

**Domain Layer Test:**

```typescript
import { describe, it, expect } from "bun:test";
import { User } from "./User";

describe("User", () => {
  it("should create with valid email", () => {
    // Pure test - no mocks needed
    const result = User.create({ email: "test@example.com" });
    expect(result.isSuccess()).toBe(true);
  });
});
```

**Use Case Test:**

```typescript
import { describe, it, expect, mock } from "bun:test";
import { CreateUserUseCase } from "./CreateUser";

describe("CreateUserUseCase", () => {
  it("should create and return DTO", async () => {
    const mockRepo = {
      findByEmail: mock(() => Promise.resolve(null)),
      create: mock(() =>
        Promise.resolve({ id: "1", email: "test@example.com" }),
      ),
    };

    const useCase = new CreateUserUseCase(mockRepo as any);
    const result = await useCase.execute({ email: "test@example.com" });

    expect(result.isSuccess()).toBe(true);
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
```

**Adapter Test:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PrismaUserRepository } from "./PrismaUserRepository";

describe("PrismaUserRepository", () => {
  let repo: PrismaUserRepository;
  let testDb: TestPrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    repo = new PrismaUserRepository(testDb);
  });

  it("should persist to database", async () => {
    const user = User.create({ email: "test@example.com" });
    const saved = await repo.create(user.value);
    expect(saved.id).toBeDefined();
  });

  afterAll(async () => {
    await testDb.cleanUp();
  });
});
```

---

## Test Execution

### Running Tests

The monorepo supports separate execution of unit tests and integration tests for faster feedback cycles.

#### Available Commands

| Command                | Purpose                    | When to Use                               |
| ---------------------- | -------------------------- | ----------------------------------------- |
| `bun test`             | Run all tests              | Full test suite validation                |
| `bun test:unit`        | Run only unit tests        | Quick logic validation during development |
| `bun test:integration` | Run only integration tests | Validate external service interactions    |

#### Package-Level Commands

Each package has appropriate test scripts based on its test composition:

**100% Unit packages** (domain, use-cases, auth, shared, backend-server, notification-sender, seed):

```bash
cd packages/domain && bun run test:unit    # Runs all tests
```

**100% Integration packages** (db, supabase):

```bash
cd packages/db && bun run test:integration    # Runs all tests
```

**Mixed packages** (adapters, trpc, web):

```bash
cd packages/adapters && bun run test:unit         # Runs tests tagged with [UNIT]
cd packages/adapters && bun run test:integration  # Runs tests tagged with [INTEGRATION]
```

#### Test Tagging Convention

Tests are categorized using Bun's test name filtering:

- `[UNIT]` - Tests for pure business logic with no external dependencies
- `[INTEGRATION]` - Tests requiring external services (database, APIs)

Example:

```typescript
// Unit test (pure logic)
describe("[UNIT] User entity", () => { ... })

// Integration test (requires database)
describe("[INTEGRATION] PrismaUserRepository", () => { ... })
```

#### CI Pipeline

The CI runs tests in sequential order with fail-fast behavior:

1. `test-unit` job runs first
2. `test-integration` job runs only if unit tests pass
3. `test-native` job runs Jest tests for the native app

---

## Troubleshooting

### dependency-cruiser Violations

**Symptom:** CI fails with dependency-cruiser error

**Resolution:**

1. Run `bunx dependency-cruiser --validate .dependency-cruiser.cjs .`
2. Identify the violating import
3. Move import to correct layer OR add exception if legitimate
4. **Never** add exception for domain layer violations

### Test Coverage Failures

**Symptom:** CI fails with coverage threshold error

**Resolution:**

1. Run `bun test --coverage` locally
2. Identify uncovered lines
3. Add tests for uncovered code
4. If legacy code, document as technical debt and focus on new code

### Layer Boundary Confusion

**Symptom:** Unsure where to place new code

**Decision tree:**

1. Pure business logic? → Domain
2. Orchestrates domain objects? → Use Cases
3. Connects to external systems? → Adapters
4. Framework configuration? → Frameworks

**Anti-pattern indicators:**

- Importing `PrismaClient` in domain → Move to adapters
- Using `TRPCError` in use cases → Move to adapters
- Business logic in router → Move to use cases
- Repository implementation in domain → Move to adapters

---

## Skill Reference

Available skills for this codebase:

| Skill                    | Path                                       | Use Case                  |
| ------------------------ | ------------------------------------------ | ------------------------- |
| sdd:add-task             | `.agents/skills/sdd-add-task/`             | Create new specification  |
| sdd:plan                 | `.agents/skills/sdd-plan/`                 | Refine task specification |
| sdd:implement            | `.agents/skills/sdd-implement/`            | Execute implementation    |
| sadd:launch-sub-agent    | `.agents/skills/sadd-launch-sub-agent/`    | Execute with subagent     |
| sadd:do-and-judge        | `.agents/skills/sadd-do-and-judge/`        | Execute with retry        |
| sadd:judge               | `.agents/skills/sadd-judge/`               | Evaluate work             |
| kaizen:why               | `.agents/skills/kaizen-why/`               | Root cause analysis       |
| kaizen:plan-do-check-act | `.agents/skills/kaizen-plan-do-check-act/` | PDCA cycle                |

---

## Emergency Contacts

If stuck on:

- **Architecture decisions** → Check CLAUDE.md DDD section
- **Testing approach** → Check TESTING.md
- **Task workflow** → Check `.specs/workflows/sdd-workflow.md`
- **Build issues** → Run `bun install` and `bun run build`
- **CI failures** → Check `.github/workflows/ci.yml`

---

**Last Updated:** 2026-04-09
**Version:** 1.0.2

---

## Recent Kaizen Improvements

### Repository Standardization ✅

**Completed:** 2026-04-09  
**Status:** 13 of 16 repositories standardized (81% - exceeded 60% target)

**Key Results:**

- 540+ lines of duplicated CRUD boilerplate eliminated
- 34% average code reduction per repository
- Pattern institutionalized via `BasePrismaRepository` base class
- Pattern documented in `packages/adapters/README.md`
- Refactoring guide: `packages/adapters/REPOSITORY_REFACTORING.md`

**Intentionally Excluded:**

- `PrismaActivityFeedRepository` (complex polymorphic requirements)
- `PrismaNotificationScheduleRepository` (deferred to dedicated cycle)

**Next Opportunities:**

- Complete NotificationSchedule refactoring
- Create repository code generator
- Address test coverage gaps
