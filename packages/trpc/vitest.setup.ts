import { vi } from "vitest";
import type {
  MockDbUser,
  MockGetUserFromDb,
  MockSession,
} from "./src/test-utils/mockAuthTypes";

const mockSession: MockSession = {
  user: {
    id: "mock-user-id",
    email: "mock.user@example.com",
    name: "Mock User",
    authUserId: "supabase-mock-user",
    emailVerified: new Date("2023-01-01T00:00:00.000Z"),
  },
  authUserId: "supabase-mock-user",
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
};

const baseDbUser: MockDbUser = {
  id: mockSession.user.id,
  authUserId: mockSession.user.authUserId,
  email: mockSession.user.email,
  name: mockSession.user.name,
  emailVerified: mockSession.user.emailVerified,
  isAdmin: true,
  isModerator: true,
  isServiceAccount: false,
  image: null,
  wristNumber: null,
  houseNumber: null,
  groupId: null,
};

const toDbUser = (overrides?: Partial<MockDbUser>): MockDbUser => {
  const merged = {
    ...baseDbUser,
    ...overrides,
  } as MockDbUser;

  return {
    ...merged,
    authUserId:
      overrides && "authUserId" in overrides
        ? overrides.authUserId ?? null
        : baseDbUser.authUserId,
    emailVerified:
      overrides && "emailVerified" in overrides
        ? overrides.emailVerified ?? null
        : baseDbUser.emailVerified,
  };
};

const resolveDbUser = async (
  getUserFromDb?: MockGetUserFromDb,
): Promise<MockDbUser> => {
  if (!getUserFromDb) {
    return toDbUser();
  }

  const user = await getUserFromDb(mockSession.user.authUserId);
  if (user) {
    return toDbUser(user);
  }

  return toDbUser();
};

// Mock @integral-2025-app/auth
vi.mock("@integral-2025-app/auth", () => {
  const getServerSession = vi.fn().mockResolvedValue(mockSession);

  const requireAuthImpl = async (
    _supabase: unknown,
    getUserFromDb?: MockGetUserFromDb,
    _accessToken?: string,
  ) => {
    const dbUser = await resolveDbUser(getUserFromDb);

    return {
      user: {
        id: dbUser.id,
        authUserId: dbUser.authUserId,
        email: dbUser.email,
        name: dbUser.name,
        emailVerified: dbUser.emailVerified ?? null,
      },
      dbUser,
    };
  };

  const requireAuth = vi.fn(requireAuthImpl);

  const requireModeratorImpl = async (
    _supabase: unknown,
    getUserFromDb?: MockGetUserFromDb,
    _accessToken?: string,
  ) => {
    const { dbUser } = await requireAuth(_supabase, getUserFromDb, _accessToken);

    if (!dbUser.isModerator && !dbUser.isAdmin) {
      throw new Error("Moderator access required");
    }

    return dbUser;
  };

  const requireModerator = vi.fn(requireModeratorImpl);

  const requireAdminImpl = async (
    _supabase: unknown,
    getUserFromDb?: MockGetUserFromDb,
    _accessToken?: string,
  ) => {
    const { dbUser } = await requireAuth(_supabase, getUserFromDb, _accessToken);

    if (!dbUser.isAdmin) {
      throw new Error("Admin access required");
    }

    return dbUser;
  };

  const requireAdmin = vi.fn(requireAdminImpl);

  return {
    getServerSession,
    requireAuth,
    requireModerator,
    requireAdmin,
  };
});

// Mock @integral-2025-app/supabase
vi.mock("@integral-2025-app/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

// Mock @integral-2025-app/db
vi.mock("@integral-2025-app/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    group: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    coinTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    pushSubscription: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    notificationPush: {
      createMany: vi.fn(),
    },
    notificationSchedule: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock web-push
vi.mock("web-push", () => ({
  default: {
    sendNotification: vi.fn(),
    setVapidDetails: vi.fn(),
  },
  WebPushError: class WebPushError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.name = "WebPushError";
    }
  },
}));

// Set default environment variables for testing
process.env.NODE_ENV = "test";
process.env.SKIP_ENV_VALIDATION = "1";
process.env.VAPID_PUBLIC_KEY = "test-public-key";
process.env.VAPID_PRIVATE_KEY = "test-private-key";
process.env.VAPID_EMAIL = "test@example.com";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
