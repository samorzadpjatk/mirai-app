# Research: Testing Setup for MIRAI Monorepo

## Date: 2025-05-04
## Task: Add unit tests to monorepo with Jest for native and Vitest for packages

---

## Current State Analysis

### Monorepo Structure
- **Build System**: Turborepo 2.8.12 + Bun workspaces
- **Package Manager**: Bun 1.3.6
- **TypeScript**: 5.9.3

### Apps
1. **apps/native**: Expo React Native (Expo ~54.0.33, RN 0.81.5)
   - Current test scripts: None defined
   - Missing: Jest, jest-expo, testing-library

2. **apps/backend-server**: Fastify + tRPC
   - Current test scripts: `test: vitest run --coverage`
   - Has: vitest, @vitest/coverage-v8
   - Status: ✅ Already configured

3. **apps/notification-sender**: Worker service
   - Current test scripts: `test: vitest run`
   - Has: vitest, @vitest/coverage-v8
   - Status: ✅ Already configured

4. **apps/seed**: CLI tool
   - Current test scripts: None
   - Missing: Vitest setup

### Packages
1. **packages/trpc**: tRPC routers
   - Current test scripts: `test: vitest run --coverage`
   - Status: ✅ Already configured

2. **packages/auth**: Authentication utilities
   - Current test scripts: None
   - Has: jsdom as devDependency (for testing)
   - Missing: Vitest setup

3. **packages/shared**: Shared utilities
   - Current test scripts: None
   - Missing: Vitest setup

4. **packages/db**: Prisma client
   - Current test scripts: None
   - Missing: Vitest setup

5. **packages/supabase**: Supabase client
   - Current test scripts: `test: vitest run --coverage`
   - Has: vitest.config.ts
   - Status: ✅ Already configured

### Existing Test Configuration

**packages/supabase/vitest.config.ts**:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Turborepo Pipeline (turbo.json)

Current test task:
```json
{
  "test": {
    "outputs": ["coverage/**"]
  }
}
```

Missing:
- `dependsOn` for build dependency
- `test:watch` task configuration

### CI/CD Workflow (.github/workflows/ci.yml)

Current state:
- Runs lint
- Runs typecheck
- Reports TypeScript errors to PR via reviewdog
- **Missing**: Test execution step

### Key Findings

1. **Partial Setup**: 3 out of 9 packages already have Vitest configured
2. **Native App Gap**: No testing setup for Expo/React Native
3. **CI Gap**: Tests not running in CI pipeline
4. **Naming Inconsistency**: Some packages use `test:ci`, others don't
5. **Coverage**: Only some packages have coverage configured

### Required Installations

#### For apps/native (Jest):
- jest
- jest-expo
- @testing-library/react-native
- @testing-library/jest-native
- @types/jest
- ts-jest
- jest-environment-jsdom

#### For packages needing Vitest:
- vitest
- @vitest/coverage-v8

Packages needing setup:
- packages/auth
- packages/shared
- packages/db
- apps/seed (optional)

### Configuration Patterns Found

**Working Vitest Pattern** (from packages/supabase):
- Config file: `vitest.config.ts`
- Setup file: `vitest.setup.ts`
- Test location: `src/**/__tests__/**/*.test.ts`
- Globals enabled: true
- Environment: node

**Package.json Scripts Pattern**:
```json
{
  "test": "vitest run --coverage",
  "test:watch": "vitest",
  "test:ui": "vitest --ui"
}
```

### Workspace Import Resolution

Current monorepo uses:
- `@mirai-app/*` for internal packages
- Need alias configuration in both Jest and Vitest configs

### Recommendations

1. **Priority 1**: Set up Jest for apps/native (highest impact)
2. **Priority 2**: Add Vitest to packages/auth, packages/shared, packages/db
3. **Priority 3**: Update CI workflow to run tests
4. **Priority 4**: Standardize test scripts across all packages
5. **Priority 5**: Add coverage thresholds

### Test File Structure Convention

Proposed structure:
```
src/
├── components/
│   └── __tests__/
│       └── Component.test.tsx
├── hooks/
│   └── __tests__/
│       └── useHook.test.ts
└── utils/
    └── __tests__/
        └── util.test.ts
```

### Special Considerations for Expo

- Need to mock native modules
- Transform ignore patterns for RN/Expo packages
- Setup file for jest-native matchers
- Module name mapping for workspace packages

### Special Considerations for tRPC

- Need test utilities for creating callers
- Mock database/prisma in setup
- Type-safe test helpers

### CI Integration Points

- Add test step after typecheck
- Upload coverage to codecov
- Parallel test execution with Turborepo
- Cache test results appropriately

---

## Research Sources

- Root package.json
- turbo.json
- .github/workflows/ci.yml
- apps/*/package.json (all 4 apps)
- packages/*/package.json (all 5 packages)
- packages/supabase/vitest.config.ts (existing working config)
- All AGENTS.md files for context

## Notes

- Bun is used as package manager, not npm/yarn/pnpm
- Turborepo handles task orchestration
- Workspace protocol: `workspace:*`
- React 19.1.0, React Native 0.81.5
- Expo SDK 54
- Fastify 5.6.2, tRPC 11.10.0
