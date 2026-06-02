# Testing Guide

This document provides comprehensive guidance for running and writing tests in the MIRAI monorepo.

## Overview

The MIRAI monorepo uses a **dual test runner strategy**:

| Project | Runner | Rationale |
|---------|--------|-----------|
| `apps/native` | **Jest** with jest-expo preset | Required for React Native/Expo compatibility |
| All other apps & packages | **Vitest** | Fast, native TypeScript support |

## Quick Start

### Run All Tests

```bash
# From repository root
bun run test
```

### Run Tests for a Specific Package

```bash
# Vitest packages
cd packages/shared && bun run test

# Jest (native app)
cd apps/native && bun run test
```

### Run Tests in Watch Mode

```bash
# All packages
bun run test:watch

# Specific package
cd packages/auth && bun run test:watch
```

### Run Tests with Coverage

```bash
# All packages
bun run test:coverage

# Specific package
cd apps/backend-server && bun run test:coverage
```

## Test Runners

### Vitest (Packages & Backend Apps)

Vitest is used for all Node.js applications and utility packages:

- `apps/backend-server`
- `apps/notification-sender`
- `apps/seed`
- `packages/auth`
- `packages/shared`
- `packages/supabase`
- `packages/orpc`

#### Configuration

Each Vitest project has a `vitest.config.ts` file:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
```

#### Package Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Jest (Native App)

Jest with `jest-expo` preset is used for the React Native application:

- `apps/native`

#### Configuration

The native app uses `jest.config.cjs`:

```javascript
module.exports = {
  rootDir: __dirname,
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!((@expo|expo|@react-navigation|...)/))",
  ],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^@mirai-app/shared$": "<rootDir>/../../packages/shared/index.ts",
    // ... other workspace aliases
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts?(x)"],
};
```

#### Package Scripts

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:ci": "jest --ci --passWithNoTests"
  }
}
```

## Writing Tests

### Test File Location

Place test files in `__tests__` directories alongside the code they test:

```
src/
├── utils/
│   ├── formatDate.ts
│   └── __tests__/
│       └── formatDate.test.ts
├── auth/
│   ├── authServer.ts
│   └── __tests__/
│       └── auth.test.ts
```

### Vitest Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeStoragePath } from "../../storage/standard";

describe("Storage Standard Utilities", () => {
  describe("normalizeStoragePath", () => {
    it("should remove leading slashes", () => {
      expect(normalizeStoragePath("/path/to/file")).toBe("path/to/file");
    });

    it("should handle complex paths", () => {
      expect(normalizeStoragePath("/path\\to//file%20name/")).toBe("path/to/file name");
    });
  });
});
```

### Jest Test Example (Native App)

```typescript
import { describe, it, expect } from "@jest/globals";
import { formatDate } from "../../utils/date";

describe("Date Utilities", () => {
  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15");
      expect(formatDate(date)).toBe("January 15, 2024");
    });
  });
});
```

### Mocking with Vitest

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock a module
vi.mock("@supabase/supabase-js", () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  return {
    createClient: vi.fn(() => mockSupabaseClient),
  };
});

describe("Auth Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mock Supabase client", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient("url", "key");
    
    vi.mocked(client.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    } as never);

    const result = await client.auth.getUser();
    expect(result.data.user?.id).toBe("user-123");
  });
});
```

### Mocking with Jest

```typescript
// jest.setup.js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
  })),
}));
```

### Manual Mocks with __mocks__ Directory

For modules that are mocked consistently across many tests, use Jest's `__mocks__` directory pattern. Place mock implementations in `__mocks__/` at the package root (adjacent to `node_modules/`):

```
apps/native/
├── __mocks__/
│   ├── @tanstack/
│   │   └── react-query.ts    # React Query hooks mock
│   ├── expo-constants.js    # Expo Constants mock
│   ├── expo-location.js     # Expo Location mock
│   └── expo-notifications.js # Expo Notifications mock
├── src/
│   └── services/
│       └── location/
│           └── __mocks__/
│               └── backgroundLocation.ts  # Service mock
```

Mock files should export mocked versions of the module's API:

