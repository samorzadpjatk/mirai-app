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
packages/trpc/
├── src/
│   ├── routers/
│   │   └── user.ts
│   └── test/
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
// packages/trpc/src/test/setup.ts
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

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
