import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteTripUseCase,
  type DeleteTripInput,
  DeleteTripNotFoundError,
} from "./DeleteTrip";
import { Trip, TripStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";
import { InMemoryTripRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteTripUseCase (Effect)", () => {
  let repo: InMemoryTripRepository;

  beforeEach(() => {
    repo = new InMemoryTripRepository();
  });

  // Helper to create a valid trip
  const createValidTrip = (
    overrides?: Partial<{
      id: string;
      name: string;
      status: TripStatus;
    }>,
  ): Trip => {
    const result = Trip.create({
      id: overrides?.id ?? "trip-123",
      name: overrides?.name ?? "Test Trip",
      description: null,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-07"),
      backgroundImagePath: null,
      status: overrides?.status ?? TripStatus.PLANNING,
    });
    return Effect.runSync(result);
  };

  // Helper to run use case with repository
  const runUseCase = async (input: DeleteTripInput) => {
    const program = deleteTripUseCase(input).pipe(
      Effect.provideService(TripRepositoryTag, {
        create: (trip: Trip) => Effect.promise(() => repo.create(trip)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByStatus: (status: TripStatus) =>
          Effect.promise(() => repo.findByStatus(status)),
        findActive: () => Effect.promise(() => repo.findActive()),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => repo.findAll(options)),
        update: (trip: Trip) => Effect.promise(() => repo.update(trip)),
        updateStatus: (id: string, status: TripStatus) =>
          Effect.promise(() => repo.updateStatus(id, status)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        countByStatus: (status: TripStatus) =>
          Effect.promise(() => repo.countByStatus(status)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should delete existing trip", async () => {
      // Arrange - seed existing trip
      const existingTrip = createValidTrip({ id: "trip-to-delete" });
      await repo.create(existingTrip);

      // Verify trip exists before deletion
      expect(await repo.exists("trip-to-delete")).toBe(true);

      const input: DeleteTripInput = {
        tripId: "trip-to-delete",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedTripId).toBe("trip-to-delete");

      // Verify trip was actually deleted
      expect(await repo.exists("trip-to-delete")).toBe(false);
    });

    it("should delete trip with PLANNING status", async () => {
      // Arrange
      const planningTrip = createValidTrip({
        id: "trip-planning-delete",
        status: TripStatus.PLANNING,
      });
      await repo.create(planningTrip);

      const input: DeleteTripInput = {
        tripId: "trip-planning-delete",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(await repo.exists("trip-planning-delete")).toBe(false);
    });

    it("should delete trip with ACTIVE status", async () => {
      // Arrange
      const activeTrip = createValidTrip({
        id: "trip-active-delete",
        status: TripStatus.ACTIVE,
      });
      await repo.create(activeTrip);

      const input: DeleteTripInput = {
        tripId: "trip-active-delete",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(await repo.exists("trip-active-delete")).toBe(false);
    });

    it("should delete trip with COMPLETED status", async () => {
      // Arrange
      const completedTrip = createValidTrip({
        id: "trip-completed-delete",
        status: TripStatus.COMPLETED,
      });
      await repo.create(completedTrip);

      const input: DeleteTripInput = {
        tripId: "trip-completed-delete",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(await repo.exists("trip-completed-delete")).toBe(false);
    });

    it("should delete trip with CANCELLED status", async () => {
      // Arrange
      const cancelledTrip = createValidTrip({
        id: "trip-cancelled-delete",
        status: TripStatus.CANCELLED,
      });
      await repo.create(cancelledTrip);

      const input: DeleteTripInput = {
        tripId: "trip-cancelled-delete",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(await repo.exists("trip-cancelled-delete")).toBe(false);
    });

    it("should fail when trip not found", async () => {
      // Arrange
      const input: DeleteTripInput = {
        tripId: "non-existent-trip",
      };

      // Act
      const program = deleteTripUseCase(input).pipe(
        Effect.provideService(TripRepositoryTag, {
          create: (trip: Trip) => Effect.promise(() => repo.create(trip)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByStatus: (status: TripStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findActive: () => Effect.promise(() => repo.findActive()),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (trip: Trip) => Effect.promise(() => repo.update(trip)),
          updateStatus: (id: string, status: TripStatus) =>
            Effect.promise(() => repo.updateStatus(id, status)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByStatus: (status: TripStatus) =>
            Effect.promise(() => repo.countByStatus(status)),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DeleteTripNotFoundError);
        expect(either.left.message).toContain("not found");
      }
    });

    it("should delete one of multiple trips", async () => {
      // Arrange - create multiple trips
      const trip1 = createValidTrip({ id: "trip-1", name: "Trip One" });
      const trip2 = createValidTrip({ id: "trip-2", name: "Trip Two" });
      const trip3 = createValidTrip({ id: "trip-3", name: "Trip Three" });

      await repo.create(trip1);
      await repo.create(trip2);
      await repo.create(trip3);

      const input: DeleteTripInput = {
        tripId: "trip-2",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedTripId).toBe("trip-2");

      // Verify only trip-2 was deleted
      expect(await repo.exists("trip-1")).toBe(true);
      expect(await repo.exists("trip-2")).toBe(false);
      expect(await repo.exists("trip-3")).toBe(true);

      // Verify remaining trips count
      const allTrips = await repo.findAll();
      expect(allTrips).toHaveLength(2);
    });

    it("should allow deleting same ID after recreating", async () => {
      // Arrange - create and delete
      const trip = createValidTrip({ id: "trip-recreate" });
      await repo.create(trip);

      // First deletion
      const input: DeleteTripInput = {
        tripId: "trip-recreate",
      };

      await runUseCase(input);
      expect(await repo.exists("trip-recreate")).toBe(false);

      // Recreate with same ID
      const newTrip = createValidTrip({
        id: "trip-recreate",
        name: "Recreated Trip",
      });
      await repo.create(newTrip);

      // Second deletion should work
      const result = await runUseCase(input);
      expect(result.success).toBe(true);
      expect(await repo.exists("trip-recreate")).toBe(false);
    });
  });
});