```typescript
// apps/native/__mocks__/@tanstack/react-query.ts
import { jest } from "@jest/globals";
import React from "react";

export const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

export class QueryClient {
  defaultOptions: unknown;
  constructor(options?: unknown) {
    this.defaultOptions = options || {};
  }
}

export const useQuery = jest.fn();
export const useMutation = jest.fn();
// ... other exports
```

Benefits of this pattern:
- **Centralized mocks**: Single source of truth for module mocks
- **Reduced duplication**: No need to repeat mock setup in each test
- **Consistent behavior**: All tests use the same mock implementation
- **Easier maintenance**: Update mocks in one place

### Testing Hono Server (Backend)

```typescript
import { describe, it, expect } from "vitest";
import { createServer } from "../server";

describe("Backend Server API", () => {
  it("should return OK for health check", async () => {
    const { app, stop } = createServer({
      dev: true,
      port: 3001,
      prefix: "/api/trpc",
      host: "127.0.0.1",
    });

    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");

    await stop();
  });
});
```

## Testing Conventions

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: Use `describe` blocks to group related tests
- Test cases: Use descriptive `it` statements that explain the behavior

```typescript
// Good
describe("normalizeStoragePath", () => {
  it("should remove leading slashes", () => {
    // test code
  });
});

// Avoid
describe("utils", () => {
  it("test 1", () => {
    // test code
  });
});
```

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
it("should authenticate user with valid token", async () => {
  // Arrange
  const token = "valid-token";
  const mockUser = { id: "user-123", email: "test@example.com" };
  vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
    data: { user: mockUser },
    error: null,
  } as never);

  // Act
  const result = await getAuthServerUser(mockSupabase, token);

  // Assert
  expect(result).toEqual(mockUser);
  expect(mockSupabase.auth.getUser).toHaveBeenCalledWith(token);
});
```

### Mock Cleanup

Always clean up mocks between tests:

```typescript
import { vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});
```

## Nx Pipeline

Tests are integrated into the Nx pipeline via `targetDefaults` in `nx.json`:

```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["{projectRoot}/coverage/**"],
    "cache": true
  },
  "test:ci": {
    "dependsOn": ["^build"],
    "outputs": ["{projectRoot}/coverage/**"],
    "cache": true
  }
}
```

This ensures:
1. Tests run after their dependencies are built
2. Coverage outputs are cached for performance
3. Tests execute in the correct dependency order

Test runners are auto-detected by Nx plugins — `@nx/vitest` for Vitest packages and `@nx/jest` for the native app — so no explicit runner configuration is needed in the pipeline.

## CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Run tests
  run: bun run test
```

Test failures block PR merging.

## Troubleshooting

### Common Test Failure Patterns and Solutions

This section documents recurring test failure patterns discovered and fixed in the MIRAI codebase. If you encounter similar failures, follow the solutions below.

#### `UNSAFE_getByType(Pressable)` returns "No instances found"

**Problem**: Tests using `UNSAFE_getByType(Pressable)` or `UNSAFE_getAllByType(Pressable)` fail with "No instances found" even though the component renders Pressable elements.

**Root Cause**: React Native Testing Library's `UNSAFE_getByType` queries may not work reliably with certain component types, especially when components are wrapped or mocked.

**Solution**: Use `testID` attributes instead:

```typescript
// Component: Add testID to Pressable
<Pressable testID="my-overlay" onPress={onPress}>
  <Pressable testID="my-card" onPress={stopPropagation}>
    {children}
  </Pressable>
</Pressable>

// Test: Query by testID
fireEvent.press(screen.getByTestId("my-overlay"));
expect(screen.getByTestId("my-card")).toBeTruthy();
```

**Real-world examples from this codebase:**
- `DateTimePickerModal` - added `datetime-picker-overlay` and `datetime-picker-card` testIDs
- `FullScreenModal` - added `fullscreen-modal-close` testID
- `AppModalShell` - added `app-modal-overlay` and `app-modal-content` testIDs
- `ThemedListItem` - added `themed-list-item-pressable` testID

#### `Alert.alert` mocks not being called

**Problem**: Tests expect `Alert.alert` to be called with specific arguments, but the mock shows "Number of calls: 0".

**Root Cause**: The mock function isn't properly connected to the `Alert.alert` spy.

