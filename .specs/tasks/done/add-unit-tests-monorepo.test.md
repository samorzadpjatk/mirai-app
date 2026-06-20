---

title: Add unit tests to monorepo with Jest for native and Vitest for packages
---

## Initial User Prompt

Add unit tests to the monorepo's project: Jest for native app, Vitest for other projects

## Description

This task establishes comprehensive unit testing infrastructure across the MIRAI monorepo to enable automated quality assurance and developer confidence. The monorepo currently lacks any testing setup, creating risk of regressions and reducing development velocity.

The solution implements a dual test runner strategy: **Jest** for the Expo React Native application (apps/native) due to its React Native specific preset requirements, and **Vitest** for all Node.js applications (backend-server, notification-sender, seed) and utility packages (auth, db, shared, supabase, trpc) for fast, native TypeScript support without compilation steps.

Key deliverables include: (1) Jest configuration with jest-expo preset for the native app, (2) Vitest configuration for all 8 Node.js projects, (3) Turborepo pipeline integration enabling `turbo run test` to execute all tests, (4) CI/CD workflow updates to run tests on PRs and block merges on failures, and (5) at least one passing example test in each of the 9 projects to validate configuration.

**Scope**:
- **Included**: Test runner configuration for all 9 projects, Turborepo pipeline setup, CI/CD integration, example tests, documentation
- **Excluded**: Comprehensive test coverage of existing code, integration/E2E tests, coverage thresholds, performance testing, test data factories

**User Scenarios**:
1. **Primary Flow**: Developer makes changes, runs `bun run test` locally to verify, pushes code, CI runs tests automatically, PR merges with confidence
2. **Alternative Flow**: Developer runs `turbo run test` from root to verify entire monorepo before major release
3. **Error Handling**: Test failures provide clear error messages locally and in CI, blocking PR merge until resolved

## Architecture Overview

### Solution Strategy

This implementation uses a **dual test runner strategy** optimized for each project type:

| Project | Runner | Rationale |
|---------|--------|-----------|
| `apps/native` | **Jest** with jest-expo preset | Required for React Native/Expo compatibility, handles Metro bundler quirks, provides RN-specific matchers |
| `apps/backend-server` | **Vitest** | Fast, native TypeScript support, ideal for Fastify + tRPC testing |
| `apps/notification-sender` | **Vitest** | Consistent with backend-server, fast execution |
| `apps/seed` | **Vitest** | CLI tool testing, no special requirements |
| `packages/orpc` | **Vitest** | tRPC router testing, needs fast iteration |
| `packages/auth` | **Vitest** | Authentication logic testing, requires mocking Supabase/DB |
| `packages/common` | **Vitest** | Utility function testing, simplest setup |
| `packages/supabase` | **Vitest** | Already configured ✅ |
| `packages/db` | **Optional** | Typically tested via integration tests; skip for unit tests |

### Key Architectural Decisions

1. **Jest for React Native**: The `jest-expo` preset is non-negotiable for Expo apps. It handles transform ignore patterns for React Native packages and provides compatible test environment.

2. **Vitest for Node.js**: Native TypeScript support eliminates ts-jest configuration complexity. V8 coverage provider is faster and more accurate than Istanbul.

3. **Turborepo Pipeline Integration**: Tests depend on `^build` to ensure compiled artifacts exist. Coverage outputs are cached for performance.

4. **Workspace Alias Resolution**: Both Jest (`moduleNameMapping`) and Vitest (`resolve.alias`) map `@mirai-app/*` to `../../packages/*/src` for cross-package imports.

5. **Mock-Heavy Approach**: All external dependencies (Supabase, Prisma, Expo modules) are mocked to ensure fast, deterministic tests without real network/database calls.

### Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Turborepo Pipeline                       │
│  turbo run test → executes in dependency order              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Jest (Native)│    │ Vitest (Apps) │    │ Vitest (Pkgs) │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ jest-expo     │    │ vitest.config │    │ vitest.config │
│ preset        │    │ globals: true │    │ globals: true │
│               │    │ environment:  │    │ environment:  │
│ jest.setup.js │    │   node        │    │   node        │
│ - Expo mocks  │    │               │    │               │
│ - RN mocks    │    │ vitest.setup  │    │ vitest.setup  │
│ - Supabase    │    │ - DB mocks    │    │ (if needed)   │
│   mocks       │    │ - Supabase    │    │               │
│               │    │   mocks       │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Turborepo Pipeline Integration

**Task Configuration**:
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

**Execution Order** (based on dependency graph):
1. `packages/common` (no deps)
2. `packages/supabase` (no deps)
3. `packages/db` (depends on supabase)
4. `packages/auth` (depends on db, supabase, shared)
5. `packages/orpc` (depends on auth, db, shared, supabase)
6. `apps/backend-server` (depends on trpc)
7. `apps/notification-sender` (depends on trpc, db, supabase)
8. `apps/seed` (depends on db, supabase)
9. `apps/native` (depends on trpc, auth, shared, supabase)

### CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/ci.yml`):
- **Trigger**: Push to main, Pull requests
- **Steps**: Checkout → Setup Node/Bun → Install → Lint → TypeCheck → **Test** → Coverage Upload
- **Test Command**: `bun run test:ci` (runs with `--passWithNoTests` flag)
- **Coverage**: Uploaded to Codecov on PRs
- **Blocking**: Test failures block PR merging

### Expected File Changes

**Create (12 files)**:
| File | Purpose |
|------|---------|
| `apps/native/jest.config.js` | Jest configuration with jest-expo preset |
| `apps/native/jest.setup.js` | Jest setup with Expo/Supabase mocks |
| `apps/backend-server/vitest.config.ts` | Vitest configuration |
| `apps/notification-sender/vitest.config.ts` | Vitest configuration |
| `apps/seed/vitest.config.ts` | Vitest configuration |
| `packages/orpc/vitest.config.ts` | Vitest configuration |
| `packages/auth/vitest.config.ts` | Vitest configuration |
| `packages/auth/vitest.setup.ts` | Vitest setup with DB/Supabase mocks |
| `packages/common/vitest.config.ts` | Vitest configuration |
| `packages/common/src/__tests__/example.test.ts` | Example passing test |
| `packages/auth/src/__tests__/example.test.ts` | Example passing test |
| `apps/native/src/__tests__/example.test.tsx` | Example passing test |

**Modify (9 files)**:
| File | Changes |
|------|---------|
| `package.json` (root) | Add `test`, `test:ci` scripts |
| `apps/native/package.json` | Add Jest deps, test scripts |
| `apps/notification-sender/package.json` | Update test script with coverage |
| `apps/seed/package.json` | Add vitest deps, test scripts |
| `packages/auth/package.json` | Add vitest deps, test scripts |
| `packages/common/package.json` | Add vitest deps, test scripts |
| `turbo.json` | Add `dependsOn: ["^build"]` to test task |
| `.github/workflows/ci.yml` | Add test execution step |
| `README.md` | Add testing documentation |

**Already Configured (2 files)**:
| File | Status |
|------|--------|
| `packages/supabase/vitest.config.ts` | ✅ Complete |
| `packages/supabase/vitest.setup.ts` | ✅ Complete |
---

## Acceptance Criteria

### Functional Requirements

- [ ] **Jest Configuration for Native App**: apps/native has jest.config.js with jest-expo preset, TypeScript support, and at least one passing example test
  - Given: apps/native has jest.config.js with jest-expo preset configured
  - When: Developer runs `bun run test` in apps/native
  - Then: Jest executes and at least one example test passes

- [ ] **Vitest Configuration for Backend Server**: apps/backend-server has vitest.config.ts with TypeScript support and at least one passing example test
  - Given: apps/backend-server has vitest.config.ts configured
  - When: Developer runs `bun run test` in apps/backend-server
  - Then: Vitest executes and at least one example test passes

