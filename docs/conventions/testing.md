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

## File Organization

```
packages/orpc/
├── src/
│   ├── api/
│   │   └── routers/
│   │       └── user.ts
│   └── __tests__/
│       ├── user.test.ts        # Test file
│       └── setup.ts            # Test setup
├── vitest.config.ts
└── package.json
```

## Naming

| Type | Naming | Example |
|------|--------|---------|
| Test file | `*.test.ts` | `user.test.ts` |
| Test suite | descriptive | `describe('User router')` |
| Test case | should/when | `it('should create user')` |

## Test Structure

### AAA Pattern

```typescript
import { describe, it, expect } from 'vitest';

describe('calculateTotal', () => {
  it('should sum item prices', () => {
    // Arrange
    const items = [
      { price: 10 },
      { price: 20 },
    ];
    
    // Act
    const result = calculateTotal(items);
    
    // Assert
    expect(result).toBe(30);
  });
});
```

## oRPC Testing

### Creating Test Caller

```typescript
// packages/orpc/src/test/setup.ts
import { appRouter } from '../routers';
import { createContext } from './test-context';

export const createCaller = async () => {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
};
```

### Testing Procedures

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createCaller } from './setup';

describe('user router', () => {
  let caller: ReturnType<typeof createCaller>;
  
  beforeAll(async () => {
    caller = await createCaller();
  });
  
  it('should create user', async () => {
    const user = await caller.user.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    
    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
  });
  
  it('should require email', async () => {
    await expect(
      caller.user.create({ email: '', name: 'Test' })
    ).rejects.toThrow();
  });
});
```

## React Component Testing

### Setup

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCard } from './UserCard';

const user = userEvent.setup();
```

### Test Example

```typescript
describe('UserCard', () => {
  it('should display user name', () => {
    render(<UserCard name="John Doe" email="john@example.com" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
  
  it('should call onEdit when edit clicked', async () => {
    const onEdit = vi.fn();
    render(<UserCard name="John" email="john@example.com" onEdit={onEdit} />);
    
    await user.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(onEdit).toHaveBeenCalled();
  });
});
```

## Async Testing

### Waiting for Elements

```typescript
it('should load data', async () => {
  render(<DataComponent />);
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  // Check data is displayed
  expect(await screen.findByText('Data loaded')).toBeInTheDocument();
});
```

### Testing Loading States

```typescript
it('should show loading state', () => {
  render(<DataComponent />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

## Mocking

### Vitest Mocks

```typescript
// Mock module
vi.mock('@mirai-app/db', () => ({
  createDb: vi.fn(() => ({
    query: {
      users: {
        findMany: vi.fn(),
      },
    },
  })),
}));
```

### Mocking API Calls

```typescript
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'John' }),
}));
```

### Manual Mocks with __mocks__ Directory

For modules mocked consistently across many tests, use the `__mocks__` directory pattern:

```
├── __mocks__/
│   ├── @tanstack/
│   │   └── react-query.ts
│   ├── expo-constants.js
│   └── expo-location.js
└── src/
    └── services/
        └── __mocks__/
            └── myService.ts
```

Benefits:
- Centralized mock implementations
- Consistent behavior across tests
- Reduced setup boilerplate

## Coverage

### Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
      ],
    },
  },
});
```

### Running Coverage

```bash
bun run test --coverage
```

## Test Quality Standards

### The "Mock Verification" Anti-Pattern

- **Pattern**: Mock `useQuery`/`useMutation`, return fake data, assert the hook returns that exact data.
- **Problem**: Tests the mock, not the code. Passes even if actual API, cache keys, or error handling is broken.
- **Prevalence**: 40+ native hook test files in this monorepo.
- **Rule**: Test behavior, not implementation. If a test passes with a dummy implementation, delete or rewrite it.

### Transaction Rollback Testing Gap

- **Critical**: `$transaction` mock in router tests is a pass-through. No rollback/atomicity is ever tested.
- **Rule**: Add at least one failure-path transaction test per router. Create `MockTransactionDB` that simulates rollback.

### Verification Checklist for All Tests

Before merging any test, verify:

- [ ] Does the test verify **output/behavior**, not just that a mock was called?
- [ ] Would the test **fail** if the real implementation had a bug?
- [ ] Does the test still pass if you replace the implementation with a dummy? If **yes** → delete or rewrite.
- [ ] Are error paths tested (timeout, retry exhaustion, partial failure)?
- [ ] Are transactions tested for rollback on failure?

