# Testing Infrastructure Analysis - MIRAI Monorepo

## Executive Summary

This analysis identifies all changes needed to add comprehensive unit testing to the MIRAI monorepo using **Jest for the native Expo app** and **Vitest for all packages and backend apps**.

---

## 1. Package.json Files Requiring Test Scripts

### 1.1 Root Package (`/Users/rafalopilowski/Projekty/migration/pjapp/package.json`)
**Status:** ❌ NO test script
**Action:** Add test script to run tests across all workspaces
```json
"test": "turbo run test"
```

### 1.2 Apps - Native (`/Users/rafalopilowski/Projekty/migration/pjapp/apps/native/package.json`)
**Status:** ❌ NO test script
**Testing Framework:** Jest (Expo/React Native standard)
**Action Required:**
- Add test scripts
- Add Jest dependencies
- Create `jest.config.js`
- Create `jest.setup.js`

**Dependencies to add:**
```json
"devDependencies": {
  "jest": "^29.7.0",
  "@jest/globals": "^29.7.0",
  "jest-expo": "~52.0.0",
  "@testing-library/react-native": "^12.4.0",
  "@testing-library/jest-native": "^5.4.3",
  "react-test-renderer": "^19.1.0"
}
```

**Scripts to add:**
```json
"test": "jest --coverage",
"test:watch": "jest --watch",
"test:ci": "jest --ci --coverage --passWithNoTests"
```

### 1.3 Apps - Backend Server (`/Users/rafalopilowski/Projekty/migration/pjapp/apps/backend-server/package.json`)
**Status:** ✅ HAS test script with vitest
**Current:**
```json
"test": "vitest run --coverage",
"test:watch": "vitest --watch",
"test:ui": "vitest --ui"
```
**Action:** Create missing `vitest.config.ts`

### 1.4 Apps - Notification Sender (`/Users/rafalopilowski/Projekty/migration/pjapp/apps/notification-sender/package.json`)
**Status:** ✅ HAS test script with vitest
**Current:**
```json
"test": "vitest run",
"test:watch": "vitest"
```
**Action:** 
- Create missing `vitest.config.ts`
- Add coverage support (missing `@vitest/coverage-v8` is already in devDependencies)

### 1.5 Apps - Seed (`/Users/rafalopilowski/Projekty/migration/pjapp/apps/seed/package.json`)
**Status:** ❌ NO test script
**Action:** 
- Add test scripts
- Add vitest dependencies
- Create `vitest.config.ts`

### 1.6 Packages - tRPC (`/Users/rafalopilowski/Projekty/migration/pjapp/packages/orpc/package.json`)
**Status:** ✅ HAS test script with vitest
**Current:**
```json
"test": "vitest run --coverage",
"test:watch": "vitest"
```
**Action:** Create missing `vitest.config.ts`

### 1.7 Packages - Auth (`/Users/rafalopilowski/Projekty/migration/pjapp/packages/auth/package.json`)
**Status:** ❌ NO test script
**Action:**
- Add test scripts
- Add vitest dependencies
- Create `vitest.config.ts`
- Create `vitest.setup.ts`

**Dependencies to add:**
```json
"devDependencies": {
  "vitest": "^4.0.16",
  "@vitest/coverage-v8": "^4.0.16"
}
```

### 1.8 Packages - Shared (`/Users/rafalopilowski/Projekty/migration/pjapp/packages/common/package.json`)
**Status:** ❌ NO test script
**Action:**
- Add test scripts
- Add vitest dependencies
- Create `vitest.config.ts`

**Dependencies to add:**
```json
"devDependencies": {
  "vitest": "^4.0.16",
  "@vitest/coverage-v8": "^4.0.16",
  "@types/bun": "latest"
}
```

### 1.9 Packages - Supabase (`/Users/rafalopilowski/Projekty/migration/pjapp/packages/supabase/package.json`)
**Status:** ✅ HAS test script with vitest
**Current:**
```json
"test": "vitest run --coverage",
"test:watch": "vitest"
```
**Status:** ✅ HAS `vitest.config.ts` and `vitest.setup.ts`
**Action:** None - already configured correctly

### 1.10 Packages - DB (`/Users/rafalopilowski/Projekty/migration/pjapp/packages/db/package.json`)
**Status:** ❌ NO test script
**Note:** Database package typically doesn't need unit tests (integration tests instead)
**Action:** Optional - can skip or add minimal vitest config for utility functions

---

## 2. Configuration Files to Create

### 2.1 Jest Configuration (for Native App)

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/native/jest.config.js`
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((react-native|@react-native|@react-navigation|expo|@expo|react-native-css-interop|nativewind)/))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**', // Exclude Expo Router pages (test via integration)
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/native/jest.setup.js`
```javascript
import '@testing-library/jest-native/extend-expect';

// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:2022',
      wsUrl: 'ws://localhost:2022',
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));
```

