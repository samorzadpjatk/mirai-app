# MIRAI Monorepo Testability Redesign Plan

> **Scope**: Monorepo redesign for TDD-first workflow  
> **Target**: Reduce total source + test LOC while increasing meaningful coverage  
> **Architecture**: Functional Core, Imperative Shell + Manual Dependency Injection  
> **Test Pyramid**: 70% unit (pure functions) / 20% integration (real SQLite + Hono testClient) / 10% E2E (critical journeys)
> **Status**: Oracle-validated. Scope reduced by ~60% from original draft.

---

## 1. Current State Assessment

### 1.1 Scale
| Metric | Count |
|--------|-------|
| Total source files (.ts, .tsx, .js, .jsx) | 903 |
| Non-test source files | 566 |
| Test files (*.test.*) | 352 |
| package.json files | 11 |
| Test config files (vitest/jest) | 9 |

### 1.2 Testing Infrastructure
| Package/App | Runner | Env | Coverage | Key Patterns |
|-------------|--------|-----|----------|--------------|
| native | Jest 29 | jsdom (jest-expo) | 80% thresholds | React Native Testing Library, heavy native module mocking |
| orpc | Vitest 3 | jsdom | 78-80% thresholds | Unit + integration split. 858-line mock setup |
| shared | Vitest 3 | node | 80% thresholds | Pure function tests with real data |
| db | Vitest 3 | node | 80% thresholds | Integration-only, minimal tests |
| supabase | Vitest 3 | jsdom | 80% thresholds | @testing-library/react |
| auth | Vitest 3 | node | 80% thresholds | Mocked Supabase + DB + React + Zustand |
| backend-server | Vitest 3 | node | 80% thresholds | Server smoke tests |
| notification-sender | Vitest 3 | node | 80% thresholds | Worker logic tests |
| seed | Vitest 3 | node | 80% thresholds | Seed logic validation |

### 1.3 Critical Gaps

**Business Logic Mixed with Data Access**: oRPC router mutations interleave `context.db.insert/update/delete/transaction` with `context.supabase.auth.admin` calls and business rules in 174-508 line functions. The fix is pure function extraction, not another abstraction layer.

**Native Hooks Tightly Coupled**: Native hooks directly import `orpc` client and call `useInfiniteQuery(orpc.trip.getAll.infiniteOptions(...))`. No seam between hook and API.

**Background Task Untestable**: `backgroundLocationTask.ts` creates `supabaseClient` and `getORPCClient` at module level using hard-coded env vars.

**QueryProvider is God Component**: Manages React Query client, oRPC client, WebSocket lifecycle, auth token sync, unauthorized error handling, and session refresh in one 190-line React component.

**Transaction Testing Gap**: `$transaction` mock in router tests is a pass-through with no rollback/atomicity testing.

**Mock Code Bloat**: `packages/orpc/vitest.setup.ts` is 858 lines. `apps/native/jest.setup.js` is 146 lines. 13 `__mocks__/` files in native app.

**Missing Integration Strategy**: No real database integration tests. No WebSocket testing. No Expo Router navigation testing. No Zustand store testing strategy.

---

## 2. Oracle Validation & Scope Decisions

The original plan proposed adding ~2,700 lines of new abstraction infrastructure (repository interfaces, Drizzle implementations, service classes, platform adapters, fake repositories). The Oracle validated the architectural philosophy but rejected the over-abstraction.

### What We Skip (60% Scope Reduction)

| Original Proposal | Oracle Verdict | Rationale |
|---|---|---|
| Repository interfaces (Drizzle IS the repository) | **Skip** | Drizzle ORM is already a thin, query-builder-style data access layer. Adding another abstraction means maintaining interfaces that 1:1 mirror Drizzle's API. |
| Drizzle repository implementations | **Skip** | Drizzle IS the implementation. Extract pure functions instead of wrapping Drizzle. |
| Service layer in `packages/orpc/src/services/` | **Partial** | Extract pure functions to `packages/shared/src/core/`, not service classes. Services add indirection with no value. |
| Native API service layer (`TripApiService`) | **Skip** | oRPC client IS the API layer. Adding thin wrappers creates indirection with zero value. |
| Platform adapters for simple APIs (Storage, Location, Notification) | **Partial** | Only refactor the background task (genuinely untestable). Simple stores keep direct API calls. `AsyncStorage.getItem()` is already an adapter. |
| `MockTransactionDB` | **Skip** | It's still a mock. Use real SQLite (`bun:sqlite`) with actual `BEGIN...ROLLBACK` instead. |
| DI container (tsyringe, inversify) | **Skip** | Manual constructor injection is explicit, type-safe, zero-overhead. No learning curve for new contributors. |
| 15-session big-bang rewrite | **No** | Incremental, router-by-router, main branch always green. 15 weeks, not 15 sessions. |
| Jest → Vitest migration | **No** | `jest-expo` is the Expo community standard. No Vitest equivalent. Keep the split. |

