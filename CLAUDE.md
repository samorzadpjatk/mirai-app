# CLAUDE.md - Mirai App Monorepo Conventions

> **CEK Five Pillars Compliance Document**
>
> This document defines the conventions, patterns, and workflows for the Mirai App monorepo following the CEK Execution Model:
>
> - **SDD**: Specification-Driven Development
> - **TDD**: Test-Driven Development
> - **DDD**: Domain-Driven Design (Clean Architecture)
> - **SADD**: Subagent-Driven Development
> - **Kaizen**: Continuous Improvement

---

## Table of Contents

1. [CEK Five Pillars Overview](#cek-five-pillars-overview)
2. [SDD Conventions](#sdd-conventions)
3. [TDD Conventions](#tdd-conventions)
4. [DDD Conventions](#ddd-conventions)
5. [SADD Conventions](#sadd-conventions)
6. [Kaizen Conventions](#kaizen-conventions)
7. [Code Style Guide](#code-style-guide)

---

## CEK Five Pillars Overview

The CEK Execution Model provides a structured approach to software development that emphasizes:

| Pillar     | Focus        | Key Principle                               |
| ---------- | ------------ | ------------------------------------------- |
| **SDD**    | Planning     | Specification before implementation         |
| **TDD**    | Quality      | Test-first development (Red-Green-Refactor) |
| **DDD**    | Architecture | Clean Architecture with domain at center    |
| **SADD**   | Execution    | Subagent workflows with quality gates       |
| **Kaizen** | Improvement  | Continuous small improvements (YAGNI)       |

### Clean Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (Apps)                              │
│              ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│              │  native  │  │   web    │  │ backend  │                   │
│              └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│                   │             │             │                          │
│                   ▼             ▼             ▼                          │
├─────────────────────────────────────────────────────────────────────────┤
│              INTERFACE ADAPTERS (packages/adapters/)                      │
│         ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│         │ Controllers │  │  Gateways   │  │ Presenters  │                │
│         │   (tRPC)    │  │(Repository) │  │   (DTOs)    │                │
│         └──────┬──────┘  └──────┬──────┘  └─────────────┘                │
│                │                │                                        │
│                ▼                │ depends on                             │
├───────────────────────────────┼─────────────────────────────────────────┤
│              APPLICATION LAYER│(packages/use-cases/)                     │
│         ┌─────────────┐       │  ┌─────────────┐                        │
│         │ Interactors │◄──────┘  │   Ports     │                        │
│         │ (Use Cases) │         │(Interfaces) │                        │
│         └──────┬──────┘         └──────┬──────┘                        │
│                │                       │                                 │
│                ▼                       │ depends on                      │
├───────────────────────────────────────┼─────────────────────────────────┤
│                 DOMAIN LAYER          │(packages/domain/)               │
│         ┌─────────────┐               │  ┌─────────────┐              │
│         │  Entities   │◄──────────────┘  │Value Objects│              │
│         │   (Pure)    │                  │   (Pure)    │              │
│         └─────────────┘                  └─────────────┘              │
│                                                                        │
│  ZERO EXTERNAL DEPENDENCIES - Only pure TypeScript                     │
└─────────────────────────────────────────────────────────────────────────┘
         ▲
         │ implements
┌────────┴─────────────────────────────────────────────────────────────────┐
│           INFRASTRUCTURE (packages/frameworks/)                          │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│    │    tRPC     │  │   Prisma    │  │  Supabase   │                 │
│    │   Config    │  │   Client    │  │   Client    │                 │
│    └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘

DEPENDENCY RULE: Frameworks → Adapters → Use Cases → Domain
                 (Dependencies point INWARD only)
```

---

## SDD Conventions

### Specification-Driven Development

Every feature, refactor, or significant change must start with a specification.

### Task Workflow Structure

```
.specs/
├── tasks/
│   ├── draft/          # Initial ideas, brainstorming
│   ├── todo/           # Ready for implementation
│   ├── in-progress/    # Currently being worked on
│   └── done/           # Completed and verified
├── workflows/
│   ├── sdd-workflow.md      # SDD process documentation
│   └── task-lifecycle.md    # State machine definition
└── templates/
    ├── feature-spec.md      # Feature specification template
    └── bug-report.md        # Bug report template
```

### State Transitions

| From        | To          | Trigger                 | Requirements                                    |
| ----------- | ----------- | ----------------------- | ----------------------------------------------- |
| DRAFT       | TODO        | Refinement complete     | Complete specification with acceptance criteria |
| TODO        | IN-PROGRESS | Work starts             | Dependencies resolved                           |
| IN-PROGRESS | DONE        | Implementation complete | All criteria met, verified                      |

### Acceptance Criteria Format

Use **Given-When-Then** format:

```markdown
Given [context]
When [action occurs]
Then [expected result]
```

Example:

```markdown
Given a user is authenticated
When they request their profile
Then the profile data is returned with 200 status
```

### Required Specification Sections

Every task must include:

1. **Description** - Why needed, what it does, scope boundaries
2. **Acceptance Criteria** - Measurable completion criteria
3. **Architecture Overview** (for structural changes):
   - Current state
   - Target state
   - Migration strategy
4. **Implementation Process** - Step-by-step with:
   - Agent assignments (haiku/sonnet/opus)
   - Execution dependencies
   - Verification criteria
5. **Definition of Done** - Completion checklist

### Quality Gates by Task Type

| Task Type                | Verification Level | Threshold |
| ------------------------ | ------------------ | --------- |
| Documentation            | Single Judge       | 4.0/5.0   |
| Package Structure        | Single Judge       | 4.0/5.0   |
| Feature Implementation   | Single Judge       | 4.0/5.0   |
| Domain Entity Extraction | Panel of 2 Judges  | 4.5/5.0   |
| Critical Business Logic  | Panel of 2 Judges  | 4.5/5.0   |

---

## TDD Conventions

### Test-Driven Development

All code must be written using the **Red-Green-Refactor** cycle.

### Red-Green-Refactor Cycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   RED   │───>│  GREEN  │───>│ REFACTOR│
│ (fails) │    │ (passes)│    │ (clean) │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┴──────────────┘
              (repeat)
```

#### RED: Write Failing Test

1. Write a test that describes the desired behavior
2. Run the test - it should FAIL
3. The test failure validates the test is working

#### GREEN: Write Minimal Code to Pass

1. Write the simplest code that makes the test pass
2. Don't worry about elegance - just pass the test
3. Run tests - all should pass

#### REFACTOR: Improve the Code

1. Clean up while keeping tests passing
2. Remove duplication
3. Improve names
4. Run tests - must still pass

### Test File Locations

| Layer      | Location     | Pattern                    |
| ---------- | ------------ | -------------------------- |
| Domain     | Co-located   | `*.test.ts` next to source |
| Use Cases  | Co-located   | `*.test.ts` next to source |
| Adapters   | `__tests__/` | `__tests__/*.test.ts`      |
| Frameworks | `__tests__/` | `__tests__/*.test.ts`      |
| Apps       | `__tests__/` | `__tests__/*.test.ts`      |

Example:

```
packages/domain/src/entities/
├── User.ts
└── User.test.ts          # Co-located with source

packages/adapters/src/gateways/
├── PrismaUserRepository.ts
└── __tests__/
    └── PrismaUserRepository.test.ts
```

### Coverage Thresholds

Enforced in CI via `bunfig.toml`:

| Metric    | Threshold | Notes                 |
| --------- | --------- | --------------------- |
| Lines     | 80%       | Minimum line coverage |
| Branches  | 75%       | Decision coverage     |
| Functions | 80%       | Function coverage     |

**Layer-Specific Targets:**

| Layer      | Target Coverage | Rationale                    |
| ---------- | --------------- | ---------------------------- |
| Domain     | 90%+            | Pure functions, easy to test |
| Use Cases  | 85%+            | Orchestration logic          |
| Adapters   | 75%+            | Integration tests            |
| Frameworks | 60%+            | Configuration mostly         |

### Test-First Requirements

| Scenario     | Requirement                                    |
| ------------ | ---------------------------------------------- |
| New Features | Test written BEFORE implementation             |
| Bug Fixes    | Regression test written BEFORE fix             |
| Refactoring  | Characterization tests written BEFORE refactor |

### Mocking Guidelines

**Bun Test (`packages/*`, `apps/web`, `apps/backend-server`):**

```typescript
// Use mock.module() for module mocking
import { mock } from "bun:test";

mock.module("@repo/db", () => ({
  prisma: mockPrisma,
}));
```

**Jest (`apps/native`):**

```typescript
// Use __mocks__/ directory for manual mocks
// apps/native/__mocks__/@repo/db.ts
export const prisma = mockPrisma;
```

### Test Patterns by Layer

#### Domain Layer Tests

```typescript
// Pure unit tests, no mocks needed
import { describe, it, expect } from "bun:test";
import { User } from "./User";

describe("User", () => {
  it("should create user with valid email", () => {
    const user = User.create({ email: "user@example.com" });
    expect(user.email.value).toBe("user@example.com");
  });

  it("should reject invalid email", () => {
    expect(() => User.create({ email: "invalid" })).toThrow(
      "Invalid email format",
    );
  });
});
```

#### Use Case Layer Tests

```typescript
// Mock repositories (ports)
import { describe, it, expect, mock } from "bun:test";
import { CreateUserUseCase } from "./CreateUser";

describe("CreateUser", () => {
  it("should create user and return DTO", async () => {
    const mockRepo = {
      create: mock(() =>
        Promise.resolve({ id: "1", email: "user@example.com" }),
      ),
    };
    const useCase = new CreateUserUseCase(mockRepo);

    const result = await useCase.execute({ email: "user@example.com" });

    expect(result.isSuccess()).toBe(true);
    expect(result.value.email).toBe("user@example.com");
  });
});
```

#### Adapter Layer Tests

```typescript
// Integration tests with real dependencies
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PrismaUserRepository } from "./PrismaUserRepository";

describe("PrismaUserRepository", () => {
  let repository: PrismaUserRepository;

  beforeAll(async () => {
    // Setup test database
    repository = new PrismaUserRepository(testPrisma);
  });

  it("should persist user to database", async () => {
    const user = User.create({ email: "test@example.com" });
    const saved = await repository.create(user);

    expect(saved.id).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

---

## DDD Conventions

### Domain-Driven Design (Clean Architecture)

The codebase follows **Clean Architecture** with 4 concentric layers.

### Layer Structure

```
packages/
├── domain/          # Innermost layer - pure business logic
├── use-cases/       # Application orchestration layer
├── adapters/        # Interface adapters layer
└── frameworks/      # Outermost layer - framework configuration
```

### Domain Layer (`packages/domain/`)

**Responsibility:** Pure business logic, zero external dependencies

**Contents:**

- `entities/` - Domain entities with business rules
- `value-objects/` - Immutable value objects
- `domain-services/` - Pure domain operations
- `repositories/` - Repository INTERFACES (not implementations)
- `utils/` - Pure utility functions

**Rules:**

1. ZERO framework dependencies
2. NO I/O operations
3. NO external imports except other domain modules
4. Pure TypeScript/JavaScript only

**Example:**

```typescript
// packages/domain/src/entities/User.ts
import { Email } from "../value-objects/Email";
import { Result, ok, err } from "../utils/result";

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly createdAt: Date,
  ) {}

  static create(props: { email: string }): Result<User, string> {
    const emailResult = Email.create(props.email);
    if (emailResult.isError()) {
      return err(emailResult.error);
    }

    return ok(new User(crypto.randomUUID(), emailResult.value, new Date()));
  }
}
```

### Use Cases Layer (`packages/use-cases/`)

**Responsibility:** Application orchestration, defines repository interfaces

**Contents:**

- `ports/` - Repository interfaces and external service interfaces
- `interactors/` - Use case implementations
- `dto/` - Input/output data transfer objects
- `errors/` - Use case specific errors

**Rules:**

1. Only depends on Domain layer
2. Orchestrates domain entities
3. NO knowledge of UI, DB, or frameworks
4. Defines repository interfaces (ports)

**Example:**

```typescript
// packages/use-cases/src/ports/UserRepository.ts
export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

// packages/use-cases/src/interactors/CreateUser.ts
import { UserRepository } from "../ports/UserRepository";
import { User } from "@repo/domain";

export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<Result<UserDTO, string>> {
    // Check if user exists
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      return err("User already exists");
    }

    // Create domain entity
    const userResult = User.create({ email: input.email });
    if (userResult.isError()) {
      return err(userResult.error);
    }

    // Persist
    const saved = await this.userRepo.create(userResult.value);

    // Return DTO
    return ok(UserDTO.fromDomain(saved));
  }
}
```

### Adapters Layer (`packages/adapters/`)

**Responsibility:** Bridge between use cases and external frameworks

**Contents:**

- `controllers/` - tRPC routers (thin controllers)
- `gateways/` - Repository implementations
- `presenters/` - Response formatters
- `mappers/` - Domain <-> DTO conversions

**Rules:**

1. Implements repository interfaces from use cases
2. Converts data formats
3. NO business logic - only adaptation
4. Depends on Domain and Use Cases

**Example:**

```typescript
// packages/adapters/src/gateways/PrismaUserRepository.ts
import { UserRepository } from "@repo/use-cases";
import { User } from "@repo/domain";

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
}

// packages/adapters/src/controllers/user-controller.ts
// Thin tRPC router - only routing, no business logic
export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const useCase = ctx.container.resolve(CreateUserUseCase);
      const result = await useCase.execute(input);

      if (result.isError()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.value;
    }),
});
```

### Frameworks Layer (`packages/frameworks/`)

**Responsibility:** Framework-specific configuration

**Contents:**

- `trpc/` - tRPC client and server configuration
- `prisma/` - Prisma client configuration
- `fastify/` - Fastify server configuration
- `supabase/` - Supabase client configuration

**Rules:**

1. Contains framework-specific code only
2. Depends on all inner layers
3. NO business logic
4. Configuration and setup only

### Dependency Rule

**Dependencies must point INWARD only:**

```
Frameworks → Adapters → Use Cases → Domain
```

**Violation Example (DON'T DO THIS):**

```typescript
// ❌ WRONG: Domain importing from outside
// packages/domain/src/entities/User.ts
import { PrismaClient } from "@prisma/client"; // NEVER do this
```

### Error Handling with Result<T,E>

Use `Result<T,E>` type throughout for explicit error handling:

```typescript
// packages/domain/src/utils/result.ts
export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ kind: "ok", value });

