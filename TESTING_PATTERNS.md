# Testing Patterns Reference

This document captures testing patterns established during the test coverage spike and full implementation. Use these as templates when adding new tests.

## Pattern 1: Pure Function Testing

For functions with no side effects (input → output).

**Example: `fileValidation.ts`**

```typescript
import { describe, expect, test } from "bun:test";
import { formatBytes, validateFileType } from "../fileValidation";

describe("formatBytes", () => {
  test("returns '0 B' for invalid inputs", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(NaN)).toBe("0 B");
  });

  test("converts bytes correctly", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1572864)).toBe("1.5 MB");
  });
});
```

**Key Points:**

- No mocking needed
- Test edge cases (zero, negative, null, undefined)
- Use table-driven tests for multiple input/output pairs
- Aim for 100% coverage on pure functions

## Pattern 2: External Dependency Mocking

For modules that import external libraries.

**Example: Mocking tRPC**

```typescript
import { describe, expect, test, mock } from "bun:test";

mock.module("@mirai-app/trpc/client", () => ({
  useTRPC: () => ({
    group: {
      getAll: {
        queryOptions: () => ({ queryKey: ["groups"] }),
      },
    },
  }),
  useTRPCClient: () => ({
    group: {
      getAll: {
        query: mock(() => Promise.resolve({ groups: [], pagination: {} })),
      },
    },
  }),
}));
```

**Key Points:**

- Use `mock.module()` at the top of the test file
- Mock the return shape exactly as the real module
- Reset mocks between tests if needed with `mock.restore()`
- TypeScript may need `as any` for complex mock shapes

## Pattern 3: Browser API Mocking (Happy DOM)

For code using window, localStorage, location, etc.

**Example: Mocking localStorage and URL**

```typescript
describe("useActiveTripId", () => {
  test("extracts from URL params", () => {
    // Mock URL
    Object.defineProperty(window, "location", {
      value: { search: "?tripId=abc123" },
      writable: true,
    });

    const { result } = renderHook(() => useActiveTripId());
    expect(result.current).toBe("abc123");
  });

  test("falls back to localStorage", () => {
    // Mock localStorage
    const mockGetItem = mock(() => "stored-id");
    Object.defineProperty(window, "localStorage", {
      value: { getItem: mockGetItem },
      writable: true,
    });

    const { result } = renderHook(() => useActiveTripId());
    expect(result.current).toBe("stored-id");
  });
});
```

**Key Points:**

- Happy DOM provides `window`, `document`, `localStorage` globals
- Use `Object.defineProperty` to mock specific properties
- Clean up mocks after tests to prevent leakage

## Pattern 4: React Hook Testing

For custom React hooks.

**Helper: renderHook**

```typescript
import { render } from "@testing-library/react";

function renderHook<T>(useHook: () => T): { result: { current: T } } {
  let result = { current: null as T };

  function TestComponent() {
    result.current = useHook();
    return null;
  }

  render(<TestComponent />);
  return { result: { current: result.current! } };
}
```

**Example Usage:**

```typescript
describe("useCounter", () => {
  test("increments count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

**Key Points:**

- Create a helper `renderHook` function
- Use `act()` for state updates (from `@testing-library/react`)
- Test initial state, updates, and cleanup

## Pattern 5: Fake Timers for Async Code

For code using setTimeout, setInterval, or async functions.

**Example: Testing Scheduler**

```typescript
import { describe, expect, test, mock, beforeAll, afterAll } from "bun:test";

describe("Scheduler", () => {
  beforeAll(() => {
    // Enable fake timers if Bun supports it
    // Otherwise, use manual mocking
  });

  test("runs task at intervals", async () => {
    const task = mock(() => Promise.resolve());
    const scheduler = new Scheduler(task, 1); // 1 minute interval

    scheduler.start();

    // In real tests, wait or use fake timers
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(task).toHaveBeenCalled();

    scheduler.stop();
  });
});
```

**Key Points:**

- Bun's timer mocking is limited compared to Jest
- Use short real delays in tests (accept slower tests)
- Always clean up timers after tests
- Consider using `mock()` to track callback invocations

## Pattern 6: Zustand Store Testing

For Zustand state management.

**Example:**

```typescript
import { describe, expect, test, beforeEach } from "bun:test";
import { authStore } from "../stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    authStore.setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  test("sets user", () => {
    const mockUser = { id: "1", email: "test@example.com", role: "USER" };

    authStore.getState().setUser(mockUser);

    expect(authStore.getState().user).toEqual(mockUser);
    expect(authStore.getState().isAuthenticated).toBe(true);
  });
});
```

**Key Points:**

- Zustand stores can be tested directly (no React needed)
- Use `store.setState()` to reset between tests
- Use `store.getState()` to read current state
- Mock external dependencies (Supabase, etc.) before testing actions

## Pattern 7: Fastify Testing

For Fastify server utilities.

**Example:**

```typescript
describe("fastifyHeadersToFetchHeaders", () => {
  test("converts simple headers", () => {
    const fastifyHeaders = {
      "content-type": "application/json",
      "x-custom": "value",
    };

    const result = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect(result.get("content-type")).toBe("application/json");
    expect(result.get("x-custom")).toBe("value");
  });

  test("handles array headers", () => {
    const fastifyHeaders = {
      "set-cookie": ["session=abc", "user=john"],
    };

    const result = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect(result.getAll("set-cookie")).toEqual(["session=abc", "user=john"]);
  });
});
```

**Key Points:**

- Mock Fastify types at the type level only
- Test with realistic header objects
- Verify both success and edge cases (undefined, arrays)

## File Organization

```
src/
  utils/
    myUtil.ts
    __tests__/
      myUtil.test.ts  <- Place tests in __tests__ subdirectories
  hooks/
    useMyHook.ts
    __tests__/
      useMyHook.test.ts
```

## Import Conventions

```typescript
// Test imports use bun:test
import { describe, expect, test, mock } from "bun:test";

// Source imports use relative paths
import { myFunction } from "../myUtil";

// External mocks use mock.module
mock.module("@mirai-app/trpc/client", () => ({ ... }));
```

## Coverage Checklist

Before submitting tests, verify:

- [ ] 80%+ line coverage for the file
- [ ] Edge cases handled (null, undefined, empty, error paths)
- [ ] No production code changes (tests only)
- [ ] Tests run with `bun test`
- [ ] No `console.log` left in tests

## Troubleshooting

**"Cannot find module" errors:**

- Use relative imports in tests: `import { fn } from "../file"`
- Check that `__tests__` directory is at the right level

**Happy DOM not working:**

- Verify `happydom.ts` is being preloaded in `bunfig.toml`
- Check that `bun test` is being run from the correct directory

**Mock not being applied:**

- `mock.module()` must be at the top level, not inside tests
- The mock is hoisted, so it applies to all imports in the file

**Async test failures:**

- Bun doesn't have Jest's fake timers
- Use real async/await with short timeouts
- Consider restructuring code to be more testable