### 2.2 Vitest Configurations (for Backend Apps and Packages)

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/backend-server/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/notification-sender/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/seed/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/orpc/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/auth/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/auth/vitest.setup.ts`
```typescript
import { vi } from 'vitest';

// Mock @mirai-app/supabase
vi.mock('@mirai-app/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock @mirai-app/db
vi.mock('@mirai-app/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
```

**File:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/common/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', '__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', '*.ts'],
      exclude: ['src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 3. Package.json Modifications Summary

### 3.1 Root Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/package.json`
**Add to scripts:**
```json
"test": "turbo run test",
"test:ci": "turbo run test:ci -- --passWithNoTests"
```

### 3.2 Native App Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/native/package.json`
**Add to scripts:**
```json
"test": "jest --coverage",
"test:watch": "jest --watch",
"test:ci": "jest --ci --coverage --passWithNoTests"
```
**Add to devDependencies:**
```json
"jest": "^29.7.0",
"@jest/globals": "^29.7.0",
"jest-expo": "~52.0.0",
"@testing-library/react-native": "^12.4.0",
"@testing-library/jest-native": "^5.4.3",
"react-test-renderer": "^19.1.0"
```

### 3.3 Backend Server Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/backend-server/package.json`
**No changes needed** - already has test scripts

### 3.4 Notification Sender Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/notification-sender/package.json`
**Modify test script:**
```json
"test": "vitest run --coverage"
```

### 3.5 Seed Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/apps/seed/package.json`
**Add to scripts:**
```json
"test": "vitest run --coverage",
"test:watch": "vitest"
```
**Add to devDependencies:**
```json
"vitest": "^4.0.16",
"@vitest/coverage-v8": "^4.0.16"
```

### 3.6 tRPC Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/orpc/package.json`
**No changes needed** - already has test scripts

### 3.7 Auth Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/auth/package.json`
**Add to scripts:**
```json
"test": "vitest run --coverage",
"test:watch": "vitest"
```
**Add to devDependencies:**
```json
"vitest": "^4.0.16",
"@vitest/coverage-v8": "^4.0.16"
```

### 3.8 Shared Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/common/package.json`
**Add to scripts:**
```json
"test": "vitest run --coverage",
"test:watch": "vitest"
```
**Add to devDependencies:**
```json
"vitest": "^4.0.16",
"@vitest/coverage-v8": "^4.0.16"
```

### 3.9 Supabase Package.json
**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/packages/supabase/package.json`
**No changes needed** - already configured

---

## 4. Turbo.json Modifications

**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/turbo.json`

**Current test task:**
```json
"test": {
  "outputs": ["coverage/**"]
}
```

**Enhanced test task:**
```json
"test": {
  "dependsOn": ["^build"],
  "outputs": ["coverage/**"]
},
"test:ci": {
  "dependsOn": ["^build"],
  "outputs": ["coverage/**"]
}
```

---

## 5. CI Workflow Modifications

**Path:** `/Users/rafalopilowski/Projekty/migration/pjapp/.github/workflows/ci.yml`

**Add test job after typecheck:**
```yaml
- name: Run tests
  run: bun run test:ci

- name: Upload coverage reports
  uses: codecov/codecov-action@v3
  if: github.event_name == 'pull_request'
  with:
    directory: ./coverage
    files: '**/coverage/lcov.info'
    fail_ci_if_error: false
```

---

## 6. Test Directory Structure to Create

### 6.1 Native App
```
apps/native/
├── src/
│   ├── components/
│   │   └── __tests__/
│   ├── hooks/
│   │   └── __tests__/
│   ├── stores/
│   │   └── __tests__/
│   └── utils/
│       └── __tests__/
├── jest.config.js
└── jest.setup.js
```

### 6.2 Backend Server
```
apps/backend-server/
├── src/
│   ├── __tests__/
│   │   ├── server.test.ts
│   │   └── routes/
│   └── utils/
│       └── __tests__/
└── vitest.config.ts
```

### 6.3 Notification Sender
```
apps/notification-sender/
├── src/
│   ├── __tests__/
│   │   └── worker.test.ts
│   └── utils/
│       └── __tests__/
└── vitest.config.ts
```

### 6.4 tRPC Package
```
packages/orpc/
├── src/
│   ├── api/
│   │   └── __tests__/
│   ├── client/
│   │   └── __tests__/
│   └── utils/
│       └── __tests__/
└── vitest.config.ts
```

### 6.5 Auth Package
```
packages/auth/
├── src/
│   ├── __tests__/
│   │   ├── authServer.test.ts
│   │   └── store/
│   └── store/
│       └── __tests__/
├── vitest.config.ts
└── vitest.setup.ts
```

### 6.6 Shared Package
```
packages/common/
├── src/
│   ├── storage/
│   │   └── __tests__/
│   ├── stores/
│   │   └── __tests__/
│   └── tripInfo/
│       └── __tests__/
├── __tests__/
│   └── index.test.ts
├── vitest.config.ts
└── index.ts
```

---

## 7. Integration Points Between Packages

### 7.1 Dependency Graph
```
auth ──────┐
           ├──→ trpc ────→ backend-server, notification-sender
db ────────┤      └──→ native (via client)
           │
supabase ──┤      └──→ native (via client)
           │
shared ────┘
```

### 7.2 Testing Order (for CI)
1. `packages/common` - No dependencies
2. `packages/supabase` - No dependencies
3. `packages/db` - Depends on supabase
4. `packages/auth` - Depends on db, supabase, shared
5. `packages/orpc` - Depends on auth, db, shared, supabase
6. `apps/backend-server` - Depends on trpc
7. `apps/notification-sender` - Depends on trpc, db, supabase
8. `apps/native` - Depends on trpc (client), auth, shared, supabase
9. `apps/seed` - Depends on db, supabase

### 7.3 Mock Requirements

**Packages that need external mocks:**
- `packages/auth` - Mock `@mirai-app/supabase`, `@mirai-app/db`
- `packages/orpc` - Mock `@mirai-app/auth`, `@mirai-app/db`, `@mirai-app/supabase`
- `apps/backend-server` - Mock `@mirai-app/orpc`
- `apps/notification-sender` - Mock `@mirai-app/orpc`, `@mirai-app/db`, `@mirai-app/supabase`
- `apps/native` - Mock `expo-*` modules, `@mirai-app/orpc`, `@mirai-app/supabase`

---

## 8. Testing Dependencies Needed Per Package

### 8.1 Native App (Jest)
```json
{
  "jest": "^29.7.0",
  "@jest/globals": "^29.7.0",
  "jest-expo": "~52.0.0",
  "@testing-library/react-native": "^12.4.0",
  "@testing-library/jest-native": "^5.4.3",
  "react-test-renderer": "^19.1.0"
}
```

### 8.2 Backend Apps (Vitest)
```json
{
  "vitest": "^4.0.16",
  "@vitest/coverage-v8": "^4.0.16"
}
```

### 8.3 Packages (Vitest)
```json
{
  "vitest": "^4.0.16",
  "@vitest/coverage-v8": "^4.0.16"
}
```

---

## 9. File Summary

### Files to Create (12 files)
1. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/native/jest.config.js`
2. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/native/jest.setup.js`
3. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/backend-server/vitest.config.ts`
4. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/notification-sender/vitest.config.ts`
5. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/seed/vitest.config.ts`
6. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/orpc/vitest.config.ts`
7. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/auth/vitest.config.ts`
8. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/auth/vitest.setup.ts`
9. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/common/vitest.config.ts`

### Files to Modify (9 files)
1. `/Users/rafalopilowski/Projekty/migration/pjapp/package.json` - Add test scripts
2. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/native/package.json` - Add Jest deps and scripts
3. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/notification-sender/package.json` - Update test script
4. `/Users/rafalopilowski/Projekty/migration/pjapp/apps/seed/package.json` - Add vitest deps and scripts
5. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/auth/package.json` - Add vitest deps and scripts
6. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/common/package.json` - Add vitest deps and scripts
7. `/Users/rafalopilowski/Projekty/migration/pjapp/turbo.json` - Enhance test task
8. `/Users/rafalopilowski/Projekty/migration/pjapp/.github/workflows/ci.yml` - Add test execution

### Files Already Configured (2 files)
1. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/supabase/vitest.config.ts` ✅
2. `/Users/rafalopilowski/Projekty/migration/pjapp/packages/supabase/vitest.setup.ts` ✅

---

## 10. Implementation Priority

### Phase 1: Infrastructure (Required first)
1. Root package.json - Add test script
2. turbo.json - Enhance test task
3. CI workflow - Add test execution

### Phase 2: Packages (Independent)
4. packages/common - Add vitest config
5. packages/auth - Add vitest config + mocks
6. packages/orpc - Add vitest config

### Phase 3: Apps (Depend on packages)
7. apps/backend-server - Add vitest config
8. apps/notification-sender - Add vitest config
9. apps/seed - Add vitest config

### Phase 4: Native (Separate Jest setup)
10. apps/native - Add Jest config + setup

---

## 11. Commands to Run After Setup

```bash
# Install all dependencies
bun install

# Run all tests
bun run test

# Run tests with coverage
bun run test:ci

# Run tests for specific package
cd packages/auth && bun run test
cd packages/common && bun run test
cd packages/orpc && bun run test
cd packages/supabase && bun run test

# Run tests for specific app
cd apps/backend-server && bun run test
cd apps/notification-sender && bun run test
cd apps/native && bun run test
```
