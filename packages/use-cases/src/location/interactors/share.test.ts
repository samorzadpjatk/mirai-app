import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  shareLocationUseCase,
  type ShareLocationInput,
  ShareLocationNotFoundError,
  ShareLocationValidationError,
  ShareLocationSelfShareError,
} from "./share";
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
    addSharingUser: function (user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    }) {
      const updatedUsers = [...this.usersToShareWith, user];
      return Effect.succeed(
        createMockLocation({
          ...this,
          usersToShareWith: updatedUsers,
          isSharingLocation: true,
        }),
      );
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
    shouldFailSave?: boolean;
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

describe("[UNIT] shareLocationUseCase", () => {
  it("should share location with target user successfully", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
      isSharingLocation: false,
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "owner-user",
      targetUserId: "target-user",
      targetUserFirstName: "John",
      targetUserLastName: "Doe",
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("owner-user");
    expect(result.isSharingLocation).toBe(true);
    expect(result.usersToShareWith).toHaveLength(1);
    expect(result.usersToShareWith[0].id).toBe("target-user");
    expect(result.usersToShareWith[0].firstName).toBe("John");
    expect(result.usersToShareWith[0].lastName).toBe("Doe");
  });

  it("should fail with ShareLocationNotFoundError when location does not exist", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "nonexistent-user",
      targetUserId: "target-user",
      targetUserFirstName: "John",
      targetUserLastName: "Doe",
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ShareLocationNotFoundError);
      if (either.left instanceof ShareLocationNotFoundError) {
        expect(either.left.userId).toBe("nonexistent-user");
      }
    }
  });

  it("should fail with ShareLocationSelfShareError when trying to share with self", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "owner-user",
      targetUserId: "owner-user",
      targetUserFirstName: "Self",
      targetUserLastName: "Share",
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ShareLocationSelfShareError);
    }
  });

  it("should fail with DatabaseError when database error occurs", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
    });
    const mockGateway = createMockLocationGateway([existingLocation], {
      shouldFailSave: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "owner-user",
      targetUserId: "target-user",
      targetUserFirstName: "John",
      targetUserLastName: "Doe",
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should add multiple users to sharing list", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-1", firstName: "Alice", lastName: "Smith" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "owner-user",
      targetUserId: "user-2",
      targetUserFirstName: "Bob",
      targetUserLastName: "Jones",
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith).toHaveLength(2);
  });

  it("should handle null firstName and lastName", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
      isSharingLocation: false,
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "owner-user",
      targetUserId: "target-user",
      targetUserFirstName: null,
      targetUserLastName: null,
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith[0].firstName).toBeNull();
    expect(result.usersToShareWith[0].lastName).toBeNull();
  });

  it("should enable sharing when it was previously disabled", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
      isSharingLocation: false,
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "owner-user",
      targetUserId: "target-user",
      targetUserFirstName: "John",
      targetUserLastName: "Doe",
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isSharingLocation).toBe(true);
  });

  it("should fail with ShareLocationValidationError when addSharingUser fails", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
      usersToShareWith: [],
    });

    const failingLocation = {
      ...existingLocation,
      addSharingUser: () =>
        Effect.fail(
          new DatabaseError({
            operation: "addSharingUser",
            message: "Validation failed",
          }),
        ),
    } as Location;

    const mockGateway = createMockLocationGateway([failingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: ShareLocationInput = {
      userId: "owner-user",
      targetUserId: "target-user",
      targetUserFirstName: "John",
      targetUserLastName: "Doe",
    };

    const program = shareLocationUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
  });
});
