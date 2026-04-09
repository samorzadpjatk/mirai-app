import { describe, it, expect } from "bun:test";
import { Trip, TripStatus } from "./Trip";

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
    });

    it("should reject endDate before startDate", () => {
      const result = Trip.create({
        name: "Trip Name",
        startDate: new Date("2026-06-07"),
        endDate: new Date("2026-06-01"),
      });

      expect(result.kind).toBe("err");
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
      const started = trip.start();

      expect(started.status).toBe(TripStatus.ACTIVE);
      expect(started.isActive()).toBe(true);
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
      const completed = trip.complete();

      expect(completed.status).toBe(TripStatus.COMPLETED);
      expect(completed.isCompleted()).toBe(true);
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
