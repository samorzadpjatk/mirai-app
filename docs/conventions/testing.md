# Testing Conventions

## Overview

Testing patterns and conventions for the MIRAI monorepo.

## Testing Stack

| Type | Tool | Use For |
|------|------|---------|
| Unit/Integration | Vitest | Business logic, utilities |
| E2E | Playwright | Full user flows |
| Component | React Testing Library | React components |
| API | oRPC test client | oRPC procedures |
| Database | PGLite + Drizzle | Real transaction tests |
| Network | MSW | Native hook API mocking |
| Dead code | knip | Unused exports cleanup |

## Architecture Principles

### Functional Core, Imperative Shell

Extract pure business logic to `packages/shared/src/` (domain directories like `challenges/`, `trips/`, `groups/`). Hooks, routers, and components become thin shells.

```typescript
// packages/shared/src/challenges/queryBuilders.ts
export function buildChallengeQueryInput(tripId: string | null, pageParam: number) {
  return { tripId: tripId ?? "", pagination: { limit: 30, offset: pageParam || 0 } };
}
```

Test with real data, no mocks:

```typescript
import { describe, it, expect } from "vitest";
import { buildChallengeQueryInput } from "@mirai-app/shared/challenges";

describe("buildChallengeQueryInput", () => {
  it("defaults null tripId to empty string", () => {
    expect(buildChallengeQueryInput(null, 0)).toEqual({
      tripId: "", pagination: { limit: 30, offset: 0 },
    });
  });
});
```

### Manual Dependency Injection

Pass dependencies via parameters. No singleton imports inside business logic.

```typescript
// Before: module-level client
const supabaseClient = createSupabaseClient(process.env.SUPABASE_URL!);

// After: injected
export function createBackgroundLocationTask(deps: { supabaseClient: SupabaseClient; orpcClient: ORPCClient }) {
  return async (taskData) => { /* use deps */ };
}
```

### Fake over Mock

Use real PGLite for backend integration tests. Use MSW for frontend API tests. Avoid mock-verification tests.

## File Organization and Naming

```
packages/orpc/
├── src/
│   ├── api/
│   │   └── routers/
│   │       └── user/
│   └── __tests__/
│       ├── user.test.ts
│       └── setup.ts
├── vitest.config.ts
└── package.json
```

| Type | Naming | Example |
|------|--------|---------|
| Test file | `*.test.ts` | `user.test.ts` |
| Test suite | descriptive | `describe('User router')` |
| Test case | should/when | `it('should create user')` |

## Test Structure

### AAA Pattern

```typescript
import { describe, it, expect } from "vitest";

describe("calculateTotal", () => {
  it("should sum item prices", () => {
    const items = [{ price: 10 }, { price: 20 }];
    const result = calculateTotal(items);
    expect(result).toBe(30);
  });
});
```

## Shared Test Infrastructure

All packages extend `packages/shared/vitest.base.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
  },
});
```

Per-package config merges the base:

```typescript
import { mergeConfig } from "vitest/config";
import { baseConfig } from "../shared/vitest.base.config";

export default mergeConfig(baseConfig, defineConfig({
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
}));
```

Shared utilities live in `packages/shared/src/test-utils/`:

```typescript
import {
  createMockUser,
  createMockSupabaseClient,
  userBuilder,
  resetMocks,
  flushPromises,
} from "@mirai-app/shared/test-utils";
```

## Test Data Factories

Use builders from `packages/shared/src/test-utils/test-data-builders.ts`:

```typescript
import { userBuilder, tripBuilder, createBuilder } from "@mirai-app/shared/test-utils";

const user = userBuilder.with("name", "Jane").withMany({ email: "jane@example.com" }).build();
const trips = tripBuilder.buildMany(3);
```

Create domain-specific builders inline:

```typescript
const challengeBuilder = createBuilder({
  id: "challenge-1",
  name: "Test Challenge",
  status: "ACTIVE" as const,
  basePoints: 100,
});
```

## Real PGLite Testing