- [ ] **Vitest Configuration for All Packages**: Each package (auth, db, shared, supabase, trpc) has vitest.config.ts and at least one passing example test
  - Given: Each package has vitest.config.ts and test script in package.json
  - When: Developer runs `bun run test` in each package
  - Then: Vitest executes and at least one example test passes

- [ ] **Vitest Configuration for Other Apps**: apps/notification-sender and apps/seed have vitest.config.ts and at least one passing example test
  - Given: apps/notification-sender and apps/seed have vitest.config.ts configured
  - When: Developer runs `bun run test` in these apps
  - Then: Vitest executes and at least one example test passes

- [ ] **Turborepo Pipeline Integration**: turbo.json has test pipeline configured, `turbo run test` from root executes tests for all projects
  - Given: turbo.json has test pipeline with proper task dependencies
  - When: Developer runs `turbo run test` from repository root
  - Then: Tests execute for all projects in correct dependency order

- [ ] **CI/CD Workflow Integration**: GitHub Actions workflow runs tests on PRs and pushes to main, test failures cause workflow failure
  - Given: GitHub Actions workflow has test job configured
  - When: PR is opened or code is pushed to main branch
  - Then: Tests run automatically and failures block PR merging

- [ ] **Test Script Availability**: All 9 projects have `test` script in package.json that runs appropriate test runner
  - Given: Each project's package.json has test script
  - When: Developer runs `bun run test` in any project
  - Then: Appropriate test runner executes (Jest for native, Vitest for others)

- [ ] **Documentation**: README files include instructions for running tests locally and in CI
  - Given: README files are updated with test instructions
  - When: Developer reads README in any project or root
  - Then: Clear instructions for running tests are available

### Non-Functional Requirements

- [ ] **Performance**: All tests complete in < 5 minutes total when running `turbo run test`
- [ ] **Reliability**: Tests are deterministic and not flaky (same code produces same results)
- [ ] **Developer Experience**: Consistent `bun run test` command works across all 9 projects
- [ ] **CI/CD Integration**: Test failures cause workflow failure and block PR merging

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] Tests written and passing in all 9 projects
- [ ] Documentation updated with test instructions
- [ ] CI/CD workflows updated and tested
- [ ] Code reviewed and approved

---

## Implementation Process

### Phase 1: Setup (Root Configuration & Shared Dependencies)

#### Step 1.1: Root Package.json Test Scripts
**Estimate**: Tiny (5-15 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 1 - Foundation)

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

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (40%): Scripts use correct turbo commands and Bun runner
  2. **Completeness** (40%): Both `test` and `test:ci` scripts added
  3. **Quality** (20%): No conflicts with existing scripts, clean formatting

---

#### Step 1.2: Turborepo Pipeline Configuration
**Estimate**: Small (15-30 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 2 - Depends on 1.1)

**Success Criteria**:
- `turbo.json` has `test` pipeline task configured
- `test` task has `dependsOn: ["^build"]` to ensure builds complete first
- `test` task has `outputs: ["coverage/**"]` for caching
- `test:ci` task configured similarly

**Subtasks**:
1. Add `test` pipeline to turbo.json with proper dependencies
2. Add `test:ci` pipeline for CI-specific test execution
3. Verify pipeline ordering matches dependency graph

**Blockers**: 
- Step 1.1 complete

**Risks**:
- Risk: Pipeline may create circular dependencies
  - Mitigation: Review dependency graph before configuration

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): `dependsOn: ["^build"]` and `outputs: ["coverage/**"]` configured correctly
  2. **Completeness** (30%): Both `test` and `test:ci` pipelines defined
  3. **Integration** (25%): Pipeline ordering matches dependency graph, no circular dependencies
  4. **Quality** (15%): Clean JSON structure, follows turbo.json conventions

---

#### Step 1.3: Shared Test Utilities Package (Optional)
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 2.1, 2.2, 2.3 (Wave 3 - Independent Package Setup)

**Success Criteria**:
- Common mock utilities created in `packages/common/src/testing/`
- Mock factories for Supabase, Prisma, Expo modules
- Reusable test helpers exported

