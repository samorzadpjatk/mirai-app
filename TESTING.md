# Testing Best Practices

This document outlines the testing best practices for the MIRAI monorepo.

## Overview

We use a hybrid testing approach:

- **Bun test** for `packages/*`, `apps/web`, `apps/backend-server`, `apps/notification-sender`
- **Jest** with jest-expo preset for `apps/native` (React Native/Expo requirement)

---

## TDD Workflow (Red-Green-Refactor)

All code must be written using **Test-Driven Development (TDD)** - the Red-Green-Refactor cycle.

### The TDD Cycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   RED   │───>│  GREEN  │───>│ REFACTOR│
│ (fails) │    │ (passes)│    │ (clean) │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┴──────────────┘
              (repeat)
```

### RED: Write a Failing Test

1. Write a test that describes the **desired behavior**
2. Run the test - it must **FAIL** (red)
3. The test failure validates the test is actually testing something

**Example - Creating a User Entity:**

```typescript
// User.test.ts - Write this FIRST (test doesn't exist yet)
import { describe, it, expect } from "bun:test";
import { User } from "./User";

describe("User", () => {
  it("should create user with valid email", () => {
    // This test will fail because User class doesn't exist
    const user = User.create({ email: "test@example.com" });
    expect(user.isSuccess()).toBe(true);
    expect(user.value.email.value).toBe("test@example.com");
  });
});
```

### GREEN: Write Minimal Code to Pass

1. Write the **simplest code** that makes the test pass
2. Don't worry about elegance - just **pass the test**
3. Run tests - all should **pass** (green)

**Example - Minimal Implementation:**

```typescript
// User.ts - Minimal implementation to pass the test
export class User {
  static create(props: { email: string }) {
    // Minimal - just make it pass
    return {
      isSuccess: () => true,
      value: {
        email: { value: props.email },
      },
    };
  }
}
```

### REFACTOR: Improve While Tests Pass

1. **Clean up** the code while keeping tests passing
2. Remove duplication, improve names
3. Add proper types, validation, error handling

**Example - Refactored Implementation:**

```typescript
// User.ts - Clean, proper implementation
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

### Test-First Requirements

| Scenario         | Requirement                                       | Example                                            |
| ---------------- | ------------------------------------------------- | -------------------------------------------------- |
| **New Features** | Test written BEFORE any implementation code       | Write `User.test.ts` before `User.ts`              |
| **Bug Fixes**    | Regression test written BEFORE fixing the bug     | Write test that reproduces the bug, see it fail    |
| **Refactoring**  | Characterization tests written BEFORE refactoring | Add tests documenting current behavior, then clean |

#### New Features: Test Before Implementation

For every new feature:

1. **Write the test first** - Describe the desired behavior
2. **Watch it fail** - The test should fail (RED phase)
3. **Write minimal code** - Just enough to pass (GREEN phase)
4. **Refactor** - Clean up while tests pass

**Example - Adding User Authentication:**

```typescript
// Step 1: Write test FIRST (RED phase)
// packages/domain/src/entities/User.test.ts
import { describe, it, expect } from "bun:test";
import { User } from "./User";

describe("User Authentication", () => {
  it("should authenticate with correct password", () => {
    // This test will fail - User.authenticate() doesn't exist yet
    const user = User.create({
      email: "test@example.com",
      password: "secret123",
    }).value;
    const result = user.authenticate("secret123");
    expect(result.isSuccess()).toBe(true);
  });

  it("should reject incorrect password", () => {
    const user = User.create({
      email: "test@example.com",
      password: "secret123",
    }).value;
    const result = user.authenticate("wrongpassword");
    expect(result.isError()).toBe(true);
  });
});
```

#### Bug Fixes: Regression Test First

For every bug fix:

1. **Write a regression test** that reproduces the bug
2. **Watch it fail** - Confirms the bug exists
3. **Fix the bug** - Make the test pass
4. **Commit both** - Test + fix together

**Example - Fixing Email Validation Bug:**

```typescript
// Step 1: Write regression test FIRST (RED phase)
// packages/domain/src/value-objects/Email.test.ts
import { describe, it, expect } from "bun:test";
import { Email } from "./Email";

describe("Email Validation Bug Fix", () => {
  it("should reject emails with consecutive dots (regression test)", () => {
    // This test catches the bug - "test..user@example.com" was incorrectly accepted
    const result = Email.create("test..user@example.com");
    expect(result.isError()).toBe(true); // Should reject consecutive dots
  });

  it("should reject emails starting with dot (regression test)", () => {
    const result = Email.create(".test@example.com");
    expect(result.isError()).toBe(true); // Should reject starting dot
  });
});
```

