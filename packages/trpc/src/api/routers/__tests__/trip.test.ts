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

describe("trip router", () => {
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
    };
  });

  describe("getAll", () => {
    test("returns trips for current user", async () => {
      setupUserMocks();
      mockCtx.db.trip.findMany.mockResolvedValueOnce([
        { id: "trip-1", name: "Summer Trip", startDate: new Date() },
      ]);
      mockCtx.db.trip.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getAll();
      expect(result.trips).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    test("returns trips with groups and sponsors", async () => {
      setupUserMocks();
      mockCtx.db.trip.findMany.mockResolvedValueOnce([
        {
          id: "trip-1",
          name: "Summer Trip",
          groups: [{ id: "group-1", name: "Group A" }],
          tripSponsors: [{ sponsor: { id: "sponsor-1", name: "Sponsor A" } }],
        },
      ]);
      mockCtx.db.trip.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getAll();
      expect(result.trips[0].groups).toBeDefined();
      expect(result.trips[0].tripSponsors).toBeDefined();
    });

    test("respects pagination parameters", async () => {
      setupUserMocks();
      mockCtx.db.trip.findMany.mockResolvedValueOnce([]);
      mockCtx.db.trip.count.mockResolvedValueOnce(0);
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getAll({
        pagination: { limit: 10, offset: 5 },
      });
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(5);
    });
  });

  describe("getById", () => {
    test("returns trip details when user is participant", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        name: "Summer Trip",
        groups: [{ id: "group-1", name: "Group A", image: null, coins: 100 }],
        participants: [
          {
            user: {
              id: "user-1",
              firstName: "John",
              lastName: "Doe",
              authUserId: "auth-user-1",
              role: "USER",
            },
            group: {
              id: "group-1",
              name: "Group A",
              image: null,
              coins: 100,
              isDeleted: false,
            },
          },
        ],
        tripSponsors: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getById({ id: "trip-1" });
      expect(result.id).toBe("trip-1");
    });

    test("throws FORBIDDEN when user is not participant", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(caller.trip.getById({ id: "trip-1" })).rejects.toThrow(
        TRPCError,
      );
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.trip.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(caller.trip.getById({ id: "nonexistent" })).rejects.toThrow(
        TRPCError,
      );
    });

    test("filters out deleted groups", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        name: "Summer Trip",
        groups: [],
        participants: [],
        tripSponsors: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getById({ id: "trip-1" });
      expect(result.groups).toHaveLength(0);
    });
  });

  describe("getByIdAdmin", () => {
    test("admin can get any trip", async () => {
      setupAdminMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        name: "Admin Trip",
        groups: [],
        participants: [],
        tripSponsors: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getByIdAdmin({ id: "trip-1" });
      expect(result.id).toBe("trip-1");
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      setupAdminMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.trip.getByIdAdmin({ id: "nonexistent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("create", () => {
    test("admin can create trip", async () => {
      setupAdminMocks();
      mockCtx.db.trip.create.mockResolvedValueOnce({
        id: "trip-new",
        name: "New Trip",
        startDate: new Date(),
        endDate: new Date(),
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.create({
        name: "New Trip",
        startDate: new Date(),
        endDate: new Date(),
      });
      expect(result.name).toBe("New Trip");
    });
  });

  describe("update", () => {
    test("admin can update trip", async () => {
      setupAdminMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({ id: "trip-1" });
      mockCtx.db.trip.update.mockResolvedValueOnce({
        id: "trip-1",
        name: "Updated Trip",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.update({
        id: "trip-1",
        name: "Updated Trip",
      });
      expect(result.name).toBe("Updated Trip");
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      setupAdminMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.trip.update({ id: "nonexistent", name: "Updated" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getResources", () => {
    test("returns trip resources when user is participant", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.tripResource.findMany.mockResolvedValueOnce([
        { id: "resource-1", name: "Guide" },
      ]);
      mockCtx.db.tripInsurance.findUnique.mockResolvedValueOnce({
        id: "insurance-1",
        steps: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.getResources({ tripId: "trip-1" });
      expect(result.resources).toHaveLength(1);
      expect(result.insurance).toBeDefined();
    });

    test("throws FORBIDDEN when user is not participant", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.trip.getResources({ tripId: "trip-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    test("admin can delete trip", async () => {
      setupAdminMocks();
      mockCtx.db.trip.delete.mockResolvedValueOnce({ id: "trip-1" });
      const caller = createCaller(mockCtx);
      const result = await caller.trip.delete({ id: "trip-1" });
      expect(result.id).toBe("trip-1");
    });
  });
});
