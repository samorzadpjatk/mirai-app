# Team Training Session: awilix-modular Dependency Injection

> **Session outline and materials for DI knowledge transfer**
> Duration: 45-60 minutes | Audience: Backend developers working with Mirai App

---

## Session Overview

### Learning Objectives

By the end of this session, team members will be able to:

1. ✅ Create a new repository with DI registration in < 10 minutes
2. ✅ Understand the difference between `createStaticModule()` and manual registration
3. ✅ Troubleshoot common DI issues independently
4. ✅ Write tests using the DI container

### Prerequisites

- Basic TypeScript knowledge
- Familiarity with Clean Architecture layers
- Local development environment set up (`bun install` complete)

### Materials Needed

- This training session outline
- [DI Cheat Sheet](./di-cheat-sheet.md)
- [DI FAQ](./di-faq.md)
- [DI Exercise](./di-exercise.md) (for post-session practice)
- Code editor with Mirai App codebase open

---

## Session Structure (45-60 minutes)

### 1. Introduction & Motivation (5 min)

#### Why DI? (The Problem)

```typescript
// BEFORE: Current pattern (boilerplate heavy)
export const userRouter = createTRPCRouter({
  getById: protectedProcedure.query(async ({ ctx, input }) => {
    const repo = new PrismaUserRepository(ctx.db); // Line 1
    const controller = new UserController(repo); // Line 2
    const useCase = new GetUserUseCase(repo); // Line 3
    return useCase.execute(input); // Line 4
  }),
});
```

**Problems:**

- Repeated in 100+ procedures
- Manual mocking in every test
- No lifecycle management
- Transaction coordination is manual

#### The Solution

```typescript
// AFTER: With DI (clean, minimal)
export const userRouter = createTRPCRouter({
  getById: protectedProcedure.query(async ({ ctx, input }) => {
    const controller = ctx.container.resolve("userController");
    return controller.getById(input);
  }),
});
```

**Benefits:**

- -70% boilerplate in routers
- Easy test mocking via module override
- Automatic lifecycle management
- Request-scoped transactions

---

### 2. Key Benefits of awilix-modular (5 min)

#### No Configuration Changes Required

```typescript
// Standard TypeScript setup works as-is:
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"
  }
}
// No DI-specific compiler flags required
```

**Key Message:** This is a major advantage - no risk of breaking existing TypeScript compilation.

#### Constructor-Based Injection

```typescript
// Repository convention in this codebase:
class UserController {
  constructor(private userRepository: UserRepository) {}
}
```

---

### 3. Live Demo: User Router Migration (15 min)

#### Demo Part 1: Before Migration

**File:** `apps/backend-server/src/routers/user.ts` (original)

Walk through the original code:

- Manual repository instantiation
- Manual controller instantiation
- Repeated pattern in every procedure

**Count the lines:** ~15 lines of boilerplate per procedure

#### Demo Part 2: Module Structure

**File:** `packages/adapters/src/modules/RepositoryModule.ts`

Show the four components:

1. Token definition (`REPOSITORY_TOKENS`)
2. Provider registration (`providers`)
3. Export list (`exports`)
4. Type interface (`RepositoryModuleDeps`)

**File:** `packages/adapters/src/modules/ControllerModule.ts`

Show controller registration:

- Importing RepositoryModule
- Use case injection
- Scoped lifetime

#### Demo Part 3: After Migration

**File:** `apps/backend-server/src/routers/user.ts` (migrated)

Live code the changes:

```typescript
// Step 1: Remove manual instantiation
- const repo = new PrismaUserRepository(ctx.db);
- const controller = new UserController(repo);

// Step 2: Add container resolution
+ const controller = ctx.container.resolve("userController");
```

**Count the reduction:** ~5 lines per procedure (67% reduction)

#### Demo Part 4: Testing with DI

**File:** Example test file

Show before/after test setup:

```typescript
// BEFORE: Manual mocking
const mockRepo = {
  findById: mock(() => Promise.resolve(user)),
  findByEmail: mock(() => Promise.resolve(null)),
  // ... must mock ALL methods
};
const useCase = new GetUserUseCase(mockRepo as any);

// AFTER: Container-based
const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});
const useCase = container.resolve(GetUserUseCase);
```

---

### 4. Hands-On Walkthrough: Create a Repository (15 min)

#### Exercise Goal

