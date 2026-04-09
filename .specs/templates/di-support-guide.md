# DI Support Guide

> **How to get help with awilix-modular dependency injection**
> For team members working with Mirai App DI patterns

---

## Support Channels

### 1. Immediate Resources (Self-Service)

Start here for fastest resolution:

| Resource           | Use When            | Link/Location                          |
| ------------------ | ------------------- | -------------------------------------- |
| **DI Cheat Sheet** | Quick syntax lookup | `.specs/templates/di-cheat-sheet.md`   |
| **DI FAQ**         | Common questions    | `.specs/templates/di-faq.md`           |
| **DI Exercise**    | Practice patterns   | `.specs/templates/di-exercise.md`      |
| **Full DI Guide**  | Deep understanding  | `packages/frameworks/src/di/README.md` |

### 2. Code Examples (Reference Implementations)

Working examples in the codebase:

| Component            | Location                                                 | Pattern Demonstrated           |
| -------------------- | -------------------------------------------------------- | ------------------------------ |
| **User Router**      | `apps/backend-server/src/routers/user.ts`                | Container resolution in router |
| **UserController**   | `packages/adapters/src/controllers/user-controller.ts`   | Controller with DI             |
| **RepositoryModule** | `packages/adapters/src/modules/RepositoryModule.ts`      | Module definition              |
| **ControllerModule** | `packages/adapters/src/modules/ControllerModule.ts`      | Multi-dependency injection     |
| **DI Test Example**  | `packages/use-cases/src/interactors/__tests__/*.test.ts` | Testing with DI                |

### 3. Team Support

If self-service doesn't resolve your issue:

| Channel                       | Use For                            | Response Time        |
| ----------------------------- | ---------------------------------- | -------------------- |
| **#di-support Slack**         | Quick questions, clarifications    | < 2 hours            |
| **Team Standup**              | Blockers, pattern discussion       | Daily                |
| **Pair Programming**          | Complex migrations, learning       | Schedule 30 min      |
| **Architecture Office Hours** | Design decisions, module structure | Weekly (Fridays 2pm) |

---

## Issue Escalation Path

```
Level 1: Self-Service (5 min)
    ↓ Check Cheat Sheet, FAQ, examples
    ↓ Not resolved?
Level 2: Slack #di-support (async, 2 hours)
    ↓ Post question with code snippet
    ↓ Not resolved?
Level 3: Pair Programming (30 min scheduled)
    ↓ Book time with DI-experienced teammate
    ↓ Not resolved?
Level 4: Architecture Office Hours (weekly)
    ↓ Complex design decisions
    ↓ Pattern gaps discovered
```

---

## How to Ask for Help

### Good Support Request

```
**Context:** Migrating ChallengeController to DI
**File:** packages/adapters/src/modules/ControllerModule.ts
**Problem:** Getting "AwilixResolutionError: Could not resolve 'challengeController'"
**Tried:**
- Added token to CONTROLLER_TOKENS
- Registered in providers
- Added to exports array
**Code snippet:**
[Minimal code showing the issue]
**Question:** What am I missing in the registration?
```

### Poor Support Request

```
DI isn't working. Help?
```

### Template for Slack #di-support

```markdown
**DI Issue:** [Brief description]
**Context:** [What you're trying to do]
**Error:** [Exact error message or behavior]
**Files:** [Relevant file paths]
**Code:**
\`\`\`typescript
// Minimal reproduction
\`\`\`
**Tried:** [What you've already attempted]
```

---

## Common Issue Quick Fixes

### "Container not initialized"

```typescript
// ✅ Fix: Ensure initialization before first use
import { initializeContainer, AppModule } from "@mirai-app/frameworks/di";

// In your test setup or app entry
initializeContainer([AppModule]);
```

### "Could not resolve 'xxx'"

Checklist (in order):

1. ✅ Token defined in `XXX_TOKENS`
2. ✅ Provider registered in `providers`
3. ✅ Token in `exports` array
4. ✅ Parent module imports this module
5. ✅ No typo in token name (check case)

### "Circular dependency detected"

```typescript
// ❌ Problem: A → B → A
// ✅ Solution 1: Refactor to use interface
interface IA { ... }
class A implements IA { ... }
class B { constructor(a: IA) {} }  // Depends on interface

// ✅ Solution 2: Extract shared dependency
class C { ... }
class A { constructor(c: C) {} }
class B { constructor(c: C) {} }
```

### "Property 'container' does not exist on type 'xxx'"

```typescript
// ✅ Fix: Ensure proper TRPCContext type
import type { TRPCContext } from "@mirai-app/trpc/context";

// Or cast explicitly
const container = (ctx as TRPCContext).container;
```

---

## DI Office Hours

### Schedule

- **When:** Fridays, 2:00-3:00 PM
- **Where:** Conference Room B / Zoom link in calendar
- **Format:** Open discussion, first-come-first-served

### Appropriate Topics

- ✅ Design decisions for new modules
- ✅ Complex dependency graphs
- ✅ Pattern standardization discussions
- ✅ Migration strategy planning
- ✅ Tooling/IDE integration issues

### Not Appropriate Topics

- ❌ Basic syntax questions (see FAQ first)
- ❌ Code review requests (use PR process)
- ❌ General TypeScript questions
- ❌ Non-DI related issues

---

## Documentation Feedback

### How to Report Documentation Issues

If you find:

- **Outdated information** → Create PR with update
- **Missing topic** → Open issue with suggestion
- **Unclear explanation** → Comment in Slack #di-support
- **Error in code example** → PR with fix immediately