Use `@electric-sql/pglite` with Drizzle ORM for integration tests needing real PostgreSQL transaction semantics.

### createPgliteTestDb Pattern

```typescript
// packages/db/src/test-helper.ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";

export async function createPgliteTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await pushSchema(client); // Uses drizzle-kit API or manual fallback

  return {
    db,
    client,
    cleanup: async () => { await client.close(); },
    reset: async () => {
      for (const table of schemaTables) {
        await db.execute(sql`TRUNCATE TABLE ${sql.raw(getTableName(table))} RESTART IDENTITY CASCADE`);
      }
    },
  };
}
```

### Test Lifecycle Pattern

For optimal performance, create the database once per file and reset state between tests:

```typescript
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { users, trips } from "@mirai-app/db";
import { eq } from "drizzle-orm";

describe("trip router — PGLite integration", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  it("inserts and queries data", async () => {
    await testDb.db.insert(users).values({
      id: "user-1", authUserId: "auth-1", firstName: "Test", lastName: "User",
      role: "USER", createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(result).toHaveLength(1);
  });
});
```

**Key points:**
- `beforeAll` creates the database once (~1000ms)
- `beforeEach` calls `reset()` to truncate all tables (~20ms)
- `afterAll` closes the connection once
- This pattern is ~5x faster than creating a DB per test

### Testing Transactions

```typescript
import { sql } from "drizzle-orm";

describe("challenge router — transaction rollback", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
  const now = () => new Date();

  beforeAll(async () => { testDb = await createPgliteTestDb(); });
  beforeEach(async () => { await testDb.reset(); });
  afterAll(async () => { await testDb.cleanup(); });

  it("rolls back on failure", async () => {
    await testDb.db.insert(users).values({
      id: "admin-1", authUserId: "auth-1", firstName: "Admin", lastName: "User",
      createdAt: now(), updatedAt: now(),
    });

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: "user-2", authUserId: "auth-2", firstName: "Test", lastName: "User",
          createdAt: now(), updatedAt: now(),
        });
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const result = await testDb.db.select().from(users);
    expect(result).toHaveLength(1); // user-2 was rolled back
  });
});
```

### Multi-Describe Files

For files with multiple `describe` blocks, move `testDb` and hooks to file level so all describes share one database:

```typescript
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

beforeAll(async () => { testDb = await createPgliteTestDb(); });
beforeEach(async () => { await testDb.reset(); });
afterAll(async () => { await testDb.cleanup(); });

describe("router — transaction rollback", () => {
  // seeding-only beforeEach
  beforeEach(async () => {
    await testDb.db.insert(users).values({...});
  });

  it("tests rollback", async () => { ... });
});

describe("router — Drizzle integration", () => {
  // different seeding
  beforeEach(async () => {
    await testDb.db.insert(users).values({...});
    await testDb.db.insert(trips).values({...});
  });

  it("tests queries", async () => { ... });
});
```

See `packages/orpc/src/api/routers/__tests__/trip.pglite.test.ts` for a complete example.

## oRPC Testing

### Creating Test Caller

```typescript
import { appRouter } from "../routers";
import { createContext } from "./test-context";

export const createCaller = async () => {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
};
```

### Testing Procedures

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { createCaller } from "./setup";

describe("user router", () => {
  let caller: ReturnType<typeof createCaller>;

  beforeAll(async () => { caller = await createCaller(); });

  it("should create user", async () => {
    const user = await caller.user.create({ email: "test@example.com", name: "Test User" });
    expect(user.email).toBe("test@example.com");
    expect(user.id).toBeDefined();
  });
});
```

## MSW for Native Tests

Use Mock Service Worker to intercept oRPC HTTP requests instead of mocking internal modules.

### Server Setup

```typescript
// apps/native/src/test-utils/msw/server.ts
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export function createORPCHandler(path: string[], resolver: (input: unknown) => unknown) {
  const urlPath = `http://localhost:9999/${path.join("/")}`;
  return http.post(urlPath, async ({ request }) => {
    const body = (await request.json()) as { json: unknown };
    return HttpResponse.json({ json: await resolver(body.json), meta: [] });
  });
}

