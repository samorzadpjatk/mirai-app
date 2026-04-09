# @mirai-app/use-cases - Use Cases Layer

> **Application layer of Clean Architecture - Orchestrates domain entities**
>
> Depends only on @mirai-app/domain (innermost layer)

## Purpose

The use cases layer contains:

- **Interactors**: Use case implementations (application workflows)
- **Ports**: Repository interfaces and external service interfaces
- **DTOs**: Input/output data transfer objects
- **Errors**: Use case specific error types

## Rules

1. **Only Domain Dependency**: Can only import from `@mirai-app/domain`
2. **No Framework Knowledge**: No knowledge of UI, database, or frameworks
3. **Orchestration Only**: Coordinates domain entities, doesn't contain business rules
4. **Repository Interfaces**: Defines what repositories must do (adapters implement)
5. **Result<T,E>**: All operations return Result for error handling

## Directory Structure

```
src/
├── index.ts              # Public exports
├── ports/                # Repository & service interfaces
│   ├── UserRepository.ts # Data access ports
│   ├── AuthPort.ts       # 🔴 NEW: Authentication port
│   └── TelemetryPort.ts  # 🔴 NEW: Telemetry port
├── interactors/          # Use case implementations
│   ├── CreateUser.ts     # Business workflow use cases
│   ├── AuthenticateUser.ts   # 🔴 NEW: Authentication use case
│   ├── AuthorizeAdmin.ts     # 🔴 NEW: Authorization use case
│   ├── AuthorizeModerator.ts # 🔴 NEW: Authorization use case
│   └── LogTelemetry.ts       # 🔴 NEW: Telemetry use case
├── dto/                  # Data Transfer Objects
│   ├── input/            # Input DTOs
│   └── output/           # Output DTOs
└── errors/               # Use case specific errors
```

## Example Usage

### Defining a Repository Port (Interface)

```typescript
// ports/UserRepository.ts
import type { User } from "@mirai-app/domain";

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### Cross-Cutting Concern Ports

Unlike repository ports that handle data access, these ports abstract
infrastructure concerns (authentication, logging, metrics):

```typescript
// ports/AuthPort.ts - Authentication abstraction
export interface AuthPort {
  validateToken(token: string): Promise<Result<AuthContext, AuthError>>;
  getUserById(userId: UserId): Promise<Result<AuthUser, AuthError>>;
}

// ports/TelemetryPort.ts - Observability abstraction
export interface TelemetryPort {
  log(event: TelemetryEvent): Promise<Result<void, TelemetryError>>;
  trackMetric(name: string, value: number): Promise<void>;
}
```

**Key Differences from Repository Ports:**

- Repository ports: Data persistence (CRUD operations)
- Cross-cutting ports: Infrastructure services (auth, logging, external APIs)
- Cross-cutting ports often have framework-specific implementations (Supabase, Sentry, etc.)

### Creating an Input DTO

```typescript
// dto/input/CreateUserInput.ts
export class CreateUserInput {
  constructor(public readonly email: string) {}

  // Validation using zod or similar
  static schema = z.object({
    email: z.string().email(),
  });
}
```

### Creating an Output DTO

```typescript
// dto/output/UserDTO.ts
import type { User } from "@mirai-app/domain";

export class UserDTO {
  constructor(
    public readonly id: string,
    public readonly email: string,
  ) {}

  static fromDomain(user: User): UserDTO {
    return new UserDTO(user.id, user.email.value);
  }
}
```

### Implementing a Use Case

```typescript
// interactors/CreateUser.ts
import { ok, err, type Result } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";
import { CreateUserInput } from "../dto/input/CreateUserInput";
import { UserDTO } from "../dto/output/UserDTO";

