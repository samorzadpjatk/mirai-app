# Analysis: Separate Unit Tests from Integration Tests

> **Code Exploration Analysis**  
> **Generated:** 2026-04-09  
> **Task:** Separate execution of unit tests from integration tests in the monorepo

---

## 1. Executive Summary

### Current State

The Mirai App monorepo currently runs all tests together through a single `bun test` or `turbo run test` command. There's no clear separation between:

- **Unit tests** (fast, isolated, no external dependencies)
- **Integration tests** (slower, require database/external services)

### Impact

- CI pipeline runs all tests together, making it difficult to quickly identify if failures are due to unit logic or integration issues
- No way to run quick unit tests during development without also running slower integration tests
- The `packages/db` tests specifically require Docker/database setup (`test:db` script)

---

## 2. Current Test Setup

### 2.1 Root Package.json Scripts

| Script          | Command                                    | Purpose                                             |
| --------------- | ------------------------------------------ | --------------------------------------------------- |
| `test`          | `turbo run test`                           | Run all tests                                       |
| `test:ci`       | `turbo run test:ci`                        | Run tests in CI mode                                |
| `test:coverage` | `turbo run test --coverage`                | Run tests with coverage                             |
| `test:unit`     | `turbo run test --filter='!@mirai-app/db'` | **Partial separation attempt** - exclude db package |
| `test:db`       | `turbo run test`                           | Run all tests (alias)                               |

### 2.2 Bun Configuration (bunfig.toml)

**Root config:**

```toml
[test]
preload = ["./happydom.ts"]
coverageThreshold = { lines = 0.80, branches = 0.75, functions = 0.80 }
```

**Key packages with custom bunfig:**

- `/bunfig.toml` (root)
- `/packages/db/bunfig.toml` - Has coverage exclusions for prisma generated files
- `/packages/adapters/bunfig.toml`
- `/packages/trpc/bunfig.toml`
- `/packages/shared/bunfig.toml`
- `/packages/supabase/bunfig.toml`
- `/apps/web/bunfig.toml`
- `/apps/backend-server/bunfig.toml`
- `/apps/notification-sender/bunfig.toml`
- `/apps/seed/bunfig.toml`
- `/apps/native/bunfig.toml`

### 2.3 Turbo Configuration (turbo.json)

```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  },
  "test:ci": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  },
  "test:coverage": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  }
}
```

### 2.4 Package-Level Test Scripts

| Package                          | Test Script            | Notes                                   |
| -------------------------------- | ---------------------- | --------------------------------------- |
| `@repo/domain`                   | `bun test`             | Pure unit tests                         |
| `@repo/use-cases`                | `bun test`             | Unit tests with mocks                   |
| `@repo/adapters`                 | `bun test`             | Mix of unit and integration-style tests |
| `@mirai-app/db`                  | `bun test` + `test:db` | Requires Docker/database                |
| `@mirai-app/trpc`                | `bun test`             | API/router tests                        |
| `@mirai-app/auth`                | `bun test`             | Auth logic tests                        |
| `@mirai-app/shared`              | `bun test`             | Store/utility tests                     |
| `@mirai-app/supabase`            | `bun test`             | Supabase client tests                   |
| `@mirai-app/backend-server`      | `bun test`             | Server utility tests                    |
| `@mirai-app/web`                 | `bun test`             | Web app tests                           |
| `@mirai-app/notification-sender` | `bun test`             | Notification tests                      |
| `@mirai-app/native`              | `jest`                 | **Uses Jest, not Bun**                  |
| `@mirai-app/seed`                | `bun test`             | Seed script tests                       |

### 2.5 Native App (Jest)

**Config:** `apps/native/jest.config.cjs`

- Uses Jest (not Bun) due to React Native/Expo requirements
- Test pattern: `**/__tests__/**/*.test.ts`
- Coverage thresholds: 80% lines, 75% branches, 80% functions/statements

---

## 3. Test File Inventory

### 3.1 Total Test Files Found

**Bun Test Files (\*.test.ts):** 87 files  
**Bun Test Files (\*.test.tsx):** 5 files  
**Jest Test Files (native):** 17 files

**Total: 109 test files**

### 3.2 Test Files by Package

