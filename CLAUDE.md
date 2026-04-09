Effect no longer exists in this codebase.
The architecture, rules, and examples now use **plain TypeScript**, **Promises**, and **Either**, while preserving Clean Architecture, SDD, TDD, DDD, SADD, and Kaizen guarantees.

---

# CLAUDE.md — Mirai App Monorepo Conventions

> **CEK Five Pillars Compliance Document**  
> Updated for **Promise‑based orchestration** and **awilix‑modular**  
> Architecture: **Clean Architecture + SDD + TDD + SADD + Kaizen**

---

# 1. CEK Five Pillars Overview

| Pillar     | Focus        | Key Principle                                      |
| ---------- | ------------ | -------------------------------------------------- |
| **SDD**    | Planning     | Specifications precede implementations             |
| **TDD**    | Quality      | Test‑first development (Red‑Green‑Refactor)        |
| **DDD**    | Architecture | Clean Architecture with strict inward dependencies |
| **SADD**   | Execution    | Subagent workflows with quality gates              |
| **Kaizen** | Improvement  | Continuous small improvements (YAGNI)              |

---

# 2. Clean Architecture (Promise Edition)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (Apps)                            │
│        native / web / backend — tRPC, UI, routing                       │
└─────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              INTERFACE ADAPTERS (packages/adapters/)                    │
│   Controllers (tRPC) · Gateways (Repositories) · Presenters · Mappers   │
└─────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (packages/use-cases/)                    │
│   Interactors (Use Cases) · Ports (Interfaces) · DTOs · Errors          │
│   **async/await + Promise** orchestrates use cases                     │
└─────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 DOMAIN LAYER (packages/domain/)                         │
│   Entities · Value Objects · Domain Services · Pure Functions           │
│   **Either** handles pure errors                                        │
│   ZERO external dependencies                                             │
└─────────────────────────────────────────────────────────────────────────┘
                     ▲
                     │ implements
┌─────────────────────────────────────────────────────────────────────────┐
│           INFRASTRUCTURE (packages/frameworks/)                         │
│   tRPC config · Prisma client · Supabase client · DI container          │
│   awilix‑modular serves as the ONLY DI system                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dependency Rule**

```
Frameworks → Adapters → Use Cases → Domain
```

---

# 3. SDD Conventions

No changes.

---

# 4. TDD Conventions (Promise Edition)

## 4.1 Red‑Green‑Refactor

No changes.

## 4.2 Test Locations

No changes.

## 4.3 Async Testing Rules

### Domain tests

- Pure functions
- Use `Either`
- No async
- No DI

```ts
import { Either } from "effect/Either";
```

### Use case tests

- Use `async/await`
- Mock ports via awilix‑modular test container

```ts
const result = await useCase.execute(input);
```

### Adapter tests

- Integration tests
- Real Prisma test DB or test doubles

---

# 5. DDD Conventions

## 5.1 Domain Layer (`packages/domain/`)

### Rules

1. **Pure TypeScript only**
2. **No external dependencies**
3. **No DI**
4. **No UUID generation**
5. **Use `Either` for all domain errors**

### Example

```ts
import { Either, left, right } from "effect/Either";
import { Email } from "../value-objects/Email";
import { UserId } from "../value-objects/UserId";

export class User {
  private constructor(
    readonly id: UserId,
    readonly email: Email,
    readonly createdAt: Date,
  ) {}

  static create(props: {
    id: UserId;
    email: string;
    createdAt: Date;
  }): Either<DomainError, User> {
    const emailResult = Email.create(props.email);
    if (emailResult._tag === "Left") return left(emailResult.left);

    return right(new User(props.id, emailResult.right, props.createdAt));
  }
}
```

---

### Result<T, E> Type

The domain layer uses `Result<T, E>` for explicit error handling:

```typescript
import { Result, ok, err, isOk, isErr } from "../types/Result";

export class MyEntity {
  static create(props: {...}): Result<MyEntity, ValidationError> {
    if (invalid) return err(new ValidationError("..."));
    return ok(new MyEntity(...));
  }
}

// Usage:
const result = MyEntity.create(props);
if (isOk(result)) {
  return result.value; // MyEntity
} else {
  return result.error; // ValidationError
}
```

**Pattern:** Call `ok()` and `err()` helpers to create results. Call `isOk()` and `isErr()` to check.

---

## 5.2 Use Cases Layer (`packages/use-cases/`)

### Rules

1. Use **async/await + Promise**
2. Define **ports** (repository interfaces)
3. No framework imports
4. No Prisma, no tRPC, no DI annotations

### Example

