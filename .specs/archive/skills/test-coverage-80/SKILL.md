---
name: test-coverage-80
description: Generate tests to increase coverage to 80% across the Mirai App monorepo following established DDD/Clean Architecture testing patterns.
triggers:
  - "test coverage"
  - "write tests"
  - "increase coverage"
  - "add tests for"
  - "test interactor"
  - "test mapper"
  - "test controller"
  - "test use case"
---

# Test Coverage 80% Skill

Guidance for generating tests across the Mirai App monorepo to reach 80% coverage, following established patterns.

## Priority Order

1. **Use cases (packages/use-cases)** — ~50 untested interactors, highest ROI
2. **Mappers (packages/adapters/src/mappers)** — 13 untested, pure unit tests
3. **Controllers (packages/adapters/src/controllers)** — ~15 untested controllers
4. **Shared (packages/shared)** — 5 source files, 0% coverage
5. **Frameworks DI/stores/storage** — Existing tests, gaps to fill

## Use Case Test Template

### Result Pattern (older use cases: `result.kind === "ok"/"err"`)

```typescript
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SomeUseCase } from "./SomeUseCase";
import type { SomeRepository } from "../ports/SomeRepository";

describe("[UNIT] SomeUseCase", () => {
  let mockRepo: SomeRepository;

  beforeEach(() => {
    mockRepo = {
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve(/* entity */)),
      // ... all port methods
    };
  });

  describe("execute", () => {
    it("should succeed with valid input", async () => {
      const useCase = new SomeUseCase(mockRepo);
      const result = await useCase.execute({
        /* input */
      });
      expect(result.kind).toBe("ok");
    });

    it("should return error when entity not found", async () => {
      mockRepo.findById = mock(() => Promise.resolve(null));
      const useCase = new SomeUseCase(mockRepo);
      const result = await useCase.execute({ id: "missing" });
      expect(result.kind).toBe("err");
    });

    it("should return error on validation failure", async () => {
      const useCase = new SomeUseCase(mockRepo);
      const result = await useCase.execute({
        /* invalid */
      });
      expect(result.kind).toBe("err");
    });
  });
});
```

### Async/Await Pattern (use cases returning Promises that throw)

Use cases that throw errors should be tested with direct async/await:

```typescript
describe("[UNIT] SomeUseCase", () => {
  describe("execute", () => {
    it("should succeed with valid input", async () => {
      const useCase = new SomeUseCase(mockRepo);
      const result = await useCase.execute({
        /* input */
      });

      expect(result.someField).toBe("expected");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should throw error when entity not found", async () => {
      mockRepo.findById = mock(() => Promise.resolve(null));
      const useCase = new SomeUseCase(mockRepo);

      await expect(useCase.execute({ id: "missing" })).rejects.toThrow(
        "not found",
      );
    });

    it("should throw error on validation failure", async () => {
      const useCase = new SomeUseCase(mockRepo);

      await expect(
        useCase.execute({
          /* invalid */
        }),
      ).rejects.toThrow("validation");
    });
  });
});
```

**Key patterns:**

- **Success cases**: `const result = await useCase.execute(input)` then assert on `result`
- **Error cases**: `await expect(useCase.execute(input)).rejects.toThrow("message")`
- **Never use** `runAsResult()` helper - use native Bun test patterns directly

## Repository Mock Factory

For use cases with many dependencies, create type-safe mocks:

```typescript
import { mock } from "bun:test";
import type { SomeRepository } from "../ports/SomeRepository";

function createMockSomeRepository(
  overrides?: Partial<SomeRepository>,
): SomeRepository {
  return {
    findById: mock(() => Promise.resolve(null)),
    findAll: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(/* default */)),
    update: mock(() => Promise.resolve(/* default */)),
    delete: mock(() => Promise.resolve()),
    ...overrides,
  };
}
```

**IMPORTANT**: Always implement ALL methods of the port interface. Missing methods cause runtime errors.

## Mapper Test Template

