import { vi, mocked as vitestMocked } from "vitest";
import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import type { PrismaClient, User } from "@mirai-app/db";
import type { TRPCContext } from "./src/api/trpc";

// Add mocked as a standalone global for test compatibility
declare global {
  var mocked: typeof vitestMocked;
}
// @ts-expect-error - adding to globalThis for test compatibility
globalThis.mocked = vitestMocked;
// Also assign to window for Node.js environment compatibility
if (typeof global !== 'undefined') {
  // @ts-expect-error - adding to global for test compatibility
  global.mocked = vitestMocked;
}

// Mock @mirai-app/supabase
vi.mock("@mirai-app/supabase", () => {
  const mockSupabaseUser: SupabaseUser = {
    id: "test-auth-user-id",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { firstName: "Test", lastName: "User" },
    app_metadata: { role: "USER" },
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
        listUsers: vi.fn().mockResolvedValue({
          data: { users: [mockSupabaseUser] },
          error: null,
        }),
        createUser: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
        updateUserById: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({
          data: {},
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
  const mockUser: User = {
    id: "test-db-user-id",
    authUserId: "test-auth-user-id",
    email: "test@example.com",
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

  const mockPrismaClient: PrismaClient = {
    user: {
      findFirst: vi.fn().mockResolvedValue(mockUser),
      findUnique: vi.fn().mockResolvedValue(mockUser),
      findMany: vi.fn().mockResolvedValue([mockUser]),
      create: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn().mockResolvedValue(mockUser),
      upsert: vi.fn().mockResolvedValue(mockUser),
      delete: vi.fn().mockResolvedValue(mockUser),
      count: vi.fn().mockResolvedValue(1),
    },
    tripParticipant: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    trip: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    group: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    userAgent: {
      create: vi.fn().mockResolvedValue({}),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
  } as unknown as PrismaClient;

  return {
    createDb: vi.fn(() => mockPrismaClient),
    prisma: mockPrismaClient,
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

// Mock @mirai-app/auth
vi.mock("@mirai-app/auth", () => {
  const mockUser: User = {
    id: "test-db-user-id",
    authUserId: "test-auth-user-id",
    email: "test@example.com",
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

  const mockSupabaseUser: SupabaseUser = {
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

// Mock @mirai-app/shared
vi.mock("@mirai-app/shared", () => {
  return {
    STANDARD_BUCKETS: {
      IMAGES: 'images',
      VIDEOS: 'videos',
      PUBLIC: 'files-public'
    },
    normalizeStoragePath: vi.fn((path: string) => path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')),
    normalizeBucketName: vi.fn((bucket: string) => bucket?.toLowerCase()),
  };
});

// Helper function to create mock tRPC context
export function createMockContext(overrides: Partial<TRPCContext> = {}): TRPCContext {
  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        listUsers: vi.fn().mockResolvedValue({
          data: { users: [] },
          error: null,
        }),
        createUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        updateUserById: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        deleteUser: vi.fn().mockResolvedValue({
          data: {},
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
  } as unknown as SupabaseClient;

  const mockDb = {
    user: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    tripParticipant: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn((callback) => callback(mockDb)),
  } as unknown as PrismaClient;

  return {
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers(),
    accessToken: null,
    ...overrides,
  };
}

// Cleanup mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
