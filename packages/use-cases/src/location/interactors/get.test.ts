import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getLocationUseCase,
  type GetLocationInput,
  LocationNotFoundError,
} from "./get";
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
    latitude: overrides.latitude !== undefined ? overrides.latitude : 52.52,
    longitude: overrides.longitude !== undefined ? overrides.longitude : 13.405,
    accuracy: overrides.accuracy !== undefined ? overrides.accuracy : 10,
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
    canBeViewedBy: function () {
      return true;
    },
    isWithinRadius: function () {
      return true;
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
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findByUserId",
            message: "Database error",
          }),
        );
      }
      const location = userLocationMap.get(userId);
      return Effect.succeed(location ?? null);
    },

    findByUserIds: () => Effect.succeed([]),

    findAll: () =>
      Effect.succeed({
        items: Array.from(locationMap.values()),
        total: locationMap.size,
        limit: locationMap.size,
        offset: 0,
        hasMore: false,
      }),

    findSharingWithUser: () => Effect.succeed([]),

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

describe("[UNIT] getLocationUseCase", () => {
  it("should return location successfully when it exists", async () => {
    const now = new Date();
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "user-456",
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      altitude: 100,
      altitudeAccuracy: 5,
      heading: 90,
      speed: 5,
      isSharingLocation: true,
      timestamp: now,
      usersToShareWith: [
        { id: "user-789", firstName: "John", lastName: "Doe" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: GetLocationInput = {
      userId: "user-456",
    };

    const program = getLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("loc-123");
    expect(result.userId).toBe("user-456");
    expect(result.latitude).toBe(52.52);
    expect(result.longitude).toBe(13.405);
    expect(result.accuracy).toBe(10);
    expect(result.altitude).toBe(100);
    expect(result.altitudeAccuracy).toBe(5);
    expect(result.heading).toBe(90);
    expect(result.speed).toBe(5);
    expect(result.isSharingLocation).toBe(true);
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.usersToShareWith).toHaveLength(1);
    expect(result.usersToShareWith[0].id).toBe("user-789");
  });

  it("should fail with LocationNotFoundError when location does not exist", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: GetLocationInput = {
      userId: "nonexistent-user",
    };

    const program = getLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LocationNotFoundError);
      if (either.left instanceof LocationNotFoundError) {
        expect(either.left.userId).toBe("nonexistent-user");
      }
    }
  });

  it("should fail with DatabaseError when database error occurs", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: GetLocationInput = {
      userId: "user-123",
    };

    const program = getLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return location with minimal data", async () => {
    const existingLocation = createMockLocation({
      id: "loc-minimal",
      userId: "user-minimal",
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      isSharingLocation: false,
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: GetLocationInput = {
      userId: "user-minimal",
    };

    const program = getLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("loc-minimal");
    expect(result.userId).toBe("user-minimal");
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.isSharingLocation).toBe(false);
    expect(result.usersToShareWith).toEqual([]);
  });

  it("should return all expected output properties", async () => {
    const existingLocation = createMockLocation({
      id: "loc-complete",
      userId: "user-complete",
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: GetLocationInput = {
      userId: "user-complete",
    };

    const program = getLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("latitude");
    expect(result).toHaveProperty("longitude");
    expect(result).toHaveProperty("accuracy");
    expect(result).toHaveProperty("altitude");
    expect(result).toHaveProperty("altitudeAccuracy");
    expect(result).toHaveProperty("heading");
    expect(result).toHaveProperty("speed");
    expect(result).toHaveProperty("isSharingLocation");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("usersToShareWith");
  });

  it("should handle location with multiple sharing users", async () => {
    const existingLocation = createMockLocation({
      id: "loc-multi",
      userId: "user-multi",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-1", firstName: "Alice", lastName: "Smith" },
        { id: "user-2", firstName: "Bob", lastName: null },
        { id: "user-3", firstName: null, lastName: "Johnson" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: GetLocationInput = {
      userId: "user-multi",
    };

    const program = getLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith).toHaveLength(3);
    expect(result.usersToShareWith[0].firstName).toBe("Alice");
    expect(result.usersToShareWith[1].firstName).toBe("Bob");
    expect(result.usersToShareWith[2].lastName).toBe("Johnson");
  });
});
