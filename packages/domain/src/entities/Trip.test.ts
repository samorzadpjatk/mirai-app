import { describe, it, expect } from "bun:test";
import { Trip, TripStatus } from "./Trip";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

describe("[UNIT] Trip Entity", () => {
  describe("Trip.create", () => {
    it("should create trip with valid data", () => {
      const startDate = new Date("2026-06-01");
      const endDate = new Date("2026-06-07");

      const result = Trip.create({
        name: "Summer Trip 2026",
        startDate,
        endDate,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.name).toBe("Summer Trip 2026");
        expect(result.value.startDate).toEqual(startDate);
        expect(result.value.endDate).toEqual(endDate);
        expect(result.value.status).toBe(TripStatus.PLANNING);
        expect(result.value.isPlanning()).toBe(true);
      }
    });

    it("should reject empty name", () => {
      const result = Trip.create({
        name: "",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("name");
      }
    });

    it("should reject endDate before startDate", () => {
      const result = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-07"),
        endDate: new Date("2026-06-01"),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("endDate");
      }
    });
  });

  describe("Trip.start", () => {
    it("should start planning trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.PLANNING,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind !== "ok") return;

      const trip = tripResult.value;
      const startedResult = trip.start();

      expect(startedResult.kind).toBe("ok");
      if (startedResult.kind === "ok") {
        expect(startedResult.value.status).toBe(TripStatus.ACTIVE);
        expect(startedResult.value.isActive()).toBe(true);
      }
    });

    it("should reject starting already active trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.ACTIVE,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind !== "ok") return;

      const result = tripResult.value.start();
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Trip.complete", () => {
    it("should complete active trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.ACTIVE,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind !== "ok") return;

      const trip = tripResult.value;
      const completedResult = trip.complete();

      expect(completedResult.kind).toBe("ok");
      if (completedResult.kind === "ok") {
        expect(completedResult.value.status).toBe(TripStatus.COMPLETED);
        expect(completedResult.value.isCompleted()).toBe(true);
      }
    });

    it("should reject completing planning trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.PLANNING,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind !== "ok") return;

      const result = tripResult.value.complete();
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Trip.cancel", () => {
    it("should cancel planning trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.PLANNING,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind !== "ok") return;

      const result = tripResult.value.cancel();
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe(TripStatus.CANCELLED);
        expect(result.value.isCancelled()).toBe(true);
      }
    });

    it("should reject canceling completed trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.COMPLETED,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind !== "ok") return;

      const result = tripResult.value.cancel();
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Trip.isTerminal", () => {
    it("should return true for completed trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.COMPLETED,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind === "ok") {
        expect(tripResult.value.isTerminal()).toBe(true);
      }
    });

    it("should return false for planning trip", () => {
      const tripResult = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-07"),
        status: TripStatus.PLANNING,
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind === "ok") {
        expect(tripResult.value.isTerminal()).toBe(false);
      }
    });
  });

  describe("Trip.getDurationInDays", () => {
    it("should return correct duration", () => {
      const tripResult = Trip.create({
        name: "Week Trip",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-08"),
      });

      expect(tripResult.kind).toBe("ok");
      if (tripResult.kind === "ok") {
        expect(tripResult.value.getDurationInDays()).toBe(7);
      }
    });
  });
});
