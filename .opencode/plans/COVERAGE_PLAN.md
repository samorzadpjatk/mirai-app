# MIRAI Monorepo: 80%+ Code Coverage Implementation Plan

## Executive Summary

**Current State:**
- 418 source files across 9 packages
- Only 8 test files exist (~2% coverage)
- 7 Vitest configs (6 with coverage, 1 without)
- 1 Jest config for native app (0% thresholds)
- Comprehensive mock infrastructure already in place

**Goal:** Achieve 80%+ code coverage across all packages in 8 phases
**Estimated Timeline:** 4-6 weeks with parallel execution
**Estimated Test Files Needed:** ~180-220 new test files

---

## Phase 0: Infrastructure Setup (Foundation)

**Duration:** 1-2 days
**Priority:** CRITICAL - Must complete before any testing begins

### 0.1 Coverage Configuration Updates

#### packages/auth (vitest.config.ts)
```typescript
coverage: {
  provider: "v8",
  enabled: true,
  reporter: ["text", "json", "html", "lcov"],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
  exclude: [
    "node_modules/",
    "dist/",
    "**/*.d.ts",
    "**/*.config.*",
    "**/vitest.setup.ts",
    "**/index.ts",
  ],
}
```

#### packages/shared (vitest.config.ts)
**Current:** Basic config without thresholds
**Update:** Add full coverage configuration matching auth package

#### apps/seed (vitest.config.ts)
**Current:** No coverage enabled
**Update:** Add coverage for CLI tool (target: 60% due to CLI nature)

#### apps/native (jest.config.cjs)
**Current:** All thresholds at 0%
**Update:**
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

### 0.2 Root-Level Scripts (package.json)

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "test:changed": "turbo run test -- --changed",
    "coverage:report": "tsx scripts/merge-coverage.ts",
    "coverage:check": "tsx scripts/check-coverage.ts"
  }
}
```

### 0.3 Coverage Merge Script

Create `scripts/merge-coverage.ts`:
```typescript
import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const packages = [
  'packages/auth',
  'packages/shared',
  'packages/orpc',
  'packages/supabase',
  'apps/backend-server',
  'apps/notification-sender',
  'apps/seed',
];

const coverageFiles = packages
  .map(p => join(p, 'coverage/lcov.info'))
  .filter(existsSync);

if (!existsSync('coverage/merged')) {
  mkdirSync('coverage/merged', { recursive: true });
}

const inputFiles = coverageFiles.join(' ');
execSync(
  `npx lcov-result-merger "${inputFiles}" coverage/merged/lcov.info`,
  { stdio: 'inherit' }
);

execSync(
  'npx genhtml coverage/merged/lcov.info -o coverage/report',
  { stdio: 'inherit' }
);
```

### 0.4 Turborepo Pipeline Updates (turbo.json)

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "**/__tests__/**", "*.config.*"],
      "outputs": ["coverage/**"]
    },
    "test:coverage": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "**/__tests__/**", "*.config.*"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### 0.5 Phase 0 Verification

```bash
# Run to verify setup
cd packages/auth && bun run test:coverage
cd packages/shared && bun run test:coverage
# ... for each package

