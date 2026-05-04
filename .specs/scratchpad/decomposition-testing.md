# Decomposition: Add Unit Tests to Monorepo

## Overview

This scratchpad contains the detailed decomposition of the unit testing infrastructure implementation for the MIRAI monorepo.

**Task**: Add unit tests to monorepo with Jest for native and Vitest for packages
**Total Projects**: 9 (1 native app + 3 Node.js apps + 5 packages)
**Strategy**: Dual test runner (Jest for React Native, Vitest for Node.js)

---

## Phase 1: Setup (Root Configuration & Shared Dependencies)

### Step 1.1: Root Package.json Test Scripts
**Estimate**: Tiny (5-15 min)
**Agent**: haiku

**Success Criteria**:
- Root `package.json` has `test` script that runs `turbo run test`
- Root `package.json` has `test:ci` script that runs `turbo run test:ci`
- Scripts use Bun as the runner

**Subtasks**:
1. Add `"test": "turbo run test"` to root package.json scripts
2. Add `"test:ci": "turbo run test:ci"` to root package.json scripts

**Blockers**: None

**Risks**:
- Risk: Scripts may conflict with existing scripts
  - Mitigation: Check existing scripts before adding

---

### Step 1.2: Turborepo Pipeline Configuration
**Estimate**: Small (15-30 min)
**Agent**: haiku

**Success Criteria**:
- `turbo.json` has `test` pipeline task configured
- `test` task has `dependsOn: ["^build"]` to ensure builds complete first
- `test` task has `outputs: ["coverage/**"]` for caching
- `test:ci` task configured similarly

**Subtasks**:
1. Add `test` pipeline to turbo.json with proper dependencies
2. Add `test:ci` pipeline for CI-specific test execution
3. Verify pipeline ordering matches dependency graph

**Blockers**: None

**Risks**:
- Risk: Pipeline may create circular dependencies
  - Mitigation: Review dependency graph before configuration

---

### Step 1.3: Shared Test Utilities Package (Optional)
**Estimate**: Small (15-30 min)
**Agent**: sonnet

**Success Criteria**:
- Common mock utilities created in `packages/shared/src/testing/`
- Mock factories for Supabase, Prisma, Expo modules
- Reusable test helpers exported

**Subtasks**:
1. Create `packages/shared/src/testing/` directory
2. Create `mock-factories.ts` with common mocks
3. Create `test-helpers.ts` with utilities
4. Export from `packages/shared/src/index.ts`

**Blockers**: None

**Risks**:
- Risk: May not be needed immediately - can defer to Phase 4
  - Mitigation: Mark as optional, implement only if time permits

---

## Phase 2: Foundational (Packages with Existing Infrastructure)

### Step 2.1: Verify packages/supabase Configuration
**Estimate**: Tiny (5-15 min)
**Agent**: haiku

**Success Criteria**:
- `packages/supabase/vitest.config.ts` exists and is valid
- `packages/supabase/vitest.setup.ts` exists with proper mocks
- `packages/supabase/package.json` has test script
- Running `bun run test` in package passes

**Subtasks**:
1. Verify vitest.config.ts exists and is valid
2. Verify vitest.setup.ts exists with Supabase mocks
3. Verify test script in package.json
4. Run test to confirm it passes

**Blockers**: None (already configured)

**Risks**: None (already working)

---

### Step 2.2: Configure packages/shared
**Estimate**: Small (15-30 min)
**Agent**: sonnet

**Success Criteria**:
- `packages/shared/vitest.config.ts` created with TypeScript support
- `packages/shared/package.json` has test script with vitest
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest as devDependency to package.json
2. Create `vitest.config.ts` with proper configuration
3. Create `src/__tests__/example.test.ts` with simple passing test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**: None

**Risks**:
- Risk: Shared package may have complex utilities requiring extensive mocking
  - Mitigation: Start with simple example test, expand coverage later

---

### Step 2.3: Configure packages/db
**Estimate**: Small (15-30 min)
**Agent**: sonnet

**Success Criteria**:
- `packages/db/vitest.config.ts` created (optional - primarily integration tested)
- Decision made: skip unit tests (db typically integration tested)
- Document decision in task file

**Subtasks**:
1. Evaluate if unit tests are appropriate for db package
2. If yes, create vitest.config.ts with Prisma mocking setup
3. If no, document decision and skip

**Blockers**: None

**Risks**:
- Risk: Prisma client requires complex mocking
  - Mitigation: Recommend integration tests over unit tests for db layer

---

## Phase 3: Core Implementation (Remaining Packages)

### Step 3.1: Configure packages/auth
**Estimate**: Medium (30-60 min)
**Agent**: sonnet

**Success Criteria**:
- `packages/auth/vitest.config.ts` created with workspace alias resolution
- `packages/auth/vitest.setup.ts` created with Supabase and DB mocks
- `packages/auth/package.json` has test script
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with:
   - TypeScript support
   - Workspace alias `@mirai-app/*` resolution
   - Globals enabled
   - Setup file reference
