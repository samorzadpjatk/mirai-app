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

  const runUseCase = async (input: UpdateTripInput) => {
    const program = updateTripUseCase(input).pipe(
      Effect.provideService(TripRepositoryTag, {
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

  describe("execute", () => {
    it("should update trip name", async () => {
      const existingTrip = createValidTrip({ id: "trip-456" });
      await Effect.runPromise(repo.create(existingTrip));

      const input: UpdateTripInput = {
        tripId: "trip-456",
        name: "Updated Trip Name",
      };

      const result = await runUseCase(input);

      expect(result.name).toBe("Updated Trip Name");
      expect(result.id).toBe("trip-456");

      const stored = await Effect.runPromise(repo.findById("trip-456"));
      expect(stored?.name).toBe("Updated Trip Name");
    });

    it("should update trip description", async () => {
      const existingTrip = createValidTrip({ id: "trip-789" });
      await Effect.runPromise(repo.create(existingTrip));

      const input: UpdateTripInput = {
        tripId: "trip-789",
        description: "Updated description",
      };

      const result = await runUseCase(input);

      expect(result.description).toBe("Updated description");
    });

    it("should update trip dates", async () => {
      const existingTrip = createValidTrip({ id: "trip-date" });
      await Effect.runPromise(repo.create(existingTrip));

      const newStartDate = new Date("2026-07-01");
      const newEndDate = new Date("2026-07-10");

      const input: UpdateTripInput = {
        tripId: "trip-date",
        startDate: newStartDate,
        endDate: newEndDate,
      };

      const result = await runUseCase(input);

      expect(result.startDate).toEqual(newStartDate);
      expect(result.endDate).toEqual(newEndDate);
      expect(result.durationInDays).toBe(9);
    });

    it("should update trip status from PLANNING to ACTIVE", async () => {
      const existingTrip = createValidTrip({
        id: "trip-status",
        status: TripStatus.PLANNING,
      });
      await Effect.runPromise(repo.create(existingTrip));

      const input: UpdateTripInput = {
        tripId: "trip-status",
        status: TripStatus.ACTIVE,
      };

      const result = await runUseCase(input);

      expect(result.status).toBe(TripStatus.ACTIVE);
      expect(result.isActive).toBe(true);
      expect(result.isPlanning).toBe(false);
    });

    it("should update trip status from ACTIVE to COMPLETED", async () => {
      const existingTrip = createValidTrip({
        id: "trip-complete",
        status: TripStatus.ACTIVE,
      });
      await Effect.runPromise(repo.create(existingTrip));

      const input: UpdateTripInput = {
        tripId: "trip-complete",
        status: TripStatus.COMPLETED,
      };

      const result = await runUseCase(input);

      expect(result.status).toBe(TripStatus.COMPLETED);
      expect(result.isCompleted).toBe(true);
    });

    it("should update trip status from PLANNING to CANCELLED", async () => {
      const existingTrip = createValidTrip({
        id: "trip-cancel",
        status: TripStatus.PLANNING,
      });
      await Effect.runPromise(repo.create(existingTrip));

      const input: UpdateTripInput = {
        tripId: "trip-cancel",
        status: TripStatus.CANCELLED,
      };

      const result = await runUseCase(input);

      expect(result.status).toBe(TripStatus.CANCELLED);
      expect(result.isCancelled).toBe(true);
    });

    it("should fail when trip not found", async () => {
      const input: UpdateTripInput = {
        tripId: "non-existent-trip",
        name: "New Name",
      };

      const program = updateTripUseCase(input).pipe(
        Effect.provideService(TripRepositoryTag, {
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateTripNotFoundError);
      }
    });

    it("should fail when updating a completed trip", async () => {
      const completedTrip = createValidTrip({
        id: "trip-completed",
        status: TripStatus.COMPLETED,
      });
      await Effect.runPromise(repo.create(completedTrip));

      const input: UpdateTripInput = {
        tripId: "trip-completed",
        name: "Should Fail",
      };

      const program = updateTripUseCase(input).pipe(
        Effect.provideService(TripRepositoryTag, {
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateTripStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
    });

    it("should fail when updating a cancelled trip", async () => {
      const cancelledTrip = createValidTrip({
        id: "trip-cancelled",
        status: TripStatus.CANCELLED,
      });
      await Effect.runPromise(repo.create(cancelledTrip));

      const input: UpdateTripInput = {
        tripId: "trip-cancelled",
        name: "Should Fail",
      };

      const program = updateTripUseCase(input).pipe(
        Effect.provideService(TripRepositoryTag, {
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateTripStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
    });

    it("should fail for invalid status transition", async () => {
      const completedTrip = createValidTrip({
        id: "trip-bad-transition",
        status: TripStatus.COMPLETED,
      });
      await Effect.runPromise(repo.create(completedTrip));

      const input: UpdateTripInput = {
        tripId: "trip-bad-transition",
        status: TripStatus.ACTIVE,
      };

      const program = updateTripUseCase(input).pipe(
        Effect.provideService(TripRepositoryTag, {
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateTripStateError);
      }
    });

    it("should fail when name validation fails", async () => {
      const existingTrip = createValidTrip({ id: "trip-invalid" });
      await Effect.runPromise(repo.create(existingTrip));

      const input: UpdateTripInput = {
        tripId: "trip-invalid",
        name: "",
      };

      const program = updateTripUseCase(input).pipe(
        Effect.provideService(TripRepositoryTag, {
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateTripValidationError);
        expect(either.left.message).toContain("name");
      }
    });

    it("should update multiple fields at once", async () => {
      const existingTrip = createValidTrip({ id: "trip-multi" });
      await Effect.runPromise(repo.create(existingTrip));

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

      const result = await runUseCase(input);

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
