import { describe, it, expect, mock, beforeEach } from "bun:test";
import { LocationController } from "../location";
import type { LocationRepository } from "@mirai-app/use-cases";
import type { Location, LocationId } from "@mirai-app/domain";

// Mock Location domain object
const createMockLocation = (overrides?: Partial<Location>): Location =>
  ({
    id: "loc-123" as LocationId,
    userId: "user-123",
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 10,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: new Date("2024-01-01"),
    isSharingLocation: () => true,
    canBeViewedBy: () => true,
    isWithinRadius: () => true,
    ...overrides,
  }) as Location;

describe("[UNIT] LocationController", () => {
  let controller: LocationController;
  let mockLocationRepository: LocationRepository;

  beforeEach(() => {
    mockLocationRepository = {
      findById: mock(() => Promise.resolve(createMockLocation())),
      findByUserId: mock(() => Promise.resolve(createMockLocation())),
      findByUserIds: mock(() => Promise.resolve([createMockLocation()])),
      findSharingWithUser: mock(() => Promise.resolve([createMockLocation()])),
      create: mock((loc: Location) => Promise.resolve(loc)),
      save: mock((loc: Location) => Promise.resolve(loc)),
      delete: mock(() => Promise.resolve()),
    } as unknown as LocationRepository;

    controller = new LocationController(mockLocationRepository);
  });

  describe("getById", () => {
    it("should return location by ID", async () => {
      const result = await controller.getById({ id: "loc-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("loc-123");
        expect(result.data.latitude).toBe(40.7128);
      }
    });

    it("should return error when location not found", async () => {
      mockLocationRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "loc-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByUserId", () => {
    it("should return location for user", async () => {
      const result = await controller.getByUserId({ userId: "user-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe("user-123");
      }
    });
  });

  describe("getSharingWithUser", () => {
    it("should return locations sharing with user", async () => {
      const result = await controller.getSharingWithUser({
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("create", () => {
    it("should create location with valid input", async () => {
      const input = {
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe("user-123");
      }
    });

    it("should return error for invalid coordinates", async () => {
      const input = {
        userId: "user-123",
        latitude: 100, // Invalid
        longitude: -74.006,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update location", async () => {
      const input = {
        userId: "user-123",
        latitude: 41.0,
        longitude: -75.0,
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should return error when location not found", async () => {
      mockLocationRepository.findByUserId = mock(() => Promise.resolve(null));

      const result = await controller.update({ userId: "user-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete location", async () => {
      const result = await controller.delete({ id: "loc-123" });

      expect(result.success).toBe(true);
    });
  });
});