**Subtasks**:
1. Create `packages/common/src/testing/` directory
2. Create `mock-factories.ts` with common mocks
3. Create `test-helpers.ts` with utilities
4. Export from `packages/common/src/index.ts`

**Blockers**:
- Step 1.2 complete

**Risks**:
- Risk: May not be needed immediately - can defer to Phase 4
  - Mitigation: Mark as optional, implement only if time permits

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Quality** (35%): Mock factories are reusable and well-structured
  2. **Testing** (35%): Comprehensive mocks for Supabase, Prisma, Expo modules
  3. **Completeness** (20%): Properly exported from index.ts
  4. **Correctness** (10%): No TypeScript errors, valid exports

---

### Phase 2: Foundational (Packages with Existing Infrastructure)

#### Step 2.1: Verify packages/supabase Configuration
**Estimate**: Tiny (5-15 min)  
**Agent**: haiku  
**Parallel with**: 2.2, 2.3, 1.3 (Wave 3 - Independent Package Setup)

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

**Blockers**:
- Step 1.2 complete

**Risks**: None (already working)

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (40%): Config files exist and are valid TypeScript
  2. **Testing** (40%): Tests pass when executed with `bun run test`
  3. **Completeness** (20%): Setup file has proper Supabase mocks

---

#### Step 2.2: Configure packages/common
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 2.1, 2.3, 1.3 (Wave 3 - Independent Package Setup)

**Success Criteria**:
- `packages/common/vitest.config.ts` created with TypeScript support
- `packages/common/package.json` has test script with vitest
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest as devDependency to package.json
2. Create `vitest.config.ts` with proper configuration
3. Create `src/__tests__/example.test.ts` with simple passing test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**:
- Step 1.2 complete

**Risks**:
- Risk: Shared package may have complex utilities requiring extensive mocking
  - Mitigation: Start with simple example test, expand coverage later

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): vitest.config.ts has TypeScript support, globals enabled
  2. **Testing** (30%): Example test is meaningful and passes
  3. **Quality** (25%): Clean configuration, follows project patterns
  4. **Completeness** (15%): Test script added to package.json

---

#### Step 2.3: Configure packages/db
**Estimate**: Tiny (5-15 min)  
**Agent**: haiku  
**Parallel with**: 2.1, 2.2, 1.3 (Wave 3 - Independent Package Setup)

**Success Criteria**:
- Decision made: skip unit tests (db typically integration tested)
- Document decision in task file

**Subtasks**:
1. Evaluate if unit tests are appropriate for db package
2. If yes, create vitest.config.ts with Prisma mocking setup
3. If no, document decision and skip

**Blockers**:
- Step 1.2 complete

**Risks**:
- Risk: Prisma client requires complex mocking
  - Mitigation: Recommend integration tests over unit tests for db layer

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (50%): Decision documented clearly with rationale
  2. **Completeness** (50%): If implementing, proper Prisma mocking setup; if skipping, clear documentation

---

### Phase 3: Core Implementation (Remaining Packages)

#### Step 3.1: Configure packages/auth
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 4 - Depends on 2.1 AND 2.2)

**Success Criteria**:
- `packages/auth/vitest.config.ts` created with workspace alias resolution
- `packages/auth/vitest.setup.ts` created with Supabase and DB mocks
- `packages/auth/package.json` has test script
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with TypeScript support, workspace alias resolution, globals enabled, setup file reference
3. Create `vitest.setup.ts` with Supabase client mocks, Prisma/DB mocks, mock cleanup between tests
4. Create `src/__tests__/example.test.ts` with auth logic test
5. Add test script to package.json
6. Run test to verify setup

**Blockers**:
- Step 2.2 complete (packages/common)
- Step 2.1 complete (packages/supabase)

**Risks**:
- Risk: Auth logic may have complex dependencies on Supabase
  - Mitigation: Create comprehensive mocks in setup file