export const err = <E>(error: E): Result<never, E> => ({ kind: "err", error });

export class ResultWrapper<T, E> {
  constructor(private result: Result<T, E>) {}

  isSuccess(): boolean {
    return this.result.kind === "ok";
  }
  isError(): boolean {
    return this.result.kind === "err";
  }
  get value(): T {
    return (this.result as any).value;
  }
  get error(): E {
    return (this.result as any).error;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.isSuccess() ? ok(fn(this.value)) : (this.result as any);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return this.isSuccess() ? fn(this.value) : (this.result as any);
  }
}
```

### Branded Types for Type Safety

Use branded types to prevent mixing up different IDs:

```typescript
// packages/domain/src/value-objects/UserId.ts
type UserId = string & { readonly brand: unique symbol };

export const UserId = {
  create(id: string): UserId {
    return id as UserId;
  },
  equals(a: UserId, b: UserId): boolean {
    return a === b;
  },
};

// Usage
const userId: UserId = UserId.create("uuid-123");
const challengeId: ChallengeId = ChallengeId.create("uuid-456");

// TypeScript prevents accidental mixing:
// userId === challengeId  // ❌ Compile error: different brands
```

---

## SADD Conventions

### Subagent-Driven Development

Use subagents to parallelize work and enforce quality through judge validation.

### Subagent Workflow Patterns

#### Pattern 1: Sequential Chain

For dependent tasks that must be done in order:

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Step 1  │───>│  Step 2  │───>│  Step 3  │
│ (Domain) │    │(Use Case)│    │(Adapter) │
└──────────┘    └──────────┘    └──────────┘
```