3. Create `vitest.setup.ts` with:
   - Supabase client mocks
   - Prisma/DB mocks
   - Mock cleanup between tests
4. Create `src/__tests__/example.test.ts` with auth logic test
5. Add test script to package.json
6. Run test to verify setup

**Blockers**: 
- Requires packages/shared to be configured (for shared utilities)
- Requires packages/supabase to be verified (for Supabase mocks reference)

**Risks**:
- Risk: Auth logic may have complex dependencies on Supabase
  - Mitigation: Create comprehensive mocks in setup file
- Risk: Circular dependencies between auth and db packages
  - Mitigation: Mock db layer, don't import actual db code

---

### Step 3.2: Configure packages/trpc
**Estimate**: Medium (30-60 min)
**Agent**: sonnet

**Success Criteria**:
- `packages/trpc/vitest.config.ts` created with workspace alias resolution
- `packages/trpc/package.json` has test script
- At least one example test exists and passes (router test)
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with:
   - TypeScript support
   - Workspace alias resolution
   - Globals enabled
3. Create `src/__tests__/example.test.ts` with simple router test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**:
- Requires packages/auth to be configured (trpc depends on auth)
- Requires packages/db to be configured or mocked

**Risks**:
- Risk: tRPC routers may have complex context requirements
  - Mitigation: Create mock context factory for tests
- Risk: Router tests may require database connections
  - Mitigation: Mock all database calls in router tests

---

### Step 3.3: Configure apps/backend-server
**Estimate**: Medium (30-60 min)
**Agent**: sonnet

**Success Criteria**:
- `apps/backend-server/vitest.config.ts` created with Fastify/tRPC testing support
- `apps/backend-server/package.json` has test script
- At least one example test exists and passes (API endpoint test)
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with:
   - TypeScript support
   - Fastify testing environment setup
   - tRPC client for testing routers
3. Create `src/__tests__/example.test.ts` with simple endpoint test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**:
- Requires packages/trpc to be configured
- Requires packages/auth to be configured

**Risks**:
- Risk: Fastify server tests may require port binding
  - Mitigation: Use Fastify's inject() method for testing without ports
- Risk: tRPC integration may be complex
  - Mitigation: Create helper to build testable tRPC caller

---

### Step 3.4: Configure apps/notification-sender
**Estimate**: Small (15-30 min)
**Agent**: sonnet

**Success Criteria**:
- `apps/notification-sender/vitest.config.ts` created
- `apps/notification-sender/package.json` has test script
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with TypeScript support
3. Create `src/__tests__/example.test.ts` with notification logic test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**:
- Requires packages/trpc to be configured (for type sharing)
- Requires packages/db to be configured or mocked

**Risks**:
- Risk: Expo Push Notification service may require API keys
  - Mitigation: Mock Expo SDK in tests

---

### Step 3.5: Configure apps/seed
**Estimate**: Small (15-30 min)
**Agent**: sonnet

**Success Criteria**:
- `apps/seed/vitest.config.ts` created
- `apps/seed/package.json` has test script
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with TypeScript support
3. Create `src/__tests__/example.test.ts` with seed logic test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**:
- Requires packages/db to be configured or mocked

**Risks**:
- Risk: Seed scripts may modify database
  - Mitigation: Mock all database operations in unit tests

---

### Step 3.6: Configure apps/native (Jest + jest-expo)
**Estimate**: Large (60-120 min)
**Agent**: opus

**Success Criteria**:
- `apps/native/jest.config.js` created with jest-expo preset
- `apps/native/jest.setup.js` created with Expo and Supabase mocks
- `apps/native/package.json` has Jest dependencies and test scripts
- TypeScript support configured for Jest
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add Jest dependencies to package.json:
   - jest
   - jest-expo
   - @types/jest
   - ts-jest or babel-jest for TypeScript
2. Create `jest.config.js` with:
   - jest-expo preset
   - Transform ignore patterns for React Native packages
   - Module name mapping for workspace aliases (`@mirai-app/*`)
   - Setup file reference
3. Create `jest.setup.js` with:
   - Expo modules mocks
   - React Native mocks
   - Supabase client mocks
   - Mock cleanup between tests
4. Create `src/__tests__/example.test.tsx` with simple component test
5. Add test script to package.json
6. Run test to verify setup

**Blockers**:
- Requires all packages to be configured (native depends on trpc, auth, shared, supabase)

**Risks**:
- Risk: jest-expo preset may have version conflicts
  - Mitigation: Ensure jest-expo version matches Expo SDK version
- Risk: Metro bundler quirks may cause test failures
  - Mitigation: Configure proper transform ignore patterns
- Risk: React Native modules may not mock cleanly
  - Mitigation: Use jest-expo's built-in mocks as base
- Risk: TypeScript configuration may be complex
  - Mitigation: Use ts-jest with Expo's tsconfig

---

## Phase 4: Polish (CI/CD, Documentation)

### Step 4.1: GitHub Actions CI/CD Integration
**Estimate**: Small (15-30 min)
**Agent**: sonnet