# Verify coverage reports generated
ls packages/*/coverage/lcov.info
```

**Atomic Commit:** `infra(test): configure coverage thresholds and reporting`

---

## Phase 1: packages/auth (8 files, 5 business logic)

**Duration:** 3-4 days
**Priority:** CRITICAL - Security-critical auth logic
**Current Coverage:** ~15% (basic test exists)
**Target Coverage:** 90% (higher for security)
**New Test Files Needed:** 5

### 1.1 File-by-File Breakdown

| File | Lines | Complexity | Priority | Tests Needed |
|------|-------|------------|----------|--------------|
| `src/authServer.ts` | 390 | Complex | CRITICAL | 3 test files |
| `src/client.ts` | ~80 | Moderate | Critical | 1 test file |
| `src/hooks/useLoginForm.ts` | ~60 | Moderate | Important | 1 test file |
| `src/store/AuthStoreProvider.tsx` | ~120 | Moderate | Important | 1 test file |
| `src/store/authHooks.ts` | ~50 | Simple | Important | 1 test file |

### 1.2 Test Implementation Plan

#### TDD Approach for authServer.ts

**Step 1:** Write characterization test for current JWT decoding behavior
```typescript
// src/__tests__/authServer/jwt.test.ts
describe('JWT Decoding - Characterization', () => {
  it('should decode valid JWT token', () => {
    const token = createMockJWT({ userId: 'u1', role: 'ADMIN' });
    const decoded = decodeJWT(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.role).toBe('ADMIN');
  });

  it('should throw on invalid JWT format', () => {
    expect(() => decodeJWT('invalid-token')).toThrow(AuthenticationError);
  });
});
```

**Step 2:** Write tests for role checking logic
```typescript
// src/__tests__/authServer/roles.test.ts
describe('Role Authorization', () => {
  it('ADMIN should access all routes', () => {
    expect(hasAccess('ADMIN', '/admin/users')).toBe(true);
    expect(hasAccess('ADMIN', '/api/protected')).toBe(true);
  });

  it('USER should not access admin routes', () => {
    expect(hasAccess('USER', '/admin/users')).toBe(false);
  });

  it('MODERATOR should access moderation routes', () => {
    expect(hasAccess('MODERATOR', '/admin/moderate')).toBe(true);
    expect(hasAccess('MODERATOR', '/admin/users')).toBe(false);
  });
});
```

**Step 3:** Write tests for ban validation
```typescript
// src/__tests__/authServer/ban.test.ts
describe('User Ban Validation', () => {
  it('should reject banned users', async () => {
    const bannedUser = createMockUser({ bannedUntil: futureDate() });
    await expect(validateUserAccess(bannedUser)).rejects.toThrow(
      'User is banned'
    );
  });

  it('should allow users after ban expires', async () => {
    const user = createMockUser({ bannedUntil: pastDate() });
    await expect(validateUserAccess(user)).resolves.not.toThrow();
  });
});
```

### 1.3 Atomic Commits

1. `test(auth): add JWT decoding characterization tests`
2. `test(auth): add role authorization tests`
3. `test(auth): add ban validation tests`
4. `test(auth): add client initialization tests`
5. `test(auth): add auth hooks tests`

### 1.4 Verification

```bash
cd packages/auth
bun run test:coverage
# Verify: lines >= 90%, functions >= 90%, branches >= 85%
```

---

## Phase 2: packages/supabase (4 files, 3 business logic)

**Duration:** 2-3 days
**Priority:** CRITICAL - Database client layer
**Current Coverage:** ~5% (basic export test only)
**Target Coverage:** 85%
**New Test Files Needed:** 3

### 2.1 File-by-File Breakdown

| File | Lines | Complexity | Priority | Tests Needed |
|------|-------|------------|----------|--------------|
| `src/client.ts` | 63 | Moderate | CRITICAL | 1 test file |
| `src/base.ts` | ~40 | Moderate | Critical | 1 test file |
| `src/react.tsx` | ~80 | Moderate | Important | 1 test file |
| `src/types.ts` | ~20 | Simple | Nice-to-have | Skip (types) |

### 2.2 Test Implementation Plan

#### TDD for Client Factory

**Step 1:** Write characterization test for client creation
```typescript
// src/__tests__/client.test.ts
describe('Supabase Client Factory', () => {
  it('should create client with proper storage adapter', () => {
    const client = createClient({
      url: 'http://localhost:54321',
      key: 'test-key',
    });
    expect(client).toHaveProperty('auth');
    expect(client).toHaveProperty('from');
  });

  it('should use AsyncStorage in React Native env', () => {
    mockReactNativeEnv();
    const client = createClient({ url, key });
    expect(client.auth.storage).toBeInstanceOf(AsyncStorageAdapter);
  });

  it('should use memory storage in Node env', () => {
    mockNodeEnv();
    const client = createClient({ url, key });
    expect(client.auth.storage).toBeInstanceOf(MemoryStorageAdapter);
  });
});
```

#### TDD for React Integration

```typescript
// src/__tests__/react.test.tsx
describe('SupabaseProvider', () => {
  it('should provide client to children', () => {
    const TestComponent = () => {
      const client = useSupabaseClient();
      expect(client).toBeDefined();
      return null;
    };

    render(
      <SupabaseProvider client={mockClient}>
        <TestComponent />
      </SupabaseProvider>
    );
  });

  it('should handle client initialization errors', () => {
    const ErrorComponent = () => {
      throw new Error('Client init failed');
    };

    expect(() =>
      render(
        <SupabaseProvider client={null as any}>
          <ErrorComponent />
        </SupabaseProvider>
      )
    ).toThrow();
  });
});
```

### 2.3 Atomic Commits

1. `test(supabase): add client factory tests`
2. `test(supabase): add base client tests`
3. `test(supabase): add React provider tests`

### 2.4 Verification

```bash
cd packages/supabase
bun run test:coverage
# Verify: lines >= 85%, functions >= 85%, branches >= 80%
```

---

## Phase 3: packages/shared (11 files, 7 business logic)

**Duration:** 4-5 days
**Priority:** HIGH - Shared utilities and stores
**Current Coverage:** ~25% (storage tests exist)
**Target Coverage:** 80%
**New Test Files Needed:** 6

### 3.1 File-by-File Breakdown

| File | Lines | Complexity | Priority | Tests Needed |
|------|-------|------------|----------|--------------|
| `src/stores/authStore.ts` | 248 | Moderate | CRITICAL | 1 test file |
| `src/stores/mapStore.ts` | ~80 | Moderate | Important | 1 test file |
| `src/stores/judgementStore.ts` | ~60 | Moderate | Important | 1 test file |
| `src/storage/standard.ts` | ~120 | Moderate | Important | 1 test file |
| `src/test-utils/*.ts` | ~200 | Simple | Important | 1 test file |
| `src/test-utils/*.ts` | ~150 | Simple | Important | 1 test file |

### 3.2 Test Implementation Plan

#### TDD for Zustand Stores

```typescript
// src/stores/__tests__/authStore.test.ts
describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('should initialize with null user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set user on login', () => {
    const mockUser = createMockUser({ id: 'u1', email: 'test@example.com' });
    useAuthStore.getState().setUser(mockUser);
    
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should clear user on logout', () => {
    useAuthStore.getState().setUser(createMockUser());
    useAuthStore.getState().logout();
    
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should update user partial data', () => {
    useAuthStore.getState().setUser(createMockUser({ name: 'Old' }));
    useAuthStore.getState().updateUser({ name: 'New' });
    
    expect(useAuthStore.getState().user?.name).toBe('New');
  });
});
```

### 3.3 Atomic Commits

1. `test(shared): add authStore tests`
2. `test(shared): add mapStore tests`
3. `test(shared): add judgementStore tests`
4. `test(shared): enhance storage/standard tests`
5. `test(shared): add test-utils mock-factories tests`
6. `test(shared): add test-utils test-data-builders tests`

### 3.4 Verification

```bash
cd packages/shared
bun run test:coverage
# Verify: lines >= 80%, functions >= 80%, branches >= 75%
```

---

## Phase 4: apps/backend-server (4 files, 4 business logic)

**Duration:** 2-3 days
**Priority:** HIGH - API entry point
**Current Coverage:** ~30% (basic API test exists)
**Target Coverage:** 85%
**New Test Files Needed:** 3

### 4.1 File-by-File Breakdown

| File | Lines | Complexity | Priority | Tests Needed |
|------|-------|------------|----------|--------------|
| `src/server.ts` | 106 | Moderate | CRITICAL | 1 test file |
| `src/index.ts` | ~30 | Simple | Critical | 1 test file |
| `src/config.ts` | ~40 | Simple | Important | 1 test file |
| `src/utils/headers.ts` | ~20 | Simple | Important | 1 test file |

### 4.2 Test Implementation Plan

```typescript
// src/__tests__/server.test.ts
describe('Fastify Server', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = await createServer({ port: 0 }); // Random port
  });

  afterEach(async () => {
    await server.close();
  });

  it('should start with tRPC plugin', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/trpc/health',
      payload: {},
    });
    expect(response.statusCode).toBe(200);
  });

  it('should handle CORS headers', async () => {
    const response = await server.inject({
      method: 'OPTIONS',
      url: '/trpc/query',
    });
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  it('should serve health check endpoint', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('status', 'ok');
  });
});
```

### 4.3 Atomic Commits

1. `test(backend-server): add server initialization tests`
2. `test(backend-server): add configuration tests`
3. `test(backend-server): add utility tests`

### 4.4 Verification

```bash
cd apps/backend-server
bun run test:coverage
# Verify: lines >= 85%, functions >= 85%, branches >= 80%
```

---

## Phase 5: apps/notification-sender (2 files, 2 business logic)

**Duration:** 2 days
**Priority:** MEDIUM - Service worker
**Current Coverage:** ~40% (scheduler tests exist)
**Target Coverage:** 80%
**New Test Files Needed:** 2

### 5.1 File-by-File Breakdown

| File | Lines | Complexity | Priority | Tests Needed |
|------|-------|------------|----------|--------------|
| `src/index.ts` | ~80 | Moderate | CRITICAL | 1 test file |
| `src/utils/scheduler.ts` | ~60 | Moderate | Important | 1 test file |

### 5.2 Test Implementation Plan

```typescript
// src/__tests__/index.test.ts
describe('Notification Service', () => {
  it('should process scheduled notifications', async () => {
    const mockNotification = createMockScheduledNotification();
    await processNotification(mockNotification);
    
    expect(sendPushNotification).toHaveBeenCalledWith({
      to: mockNotification.userId,
      title: mockNotification.title,
      body: mockNotification.body,
    });
  });

  it('should handle notification failures gracefully', async () => {
    mockPushNotificationFailure();
    const mockNotification = createMockScheduledNotification();
    
    await expect(processNotification(mockNotification)).rejects.toThrow();
    expect(logNotificationFailure).toHaveBeenCalled();
  });
});
```

### 5.3 Atomic Commits

1. `test(notification-sender): add main service tests`
2. `test(notification-sender): enhance scheduler tests`

### 5.4 Verification

```bash
cd apps/notification-sender
bun run test:coverage
# Verify: lines >= 80%, functions >= 80%, branches >= 75%
```

---

## Phase 6: apps/seed (16 files, 14 business logic)

**Duration:** 4-5 days
**Priority:** MEDIUM - CLI tool
**Current Coverage:** ~35% (basic seed test exists)
**Target Coverage:** 60% (CLI tools have lower priority)
**New Test Files Needed:** 10

### 6.1 File-by-File Breakdown

**High Priority:**
| File | Lines | Complexity | Tests Needed |
|------|-------|------------|--------------|
| `src/seed.ts` | 72 | Moderate | 1 test file |
| `src/trips.ts` | ~150 | Complex | 2 test files |
| `src/users.ts` | ~100 | Moderate | 1 test file |
| `src/auth.ts` | ~80 | Moderate | 1 test file |

**Medium Priority:**
| File | Lines | Complexity | Tests Needed |
|------|-------|------------|--------------|
| `src/rewards.ts` | ~80 | Moderate | 1 test file |
| `src/sponsors.ts` | ~60 | Moderate | 1 test file |
| `src/storage.ts` | ~100 | Moderate | 1 test file |
| `src/tripConfigs.ts` | ~60 | Moderate | 1 test file |

**Lower Priority (60% target):**
- config/* files - utility testing
- utils/* files - simple utilities

### 6.2 Test Implementation Plan

```typescript
// src/__tests__/seed.test.ts
describe('Seed Orchestrator', () => {
  it('should seed trips successfully', async () => {
    await seedTrips();
    const trips = await db.trip.findMany();
    expect(trips.length).toBeGreaterThan(0);
  });

  it('should seed users with auth', async () => {
    await seedUsers();
    const users = await db.user.findMany();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].auth).toBeDefined();
  });

  it('should handle seeding errors', async () => {
    mockDatabaseFailure();
    await expect(seedTrips()).rejects.toThrow();
  });
});
```

### 6.3 Atomic Commits

1. `test(seed): add seed orchestrator tests`
2. `test(seed): add trip seeding tests`
3. `test(seed): add user seeding tests`
4. `test(seed): add auth seeding tests`
5. `test(seed): add reward seeding tests`
6. `test(seed): add sponsor seeding tests`
7. `test(seed): add storage seeding tests`
8. `test(seed): add config loading tests`

### 6.4 Verification

```bash
cd apps/seed
bun run test:coverage
# Verify: lines >= 60%, functions >= 60%, branches >= 55%
```

---

## Phase 7: packages/orpc (37 files, 31 business logic)

**Duration:** 10-14 days
**Priority:** CRITICAL - Core API layer
**Current Coverage:** ~20% (router test exists but minimal)
**Target Coverage:** 80%
**New Test Files Needed:** 25-30

### 7.1 File-by-File Breakdown

**Core Infrastructure (5 test files):**
| File | Lines | Complexity | Tests Needed |
|------|-------|------------|--------------|
| `src/api/trpc.ts` | 369 | Complex | 2 test files |
| `src/api/root.ts` | ~50 | Simple | 1 test file |

**API Routers (19 routers × 1-2 test files each = 25 test files):**

| Router | Lines | Complexity | Test Files |
|--------|-------|------------|------------|
| `routers/user/` | 1021 | Very Complex | 3 |
| `routers/trip/` | ~400 | Complex | 2 |
| `routers/challenge/` | ~350 | Complex | 2 |
| `routers/challengeSubmission/` | ~300 | Complex | 2 |
| `routers/challengeVote/` | ~200 | Moderate | 1 |
| `routers/group/` | ~250 | Complex | 2 |
| `routers/coin/` | ~200 | Moderate | 1 |
| `routers/coinTransaction/` | ~250 | Complex | 1 |
| `routers/notifications/` | ~300 | Complex | 2 |
| `routers/notificationSchedule/` | ~200 | Moderate | 1 |
| `routers/notificationDelivery/` | ~200 | Moderate | 1 |
| `routers/notificationSender/` | ~150 | Moderate | 1 |
| `routers/location/` | ~200 | Moderate | 1 |
| `routers/storage/` | ~150 | Moderate | 1 |
| `routers/reward/` | ~250 | Moderate | 1 |
| `routers/sponsor/` | ~150 | Simple | 1 |
| `routers/activityFeed/` | ~200 | Moderate | 1 |
| `routers/submissionReport/` | ~150 | Moderate | 1 |

**Utilities (5 test files):**
| File | Lines | Complexity | Tests Needed |
|------|-------|------------|--------------|
| `src/utils/notifications.ts` | ~200 | Moderate | 1 test file |
| `src/utils/notificationTemplates.ts` | ~100 | Moderate | 1 test file |
| `src/utils/activityFeed.ts` | ~100 | Moderate | 1 test file |
| `src/utils/authEmails.ts` | ~80 | Simple | 1 test file |
| `src/utils/tripGuards.ts` | ~100 | Moderate | 1 test file |
| `src/utils/recurringChallenges.ts` | ~150 | Moderate | 1 test file |
| `src/utils/resilience.ts` | ~80 | Moderate | 1 test file |
| `src/utils/storage.ts` | ~100 | Moderate | 1 test file |
| `src/utils/location-validation.ts` | ~80 | Moderate | 1 test file |
| `src/utils/notificationSchedule-validation.ts` | ~60 | Simple | 1 test file |

**Client Code (2 test files):**
| File | Lines | Complexity | Tests Needed |
|------|-------|------------|--------------|
| `src/client/react.ts` | ~50 | Simple | 1 test file |
| `src/client/query-client.tsx` | ~80 | Moderate | 1 test file |
| `src/client/invalidationUtils.ts` | ~60 | Moderate | 1 test file |
| `src/client/vanilia.ts` | ~40 | Simple | 1 test file |

### 7.2 Test Implementation Plan

#### TDD for trpc.ts (Authentication Middleware)

```typescript
// src/api/__tests__/trpc/auth.test.ts
describe('tRPC Authentication Middleware', () => {
  it('should allow public procedures without auth', async () => {
    const result = await publicProcedure.query(() => 'public');
    expect(result).toBe('public');
  });

  it('should reject protected procedures without session', async () => {
    await expect(
      protectedProcedure.query(() => 'protected')
    ).rejects.toThrow(TRPCError);
  });

  it('should allow admin-only to ADMIN users', async () => {
    const ctx = createMockContext({ user: { role: 'ADMIN' } });
    const result = await adminProcedure.query({ ctx }, () => 'admin');
    expect(result).toBe('admin');
  });

  it('should reject admin-only to non-admin users', async () => {
    const ctx = createMockContext({ user: { role: 'USER' } });
    await expect(
      adminProcedure.query({ ctx }, () => 'admin')
    ).rejects.toThrow(TRPCError);
  });

  it('should inject user context from JWT', async () => {
    const token = createMockJWT({ userId: 'u1', role: 'USER' });
    const ctx = await createContext({ req: { headers: { authorization: token } } });
    expect(ctx.user?.id).toBe('u1');
    expect(ctx.user?.role).toBe('USER');
  });
});
```

#### TDD for User Router

```typescript
// src/api/routers/__tests__/user.test.ts
describe('User Router', () => {
  describe('user.getById', () => {
    it('should return user by ID', async () => {
      const caller = createCaller({ user: { role: 'ADMIN' } });
      const user = await caller.user.getById({ id: 'u1' });
      expect(user.id).toBe('u1');
    });

    it('should throw if user not found', async () => {
      const caller = createCaller({ user: { role: 'ADMIN' } });
      await expect(caller.user.getById({ id: 'nonexistent' }))
        .rejects.toThrow(TRPCError);
    });

    it('should allow users to get their own data', async () => {
      const caller = createCaller({ user: { id: 'u1', role: 'USER' } });
      const user = await caller.user.getById({ id: 'u1' });
      expect(user.id).toBe('u1');
    });

    it('should not allow users to get other user data', async () => {
      const caller = createCaller({ user: { id: 'u1', role: 'USER' } });
      await expect(caller.user.getById({ id: 'u2' }))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('user.update', () => {
    it('should update user profile', async () => {
      const caller = createCaller({ user: { id: 'u1', role: 'USER' } });
      const result = await caller.user.update({
        id: 'u1',
        data: { name: 'New Name' },
      });
      expect(result.name).toBe('New Name');
    });

    it('should not allow email change without verification', async () => {
      const caller = createCaller({ user: { id: 'u1', role: 'USER' } });
      await expect(
        caller.user.update({ id: 'u1', data: { email: 'new@example.com' } })
      ).rejects.toThrow('Email verification required');
    });
  });

  describe('user.ban', () => {
    it('should allow ADMIN to ban user', async () => {
      const caller = createCaller({ user: { role: 'ADMIN' } });
      const result = await caller.user.ban({
        userId: 'u2',
        reason: 'Violation',
        duration: '7d',
      });
      expect(result.bannedUntil).toBeDefined();
    });

    it('should not allow USER to ban', async () => {
      const caller = createCaller({ user: { role: 'USER' } });
      await expect(
        caller.user.ban({ userId: 'u2', reason: 'Test', duration: '1d' })
      ).rejects.toThrow('Unauthorized');
    });
  });
});
```

### 7.3 Parallel Execution Strategy

**Team A (3-4 developers):** Core infrastructure
- trpc.ts authentication middleware
- root.ts router aggregation
- Client code (react.ts, query-client.tsx)

**Team B (4-5 developers):** Critical routers
- user/ (highest priority - 1021 lines)
- trip/
- challenge/
- challengeSubmission/
- group/

**Team C (3-4 developers):** Supporting routers
- coin.ts, coinTransaction.ts
- notifications.ts, notificationSchedule.ts, notificationDelivery.ts, notificationSender.ts
- location/, storage/, reward/, sponsor/

**Team D (2-3 developers):** Utilities
- All utility functions
- activityFeed/, submissionReport/

### 7.4 Atomic Commits (Example Pattern)

```
test(trpc): add authentication middleware tests
test(trpc): add user router - getById query tests
test(trpc): add user router - update mutation tests
test(trpc): add user router - ban mutation tests
test(trpc): add trip router - CRUD operation tests
test(trpc): add challenge router - create and list tests
test(trpc): add challenge router - submission flow tests
test(trpc): add notification router - send and schedule tests
test(trpc): add utility - notification template tests
test(trpc): add client - React hooks tests
```

### 7.5 Verification

```bash
cd packages/orpc
bun run test:coverage
# Verify: lines >= 80%, functions >= 80%, branches >= 75%

# Check specific router coverage
npx vitest run --reporter=verbose --coverage 2>&1 | grep -A 5 "src/api/routers/user"
```

---

## Phase 8: apps/native (308 files, ~180 business logic)

**Duration:** 15-20 days (parallel work throughout project)
**Priority:** COMPLEX - Main React Native app
**Current Coverage:** ~5% (1 component test exists)
**Target Coverage:** 70% (React Native UI has higher complexity)
**New Test Files Needed:** 120-150

### 8.1 Testing Strategy

**Approach:** Integration-first with selective unit testing

**Why Integration-First?**
- React Native components are tightly coupled with hooks
- UI testing requires mounting entire component trees
- Integration tests provide more value per test
- Use Jest + React Native Testing Library

### 8.2 Priority Breakdown

**Critical Areas (40% of tests):**
| Area | Files | Test Priority | Files to Test |
|------|-------|---------------|---------------|
| Background Location | 3 | CRITICAL | 3 |
| Real-time Map | 5 | CRITICAL | 5 |
| Challenge Capture | 4 | CRITICAL | 4 |
| File Upload/Download | 3 | CRITICAL | 3 |
| Auth Screens | 3 | CRITICAL | 3 |

**Important Areas (35% of tests):**
| Area | Files | Test Priority | Files to Test |
|------|-------|---------------|---------------|
| Trip Components | ~20 | Important | 10 |
| Challenge Components | ~15 | Important | 8 |
| Admin Components | ~25 | Important | 12 |
| Custom Hooks | ~50 | Important | 25 |
| Services Layer | ~15 | Important | 10 |

**Supporting Areas (25% of tests):**
| Area | Files | Test Priority | Files to Test |
|------|-------|---------------|---------------|
| UI Components | ~20 | Nice-to-have | 10 |
| Utility Functions | ~20 | Nice-to-have | 10 |
| Store Logic | ~10 | Important | 5 |

### 8.3 Critical File Testing Plan

#### Background Location Service

```typescript
// src/services/background/__tests__/backgroundLocationTask.test.ts
describe('BackgroundLocationTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    BackgroundTask.unregisterAllAsync();
  });

  it('should register background task', async () => {
    await registerBackgroundLocationTask();
    expect(TaskManager.defineTask).toHaveBeenCalledWith(
      'background-location-task',
      expect.any(Function)
    );
  });

  it('should handle location updates in background', async () => {
    const mockLocation = createMockLocation({ latitude: 52.2297, longitude: 21.0122 });
    
    await simulateBackgroundLocationUpdate(mockLocation);
    
    expect(Location.uploadLocation).toHaveBeenCalledWith({
      latitude: 52.2297,
      longitude: 21.0122,
      timestamp: expect.any(Number),
    });
  });

  it('should handle location permission denial', async () => {
    mockLocationPermissionDenied();
    
    await expect(registerBackgroundLocationTask())
      .rejects.toThrow('Location permission required');
  });

  it('should stop updates when user logs out', async () => {
    await registerBackgroundLocationTask();
    simulateUserLogout();
    
    expect(BackgroundTask.unregisterAsync).toHaveBeenCalledWith(
      'background-location-task'
    );
  });
});
```

#### Challenge Photo Capture

```typescript
// src/hooks/challenges/__tests__/useChallengeCapture.test.ts
describe('useChallengeCapture', () => {
  it('should request camera permission on capture', async () => {
    const { result } = renderHook(() => useChallengeCapture());
    
    await act(async () => {
      await result.current.capturePhoto();
    });
    
    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
  });

  it('should upload photo after capture', async () => {
    const mockPhoto = createMockPhoto({ uri: 'file://photo.jpg' });
    mockImagePickerResult(mockPhoto);
    
    const { result } = renderHook(() => useChallengeCapture({ challengeId: 'c1' }));
    
    await act(async () => {
      await result.current.capturePhoto();
    });
    
    expect(useFileUpload().upload).toHaveBeenCalledWith({
      uri: 'file://photo.jpg',
      challengeId: 'c1',
    });
  });

  it('should handle upload errors', async () => {
    mockFileUploadError();
    const { result } = renderHook(() => useChallengeCapture());
    
    await act(async () => {
      await expect(result.current.capturePhoto()).rejects.toThrow('Upload failed');
    });
    
    expect(result.current.error).toBe('Upload failed');
  });
});
```

### 8.4 Test Organization

```
apps/native/src/
├── services/
│   ├── background/__tests__/backgroundLocationTask.test.ts
│   ├── location/__tests__/backgroundLocation.test.ts
│   └── storage/__tests__/localStorage.test.ts
├── hooks/
│   ├── map/__tests__/useMapLocationStream.test.ts
│   ├── challenges/__tests__/useChallengeCapture.test.ts
│   ├── files/__tests__/useFileUpload.test.ts
│   └── files/__tests__/useFileDownload.test.ts
├── components/
│   ├── trips/__tests__/TripCard.test.tsx
│   ├── challenges/__tests__/ChallengeCard.test.tsx
│   └── admin/__tests__/AdminChallengeForm.test.tsx
├── app/
│   ├── __tests__/layout.test.tsx
│   ├── (tabs)/__tests__/tabs.test.tsx
│   └── auth/__tests__/login.test.tsx
```

### 8.5 Mock Infrastructure

The `jest.setup.js` (645 lines) already provides comprehensive mocks:
- Expo modules (secure-store, image, camera, location)
- React Native (reanimated, gesture-handler, navigation)
- Internal packages (@mirai-app/auth, @mirai-app/orpc)

**Verify and extend as needed during testing.**

### 8.6 Atomic Commits

```
test(native): add background location task tests
test(native): add map location stream hook tests
test(native): add challenge capture hook tests
test(native): add file upload hook tests
test(native): add auth screen - login flow tests
test(native): add trip card component tests
test(native): add admin challenge form tests
```

### 8.7 Verification

```bash
cd apps/native
bun run test:coverage
# Verify: lines >= 70%, functions >= 75%, branches >= 65%

# Run specific test suites
bun jest src/services/background/__tests__
bun jest src/hooks/challenges/__tests__
```

---

## Parallel Execution Strategy

### Team Structure

**Week 1-2: Infrastructure + Critical Packages**
- Team Lead: Phase 0 infrastructure setup
- Dev 1-2: Phase 1 (auth) + Phase 2 (supabase)
- Dev 3-4: Phase 3 (shared) + Phase 4 (backend-server)

**Week 3-4: Services + Utilities**
- Dev 1-2: Phase 5 (notification-sender) + Phase 6 (seed)
- Dev 3-4: Begin Phase 7 (trpc) - infrastructure + critical routers
- Dev 5-6: Phase 7 continued - remaining routers

**Week 5-8: Native App + Completion**
- Team splits into feature squads:
  - Squad A: Native critical features (location, maps, challenges)
  - Squad B: Native admin + UI components
  - Squad C: Remaining trpc utilities + integration tests

### Daily Workflow

```bash
# Morning: Pull latest, run tests
bun run test

# During development: TDD cycle
# 1. Write failing test
# 2. Run: bun run test:watch (package-specific)
# 3. Implement minimal code to pass
# 4. Refactor, ensure tests still pass

# Before commit: Verify coverage
bun run test:coverage

# Commit with atomic message
git commit -m "test(auth): add JWT role validation tests"
```

---

## Verification Steps

### Pre-Commit Verification

```bash
# Run all tests
turbo run test

# Generate coverage reports
turbo run test:coverage

# Merge and check overall coverage
bun run coverage:report

# Verify thresholds met
cat coverage/merged/lcov.info | grep -E "(LF|LH|FN|FH|BRF|BRH)"
```

### CI/CD Integration

Create `.github/workflows/coverage.yml`:

```yaml
name: Coverage

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests with coverage
        run: turbo run test:coverage
      
      - name: Merge coverage reports
        run: bun run coverage:report
      
      - name: Check coverage thresholds
        run: |
          LINES=$(cat coverage/merged/lcov.info | grep 'LF:' | awk -F: '{sum1+=$2} END {print sum1}')
          HIT=$(cat coverage/merged/lcov.info | grep 'LH:' | awk -F: '{sum2+=$2} END {print sum2}')
          COVERAGE=$(echo "scale=2; $HIT / $LINES * 100" | bc)
          echo "Line coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage below 80%"
            exit 1
          fi
      
      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/merged/lcov.info
          fail_ci_if_error: true
```

### Package-Level Verification

| Package | Target | Command | Verification |
|---------|--------|---------|--------------|
| auth | 90% | `cd packages/auth && bun run test:coverage` | lines >= 90% |
| supabase | 85% | `cd packages/supabase && bun run test:coverage` | lines >= 85% |
| shared | 80% | `cd packages/shared && bun run test:coverage` | lines >= 80% |
| orpc | 80% | `cd packages/orpc && bun run test:coverage` | lines >= 80% |
| backend-server | 85% | `cd apps/backend-server && bun run test:coverage` | lines >= 85% |
| notification-sender | 80% | `cd apps/notification-sender && bun run test:coverage` | lines >= 80% |
| seed | 60% | `cd apps/seed && bun run test:coverage` | lines >= 60% |
| native | 70% | `cd apps/native && bun run test` | lines >= 70% |

---

## Summary & Timeline

### Total Test Files to Create

| Phase | Package | Current Tests | New Tests | Total |
|-------|---------|---------------|-----------|-------|
| 0 | Infrastructure | - | 2 scripts | - |
| 1 | auth | 1 | 5 | 6 |
| 2 | supabase | 1 | 3 | 4 |
| 3 | shared | 1 | 6 | 7 |
| 4 | backend-server | 1 | 3 | 4 |
| 5 | notification-sender | 1 | 2 | 3 |
| 6 | seed | 1 | 8 | 9 |
| 7 | trpc | 1 | 28 | 29 |
| 8 | native | 1 | 130 | 131 |
| **TOTAL** | **9** | **8** | **~185** | **~193** |

### Timeline Estimate

| Weeks | Work |
|-------|------|
| 1 | Phase 0 (infrastructure) + Phase 1 (auth) begin |
| 2 | Phase 1 complete + Phase 2-3 (supabase, shared) |
| 3 | Phase 4-6 (backend, notifications, seed) |
| 4-6 | Phase 7 (trpc) - critical packages |
| 7-8 | Phase 7 (trpc) - remaining routers |
| 9-12 | Phase 8 (native) - critical features |
| 13-14 | Phase 8 (native) - remaining components |
| 15 | Final verification, coverage reports, documentation |

### Success Criteria

- [ ] All packages meet or exceed target coverage thresholds
- [ ] CI pipeline enforces coverage gates
- [ ] Pre-commit hooks run changed-file tests
- [ ] Merged coverage report generated on each PR
- [ ] No test failures in CI
- [ ] TDD workflow established (test first, then implement)

---

## Appendix: TDD Checklist for Each File

Before marking any file complete, verify:

- [ ] Test file created with `__tests__/filename.test.ts` pattern
- [ ] Tests watched to fail before implementation (RED phase)
- [ ] Minimal implementation added to make tests pass (GREEN phase)
- [ ] Refactoring done while tests remain green (REFACTOR phase)
- [ ] Edge cases covered (null inputs, errors, boundary conditions)
- [ ] Mock external dependencies (DB, API, storage)
- [ ] Coverage report shows 100% of new code covered
- [ ] Atomic commit with conventional message format
- [ ] No test failures when running full suite

---

## Appendix: Emergency Procedures

### If Coverage Drops Below Threshold

1. Identify uncovered lines: `npx vitest run --coverage --reporter=verbose`
2. Prioritize uncovered critical paths
3. Write characterization tests for legacy code
4. Mark unreachable code with `/* istanbul ignore next */` (with justification)

### If Tests Are Flaky

1. Add `beforeEach` cleanup to reset state
2. Mock timers: `jest.useFakeTimers()` / `vi.useFakeTimers()`
3. Increase timeout for async tests: `it('...', async () => {}, 10000)`
4. Isolate tests - avoid shared state between test files

### If Test Execution Is Slow

1. Use `test:changed` to run only affected tests
2. Parallelize with Turborepo: `turbo run test --concurrency=4`
3. Mock heavy dependencies (database, external APIs)
4. Use in-memory SQLite for database tests

---

*Plan created for MIRAI Monorepo - 80%+ Code Coverage Initiative*
*Total estimated effort: 4-6 weeks with 6-8 developers*
*Last updated: 2026-01-*
