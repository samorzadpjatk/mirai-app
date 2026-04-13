import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { TripController } from "../trip";
import type { TripRepository } from "@mirai-app/use-cases";
import { Trip, TripStatus, TripId } from "@mirai-app/domain";

// Valid UUID for testing
const TRIP_ID = TripId.unsafeCreate("550e8400-e29b-41d4-a716-446655440000");

// Mock Trip
const createMockTrip = (overrides?: Partial<Trip>): Trip =>
  ({
    id: TRIP_ID,
    name: "Test Trip",
    description: "Test description",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    backgroundImagePath: null,
    status: TripStatus.ACTIVE,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    isPlanning: () => false,
    isActive: () => true,
    isCompleted: () => false,
    isCancelled: () => false,
    hasStarted: () => true,
    hasEnded: () => false,
    isOngoing: () => true,
    durationInDays: 365,
    getDurationInDays: () => 365,
    getSummary: () => "Test Trip (1/1/2024 - 12/31/2024)",
    canTransitionTo: () => true,
    isTerminal: () => false,
    updateDetails: function (props: unknown) {
      return Effect.succeed({ ...this, ...props });
    },
    updateDates: function (props: unknown) {
      return Effect.succeed({ ...this, ...props });
    },
    updateStatus: function (status: TripStatus) {
      return Effect.succeed({ ...this, status });
    },
    ...overrides,
  }) as unknown as Trip;

describe("[UNIT] TripController", () => {
  let controller: TripController;
  let mockTripRepository: TripRepository;

  beforeEach(() => {
    mockTripRepository = {
      findById: mock(() => Effect.succeed(createMockTrip())),
      findAll: mock(() => Effect.succeed([createMockTrip()])),
      findActive: mock(() => Effect.succeed([createMockTrip()])),
      findByStatus: mock(() => Effect.succeed([createMockTrip()])),
      create: mock((trip: Trip) => Effect.succeed(trip)),
      update: mock((trip: Trip) => Effect.succeed(trip)),
      delete: mock(() => Effect.succeed(undefined)),
      exists: mock(() => Effect.succeed(true)),
    } as unknown as TripRepository;

    controller = new TripController(mockTripRepository);
  });

  describe("getById", () => {
    it("should return trip by ID", async () => {
      const result = await controller.getById({ id: TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TRIP_ID);
        expect(result.data.name).toBe("Test Trip");
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should return error when trip not found", async () => {
      mockTripRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: TRIP_ID });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create trip with valid input", async () => {
      const input = {
        name: "New Trip",
        description: "New description",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-30"),
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Trip");
      }
    });

    it("should return error when end date before start date", async () => {
      const input = {
        name: "Invalid Trip",
        startDate: new Date("2024-06-30"),
        endDate: new Date("2024-06-01"),
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("End date must be after start date");
      }
    });

    it("should return error for empty name", async () => {
      const result = await controller.create({
        name: "",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-30"),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update trip", async () => {
      const input = {
        tripId: TRIP_ID,
        name: "Updated Trip",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should return error when trip not found", async () => {
      mockTripRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.update({
        tripId: "550e8400-e29b-41d4-a716-446655440099",
        name: "Updated",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateStatus", () => {
    it("should update trip status", async () => {
      const input = {
        tripId: TRIP_ID,
        newStatus: "COMPLETED" as const,
      };

      const result = await controller.updateStatus(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("COMPLETED");
      }
    });

    it("should return error for invalid status transition", async () => {
      // Create a mock trip that returns StateTransitionError from updateStatus
      const mockTrip = createMockTrip({
        canTransitionTo: () => false,
        updateStatus: function (_status: TripStatus) {
          // Return a failed Effect simulating StateTransitionError
          return Effect.fail(
            new (class extends Error {
              readonly _tag = "StateTransitionError";
              constructor() {
                super("Cannot transition from ACTIVE to CANCELLED");
              }
            })(),
          );
        },
      });

      mockTripRepository.findById = mock(() => Effect.succeed(mockTrip));

      const result = await controller.updateStatus({
        tripId: TRIP_ID,
        newStatus: "CANCELLED",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("list", () => {
    it("should return paginated trips", async () => {
      const result = await controller.list({ limit: 10, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("listByStatus", () => {
    it("should return trips by status", async () => {
      const result = await controller.listByStatus({
        status: "ACTIVE",
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("findActive", () => {
    it("should return active trips", async () => {
      const result = await controller.findActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("delete", () => {
    it("should delete trip", async () => {
      const result = await controller.delete({ id: TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return error when trip not found", async () => {
      mockTripRepository.exists = mock(() => Effect.succeed(false));

      const result = await controller.delete({ id: TRIP_ID });

      expect(result.success).toBe(false);
    });
  });
});