- Risk: Circular dependencies between auth and db packages
  - Mitigation: Mock db layer, don't import actual db code

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): vitest.config.ts has workspace alias resolution, TypeScript support
  2. **Testing** (25%): Supabase and DB mocks are comprehensive, example test passes
  3. **Quality** (20%): Clean setup file structure, proper mock cleanup
  4. **Completeness** (20%): All subtasks completed, test script added
  5. **Integration** (10%): No circular dependency issues with db package

---

#### Step 3.2: Configure packages/orpc
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 5 - Depends on 3.1)

**Success Criteria**:
- `packages/orpc/vitest.config.ts` created with workspace alias resolution
- `packages/orpc/package.json` has test script
- At least one example test exists and passes (router test)
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with TypeScript support, workspace alias resolution, globals enabled
3. Create `src/__tests__/example.test.ts` with simple router test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**:
- Step 3.1 complete (packages/auth)

**Risks**:
- Risk: tRPC routers may have complex context requirements
  - Mitigation: Create mock context factory for tests
- Risk: Router tests may require database connections
  - Mitigation: Mock all database calls in router tests

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): vitest.config.ts has workspace alias resolution, TypeScript support
  2. **Testing** (25%): Router test is meaningful, mocks context properly
  3. **Quality** (20%): Clean configuration, follows project patterns
  4. **Completeness** (20%): All subtasks completed, test script added
  5. **Integration** (10%): Works with packages/auth dependency

---

#### Step 3.3: Configure apps/backend-server
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: 3.4, 3.5 (Wave 6 - Application Layer, Track A)

**Success Criteria**:
- `apps/backend-server/vitest.config.ts` created with Fastify/tRPC testing support
- `apps/backend-server/package.json` has test script
- At least one example test exists and passes (API endpoint test)
- Running `bun run test` executes successfully

**Subtasks**:
1. Add vitest and @vitest/coverage-v8 as devDependencies
2. Create `vitest.config.ts` with TypeScript support, Fastify testing environment setup, tRPC client for testing routers
3. Create `src/__tests__/example.test.ts` with simple endpoint test
4. Add test script to package.json
5. Run test to verify setup

**Blockers**:
- Step 3.2 complete (packages/orpc)

**Risks**:
- Risk: Fastify server tests may require port binding
  - Mitigation: Use Fastify's inject() method for testing without ports
- Risk: tRPC integration may be complex
  - Mitigation: Create helper to build testable tRPC caller

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): vitest.config.ts has Fastify testing environment, tRPC client setup
  2. **Testing** (25%): Endpoint test passes, uses inject() method
  3. **Quality** (20%): Clean configuration, helper functions well-structured
  4. **Completeness** (20%): All subtasks completed, test script added
  5. **Integration** (10%): Works with packages/orpc dependency

---

#### Step 3.4: Configure apps/notification-sender
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 3.3, 3.5 (Wave 6 - Application Layer, Track B)

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
- Step 3.2 complete (packages/orpc)

**Risks**:
- Risk: Expo Push Notification service may require API keys
  - Mitigation: Mock Expo SDK in tests

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): vitest.config.ts has TypeScript support
  2. **Testing** (30%): Notification logic test passes, Expo SDK mocked
  3. **Quality** (25%): Clean configuration, follows project patterns
  4. **Completeness** (15%): All subtasks completed, test script added

---

#### Step 3.5: Configure apps/seed
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 3.3, 3.4 (Wave 6 - Application Layer, Track C)

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
- Step 2.3 complete (packages/db decision)
- Step 3.2 complete (packages/orpc) - recommended for consistency

**Risks**:
- Risk: Seed scripts may modify database
  - Mitigation: Mock all database operations in unit tests

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): vitest.config.ts has TypeScript support
  2. **Testing** (30%): Seed logic test passes, database operations mocked
  3. **Quality** (25%): Clean configuration, follows project patterns
  4. **Completeness** (15%): All subtasks completed, test script added

---

