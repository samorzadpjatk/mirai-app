import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { listLocationsUseCase, type ListLocationsInput } from "./list";
import { LocationGatewayTag } from "../.././ports/location/gateway";
import type { LocationGateway } from "../.././ports/location/gateway";
import type { Location, LocationId } from "@mirai-app/domain";

describe("[UNIT] listLocationsUseCase (Effect)", () => {
  let mockRepo: LocationGateway;

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

  beforeEach(() => {
    mockRepo = {
      findByUserIds: async () => [],
      findSharingWithUser: async () => [],
    } as unknown as LocationGateway;
  });

  // Helper to run use case with repository
  const runUseCase = async (input: ListLocationsInput) => {
    const program = listLocationsUseCase(input).pipe(
      Effect.provideService(LocationGatewayTag, {
        findByUserIds: (userIds: string[]) =>
          Effect.promise(() => mockRepo.findByUserIds(userIds)),
        findSharingWithUser: (userId: string) =>
          Effect.promise(() => mockRepo.findSharingWithUser(userId)),
        create: (location: Location) =>
          Effect.promise(() => mockRepo.create(location)),
        findById: (id: LocationId) =>
          Effect.promise(() => mockRepo.findById(id)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => mockRepo.findAll(options)),
        save: (location: Location) =>
          Effect.promise(() => mockRepo.save(location)),
        delete: (id: LocationId) => Effect.promise(() => mockRepo.delete(id)),
        deleteByUserId: (userId: string) =>
          Effect.promise(() => mockRepo.deleteByUserId(userId)),
        existsForUser: (userId: string) =>
          Effect.promise(() => mockRepo.existsForUser(userId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return empty list when no locations found", async () => {
      const input: ListLocationsInput = { viewerUserId: "viewer-123" };

      const result = await runUseCase(input);

      expect(result.locations).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return locations sharing with viewer", async () => {
      const mockLocations = [
        createMockLocation({ id: "loc-1" as LocationId, userId: "user-1" }),
        createMockLocation({ id: "loc-2" as LocationId, userId: "user-2" }),
      ];
      mockRepo.findSharingWithUser = async () => mockLocations;

      const input: ListLocationsInput = { viewerUserId: "viewer-123" };
      const result = await runUseCase(input);

      expect(result.locations).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.locations[0].userId).toBe("user-1");
      expect(result.locations[1].userId).toBe("user-2");
    });

    it("should filter by target user IDs", async () => {
      const mockLocations = [
        createMockLocation({ id: "loc-1" as LocationId, userId: "user-1" }),
        createMockLocation({ id: "loc-2" as LocationId, userId: "user-2" }),
      ];
      mockRepo.findByUserIds = async () => mockLocations;

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        targetUserIds: ["user-1", "user-2"],
      };
      const result = await runUseCase(input);

      expect(result.total).toBe(2);
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
      mockRepo.findByUserIds = async () => mockLocations;

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        targetUserIds: ["user-1", "user-2"],
      };
      const result = await runUseCase(input);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].userId).toBe("user-1");
    });

    it("should include viewer's own location regardless of sharing settings", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          userId: "viewer-123", // Same as viewer
          canBeViewedBy: () => false, // Would normally block
        }),
      ];
      mockRepo.findByUserIds = async () => mockLocations;

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        targetUserIds: ["viewer-123"],
      };
      const result = await runUseCase(input);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].userId).toBe("viewer-123");
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
      mockRepo.findSharingWithUser = async () => mockLocations;

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        radiusKm: 10,
        centerLatitude: 40.7128,
        centerLongitude: -74.006,
      };
      const result = await runUseCase(input);

      expect(result.locations).toHaveLength(1);
    });

    it("should calculate distance when center point provided", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      ];
      mockRepo.findSharingWithUser = async () => mockLocations;

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        centerLatitude: 40.7589,
        centerLongitude: -73.9851,
      };
      const result = await runUseCase(input);

      expect(result.locations[0].distanceKm).toBeDefined();
    });

    it("should not calculate distance when location has no coordinates", async () => {
      const mockLocations = [
        createMockLocation({
          id: "loc-1" as LocationId,
          latitude: null,
          longitude: null,
        }),
      ];
      mockRepo.findSharingWithUser = async () => mockLocations;

      const input: ListLocationsInput = {
        viewerUserId: "viewer-123",
        centerLatitude: 40.7589,
        centerLongitude: -73.9851,
      };
      const result = await runUseCase(input);

      expect(result.locations[0].distanceKm).toBeUndefined();
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
      mockRepo.findSharingWithUser = async () => mockLocations;

      const input: ListLocationsInput = { viewerUserId: "viewer-123" };
      const result = await runUseCase(input);

      expect(result.locations[0].latitude).toBeNull();
      expect(result.locations[0].longitude).toBeNull();
      expect(result.locations[0].isSharingLocation).toBe(false);
    });
  });
});
