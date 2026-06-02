import { vi } from "vitest";
import type { TRPCContext } from "./src/api/trpc";
import {
  createMockSupabaseUser,
  createMockDbUser,
  createMockSupabase,
  createMockDb,
} from "@mirai-app/shared/test-utils";

export {
  addDrizzleApi,
  createFailingTransactionMock,
} from "@mirai-app/shared/test-utils";

vi.mock("@mirai-app/supabase", () => {
  const mockSupabaseClient = createMockSupabase();
  const mockUser = createMockSupabaseUser();

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

vi.mock("@mirai-app/db", async () => {
  const actual = await vi.importActual<typeof import("@mirai-app/db")>("@mirai-app/db");
  const mockDbClient = createMockDb();

  return {
    ...actual,
    createDb: vi.fn(() => mockDbClient),
  };
});

vi.mock("@mirai-app/auth", () => {
  const mockUser = createMockDbUser();
  const mockSupabaseUser = createMockSupabaseUser();

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
