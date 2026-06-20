import { calculateDistance } from "@mirai-app/common/utils";
import { describe, expect, it } from "vitest";

describe("calculateDistance", () => {
  it("should return 0 for the same point", () => {
    const result = calculateDistance(52.2297, 21.0122, 52.2297, 21.0122);
    expect(result).toBeCloseTo(0, 5);
  });

  it("should calculate distance between Warsaw and Krakow", () => {
    const warsawLat = 52.2297;
    const warsawLon = 21.0122;
    const krakowLat = 50.0647;
    const krakowLon = 19.945;
    const result = calculateDistance(warsawLat, warsawLon, krakowLat, krakowLon);
    expect(result).toBeGreaterThan(250);
    expect(result).toBeLessThan(350);
  });

  it("should be symmetric", () => {
    const d1 = calculateDistance(40.7128, -74.006, 51.5074, -0.1278);
    const d2 = calculateDistance(51.5074, -0.1278, 40.7128, -74.006);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it("should handle negative coordinates", () => {
    const result = calculateDistance(-33.8688, 151.2093, -33.8688, 151.2093);
    expect(result).toBeCloseTo(0, 5);
  });

  it("should calculate distance across the equator", () => {
    const equatorNorthLat = 1.0;
    const equatorSouthLat = -1.0;
    const result = calculateDistance(equatorNorthLat, 0.0, equatorSouthLat, 0.0);
    expect(result).toBeGreaterThan(200);
    expect(result).toBeLessThan(250);
  });
});
