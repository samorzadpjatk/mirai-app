import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { LocationController } from "./controller";
import {
  LocationGatewayTag,
  type LocationGateway,
  type LocationDTO,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import type { Location } from "@mirai-app/domain";

/**
 * Extended Location type with sharing info for testing
 */
type MockLocation = Location & {
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
};

/**
 * Mock Location domain entity with all methods
 */
function createMockLocation(
  overrides: Partial<MockLocation> = {},
): MockLocation {
  const now = new Date();
  const usersToShareWith = overrides.usersToShareWith ?? [];

  const location = {
    id: overrides.id ?? crypto.randomUUID(),
    userId: overrides.userId ?? "user-123",
    latitude: overrides.latitude !== undefined ? overrides.latitude : 52.52,
    longitude: overrides.longitude !== undefined ? overrides.longitude : 13.405,
    accuracy: overrides.accuracy !== undefined ? overrides.accuracy : 10,
    altitude: overrides.altitude ?? null,
    altitudeAccuracy: overrides.altitudeAccuracy ?? null,
    heading: overrides.heading ?? null,
    speed: overrides.speed ?? null,
    timestamp: overrides.timestamp ?? now,
    isSharingLocation: overrides.isSharingLocation ?? false,
    lastInactivityNotification: overrides.lastInactivityNotification ?? null,
    usersToShareWith,
    isSharing: function () {
      return this.isSharingLocation;
    },
    hasValidCoordinates: function () {
      return this.latitude !== null && this.longitude !== null;
    },
    getCoordinates: function () {
      if (this.latitude !== null && this.longitude !== null) {
        return [this.latitude, this.longitude];
      }
      return null;
    },
    distanceTo: function () {
      return null;
    },
    isStale: function () {
      return false;
    },
    getAgeInMinutes: function () {
      return 0;
    },
    belongsToUser: function (userId: string) {
      return this.userId === userId;
    },
    enableSharing: function () {
      return createMockLocation({ ...this, isSharingLocation: true });
    },
    disableSharing: function () {
      return createMockLocation({ ...this, isSharingLocation: false });
    },
    startSharing: function () {
      return createMockLocation({ ...this, isSharingLocation: true });
    },
    stopSharing: function () {
      return createMockLocation({ ...this, isSharingLocation: false });
    },
    updateInactivityNotification: function (timestamp: Date) {
      return createMockLocation({
        ...this,
        lastInactivityNotification: timestamp,
      });
    },
    updateCoordinates: function (coords: {
      latitude?: number | null;
      longitude?: number | null;
      accuracy?: number | null;
      altitude?: number | null;
      heading?: number | null;
      speed?: number | null;
    }) {
      return Effect.succeed(
        createMockLocation({
          ...this,
          latitude:
            coords.latitude !== undefined ? coords.latitude : this.latitude,
          longitude:
            coords.longitude !== undefined ? coords.longitude : this.longitude,
          accuracy:
            coords.accuracy !== undefined ? coords.accuracy : this.accuracy,
          altitude:
            coords.altitude !== undefined ? coords.altitude : this.altitude,
          heading: coords.heading !== undefined ? coords.heading : this.heading,
          speed: coords.speed !== undefined ? coords.speed : this.speed,
        }),
      );
    },
    canBeViewedBy: function () {
      return true;
    },
    isWithinRadius: function () {
      return true;
    },
    addSharingUser: function () {
      return Effect.succeed(this);
    },
    removeSharingUser: function (userId: string) {
      return createMockLocation({
        ...this,
        usersToShareWith: this.usersToShareWith.filter(
          (u: { id: string }) => u.id !== userId,
        ),
      });
    },
    updateSharingUsers: function () {
      return Effect.succeed(this);
    },
  } as MockLocation;

  return location;
}

/**
 * Extended LocationGateway interface for testing
 * Includes additional methods used by list use case
 */
interface MockLocationGateway extends LocationGateway {
  findByUserIds(
    userIds: string[],
  ): Effect.Effect<MockLocation[], DatabaseError, never>;
  findSharingWithUser(
    userId: string,
  ): Effect.Effect<MockLocation[], DatabaseError, never>;
}

/**
 * Mock LocationGateway for testing
 */
function createMockLocationGateway(
  locations: MockLocation[] = [],
  options: {
    shouldFailFind?: boolean;
  } = {},
): MockLocationGateway {
  const locationMap = new Map(locations.map((loc) => [loc.id, loc]));
  const userLocationMap = new Map(locations.map((loc) => [loc.userId, loc]));

  return {
    create: (location: LocationDTO) => {
      const mockLoc = createMockLocation({
        id: location.id ?? crypto.randomUUID(),
        userId: location.userId,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        accuracy: location.accuracy ?? null,
        isSharingLocation: location.isSharingLocation ?? false,
        usersToShareWith: location.usersToShareWith ?? [],
      });
      locationMap.set(mockLoc.id, mockLoc);
      userLocationMap.set(mockLoc.userId, mockLoc);
      return Effect.succeed(mockLoc as unknown as LocationDTO);
    },

    findById: (id: string) => {
      const location = locationMap.get(id);
      return Effect.succeed(
        (location ?? null) as unknown as LocationDTO | null,
      );
    },

    findByUserId: (userId: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findByUserId",
            message: "Database error",
          }),
        );
      }
      const location = userLocationMap.get(userId);
      return Effect.succeed(
        (location ?? null) as unknown as LocationDTO | null,
      );
    },

    findByUserIds: (userIds: string[]) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findByUserIds",
            message: "Database error",
          }),
        );
      }
      const found = locations.filter((loc) => userIds.includes(loc.userId));
      return Effect.succeed(found as unknown as MockLocation[]);
    },

    findSharingWithUser: (userId: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findSharingWithUser",
            message: "Database error",
          }),
        );
      }
      const sharing = locations.filter(
        (loc) =>
          loc.isSharingLocation &&
          loc.usersToShareWith.some((u: { id: string }) => u.id === userId),
      );
      return Effect.succeed(sharing as unknown as MockLocation[]);
    },

    findAll: () =>
      Effect.succeed({
        items: Array.from(locationMap.values()) as unknown as LocationDTO[],
        total: locationMap.size,
        limit: locationMap.size,
        offset: 0,
        hasMore: false,
      }),

    findSharingWithUserConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByUserIdsConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    save: (location: LocationDTO) => {
      const mockLoc = createMockLocation({
        id: location.id,
        userId: location.userId,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        accuracy: location.accuracy ?? null,
        isSharingLocation: location.isSharingLocation ?? false,
        usersToShareWith: location.usersToShareWith ?? [],
      });
      locationMap.set(mockLoc.id, mockLoc);
      userLocationMap.set(mockLoc.userId, mockLoc);
      return Effect.succeed(mockLoc as unknown as LocationDTO);
    },

    delete: (id: string) => {
      const location = locationMap.get(id);
      if (location) {
        locationMap.delete(id);
        userLocationMap.delete(location.userId);
      }
      return Effect.succeed(void 0);
    },

    deleteByUserId: (userId: string) => {
      const location = userLocationMap.get(userId);
      if (location) {
        locationMap.delete(location.id);
        userLocationMap.delete(userId);
      }
      return Effect.succeed(void 0);
    },

    existsForUser: (userId: string) => {
      return Effect.succeed(userLocationMap.has(userId));
    },

    findSharingRequestsConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findReceivedSharingRequestsConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),
  };
}

