import { describe, it, expect } from "vitest";
import {
  latitudeSchema,
  longitudeSchema,
  coordinatesSchema,
  locationDataSchema,
  calculateDistance,
} from "~/utils/location-validation";

describe("location-validation", () => {
  describe("latitudeSchema", () => {
    it("should accept valid latitude values", () => {
      expect(() => latitudeSchema.parse(0)).not.toThrow();
      expect(() => latitudeSchema.parse(45.5)).not.toThrow();
      expect(() => latitudeSchema.parse(-45.5)).not.toThrow();
      expect(() => latitudeSchema.parse(90)).not.toThrow();
      expect(() => latitudeSchema.parse(-90)).not.toThrow();
    });

    it("should reject latitude above 90", () => {
      expect(() => latitudeSchema.parse(90.1)).toThrow();
      expect(() => latitudeSchema.parse(180)).toThrow();
    });

    it("should reject latitude below -90", () => {
      expect(() => latitudeSchema.parse(-90.1)).toThrow();
      expect(() => latitudeSchema.parse(-180)).toThrow();
    });
  });

  describe("longitudeSchema", () => {
    it("should accept valid longitude values", () => {
      expect(() => longitudeSchema.parse(0)).not.toThrow();
      expect(() => longitudeSchema.parse(90.5)).not.toThrow();
      expect(() => longitudeSchema.parse(-90.5)).not.toThrow();
      expect(() => longitudeSchema.parse(180)).not.toThrow();
      expect(() => longitudeSchema.parse(-180)).not.toThrow();
    });

    it("should reject longitude above 180", () => {
      expect(() => longitudeSchema.parse(180.1)).toThrow();
      expect(() => longitudeSchema.parse(360)).toThrow();
    });

    it("should reject longitude below -180", () => {
      expect(() => longitudeSchema.parse(-180.1)).toThrow();
      expect(() => longitudeSchema.parse(-360)).toThrow();
    });
  });

  describe("coordinatesSchema", () => {
    it("should accept valid coordinates", () => {
      const validCoords = {
        latitude: 52.2297,
        longitude: 21.0122,
      };
      expect(() => coordinatesSchema.parse(validCoords)).not.toThrow();
    });

    it("should reject invalid coordinates", () => {
      expect(() =>
        coordinatesSchema.parse({ latitude: 91, longitude: 21 }),
      ).toThrow();
      expect(() =>
        coordinatesSchema.parse({ latitude: 52, longitude: 181 }),
      ).toThrow();
    });
  });

  describe("locationDataSchema", () => {
    it("should accept full location data", () => {
      const locationData = {
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 10,
        altitude: 100,
        altitudeAccuracy: 5,
        heading: 90,
        speed: 5.5,
      };
      expect(() => locationDataSchema.parse(locationData)).not.toThrow();
    });

    it("should accept partial location data", () => {
      const locationData = {
        latitude: 52.2297,
        longitude: 21.0122,
      };
      expect(() => locationDataSchema.parse(locationData)).not.toThrow();
    });

    it("should accept null/undefined optional fields", () => {
      const locationData = {
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: null,
        altitude: undefined,
      };
      expect(() => locationDataSchema.parse(locationData)).not.toThrow();
    });

    it("should reject negative accuracy", () => {
      expect(() =>
        locationDataSchema.parse({
          latitude: 52.2297,
          longitude: 21.0122,
          accuracy: -10,
        }),
      ).toThrow();
    });

    it("should reject invalid heading", () => {
      expect(() =>
        locationDataSchema.parse({
          latitude: 52.2297,
          longitude: 21.0122,
          heading: 361,
        }),
      ).toThrow();
      expect(() =>
        locationDataSchema.parse({
          latitude: 52.2297,
          longitude: 21.0122,
          heading: -1,
        }),
      ).toThrow();
    });

    it("should reject negative speed", () => {
      expect(() =>
        locationDataSchema.parse({
          latitude: 52.2297,
          longitude: 21.0122,
          speed: -5,
        }),
      ).toThrow();
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two points correctly", () => {
      // Warsaw to Krakow: approximately 252 km
      const warsawLat = 52.2297;
      const warsawLon = 21.0122;
      const krakowLat = 50.0647;
      const krakowLon = 19.945;

      const distance = calculateDistance(
        warsawLat,
        warsawLon,
        krakowLat,
        krakowLon,
      );

      // Allow some margin of error (±10km)
      expect(distance).toBeGreaterThan(240);
      expect(distance).toBeLessThan(260);
    });

    it("should return 0 for same location", () => {
      const distance = calculateDistance(52.2297, 21.0122, 52.2297, 21.0122);
      expect(distance).toBe(0);
    });

    it("should calculate short distances accurately", () => {
      // Two points approximately 1km apart in Warsaw
      const lat1 = 52.2297;
      const lon1 = 21.0122;
      const lat2 = 52.2397; // ~1.1 km north
      const lon2 = 21.0122;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      // Should be around 1.1 km
      expect(distance).toBeGreaterThan(1);
      expect(distance).toBeLessThan(1.5);
    });

    it("should handle negative coordinates", () => {
      // Sydney to Buenos Aires
      const sydneyLat = -33.8688;
      const sydneyLon = 151.2093;
      const buenosLat = -34.6037;
      const buenosLon = -58.3816;

      const distance = calculateDistance(
        sydneyLat,
        sydneyLon,
        buenosLat,
        buenosLon,
      );

      // Should be a very large distance (over 10,000 km)
      expect(distance).toBeGreaterThan(10000);
    });

    it("should handle crossing the prime meridian", () => {
      // London (near prime meridian) to Paris
      const londonLat = 51.5074;
      const londonLon = -0.1278;
      const parisLat = 48.8566;
      const parisLon = 2.3522;

      const distance = calculateDistance(
        londonLat,
        londonLon,
        parisLat,
        parisLon,
      );

      // Approximately 340 km
      expect(distance).toBeGreaterThan(330);
      expect(distance).toBeLessThan(350);
    });

    it("should handle crossing the equator", () => {
      // Singapore (near equator) to Kuala Lumpur
      const singaporeLat = 1.3521;
      const singaporeLon = 103.8198;
      const klLat = 3.139;
      const klLon = 101.6869;

      const distance = calculateDistance(
        singaporeLat,
        singaporeLon,
        klLat,
        klLon,
      );

      // Approximately 315 km
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(330);
    });
  });
});
