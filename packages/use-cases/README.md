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
│   └── .gitkeep
├── interactors/          # Use case implementations
│   └── .gitkeep
├── dto/                  # Data Transfer Objects
│   ├── input/            # Input DTOs (CreateUserInput, etc.)
│   │   └── .gitkeep
│   └── output/           # Output DTOs (UserDTO, etc.)
│       └── .gitkeep
└── errors/               # Use case specific errors
    └── .gitkeep
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
