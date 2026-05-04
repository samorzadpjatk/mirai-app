# Codebase Analysis - Testing Infrastructure Setup

## Working Notes for Testing Implementation

### Date: 2026-05-04
### Task: Add unit tests to monorepo with Jest for native and Vitest for packages

---

## Discovery Log

### Step 1: Package Discovery
**Command:** `glob **/package.json`
**Result:** Found 11 package.json files
- Root: `/Users/rafalopilowski/Projekty/migration/pjapp/package.json`
- Apps: native, backend-server, notification-sender, seed
- Packages: trpc, auth, shared, supabase, db

### Step 2: Existing Test Config Discovery
**Command:** `glob **/vitest.config.*`
**Result:** Only 1 found
- `/Users/rafalopilowski/Projekty/migration/pjapp/packages/supabase/vitest.config.ts` ✅

**Command:** `glob **/jest.config.*`
**Result:** None found ❌

**Command:** `glob **/*.test.ts` and `**/*.spec.ts`
**Result:** None found - no existing tests

### Step 3: Package.json Analysis

#### Root Package
- Has scripts: build, dev, lint, typecheck, format, clean
- **Missing:** test script ❌

#### Apps/Native (Expo)
- Has: lint, typecheck, format, build scripts
- **Missing:** test script ❌
- **Framework needed:** Jest + jest-expo + React Native Testing Library

#### Apps/Backend-Server (Fastify)
- Has: test, test:watch, test:ui scripts ✅
- Uses: vitest with coverage
- **Missing:** vitest.config.ts ❌

#### Apps/Notification-Sender
- Has: test, test:watch scripts ✅
- Uses: vitest
- **Missing:** vitest.config.ts ❌
- **Issue:** test script doesn't include coverage

#### Apps/Seed
- **Missing:** all test scripts ❌
- **Missing:** vitest dependencies ❌

#### Packages/TRPC
- Has: test, test:watch scripts ✅
- Uses: vitest with coverage
- **Missing:** vitest.config.ts ❌

#### Packages/Auth
- **Missing:** all test scripts ❌
- **Missing:** vitest dependencies ❌

#### Packages/Shared
- **Missing:** all test scripts ❌
- **Missing:** vitest dependencies ❌

#### Packages/Supabase
- Has: test, test:watch scripts ✅
- Has: vitest.config.ts ✅
- Has: vitest.setup.ts ✅
- **Status:** Fully configured

#### Packages/DB
- **Missing:** all test scripts ❌
- **Note:** Database package may not need unit tests

### Step 4: CI Workflow Analysis
**File:** `.github/workflows/ci.yml`
**Current jobs:**
1. ESLint check
2. TypeScript type checking
**Missing:** Test execution ❌

### Step 5: Turbo.json Analysis
**File:** `turbo.json`
**Current test task:**
```json
"test": {
  "outputs": ["coverage/**"]
}
```
**Missing:** dependsOn for build ❌

---

## Key Findings

### Testing Framework Distribution

| Package/App | Framework | Status | Config File |
|-------------|-----------|--------|-------------|
| Root | - | ❌ No test script | - |
| apps/native | Jest | ❌ Not configured | Missing |
| apps/backend-server | Vitest | ⚠️ Scripts exist, no config | Missing |
| apps/notification-sender | Vitest | ⚠️ Scripts exist, no config | Missing |
| apps/seed | Vitest | ❌ Not configured | Missing |
| packages/trpc | Vitest | ⚠️ Scripts exist, no config | Missing |
| packages/auth | Vitest | ❌ Not configured | Missing |
| packages/shared | Vitest | ❌ Not configured | Missing |
| packages/supabase | Vitest | ✅ Fully configured | Exists |
| packages/db | - | ❌ Not configured | N/A |

### Dependencies Pattern

**Vitest packages use:**
- `vitest`: ^4.0.16
- `@vitest/coverage-v8`: ^4.0.16

**Jest for Native should use:**
- `jest`: ^29.7.0
- `jest-expo`: ~52.0.0 (matches Expo SDK)
- `@testing-library/react-native`: ^12.4.0
- `@testing-library/jest-native`: ^5.4.3

---

## Implementation Plan

### Phase 1: Root Infrastructure
1. Add test script to root package.json
2. Update turbo.json test task with dependsOn
3. Update CI workflow to run tests

### Phase 2: Package Configurations (Vitest)

#### packages/shared
- Add vitest to devDependencies
- Create vitest.config.ts
- Add test scripts

#### packages/auth
- Add vitest + coverage to devDependencies
- Create vitest.config.ts
- Create vitest.setup.ts (with mocks for supabase, db)
- Add test scripts