### What We Keep

- **Functional Core, Imperative Shell**: Extract pure business logic to `packages/shared/src/core/`. This is the highest-value change.
- **Manual Dependency Injection**: Pass dependencies via constructor/function parameters. No singletons in business logic.
- **Fake over Mock**: For backend integration tests, use real SQLite. For frontend, use MSW or a test server.
- **Test Data Factories**: `@faker-js/faker` based type-safe factories.
- **QueryProvider Decomposition**: Split the god component into focused pieces.
- **Background Task Decoupling**: Pass dependencies instead of module-level creation.

---

## 3. Target Architecture

### 3.1 Design Principles

1. **Functional Core, Imperative Shell**: Extract pure business logic to `packages/shared/src/core/`. Hooks, routers, and components become thin shells.
2. **Manual Dependency Injection**: Pass dependencies as parameters. No singleton imports inside business logic.
3. **Real Data Tests**: Test with real data, not mock verification. Test output/behavior, not implementation.
4. **Real SQLite for Integration**: Use `bun:sqlite` for integration tests that need real database semantics.
5. **MSW for Native**: Use Mock Service Worker for frontend API testing. Don't create fake service layers.

### 3.2 Target Directory Structure

```
packages/shared/
├── src/
│   ├── core/              # Pure functions (no side effects)
│   │   ├── buildTripQueryInput.ts
│   │   ├── calculateRewardProgress.ts
│   │   └── validateChallengeSubmission.ts
│   └── factories/         # Test data factories
│       ├── user.factory.ts
│       ├── trip.factory.ts
│       └── index.ts

packages/orpc/
├── src/
│   └── api/
│       └── routers/       # Thin shells: validate → call pure function → return
│           ├── user-router.ts
│           ├── trip-router.ts
│           └── challenge-router.ts

apps/native/
├── src/
│   ├── hooks/             # Thin shells: call pure functions + orpc client
│   │   ├── useTripScore.ts
│   │   └── useUserProfile.ts
│   └── services/background/
│       └── backgroundLocationTask.ts  # Accepts dependencies, no module-level clients
```

---

## 4. Redesign Phases (15 Weeks, Incremental)

### Phase A: Pure Function Extraction (Weeks 1-2)
**Goal**: Extract pure business logic from hooks and routers. Zero risk, immediate value.
**Expected LOC change**: -300 test lines.

#### Action A.1: Identify Extraction Candidates
**Where**: `apps/native/src/hooks/`, `packages/orpc/src/api/routers/`
**What**: Search for 30-60 line blocks of logic inside hooks/router mutations that:
- Transform data (filter, map, reduce, calculate)
- Validate input (schema checks, business rule validation)
- Build query parameters or request objects
- Have no side effects (no `fetch`, no `db.insert`, no `Alert.alert`)

**Candidates** (already identified in codebase):
- `buildTripQueryInput` (already extracted) → move to `packages/shared/src/core/`
- `calculateAllTrips` (already extracted) → move to `packages/shared/src/core/`
- `getNextTripPageParam` (already extracted) → move to `packages/shared/src/core/`
- `filterActivities` (already in shared) → add more tests
- `flattenTrips` (already in shared) → add more tests
- `calculateLeaderboardInfo` (already in shared) → add more tests
- `mapChallengeToListItem` (already in shared) → add more tests

**New extractions needed**:
- `buildNotificationQueryInput` from `useNotifications`
- `buildGroupQueryInput` from `useGroups`
- `buildLocationQueryInput` from `useLocations`
- `calculateRewardProgress` from `useRewards`
- `buildChallengeFilter` from `useChallenges`
- `validateUserRegistration` from `user/mutations.ts`
- `calculateTripScore` from `trip/mutations.ts`
- `buildNotificationSchedule` from `notificationSchedule/mutations.ts`

**Pattern**:
```typescript
// Before: inline in hook
export function useTrips() {
  const { data } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const params = {
        status: 'active',
        page: 1,
        limit: 20,
        sortBy: 'startDate',
        order: 'desc' as const,
      };
      // ... more logic
      return orpc.trip.getAll.query(params);
    },
  });
}

// After: extracted pure function
// packages/shared/src/core/buildTripQueryInput.ts
export function buildTripQueryInput(options: {
  status?: 'active' | 'draft' | 'completed';
  page?: number;
  limit?: number;
  sortBy?: 'startDate' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}): TripQueryInput {
  return {
    status: options.status ?? 'active',
    page: Math.max(1, options.page ?? 1),
    limit: Math.min(100, Math.max(1, options.limit ?? 20)),
    sortBy: options.sortBy ?? 'startDate',
    order: options.order ?? 'desc',
  };
}

// Hook becomes thin shell
export function useTrips(options: TripQueryOptions) {
  const input = useMemo(() => buildTripQueryInput(options), [options]);
  return useQuery({
    queryKey: ['trips', input],
    queryFn: () => orpc.trip.getAll.query(input),
  });
}
```

