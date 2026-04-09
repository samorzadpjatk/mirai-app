import { describe, expect, test, mock, beforeEach } from "bun:test";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";
import { ok } from "@mirai-app/domain";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  location: {
    upsert: mock(() => Promise.resolve({})),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve({})),
    create: mock(() => Promise.resolve({})),
  },
  tripParticipant: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
    findFirst: mock(() => Promise.resolve(null)),
  },
});

const createMockSupabase = () => ({
  auth: {
    getUser: mock(() => Promise.resolve({ data: { user: null }, error: null })),
    admin: {
      getUserById: mock(() =>
        Promise.resolve({
          data: { user: { id: "auth-user-1", banned_until: null } },
          error: null,
        }),
      ),
    },
  },
  storage: {
    from: () => ({
      createSignedUrl: mock().mockResolvedValue({
        data: { signedUrl: "https://example.com/avatar.jpg" },
        error: null,
      }),
    }),
  },
});

// Helper to create mock DI context with auth use cases
const createMockDI = (userId = "user-1", role = "USER") => ({
  container: {} as any,
  resolve: <T>(token: string): T => {
    if (token === "authenticateUserUseCase") {
      return {
        execute: mock(() =>
          Promise.resolve(
            ok({
              userId,
              role,
              authenticatedAt: new Date(),
            }),
          ),
        ),
      } as unknown as T;
    }
    if (token === "authorizeAdminUseCase") {
      return {
        execute: mock(() =>
          role === "ADMIN"
            ? ok(undefined)
            : { kind: "err", error: new Error("Not admin") },
        ),
      } as unknown as T;
    }
    if (token === "authorizeModeratorUseCase") {
      return {
        execute: mock(() =>
          role === "MODERATOR" || role === "ADMIN"
            ? ok(undefined)
            : { kind: "err", error: new Error("Not moderator") },
        ),
      } as unknown as T;
    }
    throw new Error(`Unknown token: ${token}`);
  },
  scope: {
    requestId: "test-request-id",
    dispose: () => Promise.resolve(),
    container: {} as any,
  },
});

describe("[INTEGRATION] location router", () => {
  let mockCtx: any;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.di = createMockDI(userId, role);
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers({ Authorization: "Bearer test-token" }),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
      di: createMockDI(),
    };
  });

  describe("router structure", () => {
    test("has required procedures", () => {
      // Verify the router has the expected procedures
      expect(appRouter.location).toBeDefined();
      expect(appRouter.location.getMyLocation).toBeDefined();
      expect(appRouter.location.updateLocation).toBeDefined();
      expect(appRouter.location.getFriendsLocations).toBeDefined();
      expect(appRouter.location.getMySharingSettings).toBeDefined();
      expect(appRouter.location.updateSharingSettings).toBeDefined();
      expect(appRouter.location.addUserToSharing).toBeDefined();
      expect(appRouter.location.removeUserFromSharing).toBeDefined();
    });
  });

  describe("auth context", () => {
    test("passes auth header to context", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      // Just verify the caller is created successfully with auth headers
      expect(caller).toBeDefined();
      expect(caller.location).toBeDefined();
    });
  });
});