#### Refactoring: Characterization Tests First

For every refactoring:

1. **Add characterization tests** - Document current behavior
2. **Verify tests pass** - Ensure behavior is captured
3. **Refactor** - Restructure code while tests pass
4. **Verify still green** - Confirm behavior preserved

**Example - Refactoring User Creation:**

```typescript
// Step 1: Write characterization tests FIRST
// packages/domain/src/entities/User.test.ts (before refactoring)
describe("User (Characterization Tests)", () => {
  it("should create user with valid data", () => {
    const result = User.create({ email: "test@example.com", name: "John" });
    expect(result.isSuccess()).toBe(true);
    expect(result.value.email.value).toBe("test@example.com");
    expect(result.value.name).toBe("John");
  });

  it("should reject invalid email", () => {
    const result = User.create({ email: "invalid", name: "John" });
    expect(result.isError()).toBe(true);
  });

  it("should generate unique ID on creation", () => {
    const user1 = User.create({ email: "a@test.com", name: "A" }).value;
    const user2 = User.create({ email: "b@test.com", name: "B" }).value;
    expect(user1.id).not.toBe(user2.id);
  });
});

// Step 2: Now refactor User.create() implementation
// Step 3: Run tests - they should all still pass
```

### Why Test-First?

1. **Validates the test** - If test passes before code exists, test is broken
2. **Design feedback** - Tests reveal awkward APIs early
3. **Coverage guarantee** - Code is tested as it's written
4. **Regression prevention** - Bug fixes come with tests that fail without the fix
5. **Confidence in refactoring** - Existing tests prove behavior preserved

## Test Organization

### Test File Locations by Layer

| Layer          | Location     | Pattern                    |
| -------------- | ------------ | -------------------------- |
| **Domain**     | Co-located   | `*.test.ts` next to source |
| **Use Cases**  | Co-located   | `*.test.ts` next to source |
| **Adapters**   | `__tests__/` | `__tests__/*.test.ts`      |
| **Frameworks** | `__tests__/` | `__tests__/*.test.ts`      |
| **Apps**       | `__tests__/` | `__tests__/*.test.tsx`     |

### Domain/Use-Case Pattern (Co-located)

```
packages/domain/src/entities/
├── User.ts
└── User.test.ts          # Co-located with source

packages/use-cases/src/interactors/
├── CreateUser.ts
└── CreateUser.test.ts    # Co-located with source
```

### Adapter/App Pattern (**tests**/ directory)

```
src/
  hooks/
    useGroups.ts
    __tests__/
      useGroups.test.ts
  utils/
    validation.ts
    __tests__/
      validation.test.ts
```

## Running Tests

### Bun Tests (packages, web, backend, notification-sender)

```bash
# Run all Bun tests
bun test

# Run with coverage
bun test --coverage

# Run specific package
bun test packages/shared

# Run specific file
bun test packages/shared/src/stores/__tests__/authStore.test.ts
```

### Jest Tests (native app)

```bash
cd apps/native

# Run all Jest tests
./node_modules/.bin/jest

# Run with coverage
./node_modules/.bin/jest --coverage

# Run specific test file
./node_modules/.bin/jest src/hooks/groups/__tests__/useGroups.test.ts

# Watch mode
./node_modules/.bin/jest --watch
```

## Coverage Requirements

- **Line Coverage**: 80% minimum
- **Branch Coverage**: 75% minimum
- **Function Coverage**: 80% minimum

Coverage is enforced in:

- `bunfig.toml` for Bun tests
- `jest.config.cjs` for Jest tests

## Coverage Enforcement

### Thresholds by Metric

| Metric        | Minimum | Configuration |
| ------------- | ------- | ------------- |
| **Lines**     | 80%     | `bunfig.toml` |
| **Branches**  | 75%     | `bunfig.toml` |
| **Functions** | 80%     | `bunfig.toml` |

**Configuration in `bunfig.toml`:**

```toml
[test]
coverageThreshold = { lines = 0.80, branches = 0.75, functions = 0.80 }
```

### CI Failure on Threshold Breach

Coverage is **strictly enforced** in CI:

- PRs that drop coverage below thresholds will **FAIL** the build
- Coverage reports are uploaded as artifacts for review
- PR comments include coverage delta information
- Codecov integration tracks trends over time

### Thresholds by Layer

