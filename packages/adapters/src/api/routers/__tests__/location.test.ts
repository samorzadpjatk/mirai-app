import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

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
  },
  tripParticipant: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
  },
  locationSharingRequest: {
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
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
      from: () => ({
        createSignedUrl: mock().mockResolvedValue({
          data: { signedUrl: "https://example.com/avatar.jpg" },
          error: null,
        }),
      }),
    },
  };
};

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

  describe("updateLocation", () => {
    test("upserts user location", async () => {
      setupUserMocks();
      mockCtx.db.location.upsert.mockResolvedValueOnce({
        id: "loc-1",
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: true,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.updateLocation({
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      });
      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
    });
  });

  describe("updateSharingSettings", () => {
    test("updates sharing settings", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.location.upsert.mockResolvedValueOnce({
        isSharingLocation: true,
        usersToShareWith: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.updateSharingSettings({
        isSharingLocation: true,
      });
      expect(result.isSharingLocation).toBe(true);
    });

    test("updates sharing settings with specific users", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-1" },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-2" },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        id: "part-1",
      });
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "user-2", firstName: "Jane", lastName: "Doe" },
      ]);
      mockCtx.db.location.upsert.mockResolvedValueOnce({
        isSharingLocation: true,
        usersToShareWith: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.updateSharingSettings({
        isSharingLocation: true,
        userIdsToShareWith: ["user-2"],
      });
      expect(result.isSharingLocation).toBe(true);
    });
  });

  describe("getMyLocation", () => {
    test("returns user location", async () => {
      setupUserMocks();
      mockCtx.db.location.findUnique.mockResolvedValueOnce({
        id: "loc-1",
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.getMyLocation();
      expect(result?.latitude).toBe(40.7128);
    });

    test("returns null when no location", async () => {
      setupUserMocks();
      mockCtx.db.location.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      const result = await caller.location.getMyLocation();
      expect(result).toBeNull();
    });
  });

  describe("getFriendsLocations", () => {
    test("returns friends locations", async () => {
      setupUserMocks();
      mockCtx.db.location.findMany.mockResolvedValueOnce([
        {
          id: "loc-1",
          userId: "user-2",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: true,
          user: {
            id: "user-2",
            firstName: "Jane",
            lastName: "Doe",
            hasAvatar: false,
          },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.location.getFriendsLocations();
      expect(result).toHaveLength(1);
    });
  });

  describe("getMySharingSettings", () => {
    test("returns sharing settings", async () => {
      setupUserMocks();
      mockCtx.db.location.findUnique.mockResolvedValueOnce({
        isSharingLocation: true,
        usersToShareWith: [
          {
            id: "user-2",
            firstName: "Jane",
            lastName: "Doe",
            hasAvatar: false,
          },
        ],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.getMySharingSettings();
      expect(result.isSharingLocation).toBe(true);
      expect(result.usersToShareWith).toHaveLength(1);
    });

    test("returns default settings when no location", async () => {
      setupUserMocks();
      mockCtx.db.location.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      const result = await caller.location.getMySharingSettings();
      expect(result.isSharingLocation).toBe(false);
      expect(result.usersToShareWith).toHaveLength(0);
    });
  });

  describe("getAllUsersForSharing", () => {
    test("returns users available for sharing", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        id: "part-1",
        tripId: "trip-1",
        userId: "user-1",
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-2" },
      ]);
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "user-2", firstName: "Jane", lastName: "Doe", hasAvatar: false },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.location.getAllUsersForSharing({
        tripId: "trip-1",
      });
      expect(result).toHaveLength(1);
    });

    test("returns empty array when no trip membership", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      const result = await caller.location.getAllUsersForSharing({
        tripId: "trip-1",
      });
      expect(result).toHaveLength(0);
    });
  });

  describe("addUserToSharing", () => {
    test("adds user to sharing list", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-1" },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-2" },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        id: "part-1",
      });
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "user-2", firstName: "Jane", lastName: "Doe" },
      ]);
      mockCtx.db.location.upsert.mockResolvedValueOnce({
        isSharingLocation: true,
        usersToShareWith: [
          {
            id: "user-2",
            firstName: "Jane",
            lastName: "Doe",
            hasAvatar: false,
          },
        ],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.addUserToSharing({
        userId: "user-2",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("removeUserFromSharing", () => {
    test("removes user from sharing list", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.location.update.mockResolvedValueOnce({
        isSharingLocation: true,
        usersToShareWith: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.removeUserFromSharing({
        userId: "user-2",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("requestLocationSharing", () => {
    test("creates location sharing request", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-1" },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-2" },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        id: "part-1",
      });
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "user-2", firstName: "Jane", lastName: "Doe" },
      ]);
      mockCtx.db.locationSharingRequest.findFirst.mockResolvedValueOnce(null);
      mockCtx.db.locationSharingRequest.create.mockResolvedValueOnce({
        id: "req-1",
        senderId: "user-1",
        receiverId: "user-2",
        status: "PENDING",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.requestLocationSharing({
        receiverId: "user-2",
      });
      expect(result.success).toBe(true);
      expect(result.request.status).toBe("PENDING");
    });

    test("throws error when sending request to self", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-1" },
      ]);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { tripId: "trip-1", userId: "user-2" },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        id: "part-1",
      });
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "user-2", firstName: "Jane", lastName: "Doe" },
      ]);
      const caller = createCaller(mockCtx);
      await expect(
        caller.location.requestLocationSharing({ receiverId: "user-1" }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws error when request already pending", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        id: "part-1",
      });
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "user-2", firstName: "Jane", lastName: "Doe" },
      ]);
      mockCtx.db.locationSharingRequest.findFirst.mockResolvedValueOnce({
        id: "req-1",
        status: "PENDING",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.location.requestLocationSharing({ receiverId: "user-2" }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws error when sharing already enabled", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        id: "part-1",
      });
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "user-2", firstName: "Jane", lastName: "Doe" },
      ]);
      mockCtx.db.locationSharingRequest.findFirst.mockResolvedValueOnce({
        id: "req-1",
        status: "ACCEPTED",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.location.requestLocationSharing({ receiverId: "user-2" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("acceptLocationSharingRequest", () => {
    test("accepts pending request", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.locationSharingRequest.findUnique.mockResolvedValueOnce({
        id: "req-1",
        senderId: "user-2",
        receiverId: "user-1",
        status: "PENDING",
      });
      mockCtx.db.$transaction = mock().mockImplementation(async (cb) => {
        return cb({
          locationSharingRequest: {
            update: mock().mockResolvedValue({
              id: "req-1",
              status: "ACCEPTED",
            }),
          },
          location: {
            upsert: mock().mockResolvedValue({}),
          },
        });
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.acceptLocationSharingRequest({
        requestId: "req-1",
      });
      expect(result.success).toBe(true);
    });

    test("throws NOT_FOUND when request not found", async () => {
      setupUserMocks();
      mockCtx.db.locationSharingRequest.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.location.acceptLocationSharingRequest({
          requestId: "nonexistent",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws FORBIDDEN when not receiver", async () => {
      setupUserMocks();
      mockCtx.db.locationSharingRequest.findUnique.mockResolvedValueOnce({
        id: "req-1",
        senderId: "user-2",
        receiverId: "user-3",
        status: "PENDING",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.location.acceptLocationSharingRequest({ requestId: "req-1" }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST when not pending", async () => {
      setupUserMocks();
      mockCtx.db.locationSharingRequest.findUnique.mockResolvedValueOnce({
        id: "req-1",
        senderId: "user-2",
        receiverId: "user-1",
        status: "ACCEPTED",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.location.acceptLocationSharingRequest({ requestId: "req-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("rejectLocationSharingRequest", () => {
    test("rejects pending request", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          tripId: "trip-1",
          userId: "user-1",
          trip: { id: "trip-1", endDate: new Date("2099-01-01") },
        },
      ]);
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date("2099-01-01"),
      });
      mockCtx.db.locationSharingRequest.findUnique.mockResolvedValueOnce({
        id: "req-1",
        senderId: "user-2",
        receiverId: "user-1",
        status: "PENDING",
      });
      mockCtx.db.locationSharingRequest.update.mockResolvedValueOnce({
        id: "req-1",
        status: "REJECTED",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.location.rejectLocationSharingRequest({
        requestId: "req-1",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getPendingLocationSharingRequests", () => {
    test("returns pending requests for user", async () => {
      setupUserMocks();
      mockCtx.db.locationSharingRequest.findMany.mockResolvedValueOnce([
        {
          id: "req-1",
          senderId: "user-2",
          sender: {
            id: "user-2",
            firstName: "Jane",
            lastName: "Doe",
            hasAvatar: false,
          },
          status: "PENDING",
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.location.getPendingLocationSharingRequests();
      expect(result).toHaveLength(1);
    });
  });

  describe("getMyLocationSharingRequests", () => {
    test("returns sent and received requests", async () => {
      setupUserMocks();
      mockCtx.db.locationSharingRequest.findMany
        .mockResolvedValueOnce([
          {
            id: "req-1",
            receiverId: "user-2",
            receiver: {
              id: "user-2",
              firstName: "Jane",
              lastName: "Doe",
              hasAvatar: false,
            },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "req-2",
            senderId: "user-3",
            sender: {
              id: "user-3",
              firstName: "Bob",
              lastName: "Smith",
              hasAvatar: false,
            },
          },
        ]);
      const caller = createCaller(mockCtx);
      const result = await caller.location.getMyLocationSharingRequests();
      expect(result.sent).toHaveLength(1);
      expect(result.received).toHaveLength(1);
    });
  });
});