#### Domain Layer (Unit Tests - Pure Logic)

| File                        | Path                               | Type |
| --------------------------- | ---------------------------------- | ---- |
| Challenge.test.ts           | packages/domain/src/entities/      | Unit |
| ChallengeSubmission.test.ts | packages/domain/src/entities/      | Unit |
| User.test.ts                | packages/domain/src/entities/      | Unit |
| Reward.test.ts              | packages/domain/src/entities/      | Unit |
| Location.test.ts            | packages/domain/src/entities/      | Unit |
| Group.test.ts               | packages/domain/src/entities/      | Unit |
| Notification.test.ts        | packages/domain/src/entities/      | Unit |
| ActivityFeed.test.ts        | packages/domain/src/entities/      | Unit |
| Trip.test.ts                | packages/domain/src/entities/      | Unit |
| CoinAmount.test.ts          | packages/domain/src/value-objects/ | Unit |
| UserId.test.ts              | packages/domain/src/value-objects/ | Unit |
| result.test.ts              | packages/domain/src/utils/         | Unit |

#### Use Cases Layer (Unit Tests - With Mocks)

| File                          | Path                                | Type |
| ----------------------------- | ----------------------------------- | ---- |
| GetChallenge.test.ts          | packages/use-cases/src/interactors/ | Unit |
| CreateChallenge.test.ts       | packages/use-cases/src/interactors/ | Unit |
| UpdateChallenge.test.ts       | packages/use-cases/src/interactors/ | Unit |
| UpdateChallengeStatus.test.ts | packages/use-cases/src/interactors/ | Unit |
| GetUser.test.ts               | packages/use-cases/src/interactors/ | Unit |
| CreateUser.test.ts            | packages/use-cases/src/interactors/ | Unit |
| UpdateUser.test.ts            | packages/use-cases/src/interactors/ | Unit |
| GetNotification.test.ts       | packages/use-cases/src/interactors/ | Unit |

#### Adapters Layer (Mixed - Unit + Integration)

| File                              | Path                             | Type              |
| --------------------------------- | -------------------------------- | ----------------- |
| PrismaChallengeRepository.test.ts | packages/adapters/src/**tests**/ | Unit (with mocks) |
| PrismaUserRepository.test.ts      | packages/adapters/src/**tests**/ | Unit (with mocks) |
| ChallengeMapper.test.ts           | packages/adapters/src/**tests**/ | Unit              |
| UserMapper.test.ts                | packages/adapters/src/**tests**/ | Unit              |

#### Database Layer (Integration Tests)

| File           | Path                       | Type            |
| -------------- | -------------------------- | --------------- |
| models.test.ts | packages/db/src/**tests**/ | **Integration** |

#### tRPC Layer (API/Integration Tests)

| File                         | Path                                     | Type        |
| ---------------------------- | ---------------------------------------- | ----------- |
| user.test.ts                 | packages/trpc/src/api/routers/**tests**/ | Integration |
| challenge.test.ts            | packages/trpc/src/api/routers/**tests**/ | Integration |
| challengeSubmission.test.ts  | packages/trpc/src/api/routers/**tests**/ | Integration |
| challengeVote.test.ts        | packages/trpc/src/api/routers/**tests**/ | Integration |
| group.test.ts                | packages/trpc/src/api/routers/**tests**/ | Integration |
| trip.test.ts                 | packages/trpc/src/api/routers/**tests**/ | Integration |
| location.test.ts             | packages/trpc/src/api/routers/**tests**/ | Integration |
| coin.test.ts                 | packages/trpc/src/api/routers/**tests**/ | Integration |
| coinTransaction.test.ts      | packages/trpc/src/api/routers/**tests**/ | Integration |
| reward.test.ts               | packages/trpc/src/api/routers/**tests**/ | Integration |
| sponsor.test.ts              | packages/trpc/src/api/routers/**tests**/ | Integration |
| activityFeed.test.ts         | packages/trpc/src/api/routers/**tests**/ | Integration |
| notifications.test.ts        | packages/trpc/src/api/routers/**tests**/ | Integration |
| notificationSender.test.ts   | packages/trpc/src/api/routers/**tests**/ | Integration |
| notificationDelivery.test.ts | packages/trpc/src/api/routers/**tests**/ | Integration |
| notificationSchedule.test.ts | packages/trpc/src/api/routers/**tests**/ | Integration |
| storage.test.ts              | packages/trpc/src/api/routers/**tests**/ | Integration |
| submissionReport.test.ts     | packages/trpc/src/api/routers/**tests**/ | Integration |

