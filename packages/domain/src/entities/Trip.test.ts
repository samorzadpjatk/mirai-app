import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { Trip, TripStatus } from "./Trip";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

describe("[UNIT] Trip Entity", () => {
  describe("Trip.create", () => {
    it("should create trip with valid data", () => {
      const startDate = new Date("2026-06-01");
      const endDate = new Date("2026-06-07");

      const effect = Trip.create({
        name: "Summer Trip 2026",
        startDate,
        endDate,
      });

      const trip = Effect.runSync(effect);
      expect(trip.id).toBeDefined();
      expect(trip.name).toBe("Summer Trip 2026");
      expect(trip.startDate).toEqual(startDate);
      expect(trip.endDate).toEqual(endDate);
      expect(trip.status).toBe(TripStatus.PLANNING);
      expect(trip.isPlanning()).toBe(true);
    });

    it("should reject empty name", () => {
      const effect = Trip.create({
        name: "",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("name");
      }
    });

    it("should reject endDate before startDate", () => {
      const effect = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-07"),
        endDate: new Date("2026-06-01"),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("dateRange");
      }
    });
  });

  describe("Trip.start", () => {
    it("should start planning trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.PLANNING,
        }),
      );

      const started = Effect.runSync(trip.start());

      expect(started.status).toBe(TripStatus.ACTIVE);
      expect(started.isActive()).toBe(true);
    });

    it("should reject starting already active trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.ACTIVE,
        }),
      );

      const effect = trip.start();
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Trip.complete", () => {
    it("should complete active trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.ACTIVE,
        }),
      );

      const completed = Effect.runSync(trip.complete());

      expect(completed.status).toBe(TripStatus.COMPLETED);
      expect(completed.isCompleted()).toBe(true);
    });

    it("should reject completing planning trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.PLANNING,
        }),
      );

      const effect = trip.complete();
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Trip.cancel", () => {
    it("should cancel planning trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.PLANNING,
        }),
      );

      const cancelled = Effect.runSync(trip.cancel());

      expect(cancelled.status).toBe(TripStatus.CANCELLED);
      expect(cancelled.isCancelled()).toBe(true);
    });

    it("should reject canceling completed trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.COMPLETED,
        }),
      );

      const effect = trip.cancel();
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Trip.isTerminal", () => {
    it("should return true for completed trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.COMPLETED,
        }),
      );

      expect(trip.isTerminal()).toBe(true);
    });

    it("should return false for planning trip", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Trip Name",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-07"),
          status: TripStatus.PLANNING,
        }),
      );

      expect(trip.isTerminal()).toBe(false);
    });
  });

  describe("Trip.getDurationInDays", () => {
    it("should return correct duration", () => {
      const trip = Effect.runSync(
        Trip.create({
          name: "Week Trip",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-08"),
        }),
      );

      expect(trip.getDurationInDays()).toBe(7);
    });
  });
});