**Test pattern**:
```typescript
// packages/shared/src/core/__tests__/buildTripQueryInput.test.ts
import { describe, it, expect } from 'vitest';
import { buildTripQueryInput } from '../buildTripQueryInput';

describe('buildTripQueryInput', () => {
  it('uses defaults when no options provided', () => {
    const result = buildTripQueryInput({});
    expect(result).toEqual({
      status: 'active',
      page: 1,
      limit: 20,
      sortBy: 'startDate',
      order: 'desc',
    });
  });

  it('caps limit at 100', () => {
    const result = buildTripQueryInput({ limit: 500 });
    expect(result.limit).toBe(100);
  });

  it('enforces minimum page of 1', () => {
    const result = buildTripQueryInput({ page: 0 });
    expect(result.page).toBe(1);
  });
});
```

**Per-extraction**:
1. Identify 30-60 lines of domain logic inside hook/router
2. Extract to `packages/shared/src/core/`
3. Write real-data unit tests (no mocks, no framework)
4. Refactor hook/router to thin shell
5. Delete or shrink original mock-verification test

**Deliverable**: 8-10 new pure function files + 8-10 test files. Delete 8-10 mock-heavy tests.

---

### Phase B: Test Infrastructure Cleanup (Weeks 2-3)
**Goal**: Deduplicate mock factories, create shared config, unify console suppression.
**Expected LOC change**: -558 lines.

#### Action B.1: Deduplicate Mock Factories
**Where**: `packages/shared/src/test-utils/`
**What**: Move `createMockSupabaseClient`, `createMockDb`, `createMockContext` from `packages/orpc/vitest.setup.ts` into shared test utilities.
**Why**: `orpc` has its own mock factories that overlap with `shared`'s `mock-factories.ts`.
**Expected change**: Delete duplicate factories from orpc setup. Import from shared.

#### Action B.2: Create Shared Test Config
**Where**: `packages/shared/vitest.shared.config.ts`
**What**: Base Vitest config that all packages extend.
**Why**: Currently each package has its own `vitest.config.ts` with duplicated settings.
**Pattern**:
```typescript
import { defineConfig } from 'vitest/config';

export const sharedVitestConfig = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

#### Action B.3: Unify Console Suppression
**Where**: `packages/shared/testing/setup.ts`
**What**: Single setup file that suppresses expected console warnings across all packages.
**Why**: Currently each package has its own console suppression. Native app suppresses 20+ patterns.
**Pattern**:
```typescript
export function setupConsoleSuppression(patterns: RegExp[]): void {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: unknown[]) => {
    const message = args[0]?.toString() ?? '';
    if (patterns.some(p => p.test(message))) return;
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() ?? '';
    if (patterns.some(p => p.test(message))) return;
    originalError.apply(console, args);
  };
}
```

**Deliverable**: `vitest.setup.ts` shrinks from 858 to ~300 lines. `jest.setup.js` shrinks from 146 to ~100 lines.

---

### Phase C: Pilot Router (Weeks 3-4)
**Goal**: Prove the testing pattern on the simplest router before scaling.
**Expected LOC change**: -200 test lines.

#### Action C.1: Pick Pilot Router
**Which**: Pick the SIMPLEST router — `coin` or `sponsor` (small, few dependencies, minimal business logic).
**Why**: Proving the pattern on a simple router reduces risk before touching complex routers like `user` (508-line mutations).

#### Action C.2: Extract Pure Functions from Pilot Router
**Where**: `packages/orpc/src/api/routers/{coin|sponsor}/`
**What**: Extract all pure logic (validation, calculations, data transformations) to `packages/shared/src/core/`.
**Why**: Even simple routers have validation and transformation logic that can be pure.

#### Action C.3: Add Real SQLite Transaction Test
**Where**: `packages/orpc/src/api/routers/{coin|sponsor}/__tests__/`
**What**: Use `bun:sqlite` to test actual transaction rollback.
**Why**: Oracle rejected `MockTransactionDB` — it's still a mock. Real SQLite catches actual database semantics.
**Pattern**:
```typescript
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