#### Step 3.6: Configure apps/native (Jest + jest-expo)
**Estimate**: Large (60-120 min)  
**Agent**: opus  
**Parallel with**: None (Wave 7 - Critical Path, requires 3.1, 3.2, 2.2, 2.1)

**Success Criteria**:
- `apps/native/jest.config.js` created with jest-expo preset
- `apps/native/jest.setup.js` created with Expo and Supabase mocks
- `apps/native/package.json` has Jest dependencies and test scripts
- TypeScript support configured for Jest
- At least one example test exists and passes
- Running `bun run test` executes successfully

**Subtasks**:
1. Add Jest dependencies to package.json: jest, jest-expo, @types/jest, ts-jest or babel-jest for TypeScript
2. Create `jest.config.js` with jest-expo preset, transform ignore patterns for React Native packages, module name mapping for workspace aliases, setup file reference
3. Create `jest.setup.js` with Expo modules mocks, React Native mocks, Supabase client mocks, mock cleanup between tests
4. Create `src/__tests__/example.test.tsx` with simple component test
5. Add test script to package.json
6. Run test to verify setup

**Blockers**:
- Step 3.1 complete (packages/auth)
- Step 3.2 complete (packages/orpc)
- Step 2.2 complete (packages/common)
- Step 2.1 complete (packages/supabase)

**Risks**:
- Risk: jest-expo preset may have version conflicts
  - Mitigation: Ensure jest-expo version matches Expo SDK version
- Risk: Metro bundler quirks may cause test failures
  - Mitigation: Configure proper transform ignore patterns
- Risk: React Native modules may not mock cleanly
  - Mitigation: Use jest-expo's built-in mocks as base
- Risk: TypeScript configuration may be complex
  - Mitigation: Use ts-jest with Expo's tsconfig

**Verification**:
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubrics**:
  1. **Correctness** (20%): jest.config.js has jest-expo preset, proper transform ignore patterns, module name mapping
  2. **Testing** (20%): Example test passes, Expo/RN mocks comprehensive, Supabase mocks work
  3. **Quality** (20%): Clean configuration, follows Expo/Jest conventions, setup file well-structured
  4. **Completeness** (20%): All subtasks completed, Jest dependencies added, test script works
  5. **Integration** (20%): TypeScript support functional, no version conflicts, works with all dependencies

---

### Phase 4: Polish (CI/CD, Documentation)

#### Step 4.1: GitHub Actions CI/CD Integration
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: 4.2 (Wave 8 - CI/CD and Documentation)

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
- Step 3.6 complete (all test configurations)

**Risks**:
- Risk: CI environment may differ from local
  - Mitigation: Use same Bun version in CI as locally
- Risk: Tests may be slow in CI
  - Mitigation: Use turbo caching for tests

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Test step runs after lint/typecheck, uses `bun run test:ci`
  2. **Integration** (30%): Failures block PR merging, workflow triggers on PRs and main pushes
  3. **Completeness** (25%): All subtasks completed, coverage upload configured (optional)
  4. **Quality** (15%): Clean YAML structure, follows GitHub Actions conventions

---

#### Step 4.2: Documentation Updates
**Estimate**: Small (15-30 min)  
**Agent**: haiku  
**Parallel with**: 4.1 (Wave 8 - CI/CD and Documentation)

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
- Step 3.6 complete (all test configurations)

**Risks**:
- Risk: Documentation may become outdated
  - Mitigation: Keep documentation concise and high-level

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Completeness** (40%): Root README and each app README have testing instructions
  2. **Quality** (35%): Instructions are clear, dual runner strategy explained
  3. **Correctness** (25%): Troubleshooting section present, no broken links

---

#### Step 4.3: Final Verification & Integration Testing
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 9 - Final Verification, depends on 4.1 AND 4.2)

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
- Step 4.1 complete
- Step 4.2 complete

**Risks**:
- Risk: Some tests may fail in integrated run but pass individually
  - Mitigation: Run tests multiple times to check for flakiness
- Risk: Test execution time may exceed 5 minutes
  - Mitigation: Optimize slow tests, use parallelization

