# @mirai-app/shared

Shared utilities and types used across the MIRAI app monorepo.

## Overview

This package contains common functionality that is shared between different applications and packages in the monorepo, including:

- **Pure business logic** - Domain-specific pure functions extracted from hooks and routers (challenges, groups, trips, users, coins, feed, notifications, rewards, sponsors, storage, etc.)
- **Storage utilities** - File storage standards and configurations
- **State management** - Zustand stores for shared application state (auth, map, judgement)
- **Trip information** - Types and utilities specific to trip data
- **Test utilities** - Shared test helpers, mock factories, and data builders for all packages
- **Shared exports** - Centralized access to all shared functionality

## Structure

```
packages/shared/
├── src/
│   ├── challengeSubmissions/  # Challenge submission validation & points
│   ├── challengeVote/         # Challenge vote builders and validators
│   ├── challenges/            # Challenge query builders, validators, mappers
│   ├── coins/                 # Coin builders, mappers, statistics
│   ├── feed/                  # Activity feed filters and reactions
│   ├── groups/                # Group flattening, filters, permissions
│   ├── locations/             # Location data mappers
│   ├── notifications/         # Notification delivery and schedule utilities
│   ├── reports/               # Report builders
│   ├── rewards/               # Reward progress calculation and validation
│   ├── sponsors/              # Sponsor filters
│   ├── storage/               # Storage-related utilities and standards
│   ├── stores/                # Zustand stores for shared state management
│   ├── test-utils/            # Shared test utilities and helpers
│   │   ├── index.ts              # Barrel exports
│   │   ├── mock-factories.ts     # Mock factories for Supabase/session/user
│   │   ├── test-data-builders.ts # Builder pattern for test data
│   │   └── test-helpers.ts       # Async/mocking helpers
│   ├── tripInfo/              # Trip information types and utilities
│   ├── trips/                 # Trip filters, leaderboard, query builders
│   ├── users/                 # User pagination, ban utils, validation
│   ├── utils/                 # General utilities (logger, pagination)
│   └── index.ts               # Main exports
├── package.json
├── tsconfig.json
├── vitest.config.ts       # Vitest configuration
├── vitest.base.config.ts  # Shared Vitest base config
└── README.md
```

## Installation

```bash
bun install
```

## Usage

```typescript
import { sharedUtility, SharedType } from "@mirai-app/shared";

// Example usage
const result = sharedUtility.someFunction();
```

## Development

This package is part of the monorepo and should be developed in conjunction with other packages. Changes here can affect multiple applications.

## Testing

This package uses **Vitest** for testing. For comprehensive testing guidelines, see the [root TESTING.md](../../TESTING.md).

### Test Commands

```bash
# Run tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage report
bun run test:coverage
```

## Test Utilities

The `src/test-utils/` directory contains shared testing utilities used across the monorepo. These helpers reduce boilerplate and provide consistent patterns for writing tests.

### Available Utilities

#### Mock Factories (`mock-factories.ts`)

Pre-configured mock creators for common objects:

- `createMockSupabaseClient(options?)` - Creates a mock Supabase client for testing database interactions
- `createMockUser(overrides?)` - Creates a mock user object with sensible defaults
- `createMockSession(overrides?)` - Creates a mock session object for authentication tests

#### Test Data Builders (`test-data-builders.ts`)

Fluent builder pattern for constructing test data:

- `TestDataBuilder` - Base builder class with `.with()` and `.build()` methods
- `userBuilder` - Pre-configured builder for creating user test data
- `tripBuilder` - Pre-configured builder for creating trip test data
- `eventBuilder` - Pre-configured builder for creating event test data

#### Test Helpers (`test-helpers.ts`)

Utility functions for common testing scenarios:

- `resetMocks()` - Clears all Vitest mocks between tests
- `mockConsole()` - Mocks console methods and returns a restore function
- `flushPromises()` - Flushes pending promises for async testing
- `waitFor(condition, timeout?)` - Waits for a condition to be met with optional timeout

### Usage Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockUser,
  createMockSupabaseClient,
  userBuilder,
  resetMocks,
  flushPromises
} from '@mirai-app/shared/test-utils';

describe('MyComponent', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should handle user data', async () => {
    // Using mock factory
    const mockUser = createMockUser({ name: 'John Doe' });

    // Using builder pattern for complex objects
    const testUser = userBuilder
      .with({ name: 'Jane Smith' })
      .with({ email: 'jane@example.com' })
      .build();

    // Using test helpers
    await flushPromises();

    expect(testUser.name).toBe('Jane Smith');
  });
});
```

## More Information

- [Monorepo Documentation](../../README.md)
- [Bun Documentation](https://bun.com)
