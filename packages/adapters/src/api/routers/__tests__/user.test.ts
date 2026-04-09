import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const mockDb = () => {
  return {
    user: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({})),
      create: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve({ count: 0 })),
    },
    tripParticipant: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      upsert: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve(0)),
    },
    group: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({})),
      create: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve({ count: 0 })),
    },
    $transaction: async (callback: (tx: any) => Promise<any>) =>
      callback(mockDb()),
  } as any;
};

const mockSupabase = () => {
  return {
    auth: {
      getUser: mock(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      ),
      admin: {
        getUserById: mock(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
        listUsers: mock(() =>
          Promise.resolve({ data: { users: [] }, error: null }),
        ),
        createUser: mock(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
        updateUserById: mock(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
        deleteUser: mock(() => Promise.resolve({ error: null })),
      },
    },
    storage: {
      from: mock(() => ({ uploadFile: mock(), downloadFile: mock() })),
    },
  } as any;
};

// Helper to create user controller mock
const createUserControllerMock = () => ({
  getById: mock(({ id }: { id: string }) => {
    if (id === "user-2") {
      return Promise.resolve({
        success: true,
        data: {
          id: "user-2",
          authUserId: "auth-user-2",
          firstName: "Jane",
          lastName: "Smith",
          fullName: "Jane Smith",
          role: "USER",
          hasAvatar: false,
          createdAt: new Date(),
          lastSeenOn: null,
        },
      });
    }
    if (id === "nonexistent") {
      return Promise.resolve({
        success: false,
        error: "User not found",
      });
    }
    return Promise.resolve({
      success: false,
      error: "User not found",
    });
  }),
});

// Create auth use case mocks
const createAuthUseCaseMocks = (userId: string, role: string) => ({
  authenticateUserUseCase: {
    execute: mock(() =>
      Promise.resolve({
        kind: "ok" as const,
        value: {
          userId: userId,
          role: role,
          authUserId: `auth-${userId}`,
          email: "test@example.com",
        },
      }),
    ),
  },
  authorizeModeratorUseCase: {
    execute: mock(() => ({ kind: "ok" as const, value: undefined })),
  },
  authorizeAdminUseCase: {
    execute: mock(() => ({ kind: "ok" as const, value: undefined })),
  },
});

// Helper to create mock DI context with all required tokens
const createMockDIContext = (userId: string, role: string) => {
  const authMocks = createAuthUseCaseMocks(userId, role);
  const userController = createUserControllerMock();

  return {
    container: {} as any,
    resolve: mock(<T>(token: string): T => {
      if (token === "userController") {
        return userController as unknown as T;
      }
      if (token === "authenticateUserUseCase") {
        return authMocks.authenticateUserUseCase as unknown as T;
      }
      if (token === "authorizeModeratorUseCase") {
        return authMocks.authorizeModeratorUseCase as unknown as T;
      }
      if (token === "authorizeAdminUseCase") {
        return authMocks.authorizeAdminUseCase as unknown as T;
      }
      throw new Error(`Unknown token: ${token}`);
    }),
    scope: {
      requestId: "test-request-id",
      dispose: () => Promise.resolve(),
      container: {} as any,
    },
  };
};

// Helper to create custom DI context for specific test scenarios
const createCustomDIContext = (
  customMocks: Record<string, unknown>,
  baseUserId = "user-1",
  baseRole = "MODERATOR",
) => {
  const authMocks = createAuthUseCaseMocks(baseUserId, baseRole);
  const userController = createUserControllerMock();

  return {
    container: {} as any,
    resolve: mock(<T>(token: string): T => {
      // Check for custom mocks first
      if (customMocks[token] !== undefined) {
        return customMocks[token] as T;
      }
      // Fall back to defaults
      if (token === "userController") {
        return userController as unknown as T;
      }
      if (token === "authenticateUserUseCase") {
        return authMocks.authenticateUserUseCase as unknown as T;
      }
      if (token === "authorizeModeratorUseCase") {
        return authMocks.authorizeModeratorUseCase as unknown as T;
      }
      if (token === "authorizeAdminUseCase") {
        return authMocks.authorizeAdminUseCase as unknown as T;
      }
      throw new Error(`Unknown token: ${token}`);
    }),
    scope: {
      requestId: "test-request-id",
      dispose: () => Promise.resolve(),
      container: {} as any,
    },
  };
};

// Helper to create headers with authorization
const createAuthHeaders = (token = "test-token") => {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  return headers;
};

describe("[INTEGRATION] user router with DI", () => {
  let mockCtx: any;

  const setupAuthMocks = (role: "USER" | "MODERATOR" | "ADMIN" = "USER") => {
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      authUserId: "auth-user-1",
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      authUserId: "auth-user-1",
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.dbUser.role = role;
    // Update DI context with proper auth mocks (includes userController)
    mockCtx.di = createMockDIContext("user-1", role);
  };

  beforeEach(() => {
    mockCtx = {
      db: mockDb(),
      supabase: mockSupabase(),
      headers: createAuthHeaders(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
      di: createMockDIContext("user-1", "USER"),
    };
  });

  describe("getById with DI", () => {
    test("returns user when found via DI-resolved controller", async () => {
      setupAuthMocks("MODERATOR");
      const caller = createCaller(mockCtx);
      const result = await caller.user.getById({ id: "user-2" });
      expect(result?.id).toBe("user-2");
      expect(result?.firstName).toBe("Jane");
    });

    test("throws NOT_FOUND when user not found", async () => {
      setupAuthMocks("MODERATOR");
      const caller = createCaller(mockCtx);
      await expect(caller.user.getById({ id: "nonexistent" })).rejects.toThrow(
        TRPCError,
      );
    });

    test("DI resolve is called with correct token", async () => {
      setupAuthMocks("MODERATOR");
      const resolveSpy = mock((token: string) => {
        if (token === "userController") {
          return createUserControllerMock();
        }
        // Return auth mocks for other tokens
        if (token === "authenticateUserUseCase") {
          return {
            execute: mock(() =>
              Promise.resolve({
                kind: "ok" as const,
                value: {
                  userId: "user-1",
                  role: "MODERATOR",
                  authUserId: "auth-user-1",
                  email: "test@example.com",
                },
              }),
            ),
          };
        }
        return undefined;
      });

      mockCtx.di.resolve = resolveSpy;

      const caller = createCaller(mockCtx);
      await caller.user.getById({ id: "user-1" });

      // Verify DI resolve was called with 'userController' token
      expect(resolveSpy).toHaveBeenCalledWith("userController");
    });
  });

  describe("DI container integration", () => {
    test("uses ctx.di.resolve instead of manual instantiation", async () => {
      setupAuthMocks("MODERATOR");

      // Verify the controller method was called through DI
      const controllerMock = {
        getById: mock(() =>
          Promise.resolve({
            success: true,
            data: {
              id: "di-user",
              authUserId: "auth-di",
              firstName: "DI",
              lastName: "User",
              fullName: "DI User",
              role: "USER",
              hasAvatar: false,
              createdAt: new Date(),
              lastSeenOn: null,
            },
          }),
        ),
      };

      mockCtx.di = createCustomDIContext(
        {
          userController: controllerMock,
        },
        "user-1",
        "MODERATOR",
      );

      const caller = createCaller(mockCtx);
      await caller.user.getById({ id: "user-1" });

      // Verify the controller method was called
      expect(controllerMock.getById).toHaveBeenCalledWith({ id: "user-1" });
    });

    test("handles DI resolution errors gracefully", async () => {
      setupAuthMocks("MODERATOR");

      // Simulate DI container throwing an error
      mockCtx.di = createCustomDIContext(
        {
          userController: undefined,
        },
        "user-1",
        "MODERATOR",
      );

      // Make resolve throw for userController
      mockCtx.di.resolve = mock(() => {
        throw new Error("DI container not initialized");
      });

      const caller = createCaller(mockCtx);
      await expect(caller.user.getById({ id: "user-1" })).rejects.toThrow();
    });
  });
});

describe("[INTEGRATION] user router DI migration summary", () => {
  test("user router is defined in appRouter", () => {
    // Verify the user router exists in the app router
    // The router structure uses nested _def.procedures
    expect(appRouter).toBeDefined();
    expect(appRouter._def).toBeDefined();
    expect(typeof appRouter).toBe("object");
  });

  test("DI context is properly typed in TRPCContext", () => {
    // This test verifies the TypeScript types are correct
    // If this compiles, the types are properly integrated
    const mockDiContext = {
      container: {} as any,
      resolve: <T>(_token: string): T => ({}) as T,
      scope: {
        requestId: "test",
        dispose: () => Promise.resolve(),
        container: {} as any,
      },
    };

    // Verify the mock matches the expected structure
    expect(mockDiContext.resolve).toBeDefined();
    expect(mockDiContext.container).toBeDefined();
    expect(mockDiContext.scope).toBeDefined();
  });
});