Use when:

- Inner layers must exist before outer layers
- Domain entity must be extracted before its use case

#### Pattern 2: Parallel Execution

For independent tasks that can be done simultaneously:

```
┌──────────┐
│  Step A  │
│ (Entity1)│
└────┬─────┘
     │
     │  parallel
     │
┌────▼─────┐
│  Step B  │
│ (Entity2)│
└────┬─────┘
     │
     │  both complete
     │
┌────▼─────┐
│  Step C  │
│(Combine) │
└──────────┘
```

Use when:

- Entities have no shared dependencies
- Documentation tasks independent of code

### Quality Gates

| Component Type | Judges    | Threshold | Retry Limit |
| -------------- | --------- | --------- | ----------- |
| Standard       | 1         | 4.0/5.0   | 2           |
| Critical       | 2 (panel) | 4.5/5.0   | 2           |
| Batch Items    | Per-item  | 4.0/5.0   | 2           |

### Judge Rubric Template

```markdown
#### Verification

**Level:** [Single Judge / Panel of 2 Judges]
**Threshold:** [4.0/5.0 or 4.5/5.0]

| Criterion     | Weight | Description        |
| ------------- | ------ | ------------------ |
| [Criterion 1] | 0.XX   | [What to evaluate] |
| [Criterion 2] | 0.XX   | [What to evaluate] |
| [Criterion 3] | 0.XX   | [What to evaluate] |
```