#### packages/trpc
- Create vitest.config.ts
- (Already has scripts and deps)

#### packages/supabase
- Already configured ✅

### Phase 3: App Configurations

#### apps/backend-server
- Create vitest.config.ts
- (Already has scripts and deps)

#### apps/notification-sender
- Create vitest.config.ts
- Update test script to include coverage

#### apps/seed
- Add vitest + coverage to devDependencies
- Create vitest.config.ts
- Add test scripts

### Phase 4: Native App (Jest)

#### apps/native
- Add jest + jest-expo + testing libraries to devDependencies
- Create jest.config.js
- Create jest.setup.js
- Add test scripts

---

## Mock Requirements Analysis

### packages/auth
Needs mocks for:
- `@mirai-app/supabase` - Auth client
- `@mirai-app/db` - Prisma user queries

### packages/trpc
Needs mocks for:
- `@mirai-app/auth` - Auth procedures
- `@mirai-app/db` - Database access
- `@mirai-app/supabase` - Supabase client

### apps/native
Needs mocks for:
- `expo-constants` - Config values
- `expo-secure-store` - Secure storage
- `expo-*` modules - Various Expo SDK modules
- `@supabase/supabase-js` - Supabase client
- `@mirai-app/trpc` - tRPC client

---

## File Structure to Create

### Configuration Files (9 files)
```
apps/native/jest.config.js
apps/native/jest.setup.js
apps/backend-server/vitest.config.ts
apps/notification-sender/vitest.config.ts
apps/seed/vitest.config.ts
packages/trpc/vitest.config.ts
packages/auth/vitest.config.ts
packages/auth/vitest.setup.ts
packages/shared/vitest.config.ts
```

### Test Directories (to be created as needed)
```
packages/shared/__tests__/
packages/shared/src/storage/__tests__/
packages/shared/src/stores/__tests__/
packages/shared/src/tripInfo/__tests__/
packages/auth/src/__tests__/
packages/auth/src/store/__tests__/
packages/trpc/src/api/__tests__/
packages/trpc/src/client/__tests__/
packages/trpc/src/utils/__tests__/
apps/backend-server/src/__tests__/
apps/notification-sender/src/__tests__/
apps/seed/src/__tests__/
apps/native/src/components/__tests__/
apps/native/src/hooks/__tests__/
apps/native/src/stores/__tests__/
apps/native/src/utils/__tests__/
```

---

## Commands Verification

### After setup, these commands should work:

```bash
# Root level
bun run test              # Run all tests via turbo
bun run test:ci          # Run CI test suite

# Package level
cd packages/shared && bun run test
cd packages/auth && bun run test
cd packages/trpc && bun run test
cd packages/supabase && bun run test

# App level
cd apps/backend-server && bun run test
cd apps/notification-sender && bun run test
cd apps/native && bun run test
cd apps/native && bun run test:watch
```

---

## Notes

### Supabase Package Reference
The supabase package has a working vitest configuration that can be used as a template:
- `vitest.config.ts` - Uses node environment, includes setup file
- `vitest.setup.ts` - Mocks @supabase/supabase-js and next/headers

### Version Consistency
All vitest packages should use the same version:
- vitest: ^4.0.16
- @vitest/coverage-v8: ^4.0.16

### Native App Considerations
- Uses Expo SDK 54
- React Native 0.81.5
- React 19.1.0
- Jest config needs to handle Metro bundler transforms
- NativeWind/Tailwind CSS integration needs special handling

### CI Integration
Current CI only runs lint and typecheck. Tests should be added after typecheck step.
Coverage reports can be uploaded to Codecov or similar service.

---

## Questions/Decisions

1. **packages/db testing:** Skip unit tests - database package typically uses integration tests
2. **apps/seed testing:** Add minimal vitest setup for utility functions
3. **Coverage thresholds:** Start with 50% for native, no threshold for packages initially
4. **Test naming:** Use `*.test.ts` pattern consistently
5. **Test location:** Use `__tests__` directories co-located with source files

---

## Completion Checklist

- [ ] Root package.json has test script
- [ ] turbo.json has test task with dependsOn
- [ ] CI workflow runs tests
- [ ] apps/native has Jest config and setup
- [ ] apps/backend-server has vitest.config.ts
- [ ] apps/notification-sender has vitest.config.ts
- [ ] apps/seed has vitest.config.ts
- [ ] packages/trpc has vitest.config.ts
- [ ] packages/auth has vitest.config.ts and setup
- [ ] packages/shared has vitest.config.ts
- [ ] All package.json files have correct test scripts
- [ ] All package.json files have correct devDependencies
