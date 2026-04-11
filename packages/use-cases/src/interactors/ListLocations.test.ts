import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ListLocationsUseCase, type ListLocationsInput } from "./ListLocations";
import type { LocationRepository } from "../ports/LocationRepository";
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
    usersToShareWith: [],
    timestamp: new Date("2024-01-01"),
    isSharingLocation: () => true,
    canBeViewedBy: () => true,
    isWithinRadius: () => true,
    ...overrides,
  }) as Location;

describe("[UNIT] ListLocationsUseCase", () => {
  let useCase: ListLocationsUseCase;
  let mockLocationRepository: LocationRepository;

  beforeEach(() => {
    mockLocationRepository = {
      findByUserIds: mock(() => Promise.resolve([])),
      findSharingWithUser: mock(() => Promise.resolve([])),
    } as unknown as LocationRepository;

    useCase = new ListLocationsUseCase(mockLocationRepository);
  });

  describe("execute", () => {
    it("should return empty list when no locations found", async () => {
      const input: ListLocationsInput = { viewerUserId: "viewer-123" };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations).toEqual([]);
        expect(result.value.total).toBe(0);
      }
    });

    it("should return locations sharing with viewer", async () => {
      const mockLocations = [
        createMockLocation({ id: "loc-1" as LocationId, userId: "user-1" }),
        createMockLocation({ id: "loc-2" as LocationId, userId: "user-2" }),
      ];
      mockLocationRepository.findSharingWithUser = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = { viewerUserId: "viewer-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations).toHaveLength(2);
        expect(result.value.total).toBe(2);
        expect(result.value.locations[0].userId).toBe("user-1");
        expect(result.value.locations[1].userId).toBe("user-2");
      }
    });

    it("should filter by target user IDs", async () => {
      const mockLocations = [
        createMockLocation({ id: "loc-1" as LocationId, userId: "user-1" }),
        createMockLocation({ id: "loc-2" as LocationId, userId: "user-2" }),
      ];
      mockLocationRepository.findByUserIds = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        targetUserIds: ["user-1", "user-2"],
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.total).toBe(2);
      }
    });

    it("should filter locations not viewable by viewer", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          userId: "user-1",
          canBeViewedBy: (viewerId: string) => viewerId === "viewer-123",
        }),
        createMockLocation({
          id: "loc-2" as LocationId,
          userId: "user-2",
          canBeViewedBy: () => false,
        }),
      ];
      mockLocationRepository.findByUserIds = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        targetUserIds: ["user-1", "user-2"],
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations).toHaveLength(1);
        expect(result.value.locations[0].userId).toBe("user-1");
      }
    });

    it("should include viewer's own location regardless of sharing settings", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          userId: "viewer-123", // Same as viewer
          canBeViewedBy: () => false, // Would normally block
        }),
      ];
      mockLocationRepository.findByUserIds = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        targetUserIds: ["viewer-123"],
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations).toHaveLength(1);
        expect(result.value.locations[0].userId).toBe("viewer-123");
      }
    });

    it("should apply radius filter when provided", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          latitude: 40.7128,
          longitude: -74.006,
          isWithinRadius: () => true,
        }),
        createMockLocation({
          id: "loc-2" as LocationId,
          latitude: 41.0,
          longitude: -75.0,
          isWithinRadius: () => false,
        }),
      ];
      mockLocationRepository.findSharingWithUser = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        radiusKm: 10,
        centerLatitude: 40.7128,
        centerLongitude: -74.006,
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations).toHaveLength(1);
      }
    });

    it("should calculate distance when center point provided", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      ];
      mockLocationRepository.findSharingWithUser = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        centerLatitude: 40.7589,
        centerLongitude: -73.9851,
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations[0].distanceKm).toBeDefined();
      }
    });

    it("should not calculate distance when location has no coordinates", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          latitude: null,
          longitude: null,
        }),
      ];
      mockLocationRepository.findSharingWithUser = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        centerLatitude: 40.7589,
        centerLongitude: -73.9851,
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations[0].distanceKm).toBeUndefined();
      }
    });

    it("should handle locations with null coordinates", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          latitude: null,
          longitude: null,
          isSharingLocation: () => false,
        }),
      ];
      mockLocationRepository.findSharingWithUser = mock(() =>
        Promise.resolve(mockLocations),
      );

      const input: ListLocationsInput = { viewerUserId: "viewer-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.locations[0].latitude).toBeNull();
        expect(result.value.locations[0].longitude).toBeNull();
        expect(result.value.locations[0].isSharingLocation).toBe(false);
      }
    });
  });
});
