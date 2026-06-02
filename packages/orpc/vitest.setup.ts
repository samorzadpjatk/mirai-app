import { vi } from "vitest";

vi.mock("@mirai-app/supabase", () => {
  const mockSupabaseUser = {
    id: "test-auth-user-id",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { firstName: "Test", lastName: "User" },
    app_metadata: { role: "USER" },
  };

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const mockSupabaseClient = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null }),
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
        listUsers: vi.fn().mockResolvedValue({ data: { users: [mockSupabaseUser] }, error: null }),
        createUser: vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
    from: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  return {
    createClient: vi.fn(() => mockSupabaseClient),
    createBrowserClient: vi.fn(() => mockSupabaseClient),
    createServerClient: vi.fn(() => mockSupabaseClient),
    createMiddlewareClient: vi.fn(() => mockSupabaseClient),
    SupabaseProvider: vi.fn(({ children }: { children: React.ReactNode }) => children),
    useSupabase: vi.fn(() => mockSupabaseClient),
    createSupabaseClient: vi.fn(() => mockSupabaseClient),
  };
});

vi.mock("@mirai-app/auth", () => {
  const mockUser = {
    id: "test-db-user-id",
    authUserId: "test-auth-user-id",
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

  const mockSupabaseUser = {
    id: "test-auth-user-id",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { firstName: "Test", lastName: "User" },
    app_metadata: { role: "USER" },
  };

  return {
    requireAuth: vi.fn().mockResolvedValue({
      user: mockSupabaseUser,
      dbUser: mockUser,
    }),
    requireAdmin: vi.fn().mockResolvedValue({
      ...mockUser,
      role: "ADMIN",
    }),
    requireModerator: vi.fn().mockResolvedValue({
      ...mockUser,
      role: "MODERATOR",
    }),
    AuthenticationError: class AuthenticationError extends Error {
      constructor(message = "Not Authenticated") {
        super(message);
        this.name = "AuthenticationError";
      }
    },
    AuthorizationError: class AuthorizationError extends Error {
      constructor(message = "Missing Required Permissions") {
        super(message);
        this.name = "AuthorizationError";
      }
    },
  };
});

afterEach(() => {
  vi.clearAllMocks();
});