### Agent Selection Guide

| Agent      | Best For                                           | Rationale                            |
| ---------- | -------------------------------------------------- | ------------------------------------ |
| **haiku**  | Documentation, templates, simple structures        | Fast, cost-effective for clear tasks |
| **sonnet** | Package scaffolds, tooling, established patterns   | Good balance of speed and capability |
| **opus**   | Critical entity extraction, complex business logic | Maximum reasoning for critical code  |

### Retry Logic

```
Attempt 1 → Judge Evaluation
    │
    ├─ Pass → Done
    │
    └─ Fail → Feedback → Attempt 2
                    │
                    ├─ Pass → Done
                    │
                    └─ Fail → Feedback → Escalate
```

Max 2 retries per subagent. After 2 failures, escalate to team lead for re-analysis.

---

## Kaizen Conventions

### Continuous Improvement

Small, incremental improvements following YAGNI principles.

### YAGNI Principles

| Anti-Pattern          | Correction                  | Rule                            |
| --------------------- | --------------------------- | ------------------------------- |
| "I'll refactor later" | Refactor NOW                | While context is fresh          |
| "We might need this"  | Build only what's needed    | Add when actually needed        |
| "Too simple to test"  | Simple code breaks          | Test takes 30 seconds           |
| "This is temporary"   | Temporary becomes permanent | Build it right or not at all    |
| "I'll document later" | Document NOW                | While understanding is complete |