### Documentation Improvement Process

```
1. Identify gap or error
2. Check if issue already reported
3. For errors: Submit PR directly
4. For gaps: Discuss in #di-support, then PR
5. Tag @team-lead for review
```

---

## Knowledge Base (Common Solutions)

### Solution 1: Testing with Multiple Mocks

```typescript
// When you need to mock multiple repositories
describe("ComplexUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createContainer();

    // Register multiple mocks
    container.register({
      userRepository: asClass(InMemoryUserRepository).singleton(),
      tripRepository: asClass(InMemoryTripRepository).singleton(),
      notificationService: asClass(MockNotificationService).singleton(),
    });
  });

  it("should coordinate multiple repos", async () => {
    // Seed multiple repos
    const userRepo = container.resolve<UserRepository>("userRepository");
    const tripRepo = container.resolve<TripRepository>("tripRepository");

    await userRepo.seed(createMockUser({ id: "user-1" }));
    await tripRepo.seed(createMockTrip({ ownerId: "user-1" }));

    // Resolve use case with all deps auto-wired
    const useCase = container.resolve(ComplexUseCase);
    const result = await useCase.execute({ userId: "user-1" });

    expect(result.isSuccess()).toBe(true);
  });
});
```

### Solution 2: Conditional Registration

```typescript
// Register different implementations based on environment
const isTest = process.env.NODE_ENV === "test";

container.register({
  emailService: isTest
    ? asClass(MockEmailService).singleton()
    : asClass(SendGridEmailService).singleton(),
});
```

### Solution 3: Factory Pattern with DI

```typescript
// When you need a factory that uses DI dependencies
providers: {
  createUserWithWelcome: asFunction((cradle) => {
    return async (input: CreateUserInput) => {
      // Use DI-resolved dependencies
      const user = await cradle.userRepository.create(input);
      await cradle.emailService.sendWelcomeEmail(user.email);
      return user;
    };
  }).scoped(),
}
```

---

## Team Contacts

### DI Subject Matter Experts

| Name           | Expertise                      | Best For                             |
| -------------- | ------------------------------ | ------------------------------------ |
| [Team Lead]    | Architecture, complex patterns | Design decisions, blockers           |
| [Senior Dev A] | Repository patterns            | Repository registration, testing     |
| [Senior Dev B] | Controller patterns            | Controller setup, use case injection |
| [Senior Dev C] | tRPC integration               | Router migration, context issues     |

### Onboarding Buddy

New team members: Pair with an SME for your first DI migration.

**First Migration Checklist:**

- [ ] Schedule 30-min pairing session
- [ ] Pick a simple repository (follow User pattern)
- [ ] Complete together with SME guidance
- [ ] SME reviews your second solo migration

---

## Feedback Collection

### Continuous Improvement

We track DI adoption and friction points:

| Metric           | How We Track             | Target   |
| ---------------- | ------------------------ | -------- |
| DI adoption rate | % of new code using DI   | > 90%    |
| Support requests | #di-support messages     | < 5/week |
| Migration time   | Time to DI-enable a repo | < 15 min |
| Test setup time  | Time to write DI test    | < 5 min  |

### Providing Feedback

**After your first DI migration, please share:**

1. What went smoothly?
2. What was confusing?
3. What documentation gaps did you find?
4. How long did it take?
5. Would you feel confident doing another solo?

**Share in:** Slack #di-support with tag `@feedback`

---

## Escalation for Critical Issues

### Critical Issue Definition

Critical = Blocks production deployment or affects multiple team members

Examples:

- Container initialization fails in production
- Memory leaks from DI scoping
- Type errors affecting entire codebase
- Performance degradation > 10%

### Escalation Path

```
1. Immediate: Post in #di-support with @here + "CRITICAL"
2. If no response in 30 min: DM Team Lead
3. If still blocked: Escalate to Engineering Manager
4. Document resolution for knowledge base
```

---

## Resources Index

### Quick Links

| Resource           | Path                                      |
| ------------------ | ----------------------------------------- |
| Cheat Sheet        | `.specs/templates/di-cheat-sheet.md`      |
| FAQ                | `.specs/templates/di-faq.md`              |
| Exercise           | `.specs/templates/di-exercise.md`         |
| Training Session   | `.specs/templates/di-training-session.md` |
| Full Guide         | `packages/frameworks/src/di/README.md`    |
| This Support Guide | `.specs/templates/di-support-guide.md`    |

### Video Recordings

| Recording                  | Link   | Description              |
| -------------------------- | ------ | ------------------------ |
| DI Training Session        | [Link] | Full team walkthrough    |
| User Router Migration Demo | [Link] | Step-by-step migration   |
| Testing with DI            | [Link] | Mock and container setup |

---

## Success Metrics for Team Enablement

### Definition of "Enabled"

Team member is enabled when they can:

- ✅ Create a DI-registered repository in < 15 minutes
- ✅ Migrate a simple router to DI without guidance
- ✅ Write tests using DI container
- ✅ Troubleshoot common issues independently

### Tracking Enablement

| Team Member | Exercise Complete | First Solo Migration | Enabled Status |
| ----------- | ----------------- | -------------------- | -------------- |
| [Name]      | ✅                | ✅                   | ✅ Enabled     |
| [Name]      | ✅                | ⏳                   | 🔄 In Progress |
| [Name]      | ⏳                | -                    | 📋 Not Started |

---

_Last Updated: 2026-04-09 | Support Guide Version 1.0_
