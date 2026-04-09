# Testing Patterns Guide

This document captures the established testing patterns for the Mirai App monorepo. Use these as templates when adding new tests.

## Overview

The monorepo uses **Bun's built-in test runner** with **Happy DOM** for React component testing. This provides a fast, consistent testing environment across most apps, with the exception of `apps/native` which requires Jest due to Expo constraints.

## Infrastructure

### Configuration

- **Test runner**: Bun (`bun:test`)
- **Coverage thresholds**: 80% lines, 75% branches (configured in `bunfig.toml`)
- **DOM environment**: Happy DOM (preloaded via `happydom.ts`)
- **Test location**: Colocated `__tests__/` directories adjacent to source files

### bunfig.toml

```toml
[test]
preload = ["./happydom.ts"]
coverageThreshold = { lines = 0.80, branches = 0.75 }
```

### happydom.ts

```typescript
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

## Pattern 1: Pure Function Testing

**Use for**: Utility functions with no side effects (input → output)

**Example**: `apps/web/src/lib/fileValidation.ts`

### Key Principles

1. **No mocking required** - Pure functions don't need external dependencies
2. **Table-driven tests** - Test multiple input/output pairs efficiently
3. **Edge case coverage** - Test boundaries (zeros, negatives, empty inputs)
4. **Both valid and invalid inputs** - Ensure proper error handling

### Example

```typescript
import { describe, test, expect } from "bun:test";
import { formatBytes } from "../fileValidation";

describe("formatBytes", () => {
  describe("edge cases", () => {
    test("returns '0 B' for zero bytes", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    test("returns '0 B' for negative values", () => {
      expect(formatBytes(-1)).toBe("0 B");
    });
  });

  describe("unit conversion", () => {
    test("converts to KB correctly", () => {
      expect(formatBytes(1024)).toBe("1.0 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
    });
  });
});
```

### Why No Mocks?

Pure functions are deterministic - same input always produces same output. This makes tests:

- **Faster** - No setup/teardown of mocks
- **More reliable** - No mock synchronization issues
- **Easier to understand** - Test logic matches function logic

## Pattern 2: External Dependency Mocking

**Use for**: Functions that depend on external types/modules

**Example**: `apps/backend-server/src/utils/headers.ts`

### Key Principles

1. **Type-level mocking** - Create type-compatible stubs without importing full libraries
2. **`satisfies` operator** - Ensure type safety with TypeScript
3. **Module boundary mocking** - Use `mock.module()` for external dependencies
4. **Minimal mocking** - Mock only what's necessary for the test

### Example

```typescript
import { describe, test, expect } from "bun:test";
import type { FastifyRequest } from "fastify";
import { fastifyHeadersToFetchHeaders } from "../headers";

describe("fastifyHeadersToFetchHeaders", () => {
  test("converts simple string header values", () => {
    // Type-level mock using satisfies
    const mockHeaders = {
      "content-type": "application/json",
    } satisfies FastifyRequest["headers"];

    const result = fastifyHeadersToFetchHeaders(mockHeaders);
    expect(result.get("content-type")).toBe("application/json");
  });

  test("handles array header values (multi-value headers)", () => {
    const mockHeaders = {
      "set-cookie": ["cookie1=value1", "cookie2=value2"],
    } satisfies FastifyRequest["headers"];

    const result = fastifyHeadersToFetchHeaders(mockHeaders);
    expect(result.get("set-cookie")).toBe("cookie1=value1, cookie2=value2");
  });
});
```

### tRPC Mocking

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

### Fastify-Specific Pattern

For Fastify request types, use the indexed access type:

```typescript
const mockHeaders: FastifyRequest["headers"] = {
  "content-type": "application/json",
  authorization: "Bearer token",
};
```

## Pattern 3: Async and Timer Testing

**Use for**: Functions with setTimeout, setInterval, or async operations

**Example**: `apps/notification-sender/src/utils/scheduler.ts`

### Key Principles

1. **Use real timers with short intervals** - Bun's timer implementation is fast
2. **Async/await patterns** - Properly await async operations
3. **Spy on console methods** - Verify logging behavior
4. **Cleanup after tests** - Stop schedulers/intervals to prevent test leakage

### Example

```typescript
import { describe, test, expect, spyOn, mock } from "bun:test";
import { Scheduler } from "../scheduler";

describe("Scheduler", () => {
  test("runs task immediately via setTimeout", async () => {
    const task = mock(() => Promise.resolve());
    const scheduler = new Scheduler(task, 5);

    scheduler.start();

    // Wait for immediate setTimeout to execute
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(task).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  test("catches and logs task errors", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Task failed");
    const task = mock(() => Promise.reject(error));
    const scheduler = new Scheduler(task, 5);

    scheduler.start();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalledWith("Scheduler task failed:", error);

    consoleSpy.mockRestore();
    scheduler.stop();
  });
});
```

### Bun Timer Differences from Jest

- **No fake timers needed** - Bun's real timers are fast enough for unit tests
- **setTimeout/setInterval** work identically to Node.js
- **Mock implementation** uses `mock()` from `bun:test`

## Pattern 4: React Hook Testing

**Use for**: Custom React hooks with DOM dependencies

**Example**: `apps/web/src/hooks/useActiveTripId.ts`

### Key Principles

1. **Happy DOM provides globals** - `window`, `document`, `localStorage` available
2. **Mock browser APIs** - Replace `window.location` and `localStorage` as needed
3. **SSR safety testing** - Test `typeof window === "undefined"` paths
4. **Use React Testing Library** - `@testing-library/react` works seamlessly with Bun + Happy DOM

### Setup

Install React Testing Library:

```bash
bun add -d @testing-library/react @testing-library/jest-dom
```

Add the DOM types reference to test files:

```typescript
/// <reference lib="dom" />
```

### Example

```typescript
import { renderHook } from "@testing-library/react";
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { useActiveTripId, ACTIVE_TRIP_STORAGE_KEY } from "../useActiveTripId";

describe("useActiveTripId", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    window.localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    window.localStorage.clear();
  });

  test("extracts tripId from URL search params", () => {
    const mockLocation = {
      ...originalLocation,
      search: "?tripId=abc123",
    };

    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useActiveTripId());
    expect(result.current).toBe("abc123");
  });

  test("falls back to localStorage when no URL param", () => {
    window.localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, "stored-trip-id");

    const { result } = renderHook(() => useActiveTripId());
    expect(result.current).toBe("stored-trip-id");
  });
});
```

### SSR Safety Testing

**Note**: Since React Testing Library requires a DOM environment, you cannot completely remove `window` in tests. Instead, test SSR behavior through:

1. **Code review** - Verify the hook has `if (typeof window === "undefined")` check
2. **Static analysis** - The check is verified by TypeScript compilation
3. **Integration testing** - Test SSR behavior in an actual SSR environment

```typescript
test("hook includes SSR safety check", () => {
  // Verify module loads (proves no immediate window access)
  const hookModule = import("../useActiveTripId");
  expect(hookModule).toBeDefined();

  // Actual SSR behavior is verified by:
  // - TypeScript compilation
  // - Code review of typeof window check
  // - Integration tests in SSR environment
});
```

## Pattern 5: Zustand Store Testing

**Use for**: Zustand state management

**Example**: Testing auth store

### Key Principles

- Zustand stores can be tested directly (no React needed)
- Use `store.setState()` to reset between tests
- Use `store.getState()` to read current state
- Mock external dependencies (Supabase, etc.) before testing actions

### Example

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

## Pattern 6: Fastify Testing

**Use for**: Fastify server utilities

### Key Principles

- Mock Fastify types at the type level only
- Test with realistic header objects
- Verify both success and edge cases (undefined, arrays)

### Example

```typescript
import { describe, expect, test } from "bun:test";
import { fastifyHeadersToFetchHeaders } from "../headers";

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

