import { describe, it, expect, beforeEach } from "bun:test";
import {
  createTripUseCase,
  type CreateTripInput,
  TripCreationError,
} from "./CreateTrip";
import { Trip, TripStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";
import { InMemoryTripRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createTripUseCase (Effect)", () => {
  let repo: InMemoryTripRepository;

  beforeEach(() => {
    repo = new InMemoryTripRepository();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: CreateTripInput) => {
    const program = createTripUseCase(input).pipe(
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
    it("should create trip with valid input", async () => {
      // Arrange
      const startDate = new Date("2026-06-01");
      const endDate = new Date("2026-06-07");
      const input: CreateTripInput = {
        name: "Summer Adventure",
        description: "An amazing summer trip",
        startDate,
        endDate,
        backgroundImagePath: "https://example.com/image.jpg",
        status: TripStatus.PLANNING,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("Summer Adventure");
      expect(result.description).toBe("An amazing summer trip");
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.backgroundImagePath).toBe("https://example.com/image.jpg");
      expect(result.status).toBe(TripStatus.PLANNING);
      expect(result.isPlanning).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.durationInDays).toBe(6);

      // Verify trip was actually stored
      const stored = await repo.findById(result.id);
      expect(stored).not.toBeNull();
      expect(stored?.name).toBe("Summer Adventure");
    });

    it("should use default values when optional fields not provided", async () => {
      const startDate = new Date("2026-07-01");
      const endDate = new Date("2026-07-10");
      const input: CreateTripInput = {
        name: "Default Trip",
        startDate,
        endDate,
        // description, backgroundImagePath, status not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.description).toBeNull();
      expect(result.backgroundImagePath).toBeNull();
      expect(result.status).toBe(TripStatus.PLANNING);
      expect(result.isPlanning).toBe(true);
      expect(result.durationInDays).toBe(9);

      // Verify stored trip has defaults
      const stored = await repo.findById(result.id);
      expect(stored?.description).toBeNull();
    });

    it("should create trip with ACTIVE status", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-01-05");
      const input: CreateTripInput = {
        name: "Active Trip",
        startDate,
        endDate,
        status: TripStatus.ACTIVE,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe(TripStatus.ACTIVE);
      expect(result.isActive).toBe(true);
      expect(result.isPlanning).toBe(false);
    });

    it("should fail when domain validation fails for empty name", async () => {
      const input: CreateTripInput = {
        name: "", // Invalid empty name
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-07"),
      };

      // Act
      const program = createTripUseCase(input).pipe(
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

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(TripCreationError);
        expect(either.left.message).toContain("name");
      }

      // Verify no trip was stored
      const trips = await repo.findAll();
      expect(trips).toHaveLength(0);
    });

    it("should fail when domain validation fails for invalid date range", async () => {
      const input: CreateTripInput = {
        name: "Invalid Date Trip",
        startDate: new Date("2026-08-10"), // endDate before startDate
        endDate: new Date("2026-08-01"),
      };

      // Act
      const program = createTripUseCase(input).pipe(
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

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(TripCreationError);
        expect(either.left.message).toContain("endDate");
      }
    });

    it("should trim whitespace from trip name", async () => {
      const startDate = new Date("2026-09-01");
      const endDate = new Date("2026-09-05");
      const input: CreateTripInput = {
        name: "  Trimmed Trip  ", // Has whitespace
        startDate,
        endDate,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("Trimmed Trip");

      // Verify stored trip has trimmed name
      const stored = await repo.findById(result.id);
      expect(stored?.name).toBe("Trimmed Trip");
    });
  });
});
