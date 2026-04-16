import { describe, it, expect, beforeEach } from "bun:test";
import {
  getTripByIdUseCase,
  type GetTripByIdInput,
  GetTripByIdNotFoundError,
} from "./get-by-id";
import { Trip, TripStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { TripGatewayTag } from "../ports/gateway";
import { InMemoryTripGateway } from "@mirai-app/adapters";

describe("[UNIT] getTripByIdUseCase (Effect)", () => {
  let repo: InMemoryTripGateway;

  beforeEach(() => {
    repo = new InMemoryTripGateway();
  });

  // Helper to create a valid trip
  const createValidTrip = (
    overrides?: Partial<{
      id: string;
      name: string;
      description: string | null;
      status: TripStatus;
      startDate: Date;
      endDate: Date;
    }>,
  ): Trip => {
    const startDate = overrides?.startDate ?? new Date("2026-06-01");
    const endDate = overrides?.endDate ?? new Date("2026-06-07");
    const result = Trip.create({
      id: overrides?.id ?? "trip-123",
      name: overrides?.name ?? "Test Trip",
      description:
        overrides && "description" in overrides
          ? overrides.description
          : "A test trip",
      startDate,
      endDate,
      backgroundImagePath: null,
      status: overrides?.status ?? TripStatus.PLANNING,
    });
    return Effect.runSync(result);
  };

  // Helper to run use case with repository
  const runUseCase = async (input: GetTripByIdInput) => {
    const program = getTripByIdUseCase(input).pipe(
      Effect.provideService(TripGatewayTag, {
        create: (trip: Trip) => repo.create(trip),
        findById: (id: string) => repo.findById(id),
        findByStatus: (status: TripStatus) => repo.findByStatus(status),
        findActive: () => repo.findActive(),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        update: (trip: Trip) => repo.update(trip),
        updateStatus: (id: string, status: TripStatus) =>
          repo.updateStatus(id, status),
        delete: (id: string) => repo.delete(id),
        exists: (id: string) => repo.exists(id),
        countByStatus: (status: TripStatus) => repo.countByStatus(status),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return trip when found", async () => {
      // Arrange - seed existing trip
      const existingTrip = createValidTrip({
        id: "trip-456",
        name: "Found Trip",
        status: TripStatus.ACTIVE,
      });
      Effect.runSync(repo.create(existingTrip));

      const input: GetTripByIdInput = {
        tripId: "trip-456",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("trip-456");
      expect(result.name).toBe("Found Trip");
      expect(result.status).toBe(TripStatus.ACTIVE);
      expect(result.isActive).toBe(true);
      expect(result.isPlanning).toBe(false);
      expect(result.durationInDays).toBe(6);
      expect(result.summary).toContain("Found Trip");
    });

    it("should return complete trip details", async () => {
      // Arrange
      const startDate = new Date("2026-07-01");
      const endDate = new Date("2026-07-10");
      const existingTrip = createValidTrip({
        id: "trip-detail",
        name: "Detailed Trip",
        description: "A detailed trip description",
        status: TripStatus.PLANNING,
        startDate,
        endDate,
      });
      Effect.runSync(repo.create(existingTrip));

      const input: GetTripByIdInput = {
        tripId: "trip-detail",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("trip-detail");
      expect(result.name).toBe("Detailed Trip");
      expect(result.description).toBe("A detailed trip description");
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.status).toBe(TripStatus.PLANNING);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should return correct computed properties for planning trip", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-planning",
        status: TripStatus.PLANNING,
      });
      Effect.runSync(repo.create(existingTrip));

      const input: GetTripByIdInput = {
        tripId: "trip-planning",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isPlanning).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.isCompleted).toBe(false);
      expect(result.isCancelled).toBe(false);
    });

    it("should return correct computed properties for active trip", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-active",
        status: TripStatus.ACTIVE,
      });
      Effect.runSync(repo.create(existingTrip));

      const input: GetTripByIdInput = {
        tripId: "trip-active",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isPlanning).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.isCompleted).toBe(false);
      expect(result.isCancelled).toBe(false);
    });

    it("should return correct computed properties for completed trip", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-completed",
        status: TripStatus.COMPLETED,
      });
      Effect.runSync(repo.create(existingTrip));

      const input: GetTripByIdInput = {
        tripId: "trip-completed",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isPlanning).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.isCompleted).toBe(true);
      expect(result.isCancelled).toBe(false);
    });

    it("should return correct computed properties for cancelled trip", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-cancelled",
        status: TripStatus.CANCELLED,
      });
      Effect.runSync(repo.create(existingTrip));

      const input: GetTripByIdInput = {
        tripId: "trip-cancelled",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isPlanning).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.isCompleted).toBe(false);
      expect(result.isCancelled).toBe(true);
    });

    it("should fail when trip not found", async () => {
      // Arrange
      const input: GetTripByIdInput = {
        tripId: "non-existent-trip",
      };

      // Act
      const program = getTripByIdUseCase(input).pipe(
        Effect.provideService(TripGatewayTag, {
          create: (trip: Trip) => repo.create(trip),
          findById: (id: string) => repo.findById(id),
          findByStatus: (status: TripStatus) => repo.findByStatus(status),
          findActive: () => repo.findActive(),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (trip: Trip) => repo.update(trip),
          updateStatus: (id: string, status: TripStatus) =>
            repo.updateStatus(id, status),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByStatus: (status: TripStatus) => repo.countByStatus(status),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GetTripByIdNotFoundError);
        expect(either.left.tripId).toBe("non-existent-trip");
      }
    });

    it("should handle trip with null description and background image", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-null-fields",
        name: "Null Fields Trip",
        description: null,
      });
      Effect.runSync(repo.create(existingTrip));

      const input: GetTripByIdInput = {
        tripId: "trip-null-fields",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.description).toBeNull();
      expect(result.backgroundImagePath).toBeNull();
    });
  });
});