### Standardized Work Patterns

#### File Naming

| Type          | Pattern                    | Example                   |
| ------------- | -------------------------- | ------------------------- |
| Entities      | PascalCase.ts              | `User.ts`                 |
| Value Objects | PascalCase.ts              | `Email.ts`                |
| Use Cases     | PascalCase.ts              | `CreateUser.ts`           |
| Repositories  | PascalCase + Repository.ts | `PrismaUserRepository.ts` |
| Controllers   | kebab-case.ts              | `user-controller.ts`      |
| Tests         | \*.test.ts                 | `User.test.ts`            |
| Utils         | camelCase.ts               | `result.ts`               |

#### Directory Structure

```
packages/[layer]/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Public exports
    ├── [category]/
    │   ├── *.ts              # Source files
    │   └── *.test.ts         # Co-located tests
    └── __tests__/            # Integration tests
        └── *.test.ts
```

#### Error Handling

Use `Result<T,E>` everywhere:

```typescript
// Function signature
function parseEmail(input: string): Result<Email, string>;

// Usage
const result = parseEmail("user@example.com");

if (result.isError()) {
  console.error(result.error); // Handle error
} else {
  useEmail(result.value); // Use value
}

// Or with pattern matching
const value = result.match(
  (v) => v, // Success case
  (e) => {
    throw new Error(e);
  }, // Error case
);
```

### Poka-Yoke (Error-Proofing)

#### Branded Types

Prevent mixing up different types of IDs:

```typescript
type UserId = string & { readonly __brand: "UserId" };
type ChallengeId = string & { readonly __brand: "ChallengeId" };

// Compiler prevents:
const userId = "uuid-123" as UserId;
const challengeId = "uuid-456" as ChallengeId;

function getUser(id: UserId) { ... }

getUser(challengeId);  // ❌ Type error
```

#### Strict TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### dependency-cruiser Layer Enforcement

```javascript
// .dependency-cruiser.cjs
{
  forbidden: [
    // Domain cannot import from outside
    {
      name: "domain-purity",
      from: { path: "^packages/domain" },
      to: { pathNot: "^packages/domain" },
      severity: "error",
    },
    // Use cases can only import domain
    {
      name: "use-case-dependencies",
      from: { path: "^packages/use-cases" },
      to: { pathNot: "^packages/(domain|use-cases)" },
      severity: "error",
    },
  ],
}
```