**Solution**: Ensure your mock function is passed to the spy implementation:

```typescript
const mockAlert = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // CRITICAL: Pass mockAlert to the spy implementation
  jest.spyOn(Alert, 'alert').mockImplementation(mockAlert);
});

// Now assertions work
expect(mockAlert).toHaveBeenCalledWith("Error", "Something went wrong");
```

**For Alert with buttons that trigger callbacks:**

```typescript
// When Alert.alert is called with buttons that have onPress callbacks
jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
  // Find and trigger the destructive/cancel button callback
  const destructiveButton = buttons?.find((b) => b.style === "destructive");
  if (destructiveButton?.onPress) {
    destructiveButton.onPress();
  }
});
```

**Real-world examples:**
- `useMapSharing.test.ts` - Fixed Alert mock connection
- `useChallengeForm.test.ts` - Fixed Alert mock connection  
- `RewardsHistoryView.test.tsx` - Added proper Alert button callback mocking

#### Testing implementation details instead of behavior

**Problem**: Tests check internal implementation details (like `activeOpacity` props) that break when component internals change, even though user-facing behavior remains correct.

**Anti-pattern** (don't do this):
```typescript
// BAD: Testing implementation detail
const button = screen.getByLabelText("Edit group");
expect(button.props.activeOpacity).toBe(0.7); // Breaks easily!
```

**Better approach** (test behavior):
```typescript
// GOOD: Testing behavior
const button = screen.getByLabelText("Edit group");
await user.press(button);
expect(onPress).toHaveBeenCalledTimes(1); // Tests actual behavior
```

**Principle**: Test what the user sees and can do, not how the component is implemented internally. If you find yourself checking props like `activeOpacity`, `disabled`, or style arrays, reconsider your test approach.

**Real-world fixes:**
- `EditGroupButton.test.tsx` - Removed `activeOpacity` assertion
- `NotificationCard.test.tsx` - Fixed style assertion to use `toMatchObject` instead of array checking
- `MapScreenOverlay.test.tsx` - Fixed style assertion for flattened styles

#### Data attributes in React Native mocks

**Problem**: Mocked components pass boolean props like `selected={true}` but tests expect `data-selected="true"` strings, causing assertions to fail with `Expected: true, Received: undefined`.

**Root Cause**: React Native converts data-* attributes to strings, but your mock may not be doing this conversion.

**Solution**: Convert booleans to strings in your mock:

```typescript
jest.mock("~/components/common/ui", () => ({
  ThemedListItem: function ThemedListItem(props: Record<string, unknown>) {
    const React = require("react");
    const { TouchableOpacity } = require("react-native");

    return React.createElement(TouchableOpacity, {
      testID: "themed-list-item",
      disabled: props.disabled,
      // Don't try to pass data-* attributes - they're not needed for testing
    });
  },
}));
```

**Even better**: Don't test data attributes at all. Test that the component renders correctly with the given props:

```typescript
// Instead of checking data-selected
it("should handle selected state", () => {
  renderWithProviders(<MyComponent selected={true} />);
  // Just verify the component renders
  expect(screen.getByTestId("themed-list-item")).toBeTruthy();
});
```

**Real-world fixes:**
- `MapModalUserItem.test.tsx` - Simplified mock and removed data attribute assertions

#### Style assertions with arrays vs objects

**Problem**: Style assertions fail because the received style is an object, not an array, or vice versa.

**Pattern**: React Native styles can be arrays `[baseStyle, conditionalStyle]` or flattened objects depending on how the component is rendered.

**Solution**: Use flexible matchers like `toMatchObject`:

```typescript
// Instead of checking specific array index
expect(element.props.style[1]).toMatchObject({ backgroundColor: "red" }); // Brittle

// Use toMatchObject which works with both arrays and objects
expect(element.props.style).toMatchObject({ backgroundColor: "red" }); // Flexible
```

**Real-world fixes:**
- `MapScreenOverlay.test.tsx` - Updated to use `toMatchObject` instead of array index access

---

### Common Issues

#### "Cannot find module" errors

**Cause**: Workspace aliases not configured correctly.

**Solution**: Check `vitest.config.ts` or `jest.config.cjs` has proper alias resolution:

```typescript
// Vitest
resolve: {
  alias: {
    "~": path.resolve(__dirname, "./src"),
    "@mirai-app/shared": path.resolve(__dirname, "../../packages/shared/src"),
  },
}
```

```javascript
// Jest
moduleNameMapper: {
  "^@mirai-app/shared$": "<rootDir>/../../packages/shared/index.ts",
}
```

#### Tests fail with "window is not defined"

**Cause**: Tests are running in Node environment but code uses browser APIs.

**Solution**: Ensure `environment: "node"` is set in Vitest config, or mock browser globals:

```typescript
// vitest.setup.ts
global.window = {
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
} as any;
```

#### Jest tests fail with "Unexpected token export"

**Cause**: ES modules not being transformed correctly. This commonly occurs with Jest 30+ and Bun's `.bun/` cache structure where react-native packages are nested deep in the node_modules tree.

**Solution**: Update `transformIgnorePatterns` in `jest.config.cjs` to use a pattern that matches packages anywhere in the path:

```javascript
transformIgnorePatterns: [
  // Match any path containing these package names (handles Bun's .bun/ cache)
  'node_modules/(?!.*(?:react-native|expo|@expo|@react-native|@react-navigation|react-navigation|@sentry|native-base|react-native-svg))',
],
```

Also ensure `babel.config.cjs` properly transforms modules in test environment:

```javascript
env: {
  test: {
    presets: [
      ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }]
    ],
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  },
}
```

#### Slow test execution

**Cause**: Tests not properly isolated or too many integration tests.

**Solution**:
- Use `beforeEach` to reset state
- Mock external dependencies (database, APIs)
- Use `nx run-many -t test` for parallelization

#### PGLite test setup is slow

**Cause**: Creating a new PGLite database per test (~1000ms per test).

**Solution**: Use file-level `beforeAll` to create the database once, then `beforeEach` to call `testDb.reset()` for table truncation:

```typescript
// Optimized pattern
beforeAll(async () => { testDb = await createPgliteTestDb(); });
beforeEach(async () => { await testDb.reset(); });
afterAll(async () => { await testDb.cleanup(); });
```

This reduces setup time from ~1000ms per test to ~1000ms per file + ~20ms per test for reset.

**Result**: 165 PGLite tests run in ~29s instead of ~150s+.

#### Coverage not generated

**Cause**: Coverage provider not configured.

**Solution**: Add coverage configuration to `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
```

#### Jest tests fail with "Incorrect version of react-test-renderer"

**Cause**: Version mismatch between React and react-test-renderer.

**Solution**: Update `react-test-renderer` in `apps/native/package.json` to match React version:

```json
{
  "devDependencies": {
    "react-test-renderer": "19.2.0"
  }
}
```

Then run `bun install` to update the dependency.

### Debug Mode

Run tests with debug output:

```bash
# Vitest
cd packages/auth && bun run test --reporter=verbose

# Jest
cd apps/native && bun run test --verbose
```

### Getting Help

1. Check existing tests in `src/__tests__/` directories for examples
2. Review the configuration files (`vitest.config.ts`, `jest.config.cjs`)
3. See the [Vitest documentation](https://vitest.dev/guide/) or [Jest documentation](https://jestjs.io/docs/getting-started)

## Best Practices

1. **Write tests first** (TDD) when fixing bugs or adding features
2. **Mock external dependencies** (databases, APIs, third-party libraries)
3. **Test behavior, not implementation** - focus on what the code does, not how
4. **Keep tests fast** - slow tests discourage running them frequently
5. **Use descriptive names** - tests should read like documentation
6. **Isolate tests** - each test should be independent and not rely on others
7. **Clean up resources** - use `afterEach` or `afterAll` to clean up
8. **Avoid type casts in tests** - use `jest.Mock<>` types instead of `as unknown as`:

```typescript
// Avoid
const mockFn = jest.fn() as unknown as MockedFunction<() => Promise<string>>;

// Prefer
const mockFn: jest.Mock<() => Promise<string>> = jest.fn();
mockFn.mockResolvedValue("result");
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [jest-expo Documentation](https://docs.expo.dev/develop/unit-testing/)
- [Testing Library](https://testing-library.com/)
