# TESTING.md — Testing Best Practices (Promise Edition)

> **Testing source of truth for the MIRAI monorepo**  
> Aligns with **CLAUDE.md** and **AGENTS.md v1.0.3**  
> Stack: **TypeScript · awilix‑modular · Bun · Jest (native)**

---

## Overview

The MIRAI monorepo uses a **hybrid testing strategy**:

- **Bun test** — `packages/*`, `apps/web`, `apps/backend-server`, `apps/notification-sender`
- **Jest (jest‑expo)** — `apps/native` (Expo requirement)

**All code follows strict Test‑Driven Development (TDD).**

---

## Error‑handling model by layer

| Layer          | Error Model              | Async | Notes               |
| -------------- | ------------------------ | ----- | ------------------- |
| **Domain**     | `Either<DomainError, A>` | No    | Pure, deterministic |
| **Use Cases**  | Typed exceptions         | Yes   | Orchestration       |
| **Adapters**   | Exceptions               | Yes   | Integration         |
| **Frameworks** | Exceptions               | Yes   | Wiring only         |

**Avoid `Result<T,E>` and string errors.**

---

## TDD Workflow (Red–Green–Refactor)

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   RED   │───>│  GREEN  │───>│ REFACTOR│
│ (fails) │    │ (passes)│    │ (clean) │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┴──────────────┘
```

---

## Test infrastructure

- **Runner:** Bun (`bun:test`)
- **Coverage:** 80% lines, 75% branches (via `bunfig.toml`)
- **DOM:** Happy DOM (preloaded)
- **Native:** Jest + jest‑expo

```toml
[test]
preload = ["./happydom.ts"]
coverageThreshold = { lines = 0.80, branches = 0.75 }
```

---

## Domain layer tests (Either)

### Rules

- **Pure unit tests**
- **No mocks**
- **No async**
- **No DI**
- **No randomness**

### Example

```ts
import { describe, it, expect } from "bun:test";
import { User } from "./User";

describe("[UNIT] User (Domain)", () => {
  it("creates a user with a valid email", () => {
    const result = User.create({
      id: "user-1",
      email: "test@example.com",
      createdAt: new Date("2026-01-01"),
    });

    expect(result._tag).toBe("Right");
  });

  it("rejects an invalid email", () => {
    const result = User.create({
      id: "user-1",
      email: "invalid",
      createdAt: new Date(),
    });

    expect(result._tag).toBe("Left");
  });
});
```

---

## Use‑case tests (async + DI)

### Rules

- **Return `Promise`**
- **Use `async/await`**
- **Mock ports only**
- **Resolve via DI string tokens**

### Example

```ts
import { describe, it, expect, beforeEach } from "bun:test";
import { createTestContainer } from "@mirai-app/frameworks/di";
import { asClass } from "awilix";

describe("[UNIT] CreateUserUseCase", () => {
  let container: any;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      userRepository: asClass(InMemoryUserRepository).singleton(),
      createUserUseCase: asClass(CreateUserUseCase).scoped(),
    });
  });

  it("creates a user", async () => {
    const useCase = container.resolve("createUserUseCase");
    const user = await useCase.execute({ email: "test@example.com" });

    expect(user.email.value).toBe("test@example.com");
  });
});
```

---

## Adapter tests (integration)

### Rules

- **Real DB / SDKs**
- **No mocks**
- **Clean up after tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "bun:test";

describe("[INTEGRATION] PrismaUserRepository", () => {
  let repo: PrismaUserRepository;
  let db: TestPrismaClient;

  beforeAll(async () => {
    db = await createTestDatabase();
    repo = new PrismaUserRepository(db);
  });

  it("persists a user", async () => {
    const user = makeTestUser();
    const saved = await repo.create(user);
    expect(saved.id).toBeDefined();
  });

  afterAll(async () => {
    await db.cleanUp();
  });
});
```

---

## Framework tests

- **Minimal coverage (60%)**
- **Verify wiring only**
- **Skip framework internals**

---

## Testing patterns

### Pure functions

- No mocks
- Table‑driven tests
- Edge cases first

### External dependency mocking

- Type‑level stubs (`satisfies`)
- `mock.module()` at package boundaries only

### Async & timers (Bun)

- Real timers
- Short waits
- Clean up intervals

### React hooks (Happy DOM)

- `@testing-library/react`
- Mock browser APIs
- SSR safety via code review + integration

### Zustand stores

- Direct store testing
- Reset state via `setState`

### Fastify utilities

- Type‑level mocks
- Realistic headers

---

## Mocking rules

| Layer         | Mocking            |
| ------------- | ------------------ |
| Domain        | ❌ Never           |
| Use Cases     | ✅ Ports only      |
| Adapters      | ❌ (use real deps) |
| Frameworks    | Minimal            |
| External APIs | Always             |

---

## Coverage targets

| Layer      | Target |
| ---------- | ------ |
| Domain     | 90%+   |
| Use Cases  | 85%+   |
| Adapters   | 75%+   |
| Frameworks | 60%+   |

**Domain has zero exemptions.**

---

## Anti‑patterns

- ❌ `Result<T,E>`
- ❌ String errors
- ❌ UUID generation in domain
- ❌ Effect‑based APIs
- ❌ Mocking domain entities
- ❌ Testing framework behavior

---

## TDD checklist

### Before coding

- **Test exists**
- **Test fails**

### While coding

- **Minimal code**
- **All tests green**

### After

- **Refactor**
- **Add edge cases**
- **Verify coverage**

---

## Related documents

- **CLAUDE.md** — Architecture & conventions
- **AGENTS.md v1.0.3** — Agent instructions
- **bunfig.toml** — Coverage thresholds
- **apps/native/jest.config.cjs** — Native testing config
- **.dependency-cruiser.mjs** — Layer enforcement

---

**Last Updated:** 2026‑04‑09  
**Version:** 3.0.1
