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

  const runUseCase = async (input: CreateTripInput) => {
    const program = createTripUseCase(input).pipe(
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
    it("should create trip with valid input", async () => {
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

      const result = await runUseCase(input);

      expect(result.name).toBe("Summer Adventure");
      expect(result.description).toBe("An amazing summer trip");
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.backgroundImagePath).toBe("https://example.com/image.jpg");
      expect(result.status).toBe(TripStatus.PLANNING);
      expect(result.isPlanning).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.durationInDays).toBe(6);

      const stored = await Effect.runPromise(repo.findById(result.id));
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
      };

      const result = await runUseCase(input);

      expect(result.description).toBeNull();
      expect(result.backgroundImagePath).toBeNull();
      expect(result.status).toBe(TripStatus.PLANNING);
      expect(result.isPlanning).toBe(true);
      expect(result.durationInDays).toBe(9);

      const stored = await Effect.runPromise(repo.findById(result.id));
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

      const result = await runUseCase(input);

      expect(result.status).toBe(TripStatus.ACTIVE);
      expect(result.isActive).toBe(true);
      expect(result.isPlanning).toBe(false);
    });

    it("should fail when domain validation fails for empty name", async () => {
      const input: CreateTripInput = {
        name: "",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-07"),
      };

      const program = createTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(TripCreationError);
        expect(either.left.message).toContain("name");
      }

      const trips = await Effect.runPromise(repo.findAll());
      expect(trips).toHaveLength(0);
    });

    it("should fail when domain validation fails for invalid date range", async () => {
      const input: CreateTripInput = {
        name: "Invalid Date Trip",
        startDate: new Date("2026-08-10"),
        endDate: new Date("2026-08-01"),
      };

      const program = createTripUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(TripCreationError);
        expect(either.left.message).toContain("start date");
      }
    });

    it("should trim whitespace from trip name", async () => {
      const startDate = new Date("2026-09-01");
      const endDate = new Date("2026-09-05");
      const input: CreateTripInput = {
        name: "  Trimmed Trip  ",
        startDate,
        endDate,
      };

      const result = await runUseCase(input);

      expect(result.name).toBe("Trimmed Trip");

      const stored = await Effect.runPromise(repo.findById(result.id));
      expect(stored?.name).toBe("Trimmed Trip");
    });
  });
});