### Test Value Ratings (Evidence-Based)

| Area | Rating | Why |
|------|--------|-----|
| Router tests (`packages/orpc`) | 4/5 | Test actual router outputs via `createRouterClient` |
| Auth logic tests (`packages/auth`) | 4/5 | Verify real auth branches (token, roles, bans) |
| Store tests (`packages/shared`) | 3/5 | Good state transitions but has useless runtime type tests |
| Component tests (`apps/native`) | 4/5 | Improved — mock removal completed for 14 test files, real component rendering |
| Hook tests (`apps/native`) | 3/5 | Improving — pure function extraction ongoing; mock-verification tests being replaced |
| Database tests (`packages/db`) | N/A | Explicitly no unit tests — needs integration tests |

### Component Mock Removal Playbook

**Context**: Mocking shared UI components per test (`jest.mock("~/components/common/ui")`).

**Problem**: Breaks when component API changes; tests fake behavior rather than real component rendering.

**Steps**:
1. Delete `jest.mock("~/components/common/ui")` from test file
2. Add descriptive `testID` props to real components (if missing)
3. Update test queries: `getByTestId("mock-id")` → `getByTestId("real-component-id")` or `getByText`
4. Run tests. If component API changed since mock was written, fix the test to match real behavior.
5. Verify the test still fails if the real component breaks.

**Examples of descriptive testIDs**:
- `ThemedTextInput` → `testID="themed-text-input"`
- `SegmentedOption` → `testID="segmented-option-${label}"`
- `AppModalFooter` → `primaryTestID="app-modal-footer-primary"`, `secondaryTestID="app-modal-footer-secondary"`

### Pure Function Extraction Playbook

**Context**: Hook test files exceeding 200 lines mocking React Query internals.

**Steps**:
1. Identify 30–60 lines of domain logic inside hook (callbacks, transformations, calculations)
2. Extract to top-level function with dependencies passed as parameters
3. Write unit tests for the extracted function using real data (no mocks)
4. Replace hook body with thin imperative shell calling the extracted function
5. Delete or shrink hook test file if it only verified mocks

**Naming conventions**:
| Prefix | Use case |
|--------|----------|
| `calculateXxx` | Derived state from inputs |
| `syncXxx` | Reconcile local and remote state |
| `executeXxx` | Side-effectful operation with DI |
| `buildXxx` | Factory for callbacks/closures |
| `toXxxOrNull` | Type coercion with validation |

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

## Best Practices

1. **Test behavior, not implementation** - Test what code does, not how
2. **One assertion per test** ideally, or related assertions
3. **Descriptive test names** - Clear about what's being tested
4. **Keep tests simple** - No logic in tests
5. **Test edge cases** - Empty arrays, null values, errors
6. **Use factories** for test data:
   ```typescript
   const createUser = (overrides = {}) => ({
     id: '1',
     email: 'test@example.com',
     ...overrides,
   });
   ```

### What NOT to Test

- **TypeScript interface runtime tests**: `expect(user.role).toBe(role)` after assigning `role` — TypeScript compiler already verifies this.
- **"It didn't crash" tests**: `expect(element).toBeOnTheScreen()` after rendering with a prop.
- **Framework plumbing**: Testing that React Query's `isLoading` flag propagates through your hook.
- **Mock call counts**: `expect(mockFn).toHaveBeenCalledTimes(1)` — tests implementation, not behavior.

## Running Tests

```bash
# All tests
nx run-many -t test

# Watch mode
bun run test:watch

# UI mode
bun run test:ui

# Specific file
bun run test src/test/user.test.ts
```

## Test Runner

### Vitest vs Bun Test Runner

**Rule**: This monorepo uses Vitest (`vitest run`), NOT Bun's native test runner.

- `bun test` → uses Bun's built-in test runner. **DO NOT USE.** It lacks support for `vi.importActual`, `vi.stubGlobal`, `vi.fn().mockRejectedValueOnce()`, and other vitest-specific APIs.
- `bun run test` → runs `vitest run` per `package.json` script. **ALWAYS USE THIS.**

**Verification**: If you see `TypeError: vi.importActual is not a function` or `TypeError: vi.stubGlobal is not a function`, you are running `bun test` instead of `bun run test`.

### Test Failure Classification

When seeing many test failures after a refactoring:
1. First run `bun run test` (vitest) to get the real picture
2. If vitest passes but `bun test` fails → the failures are false positives from the wrong runner
3. If both fail → investigate actual regressions

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
