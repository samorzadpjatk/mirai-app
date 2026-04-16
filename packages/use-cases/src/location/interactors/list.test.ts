import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { listLocationsUseCase, type ListLocationsInput } from "./list";
import { LocationGatewayTag, type LocationGateway } from "../ports/gateway";
import type { LocationDTO } from "../dto";
import { DatabaseError } from "@mirai-app/domain";
import type { Location } from "@mirai-app/domain";

/**
 * Mock Location with sharing capabilities
 */
function createMockLocation(overrides: Partial<Location> = {}): Location {
  const now = new Date();
  return {
    id: overrides.id ?? "loc-123",
    userId: overrides.userId ?? "user-123",
    latitude: overrides.latitude ?? 52.52,
    longitude: overrides.longitude ?? 13.405,
    accuracy: overrides.accuracy ?? 10,
    altitude: overrides.altitude ?? null,
    altitudeAccuracy: overrides.altitudeAccuracy ?? null,
    heading: overrides.heading ?? null,
    speed: overrides.speed ?? null,
    timestamp: overrides.timestamp ?? now,
    usersToShareWith: overrides.usersToShareWith ?? [],
    isSharingLocation: overrides.isSharingLocation ?? false,
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
    lastInactivityNotification: null,
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
    canBeViewedBy: function (viewerId: string) {
      return (
        this.isSharingLocation &&
        this.usersToShareWith.some((u) => u.id === viewerId)
      );
    },
    isWithinRadius: function (
      centerLat: number,
      centerLon: number,
      radiusKm: number,
    ) {
      if (this.latitude === null || this.longitude === null) return false;
      const R = 6371;
      const dLat = ((centerLat - this.latitude) * Math.PI) / 180;
      const dLon = ((centerLon - this.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((this.latitude * Math.PI) / 180) *
          Math.cos((centerLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance <= radiusKm;
    },
    startSharing: function () {
      return createMockLocation({ ...this, isSharingLocation: true });
    },
    stopSharing: function () {
      return createMockLocation({ ...this, isSharingLocation: false });
    },
    addSharingUser: function () {
      return Effect.succeed(this);
    },
    removeSharingUser: function () {
      return this;
    },
    updateSharingUsers: function () {
      return Effect.succeed(this);
    },
  } as Location;
}

/**
 * Mock LocationGateway for testing
 */
function createMockLocationGateway(
  locations: Location[] = [],
  options: {
    shouldFailFind?: boolean;
  } = {},
): LocationGateway {
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
        isSharingLocation:
          (location as unknown as Location).isSharingLocation ?? false,
      });
      locationMap.set(mockLoc.id, mockLoc);
      userLocationMap.set(mockLoc.userId, mockLoc);
      return Effect.succeed(mockLoc);
    },

    findById: (id: string) => {
      const location = locationMap.get(id);
      return Effect.succeed(location ?? null);
    },

    findByUserId: (userId: string) => {
      const location = userLocationMap.get(userId);
      return Effect.succeed(location ?? null);
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
      return Effect.succeed(found);
    },

    findAll: () =>
      Effect.succeed({
        items: Array.from(locationMap.values()),
        total: locationMap.size,
        limit: locationMap.size,
        offset: 0,
        hasMore: false,
      }),

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
          loc.usersToShareWith.some((u) => u.id === userId),
      );
      return Effect.succeed(sharing);
    },

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

    save: (location: Location) => {
      locationMap.set(location.id, location);
      userLocationMap.set(location.userId, location);
      return Effect.succeed(location);
    },

    delete: () => Effect.succeed(void 0),

    deleteByUserId: () => Effect.succeed(void 0),

    existsForUser: () => Effect.succeed(false),

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

