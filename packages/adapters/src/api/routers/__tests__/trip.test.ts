import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  trip: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
  },
  tripParticipant: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  tripResource: {
    findMany: mock(() => Promise.resolve([])),
  },
  tripInsurance: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  group: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-user-1", banned_until: null } },
      error: null,
    }),
  );
  return {
    auth: {
      getUser: getUserMock,
      admin: {
        getUserById: adminGetUserByIdMock,
      },
    },
    storage: {
      from: mock().mockReturnValue({
        createSignedUrl: mock().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed" },
        }),
      }),
    },
  };
};

// Helper to create trip controller mock
const createTripControllerMock = () => ({
  getById: mock(({ id }: { id: string }) => {
    if (id === "nonexistent") {
      return Promise.resolve({
        success: false,
        error: "Trip not found",
      });
    }
    return Promise.resolve({
      success: true,
      data: {
        id: id,
        name: "Summer Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        status: "PLANNING",
        createdAt: new Date(),
        updatedAt: new Date(),
        isPlanning: true,
        isActive: false,
        isCompleted: false,
        isCancelled: false,
      },
    });
  }),
  list: mock(() =>
    Promise.resolve({
      success: true,
      data: [
        {
          id: "trip-1",
          name: "Summer Trip",
          description: null,
          startDate: new Date(),
          endDate: new Date(),
          backgroundImagePath: null,
          status: "PLANNING",
          createdAt: new Date(),
          updatedAt: new Date(),
          isPlanning: true,
          isActive: false,
          isCompleted: false,
          isCancelled: false,
        },
      ],
    }),
  ),
  create: mock(() =>
    Promise.resolve({
      success: true,
      data: {
        id: "trip-new",
        name: "New Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        status: "PLANNING",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ),
  update: mock(() =>
    Promise.resolve({
      success: true,
      data: {
        id: "trip-1",
        name: "Updated Trip",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        backgroundImagePath: null,
        status: "PLANNING",
        updatedAt: new Date(),
      },
    }),
  ),
  delete: mock(() =>
    Promise.resolve({ success: true, data: { deleted: true } }),
  ),
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
  const tripController = createTripControllerMock();

  return {
    container: {} as any,
    resolve: mock(<T>(token: string): T => {
      if (token === "tripController") {
        return tripController as unknown as T;
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
  baseUserId = "admin-1",
  baseRole = "ADMIN",
) => {
  const authMocks = createAuthUseCaseMocks(baseUserId, baseRole);
  const tripController = createTripControllerMock();

  return {
    container: {} as any,
    resolve: mock(<T>(token: string): T => {
      // Check for custom mocks first
      if (customMocks[token] !== undefined) {
        return customMocks[token] as T;
      }
      // Fall back to defaults
      if (token === "tripController") {
        return tripController as unknown as T;
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

describe("[INTEGRATION] trip router", () => {
  let mockCtx: any;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
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
    // Update DI context with proper auth mocks (includes tripController)
    mockCtx.di = createMockDIContext(userId, role);
  };

  const setupAdminMocks = () => {
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
    // Update DI context with admin auth mocks (includes tripController)
    mockCtx.di = createMockDIContext("admin-1", "ADMIN");
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
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

  describe("getAll", () => {
    test("returns trips for current user", async () => {
      setupUserMocks();
      // Mock participant check for the filtering logic in tRPC wrapper
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getAll();
      expect(result.trips).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    test("returns trips with groups and sponsors", async () => {
      setupUserMocks();
      // Mock participant check for the filtering logic in tRPC wrapper
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getAll();
      expect(result.trips).toHaveLength(1);
      expect(result.trips[0].id).toBe("trip-1");
    });

    test("respects pagination parameters", async () => {
      setupUserMocks();
      // No trips returned, so no participant checks needed
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getAll({
        pagination: { limit: 10, offset: 5 },
      });
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(5);
      expect(result.trips).toHaveLength(0);
    });

    test("filters out trips where user is not participant", async () => {
      setupUserMocks();
      // Mock participant check to return null (user is not a participant)
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getAll();
      expect(result.trips).toHaveLength(0);
    });
  });

  describe("getById", () => {
    test("returns trip details when found via DI", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getById({ id: "trip-1" });
      expect(result.id).toBe("trip-1");
      expect(result.name).toBe("Summer Trip");
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      await expect(caller.trip.getById({ id: "nonexistent" })).rejects.toThrow(
        TRPCError,
      );
    });

    test("DI resolve is called with correct token", async () => {
      setupUserMocks();
      const resolveSpy = mock((token: string) => {
        if (token === "tripController") {
          return createTripControllerMock();
        }
        // Return auth mocks for other tokens
        if (token === "authenticateUserUseCase") {
          return {
            execute: mock(() =>
              Promise.resolve({
                kind: "ok" as const,
                value: {
                  userId: "user-1",
                  role: "USER",
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
      await caller.trip.getById({ id: "trip-test" });
      expect(resolveSpy).toHaveBeenCalledWith("tripController");
    });
  });

  describe("getByIdAdmin", () => {
    test("admin can get any trip via DI", async () => {
      setupAdminMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getByIdAdmin({ id: "trip-1" });
      expect(result.id).toBe("trip-1");
      expect(result.name).toBe("Summer Trip");
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      setupAdminMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.trip.getByIdAdmin({ id: "nonexistent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("create", () => {
    test("admin can create trip via DI", async () => {
      setupAdminMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.trip.create({
        name: "New Trip",
        startDate: new Date(),
        endDate: new Date(),
      });
      expect(result.name).toBe("New Trip");
      expect(result.id).toBe("trip-new");
    });
  });

  describe("update", () => {
    test("admin can update trip via DI", async () => {
      setupAdminMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.trip.update({
        id: "trip-1",
        name: "Updated Trip",
      });
      expect(result.name).toBe("Updated Trip");
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      setupAdminMocks();
      // Use custom DI context with custom tripController behavior
      mockCtx.di = createCustomDIContext(
        {
          tripController: {
            update: mock(({ tripId }: { tripId: string }) => {
              if (tripId === "nonexistent") {
                return Promise.resolve({
                  success: false,
                  error: "Trip not found",
                });
              }
              return Promise.resolve({
                success: true,
                data: {
                  id: tripId,
                  name: "Updated Trip",
                  description: null,
                  startDate: new Date(),
                  endDate: new Date(),
                  backgroundImagePath: null,
                  status: "PLANNING",
                  updatedAt: new Date(),
                },
              });
            }),
          },
        },
        "admin-1",
        "ADMIN",
      );

      const caller = createCaller(mockCtx);
      await expect(
        caller.trip.update({ id: "nonexistent", name: "Updated" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    test("admin can delete trip via DI", async () => {
      setupAdminMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.trip.delete({ id: "trip-1" });
      expect(result.success).toBe(true);
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      setupAdminMocks();
      // Use custom DI context with custom tripController behavior
      mockCtx.di = createCustomDIContext(
        {
          tripController: {
            getById: mock(() =>
              Promise.resolve({
                success: true,
                data: {
                  id: "trip-1",
                  name: "Summer Trip",
                  description: null,
                  startDate: new Date(),
                  endDate: new Date(),
                  backgroundImagePath: null,
                  status: "PLANNING",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  isPlanning: true,
                  isActive: false,
                  isCompleted: false,
                  isCancelled: false,
                },
              }),
            ),
            delete: mock(() =>
              Promise.resolve({
                success: false,
                error: "Trip not found",
              }),
            ),
          },
        },
        "admin-1",
        "ADMIN",
      );

      const caller = createCaller(mockCtx);
      await expect(caller.trip.delete({ id: "nonexistent" })).rejects.toThrow(
        TRPCError,
      );
    });
  });
});
