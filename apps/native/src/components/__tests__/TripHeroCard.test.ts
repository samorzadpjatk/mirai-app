import { describe, it, expect } from "@jest/globals";
import { getTripStatus } from "../trips/details/TripHeroCard";

describe("getTripStatus", () => {
  it("should return 'Ongoing Trip' when now is between start and end", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 86400000);
    const end = new Date(now.getTime() + 86400000);
    expect(getTripStatus(start, end)).toBe("Ongoing Trip");
  });

  it("should return 'Future Trip' when now is before start", () => {
    const now = new Date();
    const start = new Date(now.getTime() + 86400000);
    const end = new Date(now.getTime() + 172800000);
    expect(getTripStatus(start, end)).toBe("Future Trip");
  });

  it("should return 'Past Trip' when now is after end", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 172800000);
    const end = new Date(now.getTime() - 86400000);
    expect(getTripStatus(start, end)).toBe("Past Trip");
  });

  it("should handle string dates", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 86400000).toISOString();
    const end = new Date(now.getTime() + 86400000).toISOString();
    expect(getTripStatus(start, end)).toBe("Ongoing Trip");
  });
});