describe('coin router transactions', () => {
  let db: Database;
  let drizzleDb: ReturnType<typeof drizzle>;

  beforeEach(() => {
    db = new Database(':memory:');
    drizzleDb = drizzle(db);
    // Push schema to SQLite
    // ...
  });

  afterEach(() => {
    db.close();
  });

  it('rolls back on failure', async () => {
    await expect(
      drizzleDb.transaction(async (tx) => {
        await tx.insert(coins).values({ userId: '1', amount: 100 });
        await tx.insert(coins).values({ userId: '2', amount: 200 });
        throw new Error('Simulated failure');
      })
    ).rejects.toThrow('Simulated failure');

    const result = await drizzleDb.select().from(coins);
    expect(result).toHaveLength(0); // All rolled back
  });
});
```

#### Action C.4: Rewrite Mock-Heavy Tests with Real Data
**Where**: `packages/orpc/src/api/routers/{coin|sponsor}/__tests__/`
**What**: Delete tests that verify `vi.fn()` calls. Write tests that verify behavior with real data.
**Why**: Prove the pattern works end-to-end before scaling to other routers.

**Before (mock-heavy)**:
```typescript
it('creates coin', async () => {
  const mock = vi.fn().mockResolvedValue({ id: '1', userId: '1', amount: 100 });
  vi.mocked(db.insert).mockReturnValue({ returning: mock });
  const result = await caller.coin.create({ userId: '1', amount: 100 });
  expect(mock).toHaveBeenCalledTimes(1);
  expect(result.amount).toBe(100);
});
```

**After (real data)**:
```typescript
it('creates coin', async () => {
  const result = await caller.coin.create({ userId: '1', amount: 100 });
  expect(result.amount).toBe(100);
  const stored = await drizzleDb.select().from(coins).where(eq(coins.id, result.id));
  expect(stored[0].amount).toBe(100);
});
```

**Deliverable**: 1 fully-refactored router with real SQLite tests + pure function tests. Coverage for this router should be 80%+.

---

### Phase D: Background Task Decoupling (Week 4)
**Goal**: Make `backgroundLocationTask.ts` testable.
**Expected LOC change**: +20 source lines, +50 test lines.

#### Action D.1: Extract Dependencies from Module Scope
**Where**: `apps/native/src/services/background/backgroundLocationTask.ts`
**What**: Move `supabaseClient` and `getORPCClient` creation out of module scope. Pass as dependencies.
**Why**: Currently creates clients at module level with hard-coded env vars. Untestable.
**Pattern**:
```typescript
// Before
const supabaseClient = createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const orpcClient = getORPCClient(process.env.API_URL!);

TaskManager.defineTask(LOCATION_TASK_NAME, async (taskData) => {
  // Use supabaseClient and orpcClient directly
});

// After
export interface BackgroundLocationDeps {
  supabaseClient: SupabaseClient;
  orpcClient: ORPCClient;
}

export function createBackgroundLocationTask(deps: BackgroundLocationDeps) {
  return async (taskData: TaskManager.TaskManagerTaskBody) => {
    // Use deps.supabaseClient and deps.orpcClient
  };
}