Create a new `NotificationPreferenceRepository` with full DI registration.

#### Step-by-Step (Live Coding Together)

**Step 1: Create the Repository Interface (1 min)**

```typescript
// packages/use-cases/src/ports/NotificationPreferenceRepository.ts
export interface NotificationPreferenceRepository {
  findByUserId(userId: string): Promise<NotificationPreference | null>;
  save(preference: NotificationPreference): Promise<NotificationPreference>;
}
```

**Step 2: Create the Implementation (3 min)**

```typescript
// packages/adapters/src/gateways/PrismaNotificationPreferenceRepository.ts
export class PrismaNotificationPreferenceRepository
  extends BasePrismaRepository
  implements NotificationPreferenceRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    const record = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    return record ? this.toDomain(record) : null;
  }

  async save(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    const record = await this.prisma.notificationPreference.upsert({
      where: { userId: preference.userId },
      create: this.toCreateInput(preference),
      update: this.toUpdateInput(preference),
    });
    return this.toDomain(record);
  }
}
```

**Step 3: Register in RepositoryModule (3 min)**

```typescript
// packages/adapters/src/modules/RepositoryModule.ts

// 1. Add token
export const REPOSITORY_TOKENS = {
  // ... existing tokens
  NotificationPreferenceRepository: "notificationPreferenceRepository",
} as const;

// 2. Add to providers
export const RepositoryModule = createStaticModule({
  providers: {
    // ... existing providers
    [REPOSITORY_TOKENS.NotificationPreferenceRepository]: {
      factory: (cradle) =>
        new PrismaNotificationPreferenceRepository(cradle.prisma),
      lifetime: Lifetime.SINGLETON,
    },
  },
  exports: [
    // ... existing exports
    REPOSITORY_TOKENS.NotificationPreferenceRepository,
  ],
});

// 3. Update interface
export interface RepositoryModuleDeps {
  // ... existing deps
  [REPOSITORY_TOKENS.NotificationPreferenceRepository]: NotificationPreferenceRepository;
}

// 4. Re-export
export { PrismaNotificationPreferenceRepository } from "../gateways/PrismaNotificationPreferenceRepository";
```

**Step 4: Verify Resolution (2 min)**

Create a quick test to verify:

```typescript
// Quick verification test
describe("NotificationPreferenceRepository DI", () => {
  it("should resolve from container", () => {
    const container = createContainer();
    container.register({ prisma: asValue(mockPrisma) });

    // Apply RepositoryModule providers
    // ... module registration

    const repo = container.resolve("notificationPreferenceRepository");
    expect(repo).toBeInstanceOf(PrismaNotificationPreferenceRepository);
  });
});
```

**Step 5: Use in a Router (2 min)**

```typescript
// apps/backend-server/src/routers/notification.ts
export const notificationRouter = createTRPCRouter({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const controller = ctx.container.resolve("notificationController");
    return controller.getPreferences(ctx.user.id);
  }),
});
```

#### Review (2 min)

- Recap the 4-step pattern
- Emphasize consistency with existing repositories
- Answer questions

---

### 5. Troubleshooting Common Issues (10 min)

#### Issue 1: "Service not found"

**Symptom:** `AwilixResolutionError: Could not resolve 'xxx'`

**Common Causes:**

1. Not exported from module
2. Typo in token name
3. Module not imported by parent

**Demo:** Show the error, then fix by adding to `exports` array.

```typescript
// ❌ Missing export
exports: []; // Empty!

// ✅ Correct
exports: [REPOSITORY_TOKENS.MyRepository];
```

#### Issue 2: "Container not initialized"

**Symptom:** Error at runtime when trying to resolve

**Fix:** Ensure initialization before first use:

```typescript
// In app entry point or test setup
import { initializeContainer, AppModule } from "@mirai-app/frameworks/di";
initializeContainer([AppModule]);
```

#### Issue 3: Circular Dependencies

**Symptom:** `AwilixResolutionError: Circular dependency detected`

**Fix:** Refactor to break the cycle:

```typescript
// ❌ Circular: A depends on B, B depends on A
// ✅ Solution: Use interface abstraction
// ✅ Solution: Extract common dependency to third service
```

#### Issue 4: Wrong Lifetime Scope

**Symptom:** State leaking between requests or performance issues

**Demo:** Show singleton vs scoped behavior

