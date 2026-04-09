# Dependency Injection (DI) - Frequently Asked Questions

> **Common questions and answers for awilix-modular DI patterns**
> For quick reference, see: `.specs/templates/di-cheat-sheet.md`

---

## General Questions

### Q1: Why do we use awilix-modular in this repo?

**A:** Three key reasons:

1. **No DI-specific tsconfig changes** - Works with the repo's standard TypeScript configuration.
2. **Constructor-based injection** - Dependencies are explicit in constructors.
3. **Automatic type inference** - awilix-modular infers types from module definitions, eliminating manual service identifier strings.

See full comparison in `packages/frameworks/src/di/README.md`.

---

### Q2: Do I need to modify tsconfig.json to use DI?

**A:** **No!** DI works with the repository's standard compiler settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

awilix-modular works with your existing TypeScript configuration.

---

### Q3: What's the difference between `createStaticModule()` and manual `container.register()`?

**A:** Both register dependencies, but with different scope and ergonomics:

```typescript
// App-level module composition (preferred)
export const RepositoryModule = createStaticModule({
  providers: { ... },
  exports: [ ... ],
});

// Local test override (common in tests)
container.register({
  userRepository: asValue(mockUserRepository),
});
```

**When to use which:**

- Use `createStaticModule()` for production code
- Use manual `container.register()` only in tests for quick overrides

**Historical note:** Previous DI implementations used `@Module()` decorators. The current awilix-modular approach uses `createStaticModule()` which requires no decorators.

---

### Q4: Can I mix DI and manual instantiation in the same codebase?

**A:** Yes, during migration. The pilot repositories (User, Challenge, Group) work with both patterns:

```typescript
// Old way still works (backward compatible)
const repo = new PrismaUserRepository(prisma);

// New way (preferred)
const repo = container.resolve("userRepository");
```

**Recommendation:** Migrate routers to DI gradually. All new code should use DI.

---

## Container & Resolution

### Q5: How do I resolve a dependency in a tRPC router?

**A:** Use `ctx.container.resolve()`:

```typescript
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve from request-scoped container
      const controller = ctx.container.resolve("userController");
      return controller.getById(input);
    }),
});
```

The container is automatically created per-request in `createTRPCContext`.

---

### Q6: What's the difference between `container.resolve()` and constructor injection?

**A:**

- **`container.resolve()`** - Used at resolution point (routers, tests) to get an instance
- **Constructor injection** - How classes declare their dependencies

```typescript
// Constructor injection (declares needs)
class UserController {
  constructor(private userRepository: UserRepository) {}
}

// Container resolution (provides instance)
const controller = ctx.container.resolve("userController");
// Repository was auto-injected during resolution
```

---

### Q7: Why can't I find `container` on `ctx`?

**A:** Ensure you're using the updated `TRPCContext` type:

```typescript
// In your router file, make sure this import is present
import type { TRPCContext } from "@mirai-app/trpc/context";

// The context type should include:
interface TRPCContext {
  db: PrismaClient;
  container: AwilixContainer; // This is the DI container
  // ... other props
}
```

If `container` is missing, check that `createTRPCContext` is updated (Step 9 in implementation).

---

### Q8: How do I create a child container for a specific request?

**A:** Child containers are created automatically in `createTRPCContext`:

```typescript
// This happens automatically per request
const childContainer = rootContainer.createScope();
childContainer.register({ prisma: asValue(db) });
```

You typically don't need to create child containers manually - the tRPC context handles it.

---

## Module Definition

### Q9: What's the minimum I need to register a new repository?

**A:** Four things in `RepositoryModule.ts`:

```typescript
// 1. Token definition
export const REPOSITORY_TOKENS = {
  MyRepository: "myRepository", // Add your token
} as const;

// 2. Provider registration
export const RepositoryModule = createStaticModule({
  providers: {
    [REPOSITORY_TOKENS.MyRepository]: {
      factory: (cradle) => new PrismaMyRepository(cradle.prisma),
      lifetime: Lifetime.SINGLETON,
    },
  },
  exports: [REPOSITORY_TOKENS.MyRepository], // 3. Export it!
});

// 4. Type interface
export interface RepositoryModuleDeps {
  [REPOSITORY_TOKENS.MyRepository]: MyRepository;
}
```

---

### Q10: Why do I need both `providers` and `exports`?

**A:**

- **`providers`** - Registers the class with the container
- **`exports`** - Makes it available to other modules

Without `exports`, the provider is only available within the same module:

```typescript
createStaticModule({
  providers: { myService: MyService }, // Registered
  exports: [], // Not available to other modules! ❌
});

createStaticModule({
  providers: { myService: MyService }, // Registered
  exports: ["myService"], // Available to importers ✅
});
```

---

### Q11: How do I inject one service into another within the same module?

**A:** Use the `cradle` object - it contains all registered dependencies:

```typescript
createStaticModule({
  providers: {
    logger: asClass(Logger).singleton(),
    userService: {
      factory: (cradle) => new UserService(cradle.logger), // Inject logger
      lifetime: Lifetime.SINGLETON,
    },
  },
});
```

---

