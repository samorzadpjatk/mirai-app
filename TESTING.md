# Testing Best Practices

This document outlines the testing best practices for the MIRAI monorepo.

## Overview

We use a hybrid testing approach:

- **Bun test** for `packages/*`, `apps/web`, `apps/backend-server`, `apps/notification-sender`
- **Jest** with jest-expo preset for `apps/native` (React Native/Expo requirement)

## Test Organization

Tests are colocated with source files in `__tests__/` directories:

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

### Native Module Mocks

Jest mocks are in `apps/native/src/__mocks__/`:

- `expo-location.ts` - Location permissions and tracking
- `expo-notifications.ts` - Push notifications
- `expo-camera.ts` - Camera functionality
- `expo-file-system.ts` - File operations
- `@react-native-async-storage/async-storage.ts` - Storage
- `@tanstack/react-query.ts` - React Query hooks
- `@mirai-app/trpc/client.ts` - tRPC client

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

## Related Files

- `bunfig.toml` - Bun test configuration
- `apps/native/jest.config.cjs` - Jest configuration
- `apps/native/jest.setup.cjs` - Jest setup file with global mocks
- `.github/workflows/ci.yml` - Main CI workflow
- `.github/workflows/coverage.yml` - Coverage reporting workflow