```typescript
// ❌ Wrong: Stateful service as singleton
providers: {
  requestTracker: {
    factory: () => new RequestTracker(),  // Holds request state!
    lifetime: Lifetime.SINGLETON,  // Wrong!
  },
}

// ✅ Correct: Scoped for request-specific state
providers: {
  requestTracker: {
    factory: () => new RequestTracker(),
    lifetime: Lifetime.SCOPED,  // New instance per request
  },
}
```

---

### 6. When to Use `createStaticModule()` vs Manual (5 min)

#### Decision Matrix

| Scenario                           | Use                                 | Example                |
| ---------------------------------- | ----------------------------------- | ---------------------- |
| New repository/controller/use case | `createStaticModule()`              | Standard DI            |
| One-off test override              | Manual `container.register()`       | Mock injection         |
| Legacy code during migration       | Manual (temporarily)                | Maintain compatibility |
| Cross-cutting utility              | `createStaticModule()` with factory | Logger, metrics        |

#### Key Principle

**Prefer `createStaticModule()` for production code** - it's the established pattern. No decorators needed.

**Manual registration is for:**

- Test setup
- Temporary workarounds
- Dynamic registration (rare)

---

### 7. Q&A and Wrap-up (5 min)

#### Common Questions to Address

1. **"How do I migrate my existing feature?"**
   - Answer: Follow the 4-step repository pattern or 3-step router pattern from the demo.

2. **"What if I need to inject multiple repositories?"**
   - Answer: Use the cradle object - it has all registered dependencies.

3. **"Can I still use manual instantiation for complex cases?"**
   - Answer: Yes, during migration. But prefer DI for new code.

4. **"How do I test code that uses DI?"**
   - Answer: Use `createTestContainer()` and override with mocks.

5. **"What if I get stuck?"**
   - Answer: See [DI Support Guide](./di-support-guide.md)

#### Post-Session Action Items

1. **Individual Exercise:** Complete [DI Exercise](./di-exercise.md) - Migrate a simple router
2. **Team Practice:** Schedule pair-programming for first DI migration
3. **Documentation:** Add DI pattern notes to your feature's README

---

## Speaker Notes

### Key Talking Points

1. **Emphasize the "no tsconfig changes" benefit** - this reduces risk significantly
2. **Show actual before/after line counts** - numbers are convincing
3. **Demonstrate testing benefits** - easier mocking is a big win
4. **Address concerns early** - acknowledge migration effort but show gradual path

### Demo Tips

- Have the files open in tabs before starting
- Use split-screen to show before/after side-by-side
- Keep terminal visible for live test running
- Have a "cheat sheet" tab open for quick reference

### Common Resistance Points

| Concern                    | Response                                                   |
| -------------------------- | ---------------------------------------------------------- |
| "More complex than manual" | Show line count reduction - it's actually simpler          |
| "Learning curve"           | Provide cheat sheet, FAQ, and exercise                     |
| "Migration effort"         | Gradual migration supported, pilots prove pattern          |
| "Performance overhead"     | Measure: <5% overhead, often faster due to singleton reuse |

---

## Follow-Up Materials

### Immediate (Post-Session)

- [DI Cheat Sheet](./di-cheat-sheet.md) - Print or bookmark
- [DI FAQ](./di-faq.md) - Reference for common questions
- [DI Exercise](./di-exercise.md) - Hands-on practice

### Ongoing

- [DI Support Guide](./di-support-guide.md) - How to get help
- `packages/frameworks/src/di/README.md` - Full technical guide
- Example migrations: User, Challenge, Trip routers

---

## Session Feedback Form

Collect feedback to improve future sessions:

1. Was the session duration appropriate? (Too short/Just right/Too long)
2. Was the hands-on exercise helpful? (1-5)
3. Do you feel confident creating a DI-registered repository? (1-5)
4. What additional topics would you like covered?
5. Any other feedback?

---

## Recording Checklist (For Async Distribution)

If recording for distributed team:

- [ ] Screen recording software tested
- [ ] Audio quality verified (use microphone)
- [ ] Code font size increased (14pt+)
- [ ] Terminal visible for test runs
- [ ] Sections clearly introduced with titles
- [ ] Chapter markers at each section
- [ ] Subtitles/captions added
- [ ] Recording uploaded to shared location
- [ ] Link distributed with materials

---

_Last Updated: 2026-04-09 | Session Version 1.0_
