import { describe, it, expect, vi, beforeEach } from "vitest";
import { locationRouter } from "~/api/routers/location";

vi.mock("@integral-2025-app/db");

describe("locationRouter", () => {
  const MOCK_USER_ID = "mock-user-id"; // Using the same ID as global test setup

  interface SessionOverrides {
    id?: string;
    firstName?: string;
    lastName?: string;
  }

  const createMockContext = (sessionOverrides: SessionOverrides = {}) => {
    const dbUser = {
      id: sessionOverrides.id ?? MOCK_USER_ID,
      authUserId: "supabase-mock-user",
      email: `${sessionOverrides.id ?? MOCK_USER_ID}@test.com`,
      firstName: sessionOverrides.firstName ?? "Test",
      lastName: sessionOverrides.lastName ?? "User",
      role: "MODERATOR",
    };

    return {
      headers: new Headers(),
      db: {
        location: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          upsert: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
        user: {
          findMany: vi.fn(),
        },
      },
      dbUser,
      supabase: {} as any,
    } as any;
  };

  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    vi.clearAllMocks();
  });

  describe("updateLocation", () => {
    it("should update user location with valid coordinates", async () => {
      const mockLocation = {
        id: "location-1",
        userId: MOCK_USER_ID,
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 10,
        altitude: 100,
        altitudeAccuracy: 5,
        heading: 90,
        speed: 0,
        timestamp: new Date(),
        isSharingLocation: false,
      };

      mockContext.db.location.upsert.mockResolvedValue(mockLocation);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.updateLocation({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 10,
        altitude: 100,
        altitudeAccuracy: 5,
        heading: 90,
        speed: 0,
      });

      expect(result).toEqual(mockLocation);
      expect(mockContext.db.location.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER_ID },
          update: expect.objectContaining({
            latitude: 52.2297,
            longitude: 21.0122,
          }),
          create: expect.objectContaining({
            userId: MOCK_USER_ID,
            latitude: 52.2297,
            longitude: 21.0122,
          }),
        }),
      );
    });

    it("should reject invalid latitude", async () => {
      const caller = locationRouter.createCaller(mockContext);

      await expect(
        caller.updateLocation({
          latitude: 91, // Invalid: > 90
          longitude: 21.0122,
        }),
      ).rejects.toThrow();
    });

    it("should reject invalid longitude", async () => {
      const caller = locationRouter.createCaller(mockContext);

      await expect(
        caller.updateLocation({
          latitude: 52.2297,
          longitude: 181, // Invalid: > 180
        }),
      ).rejects.toThrow();
    });
  });

  describe("getMyLocation", () => {
    it("should return current user location", async () => {
      const mockLocation = {
        id: "location-1",
        userId: MOCK_USER_ID,
        latitude: 52.2297,
        longitude: 21.0122,
        timestamp: new Date(),
        isSharingLocation: false,
      };

      mockContext.db.location.findUnique.mockResolvedValue(mockLocation);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.getMyLocation();

      expect(result).toEqual(mockLocation);
      expect(mockContext.db.location.findUnique).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
      });
    });

    it("should return null when no location exists", async () => {
      mockContext.db.location.findUnique.mockResolvedValue(null);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.getMyLocation();

      expect(result).toBeNull();
    });
  });

  describe("updateSharingSettings", () => {
    it("should enable location sharing", async () => {
      const existingLocation = {
        id: "location-1",
        userId: MOCK_USER_ID,
        latitude: 52.2297,
        longitude: 21.0122,
        timestamp: new Date(),
        isSharingLocation: false,
      };

      const updatedLocation = {
        ...existingLocation,
        isSharingLocation: true,
        usersToShareWith: [
          {
            id: "user-2",
            firstName: "Friend",
            lastName: "One",
          },
          {
            id: "user-3",
            firstName: "Friend",
            lastName: "Two",
          },
        ],
      };

      mockContext.db.location.findUnique.mockResolvedValue(existingLocation);
      mockContext.db.location.upsert.mockResolvedValue(updatedLocation);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.updateSharingSettings({
        isSharingLocation: true,
        userIdsToShareWith: ["user-2", "user-3"],
      });

      expect(result.isSharingLocation).toBe(true);
      expect(result.usersToShareWith).toHaveLength(2);
      expect(mockContext.db.location.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER_ID },
          update: expect.objectContaining({
            isSharingLocation: true,
          }),
        }),
      );
    });

    it("should create location if not exists when updating sharing", async () => {
      mockContext.db.location.findUnique.mockResolvedValue(null);

      const newLocation = {
        id: "location-1",
        userId: MOCK_USER_ID,
        isSharingLocation: true,
        timestamp: new Date(),
        usersToShareWith: [],
      };

      mockContext.db.location.upsert.mockResolvedValue(newLocation);

      const caller = locationRouter.createCaller(mockContext);
      await caller.updateSharingSettings({
        isSharingLocation: true,
      });

      expect(mockContext.db.location.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER_ID },
          create: expect.objectContaining({
            userId: MOCK_USER_ID,
            isSharingLocation: true,
          }),
        }),
      );
    });
  });

  describe("getFriendsLocations", () => {
    it("should return locations of friends sharing with current user", async () => {
      const mockLocations = [
        {
          id: "location-2",
          userId: "user-2",
          latitude: 52.2297,
          longitude: 21.0122,
          isSharingLocation: true,
          timestamp: new Date(),
          user: {
            id: "user-2",
            firstName: "Friend",
            lastName: "One",
            hasAvatar: true,
          },
        },
        {
          id: "location-3",
          userId: "user-3",
          latitude: 52.4064,
          longitude: 16.9252,
          isSharingLocation: true,
          timestamp: new Date(),
          user: {
            id: "user-3",
            firstName: "Friend",
            lastName: "Two",
            hasAvatar: true,
          },
        },
      ];

      mockContext.db.location.findMany.mockResolvedValue(mockLocations);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.getFriendsLocations();

      expect(result).toHaveLength(2);
      expect(result[0]?.user?.firstName).toBe("Friend");
      expect(result[0]?.user?.lastName).toBe("One");
      expect(mockContext.db.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isSharingLocation: true,
            usersToShareWith: {
              some: { id: MOCK_USER_ID },
            },
          }),
        }),
      );
    });

    it("should return empty array when no friends are sharing", async () => {
      mockContext.db.location.findMany.mockResolvedValue([]);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.getFriendsLocations();

      expect(result).toEqual([]);
    });
  });

  describe("getMySharingSettings", () => {
    it("should return sharing settings for user with location", async () => {
      const mockLocation = {
        id: "location-1",
        userId: MOCK_USER_ID,
        isSharingLocation: true,
        timestamp: new Date(),
        usersToShareWith: [
          {
            id: "user-2",
            firstName: "Friend",
            lastName: "One",
            hasAvatar: false,
          },
          {
            id: "user-3",
            firstName: "Friend",
            lastName: "Two",
            hasAvatar: true,
          },
        ],
      };

      mockContext.db.location.findUnique.mockResolvedValue(mockLocation);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.getMySharingSettings();

      expect(result.isSharingLocation).toBe(true);
      expect(result.usersToShareWith).toHaveLength(2);
    });

    it("should return default settings when no location exists", async () => {
      mockContext.db.location.findUnique.mockResolvedValue(null);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.getMySharingSettings();

      expect(result.isSharingLocation).toBe(false);
      expect(result.usersToShareWith).toEqual([]);
    });
  });

  describe("getAllUsersForSharing", () => {
    it("should return all users except current user", async () => {
      const mockUsers = [
        { id: "user-2", firstName: "User", lastName: "Two", hasAvatar: false },
        {
          id: "user-3",
          firstName: "User",
          lastName: "Three",
          hasAvatar: true,
        },
        { id: "user-4", firstName: "User", lastName: "Four", hasAvatar: false },
      ];

      mockContext.db.user.findMany.mockResolvedValue(mockUsers);

      const caller = locationRouter.createCaller(mockContext);
      const result = await caller.getAllUsersForSharing();

      expect(result).toHaveLength(3);
      expect(result.find((u) => u.id === MOCK_USER_ID)).toBeUndefined();
      expect(mockContext.db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { not: MOCK_USER_ID } },
        }),
      );
    });
  });
});
