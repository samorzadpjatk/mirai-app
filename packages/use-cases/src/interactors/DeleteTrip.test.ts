import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteTripUseCase,
  type DeleteTripInput,
  DeleteTripNotFoundError,
} from "./DeleteTrip";
import { Trip, TripStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";
import { InMemoryTripGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] deleteTripUseCase (Effect)", () => {
  let repo: InMemoryTripGateway;

  beforeEach(() => {
    repo = new InMemoryTripGateway();
  });

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

  const runUseCase = async (input: DeleteTripInput) => {
    const program = deleteTripUseCase(input).pipe(
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

  describe("[UNIT] execute", () => {
    it("should delete existing trip", async () => {
      const existingTrip = createValidTrip({ id: "trip-to-delete" });
      await Effect.runPromise(repo.create(existingTrip));

      expect(await Effect.runPromise(repo.exists("trip-to-delete"))).toBe(true);

      const input: DeleteTripInput = {
        tripId: "trip-to-delete",
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.deletedTripId).toBe("trip-to-delete");

      expect(await Effect.runPromise(repo.exists("trip-to-delete"))).toBe(
        false,
      );
    });

    it("should delete trip with PLANNING status", async () => {
      const planningTrip = createValidTrip({
        id: "trip-planning-delete",
        status: TripStatus.PLANNING,
      });
      await Effect.runPromise(repo.create(planningTrip));

      const input: DeleteTripInput = {
        tripId: "trip-planning-delete",
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(await Effect.runPromise(repo.exists("trip-planning-delete"))).toBe(
        false,
      );
    });

    it("should delete trip with ACTIVE status", async () => {
      const activeTrip = createValidTrip({
        id: "trip-active-delete",
        status: TripStatus.ACTIVE,
      });
      await Effect.runPromise(repo.create(activeTrip));

      const input: DeleteTripInput = {
        tripId: "trip-active-delete",
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(await Effect.runPromise(repo.exists("trip-active-delete"))).toBe(
        false,
      );
    });

    it("should delete trip with COMPLETED status", async () => {
      const completedTrip = createValidTrip({
        id: "trip-completed-delete",
        status: TripStatus.COMPLETED,
      });
      await Effect.runPromise(repo.create(completedTrip));

      const input: DeleteTripInput = {
        tripId: "trip-completed-delete",
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(
        await Effect.runPromise(repo.exists("trip-completed-delete")),
      ).toBe(false);
    });

    it("should delete trip with CANCELLED status", async () => {
      const cancelledTrip = createValidTrip({
        id: "trip-cancelled-delete",
        status: TripStatus.CANCELLED,
      });
      await Effect.runPromise(repo.create(cancelledTrip));

      const input: DeleteTripInput = {
        tripId: "trip-cancelled-delete",
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(
        await Effect.runPromise(repo.exists("trip-cancelled-delete")),
      ).toBe(false);
    });

    it("should fail when trip not found", async () => {
      const input: DeleteTripInput = {
        tripId: "non-existent-trip",
      };

      const program = deleteTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(DeleteTripNotFoundError);
        expect(either.left.tripId).toBe("non-existent-trip");
      }
    });

    it("should delete one of multiple trips", async () => {
      const trip1 = createValidTrip({ id: "trip-1", name: "Trip One" });
      const trip2 = createValidTrip({ id: "trip-2", name: "Trip Two" });
      const trip3 = createValidTrip({ id: "trip-3", name: "Trip Three" });

      await Effect.runPromise(repo.create(trip1));
      await Effect.runPromise(repo.create(trip2));
      await Effect.runPromise(repo.create(trip3));

      const input: DeleteTripInput = {
        tripId: "trip-2",
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.deletedTripId).toBe("trip-2");

      expect(await Effect.runPromise(repo.exists("trip-1"))).toBe(true);
      expect(await Effect.runPromise(repo.exists("trip-2"))).toBe(false);
      expect(await Effect.runPromise(repo.exists("trip-3"))).toBe(true);

      const allTrips = await Effect.runPromise(repo.findAll());
      expect(allTrips).toHaveLength(2);
    });

    it("should allow deleting same ID after recreating", async () => {
      const trip = createValidTrip({ id: "trip-recreate" });
      await Effect.runPromise(repo.create(trip));

      const input: DeleteTripInput = {
        tripId: "trip-recreate",
      };

      await runUseCase(input);
      expect(await Effect.runPromise(repo.exists("trip-recreate"))).toBe(false);

      const newTrip = createValidTrip({
        id: "trip-recreate",
        name: "Recreated Trip",
      });
      await Effect.runPromise(repo.create(newTrip));

      const result = await runUseCase(input);
      expect(result.success).toBe(true);
      expect(await Effect.runPromise(repo.exists("trip-recreate"))).toBe(false);
    });
  });
});