describe("[UNIT] listLocationsUseCase", () => {
  it("should return all locations sharing with viewer", async () => {
    const locations = [
      createMockLocation({
        id: "loc-1",
        userId: "user-1",
        latitude: 52.52,
        longitude: 13.405,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
      createMockLocation({
        id: "loc-2",
        userId: "user-2",
        latitude: 51.5074,
        longitude: -0.1278,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
      createMockLocation({
        id: "loc-3",
        userId: "user-3",
        isSharingLocation: false,
        usersToShareWith: [],
      }),
    ];
    const mockGateway = createMockLocationGateway(locations);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.locations).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.locations[0].userId).toBe("user-1");
    expect(result.locations[1].userId).toBe("user-2");
  });

  it("should return specific target users locations", async () => {
    const locations = [
      createMockLocation({
        id: "loc-1",
        userId: "target-1",
        latitude: 52.52,
        longitude: 13.405,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
      createMockLocation({
        id: "loc-2",
        userId: "target-2",
        latitude: 51.5074,
        longitude: -0.1278,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
      createMockLocation({
        id: "loc-3",
        userId: "target-3",
        isSharingLocation: true,
        usersToShareWith: [],
      }),
    ];
    const mockGateway = createMockLocationGateway(locations);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
      targetUserIds: ["target-1", "target-2"],
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.locations).toHaveLength(2);
    expect(result.locations[0].userId).toBe("target-1");
    expect(result.locations[1].userId).toBe("target-2");
  });

  it("should filter locations by radius", async () => {
    const locations = [
      createMockLocation({
        id: "loc-near",
        userId: "user-near",
        latitude: 52.52,
        longitude: 13.405,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
      createMockLocation({
        id: "loc-far",
        userId: "user-far",
        latitude: 48.8566,
        longitude: 2.3522,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
    ];
    const mockGateway = createMockLocationGateway(locations);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
      radiusKm: 100,
      centerLatitude: 52.52,
      centerLongitude: 13.405,
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.locations).toHaveLength(1);
    expect(result.locations[0].userId).toBe("user-near");
  });

  it("should calculate distance when center point provided", async () => {
    const locations = [
      createMockLocation({
        id: "loc-1",
        userId: "user-1",
        latitude: 52.52,
        longitude: 13.405,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
    ];
    const mockGateway = createMockLocationGateway(locations);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
      centerLatitude: 51.5074,
      centerLongitude: -0.1278,
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.locations[0].distanceKm).toBeDefined();
    expect(typeof result.locations[0].distanceKm).toBe("number");
  });

  it("should return empty list when no locations sharing", async () => {
    const locations = [
      createMockLocation({
        id: "loc-1",
        userId: "user-1",
        isSharingLocation: false,
      }),
    ];
    const mockGateway = createMockLocationGateway(locations);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.locations).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should fail with DatabaseError when database error occurs", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
      targetUserIds: ["user-1"],
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should include viewer's own location", async () => {
    const locations = [
      createMockLocation({
        id: "loc-viewer",
        userId: "viewer-user",
        latitude: 52.52,
        longitude: 13.405,
        isSharingLocation: true,
        usersToShareWith: [],
      }),
    ];
    const mockGateway = createMockLocationGateway(locations);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
      targetUserIds: ["viewer-user"],
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.locations).toHaveLength(1);
    expect(result.locations[0].userId).toBe("viewer-user");
  });

  it("should return all expected location output properties", async () => {
    const locations = [
      createMockLocation({
        id: "loc-complete",
        userId: "user-complete",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
        altitude: 100,
        heading: 90,
        speed: 5,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "viewer-user", firstName: "Viewer", lastName: null },
        ],
      }),
    ];
    const mockGateway = createMockLocationGateway(locations);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ListLocationsInput = {
      viewerUserId: "viewer-user",
    };

    const program = listLocationsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    const location = result.locations[0];
    expect(location).toHaveProperty("id");
    expect(location).toHaveProperty("userId");
    expect(location).toHaveProperty("latitude");
    expect(location).toHaveProperty("longitude");
    expect(location).toHaveProperty("accuracy");
    expect(location).toHaveProperty("altitude");
    expect(location).toHaveProperty("heading");
    expect(location).toHaveProperty("speed");
    expect(location).toHaveProperty("isSharingLocation");
    expect(location).toHaveProperty("timestamp");
  });
});
