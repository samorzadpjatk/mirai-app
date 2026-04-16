import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateSharingSettingsUseCase,
  type UpdateSharingSettingsInput,
  UpdateSharingSettingsValidationError,
  UpdateSharingSettingsRepositoryError,
} from "./update-settings";
import { LocationGatewayTag, type LocationGateway } from "../../ports/gateway";
import type { LocationDTO, SharingUserInfo } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock LocationDTO for testing
 */
function createMockLocationDTO(
  overrides: Partial<LocationDTO> = {},
): LocationDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "loc-123",
    userId: overrides.userId ?? "user-123",
    latitude: overrides.latitude ?? 52.52,
    longitude: overrides.longitude ?? 13.405,
    accuracy: overrides.accuracy ?? 10,
    altitude: overrides.altitude ?? null,
    speed: overrides.speed ?? null,
    heading: overrides.heading ?? null,
    recordedAt: overrides.recordedAt ?? now,
    createdAt: overrides.createdAt ?? now,
    usersToShareWith: overrides.usersToShareWith ?? [],
    isSharingLocation: overrides.isSharingLocation ?? false,
  };
}

/**
 * Mock LocationGateway for testing
 */
function createMockLocationGateway(
  locations: LocationDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailCreate?: boolean;
    shouldFailSave?: boolean;
  } = {},
): LocationGateway {
  const locationMap = new Map(locations.map((loc) => [loc.id, loc]));
  const userLocationMap = new Map(locations.map((loc) => [loc.userId, loc]));
  // Track sharing users separately since domain Location doesn't persist them
  const sharingUsersMap = new Map<
    string,
    Array<{ id: string; firstName: string | null; lastName: string | null }>
  >();

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
      // Get sharing users from input if available
      const sharingUsers = location.usersToShareWith ?? [];
      const mockLoc = createMockLocationDTO({
        id: location.id ?? crypto.randomUUID(),
        userId: location.userId,
        isSharingLocation: location.isSharingLocation ?? false,
        usersToShareWith: sharingUsers,
      });
      // Store sharing users for later retrieval
      sharingUsersMap.set(mockLoc.userId, sharingUsers);
      locationMap.set(mockLoc.id, mockLoc);
      userLocationMap.set(mockLoc.userId, mockLoc);
      return Effect.succeed(mockLoc);
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
      if (location) {
        // Merge stored sharing users with the location
        const sharingUsers = sharingUsersMap.get(userId) ?? [];
        const locationWithUsers = {
          ...location,
          usersToShareWith: sharingUsers,
        };
        return Effect.succeed(locationWithUsers);
      }
      return Effect.succeed(null);
    },

    findAll: () =>
      Effect.succeed({
        items: [],
        total: 0,
        limit: 0,
        offset: 0,
        hasMore: false,
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

    save: (location: LocationDTO) => {
      if (options.shouldFailSave) {
        return Effect.fail(
          new DatabaseError({
            operation: "save",
            message: "Database error",
          }),
        );
      }
      // Store sharing users from the location being saved
      const sharingUsers = location.usersToShareWith;
      if (sharingUsers) {
        sharingUsersMap.set(location.userId, sharingUsers);
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

describe("[UNIT] updateSharingSettingsUseCase", () => {
  it("should update sharing settings for existing location", async () => {
    const existingLocation = createMockLocationDTO({
      id: "loc-123",
      userId: "user-123",
      isSharingLocation: false,
      usersToShareWith: [],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-456", firstName: "John", lastName: "Doe" },
      ],
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("user-123");
    expect(result.isSharingLocation).toBe(true);
    expect(result.usersToShareWith).toHaveLength(1);
    expect(result.usersToShareWith[0].id).toBe("user-456");
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("should create new location when none exists", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "new-user",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-456", firstName: "John", lastName: "Doe" },
      ],
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.userId).toBe("new-user");
    expect(result.isSharingLocation).toBe(true);
    expect(result.usersToShareWith).toHaveLength(1);
    expect(result.id).toBeDefined();
  });

  it("should disable sharing when isSharingLocation is false", async () => {
    const existingLocation = createMockLocationDTO({
      id: "loc-123",
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-456", firstName: "John", lastName: "Doe" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "user-123",
      isSharingLocation: false,
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isSharingLocation).toBe(false);
  });

  it("should fail with UpdateSharingSettingsRepositoryError when find fails", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "user-123",
      isSharingLocation: true,
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateSharingSettingsRepositoryError);
    }
  });

  it("should fail with UpdateSharingSettingsRepositoryError when save fails", async () => {
    const existingLocation = createMockLocationDTO({
      id: "loc-123",
      userId: "user-123",
    });
    const mockGateway = createMockLocationGateway([existingLocation], {
      shouldFailSave: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "user-123",
      isSharingLocation: true,
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateSharingSettingsRepositoryError);
    }
  });

  it("should update sharing users list", async () => {
    const existingLocation = createMockLocationDTO({
      id: "loc-123",
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-old", firstName: "Old", lastName: "User" },
      ],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [
        { id: "user-1", firstName: "New", lastName: "User1" },
        { id: "user-2", firstName: "New", lastName: "User2" },
      ],
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith).toHaveLength(2);
    expect(result.usersToShareWith[0].id).toBe("user-1");
    expect(result.usersToShareWith[1].id).toBe("user-2");
  });

  it("should clear sharing users when empty list provided", async () => {
    const existingLocation = createMockLocationDTO({
      id: "loc-123",
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [{ id: "user-1", firstName: "John", lastName: "Doe" }],
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "user-123",
      isSharingLocation: true,
      usersToShareWith: [],
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith).toEqual([]);
  });

  it("should fail with UpdateSharingSettingsRepositoryError when create fails for new location", async () => {
    const mockGateway = createMockLocationGateway([], {
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "new-user",
      isSharingLocation: true,
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateSharingSettingsRepositoryError);
    }
  });

  it("should handle null firstName and lastName in sharing users", async () => {
    const mockGateway = createMockLocationGateway([]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "new-user",
      isSharingLocation: true,
      usersToShareWith: [{ id: "user-1", firstName: null, lastName: null }],
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.usersToShareWith[0].firstName).toBeNull();
    expect(result.usersToShareWith[0].lastName).toBeNull();
  });

  it("should return all expected output properties", async () => {
    const existingLocation = createMockLocationDTO({
      id: "loc-123",
      userId: "user-123",
    });
    const mockGateway = createMockLocationGateway([existingLocation]);
    const mockLayer = Layer.succeed(LocationGatewayTag, mockGateway);

    const input: UpdateSharingSettingsInput = {
      userId: "user-123",
      isSharingLocation: true,
    };

    const program = updateSharingSettingsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("isSharingLocation");
    expect(result).toHaveProperty("usersToShareWith");
    expect(result).toHaveProperty("timestamp");
  });
});
