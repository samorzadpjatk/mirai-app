import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { LocationController } from "../location";
import type { LocationRepository } from "@mirai-app/use-cases";
import type { Location, LocationId } from "@mirai-app/domain";

// Valid UUIDs for testing
const TEST_LOCATION_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440002";

// Mock Location domain object
const createMockLocation = (overrides?: Partial<Location>): Location =>
  ({
    id: TEST_LOCATION_ID as LocationId,
    userId: TEST_USER_ID,
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    sharingLocation: true,
    timestamp: new Date("2024-01-01"),
    lastInactivityNotification: null,
    usersToShareWith: [],
    isSharingLocation: () => true,
    canBeViewedBy: () => true,
    isWithinRadius: () => true,
    hasCoordinates: () => true,
    isAccurate: () => true,
    isMoving: () => false,
    isStale: () => false,
    isSharingWith: () => false,
    getAccuracyLevel: () => "HIGH",
    getCoordinates: () => [40.7128, -74.006],
    getSummary: () => "40.7128, -74.006 (±10m)",
    distanceTo: () => 0,
    toExpoFormat: () => ({
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    }),
    updateCoordinates: function (props: unknown) {
      return Effect.succeed({ ...this, ...props } as Location);
    },
    startSharing: function () {
      return { ...this, sharingLocation: true } as Location;
    },
    stopSharing: function () {
      return { ...this, sharingLocation: false } as Location;
    },
    addSharingUser: function (user: unknown) {
      return Effect.succeed({
        ...this,
        usersToShareWith: [...this.usersToShareWith, user],
      } as Location);
    },
    removeSharingUser: function (userId: string) {
      return {
        ...this,
        usersToShareWith: this.usersToShareWith.filter(
          (u: { id: string }) => u.id !== userId,
        ),
      } as Location;
    },
    updateSharingUsers: function (users: unknown[]) {
      return Effect.succeed({ ...this, usersToShareWith: users } as Location);
    },
    updateInactivityNotification: function () {
      return { ...this, lastInactivityNotification: new Date() } as Location;
    },
    ...overrides,
  }) as Location;

describe("[UNIT] LocationController", () => {
  let controller: LocationController;
  let mockLocationRepository: LocationRepository;

  beforeEach(() => {
    mockLocationRepository = {
      findById: mock(() => Effect.succeed(createMockLocation())),
      findByUserId: mock(() => Effect.succeed(createMockLocation())),
      findByUserIds: mock(() => Effect.succeed([createMockLocation()])),
      findSharingWithUser: mock(() => Effect.succeed([createMockLocation()])),
      create: mock((loc: Location) => Effect.succeed(loc)),
      save: mock((loc: Location) => Effect.succeed(loc)),
      delete: mock(() => Effect.succeed(void 0)),
      deleteByUserId: mock(() => Effect.succeed(void 0)),
      findAll: mock(() => Effect.succeed([createMockLocation()])),
      existsForUser: mock(() => Effect.succeed(true)),
    } as unknown as LocationRepository;

    controller = new LocationController(mockLocationRepository);
  });

  describe("getByUserId", () => {
    it("should return location for user", async () => {
      const result = await controller.getByUserId({ userId: TEST_USER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(TEST_USER_ID);
      }
    });

    it("should return error when location not found", async () => {
      mockLocationRepository.findByUserId = mock(() => Effect.succeed(null));

      const result = await controller.getByUserId({ userId: TEST_USER_ID });

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create location with valid input", async () => {
      const input = {
        userId: TEST_USER_ID,
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(TEST_USER_ID);
      }
    });

    it("should return error for invalid coordinates", async () => {
      const input = {
        userId: TEST_USER_ID,
        latitude: 100, // Invalid
        longitude: -74.006,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update existing location", async () => {
      const input = {
        userId: TEST_USER_ID,
        latitude: 41.0,
        longitude: -75.0,
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should create new location when none exists (upsert)", async () => {
      mockLocationRepository.findByUserId = mock(() => Effect.succeed(null));
      mockLocationRepository.create = mock((loc: Location) =>
        Effect.succeed(loc),
      );

      const result = await controller.update({
        userId: TEST_USER_ID,
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("list", () => {
    it("should return list of locations", async () => {
      const result = await controller.list({ viewerUserId: TEST_USER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locations).toHaveLength(1);
      }
    });
  });

  describe("updateSharingSettings", () => {
    it("should update sharing settings", async () => {
      const result = await controller.updateSharingSettings({
        userId: TEST_USER_ID,
        isSharingLocation: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("deleteByUserId", () => {
    it("should delete location by user ID", async () => {
      const result = await controller.deleteByUserId({ userId: TEST_USER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return error for invalid userId", async () => {
      const result = await controller.deleteByUserId({ userId: "" });

      expect(result.success).toBe(false);
    });
  });
});
