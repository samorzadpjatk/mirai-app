# Skill: Fix Cyclic Dependencies in Clean Architecture

## Overview

This skill provides patterns and techniques for resolving cyclic dependencies between architectural layers in a Clean Architecture context. Specifically addresses the common problem where inner layers incorrectly depend on outer layers.

## Problem Statement

In Clean Architecture, dependencies should only flow inward:

```
Frameworks → Adapters → Use Cases → Domain
```

A cyclic dependency occurs when:

- **Inner layers import from outer layers** (e.g., Adapters imports from Frameworks)
- **Mutual dependencies** between packages (e.g., A imports B, B imports A)

This violates the **Dependency Rule**: "Source code dependencies must point only inward, toward higher-level policies." — Uncle Bob

## Clean Architecture Dependency Rules

### The Dependency Rule

1. **Domain Layer**: No dependencies on any outer layer
2. **Use Cases Layer**: Depends only on Domain
3. **Adapters Layer**: Depends on Domain and Use Cases
4. **Frameworks Layer**: Depends on all inner layers (including Adapters)

### Consequences of Violations

- Build failures and circular build dependencies
- Impossible to test layers in isolation
- Reduced maintainability and flexibility
- Framework lock-in (difficult to swap implementations)

## Breaking Dependency Cycles - 5 Techniques

### Technique 1: Dependency Inversion (Interface in Inner Layer)

Move the interface definition to the inner layer, implement in outer layer.

**Problem:**

```typescript
// WRONG: Domain depends on Frameworks
// packages/domain/src/repositories/UserRepository.ts
import { PrismaClient } from "@frameworks/prisma"; // ❌ Violation!

export class UserRepository {
  constructor(private prisma: PrismaClient) {}
}
```

**Solution:**

```typescript
// CORRECT: Define interface in Use Cases (inner)
// packages/use-cases/src/ports/UserRepository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Implement in Adapters (outer)
// packages/adapters/src/gateways/PrismaUserRepository.ts
import type { UserRepository } from "@use-cases/ports"; // ✅ Correct direction
import { PrismaClient } from "@frameworks/prisma"; // ✅ Outer layer import OK

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}
}
```

### Technique 2: Dependency Injection (Constructor Injection)

Pass dependencies as constructor parameters rather than importing them directly.

**Problem:**

```typescript
// WRONG: Direct import creates tight coupling
import { createDb } from "@frameworks/prisma";

export class UserService {
  private db = createDb(); // ❌ Direct dependency
}
```

**Solution:**

```typescript
// CORRECT: Inject dependency via constructor
import type { PrismaClient } from "@frameworks/prisma";

export class UserService {
  constructor(private prisma: PrismaClient) {} // ✅ Injected
}

// Factory function in outer layer
// packages/frameworks/src/factories.ts
import { createDb } from "./prisma";
import { UserService } from "@adapters/services";

export function createUserService() {
  return new UserService(createDb()); // ✅ Outer layer wires dependencies
}
```

### Technique 3: Facade Pattern (Simplified Interface)

Create a simplified interface in the inner layer that the outer layer implements.

**Problem:**

```typescript
// WRONG: Inner layer imports complex type from outer
import type { PrismaClient } from "@frameworks/prisma";

export function processData(db: PrismaClient) {
  // ❌ Tied to Prisma
  // ...
}
```

**Solution:**

```typescript
// CORRECT: Define minimal interface needed
// packages/use-cases/src/ports/DatabaseConnection.ts
export interface DatabaseConnection {
  query(sql: string, params: unknown[]): Promise<unknown[]>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

// Implement in Adapters with Prisma
// packages/adapters/src/gateways/PrismaConnection.ts
import { PrismaClient } from "@frameworks/prisma";
import type { DatabaseConnection } from "@use-cases/ports";

export class PrismaConnection implements DatabaseConnection {
  constructor(private prisma: PrismaClient) {}

  async query(sql: string, params: unknown[]) {
    return this.prisma.$queryRawUnsafe(sql, ...params);
  }

  async transaction<T>(fn: () => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
```

### Technique 4: Type Re-export Pattern (Type-Only Dependencies)

When types are needed across layers, re-export from appropriate layer using `type` imports.

**Problem:**

```typescript
// WRONG: Direct type import across layers
// packages/adapters/src/services/UserService.ts
import type { User } from "@frameworks/prisma/models"; // ❌ Wrong direction!
```

**Solution:**

```typescript
// CORRECT: Re-export types through proper layer
// packages/frameworks/src/prisma/index.ts
export type { User, Role } from "./lib/models"; // Re-export Prisma types

// packages/adapters/src/services/UserService.ts
import type { User } from "@frameworks/prisma"; // ✅ Now correct direction
// Or better: use domain types instead
import type { User } from "@domain/entities"; // ✅ Best: inner layer type
```

### Technique 5: Event-Driven Architecture (Decoupling via Events)

Use events to break direct dependencies between layers.

**Problem:**

```typescript
// WRONG: Direct dependency on notification service
import { sendEmail } from "@frameworks/email";

export class UserService {
  async registerUser(user: User) {
    // ... save user
    await sendEmail(user.email); // ❌ Direct dependency
  }
}
```

**Solution:**

```typescript
// CORRECT: Emit event, let outer layer handle
// packages/domain/src/events/UserEvents.ts
export interface UserRegisteredEvent {
  type: "USER_REGISTERED";
  payload: { userId: string; email: string };
}

// packages/adapters/src/services/UserService.ts
export class UserService {
  constructor(private eventBus: EventBus) {}

  async registerUser(user: User) {
    // ... save user
    this.eventBus.emit({
      type: "USER_REGISTERED",
      payload: { userId: user.id, email: user.email },
    }); // ✅ Decoupled
  }
}

// packages/frameworks/src/handlers/EmailHandler.ts
// Outer layer listens and handles
eventBus.on("USER_REGISTERED", async (event) => {
  await sendEmail(event.payload.email);
});
```

