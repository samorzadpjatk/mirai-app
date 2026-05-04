# Architecture Synthesis - Testing Infrastructure

## Research Summary

### Current State Analysis
- **Monorepo**: Turborepo + Bun workspaces
- **9 Projects**: 4 apps (native, backend-server, notification-sender, seed) + 5 packages (auth, db, shared, supabase, trpc)
- **Current Testing**: Only supabase package has complete vitest setup
- **Missing**: All other 8 projects lack test configuration

### Key Findings from Analysis

1. **Partial Setup Exists**:
   - `packages/supabase`: ✅ Complete (vitest.config.ts, vitest.setup.ts, test scripts)
   - `apps/backend-server`: ✅ Has test scripts, ❌ Missing vitest.config.ts
   - `apps/notification-sender`: ✅ Has test scripts, ❌ Missing vitest.config.ts
   - `packages/trpc`: ✅ Has test scripts, ❌ Missing vitest.config.ts
   - Others: ❌ No test setup at all

2. **Technology Stack**:
   - Bun 1.3.6+ (package manager)
   - TypeScript 5.9+
   - Expo SDK 52 (native app)
   - Fastify + tRPC (backend)
   - Prisma + Supabase (database)

3. **Dependency Graph**:
   ```
   shared ──┐
   supabase ┤
   db ──────┤
            ├──→ auth ───→ trpc ───→ backend-server, notification-sender
            │                     └──→ native (via client)
            └───────────────────────→ native
   ```

## Solution Strategy

### Dual Test Runner Approach

**Rationale**: Different testing requirements for React Native vs Node.js

| Project Type | Runner | Reason |
|--------------|--------|--------|
| apps/native | Jest | jest-expo preset required for React Native |
| All others (8 projects) | Vitest | Fast, native TypeScript, no compilation |

### Key Architectural Decisions

1. **Jest for Native**:
   - Uses `jest-expo` preset for React Native compatibility
   - Mocks required for Expo modules (expo-font, expo-secure-store, etc.)
   - Transform ignore patterns for React Native packages

2. **Vitest for Backend/Packages**:
   - Native TypeScript support (no ts-jest needed)
   - Faster execution with Vite engine
   - Built-in coverage with @vitest/coverage-v8
   - Consistent configuration across all Node.js projects

3. **Turborepo Pipeline Integration**:
   - Test task depends on build (ensures compiled artifacts exist)
   - Caching enabled for test outputs (coverage reports)
   - `turbo run test` executes all tests in dependency order

4. **Workspace Alias Resolution**:
   - Jest: `moduleNameMapping` for `@mirai-app/*` imports
   - Vitest: `resolve.alias` for `~` and workspace imports

## Testing Architecture

### Jest Configuration (apps/native)

```
jest.config.js
├── preset: 'jest-expo'
├── setupFilesAfterEnv: ['jest.setup.js']
├── transformIgnorePatterns: [React Native packages]
├── moduleNameMapping: {@mirai-app/* → ../../packages/*/src}
└── coverageThreshold: {50% minimum}

jest.setup.js
├── @testing-library/jest-native/extend-expect
├── Mock expo-constants
├── Mock expo-secure-store
└── Mock @supabase/supabase-js
```

### Vitest Configuration (8 projects)

```
vitest.config.ts
├── test.globals: true
├── test.environment: 'node'
├── test.include: ['src/**/__tests__/**/*.test.ts']
├── coverage.provider: 'v8'
├── coverage.reporter: ['text', 'json', 'html']
└── resolve.alias: {~ → ./src}

vitest.setup.ts (for packages with external deps)
├── Mock @mirai-app/supabase
├── Mock @mirai-app/db
└── Set process.env.NODE_ENV = 'test'
```

### Test File Organization

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
└── utils/
    ├── formatDate.ts
    └── __tests__/
        └── formatDate.test.ts