#### Utility Tests

| File                                     | Path                               | Type |
| ---------------------------------------- | ---------------------------------- | ---- |
| authEmails.test.ts                       | packages/trpc/src/utils/**tests**/ | Unit |
| activityFeed.test.ts                     | packages/trpc/src/utils/**tests**/ | Unit |
| notificationTemplates.test.ts            | packages/trpc/src/utils/**tests**/ | Unit |
| resilience.test.ts                       | packages/trpc/src/utils/**tests**/ | Unit |
| notifications.test.ts                    | packages/trpc/src/utils/**tests**/ | Unit |
| tripGuards.test.ts                       | packages/trpc/src/utils/**tests**/ | Unit |
| storage.test.ts                          | packages/trpc/src/utils/**tests**/ | Unit |
| location-validation.test.ts              | packages/trpc/src/utils/**tests**/ | Unit |
| recurringChallenges.test.ts              | packages/trpc/src/utils/**tests**/ | Unit |
| notificactionSchedule-validation.test.ts | packages/trpc/src/utils/**tests**/ | Unit |

#### Web App Tests

| File                            | Path                               | Type |
| ------------------------------- | ---------------------------------- | ---- |
| middleware.test.ts              | apps/web/src/**tests**/            | Unit |
| useWebFileUpload.test.ts        | apps/web/src/hooks/**tests**/      | Unit |
| useStaffVoting.test.ts          | apps/web/src/hooks/**tests**/      | Unit |
| useJudgement.test.ts            | apps/web/src/hooks/**tests**/      | Unit |
| useChallengeSubmissions.test.ts | apps/web/src/hooks/**tests**/      | Unit |
| useChallengeForm.test.ts        | apps/web/src/hooks/**tests**/      | Unit |
| useActiveTripId.test.ts         | apps/web/src/hooks/**tests**/      | Unit |
| auth.test.ts                    | apps/web/src/lib/**tests**/        | Unit |
| supabase.test.ts                | apps/web/src/lib/**tests**/        | Unit |
| env.test.ts                     | apps/web/src/lib/**tests**/        | Unit |
| toast.test.ts                   | apps/web/src/lib/**tests**/        | Unit |
| logout.test.ts                  | apps/web/src/lib/**tests**/        | Unit |
| fileValidation.test.ts          | apps/web/src/lib/**tests**/        | Unit |
| OTPCodeInput.test.tsx           | apps/web/src/components/**tests**/ | Unit |
| LoginApp.test.tsx               | apps/web/src/components/**tests**/ | Unit |
| Select.test.tsx                 | apps/web/src/components/**tests**/ | Unit |
| Modal.test.tsx                  | apps/web/src/components/**tests**/ | Unit |
| LogoutButton.test.tsx           | apps/web/src/components/**tests**/ | Unit |

#### Backend Server Tests

| File            | Path                                     | Type |
| --------------- | ---------------------------------------- | ---- |
| server.test.ts  | apps/backend-server/src/utils/**tests**/ | Unit |
| config.test.ts  | apps/backend-server/src/utils/**tests**/ | Unit |
| headers.test.ts | apps/backend-server/src/utils/**tests**/ | Unit |

#### Notification Sender Tests

| File              | Path                                          | Type |
| ----------------- | --------------------------------------------- | ---- |
| index.test.ts     | apps/notification-sender/src/**tests**/       | Unit |
| scheduler.test.ts | apps/notification-sender/src/utils/**tests**/ | Unit |

#### Shared Package Tests

| File                   | Path                                   | Type |
| ---------------------- | -------------------------------------- | ---- |
| mapStore.test.ts       | packages/shared/src/stores/**tests**/  | Unit |
| judgementStore.test.ts | packages/shared/src/stores/**tests**/  | Unit |
| authStore.test.ts      | packages/shared/src/stores/**tests**/  | Unit |
| standard.test.ts       | packages/shared/src/storage/**tests**/ | Unit |

