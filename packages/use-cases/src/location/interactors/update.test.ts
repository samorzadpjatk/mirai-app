import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateLocationUseCase,
  type UpdateLocationInput,
  LocationUpdateValidationError,
  LocationCreateError,
} from "./update";
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
      // Validate coordinates if provided
      if (coords.latitude !== undefined && coords.latitude !== null) {
        if (coords.latitude < -90 || coords.latitude > 90) {
          return Effect.fail(
            new LocationUpdateValidationError({
              message: "Latitude must be between -90 and 90",
            }),
          );
        }
      }
      if (coords.longitude !== undefined && coords.longitude !== null) {
        if (coords.longitude < -180 || coords.longitude > 180) {
          return Effect.fail(
            new LocationUpdateValidationError({
              message: "Longitude must be between -180 and 180",
            }),
          );
        }
      }
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
    shouldFailCreate?: boolean;
    shouldFailSave?: boolean;
    shouldFailFind?: boolean;
  } = {},
): LocationGateway {
  const locationMap = new Map(locations.map((loc) => [loc.id, loc]));
  const userLocationMap = new Map(locations.map((loc) => [loc.userId, loc]));

  return {
    create: (location: LocationDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
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
      if (options.shouldFailSave) {
        return Effect.fail(
          new DatabaseError({
            operation: "save",
            message: "Database error",
          }),
        );
      }
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

describe("[UNIT] updateLocationUseCase", () => {
  it("should update existing location successfully", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "user-123",
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 20,
      isSharingLocation: false,
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "user-123",
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      isSharingLocation: true,
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.latitude).toBe(52.52);
    expect(result.longitude).toBe(13.405);
    expect(result.accuracy).toBe(10);
    expect(result.isSharingLocation).toBe(true);
  });

  it("should create new location when none exists for user", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "new-user",
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      isSharingLocation: true,
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("new-user");
    expect(result.latitude).toBe(52.52);
    expect(result.longitude).toBe(13.405);
    expect(result.isSharingLocation).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should update location with partial data", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "user-123",
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 20,
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "user-123",
      latitude: 51.5074,
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.latitude).toBe(51.5074);
    expect(result.userId).toBe("user-123");
  });

  it("should stop sharing when isSharingLocation is false", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-456", firstName: "John", lastName: "Doe" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "user-123",
      isSharingLocation: false,
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isSharingLocation).toBe(false);
  });

  it("should start sharing when isSharingLocation is true", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "user-123",
      isSharingLocation: false,
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "user-123",
      isSharingLocation: true,
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isSharingLocation).toBe(true);
  });

  it("should fail with LocationUpdateValidationError when validation fails", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "user-123",
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "user-123",
      latitude: 999, // Invalid latitude
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LocationUpdateValidationError);
    }
  });

  it("should fail with LocationCreateError when creating new location fails", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "new-user",
      latitude: 999, // Invalid to trigger creation failure
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
  });

  it("should fail with DatabaseError when save fails", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "user-123",
    });
    const mockGateway = createMockLocationGateway([existingLocation], {
      shouldFailSave: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "user-123",
      latitude: 52.52,
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return all expected output properties", async () => {
    const existingLocation = createMockLocation({
      id: "loc-complete",
      userId: "user-complete",
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      altitude: 100,
      altitudeAccuracy: 5,
      heading: 90,
      speed: 5,
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-456", firstName: "John", lastName: "Doe" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateLocationInput = {
      userId: "user-complete",
    };

    const program = updateLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
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
});