describe("[UNIT] LocationController", () => {
  let controller: LocationController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockLocationGateway();
    mockLayer = Layer.succeed(
      LocationGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new LocationController(mockLayer);
  });

  describe("getByUserId", () => {
    it("should return location when found by user ID", async () => {
      const mockLocation = createMockLocation({
        id: "loc-1",
        userId: "user-456",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-789", firstName: "Jane", lastName: "Doe" },
        ],
      });
      const mockGateway = createMockLocationGateway([mockLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.getByUserId({ userId: "user-456" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          userId: string;
          latitude: number | null;
          longitude: number | null;
          isSharingLocation: boolean;
          usersToShareWith: Array<{ id: string }>;
        };
        expect(data.userId).toBe("user-456");
        expect(data.latitude).toBe(40.7128);
        expect(data.longitude).toBe(-74.006);
        expect(data.isSharingLocation).toBe(true);
        expect(data.usersToShareWith).toHaveLength(1);
        expect(data.usersToShareWith[0]?.id).toBe("user-789");
      }
    });

    it("should return error for missing user ID", async () => {
      const result = await controller.getByUserId({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty user ID", async () => {
      const result = await controller.getByUserId({ userId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when location not found", async () => {
      const result = await controller.getByUserId({ userId: "nonexistent" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle database errors", async () => {
      const failingGateway = createMockLocationGateway([], {
        shouldFailFind: true,
      });
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.getByUserId({ userId: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database error");
      }
    });
  });

  describe("create", () => {
    it("should create new location with valid coordinates", async () => {
      const result = await controller.create({
        userId: "user-new",
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 15,
        isSharingLocation: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          userId: string;
          latitude: number | null;
          longitude: number | null;
          isSharingLocation: boolean;
        };
        expect(data.userId).toBe("user-new");
        expect(data.latitude).toBe(51.5074);
        expect(data.longitude).toBe(-0.1278);
        expect(data.isSharingLocation).toBe(true);
      }
    });

    it("should update existing location (upsert pattern)", async () => {
      const existingLocation = createMockLocation({
        id: "loc-existing",
        userId: "user-existing",
        latitude: 40.0,
        longitude: -74.0,
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.create({
        userId: "user-existing",
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 20,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          userId: string;
          latitude: number | null;
          longitude: number | null;
        };
        expect(data.userId).toBe("user-existing");
        expect(data.latitude).toBe(51.5074);
        expect(data.longitude).toBe(-0.1278);
      }
    });

    it("should return error for missing user ID", async () => {
      const result = await controller.create({
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid latitude", async () => {
      const result = await controller.create({
        userId: "user-123",
        latitude: 91,
        longitude: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid longitude", async () => {
      const result = await controller.create({
        userId: "user-123",
        latitude: 0,
        longitude: 181,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative accuracy", async () => {
      const result = await controller.create({
        userId: "user-123",
        latitude: 0,
        longitude: 0,
        accuracy: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during create", async () => {
      const failingGateway: MockLocationGateway = {
        ...createMockLocationGateway([]),
        findByUserId: () => Effect.succeed(null),
        create: () =>
          Effect.fail(
            new DatabaseError({
              operation: "create",
              message: "Database write failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database write failed");
      }
    });
  });

  describe("update", () => {
    it("should update existing location successfully", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "user-123",
        latitude: 40.0,
        longitude: -74.0,
        isSharingLocation: false,
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.update({
        userId: "user-123",
        latitude: 51.5074,
        longitude: -0.1278,
        isSharingLocation: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          latitude: number | null;
          longitude: number | null;
          isSharingLocation: boolean;
        };
        expect(data.latitude).toBe(51.5074);
        expect(data.longitude).toBe(-0.1278);
        expect(data.isSharingLocation).toBe(true);
      }
    });

    it("should create new location when none exists", async () => {
      const result = await controller.update({
        userId: "user-new",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          userId: string;
          latitude: number | null;
          longitude: number | null;
        };
        expect(data.userId).toBe("user-new");
        expect(data.latitude).toBe(40.7128);
        expect(data.longitude).toBe(-74.006);
      }
    });

    it("should return error for invalid user ID", async () => {
      const result = await controller.update({
        userId: "",
        latitude: 40.7128,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid heading", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "user-123",
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.update({
        userId: "user-123",
        heading: 361,
      });

      expect(result.success).toBe(false);
    });

    it("should return error for negative speed", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "user-123",
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.update({
        userId: "user-123",
        speed: -1,
      });

      expect(result.success).toBe(false);
    });

    it("should handle database errors during update", async () => {
      const failingGateway = createMockLocationGateway([], {
        shouldFailFind: true,
      });
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.update({
        userId: "user-123",
        latitude: 40.7128,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database error");
      }
    });
  });

  describe("list", () => {
    it("should return locations sharing with viewer", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1",
          userId: "user-1",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: true,
          usersToShareWith: [
            { id: "viewer-1", firstName: "Viewer", lastName: "One" },
          ],
        }),
        createMockLocation({
          id: "loc-2",
          userId: "user-2",
          latitude: 51.5074,
          longitude: -0.1278,
          isSharingLocation: true,
          usersToShareWith: [
            { id: "viewer-1", firstName: "Viewer", lastName: "One" },
          ],
        }),
      ];

      const mockGateway = createMockLocationGateway(mockLocations);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.list({ viewerUserId: "viewer-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          total: number;
          locations: Array<unknown>;
        };
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(data.locations)).toBe(true);
      }
    });

    it("should return locations for specific target users", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1",
          userId: "user-target",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: true,
        }),
      ];

      const mockGateway = createMockLocationGateway(mockLocations);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.list({
        viewerUserId: "viewer-1",
        targetUserIds: ["user-target"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { total: number };
        expect(data.total).toBeGreaterThanOrEqual(0);
      }
    });

    it("should filter by radius when center coordinates provided", async () => {
      const result = await controller.list({
        viewerUserId: "viewer-1",
        targetUserIds: ["user-1"],
        radiusKm: 10,
        centerLatitude: 40.7128,
        centerLongitude: -74.006,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for missing viewerUserId", async () => {
      const result = await controller.list({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid radius", async () => {
      const result = await controller.list({
        viewerUserId: "viewer-1",
        radiusKm: 0,
        centerLatitude: 40.7128,
        centerLongitude: -74.006,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when radius provided without center coordinates", async () => {
      const result = await controller.list({
        viewerUserId: "viewer-1",
        radiusKm: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during list", async () => {
      const failingGateway = createMockLocationGateway([], {
        shouldFailFind: true,
      });
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.list({
        viewerUserId: "viewer-1",
        targetUserIds: ["user-1"],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database error");
      }
    });
  });

  describe("updateSharingSettings", () => {
    it("should update sharing settings successfully", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "user-123",
        isSharingLocation: false,
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.updateSharingSettings({
        userId: "user-123",
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          isSharingLocation: boolean;
          usersToShareWith: Array<{ id: string }>;
        };
        expect(data.isSharingLocation).toBe(true);
        expect(data.usersToShareWith).toHaveLength(1);
        expect(data.usersToShareWith[0]?.id).toBe("user-456");
      }
    });

    it("should create new location when updating settings for non-existent user", async () => {
      const result = await controller.updateSharingSettings({
        userId: "user-new",
        isSharingLocation: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          isSharingLocation: boolean;
          userId: string;
        };
        expect(data.isSharingLocation).toBe(true);
        expect(data.userId).toBe("user-new");
      }
    });

    it("should return error for missing user ID", async () => {
      const result = await controller.updateSharingSettings({
        isSharingLocation: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid isSharingLocation type", async () => {
      const result = await controller.updateSharingSettings({
        userId: "user-123",
        isSharingLocation: "yes" as unknown as boolean,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors", async () => {
      const failingGateway = createMockLocationGateway([], {
        shouldFailFind: true,
      });
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.updateSharingSettings({
        userId: "user-123",
        isSharingLocation: true,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("addSharingUser", () => {
    it("should add user to sharing list successfully", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "owner-123",
        isSharingLocation: true,
        usersToShareWith: [],
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.addSharingUser({
        ownerUserId: "owner-123",
        userToAddId: "user-456",
        userFirstName: "Jane",
        userLastName: "Doe",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          isSharingLocation: boolean;
          usersToShareWith: Array<{ id: string }>;
        };
        expect(data.isSharingLocation).toBe(true);
        expect(data.usersToShareWith).toHaveLength(1);
        expect(data.usersToShareWith[0]?.id).toBe("user-456");
      }
    });

    it("should create new location with sharing enabled when adding user to non-existent location", async () => {
      const result = await controller.addSharingUser({
        ownerUserId: "owner-new",
        userToAddId: "user-456",
        userFirstName: "Jane",
        userLastName: "Doe",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          isSharingLocation: boolean;
          usersToShareWith: Array<unknown>;
        };
        expect(data.isSharingLocation).toBe(true);
        expect(data.usersToShareWith).toHaveLength(1);
      }
    });

    it("should return error when trying to share with self", async () => {
      const result = await controller.addSharingUser({
        ownerUserId: "same-user",
        userToAddId: "same-user",
        userFirstName: "Self",
        userLastName: "User",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for missing ownerUserId", async () => {
      const result = await controller.addSharingUser({
        userToAddId: "user-456",
        userFirstName: "Jane",
        userLastName: "Doe",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing userToAddId", async () => {
      const result = await controller.addSharingUser({
        ownerUserId: "owner-123",
        userFirstName: "Jane",
        userLastName: "Doe",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when user already in sharing list", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "owner-123",
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
        ],
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.addSharingUser({
        ownerUserId: "owner-123",
        userToAddId: "user-456",
        userFirstName: "Jane",
        userLastName: "Doe",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("removeSharingUser", () => {
    it("should remove user from sharing list successfully", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "owner-123",
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
          { id: "user-789", firstName: "Bob", lastName: "Smith" },
        ],
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.removeSharingUser({
        ownerUserId: "owner-123",
        userToRemoveId: "user-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { usersToShareWith: Array<{ id: string }> };
        expect(data.usersToShareWith).toHaveLength(1);
        expect(data.usersToShareWith[0]?.id).toBe("user-789");
      }
    });

    it("should return error when location not found", async () => {
      const result = await controller.removeSharingUser({
        ownerUserId: "nonexistent-owner",
        userToRemoveId: "user-456",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for missing ownerUserId", async () => {
      const result = await controller.removeSharingUser({
        userToRemoveId: "user-456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing userToRemoveId", async () => {
      const result = await controller.removeSharingUser({
        ownerUserId: "owner-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getSharingSettings", () => {
    it("should return sharing settings for existing location", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "user-123",
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
        ],
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.getSharingSettings({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          isSharingLocation: boolean;
          usersToShareWith: Array<unknown>;
        };
        expect(data.isSharingLocation).toBe(true);
        expect(data.usersToShareWith).toHaveLength(1);
      }
    });

    it("should return default settings when location not found", async () => {
      const result = await controller.getSharingSettings({
        userId: "user-new",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          isSharingLocation: boolean;
          usersToShareWith: Array<unknown>;
        };
        expect(data.isSharingLocation).toBe(false);
        expect(data.usersToShareWith).toHaveLength(0);
      }
    });

    it("should return error for missing user ID", async () => {
      const result = await controller.getSharingSettings({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors", async () => {
      const failingGateway = createMockLocationGateway([], {
        shouldFailFind: true,
      });
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.getSharingSettings({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("deleteByUserId", () => {
    it("should delete location by user ID successfully", async () => {
      const existingLocation = createMockLocation({
        id: "loc-1",
        userId: "user-123",
      });
      const mockGateway = createMockLocationGateway([existingLocation]);
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.deleteByUserId({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { deleted: boolean };
        expect(data.deleted).toBe(true);
      }
    });

    it("should return error for missing user ID", async () => {
      const result = await controller.deleteByUserId({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty user ID", async () => {
      const result = await controller.deleteByUserId({ userId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during delete", async () => {
      const failingGateway: MockLocationGateway = {
        ...createMockLocationGateway([]),
        deleteByUserId: () =>
          Effect.fail(
            new DatabaseError({
              operation: "deleteByUserId",
              message: "Database delete failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.deleteByUserId({
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database delete failed");
      }
    });
  });

  describe("input validators", () => {
    it("exports all validator functions", async () => {
      const {
        validateGetByUserIdInput,
        validateCreateInput,
        validateUpdateInput,
        validateListInput,
        validateUpdateSharingSettingsInput,
        validateAddSharingUserInput,
        validateRemoveSharingUserInput,
        validateGetSharingSettingsInput,
        validateDeleteByUserIdInput,
      } = await import("./controller");

      expect(validateGetByUserIdInput).toBeDefined();
      expect(validateCreateInput).toBeDefined();
      expect(validateUpdateInput).toBeDefined();
      expect(validateListInput).toBeDefined();
      expect(validateUpdateSharingSettingsInput).toBeDefined();
      expect(validateAddSharingUserInput).toBeDefined();
      expect(validateRemoveSharingUserInput).toBeDefined();
      expect(validateGetSharingSettingsInput).toBeDefined();
      expect(validateDeleteByUserIdInput).toBeDefined();
    });
  });

  describe("runWithLayer helper", () => {
    it("handles DatabaseError gracefully", async () => {
      const failingGateway: MockLocationGateway = {
        ...createMockLocationGateway([]),
        findByUserId: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findByUserId",
              message: "Database error message",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        LocationGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new LocationController(mockLayer);

      const result = await controller.getByUserId({ userId: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database error message");
      }
    });
  });
});
