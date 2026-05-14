import { vi } from "vitest";

// Mock @mirai-app/supabase
vi.mock("@mirai-app/supabase", () => {
  const mockSupabaseUser = {
    id: "test-auth-user-id",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { name: "Test User" },
    app_metadata: { role: "user" },
  };

  const mockSupabaseClient = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockSupabaseUser, session: { access_token: "test-token" } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: mockSupabaseUser, session: { access_token: "test-token" } },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  return {
    createClient: vi.fn(() => mockSupabaseClient),
    createBrowserClient: vi.fn(() => mockSupabaseClient),
    createServerClient: vi.fn(() => mockSupabaseClient),
    createMiddlewareClient: vi.fn(() => mockSupabaseClient),
    SupabaseProvider: vi.fn(({ children }: { children: React.ReactNode }) => children),
    useSupabase: vi.fn(() => mockSupabaseClient),
  };
});

// Mock @mirai-app/db
vi.mock("@mirai-app/db", () => {
  const mockUser = {
    id: "test-db-user-id",
    authUserId: "test-auth-user-id",
    email: "test@example.com",
    name: "Test User",
    firstName: "Test",
    lastName: "User",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "USER",
    groupId: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDbClient = {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue(mockUser),
        findMany: vi.fn().mockResolvedValue([mockUser]),
      },
    },
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([mockUser]) })),
    update: vi.fn(() => ({
      set: vi.fn().mockResolvedValue([mockUser]),
      where: vi.fn().mockResolvedValue([mockUser]),
    })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([mockUser]) })),
  };

  return {
    createDb: vi.fn(() => mockDbClient),
    db: mockDbClient,
    users: { __table: "users" },
    User: mockUser,
    Role: ["USER", "ADMIN", "MODERATOR", "SERVICE"],
  };
});

// Mock @mirai-app/shared
vi.mock("@mirai-app/shared", () => {
  const mockAuthStore = {
    getState: vi.fn().mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signInWithOtp: vi.fn(),
      signInWithPassword: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    }),
    setState: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
  };

  return {
    authStore: mockAuthStore,
    AuthStoreProvider: vi.fn(({ children }: { children: React.ReactNode }) => children),
  };
});

// Mock React hooks
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useState: vi.fn((initial: unknown) => [initial, vi.fn()]),
    useEffect: vi.fn((fn: () => void | (() => void)) => {
      fn();
      return undefined;
    }),
    useCallback: vi.fn((fn: unknown) => fn),
    useMemo: vi.fn((fn: () => unknown) => fn()),
    useContext: vi.fn(() => ({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    })),
  };
});

// Mock zustand
vi.mock("zustand", () => ({
  create: vi.fn((initializer: (set: unknown, get: unknown, api: unknown) => unknown) => {
    const store = {
      getState: vi.fn(),
      setState: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      destroy: vi.fn(),
    };
    store.getState.mockReturnValue(initializer(store.setState, store.getState, store));
    return () => store.getState();
  }),
  useStore: vi.fn((store: { getState: () => unknown }) => store.getState()),
}));

// Cleanup mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
