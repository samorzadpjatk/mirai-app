import { describe, it, expect, mock, beforeEach } from "bun:test";
import { TripController } from "../trip";
import type { TripRepository } from "@mirai-app/use-cases";
import { Trip, TripStatus } from "@mirai-app/domain";

// Mock Trip
const createMockTrip = (overrides?: Partial<Trip>): Trip =>
  ({
    id: "trip-123",
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
    hasEnded: () => false,
    canTransitionTo: (status: TripStatus) => true,
    updateDetails: function (props: unknown) {
      return { kind: "ok", value: { ...this, ...props } };
    },
    updateDates: function (props: unknown) {
      return { kind: "ok", value: { ...this, ...props } };
    },
    updateStatus: function (status: TripStatus) {
      return { kind: "ok", value: { ...this, status } };
    },
    ...overrides,
  }) as unknown as Trip;

describe("[UNIT] TripController", () => {
  let controller: TripController;
  let mockTripRepository: TripRepository;

  beforeEach(() => {
    mockTripRepository = {
      findById: mock(() => Promise.resolve(createMockTrip())),
      findAll: mock(() => Promise.resolve([createMockTrip()])),
      findActive: mock(() => Promise.resolve([createMockTrip()])),
      findByStatus: mock(() => Promise.resolve([createMockTrip()])),
      create: mock((trip: Trip) => Promise.resolve(trip)),
      update: mock((trip: Trip) => Promise.resolve(trip)),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
    } as unknown as TripRepository;

    controller = new TripController(mockTripRepository);
  });

  describe("getById", () => {
    it("should return trip by ID", async () => {
      const result = await controller.getById({ id: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("trip-123");
        expect(result.data.name).toBe("Test Trip");
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should return error when trip not found", async () => {
      mockTripRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "trip-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Trip not found");
      }
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
        tripId: "trip-123",
        name: "Updated Trip",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should return error when trip not found", async () => {
      mockTripRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.update({
        tripId: "trip-123",
        name: "Updated",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for completed trip", async () => {
      mockTripRepository.findById = mock(() =>
        Promise.resolve(
          createMockTrip({
            status: TripStatus.COMPLETED,
            isCompleted: () => true,
          }),
        ),
      );

      const result = await controller.update({
        tripId: "trip-123",
        name: "Updated",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("completed or cancelled");
      }
    });
  });

  describe("updateStatus", () => {
    it("should update trip status", async () => {
      const input = {
        tripId: "trip-123",
        newStatus: "COMPLETED",
      };

      const result = await controller.updateStatus(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newStatus).toBe("COMPLETED");
        expect(result.data.previousStatus).toBe("ACTIVE");
      }
    });

    it("should return error for invalid status transition", async () => {
      mockTripRepository.findById = mock(() =>
        Promise.resolve(
          createMockTrip({
            canTransitionTo: () => false,
          }),
        ),
      );

      const result = await controller.updateStatus({
        tripId: "trip-123",
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
      const result = await controller.delete({ id: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return error when trip not found", async () => {
      mockTripRepository.exists = mock(() => Promise.resolve(false));

      const result = await controller.delete({ id: "trip-123" });

      expect(result.success).toBe(false);
    });
  });
});