export const server = setupServer();
export function resetHandlers() { server.resetHandlers(); }
```

### renderHookWithMSW

See `apps/native/src/test-utils/msw/test-wrapper.tsx` for the full wrapper implementation. It creates a fresh `QueryClient`, wraps with `SafeAreaProvider`, and initializes the oRPC client against `http://localhost:9999`.

### MSW Test Example

```typescript
import { server, createORPCHandler, resetHandlers } from "~/test-utils/msw/server";
import { renderHookWithMSW } from "~/test-utils/msw/test-wrapper";
import { useTrips } from "~/hooks/useTrips";

beforeAll(() => server.listen());
afterEach(() => resetHandlers());
afterAll(() => server.close());

it("returns trips via real oRPC client", async () => {
  server.use(createORPCHandler(["trip", "getAll"], () => [{ id: "1", name: "Trip 1" }]));
  const { result } = renderHookWithMSW(() => useTrips());
  await waitFor(() => expect(result.current.data).toHaveLength(1));
});
```

## React Component Testing

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();

describe("UserCard", () => {
  it("displays user name", () => {
    render(<UserCard name="John Doe" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("calls onEdit when clicked", async () => {
    const onEdit = vi.fn();
    render(<UserCard onEdit={onEdit} />);
    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalled();
  });
});
```

## Async Testing

```typescript
it("loads data", async () => {
  render(<DataComponent />);
  await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
  expect(await screen.findByText("Data loaded")).toBeInTheDocument();
});
```

## Mocking

### Vitest Mocks

```typescript
vi.mock("@mirai-app/db", () => ({
  createDb: vi.fn(() => ({ query: { users: { findMany: vi.fn() } } })),
}));
```

### Manual Mocks with __mocks__ Directory

For modules mocked consistently across many tests, use a `__mocks__/` directory. Benefits: centralized implementations, consistent behavior, reduced boilerplate.

## Coverage

```bash
bun run test --coverage
```

Configure in `vitest.config.ts` with `provider: "v8"` and exclude `node_modules/`, `src/test/`, `**/*.d.ts`.

## Coverage Thresholds

Per-package thresholds are defined in `vitest.config.ts`:

| Package | Branches | Functions | Lines | Statements |
|---------|----------|-----------|-------|------------|
| shared | 80 | 80 | 80 | 80 |
| orpc | — | 55 | 78 | 78 |
| db | 80 | 80 | 80 | 80 |
| supabase | 80 | 80 | 80 | 80 |
| auth | 80 | 80 | 80 | 80 |

When coverage fails:
1. Run `knip` first — check if drop is from dead code
2. If from new untested code, add real-data tests for pure functions
3. If from router code, add PGLite integration tests
4. Never lower thresholds to green the build

## Test Quality Standards

### The "Mock Verification" Anti-Pattern

- **Pattern**: Mock `useQuery`/`useMutation`, return fake data, assert the hook returns that exact data.
- **Problem**: Tests the mock, not the code. Passes even if actual API, cache keys, or error handling is broken.
- **Rule**: Test behavior, not implementation. If a test passes with a dummy implementation, delete or rewrite it.

### Transaction Rollback Testing Gap

- **Critical**: `$transaction` mock in router tests is a pass-through. No rollback/atomicity is ever tested.
- **Rule**: Add at least one failure-path transaction test per router. Use real PGLite with `BEGIN...ROLLBACK`.

### Verification Checklist for All Tests

Before merging any test, verify:

- [ ] Does the test verify **output/behavior**, not just that a mock was called?
- [ ] Would the test **fail** if the real implementation had a bug?
- [ ] Does the test still pass if you replace the implementation with a dummy? If **yes** → delete or rewrite.
- [ ] Are error paths tested (timeout, retry exhaustion, partial failure)?
- [ ] Are transactions tested for rollback on failure?

### Component Mock Removal Playbook

**Context**: Mocking shared UI components per test (`jest.mock("~/components/common/ui")`).

**Steps**:
1. Delete `jest.mock("~/components/common/ui")` from test file
2. Add descriptive `testID` props to real components (if missing)
3. Update test queries: `getByTestId("mock-id")` → `getByTestId("real-component-id")` or `getByText`
4. Run tests. If component API changed since mock was written, fix the test to match real behavior.
5. Verify the test still fails if the real component breaks.

### Pure Function Extraction Playbook

**Context**: Hook test files exceeding 200 lines mocking React Query internals.

**Steps**:
1. Identify 30–60 lines of domain logic inside hook (callbacks, transformations, calculations)
2. Extract to top-level function with dependencies passed as parameters
3. Write unit tests for the extracted function using real data (no mocks)
4. Replace hook body with thin imperative shell calling the extracted function
5. Delete or shrink hook test file if it only verified mocks

**Naming conventions**: `calculateXxx` (derived state), `syncXxx` (reconcile state), `executeXxx` (side-effects with DI), `buildXxx` (factories), `toXxxOrNull` (type coercion).

### Constructor Mock Resilience

**Context**: `jest.clearAllMocks()` in global `beforeEach` resets all mocks including properties on constructor mocks.

**Anti-pattern**: `mockFileConstructor.downloadFileAsync = jest.fn()` — gets wiped between tests.

**Pattern**: Use `Object.defineProperty` with getter:
```javascript
Object.defineProperty(mockFileConstructor, "downloadFileAsync", {
  get: () => jest.fn(),
  configurable: true,
});
```

## Migration Strategy

Move from mock tests to real tests incrementally, one router or hook at a time.

1. **Keep old tests running** while writing new tests. Do not delete until new tests pass.
2. **Extract pure functions first** — zero risk, immediate value. See `packages/shared/src/challenges/queryBuilders.ts`.
3. **Add real PGLite tests** for transaction-heavy routers. See `packages/orpc/src/api/routers/__tests__/challenge.pglite.test.ts`.
4. **Replace hook mock tests with MSW** — rewrite one describe block at a time.
5. **Coverage ratchet** — ensure coverage never drops below current level during migration.

## Dead Code Detection

Run `knip` to find unused exports, dependencies, and binaries:

```bash
bunx knip
```

Configuration lives in `knip.json`. Each workspace defines `entry` and `project` globs. Before adding new code, run `knip` to confirm you are not increasing dead code.

## Best Practices

1. **Test behavior, not implementation**
2. **One assertion per test** ideally, or related assertions
3. **Descriptive test names**
4. **Keep tests simple** — No logic in tests
5. **Test edge cases** — Empty arrays, null values, errors
6. **Use factories** for test data:
   ```typescript
   const createUser = (overrides = {}) => ({ id: "1", email: "test@example.com", ...overrides });
   ```

### What NOT to Test

- **TypeScript interface runtime tests**: `expect(user.role).toBe(role)` after assigning `role`.
- **"It didn't crash" tests**: `expect(element).toBeOnTheScreen()` after rendering with a prop.
- **Framework plumbing**: Testing that React Query's `isLoading` flag propagates through your hook.
- **Mock call counts**: `expect(mockFn).toHaveBeenCalledTimes(1)`.

## Running Tests

```bash
# All tests
nx run-many -t test

# Watch mode
bun run test:watch

# UI mode
bun run test:ui
```

## Test Runner

### Vitest vs Bun Test Runner

**Rule**: This monorepo uses Vitest (`vitest run`), NOT Bun's native test runner.

- `bun test` → uses Bun's built-in test runner. **DO NOT USE.** It lacks support for `vi.importActual`, `vi.stubGlobal`, `vi.fn().mockRejectedValueOnce()`, and other vitest-specific APIs.
- `bun run test` → runs `vitest run` per `package.json` script. **ALWAYS USE THIS.**

**Verification**: If you see `TypeError: vi.importActual is not a function` or `TypeError: vi.stubGlobal is not a function`, you are running `bun test` instead of `bun run test`.

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MIRAI Testability Redesign Plan](../../docs/testability-redesign-plan.md)

