# TypeScript Coding Standards

## Overview

TypeScript conventions for the MIRAI monorepo.

## General Rules

### Strict Mode

Always enable strict mode:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### File Naming

| Type | Naming | Example |
|------|--------|---------|
| Components | PascalCase | `UserCard.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `UserTypes.ts` |
| Constants | UPPER_SNAKE_CASE or camelCase | `API_URL` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |

## Type Definitions

### Prefer Interfaces for Objects

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid for objects
type UserType = {
  id: string;
  name: string;
};
```

### Use Type for Unions/Intersections

```typescript
// Good
type Status = 'idle' | 'loading' | 'success' | 'error';
type UserOrNull = User | null;

// Good for complex types
type ApiResponse<T> = {
  data: T;
  error: Error | null;
};
```

### Explicit Return Types

```typescript
// Good - explicit return type
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good - inferred is OK for simple cases
const add = (a: number, b: number) => a + b;
```

### Null Safety

```typescript
// Good - handle null
function getUserName(user: User | null): string {
  return user?.name ?? 'Anonymous';
}

// Avoid
function getUserName(user: User | null): string {
  return user.name; // Error if user is null
}
```

## Naming Conventions

### Variables

```typescript
// Good
const userCount = 10;
const isLoading = true;

// Avoid
const user_count = 10;
const loading = true; // Not descriptive enough
```

### Functions

```typescript
// Good - verb or verb phrase
function fetchUser() { }
function validateEmail() { }
function calculateTotal() { }

// Boolean functions - prefix with verb
function isValidEmail() { }
function hasPermission() { }
function canEditPost() { }
```

### Generic Parameters

```typescript
// Good
function identity<T>(value: T): T {
  return value;
}

// Better with constraints
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | null {
  return items.find(item => item.id === id) ?? null;
}
```

## Import Patterns

### Order

1. External dependencies
2. Internal packages (`@mirai-app/*`)
3. Relative imports
4. Types only imports last

```typescript
// Good
import { useState } from 'react';
import { z } from 'zod';

import { trpc } from '@mirai-app/trpc/client';
import { colors } from '@mirai-app/shared/design-tokens';

import { UserCard } from './components/UserCard';
import type { User } from './types';
```

### Path Aliases

```typescript
// Good - use alias
import { utils } from '@/utils';

// Avoid deep relative paths
import { utils } from '../../../utils';
```

## Error Handling

### Typed Errors

```typescript
// Good
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

// Usage
function handleError(error: unknown): never {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error', error);
  }
  throw error;
}
```

## Async Patterns

### Promise Handling

```typescript
// Good
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Avoid mixing async/await with .then
// Avoid
fetchData()
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## Best Practices

1. **Always type function parameters**
2. **Use strict null checks**
3. **Prefer `const` over `let`**
4. **Use `readonly` for immutable data**
5. **Document complex types with JSDoc**
6. **Avoid `any` - use `unknown` if type is truly unknown**

## Further Reading

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