**Verification**:
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubrics**:
  1. **Correctness** (20%): `turbo run test` executes all tests, no failures or errors
  2. **Testing** (20%): All 9 projects have at least one passing test
  3. **Completeness** (20%): All subtasks completed, total execution time < 5 minutes
  4. **Quality** (20%): No flaky tests, consistent results across multiple runs
  5. **Integration** (20%): Full pipeline works end-to-end, CI/CD compatibility verified

---

## Verification Summary

| Step | Description | Level | Threshold | Judge Count | Primary Rubrics |
|------|-------------|-------|-----------|-------------|-----------------|
| 1.1 | Root Package.json Test Scripts | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 1.2 | Turborepo Pipeline Configuration | Medium | 4.0/5.0 | 1 | Correctness, Integration |
| 1.3 | Shared Test Utilities Package | Medium | 4.0/5.0 | 1 | Quality, Testing |
| 2.1 | Verify packages/supabase | Low | 3.5/5.0 | 1 | Correctness, Testing |
| 2.2 | Configure packages/common | Medium | 4.0/5.0 | 1 | Correctness, Quality, Testing |
| 2.3 | Configure packages/db | Low | 3.5/5.0 | 1 | Correctness |
| 3.1 | Configure packages/auth | High | 4.0/5.0 | 2 | All except Integration |
| 3.2 | Configure packages/orpc | High | 4.0/5.0 | 2 | All except Integration |
| 3.3 | Configure apps/backend-server | High | 4.0/5.0 | 2 | All except Integration |
| 3.4 | Configure apps/notification-sender | Medium | 4.0/5.0 | 1 | Correctness, Quality, Testing |
| 3.5 | Configure apps/seed | Medium | 4.0/5.0 | 1 | Correctness, Quality, Testing |
| 3.6 | Configure apps/native | Panel | 4.5/5.0 | 3 | All categories |
| 4.1 | GitHub Actions CI/CD | High | 4.0/5.0 | 2 | Correctness, Integration |
| 4.2 | Documentation Updates | Low | 3.5/5.0 | 1 | Completeness, Quality |
| 4.3 | Final Verification | Panel | 4.5/5.0 | 3 | All categories |

**Legend**:
- **Level**: None / Low / Medium / High / Panel
- **Threshold**: Minimum score required (out of 5.0)
- **Judge Count**: Number of independent judges for verification
- **Rubrics**: Evaluation categories - Correctness, Completeness, Quality, Testing, Integration

---

## Sub-Agent Execution Directive

### Agent Type Assignments

| Step | Agent Type | Rationale |
|------|------------|-----------|
| 1.1, 1.2, 2.1, 2.3, 4.2 | **haiku** | Simple configuration, low complexity, documentation |
| 1.3, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3 | **sonnet** | Medium complexity, requires reasoning, testing logic |
| 3.6 | **opus** | High complexity, Jest + Expo integration, critical path |

### Parallel Execution Waves

**Wave 1**: Step 1.1 (Foundation)  
**Wave 2**: Step 1.2 (Depends on 1.1)  
**Wave 3**: Steps 2.1, 2.2, 2.3, 1.3 (ALL parallel after 1.2)  
**Wave 4**: Step 3.1 (Depends on 2.1 AND 2.2)  
**Wave 5**: Step 3.2 (Depends on 3.1)  
**Wave 6**: Steps 3.3, 3.4, 3.5 (ALL parallel after 3.2 AND 2.3)  
**Wave 7**: Step 3.6 (Depends on 3.1, 3.2, 2.2, 2.1)  
**Wave 8**: Steps 4.1, 4.2 (ALL parallel after 3.6)  
**Wave 9**: Step 4.3 (Depends on 4.1 AND 4.2)

### Execution Rules

1. **Pre-execution Check**: Verify all "Parallel with" steps from previous waves are complete
2. **Dependency Gate**: Never start a step until ALL its blockers are satisfied
3. **Wave Synchronization**: Wait for entire wave to complete before starting dependent waves
4. **Quality Gate**: Each step must pass success criteria before marking complete
5. **Agent Selection**: Use assigned agent type - no substitutions without approval