## Bun-Specific Behaviors

### Buffer vs btoa()

When encoding/decoding base64 for JWTs or similar:

```typescript
// Use Buffer for consistent behavior across environments
const base64Encode = (obj: object): string => {
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString("base64");
};

// Bun's btoa() can produce encoding that Buffer.from(str, "base64")
// fails to decode correctly in some cases
```

### Console Error Handling

Bun's `Buffer.from(str, "base64")` may log errors to console for invalid base64,
but still throws an exception that can be caught. This is different from Node.js
which silently throws. Tests should use `spyOn(console, "error")` to suppress
expected error output.

### React Testing Library with Bun

Bun works seamlessly with React Testing Library for testing React components and hooks:

```bash
bun add -d @testing-library/react @testing-library/jest-dom
```

Add DOM types to test files:

```typescript
/// <reference lib="dom" />

import { test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

test('renders component', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

### Mock Function Differences

Bun's `mock()` from `bun:test`:

```typescript
import { mock } from "bun:test";

const myMock = mock(() => "result");

// Similar to Jest's jest.fn()
expect(myMock).toHaveBeenCalledTimes(1);
expect(myMock).toHaveBeenCalledWith("arg");
```

## Quick Reference

### Common Test Scenarios

| Scenario         | Approach                 | Example              |
| ---------------- | ------------------------ | -------------------- |
| Pure utility     | No mocks                 | `fileValidation.ts`  |
| External types   | Type-level stub          | `headers.ts`         |
| Async/timers     | Real timers, short waits | `scheduler.ts`       |
| React hooks      | @testing-library/react   | `useActiveTripId.ts` |
| React components | @testing-library/react   | Component tests      |
| Console output   | spyOn with mockRestore   | All patterns         |
| Zustand stores   | Direct store testing     | `authStore.ts`       |
| Fastify utils    | Type-level mocking       | `headers.ts`         |

### Directory Structure

```
src/
  utils/
    myUtil.ts
    __tests__/
      myUtil.test.ts  <- Test file location
```

### File Organization

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

### Import Conventions

```typescript
// Test imports use bun:test
import { describe, expect, test, mock } from "bun:test";

// Source imports use relative paths
import { myFunction } from "../myUtil";

// External mocks use mock.module
mock.module("@mirai-app/trpc/client", () => ({ ... }));
```

### Running Tests

```bash
# All tests
bun test

# Specific test file
bun test apps/web/src/lib/__tests__/fileValidation.test.ts

# With coverage
bun test --coverage

# Filter by test name
bun test -t "formatBytes"
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

## Next Steps for Full Coverage

Apply these patterns to:

1. **All hooks in `apps/native/src/hooks/`** (47 files) - will need Jest setup for native
2. **All stores in `packages/shared/src/stores/`** (4 files)
3. **Remaining utilities in `apps/web/src/lib/`** (6 files)
4. **Backend services in `apps/backend-server/src/`**

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Bun DOM Testing Guide](https://bun.sh/docs/test/dom) - React Testing Library & Happy DOM setup
- [Happy DOM Documentation](https://github.com/capricorn86/happy-dom)
- Existing test examples in `packages/trpc/src/**/__tests__/*.test.ts`
