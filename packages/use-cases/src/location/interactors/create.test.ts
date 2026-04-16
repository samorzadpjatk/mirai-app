import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createLocationUseCase,
  type CreateLocationInput,
  LocationCreationError,
  LocationUpdateError,
} from "./create";
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
    updateInactivityNotification: function () {
      return this;
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
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
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

describe("[UNIT] createLocationUseCase", () => {
  it("should create new location when none exists for user", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: CreateLocationInput = {
      userId: "user-123",
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      altitude: 100,
      heading: 90,
      speed: 5,
      isSharingLocation: true,
    };

    const program = createLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.latitude).toBe(52.52);
    expect(result.longitude).toBe(13.405);
    expect(result.accuracy).toBe(10);
    expect(result.isSharingLocation).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.usersToShareWith).toEqual([]);
  });

  it("should update existing location when one exists for user", async () => {
    const existingLocation = createMockLocation({
      id: "existing-loc",
      userId: "user-123",
      latitude: 40.7128,
      longitude: -74.006,
      isSharingLocation: false,
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: CreateLocationInput = {
      userId: "user-123",
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 15,
      isSharingLocation: true,
    };

    const program = createLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.latitude).toBe(52.52);
    expect(result.longitude).toBe(13.405);
    expect(result.accuracy).toBe(15);
    expect(result.isSharingLocation).toBe(true);
  });

  it("should fail with LocationCreationError when validation fails", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: CreateLocationInput = {
      userId: "user-123",
      latitude: 999, // Invalid latitude
      longitude: 13.405,
    };

    const program = createLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LocationCreationError);
    }
  });

  it("should fail with DatabaseError when database error occurs", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: CreateLocationInput = {
      userId: "user-123",
      latitude: 52.52,
      longitude: 13.405,
    };

    const program = createLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should create location with minimal input", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: CreateLocationInput = {
      userId: "user-456",
    };

    const program = createLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-456");
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("should update location with partial data", async () => {
    const existingLocation = createMockLocation({
      id: "existing-loc",
      userId: "user-789",
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 20,
      isSharingLocation: false,
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: CreateLocationInput = {
      userId: "user-789",
      latitude: 51.5074, // Only update latitude
    };

    const program = createLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-789");
    expect(result.latitude).toBe(51.5074);
  });
});