### Critical Path

```
1.1 → 1.2 → 2.2 → 3.1 → 3.2 → 3.6 → 4.1 → 4.3
```

**Critical Path Duration**: ~5.5 hours sequential  
**Wall Clock with Parallelization**: ~2.5 hours  
**Parallelization Savings**: ~55% time reduction

### Synchronization Points

1. **Wave 2 → 3**: Wait for 1.2 completion
2. **Wave 3 → 4**: Wait for BOTH 2.1 AND 2.2 completion
3. **Wave 5 → 6**: Wait for 3.2 AND 2.3 completion
4. **Wave 7 → 8**: Wait for 3.6 completion
5. **Wave 8 → 9**: Wait for BOTH 4.1 AND 4.2 completion

---

## Implementation Summary Table

| Phase | Step | Project | Runner | Agent | Estimate | Dependencies | Parallel With |
|-------|------|---------|--------|-------|----------|--------------|---------------|
| 1 | 1.1 | Root | N/A | haiku | Tiny | None | None |
| 1 | 1.2 | Root | N/A | haiku | Small | 1.1 | None |
| 1 | 1.3 | packages/common | N/A | sonnet | Small | 1.2 | 2.1, 2.2, 2.3 |
| 2 | 2.1 | packages/supabase | Vitest | haiku | Tiny | 1.2 | 1.3, 2.2, 2.3 |
| 2 | 2.2 | packages/common | Vitest | sonnet | Small | 1.2 | 1.3, 2.1, 2.3 |
| 2 | 2.3 | packages/db | N/A | haiku | Tiny | 1.2 | 1.3, 2.1, 2.2 |
| 3 | 3.1 | packages/auth | Vitest | sonnet | Medium | 2.2, 2.1 | None |
| 3 | 3.2 | packages/orpc | Vitest | sonnet | Medium | 3.1 | None |
| 3 | 3.3 | apps/backend-server | Vitest | sonnet | Medium | 3.2 | 3.4, 3.5 |
| 3 | 3.4 | apps/notification-sender | Vitest | sonnet | Small | 3.2 | 3.3, 3.5 |
| 3 | 3.5 | apps/seed | Vitest | sonnet | Small | 2.3, 3.2 | 3.3, 3.4 |
| 3 | 3.6 | apps/native | Jest | opus | Large | 3.1, 3.2, 2.2, 2.1 | None |
| 4 | 4.1 | CI/CD | N/A | sonnet | Small | 3.6 | 4.2 |
| 4 | 4.2 | Documentation | N/A | haiku | Small | 3.6 | 4.1 |
| 4 | 4.3 | Integration | N/A | sonnet | Small | 4.1, 4.2 | None |

---

## Critical Path

The critical path (longest dependency chain) is:

```
1.1 → 1.2 → 2.2 → 3.1 → 3.2 → 3.6 → 4.1 → 4.3
```

**Critical Path Duration**: ~5.5 hours sequential  
**Wall Clock with Parallelization**: ~2.5 hours  
**Parallelization Savings**: ~55% time reduction (~3 hours saved)

### Parallel Wave Summary

| Wave | Steps | Can Parallelize | Duration |
|------|-------|-----------------|----------|
| 1 | 1.1 | No | 5-15 min |
| 2 | 1.2 | No | 15-30 min |
| 3 | 2.1, 2.2, 2.3, 1.3 | **Yes (4x)** | 15-30 min |
| 4 | 3.1 | No | 30-60 min |
| 5 | 3.2 | No | 30-60 min |
| 6 | 3.3, 3.4, 3.5 | **Yes (3x)** | 30-60 min |
| 7 | 3.6 | No | 60-120 min |
| 8 | 4.1, 4.2 | **Yes (2x)** | 15-30 min |
| 9 | 4.3 | No | 15-30 min |

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
