import { describe, expect, test } from "bun:test";
import {
  latitudeSchema,
  longitudeSchema,
  coordinatesSchema,
  optionalCoordinatesSchema,
  locationDataSchema,
  calculateDistance,
} from "../location-validation";

describe("[UNIT] location-validation", () => {
  describe("latitudeSchema", () => {
    test("accepts valid latitude values", () => {
      expect(() => latitudeSchema.parse(0)).not.toThrow();
      expect(() => latitudeSchema.parse(45.5)).not.toThrow();
      expect(() => latitudeSchema.parse(-45.5)).not.toThrow();
      expect(() => latitudeSchema.parse(90)).not.toThrow();
      expect(() => latitudeSchema.parse(-90)).not.toThrow();
    });

    test("rejects latitude below -90", () => {
      expect(() => latitudeSchema.parse(-90.1)).toThrow();
      expect(() => latitudeSchema.parse(-100)).toThrow();
    });

    test("rejects latitude above 90", () => {
      expect(() => latitudeSchema.parse(90.1)).toThrow();
      expect(() => latitudeSchema.parse(180)).toThrow();
    });

    test("rejects non-number values", () => {
      expect(() => latitudeSchema.parse("45" as any)).toThrow();
      expect(() => latitudeSchema.parse(null as any)).toThrow();
      expect(() => latitudeSchema.parse(undefined as any)).toThrow();
    });
  });

  describe("longitudeSchema", () => {
    test("accepts valid longitude values", () => {
      expect(() => longitudeSchema.parse(0)).not.toThrow();
      expect(() => longitudeSchema.parse(120.5)).not.toThrow();
      expect(() => longitudeSchema.parse(-120.5)).not.toThrow();
      expect(() => longitudeSchema.parse(180)).not.toThrow();
      expect(() => longitudeSchema.parse(-180)).not.toThrow();
    });

    test("rejects longitude below -180", () => {
      expect(() => longitudeSchema.parse(-180.1)).toThrow();
      expect(() => longitudeSchema.parse(-200)).toThrow();
    });

    test("rejects longitude above 180", () => {
      expect(() => longitudeSchema.parse(180.1)).toThrow();
      expect(() => longitudeSchema.parse(200)).toThrow();
    });
  });

  describe("coordinatesSchema", () => {
    test("accepts valid coordinates", () => {
      const result = coordinatesSchema.parse({
        latitude: 52.2297,
        longitude: 21.0122,
      });
      expect(result.latitude).toBe(52.2297);
      expect(result.longitude).toBe(21.0122);
    });

    test("rejects invalid latitude in coordinates", () => {
      expect(() =>
        coordinatesSchema.parse({
          latitude: 100,
          longitude: 21.0122,
        }),
      ).toThrow();
    });

    test("rejects invalid longitude in coordinates", () => {
      expect(() =>
        coordinatesSchema.parse({
          latitude: 52.2297,
          longitude: 200,
        }),
      ).toThrow();
    });

    test("rejects missing latitude", () => {
      expect(() =>
        coordinatesSchema.parse({
          longitude: 21.0122,
        } as any),
      ).toThrow();
    });

    test("rejects missing longitude", () => {
      expect(() =>
        coordinatesSchema.parse({
          latitude: 52.2297,
        } as any),
      ).toThrow();
    });
  });

  describe("optionalCoordinatesSchema", () => {
    test("accepts null values", () => {
      const result = optionalCoordinatesSchema.parse({
        latitude: null,
        longitude: null,
      });
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });

    test("accepts valid coordinates", () => {
      const result = optionalCoordinatesSchema.parse({
        latitude: 52.2297,
        longitude: 21.0122,
      });
      expect(result.latitude).toBe(52.2297);
      expect(result.longitude).toBe(21.0122);
    });

    test("accepts partial coordinates", () => {
      const result = optionalCoordinatesSchema.parse({
        latitude: 52.2297,
        longitude: null,
      });
      expect(result.latitude).toBe(52.2297);
      expect(result.longitude).toBeNull();
    });
  });

  describe("locationDataSchema", () => {
    test("accepts full valid location data", () => {
      const result = locationDataSchema.parse({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 10,
        altitude: 100,
        altitudeAccuracy: 5,
        heading: 180,
        speed: 5,
      });
      expect(result.latitude).toBe(52.2297);
      expect(result.speed).toBe(5);
    });

    test("accepts empty object", () => {
      const result = locationDataSchema.parse({});
      expect(result.latitude).toBeUndefined();
    });

    test("rejects negative accuracy", () => {
      expect(() =>
        locationDataSchema.parse({
          accuracy: -1,
        }),
      ).toThrow();
    });

    test("rejects heading above 360", () => {
      expect(() =>
        locationDataSchema.parse({
          heading: 361,
        }),
      ).toThrow();
    });

    test("accepts heading of 0 and 360", () => {
      expect(() =>
        locationDataSchema.parse({
          heading: 0,
        }),
      ).not.toThrow();
      expect(() =>
        locationDataSchema.parse({
          heading: 360,
        }),
      ).not.toThrow();
    });
  });

  describe("calculateDistance (Haversine)", () => {
    test("calculates distance between same point as zero", () => {
      const distance = calculateDistance(0, 0, 0, 0);
      expect(distance).toBeCloseTo(0, 5);
    });

    test("calculates distance between Warsaw and Berlin", () => {
      const warsaw = { lat: 52.2297, lon: 21.0122 };
      const berlin = { lat: 52.52, lon: 13.405 };
      const distance = calculateDistance(
        warsaw.lat,
        warsaw.lon,
        berlin.lat,
        berlin.lon,
      );
      expect(distance).toBeGreaterThan(500);
      expect(distance).toBeLessThan(600);
    });

    test("calculates distance between New York and Los Angeles", () => {
      const ny = { lat: 40.7128, lon: -74.006 };
      const la = { lat: 34.0522, lon: -118.2437 };
      const distance = calculateDistance(ny.lat, ny.lon, la.lat, la.lon);
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    test("calculates distance across equator", () => {
      const point1 = { lat: 10, lon: 0 };
      const point2 = { lat: -10, lon: 0 };
      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon,
      );
      expect(distance).toBeCloseTo(2224, 0);
    });

    test("calculates distance across prime meridian", () => {
      const point1 = { lat: 0, lon: -10 };
      const point2 = { lat: 0, lon: 10 };
      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon,
      );
      expect(distance).toBeCloseTo(2224, 0);
    });

    test("is symmetric (distance A to B equals B to A)", () => {
      const distance1 = calculateDistance(52.2297, 21.0122, 48.8566, 2.3522);
      const distance2 = calculateDistance(48.8566, 2.3522, 52.2297, 21.0122);
      expect(distance1).toBeCloseTo(distance2, 10);
    });

    test("handles negative coordinates correctly", () => {
      const point1 = { lat: -33.8688, lon: 151.2093 };
      const point2 = { lat: -37.8136, lon: 144.9631 };
      const distance = calculateDistance(
        point1.lat,
        point1.lon,
        point2.lat,
        point2.lon,
      );
      expect(distance).toBeGreaterThan(0);
    });

    test("handles extreme values (near poles)", () => {
      const distance = calculateDistance(89, 0, -89, 0);
      expect(distance).toBeGreaterThan(19000);
      expect(distance).toBeLessThan(21000);
    });
  });
});
