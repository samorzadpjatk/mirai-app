import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Trip } from "./trip";
import { TripStatus } from "../enums";
import { ValidationError, StateTransitionError } from "../../system/errors";

describe("[UNIT] Trip Entity", () => {
  // ============================================================================
  // Factory Method - create()
  // ============================================================================
  describe("create()", () => {
    it("creates a valid trip with all properties", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");
      const createdAt = new Date("2024-05-01");
      const updatedAt = new Date("2024-05-01");

      const effect = Trip.create({
        id: "trip-123",
        name: "Summer Vacation",
        description: "A fun summer trip",
        startDate,
        endDate,
        backgroundImagePath: "/images/trip.jpg",
        status: TripStatus.PLANNING,
        createdAt,
        updatedAt,
      });

      const trip = await Effect.runPromise(effect);

      expect(trip.id).toBe("trip-123");
      expect(trip.name).toBe("Summer Vacation");
      expect(trip.description).toBe("A fun summer trip");
      expect(trip.startDate).toEqual(startDate);
      expect(trip.endDate).toEqual(endDate);
      expect(trip.backgroundImagePath).toBe("/images/trip.jpg");
      expect(trip.status).toBe(TripStatus.PLANNING);
      expect(trip.createdAt).toEqual(createdAt);
      expect(trip.updatedAt).toEqual(updatedAt);
    });

    it("creates a trip with minimal required properties", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");

      const effect = Trip.create({
        name: "Quick Trip",
        startDate,
        endDate,
      });

      const trip = await Effect.runPromise(effect);

      expect(trip.name).toBe("Quick Trip");
      expect(trip.description).toBeNull();
      expect(trip.backgroundImagePath).toBeNull();
      expect(trip.status).toBe(TripStatus.PLANNING);
      expect(trip.id).toBeDefined();
      expect(trip.createdAt).toBeInstanceOf(Date);
      expect(trip.updatedAt).toBeInstanceOf(Date);
    });

    it("creates a trip with null description", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");

      const effect = Trip.create({
        name: "Quick Trip",
        description: null,
        startDate,
        endDate,
      });

      const trip = await Effect.runPromise(effect);
      expect(trip.description).toBeNull();
    });

    it("generates UUID when id is not provided", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");

      const effect = Trip.create({
        name: "Trip",
        startDate,
        endDate,
      });

      const trip = await Effect.runPromise(effect);

      expect(trip.id).toBeDefined();
      expect(trip.id.length).toBeGreaterThan(0);
      expect(trip.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("fails when name is empty", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");

      const effect = Trip.create({
        name: "",
        startDate,
        endDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left._tag).toBe("ValidationError");
        expect(result.left.field).toBe("name");
        expect(result.left.message).toContain("name is required");
      }
    });

    it("fails when name exceeds max length", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");
      const longName = "a".repeat(256);

      const effect = Trip.create({
        name: longName,
        startDate,
        endDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
        expect(result.left.message).toContain("255");
      }
    });

    it("fails when endDate is before startDate", async () => {
      const startDate = new Date("2024-06-10");
      const endDate = new Date("2024-06-01");

      const effect = Trip.create({
        name: "Trip",
        startDate,
        endDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("endDate");
        expect(result.left.message).toBe("endDate must be after startDate");
      }
    });

    it("fails when description exceeds max length", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");
      const longDescription = "a".repeat(2001);

      const effect = Trip.create({
        name: "Trip",
        description: longDescription,
        startDate,
        endDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("description");
        expect(result.left.message).toContain("2000");
      }
    });

    it("fails when backgroundImagePath exceeds max length", async () => {
      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-10");
      const longPath = "/images/" + "a".repeat(1000);

      const effect = Trip.create({
        name: "Trip",
        backgroundImagePath: longPath,
        startDate,
        endDate,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("backgroundImagePath");
        expect(result.left.message).toContain("1000");
      }
    });
  });

  // ============================================================================
  // State Machine Transitions
  // ============================================================================
  describe("state transitions", () => {
    describe("transitionStatus()", () => {
      it("transitions from PLANNING to ACTIVE", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });

        const effect = trip.transitionStatus(TripStatus.ACTIVE);
        const updated = await Effect.runPromise(effect);

        expect(updated.status).toBe(TripStatus.ACTIVE);
      });

      it("transitions from PLANNING to CANCELLED", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });

        const effect = trip.transitionStatus(TripStatus.CANCELLED);
        const updated = await Effect.runPromise(effect);

        expect(updated.status).toBe(TripStatus.CANCELLED);
      });

      it("transitions from ACTIVE to COMPLETED", async () => {
        const trip = await createTestTrip({ status: TripStatus.ACTIVE });

        const effect = trip.transitionStatus(TripStatus.COMPLETED);
        const updated = await Effect.runPromise(effect);

        expect(updated.status).toBe(TripStatus.COMPLETED);
      });

      it("transitions from ACTIVE to CANCELLED", async () => {
        const trip = await createTestTrip({ status: TripStatus.ACTIVE });

        const effect = trip.transitionStatus(TripStatus.CANCELLED);
        const updated = await Effect.runPromise(effect);

        expect(updated.status).toBe(TripStatus.CANCELLED);
      });

      it("fails to transition from PLANNING to COMPLETED", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });

        const effect = trip.transitionStatus(TripStatus.COMPLETED);
        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          expect(result.left.from).toBe(TripStatus.PLANNING);
          expect(result.left.to).toBe(TripStatus.COMPLETED);
          expect(result.left.entityType).toBe("Trip");
        }
      });

      it("fails to transition from COMPLETED to any state", async () => {
        const trip = await createTestTrip({ status: TripStatus.COMPLETED });

        const effect = trip.transitionStatus(TripStatus.ACTIVE);
        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          expect(result.left.from).toBe(TripStatus.COMPLETED);
        }
      });

      it("fails to transition from CANCELLED to any state", async () => {
        const trip = await createTestTrip({ status: TripStatus.CANCELLED });

        const effect = trip.transitionStatus(TripStatus.ACTIVE);
        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          expect(result.left.from).toBe(TripStatus.CANCELLED);
        }
      });

      it("fails to transition to same status", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });

        const effect = trip.transitionStatus(TripStatus.PLANNING);
        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });
    });

    describe("convenience methods", () => {
      it("activate() transitions from PLANNING to ACTIVE", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });

        const updated = await Effect.runPromise(trip.activate());

        expect(updated.status).toBe(TripStatus.ACTIVE);
      });

      it("complete() transitions from ACTIVE to COMPLETED", async () => {
        const trip = await createTestTrip({ status: TripStatus.ACTIVE });

        const updated = await Effect.runPromise(trip.complete());

        expect(updated.status).toBe(TripStatus.COMPLETED);
      });

      it("cancel() transitions from PLANNING to CANCELLED", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });

        const updated = await Effect.runPromise(trip.cancel());

        expect(updated.status).toBe(TripStatus.CANCELLED);
      });

      it("cancel() transitions from ACTIVE to CANCELLED", async () => {
        const trip = await createTestTrip({ status: TripStatus.ACTIVE });

        const updated = await Effect.runPromise(trip.cancel());

        expect(updated.status).toBe(TripStatus.CANCELLED);
      });
    });
  });

  // ============================================================================
  // Update Method
  // ============================================================================
  describe("update()", () => {
    it("updates name", async () => {
      const trip = await createTestTrip({ name: "Old Name" });

      const effect = trip.update({ name: "New Name" });
      const updated = await Effect.runPromise(effect);

      expect(updated.name).toBe("New Name");
    });

    it("updates description", async () => {
      const trip = await createTestTrip({ description: "Old desc" });

      const effect = trip.update({ description: "New desc" });
      const updated = await Effect.runPromise(effect);

      expect(updated.description).toBe("New desc");
    });

    it("sets description to null", async () => {
      const trip = await createTestTrip({ description: "Some desc" });

      const effect = trip.update({ description: null });
      const updated = await Effect.runPromise(effect);

      expect(updated.description).toBeNull();
    });

    it("updates startDate", async () => {
      const trip = await createTestTrip({
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-10"),
      });

      const effect = trip.update({ startDate: new Date("2024-06-05") });
      const updated = await Effect.runPromise(effect);

      expect(updated.startDate).toEqual(new Date("2024-06-05"));
    });

    it("updates endDate", async () => {
      const trip = await createTestTrip({
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-10"),
      });

      const effect = trip.update({ endDate: new Date("2024-06-15") });
      const updated = await Effect.runPromise(effect);

      expect(updated.endDate).toEqual(new Date("2024-06-15"));
    });

    it("updates both dates simultaneously", async () => {
      const trip = await createTestTrip({
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-10"),
      });

      const effect = trip.update({
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-10"),
      });
      const updated = await Effect.runPromise(effect);

      expect(updated.startDate).toEqual(new Date("2024-07-01"));
      expect(updated.endDate).toEqual(new Date("2024-07-10"));
    });

    it("fails when updated endDate is before startDate", async () => {
      const trip = await createTestTrip({
        startDate: new Date("2024-06-10"),
        endDate: new Date("2024-06-20"),
      });

      const effect = trip.update({ endDate: new Date("2024-06-05") });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("endDate");
      }
    });

    it("fails when updated name is empty", async () => {
      const trip = await createTestTrip({ name: "Valid Name" });

      const effect = trip.update({ name: "" });
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("updates backgroundImagePath", async () => {
      const trip = await createTestTrip({
        backgroundImagePath: "/old/path.jpg",
      });

      const effect = trip.update({ backgroundImagePath: "/new/path.jpg" });
      const updated = await Effect.runPromise(effect);

      expect(updated.backgroundImagePath).toBe("/new/path.jpg");
    });

    it("sets backgroundImagePath to null", async () => {
      const trip = await createTestTrip({
        backgroundImagePath: "/path.jpg",
      });

      const effect = trip.update({ backgroundImagePath: null });
      const updated = await Effect.runPromise(effect);

      expect(updated.backgroundImagePath).toBeNull();
    });

    it("maintains immutability - original unchanged", async () => {
      const trip = await createTestTrip({
        name: "Original",
        description: "Original desc",
      });

      const updated = await Effect.runPromise(trip.update({ name: "Updated" }));

      expect(trip.name).toBe("Original");
      expect(updated.name).toBe("Updated");
      expect(trip.description).toBe(updated.description);
    });

    it("refreshes updatedAt timestamp", async () => {
      const originalUpdatedAt = new Date("2024-01-01");
      const trip = await createTestTrip({ updatedAt: originalUpdatedAt });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await Effect.runPromise(trip.update({ name: "Updated" }));

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("preserves id and createdAt", async () => {
      const trip = await createTestTrip({
        id: "trip-123",
        createdAt: new Date("2024-01-01"),
      });

      const updated = await Effect.runPromise(trip.update({ name: "Updated" }));

      expect(updated.id).toBe("trip-123");
      expect(updated.createdAt).toEqual(new Date("2024-01-01"));
    });
  });

  // ============================================================================
  // Status Query Methods
  // ============================================================================
  describe("status query methods", () => {
    describe("isPlanning()", () => {
      it("returns true for PLANNING status", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });
        expect(trip.isPlanning()).toBe(true);
      });

      it("returns false for other statuses", async () => {
        const active = await createTestTrip({ status: TripStatus.ACTIVE });
        const completed = await createTestTrip({
          status: TripStatus.COMPLETED,
        });
        const cancelled = await createTestTrip({
          status: TripStatus.CANCELLED,
        });

        expect(active.isPlanning()).toBe(false);
        expect(completed.isPlanning()).toBe(false);
        expect(cancelled.isPlanning()).toBe(false);
      });
    });

    describe("isActive()", () => {
      it("returns true for ACTIVE status", async () => {
        const trip = await createTestTrip({ status: TripStatus.ACTIVE });
        expect(trip.isActive()).toBe(true);
      });

      it("returns false for other statuses", async () => {
        const planning = await createTestTrip({ status: TripStatus.PLANNING });
        const completed = await createTestTrip({
          status: TripStatus.COMPLETED,
        });
        const cancelled = await createTestTrip({
          status: TripStatus.CANCELLED,
        });

        expect(planning.isActive()).toBe(false);
        expect(completed.isActive()).toBe(false);
        expect(cancelled.isActive()).toBe(false);
      });
    });

    describe("isCompleted()", () => {
      it("returns true for COMPLETED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.COMPLETED });
        expect(trip.isCompleted()).toBe(true);
      });

      it("returns false for other statuses", async () => {
        const planning = await createTestTrip({ status: TripStatus.PLANNING });
        const active = await createTestTrip({ status: TripStatus.ACTIVE });
        const cancelled = await createTestTrip({
          status: TripStatus.CANCELLED,
        });

        expect(planning.isCompleted()).toBe(false);
        expect(active.isCompleted()).toBe(false);
        expect(cancelled.isCompleted()).toBe(false);
      });
    });

    describe("isCancelled()", () => {
      it("returns true for CANCELLED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.CANCELLED });
        expect(trip.isCancelled()).toBe(true);
      });

      it("returns false for other statuses", async () => {
        const planning = await createTestTrip({ status: TripStatus.PLANNING });
        const active = await createTestTrip({ status: TripStatus.ACTIVE });
        const completed = await createTestTrip({
          status: TripStatus.COMPLETED,
        });

        expect(planning.isCancelled()).toBe(false);
        expect(active.isCancelled()).toBe(false);
        expect(completed.isCancelled()).toBe(false);
      });
    });

    describe("isTerminal()", () => {
      it("returns true for COMPLETED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.COMPLETED });
        expect(trip.isTerminal()).toBe(true);
      });

      it("returns true for CANCELLED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.CANCELLED });
        expect(trip.isTerminal()).toBe(true);
      });

      it("returns false for non-terminal statuses", async () => {
        const planning = await createTestTrip({ status: TripStatus.PLANNING });
        const active = await createTestTrip({ status: TripStatus.ACTIVE });

        expect(planning.isTerminal()).toBe(false);
        expect(active.isTerminal()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Date/Time Query Methods
  // ============================================================================
  describe("date/time query methods", () => {
    describe("isOngoing()", () => {
      it("returns true when now is between start and end dates", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-05");
        expect(trip.isOngoing(now)).toBe(true);
      });

      it("returns true when now equals startDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-01");
        expect(trip.isOngoing(now)).toBe(true);
      });

      it("returns true when now equals endDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-10");
        expect(trip.isOngoing(now)).toBe(true);
      });

      it("returns false when now is before startDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-05-15");
        expect(trip.isOngoing(now)).toBe(false);
      });

      it("returns false when now is after endDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-15");
        expect(trip.isOngoing(now)).toBe(false);
      });

      it("uses current time when no argument provided", async () => {
        const trip = await createTestTrip({
          startDate: new Date(Date.now() - 86400000), // yesterday
          endDate: new Date(Date.now() + 86400000), // tomorrow
        });

        expect(trip.isOngoing()).toBe(true);
      });
    });

    describe("hasStarted()", () => {
      it("returns true when now is after startDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-05");
        expect(trip.hasStarted(now)).toBe(true);
      });

      it("returns true when now equals startDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-01");
        expect(trip.hasStarted(now)).toBe(true);
      });

      it("returns false when now is before startDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-05-15");
        expect(trip.hasStarted(now)).toBe(false);
      });
    });

    describe("hasEnded()", () => {
      it("returns true when now is after endDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-15");
        expect(trip.hasEnded(now)).toBe(true);
      });

      it("returns false when now equals endDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-10");
        expect(trip.hasEnded(now)).toBe(false);
      });

      it("returns false when now is before endDate", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        const now = new Date("2024-06-05");
        expect(trip.hasEnded(now)).toBe(false);
      });
    });

    describe("getDurationInDays()", () => {
      it("calculates duration correctly for multi-day trips", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01"),
          endDate: new Date("2024-06-10"),
        });

        // June 1 to June 10 is exactly 9 days (216 hours)
        expect(trip.getDurationInDays()).toBe(9);
      });

      it("returns 1 for same-day trip", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01T00:00:00"),
          endDate: new Date("2024-06-01T23:59:59"),
        });

        expect(trip.getDurationInDays()).toBe(1);
      });

      it("calculates duration for partial days", async () => {
        const trip = await createTestTrip({
          startDate: new Date("2024-06-01T12:00:00"),
          endDate: new Date("2024-06-02T12:00:00"),
        });

        expect(trip.getDurationInDays()).toBe(1);
      });
    });
  });

  // ============================================================================
  // Permission/State Query Methods
  // ============================================================================
  describe("permission query methods", () => {
    describe("canBeModified()", () => {
      it("returns true for PLANNING status", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });
        expect(trip.canBeModified()).toBe(true);
      });

      it("returns true for ACTIVE status", async () => {
        const trip = await createTestTrip({ status: TripStatus.ACTIVE });
        expect(trip.canBeModified()).toBe(true);
      });

      it("returns false for COMPLETED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.COMPLETED });
        expect(trip.canBeModified()).toBe(false);
      });

      it("returns false for CANCELLED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.CANCELLED });
        expect(trip.canBeModified()).toBe(false);
      });
    });

    describe("canBeJoined()", () => {
      it("returns true for PLANNING status", async () => {
        const trip = await createTestTrip({ status: TripStatus.PLANNING });
        expect(trip.canBeJoined()).toBe(true);
      });

      it("returns true for ACTIVE status", async () => {
        const trip = await createTestTrip({ status: TripStatus.ACTIVE });
        expect(trip.canBeJoined()).toBe(true);
      });

      it("returns false for COMPLETED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.COMPLETED });
        expect(trip.canBeJoined()).toBe(false);
      });

      it("returns false for CANCELLED status", async () => {
        const trip = await createTestTrip({ status: TripStatus.CANCELLED });
        expect(trip.canBeJoined()).toBe(false);
      });
    });
  });
});

// ============================================================================
// Test Helpers
// ============================================================================
async function createTestTrip(
  overrides: {
    id?: string;
    name?: string;
    description?: string | null;
    startDate?: Date;
    endDate?: Date;
    backgroundImagePath?: string | null;
    status?: TripStatus;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
): Promise<Trip> {
  const effect = Trip.create({
    id: overrides.id ?? "trip-test-id",
    name: overrides.name ?? "Test Trip",
    description: overrides.description ?? null,
    startDate: overrides.startDate ?? new Date("2024-06-01"),
    endDate: overrides.endDate ?? new Date("2024-06-10"),
    backgroundImagePath: overrides.backgroundImagePath ?? null,
    status: overrides.status ?? TripStatus.PLANNING,
    createdAt: overrides.createdAt ?? new Date("2024-05-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-05-01"),
  });

  return await Effect.runPromise(effect);
}
