import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  addSharingUserUseCase,
  type AddSharingUserInput,
  CannotShareWithSelfError,
  AddSharingUserValidationError,
  AddSharingUserRepositoryError,
} from "./add-user";
import { LocationGatewayTag, type LocationGateway } from "../../ports/gateway";
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
    lastInactivityNotification: null,
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
    removeSharingUser: function (userId: string) {
      const updatedUsers = this.usersToShareWith.filter((u) => u.id !== userId);
      return createMockLocation({
        ...this,
        usersToShareWith: updatedUsers,
      });
    },
    updateSharingUsers: function (
      users: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
      }>,
    ) {
      return Effect.succeed(
        createMockLocation({
          ...this,
          usersToShareWith: users,
        }),
      );
    },
  } as unknown as Location;
}

/**
 * Mock LocationGateway for testing
 */
function createMockLocationGateway(
  locations: Location[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailCreate?: boolean;
    shouldFailSave?: boolean;
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
        isSharingLocation:
          (location as unknown as Location).isSharingLocation ?? false,
        usersToShareWith:
          (location as unknown as Location).usersToShareWith ?? [],
      });
      locationMap.set(mockLoc.id, mockLoc);
      userLocationMap.set(mockLoc.userId, mockLoc);
      return Effect.succeed(mockLoc as unknown as LocationDTO);
    },

    findById: () => {
      return Effect.succeed(null);
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
        location ? (location as unknown as LocationDTO) : null,
      );
    },

    findByUserIds: () => Effect.succeed([]),

    findAll: () =>
      Effect.succeed({
        items: [],
        total: 0,
        limit: 0,
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

    save: (location: LocationDTO) => {
      if (options.shouldFailSave) {
        return Effect.fail(
          new DatabaseError({
            operation: "save",
            message: "Database error",
          }),
        );
      }
      locationMap.set(location.id, location as unknown as Location);
      userLocationMap.set(location.userId, location as unknown as Location);
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

describe("[UNIT] addSharingUserUseCase", () => {
  it("should add user to existing location sharing list", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
      isSharingLocation: false,
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: AddSharingUserInput = {
      ownerUserId: "owner-user",
      userToAddId: "new-user",
      userFirstName: "John",
      userLastName: "Doe",
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("owner-user");
    expect(result.isSharingLocation).toBe(true);
    expect(result.usersToShareWith).toHaveLength(1);
    expect(result.usersToShareWith[0].id).toBe("new-user");
    expect(result.usersToShareWith[0].firstName).toBe("John");
    expect(result.usersToShareWith[0].lastName).toBe("Doe");
  });

  it("should create new location if none exists and add user", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: AddSharingUserInput = {
      ownerUserId: "new-owner",
      userToAddId: "target-user",
      userFirstName: "Jane",
      userLastName: "Smith",
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("new-owner");
    expect(result.isSharingLocation).toBe(true);
    expect(result.usersToShareWith).toHaveLength(1);
    expect(result.usersToShareWith[0].id).toBe("target-user");
  });

  it("should fail with CannotShareWithSelfError when trying to share with self", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: AddSharingUserInput = {
      ownerUserId: "same-user",
      userToAddId: "same-user",
      userFirstName: "Self",
      userLastName: "User",
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CannotShareWithSelfError);
    }
  });

  it("should fail with AddSharingUserRepositoryError when find fails", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: AddSharingUserInput = {
      ownerUserId: "owner-user",
      userToAddId: "target-user",
      userFirstName: "John",
      userLastName: "Doe",
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(AddSharingUserRepositoryError);
    }
  });

  it("should fail with AddSharingUserRepositoryError when save fails", async () => {
    const existingLocation = createMockLocation({
      id: "loc-123",
      userId: "owner-user",
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation], {
      shouldFailSave: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: AddSharingUserInput = {
      ownerUserId: "owner-user",
      userToAddId: "target-user",
      userFirstName: "John",
      userLastName: "Doe",
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(AddSharingUserRepositoryError);
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

    const input: AddSharingUserInput = {
      ownerUserId: "owner-user",
      userToAddId: "user-2",
      userFirstName: "Bob",
      userLastName: "Jones",
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith).toHaveLength(2);
  });

  it("should handle null firstName and lastName", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: AddSharingUserInput = {
      ownerUserId: "owner-user",
      userToAddId: "target-user",
      userFirstName: null,
      userLastName: null,
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith[0].firstName).toBeNull();
    expect(result.usersToShareWith[0].lastName).toBeNull();
  });

  it("should return all expected output properties", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: AddSharingUserInput = {
      ownerUserId: "owner-user",
      userToAddId: "target-user",
      userFirstName: "John",
      userLastName: "Doe",
    };

    const program = addSharingUserUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("isSharingLocation");
    expect(result).toHaveProperty("usersToShareWith");
  });
});