**Success Criteria**:
- `.github/workflows/ci.yml` has test execution step
- Tests run on PRs and pushes to main
- Test failures cause workflow failure
- Coverage reports uploaded (optional)

**Subtasks**:
1. Add test step to CI workflow after lint and typecheck
2. Configure test step to run `bun run test:ci`
3. Ensure test failures block PR merging
4. (Optional) Add coverage upload to Codecov

**Blockers**:
- Requires all projects to have test scripts configured

**Risks**:
- Risk: CI environment may differ from local
  - Mitigation: Use same Bun version in CI as locally
- Risk: Tests may be slow in CI
  - Mitigation: Use turbo caching for tests

---

### Step 4.2: Documentation Updates
**Estimate**: Small (15-30 min)
**Agent**: haiku

**Success Criteria**:
- Root README.md has testing instructions
- Each app's README.md has testing instructions
- Clear documentation on running tests locally and in CI

**Subtasks**:
1. Add testing section to root README.md
2. Update each app's README.md with test instructions
3. Document the dual test runner strategy
4. Add troubleshooting section for common test issues

**Blockers**:
- Requires all test configurations to be complete

**Risks**:
- Risk: Documentation may become outdated
  - Mitigation: Keep documentation concise and high-level

---

### Step 4.3: Final Verification & Integration Testing
**Estimate**: Small (15-30 min)
**Agent**: sonnet

**Success Criteria**:
- `turbo run test` from root executes all tests successfully
- All 9 projects have at least one passing test
- No test failures or errors
- Total test execution time < 5 minutes

**Subtasks**:
1. Run `turbo run test` from repository root
2. Verify all projects execute tests
3. Verify all tests pass
4. Check total execution time
5. Fix any issues found

**Blockers**:
- Requires all previous steps to be complete

**Risks**:
- Risk: Some tests may fail in integrated run but pass individually
  - Mitigation: Run tests multiple times to check for flakiness
- Risk: Test execution time may exceed 5 minutes
  - Mitigation: Optimize slow tests, use parallelization

---

## Implementation Summary Table

| Phase | Step | Project | Runner | Estimate | Dependencies |
|-------|------|---------|--------|----------|--------------|
| 1 | 1.1 | Root | N/A | Tiny | None |
| 1 | 1.2 | Root | N/A | Small | 1.1 |
| 1 | 1.3 | packages/shared | N/A | Small | 1.2 |
| 2 | 2.1 | packages/supabase | Vitest | Tiny | 1.2 |
| 2 | 2.2 | packages/shared | Vitest | Small | 1.2 |
| 2 | 2.3 | packages/db | N/A | Tiny | 1.2 |
| 3 | 3.1 | packages/auth | Vitest | Medium | 2.2, 2.1 |
| 3 | 3.2 | packages/trpc | Vitest | Medium | 3.1 |
| 3 | 3.3 | apps/backend-server | Vitest | Medium | 3.2 |
| 3 | 3.4 | apps/notification-sender | Vitest | Small | 3.2 |
| 3 | 3.5 | apps/seed | Vitest | Small | 2.3 |
| 3 | 3.6 | apps/native | Jest | Large | 3.1, 3.2, 2.2, 2.1 |
| 4 | 4.1 | CI/CD | N/A | Small | 3.6 |
| 4 | 4.2 | Documentation | N/A | Small | 3.6 |
| 4 | 4.3 | Integration | N/A | Small | 4.1, 4.2 |

---

## Critical Path

The critical path (longest dependency chain) is:

```
1.1 → 1.2 → 2.2 → 3.1 → 3.2 → 3.3 → 3.6 → 4.1 → 4.3
```

**Critical Path Duration**: ~5.5 hours (with parallelization, actual wall time ~2 hours)

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| jest-expo version conflicts | Medium | High | Verify Expo SDK compatibility |
| React Native module mocking issues | Medium | High | Use jest-expo built-in mocks |
| Circular dependencies in test setup | Low | Medium | Mock instead of import |
| Test flakiness in CI | Low | Medium | Run tests multiple times locally |
| Slow test execution | Medium | Low | Use turbo caching, parallelization |
| Prisma mocking complexity | Medium | Medium | Use integration tests for db |

---

## Definition of Done Checklist

- [ ] All 9 projects have test configuration files
- [ ] All 9 projects have at least one passing example test
- [ ] Root package.json has test scripts
- [ ] turbo.json has test pipeline configured
- [ ] `turbo run test` executes successfully from root
- [ ] CI/CD workflow runs tests on PRs
- [ ] Test failures block PR merging
- [ ] Documentation updated with test instructions
- [ ] Total test execution time < 5 minutes
- [ ] No test failures or errors

---

## Notes

- packages/supabase is already configured - only verification needed
- packages/db may skip unit tests (typically integration tested)
- apps/native is the most complex setup (Jest + jest-expo)
- All Vitest projects should follow similar configuration pattern
- Workspace alias resolution is critical for cross-package imports
