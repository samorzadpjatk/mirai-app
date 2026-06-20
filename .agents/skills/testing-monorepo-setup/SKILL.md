---
name: testing-monorepo-setup
description: Set up unit testing infrastructure for TypeScript monorepo with Jest for Expo React Native and Vitest for backend packages, using Nx + Bun workspaces.
version: 1.0.0
license: MIT
---

## Overview

This skill provides complete setup instructions for adding unit tests to an Nx + Bun workspaces monorepo with:
- **Jest** for Expo React Native (apps/native)
- **Vitest** for Hono + oRPC backend (apps/backend-server, apps/notification-sender)
- **Vitest** for shared utility packages (packages/*)
- **Nx pipeline** integration via `@nx/vitest` and `@nx/jest` plugins
- **GitHub Actions CI/CD** workflow updates

## Prerequisites

- Bun 1.3.6+ (package manager)
- Node.js 20+
- Nx 22.7+ (workspace orchestrator)
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

cd packages/orpc
bun add -D vitest @vitest/coverage-v8

cd packages/auth
bun add -D vitest @vitest/coverage-v8

cd packages/common
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
  moduleNameMapper: {
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
    drizzle: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
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

## Nx Pipeline Configuration

The Nx pipeline is configured in `nx.json` via `targetDefaults`. Runners are auto-detected by Nx plugins — `@nx/vitest` for Vitest packages and `@nx/jest` for the native app:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "plugins": [
    "@nx/expo",
    {
      "plugin": "@nx/js/typescript",
      "options": {
        "typecheck": { "targetName": "typecheck" },
        "build": {
          "targetName": "build",
          "configName": "tsconfig.build.json",
          "buildDepsName": "build-deps",
          "watchDepsName": "watch-deps"
        }
      }
    },
    {
      "plugin": "@nx/eslint/plugin",
      "options": { "targetName": "lint" }
    },
    {
      "plugin": "@nx/vitest",
      "options": {
        "targetName": "test",
        "ciTargetName": "test:ci",
        "configName": "vitest.config.ts"
      }
    },
    {
      "plugin": "@nx/jest",
      "options": {
        "targetName": "test",
        "ciTargetName": "test:ci"
      }
    },
    {
      "plugin": "@nx-tools/nx-container",
      "options": { "targetName": "container" }
    }
  ],
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build", "db:generate"],
      "outputs": ["{projectRoot}/dist/**", "{projectRoot}/.astro/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/coverage/**"],
      "cache": true
    },
    "test:ci": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/coverage/**"],
      "cache": true
    },
    "test:watch": {
      "cache": false
    },
    "lint": {
      "dependsOn": ["^lint"],
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": true
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

### oRPC Router Test

```typescript
// packages/orpc/src/api/routers/__tests__/user.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../root";
import { createCaller } from "../../../test-utils";

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
// packages/common/src/utils/__tests__/formatDate.test.ts
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

**Solution**: Add moduleNameMapper to jest.config.js:

```javascript
moduleNameMapper: {
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

### 6. Nx caching test results

**Problem**: Tests not running after code changes.

**Solution**: Add test to `targetDefaults` in `nx.json` to control caching:

```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["{projectRoot}/coverage/**"],
    "cache": true
  }
}
```

To force re-run tests and bypass cache, use:

```bash
nx run-many -t test --skip-nx-cache
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
  drizzle: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([])
  }
}));
```

## Root Package.json Scripts

Add to root `package.json`. Nx discovers targets automatically from plugin configuration, so test tasks are available via `nx run-many`:

```json
{
  "scripts": {
    "test": "nx run-many -t test",
    "test:watch": "nx run-many -t test:watch",
    "test:coverage": "nx run-many -t test:coverage",
    "test:ci": "nx run-many -t test:ci"
  }
}
```

For affected-only testing in CI (runs tests only for changed packages and their dependents):

```bash
bunx nx affected -t test --base=origin/main
```

## Verification Checklist

After setup, verify:

- [ ] `bun run test` executes tests in all packages
- [ ] Coverage reports generated in `coverage/` directories
- [ ] CI workflow runs tests on PR
- [ ] Test files follow naming conventions
- [ ] Workspace imports resolve correctly
- [ ] Native modules mocked for RN tests
- [ ] Nx targetDefaults includes test task

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/docs/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)

