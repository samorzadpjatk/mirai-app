import { describe, expect, it } from "@jest/globals";
import { getTripStatus, isTripOngoing, isTripPast, isTripUpcoming } from "../trip";

describe("Trip Utilities", () => {
  describe("isTripPast", () => {
    it("should return true for past date", () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      expect(isTripPast(pastDate)).toBe(true);
    });

    it("should return false for future date", () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(isTripPast(futureDate)).toBe(false);
    });

    it("should return false for current date", () => {
      const now = new Date();
      expect(isTripPast(now)).toBe(false);
    });

    it("should handle string dates", () => {
      const pastDate = "2020-01-01";
      expect(isTripPast(pastDate)).toBe(true);
    });
  });

  describe("isTripOngoing", () => {
    it("should return true for ongoing trip", () => {
      const startDate = new Date(Date.now() - 86400000); // Yesterday
      const endDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(isTripOngoing(startDate, endDate)).toBe(true);
    });

    it("should return false for past trip", () => {
      const startDate = new Date(Date.now() - 172800000); // 2 days ago
      const endDate = new Date(Date.now() - 86400000); // Yesterday
      expect(isTripOngoing(startDate, endDate)).toBe(false);
    });

    it("should return false for upcoming trip", () => {
      const startDate = new Date(Date.now() + 86400000); // Tomorrow
      const endDate = new Date(Date.now() + 172800000); // 2 days from now
      expect(isTripOngoing(startDate, endDate)).toBe(false);
    });

    it("should handle string dates", () => {
      const startDate = "2020-01-01";
      const endDate = "2030-12-31";
      expect(isTripOngoing(startDate, endDate)).toBe(true);
    });

    it("should return true when now equals start date", () => {
      const now = new Date();
      const endDate = new Date(Date.now() + 86400000);
      expect(isTripOngoing(now, endDate)).toBe(true);
    });

    it("should return true when now equals end date", () => {
      const startDate = new Date(Date.now() - 86400000);
      const now = new Date();
      expect(isTripOngoing(startDate, now)).toBe(true);
    });
  });

  describe("isTripUpcoming", () => {
    it("should return true for future date", () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(isTripUpcoming(futureDate)).toBe(true);
    });

    it("should return false for past date", () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      expect(isTripUpcoming(pastDate)).toBe(false);
    });

    it("should return false for current date", () => {
      const now = new Date();
      expect(isTripUpcoming(now)).toBe(false);
    });

    it("should handle string dates", () => {
      const futureDate = "2030-12-31";
      expect(isTripUpcoming(futureDate)).toBe(true);
    });
  });

  describe("getTripStatus", () => {
    it("should return 'Ongoing' for ongoing trip", () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() + 86400000);
      expect(getTripStatus(startDate, endDate)).toBe("Ongoing");
    });

    it("should return 'Upcoming' for upcoming trip", () => {
      const startDate = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 172800000);
      expect(getTripStatus(startDate, endDate)).toBe("Upcoming");
    });

    it("should return 'Past' for past trip", () => {
      const startDate = new Date(Date.now() - 172800000);
      const endDate = new Date(Date.now() - 86400000);
      expect(getTripStatus(startDate, endDate)).toBe("Past");
    });

    it("should handle string dates", () => {
      expect(getTripStatus("2020-01-01", "2020-12-31")).toBe("Past");
      expect(getTripStatus("2030-01-01", "2030-12-31")).toBe("Upcoming");
    });
  });
});