```typescript
// packages/use-cases/src/interactors/CreateUser.ts
import { User, Result, ok, err } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";

export class UserAlreadyExistsError extends Error {
  readonly _tag = "UserAlreadyExistsError";
}

export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: {
    email: string;
  }): Promise<Result<User, UserAlreadyExistsError>> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      return err(new UserAlreadyExistsError());
    }

    const userResult = User.create({ email: input.email });
    if (userResult.kind === "err") {
      return err(userResult.error);
    }

    const saved = await this.userRepo.create(userResult.value);
    return ok(saved);
  }
}
```

---

## 5.3 Adapters Layer (`packages/adapters/`)

### Rules

1. Implement ports
2. Convert between domain and persistence
3. No business logic
4. Use DI via awilix‑modular string keys

### Example

```ts
export class PrismaUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

---

## 5.4 Frameworks Layer (`packages/frameworks/`)

### Rules

1. awilix‑modular serves as the **only DI system**
2. No business logic
3. Provide Prisma, tRPC context, etc.

### DI Example

```ts
export const RepositoryModule = createStaticModule({
  name: "RepositoryModule",
  providers: {
    userRepository: PrismaUserRepository,
  },
  exports: ["userRepository"],
});
```

### Resolution

```ts
const useCase = container.resolve("createUserUseCase");
```

---

## 5.5 Authentication & Authorization Patterns

### New Pattern (Post-Refactoring)

Controllers now handle authentication. tRPC middleware no longer manages it:

```
Client Request (Authorization: Bearer <token>)
    ↓
Controller (TokenExtractor.extract from headers)
    ↓
Use Case (AuthenticateUserUseCase)
    ↓
Port (AuthPort) → Adapter (SupabaseAuthAdapter)
    ↓
AuthContext returned
```

### Controller Pattern

```typescript
import {
  requireAuth,
  requireAdmin,
} from "@mirai-app/adapters/controller-helpers";

export class MyController {
  async getData(input: GetDataInput, di: DIContext) {
    // 1. Extract and validate auth at controller level
    const authContext = await requireAuth(di.headers, di);

    // 2. Pass AuthContext explicitly to use cases
    return await this.useCase.execute({ ...input, authContext });
  }

  async adminOnly(input: AdminInput, di: DIContext) {
    // Throws TRPCError FORBIDDEN if not admin
    const authContext = await requireAdmin(di.headers, di);
    // ...
  }
}
```

### AuthContext Value Object

```typescript
import { AuthContext, UserRole } from "@mirai-app/domain";

// Created by use cases, passed to controllers
authContext.userId; // Branded UserId type
authContext.role; // UserRole.USER | MODERATOR | ADMIN
authContext.email; // User email
authContext.isAdmin(); // Helper: role === ADMIN
authContext.isModerator(); // Helper: role === MODERATOR || ADMIN
```

### Authorization Use Cases

```typescript
// Check admin role
const result = authorizeAdminUseCase.execute({ authContext });
if (isErr(result)) {
  // Permission denied - user is not admin
}

// Check moderator (includes admins)
const result = authorizeModeratorUseCase.execute({ authContext });
```

### Result<T,E> from Auth Use Cases

```typescript
const result = await authenticateUserUseCase.execute({ token });
if (isOk(result)) {
  return result.value; // AuthContext
} else {
  // Handle: InvalidTokenError, SessionExpiredError, etc.
}
```

---

# 6. Error Handling Conventions

### Domain errors

- `Result<T, DomainError>` (using `ok()`, `err()` helpers)
- `isOk()` / `isErr()` for checking results
- Never throw exceptions in domain

### Use case errors

- Return `Result<T, Error>` for expected failures
- Throw typed exceptions only for unexpected errors

### Adapter errors

- Translate domain Result to framework errors (e.g., TRPCError)

---

# 7. SADD Conventions

No changes.

---

# 8. Kaizen Conventions

No changes.

---

# 9. Updated Poka‑Yoke Rules

- Branded types required
- No UUID generation in domain
- No DI in domain

---

# 10. Summary of Architectural Guarantees

| Layer      | Error Model         | Dependencies       | DI  | UUID | Async |
| ---------- | ------------------- | ------------------ | --- | ---- | ----- |
| Domain     | Result<T,E>         | None               | No  | No   | No    |
| Use Cases  | Result + Exceptions | Domain             | Yes | Yes  | Yes   |
| Adapters   | Exceptions          | Use Cases + Domain | Yes | Yes  | Yes   |
| Frameworks | Exceptions          | Everything         | Yes | Yes  | Yes   |