export function initBackgroundLocationTask(deps: BackgroundLocationDeps) {
  TaskManager.defineTask(LOCATION_TASK_NAME, createBackgroundLocationTask(deps));
  return Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    deferredUpdatesInterval: 60000,
  });
}
```

#### Action D.2: Write Tests with Fake Dependencies
**Where**: `apps/native/src/services/background/__tests__/`
**What**: Create fake Supabase and oRPC clients for testing.
**Why**: Test the background task logic without mocking native modules.
**Pattern**:
```typescript
describe('backgroundLocationTask', () => {
  it('sends location update to server', async () => {
    const fakeSupabase = createFakeSupabaseClient();
    const fakeORPC = createFakeORPCClient();
    const task = createBackgroundLocationTask({
      supabaseClient: fakeSupabase,
      orpcClient: fakeORPC,
    });

    await task({
      data: { locations: [{ latitude: 52.2297, longitude: 21.0122 }] },
    });

    expect(fakeORPC.calls).toContainEqual(
      expect.objectContaining({
        procedure: 'location.create',
        input: expect.objectContaining({ latitude: 52.2297 }),
      })
    );
  });
});
```

**Deliverable**: `backgroundLocationTask.ts` fully testable. 3-5 test cases covering success, error, and retry paths.

---

### Phase E: Incremental Router-by-Router (Weeks 5-12)
**Goal**: Apply the proven pilot pattern to all 19 routers, one at a time.
**Expected LOC change**: -4,000 test lines.

#### Action E.1: Apply Pilot Pattern to Each Router
**Where**: `packages/orpc/src/api/routers/*/`
**What**: For each router:
1. Extract pure functions to `packages/shared/src/core/`
2. Write real-data tests for pure functions
3. Add real SQLite transaction tests for mutations using `$transaction`
4. Rewrite mock-heavy tests to verify behavior, not implementation
5. Move to next router

**Why**: Incremental approach keeps main branch green. Never convert all routers simultaneously.

**Order**: Simplest to most complex:
1. `coin` (already done in pilot)
2. `sponsor`
3. `challengeVote`
4. `submissionReport`
5. `challengeSubmission`
6. `reward`
7. `location`
8. `group`
9. `challenge`
10. `storage`
11. `notificationDelivery`
12. `notificationSchedule`
13. `notificationSender`
14. `coinTransaction`
15. `activityFeed`
16. `trip`
17. `user`
18. `notifications` (most complex)

**Per-router verification**:
- `lsp_diagnostics` clean
- `nx run @mirai-app/orpc:test` passes
- Coverage for this router meets 80% threshold
- All tests verify behavior, not mock calls

**Deliverable**: All 19 routers refactored. Coverage per router: 80%+.

---

### Phase F: QueryProvider Decomposition (Week 13)
**Goal**: Split god component into focused, testable pieces.
**Expected LOC change**: -50 lines.

#### Action F.1: Extract Query Client Factory
**Where**: `packages/orpc/src/client/query-client-factory.ts`
**What**: Pure function that creates React Query client with default options.
**Why**: Currently created inside QueryProvider. Extracting makes it testable.
**Pattern**:
```typescript
export function createQueryClient(options?: QueryClientOptions): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: false,
      },
      ...options,
    },
  });
}
```

#### Action F.2: Extract Auth Token Provider
**Where**: `packages/orpc/src/client/auth-token-provider.tsx`
**What**: React component that watches auth state and syncs token to query client.
**Why**: Currently mixed with WebSocket and error handling in QueryProvider.
**Pattern**:
```typescript
export function AuthTokenProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  const { session } = useAuth();
  useEffect(() => {
    if (session?.access_token) {
      queryClient.setDefaultOptions({
        queries: { meta: { headers: { Authorization: `Bearer ${session.access_token}` } } },
      });
    }
  }, [session, queryClient]);
  return <>{children}</>;
}
```

#### Action F.3: Extract WebSocket Lifecycle Hook
**Where**: `packages/orpc/src/client/use-websocket.ts`
**What**: Custom hook that manages oRPC WebSocket connection lifecycle.
**Why**: Currently inside QueryProvider. Extracting makes it independently testable.
**Pattern**:
```typescript
export function useWebSocket({ url, enabled }: { url: string; enabled: boolean }) {
  const [client, setClient] = useState<ORPCWebSocketClient | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const ws = new ORPCWebSocketClient(url);
    setClient(ws);
    return () => ws.close();
  }, [url, enabled]);
  return client;
}
```

#### Action F.4: Extract Unauthorized Error Handler
**Where**: `packages/orpc/src/client/use-unauthorized-handler.ts`
**What**: Custom hook that watches for 401 errors and triggers sign-out.
**Why**: Currently inside QueryProvider. Extracting makes it independently testable.
**Pattern**:
```typescript
export function useUnauthorizedHandler({ queryClient, onUnauthorized }: { queryClient: QueryClient; onUnauthorized: () => void }) {
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.state.error?.status === 401) {
        onUnauthorized();
      }
    });
    return () => unsubscribe();
  }, [queryClient, onUnauthorized]);
}
```

#### Action F.5: Rewrite QueryProvider as Composition
**Where**: `packages/orpc/src/client/query-client.tsx`
**What**: Thin component that composes the extracted pieces.
**Why**: Original is 190 lines. New version is ~50 lines.
**Pattern**:
```typescript
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => createQueryClient(), []);
  const wsClient = useWebSocket({ url: WS_URL, enabled: true });
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthTokenProvider queryClient={queryClient}>
        <UnauthorizedHandler queryClient={queryClient} onUnauthorized={signOut}>
          <ORPCWebSocketProvider client={wsClient}>
            {children}
          </ORPCWebSocketProvider>
        </UnauthorizedHandler>
      </AuthTokenProvider>
    </QueryClientProvider>
  );
}
```

**Deliverable**: 4 new focused files + tests. QueryProvider shrinks from 190 to ~50 lines.

---

### Phase G: Native Hook Cleanup (Weeks 14-15)
**Goal**: Refactor hook tests to use MSW, replace `vi.mock()` of internal modules.
**Expected LOC change**: -300 test lines.

#### Action G.1: Set Up MSW for Native Tests
**Where**: `apps/native/src/test-utils/msw/`
**What**: Configure MSW to intercept oRPC HTTP requests and return fake responses.
**Why**: Native app should test against the real oRPC client, not fake service layers.
**Pattern**:
```typescript
import { setupServer } from 'msw/native';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/trip', () => {
    return HttpResponse.json([
      { id: '1', name: 'Trip 1' },
      { id: '2', name: 'Trip 2' },
    ]);
  }),
);

// In jest.setup.js
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Action G.2: Replace Hook Mock Tests with MSW Tests
**Where**: `apps/native/src/hooks/__tests__/`
**What**: Delete `vi.mock()` of internal modules. Write tests that use real oRPC client against MSW.
**Why**: Testing against the real client stack (serialization, error handling, caching) is more meaningful than mocking internal modules.

**Before**:
```typescript
it('returns trips', async () => {
  vi.mocked(orpc.trip.getAll.query).mockResolvedValue([
    { id: '1', name: 'Trip 1' },
  ]);
  const { result } = renderHook(() => useTrips());
  expect(result.current.data).toHaveLength(1);
});
```

**After**:
```typescript
it('returns trips', async () => {
  server.use(
    http.get('/api/trip', () => {
      return HttpResponse.json([
        { id: '1', name: 'Trip 1' },
        { id: '2', name: 'Trip 2' },
      ]);
    }),
  );
  
  const { result } = renderHook(() => useTrips());
  await waitFor(() => expect(result.current.data).toHaveLength(2));
});
```

#### Action G.3: Replace Component Mock Tests with Behavior Tests
**Where**: `apps/native/src/components/__tests__/`
**What**: Delete tests that verify mock presence. Write tests that verify user-visible behavior.
**Why**: Current component tests often assert `expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument()`.

**Before**:
```typescript
it('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**After**:
```typescript
it('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

#### Action G.4: Add testID Where Needed
**Where**: `apps/native/src/components/`
**What**: Add `testID` props to components that don't have semantic accessibility handles.
**Why**: React Native Testing Library's `getByTestId` is a fallback when `getByRole`/`getByLabelText` don't work.

**Deliverable**: 60-80% of native hook tests rewritten with MSW. Component tests verify behavior, not mocks.

---

## 5. Critical Gaps Addressed

### 5.1 Database Integration Testing
**What**: Use `bun:sqlite` for real database integration tests.
**Why**: Fakes are great for unit tests, but you also need integration tests that hit a real database to catch schema mismatches, migration issues, and query performance problems.
**Pattern**: See Phase C.3.

### 5.2 Zustand Store Testing
**What**: Test Zustand stores with injected dependencies.
**Why**: `locationStore.ts` (243 lines) is a complex Zustand store with async actions. The plan needs a specific testing pattern.
**Pattern**:
```typescript
// Extract store creation to a factory
export function createLocationStore(deps: {
  storage: { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
  location: { requestPermissions: () => Promise<boolean> };
}) {
  return createStore<LocationState>((set, get) => ({
    // ... state
    toggleSharing: async () => {
      const hasPermission = await deps.location.requestPermissions();
      // ... logic
    },
  }));
}

// Test with fake deps
const fakeStorage = { getItem: vi.fn(), setItem: vi.fn() };
const fakeLocation = { requestPermissions: vi.fn().mockResolvedValue(true) };
const store = createLocationStore({ storage: fakeStorage, location: fakeLocation });
// Test store actions
```

### 5.3 Expo Router Navigation Testing
**What**: Add navigation testing for Expo Router.
**Why**: The native app uses Expo Router. The plan needs to address how to test navigation flows.
**Approach**: Use `@testing-library/react-native` with mocked `expo-router` (already mocked in `jest.setup.js`). Test navigation by asserting on route changes in the mock.

### 5.4 WebSocket Testing
**What**: Add WebSocket connection, auth handshake, and reconnection tests.
**Why**: Backend AGENTS.md explicitly flags minimal WebSocket coverage.
**Pattern**: Test the `useWebSocket` hook (extracted in Phase F) with a fake WebSocket server.

### 5.5 Test Migration Strategy
**What**: Specific plan for rewriting the 2,383-line `user.test.ts` and 858-line `vitest.setup.ts`.
**How**:
1. **Parallel tests**: Keep old tests running while writing new tests. Don't delete old tests until new tests pass.
2. **Incremental rewrite**: Rewrite one describe block at a time, not the whole file.
3. **Coverage ratchet**: Ensure coverage never drops below current level during migration.

---

## 6. Expected Results

### 6.1 LOC Reduction
| Category | Before | After | Change |
|----------|--------|-------|--------|
| Source code (reorganized, not deleted) | 566 files | 566 files | 0 |
| Test files | 352 files | ~280 files | -72 |
| Mock setup code | 1,004 lines (858 + 146) | ~200 lines | **-804** |
| Mock factories (duplicated) | ~400 lines | ~100 lines | -300 |
| Inline fixture objects in tests | ~800 lines | ~200 lines | -600 |
| Test code per behavior (mock-heavy) | ~40 lines | ~10 lines | **-75%** |
| **Total test code** | ~15,000 lines | ~10,000 lines | **-5,000** |
| **Total source + test** | ~35,000 lines | ~30,000 lines | **-5,000** |

### 6.2 Coverage Improvement
| Metric | Before | After |
|--------|--------|-------|
| orpc function coverage | 55% | 80%+ |
| Transaction rollback tests | 0% | 100% of routers using transactions |
| Contract tests | 0% | 100% of router procedures |
| Component behavior tests | 30% | 80%+ |
| Hook pure function coverage | 60% | 90%+ |
| Database integration tests | 0% | 19 routers (1 per router) |

### 6.3 Developer Experience
| Metric | Before | After |
|--------|--------|-------|
| Time to write a new router test | 30 min (mock setup) | 5 min (real data, no mocks) |
| Time to write a new hook test | 20 min (mock native modules) | 5 min (MSW + real client) |
| Test flakiness | High (mock timing) | Low (deterministic real data) |
| Test run time (full suite) | 5 min | 3 min (fewer tests, faster pure functions) |
| Debugging test failures | Hard (mock call chains) | Easy (real data, clear errors) |

---

## 7. Week-by-Week Execution Roadmap

### Week 1: Pure Function Extraction (Part 1) ✅
- **Adapted from plan**: `buildNotificationQueryInput` and `buildLocationQueryInput` don't exist in codebase
- **Actual extraction**: `buildGroupQueryInput`, `getNextGroupPageParam`, `buildTripQueryInput`, `getNextTripPageParam`, `calculateAllTrips`, `buildChallengeQueryInput`, `getNextChallengePageParam`
- **Location**: `packages/shared/src/{groups,trips,challenges}/queryBuilders.ts` (domain directories, not `core/` — follows existing convention)
- **Tests**: 27 real-data Vitest tests written (9 + 11 + 7)
- **Hooks refactored**: `useGroups`, `useTrips`, `useChallenges` — all import from `@mirai-app/shared`
- **Bonus**: Eliminated `DBChallenge` duplication in `useChallenges.ts`
- **Verify**: `nx run @mirai-app/shared:test` ✅ 251/251 passed, `nx run @mirai-app/native:test` ✅ 225/225 passed

### Week 2: Pure Function Extraction (Part 2) + Infrastructure Cleanup
- Extract `calculateRewardProgress`, `buildChallengeFilter`, `validateUserRegistration` to `packages/shared/src/core/`
- Write real-data tests
- Deduplicate mock factories into `packages/shared/test-utils/`
- Create shared Vitest config
- Verify: `nx run @mirai-app/shared:test`, `nx run @mirai-app/orpc:test`

### Week 3: Pilot Router (Part 1)
- Pick simplest router (`coin` or `sponsor`)
- Extract pure functions from router
- Add real SQLite transaction test
- Verify: `nx run @mirai-app/orpc:test`

### Week 4: Pilot Router (Part 2) + Background Task
- Complete pilot router refactoring
- Refactor `backgroundLocationTask.ts` to accept dependencies
- Write tests for `backgroundLocationTask` with fake deps
- Verify: `nx run @mirai-app/orpc:test`, `nx run @mirai-app/native:test`

### Week 5: Router-by-Router (Batch 1)
- Apply pilot pattern to `sponsor`, `challengeVote`, `submissionReport`
- Extract pure functions + add SQLite tests
- Verify: `nx run @mirai-app/orpc:test`

### Week 6: Router-by-Router (Batch 2)
- Apply to `challengeSubmission`, `reward`, `location`
- Verify: `nx run @mirai-app/orpc:test`

### Week 7: Router-by-Router (Batch 3)
- Apply to `group`, `challenge`, `storage`
- Verify: `nx run @mirai-app/orpc:test`

### Week 8: Router-by-Router (Batch 4)
- Apply to `notificationDelivery`, `notificationSchedule`, `notificationSender`
- Verify: `nx run @mirai-app/orpc:test`

### Week 9: Router-by-Router (Batch 5)
- Apply to `coinTransaction`, `activityFeed`, `trip`
- Verify: `nx run @mirai-app/orpc:test`

### Week 10: Router-by-Router (Batch 6)
- Apply to `user` (most complex, 508-line mutations)
- Apply to `notifications` (most complex)
- Verify: `nx run @mirai-app/orpc:test`

### Week 11: Simplify vitest.setup.ts
- Reduce `packages/orpc/vitest.setup.ts` from 858 to <200 lines
- Delete `createMockDb()`, `createMockContext()`, manual mock construction
- Verify: `nx run @mirai-app/orpc:test`

### Week 12: QueryProvider Decomposition
- Extract `query-client-factory.ts`, `auth-token-provider.tsx`, `use-websocket.ts`, `use-unauthorized-handler.ts`
- Rewrite `query-client.tsx` as composition
- Write tests for each extracted piece
- Verify: `nx run @mirai-app/orpc:test`

### Week 13: MSW Setup for Native
- Configure MSW for native tests
- Rewrite 5-10 hook tests with MSW
- Verify: `nx run @mirai-app/native:test`

### Week 14: Native Hook + Component Tests
- Rewrite remaining hook tests with MSW
- Replace component mock tests with behavior tests
- Add `testID` where needed
- Verify: `nx run @mirai-app/native:test`

### Week 15: Cleanup & Documentation
- Delete dead code (unused imports, unreachable code, redundant tests)
- Update `docs/conventions/testing.md` with new patterns
- Update per-package `AGENTS.md` files
- Run full test suite: `nx run-many -t test`
- Verify coverage thresholds

---

## 8. Verification Checklist

### Per-Week
- [ ] `lsp_diagnostics` clean on all changed files
- [ ] Tests pass for affected packages
- [ ] Coverage thresholds met (or exceeded)
- [ ] No new `console.log` in production code
- [ ] No `as any` or `@ts-ignore` added
- [ ] Dead code removed (no unused imports/variables)
- [ ] Documentation updated if conventions changed

### Per-Phase
- [ ] Phase A: 8-10 pure functions extracted + tested
- [ ] Phase B: Mock setup reduced by >300 lines
- [ ] Phase C: 1 pilot router fully refactored with SQLite tests
- [ ] Phase D: `backgroundLocationTask.ts` fully testable
- [ ] Phase E: All 19 routers refactored (incrementally, one per week)
- [ ] Phase F: QueryProvider decomposed into 4 focused files
- [ ] Phase G: 60-80% of native hook tests use MSW

### After Full Redesign
- [ ] All 352 original tests either pass or have been intentionally replaced with better tests
- [ ] `nx run-many -t test` passes from root
- [ ] `nx run-many -t lint` passes from root
- [ ] `nx run-many -t typecheck` passes from root
- [ ] Coverage report shows improvement in all packages
- [ ] `docs/conventions/testing.md` reflects new architecture
- [ ] New developer can write a test in <5 minutes without reading mock setup docs

---

## 9. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | What We Do Instead |
|--------------|-------------|-------------------|
| Mock-verification tests | Tests implementation, not behavior | Test output/return values with real data |
| Testing React Query's `isLoading` | Tests framework plumbing | Test what user sees with real data |
| Singleton imports in business logic | Hard to test, tight coupling | Dependency injection via parameters |
| `vi.mock()` of internal modules | Brittle, breaks on refactor | Extract pure functions or use MSW |
| Shared fixtures between tests | Flaky, order-dependent | Factories + fresh data per test |
| Mocking entire hooks | Least representability | Use MSW for network, real data for logic |
| Transaction pass-through mocks | Never tests rollback | Use real SQLite with `BEGIN...ROLLBACK` |
| `as any` or `@ts-ignore` | Hides real bugs | Fix the type or redesign the interface |
| Repository layer over Drizzle | Redundant abstraction | Let Drizzle be the repository |
| Service layer over oRPC client | Redundant abstraction | oRPC client IS the service layer |
| Platform adapters for simple APIs | Boilerplate | `AsyncStorage.getItem()` IS the adapter |

---

## 10. References

- [Test-Driven Development — Designing for Testability (Wikipedia)](https://en.wikipedia.org/wiki/Test-driven_development#Designing_for_testability)
- [Test Pyramid — Pure Functions Extract Conditionals (Assrt)](https://assrt.ai/t/test-pyramid-pure-functions-extract-conditionals-reduce-e2e)
- [Shared Fakes Across a Monorepo (recca0120)](https://recca0120.github.io/en/2026/04/20/monorepo-shared-fake-testing/)
- [Dependency Injection in Node.js & TypeScript (The T-Shaped Dev)](https://thetshaped.dev/p/dependency-injection-in-nodejs-and-typescript-dependency-inversion-part-no-body-teaches-you)
- [TypeScript Testing Patterns: Type-Safe Testing (QASkills.sh)](https://qaskills.sh/blog/typescript-testing-patterns-guide)
- [Testing Architecture for TypeScript Backends (Let's Build Solutions)](https://letsbuildsolutions.com/blog/web-engineering/testing-architecture-for-typescript-backends-unit-tests-integration-tests-and-a-testing-strategy-that-actually-scales/)
- [Testing at Scale — Enterprise UI (Steve Kinney)](https://stevekinney.com/courses/enterprise-ui/testing-at-scale)
- [Hexagonal Architecture with TypeScript (pmerrill)](https://github.com/pmerrill/TypeScript-Hexagonal-Architecture)
- [MIRAI AGENTS.md — Testing Standards](../AGENTS.md)
- [MIRAI Testing Conventions](./conventions/testing.md)