```typescript
import { describe, it, expect } from "bun:test";
import { SomeMapper } from "../mappers/SomeMapper";
import { SomeEntity } from "@mirai-app/domain";

describe("[UNIT] SomeMapper", () => {
  const createPrismaRecord = (overrides = {}) => ({
    id: "test-id",
    // ... required fields with defaults
    ...overrides,
  });

  describe("toDomain", () => {
    it("should map Prisma record to domain entity", () => {
      const record = createPrismaRecord();
      const entity = SomeMapper.toDomain(record);
      expect(entity.id).toBe("test-id");
    });

    it("should throw on invalid database data", () => {
      const record = createPrismaRecord({ requiredField: "" });
      expect(() => SomeMapper.toDomain(record)).toThrow();
    });
  });

  describe("toPrismaCreate", () => {
    it("should map domain entity to Prisma create input", () => {
      const entity = SomeEntity.create({
        /* valid */
      }).value;
      const prisma = SomeMapper.toPrismaCreate(entity);
      expect(prisma.id).toBe(entity.id);
    });
  });

  describe("toPrismaUpdate", () => {
    it("should not include id or created fields", () => {
      const entity = SomeEntity.create({
        /* valid */
      }).value;
      const prisma = SomeMapper.toPrismaUpdate(entity);
      expect("id" in prisma).toBe(false);
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through domain → prisma → domain", () => {
      const original = SomeEntity.create({
        /* valid */
      }).value;
      const prisma = SomeMapper.toPrismaCreate(original);
      const record = {
        ...prisma,
        createdAt: original.createdAt,
        updatedAt: original.updatedAt,
      };
      const restored = SomeMapper.toDomain(record);
      expect(restored.id).toBe(original.id);
      // ... compare all fields
    });
  });
});
```

## Controller Test Template

```typescript
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SomeController } from "../some-controller";
import type { SomeUseCase } from "@mirai-app/use-cases";

describe("[UNIT] SomeController", () => {
  let mockUseCase: SomeUseCase;
  let controller: SomeController;

  beforeEach(() => {
    mockUseCase = {
      execute: mock(() => /* success result */),
    } as unknown as SomeUseCase;
    controller = new SomeController(mockUseCase);
  });

  describe("someMethod", () => {
    it("should return success for valid input", async () => {
      const result = await controller.someMethod({ /* valid */ });
      expect(result.success).toBe(true);
    });

    it("should return error for invalid input", async () => {
      const result = await controller.someMethod({ /* invalid */ });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("should return error when use case fails", async () => {
      mockUseCase.execute = mock(() => /* failure result */);
      const result = await controller.someMethod({ /* valid */ });
      expect(result.success).toBe(false);
    });
  });

  describe("schemas", () => {
    it("should expose validation schemas", () => {
      expect(controller.schemas.someMethod).toBeDefined();
    });
  });
});
```

## Coverage Rules

### What to Test

- All public methods on entities and value objects
- All use case execute() paths (happy, not found, validation error)
- Mapper toDomain(), toPrismaCreate(), toPrismaUpdate(), round-trip
- Controller happy path, validation failure, use case failure
- DI container registration, resolution, scopes

### What NOT to Test

- Prisma auto-generated models (`packages/frameworks/src/prisma/lib/`)
- Barrel `index.ts` re-export files
- Pure type declaration files (`types.ts`, `*.d.ts`)
- Seed scripts (`apps/seed/`)
- tRPC client hooks (React-specific, flaky)

### Tag Convention

- `[UNIT]` — All mapper, controller, use case, domain, DI tests
- `[INTEGRATION]` — All PrismaRepository tests requiring database

### File Location Convention

| Layer                      | Test Location                                     |
| -------------------------- | ------------------------------------------------- |
| Domain                     | `src/entities/Entity.test.ts` (co-located)        |
| Use Cases                  | `src/interactors/Interactor.test.ts` (co-located) |
| Mappers                    | `src/__tests__/Mapper.test.ts`                    |
| Controllers                | `src/controllers/__tests__/controller.test.ts`    |
| Repositories (integration) | `src/__tests__/PrismaRepo.test.ts`                |
| DI                         | `src/di/__tests__/container.test.ts`              |

## Running Tests

```bash
# All tests
bun test

# Specific package
cd packages/use-cases && bun test

# Unit only (packages that support it)
cd packages/adapters && bun run test:unit

# Integration only
cd packages/adapters && bun run test:integration

# With coverage
cd packages/domain && bun test --coverage

# Filter by tag
bun test -t '\[UNIT\]'
bun test -t '\[INTEGRATION\]'
```

## Checklist for Each New Test File

- [ ] File follows naming convention (co-located or `__tests__/`)
- [ ] Uses `[UNIT]` or `[INTEGRATION]` tag in top-level `describe`
- [ ] Imports from `bun:test` (not Jest)
- [ ] Uses `mock()` for all repository interface methods (no partial mocks)
- [ ] Tests happy path + all error paths
- [ ] For use cases that return Promises, uses direct async/await pattern
- [ ] For use cases that return Result type, uses `result.kind === "ok"/"err"` pattern
- [ ] Tests run: `cd <package> && bun test <file>`