export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<Result<UserDTO, string>> {
    // Check if user already exists
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

## Authentication & Authorization Use Cases

### Authentication Use Case

Delegates token validation to AuthPort:

```typescript
// interactors/AuthenticateUser.ts
import type { AuthPort } from "../ports/AuthPort";
import type { Result } from "@mirai-app/domain";
import { AuthContext } from "@mirai-app/domain";

export interface AuthenticateUserInput {
  token: string;
}

export class AuthenticateUserUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(
    input: AuthenticateUserInput,
  ): Promise<Result<AuthContext, AuthError>> {
    // Delegate to port - no business logic, just orchestration
    return this.authPort.validateToken(input.token);
  }
}
```

### Authorization Use Cases

Check roles and return `Result<void, PermissionDeniedError>`:

```typescript
// interactors/AuthorizeAdmin.ts
import { AuthContext, isErr, ok, err } from "@mirai-app/domain";
import { PermissionDeniedError } from "../errors/PermissionDeniedError";
import type { Result } from "@mirai-app/domain";

export interface AuthorizeAdminInput {
  authContext: AuthContext;
}

export class AuthorizeAdminUseCase {
  execute(input: AuthorizeAdminInput): Result<void, PermissionDeniedError> {
    if (input.authContext.role !== UserRole.ADMIN) {
      return err(new PermissionDeniedError("Admin role required"));
    }
    return ok(undefined);
  }
}

// Usage in controller:
const result = authorizeAdminUseCase.execute({ authContext });
if (isErr(result)) {
  // Handle: User is not admin
}
```

### Role Hierarchy

- **ADMIN**: Full system access
- **MODERATOR**: Moderation capabilities (includes all USER permissions)
- **USER**: Basic user access

Hierarchy: ADMIN > MODERATOR > USER

### Telemetry Use Case

Fire-and-forget logging that shouldn't block the main request:

```typescript
// interactors/LogTelemetry.ts
import type { TelemetryPort } from "../ports/TelemetryPort";
import type { Result } from "@mirai-app/domain";

export interface LogTelemetryInput {
  userId: UserId;
  event: string;
  metadata?: Record<string, unknown>;
}

export class LogTelemetryUseCase {
  constructor(private readonly telemetryPort: TelemetryPort) {}

  async execute(
    input: LogTelemetryInput,
  ): Promise<Result<void, TelemetryError>> {
    return this.telemetryPort.log({
      userId: input.userId,
      event: input.event,
      timestamp: new Date(),
      metadata: input.metadata,
    });
  }
}

// Usage in controller (errors are non-blocking):
const result = await logTelemetryUseCase.execute(input);
if (isErr(result)) {
  // Log locally but don't fail the request
  console.warn("Telemetry failed:", result.error);
}
```

## Testing

Use case tests mock repositories:

```typescript
import { describe, it, expect, mock } from "bun:test";
import { CreateUserUseCase } from "./CreateUser";

describe("CreateUser", () => {
  it("should create user when email not exists", async () => {
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

## Key Principles

### Ports vs Adapters

- **Ports** (in this layer): Interfaces that define WHAT the application needs
- **Adapters** (in adapters layer): Implementations that provide HOW

```typescript
// Port (interface) - in use-cases layer
export interface UserRepository {
  findById(id: string): Promise<User | null>;
}

// Adapter (implementation) - in adapters layer
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}
  async findById(id: string): Promise<User | null> { ... }
}
```

### Cross-Cutting vs Repository Ports

- **Repository Ports**: Define data persistence contracts
  - Example: `UserRepository.create(user: User)`
  - Implemented by: Prisma repositories in adapters layer

- **Cross-Cutting Ports**: Define infrastructure service contracts
  - Example: `AuthPort.validateToken(token: string)`
  - Example: `TelemetryPort.log(event: TelemetryEvent)`
  - Implemented by: Framework-specific adapters (Supabase, Sentry, etc.)

### DTOs Separate Layers

DTOs prevent domain objects from leaking to outer layers:

```
Request → Input DTO → Use Case → Domain Entity → Repository
                                              ↓
Response ← Output DTO ← Use Case ← Domain Entity ← Database
```

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (DDD section)
- [Ports and Adapters Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