### Q12: What's the correct order for module imports?

**A:** Follow the dependency graph (outer → inner):

```typescript
// RepositoryModule doesn't import other modules (bottom of stack)
export const RepositoryModule = createStaticModule({
  imports: [],  // No imports - repositories are base
  providers: { ... },
});

// UseCaseModule imports RepositoryModule
export const UseCaseModule = createStaticModule({
  imports: [RepositoryModule],  // Needs repositories
  providers: { ... },
});

// ControllerModule imports UseCaseModule
export const ControllerModule = createStaticModule({
  imports: [UseCaseModule],  // Needs use cases
  providers: { ... },
});

// AppModule imports everything
export const AppModule = createStaticModule({
  imports: [ControllerModule, UseCaseModule, RepositoryModule],
});
```

---

## Lifetime & Scoping

### Q13: When should I use SINGLETON vs SCOPED vs TRANSIENT?

**A:**

| Scope         | Use When                                     | Examples                             |
| ------------- | -------------------------------------------- | ------------------------------------ |
| **SINGLETON** | Stateless, expensive to create, thread-safe  | Repositories, PrismaClient, services |
| **SCOPED**    | Request-specific state, transaction boundary | Controllers, use cases               |
| **TRANSIENT** | Always fresh instance, no shared state       | Factories, utilities                 |

```typescript
// Repository: Singleton (stateless, holds DB reference)
userRepository: {
  factory: (cradle) => new PrismaUserRepository(cradle.prisma),
  lifetime: Lifetime.SINGLETON,
}

// Controller: Scoped (request-specific)
userController: {
  factory: (cradle) => new UserController(cradle.userRepository),
  lifetime: Lifetime.SCOPED,
}

// ID Generator: Transient (fresh each time)
idGenerator: {
  factory: () => new IdGenerator(),
  lifetime: Lifetime.TRANSIENT,
}
```

---

### Q14: What happens if I use the wrong scope?

**A:**

| Wrong Choice                    | Consequence                     |
| ------------------------------- | ------------------------------- |
| Singleton for stateful service  | State leaks between requests ⚠️ |
| Scoped for stateless repo       | Unnecessary overhead (minor)    |
| Transient for expensive service | Performance degradation ⚠️      |

**Rule of thumb:** Start with SINGLETON, switch to SCOPED if you need request isolation.

---

### Q15: How do I handle per-request transactions?

**A:** Use request-scoped (SCOPED) containers with transaction-wrapped Prisma:

```typescript
// In createTRPCContext
const childContainer = rootContainer.createScope();
childContainer.register({
  prisma: asValue(prisma.$extends({  // Transaction-wrapped
    query: { ... },
  })),
});
```

All SCOPED dependencies get the same transaction-wrapped Prisma instance.

---

## Testing

### Q16: How do I mock a repository in tests?

**A:** Override the registration with an in-memory mock:

```typescript
import { createContainer, asClass } from "awilix";
import { InMemoryUserRepository } from "./mocks/InMemoryUserRepository";

describe("UserUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createContainer();
    container.register({
      userRepository: asClass(InMemoryUserRepository).singleton(),
    });
  });

  it("should work", async () => {
    const useCase = container.resolve(CreateUserUseCase);
    // Test with mock...
  });
});
```

---

### Q17: Can I use DI with existing tests that manually instantiate?

**A:** Yes - both patterns work. You can gradually migrate tests:

```typescript
// Old way (still works)
it("should create user", async () => {
  const mockRepo = { create: mock(() => Promise.resolve(user)) };
  const useCase = new CreateUserUseCase(mockRepo as any);
  // ...
});

// New way (preferred)
it("should create user", async () => {
  const container = createTestContainer();
  const useCase = container.resolve(CreateUserUseCase);
  // ...
});
```

---

### Q18: How do I seed data in mock repositories?

**A:** Add a seed method to your in-memory mock:

```typescript
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async seed(user: User): Promise<void> {
    this.users.push(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }
}

// In test
const mockRepo = container.resolve<UserRepository>("userRepository");
await mockRepo.seed(createMockUser({ id: "123" }));
```

---

### Q19: Should I test the DI container itself?

**A:** Yes - add a container resolution test for each module:

```typescript
// RepositoryModule.test.ts
describe("RepositoryModule", () => {
  it("should resolve all repositories", async () => {
    const container = createContainer();
    container.register({ prisma: asValue(mockPrisma) });

    // Apply module
    const module = RepositoryModule;
    // ... register module providers

    expect(() => container.resolve("userRepository")).not.toThrow();
    expect(() => container.resolve("challengeRepository")).not.toThrow();
    // ... test all 16
  });
});
```

---

## Error Handling

### Q20: What does "AwilixResolutionError: Could not resolve" mean?

**A:** The container couldn't find a provider for the requested token. Common causes:

1. **Not registered** - Missing from `providers`
2. **Not exported** - Missing from `exports` array
3. **Wrong token** - Typo in token name
4. **Module not imported** - Parent module doesn't import the module

**Debug steps:**

```typescript
// 1. Check registrations
console.log(container.registrations);

// 2. Check cradle contents
console.log(Object.keys(container.cradle));
```

