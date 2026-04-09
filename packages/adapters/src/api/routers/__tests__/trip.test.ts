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

describe("[INTEGRATION] trip router", () => {
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
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}`, banned_until: null } },
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
  };

  const setupAdminMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    });
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
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
      // Mock DI context for dependency injection
      di: {
        container: {} as any,
        resolve: <T>(token: string): T => {
          // Mock controller resolution for tripController
          if (token === "tripController") {
            return {
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
            } as unknown as T;
          }
          throw new Error(`Unknown token: ${token}`);
        },
        scope: {
          requestId: "test-request-id",
          dispose: () => Promise.resolve(),
          container: {} as any,
        },
      },
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
        return {
          getById: mock(() =>
            Promise.resolve({
              success: true,
              data: {
                id: "trip-test",
                name: "Test Trip",
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
        };
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
      // Update mock to return error for nonexistent trip
      mockCtx.di.resolve = <T>(token: string): T => {
        if (token === "tripController") {
          return {
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
          } as unknown as T;
        }
        throw new Error(`Unknown token: ${token}`);
      };
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
      // Update mock to return error for delete
      mockCtx.di.resolve = <T>(token: string): T => {
        if (token === "tripController") {
          return {
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
          } as unknown as T;
        }
        throw new Error(`Unknown token: ${token}`);
      };
      const caller = createCaller(mockCtx);
      await expect(caller.trip.delete({ id: "nonexistent" })).rejects.toThrow(
        TRPCError,
      );
    });
  });
});