### Improvement Metrics

Track these over time:

| Metric                  | Current | Target | Trend |
| ----------------------- | ------- | ------ | ----- |
| Test Coverage           | 75%     | 80%+   | 📈    |
| Domain Layer Violations | 12      | 0      | 📉    |
| Average Router Lines    | 500     | <50    | 📉    |
| Entities Extracted      | 0       | 12     | 📈    |

---

## Code Style Guide

### TypeScript Conventions

#### Naming

| Construct      | Convention                  | Example                       |
| -------------- | --------------------------- | ----------------------------- |
| Classes        | PascalCase                  | `User`, `CreateUserUseCase`   |
| Interfaces     | PascalCase with prefix      | `UserRepository`, `UserPort`  |
| Functions      | camelCase                   | `createUser`, `validateEmail` |
| Constants      | UPPER_SNAKE_CASE            | `MAX_RETRY_COUNT`             |
| Variables      | camelCase                   | `userId`, `isActive`          |
| Private fields | \_camelCase with underscore | `_id`, `_email`               |
| Type aliases   | PascalCase                  | `UserId`, `Result`            |
| Generics       | T, U, V or descriptive      | `T`, `TEntity`                |

#### Imports

Order: External → Internal (layer order) → Relative

```typescript
// 1. External dependencies
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

// 2. Inner layer dependencies (domain first)
import { User } from "@repo/domain";
import { UserRepository } from "@repo/use-cases";

// 3. Same layer dependencies
import { UserMapper } from "./mappers/UserMapper";

// 4. Relative imports (avoid if possible)
import { helper } from "../utils/helper";
```

#### Functions

```typescript
// Pure functions preferred
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Async functions
async function fetchUser(id: string): Promise<Result<User, Error>> {
  try {
    const user = await db.user.findById(id);
    return ok(user);
  } catch (error) {
    return err(error);
  }
}

// Avoid default exports
export function helper() {} // ✅ Named export
export default helper; // ❌ Avoid
```

#### Classes

```typescript
// Immutable entities (prefer)
export class User {
  private constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateUserProps): Result<User, string> {
    // Factory method
  }
}

// Use cases (single method)
export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<Result<UserDTO, string>> {
    // Implementation
  }
}
```

### Comments

```typescript
// Explain WHY, not WHAT
// ✅ Good: Explains business reason
// We subtract 1 because the user count starts at 0 in the legacy system
const displayCount = totalUsers - 1;

// ❌ Bad: Restates the obvious
// Increment i by 1
i++;

// Use JSDoc for public APIs
/**
 * Creates a new user in the system.
 * @param props - User creation properties
 * @returns Result containing either the User or an error message
 * @throws Never - all errors are returned via Result type
 */
static create(props: CreateUserProps): Result<User, string> {
  // ...
}
```

### Testing

```typescript
// Arrange-Act-Assert pattern
describe("User.create", () => {
  it("should create user with valid email", () => {
    // Arrange
    const email = "valid@example.com";

    // Act
    const result = User.create({ email });

    // Assert
    expect(result.isSuccess()).toBe(true);
    expect(result.value.email.value).toBe(email);
  });
});

// Test one thing per test
// ✅ Good: Single assertion focus
it("should reject invalid email format", () => {
  const result = User.create({ email: "invalid" });
  expect(result.isError()).toBe(true);
});

// ❌ Bad: Multiple unrelated assertions
it("should work", () => {
  const result = User.create({ email: "a@b.com" });
  expect(result.isSuccess()).toBe(true);
  expect(result.value.id).toBeDefined();
  expect(result.value.createdAt).toBeInstanceOf(Date);
});
```

---

## References

### Internal Documentation

- [AGENTS.md](./AGENTS.md) - Agent-specific instructions
- [TESTING.md](./TESTING.md) - TDD workflow and testing patterns
- `.specs/workflows/` - SDD workflow documentation
- `packages/*/README.md` - Layer-specific guidelines

### External References

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [The Twelve-Factor App](https://12factor.net/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated:** 2026-04-09
**Version:** 1.0.0
**Maintainers:** Development Team
