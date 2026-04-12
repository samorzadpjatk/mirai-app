import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateTripUseCase,
  type UpdateTripInput,
  UpdateTripNotFoundError,
  UpdateTripValidationError,
  UpdateTripStateError,
} from "./UpdateTrip";
import { Trip, TripStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";
import { InMemoryTripRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] updateTripUseCase (Effect)", () => {
  let repo: InMemoryTripRepository;

  beforeEach(() => {
    repo = new InMemoryTripRepository();
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
    // Since Trip.create returns Effect, we need to run it
    const trip = Effect.runSync(result);
    return trip;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateTripInput) => {
    const program = updateTripUseCase(input).pipe(
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
    it("should update trip name", async () => {
      // Arrange - seed existing trip
      const existingTrip = createValidTrip({ id: "trip-456" });
      await repo.create(existingTrip);

      const input: UpdateTripInput = {
        tripId: "trip-456",
        name: "Updated Trip Name",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("Updated Trip Name");
      expect(result.id).toBe("trip-456");

      // Verify repository was updated
      const stored = await repo.findById("trip-456");
      expect(stored?.name).toBe("Updated Trip Name");
    });

    it("should update trip description", async () => {
      // Arrange
      const existingTrip = createValidTrip({ id: "trip-789" });
      await repo.create(existingTrip);

      const input: UpdateTripInput = {
        tripId: "trip-789",
        description: "Updated description",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.description).toBe("Updated description");
    });

    it("should update trip dates", async () => {
      // Arrange
      const existingTrip = createValidTrip({ id: "trip-date" });
      await repo.create(existingTrip);

      const newStartDate = new Date("2026-07-01");
      const newEndDate = new Date("2026-07-10");

      const input: UpdateTripInput = {
        tripId: "trip-date",
        startDate: newStartDate,
        endDate: newEndDate,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.startDate).toEqual(newStartDate);
      expect(result.endDate).toEqual(newEndDate);
      expect(result.durationInDays).toBe(9);
    });

    it("should update trip status from PLANNING to ACTIVE", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-status",
        status: TripStatus.PLANNING,
      });
      await repo.create(existingTrip);

      const input: UpdateTripInput = {
        tripId: "trip-status",
        status: TripStatus.ACTIVE,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe(TripStatus.ACTIVE);
      expect(result.isActive).toBe(true);
      expect(result.isPlanning).toBe(false);
    });

    it("should update trip status from ACTIVE to COMPLETED", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-complete",
        status: TripStatus.ACTIVE,
      });
      await repo.create(existingTrip);

      const input: UpdateTripInput = {
        tripId: "trip-complete",
        status: TripStatus.COMPLETED,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe(TripStatus.COMPLETED);
      expect(result.isCompleted).toBe(true);
    });

    it("should update trip status from PLANNING to CANCELLED", async () => {
      // Arrange
      const existingTrip = createValidTrip({
        id: "trip-cancel",
        status: TripStatus.PLANNING,
      });
      await repo.create(existingTrip);

      const input: UpdateTripInput = {
        tripId: "trip-cancel",
        status: TripStatus.CANCELLED,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe(TripStatus.CANCELLED);
      expect(result.isCancelled).toBe(true);
    });

    it("should fail when trip not found", async () => {
      const input: UpdateTripInput = {
        tripId: "non-existent-trip",
        name: "New Name",
      };

      // Act
      const program = updateTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UpdateTripNotFoundError);
      }
    });

    it("should fail when updating a completed trip", async () => {
      // Arrange
      const completedTrip = createValidTrip({
        id: "trip-completed",
        status: TripStatus.COMPLETED,
      });
      await repo.create(completedTrip);

      const input: UpdateTripInput = {
        tripId: "trip-completed",
        name: "Should Fail",
      };

      // Act
      const program = updateTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UpdateTripStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
    });

    it("should fail when updating a cancelled trip", async () => {
      // Arrange
      const cancelledTrip = createValidTrip({
        id: "trip-cancelled",
        status: TripStatus.CANCELLED,
      });
      await repo.create(cancelledTrip);

      const input: UpdateTripInput = {
        tripId: "trip-cancelled",
        name: "Should Fail",
      };

      // Act
      const program = updateTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UpdateTripStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
    });

    it("should fail for invalid status transition", async () => {
      // Arrange - try to go from COMPLETED to ACTIVE (invalid)
      const completedTrip = createValidTrip({
        id: "trip-bad-transition",
        status: TripStatus.COMPLETED,
      });
      await repo.create(completedTrip);

      const input: UpdateTripInput = {
        tripId: "trip-bad-transition",
        status: TripStatus.ACTIVE,
      };

      // Act
      const program = updateTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UpdateTripStateError);
      }
    });

    it("should fail when name validation fails", async () => {
      // Arrange
      const existingTrip = createValidTrip({ id: "trip-invalid" });
      await repo.create(existingTrip);

      const input: UpdateTripInput = {
        tripId: "trip-invalid",
        name: "", // Invalid empty name
      };

      // Act
      const program = updateTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UpdateTripValidationError);
        expect(either.left.message).toContain("name");
      }
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const existingTrip = createValidTrip({ id: "trip-multi" });
      await repo.create(existingTrip);

      const newStartDate = new Date("2026-08-01");
      const newEndDate = new Date("2026-08-10");

      const input: UpdateTripInput = {
        tripId: "trip-multi",
        name: "New Name",
        description: "New Description",
        startDate: newStartDate,
        endDate: newEndDate,
        backgroundImagePath: "https://example.com/new-image.jpg",
        status: TripStatus.ACTIVE,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("New Name");
      expect(result.description).toBe("New Description");
      expect(result.startDate).toEqual(newStartDate);
      expect(result.endDate).toEqual(newEndDate);
      expect(result.backgroundImagePath).toBe(
        "https://example.com/new-image.jpg",
      );
      expect(result.status).toBe(TripStatus.ACTIVE);
      expect(result.summary).toContain("New Name");
    });
  });
});