```

## Turborepo Pipeline Strategy

### Task Dependencies

```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  },
  "test:ci": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  }
}
```

**Reasoning**:
- `dependsOn: ["^build"]` ensures packages are built before testing
- `outputs: ["coverage/**"]` enables Turborepo caching of coverage reports
- Separate `test:ci` task for CI-specific flags (passWithNoTests)

### Execution Flow

```
turbo run test
├── packages/shared (no deps)
├── packages/supabase (no deps)
├── packages/db (depends on supabase)
├── packages/auth (depends on db, supabase, shared)
├── packages/trpc (depends on auth, db, shared, supabase)
├── apps/backend-server (depends on trpc)
├── apps/notification-sender (depends on trpc, db, supabase)
├── apps/seed (depends on db, supabase)
└── apps/native (depends on trpc, auth, shared, supabase)
```

## CI/CD Integration

### GitHub Actions Workflow

**Trigger**: Push to main, Pull requests
**Path filters**: apps/**, packages/**, config files

**Job Steps**:
1. Checkout code
2. Setup Node.js 24
3. Install Bun
4. Install dependencies (`bun install`)
5. Run ESLint (`bun run lint`)
6. Run TypeScript check (`bun run typecheck`)
7. **Run tests (`bun run test:ci`)** ← NEW
8. Upload coverage to Codecov (PRs only)

### Coverage Reporting

- **Provider**: @vitest/coverage-v8 (Vitest), built-in (Jest)
- **Reporters**: text, json, html
- **Threshold**: 50% minimum (branches, functions, lines, statements)
- **Upload**: codecov/codecov-action@v4

## Expected File Changes

### Files to Create (12)

| # | File | Purpose |
|---|------|---------|
| 1 | `apps/native/jest.config.js` | Jest configuration with jest-expo preset |
| 2 | `apps/native/jest.setup.js` | Jest setup with Expo mocks |
| 3 | `apps/backend-server/vitest.config.ts` | Vitest configuration |
| 4 | `apps/notification-sender/vitest.config.ts` | Vitest configuration |
| 5 | `apps/seed/vitest.config.ts` | Vitest configuration |
| 6 | `packages/trpc/vitest.config.ts` | Vitest configuration |
| 7 | `packages/auth/vitest.config.ts` | Vitest configuration |
| 8 | `packages/auth/vitest.setup.ts` | Vitest setup with mocks |
| 9 | `packages/shared/vitest.config.ts` | Vitest configuration |
| 10 | `packages/shared/src/__tests__/example.test.ts` | Example test |
| 11 | `packages/auth/src/__tests__/example.test.ts` | Example test |
| 12 | `apps/native/src/__tests__/example.test.tsx` | Example test |

### Files to Modify (9)

| # | File | Changes |
|---|------|---------|
| 1 | `package.json` (root) | Add test, test:ci scripts |
| 2 | `apps/native/package.json` | Add Jest deps and test scripts |
| 3 | `apps/notification-sender/package.json` | Update test script with coverage |
| 4 | `apps/seed/package.json` | Add vitest deps and test scripts |
| 5 | `packages/auth/package.json` | Add vitest deps and test scripts |
| 6 | `packages/shared/package.json` | Add vitest deps and test scripts |
| 7 | `turbo.json` | Enhance test task with dependsOn |
| 8 | `.github/workflows/ci.yml` | Add test execution step |
| 9 | `README.md` | Add testing documentation |

### Files Already Configured (2)

| # | File | Status |
|---|------|--------|
| 1 | `packages/supabase/vitest.config.ts` | ✅ Complete |
| 2 | `packages/supabase/vitest.setup.ts` | ✅ Complete |

## Implementation Phases

### Phase 1: Infrastructure (Foundation)
1. Root package.json - Add test scripts
2. turbo.json - Enhance test task
3. CI workflow - Add test execution

### Phase 2: Packages (Independent)
4. packages/shared - Add vitest config + example test
5. packages/auth - Add vitest config + mocks + example test
6. packages/trpc - Add vitest config + example test

### Phase 3: Apps (Depend on packages)
7. apps/backend-server - Add vitest config + example test
8. apps/notification-sender - Add vitest config + example test
9. apps/seed - Add vitest config + example test

### Phase 4: Native (Separate Jest setup)
10. apps/native - Add Jest config + setup + example test

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Workspace imports fail | Configure moduleNameMapping (Jest) and resolve.alias (Vitest) |
| Native modules crash | Mock all Expo/React Native modules in jest.setup.js |
| Database connections | Mock @mirai-app/db in vitest.setup.ts |
| Test flakiness | Use deterministic mocks, avoid real network calls |
| CI timeouts | Set reasonable test timeouts, use --maxWorkers=2 |
| Coverage gaps | Set 50% threshold, focus on critical paths first |

## Success Criteria

- [ ] `bun run test` executes tests in all 9 projects
- [ ] `turbo run test` runs tests in dependency order
- [ ] All tests pass with at least one example test per project
- [ ] Coverage reports generated in `coverage/` directories
- [ ] CI workflow runs tests on PR and blocks on failure
- [ ] README documents how to run tests locally

---

*Generated: Architecture synthesis for testing infrastructure setup*
