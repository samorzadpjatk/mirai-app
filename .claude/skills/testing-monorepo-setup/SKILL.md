# Testing Monorepo Setup Skill

> **Purpose**: Set up unit testing infrastructure for TypeScript monorepo with Jest for Expo React Native and Vitest for backend packages.

## Overview

This skill provides complete setup instructions for adding unit tests to a Turborepo + Bun workspaces monorepo with:
- **Jest** for Expo React Native (apps/native)
- **Vitest** for Fastify + tRPC backend (apps/backend-server, apps/notification-sender)
- **Vitest** for shared utility packages (packages/*)
- **Turborepo pipeline** integration
- **GitHub Actions CI/CD** workflow updates

## Prerequisites

- Bun 1.3.6+ (package manager)
- Node.js 20+
- Turborepo 2.8.12+
- TypeScript 5.9+

## Installation Commands

### 1. Jest for Expo React Native (apps/native)

```bash
cd apps/native

# Core testing dependencies
bun add -D jest jest-expo @testing-library/react-native @testing-library/jest-native

# TypeScript support
bun add -D @types/jest ts-jest

# Additional utilities
bun add -D jest-environment-jsdom @testing-library/react-hooks
```

**Key packages explained:**
- `jest-expo`: Jest preset for Expo/React Native
- `@testing-library/react-native`: React Native testing utilities
- `@testing-library/jest-native`: Custom Jest matchers for RN
- `ts-jest`: TypeScript preprocessor for Jest

### 2. Vitest for Backend & Packages

```bash
# For each package that needs testing (run from package directory)
cd apps/backend-server
bun add -D vitest @vitest/coverage-v8

cd apps/notification-sender
bun add -D vitest @vitest/coverage-v8

cd packages/trpc
bun add -D vitest @vitest/coverage-v8

cd packages/auth
bun add -D vitest @vitest/coverage-v8

cd packages/shared
bun add -D vitest @vitest/coverage-v8

cd packages/db
bun add -D vitest @vitest/coverage-v8
```

**Key packages explained:**
- `vitest`: Fast Vite-native test runner
- `@vitest/coverage-v8`: Code coverage using V8 engine

## Configuration Templates

### Jest Configuration (apps/native/jest.config.js)

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@tanstack/.*)"
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/index.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  testMatch: [
    "**/__tests__/**/*.test.{ts,tsx}",
    "**/?(*.)+(spec|test).{ts,tsx}"
  ],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@mirai-app/(.*)$": "<rootDir>/../../packages/$1/src"
  }
};
```

### Jest Setup File (apps/native/jest.setup.js)

```javascript
import "@testing-library/jest-native/extend-expect";

