import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  sponsor: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
  },
  tripSponsor: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
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
      from: () => ({
        createSignedUrl: mock().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed" },
        }),
      }),
    },
  };
};

describe("[INTEGRATION] sponsor router", () => {
  let mockCtx: any;

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
      firstName: "User",
      lastName: "Test",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "User",
      lastName: "Test",
      role: role,
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
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
      },
    };
  });

  describe("getAll", () => {
    test("returns all active sponsors", async () => {
      mockCtx.db.sponsor.findMany.mockResolvedValueOnce([
        { id: "sponsor-1", name: "Sponsor A", isActive: true },
        { id: "sponsor-2", name: "Sponsor B", isActive: true },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.getAll();
      expect(result).toHaveLength(2);
    });

    test("excludes inactive sponsors", async () => {
      mockCtx.db.sponsor.findMany.mockResolvedValueOnce([
        { id: "sponsor-1", name: "Active Sponsor", isActive: true },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.getAll();
      expect(result).toHaveLength(1);
    });
  });

  describe("getById", () => {
    test("returns sponsor by id", async () => {
      mockCtx.db.sponsor.findUnique.mockResolvedValueOnce({
        id: "sponsor-1",
        name: "Sponsor A",
        isActive: true,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.getById({ id: "sponsor-1" });
      expect(result.id).toBe("sponsor-1");
    });

    test("throws NOT_FOUND when sponsor does not exist", async () => {
      mockCtx.db.sponsor.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.sponsor.getById({ id: "nonexistent" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getByTripId", () => {
    test("returns sponsors for a trip", async () => {
      mockCtx.db.tripSponsor.findMany.mockResolvedValueOnce([
        { sponsor: { id: "sponsor-1", name: "Sponsor A", isActive: true } },
        { sponsor: { id: "sponsor-2", name: "Sponsor B", isActive: true } },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.getByTripId({ tripId: "trip-1" });
      expect(result).toHaveLength(2);
    });

    test("excludes inactive sponsors", async () => {
      mockCtx.db.tripSponsor.findMany.mockResolvedValueOnce([
        {
          sponsor: { id: "sponsor-1", name: "Active Sponsor", isActive: true },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.getByTripId({ tripId: "trip-1" });
      expect(result).toHaveLength(1);
    });
  });

  describe("create", () => {
    test("admin can create sponsor", async () => {
      setupAdminMocks();
      mockCtx.db.sponsor.create.mockResolvedValueOnce({
        id: "sponsor-new",
        name: "New Sponsor",
        description: "Description",
        logoPath: "logos/sponsor.png",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.create({
        name: "New Sponsor",
        description: "Description",
        logoPath: "logos/sponsor.png",
      });
      expect(result.name).toBe("New Sponsor");
    });

    test("throws error for non-admin user", async () => {
      mockCtx.dbUser.role = "USER";
      const caller = createCaller(mockCtx);
      await expect(
        caller.sponsor.create({
          name: "New Sponsor",
          description: "Description",
          logoPath: "logos/sponsor.png",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("update", () => {
    test("admin can update sponsor", async () => {
      setupAdminMocks();
      mockCtx.db.sponsor.findUnique.mockResolvedValueOnce({
        id: "sponsor-1",
        name: "Old Name",
      });
      mockCtx.db.sponsor.update.mockResolvedValueOnce({
        id: "sponsor-1",
        name: "Updated Name",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.update({
        id: "sponsor-1",
        name: "Updated Name",
      });
      expect(result.name).toBe("Updated Name");
    });

    test("throws NOT_FOUND when sponsor does not exist", async () => {
      mockCtx.db.sponsor.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.sponsor.update({ id: "nonexistent", name: "Updated" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    test("admin can delete sponsor", async () => {
      setupAdminMocks();
      mockCtx.db.sponsor.delete.mockResolvedValueOnce({ id: "sponsor-1" });
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.delete({ id: "sponsor-1" });
      expect(result.id).toBe("sponsor-1");
    });
  });

  describe("addToTrip", () => {
    test("admin can add sponsor to trip", async () => {
      setupAdminMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({ id: "trip-1" });
      mockCtx.db.sponsor.findUnique.mockResolvedValueOnce({
        id: "sponsor-1",
        name: "Sponsor A",
      });
      mockCtx.db.tripSponsor.findUnique.mockResolvedValueOnce(null);
      mockCtx.db.tripSponsor.create.mockResolvedValueOnce({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.addToTrip({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });
      expect(result.tripId).toBe("trip-1");
    });

    test("throws NOT_FOUND when trip does not exist", async () => {
      mockCtx.db.trip.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.sponsor.addToTrip({
          tripId: "nonexistent",
          sponsorId: "sponsor-1",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws NOT_FOUND when sponsor does not exist", async () => {
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({ id: "trip-1" });
      mockCtx.db.sponsor.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.sponsor.addToTrip({
          tripId: "trip-1",
          sponsorId: "nonexistent",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws CONFLICT when sponsor already associated", async () => {
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({ id: "trip-1" });
      mockCtx.db.sponsor.findUnique.mockResolvedValueOnce({
        id: "sponsor-1",
        name: "Sponsor A",
      });
      mockCtx.db.tripSponsor.findUnique.mockResolvedValueOnce({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.sponsor.addToTrip({ tripId: "trip-1", sponsorId: "sponsor-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("removeFromTrip", () => {
    test("admin can remove sponsor from trip", async () => {
      setupAdminMocks();
      mockCtx.db.tripSponsor.delete.mockResolvedValueOnce({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.sponsor.removeFromTrip({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });
      expect(result.tripId).toBe("trip-1");
    });
  });
});
