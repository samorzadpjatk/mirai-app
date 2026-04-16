import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteLocationUseCase,
  type DeleteLocationInput,
  DeleteLocationNotFoundError,
  DeleteLocationError,
} from "./delete";
import { LocationGatewayTag, type LocationGateway } from "../ports/gateway";
import type { LocationDTO } from "../dto";
import { DatabaseError } from "@mirai-app/domain";
import type { Location, LocationId } from "@mirai-app/domain";

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
    shouldFailDelete?: boolean;
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

    delete: (id: LocationId) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error",
          }),
        );
      }
      locationMap.delete(id);
      return Effect.succeed(void 0);
    },

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

describe("[UNIT] deleteLocationUseCase", () => {
  it("should delete location successfully when it exists", async () => {
    const existingLocation = createMockLocation({
      id: "loc-to-delete",
      userId: "user-123",
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: DeleteLocationInput = {
      locationId: "loc-to-delete" as LocationId,
    };

    const program = deleteLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedLocationId).toBe("loc-to-delete");
  });

  it("should fail with DeleteLocationNotFoundError when location does not exist", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: DeleteLocationInput = {
      locationId: "nonexistent-loc" as LocationId,
    };

    const program = deleteLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteLocationNotFoundError);
      if (either.left instanceof DeleteLocationNotFoundError) {
        expect(either.left.locationId).toBe("nonexistent-loc");
      }
    }
  });

  it("should fail with DatabaseError when database error occurs during find", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: DeleteLocationInput = {
      locationId: "loc-123" as LocationId,
    };

    const program = deleteLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should fail with DatabaseError when database error occurs during delete", async () => {
    const existingLocation = createMockLocation({
      id: "loc-to-delete",
      userId: "user-123",
    });
    const mockGateway = createMockLocationGateway([existingLocation], {
      shouldFailDelete: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: DeleteLocationInput = {
      locationId: "loc-to-delete" as LocationId,
    };

    const program = deleteLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle location with sharing users", async () => {
    const existingLocation = createMockLocation({
      id: "shared-loc",
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-456", firstName: "John", lastName: "Doe" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: DeleteLocationInput = {
      locationId: "shared-loc" as LocationId,
    };

    const program = deleteLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedLocationId).toBe("shared-loc");
  });

  it("should verify location is actually removed after delete", async () => {
    const existingLocation = createMockLocation({
      id: "loc-verify-delete",
      userId: "user-789",
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: DeleteLocationInput = {
      locationId: "loc-verify-delete" as LocationId,
    };

    const deleteProgram = deleteLocationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    await Effect.runPromise(deleteProgram);

    const findProgram = mockGateway
      .findById("loc-verify-delete")
      .pipe(Effect.provide(mockLayer));
    const foundLocation = await Effect.runPromise(findProgram);

    expect(foundLocation).toBeNull();
  });
});