#### Auth Package Tests

| File               | Path                         | Type |
| ------------------ | ---------------------------- | ---- |
| authServer.test.ts | packages/auth/src/**tests**/ | Unit |

#### Supabase Package Tests

| File           | Path                             | Type        |
| -------------- | -------------------------------- | ----------- |
| client.test.ts | packages/supabase/src/**tests**/ | Integration |

#### Native App Tests (Jest)

| File                            | Path                                           | Type |
| ------------------------------- | ---------------------------------------------- | ---- |
| backgroundLocation.test.ts      | apps/native/src/services/location/**tests**/   | Unit |
| utils.test.ts                   | apps/native/src/utils/**tests**/               | Unit |
| backgroundLocationTask.test.ts  | apps/native/src/services/background/**tests**/ | Unit |
| storage.test.ts                 | apps/native/src/services/storage/**tests**/    | Unit |
| useCommunityFeed.test.ts        | apps/native/src/hooks/community/**tests**/     | Unit |
| useRewards.test.ts              | apps/native/src/hooks/rewards/**tests**/       | Unit |
| useSupabase.test.ts             | apps/native/src/hooks/supabase/**tests**/      | Unit |
| usePartnerImageDownload.test.ts | apps/native/src/hooks/partners/**tests**/      | Unit |
| useSponsors.test.ts             | apps/native/src/hooks/sponsors/**tests**/      | Unit |
| useAdminHooks.test.ts           | apps/native/src/hooks/admin/**tests**/         | Unit |
| useFiles.test.ts                | apps/native/src/hooks/files/**tests**/         | Unit |
| useNotifications.test.ts        | apps/native/src/hooks/notifications/**tests**/ | Unit |
| useMapHooks.test.ts             | apps/native/src/hooks/map/**tests**/           | Unit |
| useLocationPermissions.test.ts  | apps/native/src/hooks/location/**tests**/      | Unit |
| useChallenges.test.ts           | apps/native/src/hooks/challenges/**tests**/    | Unit |
| useTrips.test.ts                | apps/native/src/hooks/trips/**tests**/         | Unit |
| useGroups.test.ts               | apps/native/src/hooks/groups/**tests**/        | Unit |
| jest-setup.test.ts              | apps/native/src/hooks/groups/**tests**/        | Unit |

---

## 4. CI/CD Configuration Analysis

### 4.1 Current CI Workflow (.github/workflows/ci.yml)

**Test Job (lines 79-112):**

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - name: Use Node.js 24
    - name: Install Bun
    - name: Install dependencies
    - name: Run Bun tests with coverage # ALL tests together
      run: bun run test:coverage
    - name: Run Jest tests for native app
      working-directory: apps/native
      run: ./node_modules/.bin/jest --coverage --coverageReporters=text-summary --silent || true