| Layer          | Target Coverage | Rationale                       |
| -------------- | --------------- | ------------------------------- |
| **Domain**     | 90%+            | Pure functions, easiest to test |
| **Use Cases**  | 85%+            | Orchestration logic             |
| **Adapters**   | 75%+            | Integration tests               |
| **Frameworks** | 60%+            | Configuration mostly            |
| **Apps**       | Varies          | UI component testing            |

### Exemption Process

For files where coverage exemptions are genuinely needed:

1. **Add inline comment** with justification:

   ```typescript
   /* istanbul ignore next - configuration file, no logic to test */
   export const config = { ... };
   ```

2. **Document in PR** why the exemption is necessary

3. **Tech debt exceptions** require:
   - Link to tech debt tracking issue
   - Plan for future coverage improvement
   - Approval from tech lead

**Note:** Domain layer has **zero exemptions** - all domain code must be tested.

## Layer-Specific Test Patterns

### Domain Layer Tests

Domain layer tests are **pure unit tests** - no mocks needed, no I/O:

```typescript
import { describe, it, expect } from "bun:test";
import { User } from "./User";
import { Email } from "../value-objects/Email";

describe("User (Domain)", () => {
  it("should create user with valid email", () => {
    // Arrange - pure inputs
    const email = "valid@example.com";

    // Act - pure function
    const result = User.create({ email });

    // Assert
    expect(result.isSuccess()).toBe(true);
    expect(result.value.email.value).toBe(email);
  });

  it("should reject invalid email format", () => {
    const result = User.create({ email: "invalid" });

    expect(result.isError()).toBe(true);
    expect(result.error).toContain("email");
  });
});

describe("Email (Value Object)", () => {
  it("should validate correct email format", () => {
    const result = Email.create("user@example.com");
    expect(result.isSuccess()).toBe(true);
  });

  it("should reject malformed email", () => {
    const result = Email.create("not-an-email");
    expect(result.isError()).toBe(true);
  });
});
```

**Key principles:**

- No mocking - domain is pure
- Fast execution (< 10ms per test)
- Test business rules, not implementation
- Immutable entities - test state changes via new instances

### Use Case Layer Tests

Use case tests mock repositories (ports) to test orchestration:

```typescript
import { describe, it, expect, mock } from "bun:test";
import { CreateUserUseCase } from "./CreateUser";

describe("CreateUser (Use Case)", () => {
  it("should create user and return DTO", async () => {
    // Arrange - mock repository
    const mockRepo = {
      findByEmail: mock(() => Promise.resolve(null)), // No existing user
      create: mock(() =>
        Promise.resolve({ id: "1", email: "test@example.com" }),
      ),
    };

    const useCase = new CreateUserUseCase(mockRepo as any);

    // Act
    const result = await useCase.execute({ email: "test@example.com" });

    // Assert
    expect(result.isSuccess()).toBe(true);
    expect(result.value.email).toBe("test@example.com");
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it("should return error when email exists", async () => {
    // Arrange - user already exists
    const existingUser = { id: "1", email: "exists@example.com" };
    const mockRepo = {
      findByEmail: mock(() => Promise.resolve(existingUser)),
      create: mock(() => Promise.resolve({})),
    };

    const useCase = new CreateUserUseCase(mockRepo as any);

    // Act
    const result = await useCase.execute({ email: "exists@example.com" });

    // Assert
    expect(result.isError()).toBe(true);
    expect(result.error).toBe("User already exists");
    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});
```

**Key principles:**

- Mock repositories only
- Don't mock domain entities
- Test orchestration flow
- Verify all paths (success, error, edge cases)

### Adapter Layer Tests

Adapter tests use **real dependencies** (integration tests):

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PrismaUserRepository } from "./PrismaUserRepository";
import { User } from "@mirai-app/domain";