## Prisma-Specific Guidance

### The Problem

Prisma client and types are framework-specific (outer layer) but often needed in adapters.

### Solutions

#### Option A: Pass PrismaClient as Constructor Parameter (Recommended)

```typescript
// packages/adapters/src/gateways/BasePrismaRepository.ts
import type { PrismaClient } from "@frameworks/prisma";

export abstract class BasePrismaRepository {
  constructor(protected prisma: PrismaClient) {} // ✅ Injected
}

// packages/frameworks/src/factories.ts
import { createDb } from "./prisma";
import { PrismaUserRepository } from "@adapters/gateways";

export function createUserRepository() {
  return new PrismaUserRepository(createDb()); // ✅ Outer layer creates
}
```

#### Option B: Repository Factory Pattern

```typescript
// packages/adapters/src/utils/repository-factory.ts
import type { PrismaClient } from "@frameworks/prisma";

export interface RepositoryFactory {
  createUserRepository(): UserRepository;
  createTripRepository(): TripRepository;
  // ...
}

// packages/frameworks/src/factories/PrismaRepositoryFactory.ts
import { createDb } from "../prisma";

export class PrismaRepositoryFactory implements RepositoryFactory {
  private prisma = createDb();

  createUserRepository() {
    return new PrismaUserRepository(this.prisma);
  }
  // ...
}
```

#### Option C: Type-Only Prisma Imports

When you only need types (not the client):

```typescript
// ✅ Type-only import is safe and doesn't create runtime dependency
import type { Prisma } from "@frameworks/prisma";

export function buildWhereClause(input: unknown): Prisma.UserWhereInput {
  // Using only types, not runtime client
}
```

### Migration Strategy for Prisma Dependencies

1. **Audit**: Find all imports from `@frameworks/prisma` in adapters
2. **Categorize**:
   - Type-only imports → Keep as `import type`
   - PrismaClient imports → Convert to constructor injection
3. **Refactor**:
   - Add `prisma` parameter to constructors
   - Create factory functions in frameworks layer
   - Update all instantiation points
4. **Verify**: Run tests, check no imports remain

## tRPC-Specific Guidance

### The Problem

tRPC router types are defined in adapters (AppRouter) but needed in frameworks for client creation.

### Solutions

#### Option A: Type-Only Import with Proper Direction

```typescript
// frameworks/src/trpc/client/react.ts
import type { AppRouter } from "@adapters/api/root"; // ✅ Correct: outer imports inner type

export function useTRPC(): TRPCOptionsProxy<AppRouter> {
  // ...
}
```

**Note**: This is actually correct direction! Frameworks (outer) importing from Adapters (inner) follows Clean Architecture.

#### Option B: Split Type Definition (When Both Directions Wrong)

If both packages need each other's types:

```typescript
// Option: Create shared types package (last resort)
// packages/shared/src/trpc-types.ts
export type AppRouter = /* router type definition */;

// Both packages import from shared
// packages/adapters/src/api/root.ts
import type { AppRouterBase } from "@shared/trpc-types";

// packages/frameworks/src/trpc/client.ts
import type { AppRouter } from "@shared/trpc-types";
```

### Migration Strategy for tRPC Dependencies

1. **Audit**: Find all imports from `@adapters` in frameworks
2. **Verify Direction**:
   - Frameworks → Adapters is CORRECT (outer → inner)
   - If only type imports, likely correct already
3. **If Runtime Imports Exist**:
   - Move runtime code to appropriate layer
   - Use dependency injection to pass implementations
4. **For AppRouter Type**:
   - Keep type-only import (correct direction)
   - Ensure no runtime imports

## Verification Checklist

After refactoring, verify:

- [ ] No imports from `@frameworks` in `packages/adapters` (except type-only)
- [ ] No imports from `@adapters` in `packages/use-cases`
- [ ] No imports from `@use-cases` in `packages/domain`
- [ ] All PrismaClient instances injected via constructors
- [ ] All repository implementations wired in outer layer
- [ ] Tests pass with mocked dependencies
- [ ] Build succeeds without circular dependency errors

## References

### Books

- **Clean Architecture** by Robert C. Martin (Uncle Bob)
  - Chapter 2: The Two Values of Software
  - Chapter 6: Functional Programming
  - Chapter 17: The Dependency Rule

### Articles

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Uncle Bob's blog post
- [Dependency Inversion Principle](https://stackify.com/dependency-inversion-principle/) - Practical examples
- [Breaking Circular Dependencies](https://medium.com/@mattburgess/breaking-circular-dependencies-in-typescript-3e1d681ab2b8) - TypeScript specific

### TypeScript/Node.js Specific

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) - For monorepo dependency management
- [Barrel Exports Best Practices](https://tkdodo.eu/blog/please-stop-building-client-state-managers) - Managing public APIs

## Common Pitfalls

1. **Using `import type` to Hide Violations**: Type-only imports don't fix the architectural violation - they just hide runtime errors. The dependency still exists.

2. **Partial Refactoring**: Fixing only some imports leaves the system in a broken intermediate state. Complete the full refactor.

3. **Over-Engineering**: Don't create complex abstractions for simple cases. Constructor injection is often sufficient.

4. **Factory Proliferation**: Too many factory functions create indirection without benefit. Centralize in one factory per layer.

5. **Testing Gaps**: After refactoring, verify you can test adapters without the database, and use cases without adapters.