```

**Key Observations:**

- No separation between unit and integration tests
- `bun run test:coverage` runs all Bun tests at once
- Native app tests run separately via Jest
- No database setup for integration tests (they may fail or be skipped)

### 4.2 Coverage Workflow (.github/workflows/coverage.yml)

- Similar pattern: runs all tests together
- Uploads coverage to Codecov
- Checks thresholds (80%)

---

## 5. Test Categorization Analysis

### 5.1 Clear Unit Tests (Fast, No External Dependencies)

**Count: ~50 test files**

These tests:

- Test pure business logic
- Use mocks for all dependencies
- Don't require database, network, or file system
- Execute in milliseconds

**Packages that are 100% unit tests:**

- `@repo/domain` (12 files)
- `@repo/use-cases` (8 files)
- `packages/shared` (4 files)
- `packages/auth` (1 file)
- `apps/backend-server` (3 files)
- `apps/web` (17 files)
- `apps/notification-sender` (2 files)

### 5.2 Integration Tests (Require External Resources)

**Count: ~24 test files**

These tests:

- Require database connection
- Test real API endpoints
- May need external services (Supabase, etc.)
- Take longer to execute

**Integration test files:**

- `packages/db/src/__tests__/models.test.ts` - Requires database
- `packages/trpc/src/api/routers/__tests__/*.test.ts` (19 files) - API tests
- `packages/supabase/src/__tests__/client.test.ts` - Requires Supabase
- `packages/adapters/src/__tests__/Prisma*.test.ts` (2 files) - With mocks, but close to integration

### 5.3 Mixed/Unclear

**Count: ~12 test files**

These need review to determine classification:

- `packages/trpc/src/utils/__tests__/*.test.ts` (9 files) - Utility functions, likely unit
- `packages/adapters/src/__tests__/*Mapper.test.ts` (2 files) - Pure mapping logic, likely unit

---

## 6. Affected Files and Proposed Changes

### 6.1 Files to Modify

#### Package.json Scripts (Root)

**File:** `/package.json`

Current:

```json
{
  "test": "turbo run test",
  "test:ci": "turbo run test:ci",
  "test:coverage": "turbo run test --coverage",
  "test:unit": "turbo run test --filter='!@mirai-app/db'",
  "test:db": "turbo run test"
}
```

Proposed:

```json
{
  "test": "turbo run test",
  "test:unit": "turbo run test:unit",
  "test:integration": "turbo run test:integration",
  "test:ci": "bun run test:unit && bun run test:integration",
  "test:coverage": "turbo run test:coverage",
  "test:coverage:unit": "turbo run test:coverage:unit",
  "test:coverage:integration": "turbo run test:coverage:integration"
}
```

#### Turbo Configuration

**File:** `/turbo.json`

Add new tasks:

```json
{
  "test:unit": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  },
  "test:integration": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  }
}
```

#### Package.json Files (Per Package)

**Files to update:**

- `/packages/domain/package.json` - Add `test:unit` script
- `/packages/use-cases/package.json` - Add `test:unit` script
- `/packages/adapters/package.json` - Add `test:unit` and `test:integration` scripts
- `/packages/db/package.json` - Add `test:integration` script (move from `test:db`)
- `/packages/trpc/package.json` - Add `test:unit` and `test:integration` scripts
- `/packages/supabase/package.json` - Add `test:integration` script
- `/packages/auth/package.json` - Add `test:unit` script
- `/packages/shared/package.json` - Add `test:unit` script
- `/apps/backend-server/package.json` - Add `test:unit` script
- `/apps/web/package.json` - Add `test:unit` and `test:integration` scripts
- `/apps/notification-sender/package.json` - Add `test:unit` script
- `/apps/seed/package.json` - Add `test:unit` script

Example per-package changes:

```json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test --grep 'unit' || bun test", // Or specific pattern
    "test:integration": "bun test --grep 'integration' || echo 'No integration tests'",
    "test:coverage": "bun test --coverage",
    "test:coverage:unit": "bun test --coverage --grep 'unit' || bun test --coverage"
  }
}
```

#### CI Configuration

**File:** `.github/workflows/ci.yml`

Proposed changes:

```yaml
jobs:
  test-unit:
    runs-on: ubuntu-latest
    steps:
      # ... setup steps ...
      - name: Run unit tests
        run: bun run test:unit

  test-integration:
    runs-on: ubuntu-latest
    services:
      postgres: # If needed for integration tests
        image: postgres:15
        # ... config ...
    steps:
      # ... setup steps ...
      - name: Run integration tests
        run: bun run test:integration
```

**File:** `.github/workflows/coverage.yml`

Similar split for coverage reporting.

### 6.2 New Files to Create

#### Bun Test Configuration for Filtering

Create or update `bunfig.toml` files with test name patterns:

**Option 1: File Naming Convention**
Create convention:

- `*.unit.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests

**Option 2: Directory Structure**
Rename/move tests:

- `__tests__/unit/*.test.ts`
- `__tests__/integration/*.test.ts`

**Option 3: Test Metadata (Recommended - Minimal Change)**
Use Bun's test filtering with descriptive test names or tags.

#### Example New Bunfig Pattern

Add to root `bunfig.toml`:

```toml
[test]
# Unit tests - fast, no external deps
unit = { include = ["**/*.test.ts", "**/*.test.tsx"], exclude = ["**/db/**", "**/trpc/src/api/**"] }

# Integration tests - require external resources
integration = { include = ["**/db/**/*.test.ts", "**/trpc/src/api/**/*.test.ts", "**/supabase/**/*.test.ts"] }
```

**Note:** Bun doesn't natively support named test profiles like this. Alternative approaches:

1. **Script-based filtering** (recommended):

   ```bash
   # Root package.json
   "test:unit": "bun test --exclude '**/db/**' --exclude '**/api/**'",
   "test:integration": "bun test --include '**/db/**' --include '**/api/**'"
   ```

2. **Environment variable approach**:

   ```bash
   "test:unit": "TEST_TYPE=unit bun test",
   "test:integration": "TEST_TYPE=integration bun test"
   ```

   Then in test files check `process.env.TEST_TYPE`

3. **Separate test directories** (most explicit):
   ```
   src/
     __tests__/
       unit/
       integration/
   ```

---

## 7. Risk Assessment

### 7.1 High Risk

| Risk                                      | Impact | Mitigation                              |
| ----------------------------------------- | ------ | --------------------------------------- |
| Test file reorganization breaks imports   | High   | Careful refactoring with search/replace |
| CI pipeline changes break existing checks | High   | Test in PR, have rollback plan          |
| Missing tests after categorization        | Medium | Verify all 109 tests are accounted for  |

### 7.2 Medium Risk

| Risk                                          | Impact | Mitigation                                   |
| --------------------------------------------- | ------ | -------------------------------------------- |
| Coverage reporting split across two jobs      | Medium | Merge coverage reports before upload         |
| Developer workflow disruption                 | Medium | Update documentation, provide clear commands |
| Native app (Jest) still uses different runner | Low    | Keep separate, document clearly              |

### 7.3 Low Risk

| Risk                                 | Impact | Mitigation                      |
| ------------------------------------ | ------ | ------------------------------- |
| Test naming conventions not followed | Low    | Code review, linting            |
| Some tests classified incorrectly    | Low    | Easy to move between categories |

---

## 8. Implementation Recommendations

### 8.1 Recommended Approach: File Naming Convention

**Phase 1: Rename Test Files**

```
*.test.ts → *.unit.test.ts (for unit tests)
*.test.ts → *.integration.test.ts (for integration tests)
```

**Phase 2: Update Package Scripts**

```json
{
  "test:unit": "bun test '**/*.unit.test.ts'",
  "test:integration": "bun test '**/*.integration.test.ts'",
  "test": "bun run test:unit && bun run test:integration"
}
```

**Pros:**

- Clear visual distinction
- Easy filtering with glob patterns
- No configuration changes needed in Bun

**Cons:**

- Requires renaming ~109 files
- Git history shows renames
- Need to update any import references

### 8.2 Alternative: Directory-Based Organization

Move tests into subdirectories:

```
src/
  __tests__/
    unit/
      Challenge.test.ts
    integration/
      models.test.ts