// Mock Expo modules
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true)
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock NativeWind
jest.mock("nativewind", () => ({
  styled: (component) => component
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
```

### Vitest Configuration Template (vitest.config.ts)

For backend apps and packages:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*"
      ]
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@mirai-app/*": path.resolve(__dirname, "../../packages/*/src")
    }
  }
});
```

### Vitest Setup File (vitest.setup.ts)

```typescript
// Global test setup
import { vi } from "vitest";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Global mocks
vi.mock("@mirai-app/db", async () => {
  const actual = await vi.importActual("@mirai-app/db");
  return {
    ...actual,
    prisma: {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      }
    }
  };
});
```

## Package.json Scripts Update

### apps/native/package.json

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### Backend apps and packages package.json

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

## Turborepo Pipeline Configuration

Update `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".astro/**"]
    },
    "clean": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "format:check": {
      "outputs": []
    },
    "format:write": {
      "outputs": []
    }
  }
}
```

## CI/CD Workflow Update

Update `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: ["main"]
    paths:
      - "apps/**"
      - "packages/**"
      - "*.js"
      - "*.ts"
      - "*.json"
      - "*.yml"
      - "*.yaml"
      - ".github/**"
      - "!.env*"
      - "!docs/**"
      - "!environment/**"
      - "!Dockerfile*"
      - "!*.md"
  pull_request:
    branches: ["main"]
    paths:
      - "apps/**"
      - "packages/**"
      - "*.js"
      - "*.ts"
      - "*.json"
      - "*.yml"
      - "*.yaml"
      - ".github/**"
      - "!.env*"
      - "!docs/**"
      - "!environment/**"
      - "!Dockerfile*"
      - "!*.md"

jobs:
  build_test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v6

      - name: Use Node.js 24
        uses: actions/setup-node@v6
        with:
          node-version: 24

      - name: Install Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run ESLint for monorepo
        run: bun run lint

      - name: Run TypeScript type checking
        run: bun run typecheck

      - name: Run tests
        run: bun run test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: github.event_name == 'pull_request'
        with:
          files: ./apps/*/coverage/**/coverage.xml,./packages/*/coverage/**/coverage.xml
          flags: unittests
          name: codecov-umbrella
```

## Test File Naming Conventions

### Directory Structure

```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
├── utils/
│   ├── formatDate.ts
│   └── __tests__/
│       └── formatDate.test.ts
└── services/
    ├── api.ts
    └── __tests__/
        └── api.test.ts
```

### Naming Rules

1. **Test files**: `[name].test.ts` or `[name].test.tsx`
2. **Test directories**: `__tests__/` co-located with source files
3. **Test doubles**: `[name].mock.ts` or `__mocks__/[name].ts`
4. **Fixtures**: `__fixtures__/[name].ts`

## Example Test Patterns

### React Native Component Test

```typescript
// apps/native/src/components/__tests__/Button.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "../Button";

describe("Button", () => {
  it("renders correctly with text", () => {
    const { getByText } = render(<Button title="Press me" onPress={() => {}} />);
    expect(getByText("Press me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Press me" onPress={onPress} />);
    
    fireEvent.press(getByText("Press me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### tRPC Router Test

```typescript
// packages/trpc/src/routers/__tests__/user.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../index";
import { createCaller } from "../../test-utils";

describe("user router", () => {
  const caller = createCaller();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get user by id", async () => {
    const user = await caller.user.getById({ id: "123" });
    expect(user).toBeDefined();
    expect(user.id).toBe("123");
  });
});
```

### Utility Function Test

```typescript
// packages/shared/src/utils/__tests__/formatDate.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "../formatDate";

describe("formatDate", () => {
  it("formats ISO date to readable string", () => {
    const result = formatDate("2024-01-15T10:30:00Z");
    expect(result).toBe("January 15, 2024");
  });

  it("handles invalid dates", () => {
    expect(() => formatDate("invalid")).toThrow("Invalid date");
  });
});
```

## Common Pitfalls and Solutions

### 1. Jest: "Cannot find module" for workspace packages

**Problem**: Jest cannot resolve `@mirai-app/*` workspace imports.

**Solution**: Add moduleNameMapping to jest.config.js:

```javascript
moduleNameMapping: {
  "^@mirai-app/(.*)$": "<rootDir>/../../packages/$1/src"
}
```

### 2. Vitest: "Cannot find module" for workspace packages

**Problem**: Vitest cannot resolve workspace imports.

**Solution**: Add resolve.alias to vitest.config.ts:

```typescript
resolve: {
  alias: {
    "@mirai-app/*": path.resolve(__dirname, "../../packages/*/src")
  }
}
```

### 3. React Native: "Native module cannot be null"

**Problem**: Native modules not available in test environment.

**Solution**: Mock native modules in jest.setup.js:

```javascript
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true }))
}));
```

### 4. Expo: "Font not loaded" errors

**Problem**: Expo fonts not loaded during tests.

**Solution**: Mock expo-font in jest.setup.js:

```javascript
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true)
}));
```

### 5. Coverage reports not generated

**Problem**: Running tests but no coverage reports.

**Solution**: Ensure `--coverage` flag is passed:

```json
{
  "scripts": {
    "test": "vitest run --coverage"
  }
}
```

### 6. Turborepo caching test results

**Problem**: Tests not running after code changes.

**Solution**: Add `dependsOn: ["build"]` to test task or disable cache for tests:

```json
{
  "test": {
    "dependsOn": ["build"],
    "outputs": ["coverage/**"],
    "cache": true
  }
}
```

### 7. TypeScript path aliases not working in tests

**Problem**: Tests fail to resolve TypeScript path aliases.

**Solution**: Configure both tsconfig.json and test config:

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"],
      "@mirai-app/*": ["../../packages/*/src"]
    }
  }
}
```

### 8. Database connections in tests

**Problem**: Tests trying to connect to real database.

**Solution**: Use mock database or test database:

```typescript
// vitest.setup.ts
vi.mock("@mirai-app/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}));
```

## Root Package.json Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:ci": "turbo run test --concurrency=1"
  }
}
```

## Verification Checklist

After setup, verify:

- [ ] `bun run test` executes tests in all packages
- [ ] Coverage reports generated in `coverage/` directories
- [ ] CI workflow runs tests on PR
- [ ] Test files follow naming conventions
- [ ] Workspace imports resolve correctly
- [ ] Native modules mocked for RN tests
- [ ] Turborepo pipeline includes test task

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/docs/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
- [Turborepo Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
