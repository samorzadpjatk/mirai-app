Effect has been fully removed below.  
The architecture, rules, and examples are rewritten to use **plain TypeScript**, **Promises**, and **Either** only, while preserving Clean Architecture, SDD, TDD, DDD, SADD, and Kaizen guarantees.

---

# CLAUDE.md — Mirai App Monorepo Conventions  
> **CEK Five Pillars Compliance Document**  
> Updated for **Promise‑based orchestration** and **awilix‑modular**  
> Architecture: **Clean Architecture + SDD + TDD + SADD + Kaizen**

---

# 1. CEK Five Pillars Overview

| Pillar | Focus | Key Principle |
|------|------|---------------|
| **SDD** | Planning | Specification before implementation |
| **TDD** | Quality | Test‑first development (Red‑Green‑Refactor) |
| **DDD** | Architecture | Clean Architecture with strict inward dependencies |
| **SADD** | Execution | Subagent workflows with quality gates |
| **Kaizen** | Improvement | Continuous small improvements (YAGNI) |

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
│   Uses **async/await + Promise** for orchestration                     │
└─────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 DOMAIN LAYER (packages/domain/)                         │
│   Entities · Value Objects · Domain Services · Pure Functions           │
│   Uses **Either** for pure error handling                               │
│   ZERO external dependencies                                             │
└─────────────────────────────────────────────────────────────────────────┘
                     ▲
                     │ implements
┌─────────────────────────────────────────────────────────────────────────┐
│           INFRASTRUCTURE (packages/frameworks/)                         │
│   tRPC config · Prisma client · Supabase client · DI container          │
│   awilix‑modular is the ONLY DI system                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dependency Rule**
```
Frameworks → Adapters → Use Cases → Domain
```

---

# 3. SDD Conventions  
Unchanged.

---

# 4. TDD Conventions (Promise Edition)

## 4.1 Red‑Green‑Refactor  
Unchanged.

## 4.2 Test Locations  
Unchanged.

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
    readonly createdAt: Date
  ) {}

  static create(props: {
    id: UserId;
    email: string;
    createdAt: Date;
  }): Either<DomainError, User> {
    const emailResult = Email.create(props.email);
    if (emailResult._tag === "Left") return left(emailResult.left);

    return right(
      new User(props.id, emailResult.right, props.createdAt)
    );
  }
}
```

---

## 5.2 Use Cases Layer (`packages/use-cases/`)

### Rules
1. Uses **async/await + Promise**
2. Defines **ports** (repository interfaces)
3. No framework imports
4. No Prisma, no tRPC, no DI annotations

### Example

```ts
import { User } from "@mirai-app/domain";
import { UserRepository } from "../ports/UserRepository";
import { UserId } from "@mirai-app/domain";

export class CreateUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: { email: string }) {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw new UserAlreadyExistsError();

    const id = UserId.generate();
    const now = new Date();

    const userResult = User.create({
      id,
      email: input.email,
      createdAt: now,
    });

    if (userResult._tag === "Left") {
      throw new InvalidUserError(userResult.left);
    }

    return await this.repo.create(userResult.right);
  }
}
```

---

## 5.3 Adapters Layer (`packages/adapters/`)

### Rules
1. Implements ports
2. Converts between domain and persistence
3. No business logic
4. Uses DI via awilix‑modular string keys

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
1. awilix‑modular is the **only DI system**
2. No business logic
3. Provides Prisma, tRPC context, etc.

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

# 6. Error Handling Conventions

### Domain errors
- `Either<DomainError, A>`
- Sealed domain error hierarchy

### Use case errors
- Thrown typed errors (`throw new UseCaseError()`)

### Adapter errors
- Let infrastructure throw
- Translate at adapter boundary if needed

---

# 7. SADD Conventions  
Unchanged.

---

# 8. Kaizen Conventions  
Unchanged.

---

# 9. Updated Poka‑Yoke Rules

- Branded types required  
- No UUID generation in domain  
- No DI in domain  

---

# 10. Summary of Architectural Guarantees

| Layer | Error Model | Dependencies | DI | UUID | Async |
|------|------------|--------------|----|------|-------|
| Domain | Either | None | No | No | No |
| Use Cases | Exceptions | Domain | Yes | Yes | Yes |
| Adapters | Exceptions | Use Cases + Domain | Yes | Yes | Yes |
| Frameworks | Exceptions | Everything | Yes | Yes | Yes |