```

**Pros:**

- Clean separation
- Easy to configure in bunfig.toml per-package

**Cons:**

- More file moves
- May break relative imports in tests

### 8.3 Alternative: Minimal Changes (Environment-Based)

Keep current file structure, use test naming:

```typescript
// In test files
describe("[UNIT] Challenge Entity", () => { ... });
describe("[INTEGRATION] Database Models", () => { ... });
```

Then filter:

```bash
bun test --grep "\[UNIT\]"
bun test --grep "\[INTEGRATION\]"
```

**Pros:**

- Minimal file changes
- Can be applied gradually

**Cons:**

- Relies on consistent naming
- Less explicit than file organization

---

## 9. Integration Points

### 9.1 Package Dependencies

```
Domain (unit only)
    ↓
Use Cases (unit only)
    ↓
Adapters (unit + integration)
    ↓
Frameworks (integration)
    ↓
Apps (integration)
```

### 9.2 Test Data Flow

- Unit tests: Use mocks/fixtures, no DB
- Integration tests: May need test database setup
- Consider `packages/test-utils` for shared fixtures

### 9.3 CI Pipeline Flow

```
Build → TypeCheck → Unit Tests (fast, parallel) → Integration Tests (slower, needs DB)
```

---

## 10. Next Steps

1. **Decision needed:** Choose approach (file naming, directory structure, or environment-based)
2. **Create specification** with exact file mappings
3. **Draft implementation plan** with rollback strategy
4. **Update CI configuration** to support parallel test execution
5. **Document new test commands** in AGENTS.md and README

---

## Appendix A: Complete Test File List

### Domain Layer (12 files)

- `packages/domain/src/entities/Challenge.test.ts`
- `packages/domain/src/entities/ChallengeSubmission.test.ts`
- `packages/domain/src/entities/User.test.ts`
- `packages/domain/src/entities/Reward.test.ts`
- `packages/domain/src/entities/Location.test.ts`
- `packages/domain/src/entities/Group.test.ts`
- `packages/domain/src/entities/Notification.test.ts`
- `packages/domain/src/entities/ActivityFeed.test.ts`
- `packages/domain/src/entities/Trip.test.ts`
- `packages/domain/src/value-objects/CoinAmount.test.ts`
- `packages/domain/src/value-objects/UserId.test.ts`
- `packages/domain/src/utils/result.test.ts`

### Use Cases Layer (8 files)

- `packages/use-cases/src/interactors/GetChallenge.test.ts`
- `packages/use-cases/src/interactors/CreateChallenge.test.ts`
- `packages/use-cases/src/interactors/UpdateChallenge.test.ts`
- `packages/use-cases/src/interactors/UpdateChallengeStatus.test.ts`
- `packages/use-cases/src/interactors/GetUser.test.ts`
- `packages/use-cases/src/interactors/CreateUser.test.ts`
- `packages/use-cases/src/interactors/UpdateUser.test.ts`
- `packages/use-cases/src/interactors/GetNotification.test.ts`

### Adapters Layer (4 files)

- `packages/adapters/src/__tests__/PrismaChallengeRepository.test.ts`
- `packages/adapters/src/__tests__/PrismaUserRepository.test.ts`
- `packages/adapters/src/__tests__/ChallengeMapper.test.ts`
- `packages/adapters/src/__tests__/UserMapper.test.ts`

### Database Layer (1 file)

- `packages/db/src/__tests__/models.test.ts`

### tRPC Layer (28 files)

- `packages/trpc/src/api/routers/__tests__/user.test.ts`
- `packages/trpc/src/api/routers/__tests__/challenge.test.ts`
- `packages/trpc/src/api/routers/__tests__/challengeSubmission.test.ts`
- `packages/trpc/src/api/routers/__tests__/challengeVote.test.ts`
- `packages/trpc/src/api/routers/__tests__/group.test.ts`
- `packages/trpc/src/api/routers/__tests__/trip.test.ts`
- `packages/trpc/src/api/routers/__tests__/location.test.ts`
- `packages/trpc/src/api/routers/__tests__/coin.test.ts`
- `packages/trpc/src/api/routers/__tests__/coinTransaction.test.ts`
- `packages/trpc/src/api/routers/__tests__/reward.test.ts`
- `packages/trpc/src/api/routers/__tests__/sponsor.test.ts`
- `packages/trpc/src/api/routers/__tests__/activityFeed.test.ts`
- `packages/trpc/src/api/routers/__tests__/notifications.test.ts`
- `packages/trpc/src/api/routers/__tests__/notificationSender.test.ts`
- `packages/trpc/src/api/routers/__tests__/notificationDelivery.test.ts`
- `packages/trpc/src/api/routers/__tests__/notificationSchedule.test.ts`
- `packages/trpc/src/api/routers/__tests__/storage.test.ts`
- `packages/trpc/src/api/routers/__tests__/submissionReport.test.ts`
- `packages/trpc/src/utils/__tests__/authEmails.test.ts`
- `packages/trpc/src/utils/__tests__/activityFeed.test.ts`
- `packages/trpc/src/utils/__tests__/notificationTemplates.test.ts`
- `packages/trpc/src/utils/__tests__/resilience.test.ts`
- `packages/trpc/src/utils/__tests__/notifications.test.ts`
- `packages/trpc/src/utils/__tests__/tripGuards.test.ts`
- `packages/trpc/src/utils/__tests__/storage.test.ts`
- `packages/trpc/src/utils/__tests__/location-validation.test.ts`
- `packages/trpc/src/utils/__tests__/recurringChallenges.test.ts`
- `packages/trpc/src/utils/__tests__/notificactionSchedule-validation.test.ts`

### Shared Layer (4 files)

- `packages/shared/src/stores/__tests__/mapStore.test.ts`
- `packages/shared/src/stores/__tests__/judgementStore.test.ts`
- `packages/shared/src/stores/__tests__/authStore.test.ts`
- `packages/shared/src/storage/__tests__/standard.test.ts`

### Auth Layer (1 file)

- `packages/auth/src/__tests__/authServer.test.ts`

### Supabase Layer (1 file)

- `packages/supabase/src/__tests__/client.test.ts`

### Backend Server (3 files)

- `apps/backend-server/src/utils/__tests__/server.test.ts`
- `apps/backend-server/src/utils/__tests__/config.test.ts`
- `apps/backend-server/src/utils/__tests__/headers.test.ts`

### Web App (22 files)

- `apps/web/src/__tests__/middleware.test.ts`
- `apps/web/src/hooks/__tests__/useWebFileUpload.test.ts`
- `apps/web/src/hooks/__tests__/useStaffVoting.test.ts`
- `apps/web/src/hooks/__tests__/useJudgement.test.ts`
- `apps/web/src/hooks/__tests__/useChallengeSubmissions.test.ts`
- `apps/web/src/hooks/__tests__/useChallengeForm.test.ts`
- `apps/web/src/hooks/__tests__/useActiveTripId.test.ts`
- `apps/web/src/lib/__tests__/auth.test.ts`
- `apps/web/src/lib/__tests__/supabase.test.ts`
- `apps/web/src/lib/__tests__/env.test.ts`
- `apps/web/src/lib/__tests__/toast.test.ts`
- `apps/web/src/lib/__tests__/logout.test.ts`
- `apps/web/src/lib/__tests__/fileValidation.test.ts`
- `apps/web/src/components/__tests__/OTPCodeInput.test.tsx`
- `apps/web/src/components/__tests__/LoginApp.test.tsx`
- `apps/web/src/components/__tests__/Select.test.tsx`
- `apps/web/src/components/__tests__/Modal.test.tsx`
- `apps/web/src/components/__tests__/LogoutButton.test.tsx`

### Notification Sender (2 files)

- `apps/notification-sender/src/__tests__/index.test.ts`
- `apps/notification-sender/src/utils/__tests__/scheduler.test.ts`

### Native App (17 files - Jest)

- `apps/native/src/services/location/__tests__/backgroundLocation.test.ts`
- `apps/native/src/utils/__tests__/utils.test.ts`
- `apps/native/src/services/background/__tests__/backgroundLocationTask.test.ts`
- `apps/native/src/services/storage/__tests__/storage.test.ts`
- `apps/native/src/hooks/community/__tests__/useCommunityFeed.test.ts`
- `apps/native/src/hooks/rewards/__tests__/useRewards.test.ts`
- `apps/native/src/hooks/supabase/__tests__/useSupabase.test.ts`
- `apps/native/src/hooks/partners/__tests__/usePartnerImageDownload.test.ts`
- `apps/native/src/hooks/sponsors/__tests__/useSponsors.test.ts`
- `apps/native/src/hooks/admin/__tests__/useAdminHooks.test.ts`
- `apps/native/src/hooks/files/__tests__/useFiles.test.ts`
- `apps/native/src/hooks/notifications/__tests__/useNotifications.test.ts`
- `apps/native/src/hooks/map/__tests__/useMapHooks.test.ts`
- `apps/native/src/hooks/location/__tests__/useLocationPermissions.test.ts`
- `apps/native/src/hooks/challenges/__tests__/useChallenges.test.ts`
- `apps/native/src/hooks/trips/__tests__/useTrips.test.ts`
- `apps/native/src/hooks/groups/__tests__/useGroups.test.ts`
- `apps/native/src/hooks/groups/__tests__/jest-setup.test.ts`

### Demo/Example Files (3 files)

- `examples/cek-five-pillars-demo/adapters/CreateChallengeController.test.ts`
- `examples/cek-five-pillars-demo/use-cases/CreateChallengeUseCase.test.ts`
- `examples/cek-five-pillars-demo/domain/CreateChallengeEntity.test.ts`

---

_End of Analysis_