describe("PrismaUserRepository (Adapter)", () => {
  let repository: PrismaUserRepository;
  let testDb: TestPrismaClient;

  beforeAll(async () => {
    // Setup test database
    testDb = await createTestDatabase();
    repository = new PrismaUserRepository(testDb);
  });

  it("should persist user to database", async () => {
    // Arrange
    const user = User.create({ email: "test@example.com" });

    // Act
    const saved = await repository.create(user.value);

    // Assert - verify in database
    expect(saved.id).toBeDefined();
    expect(saved.email.value).toBe("test@example.com");

    // Verify persisted
    const fromDb = await testDb.user.findUnique({ where: { id: saved.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb?.email).toBe("test@example.com");
  });

  it("should find user by email", async () => {
    // First create a user
    const user = User.create({ email: "find@example.com" });
    await repository.create(user.value);

    // Act
    const found = await repository.findByEmail("find@example.com");

    // Assert
    expect(found).not.toBeNull();
    expect(found?.email.value).toBe("find@example.com");
  });

  afterAll(async () => {
    await testDb.cleanUp();
  });
});
```

**Key principles:**

- Use real database/test doubles
- Test actual persistence
- Verify data transformations
- Cleanup in afterAll

### Framework Layer Tests

Framework tests verify configuration and wiring:

```typescript
import { describe, it, expect } from "bun:test";
import { createTRPCRouter } from "./trpc-server";

describe("tRPC Configuration", () => {
  it("should create router with procedures", () => {
    const router = createTRPCRouter({
      test: t.procedure.query(() => "test"),
    });

    expect(router).toBeDefined();
    expect(router._def.procedures).toHaveProperty("test");
  });
});
```

**Key principles:**

- Minimal coverage (60%)
- Verify configuration only
- Don't test framework behavior

## Writing Tests

### Hook Tests

For React hooks that depend on React Query or tRPC, test the module structure:

```typescript
/**
 * @jest-environment node
 */

describe("useGroups", () => {
  test("exports useGroups function", async () => {
    const { useGroups } = await import("../useGroups");
    expect(useGroups).toBeDefined();
    expect(typeof useGroups).toBe("function");
  });

  test("hook accepts tripId parameter", async () => {
    const { useGroups } = await import("../useGroups");
    expect(useGroups.length).toBe(1);
  });
});
```

### Utility Function Tests

Test actual behavior for pure functions:

```typescript
describe("getInitials", () => {
  test("returns correct initials", async () => {
    const { getInitials } = await import("../validation");
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Alice")).toBe("A");
    expect(getInitials("")).toBe("?");
  });
});
```

### Service Tests

Test service module exports:

```typescript
describe("authStorage", () => {
  test("has required methods", async () => {
    const { authStorage } = await import("../storage");
    expect(authStorage.getItem).toBeDefined();
    expect(authStorage.setItem).toBeDefined();
    expect(authStorage.removeItem).toBeDefined();
  });
});
```

## Mocking

### When to Mock vs. Use Real Implementations

| Situation                 | Approach        | Rationale                                       |
| ------------------------- | --------------- | ----------------------------------------------- |
| **Domain Layer**          | No mocks        | Pure logic, no external dependencies            |
| **Use Case Layer**        | Mock ports only | Test orchestration without I/O                  |
| **Adapter Layer**         | Real deps       | Integration tests need real database/HTTP calls |
| **Framework Layer**       | Minimal mocking | Test configuration, not framework behavior      |
| **External APIs**         | Mock always     | Don't call real payment/SMS/email services      |
| **File System / Network** | Mock in unit    | Use real in integration tests                   |

**Golden Rule:** Mock at the **boundary** between your code and external systems. Never mock what you own (domain entities).

### Bun Module Mocking

Use `mock.module()` at the top of test files:

```typescript
import { mock } from "bun:test";

mock.module("@mirai-app/supabase", () => ({
  createSupabaseClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}));
```

**Bun Mock Best Practices:**

- Call `mock.module()` before any imports of the mocked module
- Use `mock.restore()` in `afterEach` to reset between tests
- Mock only at the package boundary (e.g., `@mirai-app/supabase`, not internal files)

### Jest Module Mocking

Jest uses the `__mocks__/` directory pattern:

**Directory Structure:**

```
apps/native/src/
├── __mocks__/           # Manual mocks directory
│   ├── expo-location.ts
│   ├── expo-camera.ts
│   └── @tanstack/react-query.ts
└── hooks/
    └── useLocation.ts   # Imports from expo-location
```

**Creating a Manual Mock:**

```typescript
// apps/native/src/__mocks__/expo-location.ts
export const requestForegroundPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted" }),
);

export const getCurrentPositionAsync = jest.fn(() =>
  Promise.resolve({
    coords: { latitude: 37.7749, longitude: -122.4194 },
  }),
);
```

**Using the Mock:**

```typescript
// In your test file
jest.mock("expo-location");

import { requestForegroundPermissionsAsync } from "expo-location";

beforeEach(() => {
  (requestForegroundPermissionsAsync as jest.Mock).mockClear();
});
```

**Available Jest Mocks in `apps/native/src/__mocks__/`:**

- `expo-location.ts` - Location permissions and tracking
- `expo-notifications.ts` - Push notifications
- `expo-camera.ts` - Camera functionality
- `expo-file-system.ts` - File operations
- `@react-native-async-storage/async-storage.ts` - Storage
- `@tanstack/react-query.ts` - React Query hooks
- `@mirai-app/trpc/client.ts` - tRPC client

## Environment Variables

Set required env vars before tests that need them:

```typescript
beforeAll(() => {
  process.env.SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
  process.env.DATABASE_URL = "postgresql://localhost:5432/test";
});
```

## Code Review Checklist for Tests

- [ ] Tests are in `__tests__/` directories adjacent to source
- [ ] Test files follow naming convention: `{sourceFile}.test.ts`
- [ ] Tests verify module exports exist and are correct types
- [ ] Pure functions have behavioral tests
- [ ] React hooks have structure tests (don't invoke hooks directly)
- [ ] Mocks are in appropriate `__mocks__/` directories
- [ ] Environment variables are set in `beforeAll()` if needed
- [ ] Coverage thresholds are met (80% lines, 75% branches)
- [ ] Tests run successfully in CI

## Known Limitations

### Native App Tests (Jest)

Some tests may fail due to React Native/Expo transpilation complexity:

**Babel Transform Errors**

- Tests importing hooks that use React Native JSX components may fail
- Error: `importSource cannot be set when runtime is classic`
- Cause: Nativewind/babel preset conflicts with Jest test environment

**Affected Tests:**

- `useFileUpload` - imports `expo-image-picker`
- `useChallengeCapture` - imports `expo-camera`, `expo-router`
- `useNotifications` - imports `expo-notifications`
- Hooks using `@mirai-app/supabase/react` or `@mirai-app/auth`

**Workaround:**
These tests verify module structure rather than behavior. The 83 passing tests cover the core functionality. Full behavioral testing would require:

1. Separate babel config for tests (without nativewind)
2. React Native Testing Library setup
3. Integration tests with detox

**Recommended:**

- Use structure tests (verify exports exist)
- Test pure utility functions fully
- Consider E2E tests with detox for component testing

## Troubleshooting

### "Cannot use import statement outside a module"

**Cause**: React Native modules can't be parsed by Jest

**Solution**: Add module to `transformIgnorePatterns` in jest.config.cjs:

```javascript
transformIgnorePatterns: [
  "/node_modules/(?!(react-native|@react-native|expo|@expo)/)",
],
```

### "Missing environment variable"

**Cause**: Module imports env vars at load time

**Solution**: Env vars are set in `jest.setup.cjs`. If you see this error:

1. Check that you're using `EXPO_PUBLIC_*` prefix (not plain names)
2. Ensure the variable is set at the top of `jest.setup.cjs`

### "Module not found"

**Cause**: Path mapping not configured in Jest

**Solution**: Add to `moduleNameMapper` in jest.config.cjs:

```javascript
moduleNameMapper: {
  "^~/(.*)$": "<rootDir>/src/$1",
  "^@mirai-app/shared$": "<rootDir>/../../packages/shared/index",
},
```

## CI/CD Integration

Tests run automatically on:

- Every push to `main`
- Every pull request to `main`

Coverage reports are:

- Uploaded as artifacts
- Posted as PR comments
- Checked against thresholds (warnings if below 80%)
- Sent to Codecov (if token is configured)

## TDD Summary Checklist

For every code change, follow this TDD checklist:

### Before Writing Code

- [ ] Test file created or existing test identified
- [ ] Test describes the **behavior** (not implementation)
- [ ] Test runs and **FAILS** (validates test works)

### While Writing Code

- [ ] Minimal code to make test pass
- [ ] Don't commit with failing tests
- [ ] All tests green before refactoring

### After Code Works

- [ ] Refactor for clarity
- [ ] Remove duplication
- [ ] Improve naming
- [ ] Add edge case tests
- [ ] Verify coverage (80%+ lines, 75%+ branches)

### Common TDD Mistakes

| Mistake                        | Correction                               |
| ------------------------------ | ---------------------------------------- |
| Writing multiple tests at once | One test → pass → next test              |
| Testing implementation         | Test behavior (what, not how)            |
| Skipping the RED phase         | Make sure test FAILS first               |
| No assertions                  | Every test needs at least one assertion  |
| Testing getters/setters        | Test business logic, not data structures |

---

## Related Files

- `CLAUDE.md` - CEK Five Pillars conventions (TDD section)
- `AGENTS.md` - Agent instructions for testing
- `bunfig.toml` - Bun test configuration with coverage thresholds
- `apps/native/jest.config.cjs` - Jest configuration
- `apps/native/jest.setup.cjs` - Jest setup file with global mocks
- `.github/workflows/ci.yml` - Main CI workflow (tests, coverage, depcruise)
- `.dependency-cruiser.cjs` - Layer dependency enforcement
