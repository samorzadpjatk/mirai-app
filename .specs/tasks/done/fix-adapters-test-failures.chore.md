---
title: Fix adapters test failures (JWT and module resolution)
type: chore
---

## Initial User Prompt

Fix 22 pre-existing test failures in adapters package related to JWT decoding and module resolution

## Description

### Problem Statement

The adapters package has **22 test failures** that are pre-existing issues:

1. **JWT Decode Errors**: Tests failing due to JWT parsing issues in authServer.test.ts
   - `decodeJwtPayload` function errors
   - Token validation failures
2. **Module Resolution Errors**: Cannot find module '@trpc/server'
   - Missing dependency in test environment
   - Module resolution issues in CI/test runner

### Error Details

**JWT Errors:**

```
authServer.test.ts - JWT decode errors
  - Malformed token handling
  - Buffer/atob compatibility issues
  - Token validation failures
```

**Module Resolution:**

```
Error: Cannot find module '@trpc/server'
  at ... (test files importing trpc)
```

## Scope

### Included

- Fix JWT decode errors in authServer.test.ts
- Add missing @trpc/server dependency for tests
- Fix module resolution for test environment
- Update test setup if needed (happydom.ts, test config)

### Excluded

- No changes to production code logic
- No changes to authentication flow
- No changes to actual JWT validation (just test mocks/setup)

## Acceptance Criteria

- [ ] All auth tests pass (JWT decode errors resolved)
- [ ] No module resolution errors in test runs
- [ ] `bun test` in adapters package passes
- [ ] Tests can import @trpc/server without errors

## Implementation Process

### Phase 1: Diagnose Root Cause

#### Step 1.1: Analyze JWT Test Failures

**Goal:** Understand why JWT tests are failing

**Actions:**

- Run specific auth tests to capture exact errors
- Check JWT decode implementation
- Verify test mocks are correct

**Success Criteria:**

- Exact error messages captured
- Root cause identified (Buffer vs atab, mock issues, etc.)

---

#### Step 1.2: Analyze Module Resolution

**Goal:** Understand why @trpc/server can't be found

**Actions:**

- Check if @trpc/server is in dependencies
- Verify node_modules exists and is populated
- Check import paths in test files

**Success Criteria:**

- Dependency status confirmed
- Import paths verified
- Resolution path identified

---

### Phase 2: Fix JWT Test Failures

#### Step 2.1: Fix decodeJwtPayload Tests

**File:** packages/adapters/src/controllers/auth/**tests**/authServer.test.ts

**Common Fixes:**

- Add proper Buffer mock for test environment
- Ensure atab fallback works in happydom
- Update test data with valid JWT formats

**Success Criteria:**

- JWT decode tests pass
- All 5 decodeJwtPayload test cases pass

---

#### Step 2.2: Fix Auth Method Tests

**File:** packages/adapters/src/controllers/auth/**tests**/authServer.test.ts

**Issues:**

- getSession tests
- requireAuth tests
- requireAdmin tests
- requireModerator tests

**Success Criteria:**

- All auth method tests pass
- Mock data corrected if needed

---

### Phase 3: Fix Module Resolution

#### Step 3.1: Add Missing Dependencies

**Check:** packages/adapters/package.json

**Action:**

- Add @trpc/server to dependencies or devDependencies if missing
- Ensure version matches other packages

**Success Criteria:**

- @trpc/server listed in dependencies
- Module resolves correctly

---

#### Step 3.2: Fix Import Paths

**Check:** Test files importing @trpc/server

**Action:**

- Verify import statements are correct
- Check if imports should be from @mirai-app/trpc instead
- Update imports if needed

**Success Criteria:**

- All imports resolve
- No module resolution errors

---

#### Step 3.3: Update Test Setup

**Files:**

- happydom.ts
- Test configuration

**Action:**

- Ensure happydom setup works correctly
- Add any needed polyfills
- Configure module resolution for tests

**Success Criteria:**

- Test environment configured correctly
- All tests can run

---

### Phase 4: Final Verification

#### Step 4.1: Run All Adapters Tests

**Goal:** Verify all tests pass

**Command:** `cd packages/adapters && bun test`

**Success Criteria:**

- 0 test failures
- All 293 tests pass
- No errors

---

## Verification

### Phase 2: JWT Fixes

**Level**: Single Judge
**Threshold**: 4.0/5.0

**Rubric:**

- JWT tests pass: All decode tests work
- No mock issues: Proper mocking in place
- Test data valid: JWT formats correct

### Phase 3: Module Resolution

**Level**: Single Judge
**Threshold**: 4.0/5.0

**Rubric:**

- Dependencies correct: @trpc/server available
- Imports resolve: No module errors
- Test setup works: happydom configured

### Phase 4: Final Verification

**Level**: Test Execution
**Threshold**: 4.5/5.0

**Rubric:**

- All tests pass: 0 failures
- No regressions: Existing tests still pass
- Coverage maintained: No loss in coverage

## Definition of Done

- [ ] All 22 test failures resolved
- [ ] JWT decode errors fixed
- [ ] Module resolution errors fixed
- [ ] All adapters tests pass
- [ ] Task moved to done folder