---

### Q21: "Circular dependency detected" - how do I fix it?

**A:** Redesign to break the cycle. Example:

```typescript
// ❌ Circular: A → B → A
class A { constructor(b: B) {} }
class B { constructor(a: A) {} }

// ✅ Broken with interface abstraction
interface IA { ... }
class A implements IA { constructor(b: B) {} }
class B { constructor(a: IA) {} }  // Depends on interface, not concrete
```

Use dependency-cruiser to detect cycles: `bunx dependency-cruiser --validate .`

---

### Q22: TypeScript says property 'resolve' does not exist on type...

**A:** Check your imports and type definitions:

```typescript
// ✅ Correct
import { AwilixContainer } from "awilix";
const controller = (ctx.container as AwilixContainer).resolve("userController");

// Or ensure TRPCContext is properly typed
interface TRPCContext {
  container: AwilixContainer; // Explicit type
}
```

---

## Migration & Legacy Code

### Q23: I'm adding a new feature - should I use DI or manual instantiation?

**A:** Use DI for all new code. The pilot migrations (User, Challenge, Group) prove the pattern works.

```typescript
// ✅ New code - use DI
export const myRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx, input }) => {
    const controller = ctx.container.resolve("myController");
    return controller.create(input);
  }),
});

// ❌ Don't do this for new code
const repo = new PrismaMyRepository(ctx.db);
const controller = new MyController(repo);
```

---

### Q24: How do I migrate an existing router to DI?

**A:** Follow this 3-step pattern (shown in Step 10 - User Router migration):

```typescript
// 1. Before: Manual instantiation
.query(async ({ ctx, input }) => {
  const repo = new PrismaUserRepository(ctx.db);
  const controller = new UserController(repo);
  return controller.getById(input);
})

// 2. Register controller in ControllerModule.ts
export const ControllerModule = createStaticModule({
  imports: [UseCaseModule],
  providers: {
    userController: {
      factory: (cradle) => new UserController(cradle.getUserUseCase),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["userController"],
});

// 3. After: Container resolution
.query(async ({ ctx, input }) => {
  const controller = ctx.container.resolve("userController");
  return controller.getById(input);
})
```

---

### Q25: Can I gradually migrate or does it need to be all at once?

**A:** Gradual migration is supported. The approach:

1. **Phase 1:** Infrastructure (container, modules) - done
2. **Phase 2:** Pilot repositories (3 done)
3. **Phase 3:** Pilot routers (3 done)
4. **Phase 4:** Remaining 13 repositories + 14 routers (future work)

Each migrated component works alongside non-migrated ones.

---

## Best Practices

### Q26: What's the token naming convention?

**A:** Use camelCase, descriptive, suffix matches component type:

| Component  | Good             | Bad                      |
| ---------- | ---------------- | ------------------------ |
| Repository | `userRepository` | `UserRepo`, `user_repo`  |
| Use Case   | `getUserUseCase` | `GetUser`, `use_case`    |
| Controller | `userController` | `UserCtrl`, `controller` |

---

### Q27: Should I export the token constants or use strings directly?

**A:** Export constants for type safety and refactoring:

```typescript
// ✅ Use constants
import { REPOSITORY_TOKENS } from "@mirai-app/adapters/modules";
const repo = container.resolve(REPOSITORY_TOKENS.UserRepository);

// ❌ Avoid magic strings (prone to typos)
const repo = container.resolve("userRepository");
```

---

### Q28: How do I document DI patterns for my feature?

**A:** Add a README in your module directory:

```markdown
# User Module

## DI Registration

- Repository: `REPOSITORY_TOKENS.UserRepository`
- Use Cases: `GetUserUseCase`, `CreateUserUseCase`
- Controller: `CONTROLLER_TOKENS.UserController`

## Usage

\`\`\`typescript
const controller = ctx.container.resolve(CONTROLLER_TOKENS.UserController);
\`\`\`
```

---

## Advanced Topics

### Q29: Can I use factory patterns with DI?

**A:** Yes, use `asFunction` for factories:

```typescript
import { asFunction } from "awilix";

providers: {
  createUser: asFunction((cradle) => {
    return (input: CreateUserInput) => {
      const useCase = cradle.createUserUseCase;
      return useCase.execute(input);
    };
  }).transient(),
}
```

---

### Q30: How do I handle optional dependencies?

**A:** Make constructor parameter optional or use a default:

```typescript
class UserService {
  constructor(
    private userRepository: UserRepository,
    private logger?: Logger,  // Optional
  ) {}
}

// In module
providers: {
  userService: {
    factory: (cradle) => new UserService(
      cradle.userRepository,
      cradle.logger,  // May be undefined
    ),
  },
}
```

---

## Getting Help

### Still have questions?

1. 📖 Read the full guide: `packages/frameworks/src/di/README.md`
2. 🧪 Try the exercise: `.specs/templates/di-exercise.md`
3. 🔍 Check examples: User, Challenge, Group router migrations
4. 💬 See support guide: `.specs/templates/di-support-guide.md`

---

_Last Updated: 2026-04-09 | 30 Questions Answered_
